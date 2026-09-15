import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { criarAplicativo } from "../../../aplicativo.js";
import { prisma } from "../../../banco_de_dados/prisma.js";
import { Prisma } from "@prisma/client";

describe("Rotas de Compras e Integridade Transacional (Integração HTTP)", () => {
  let app: FastifyInstance;
  let tokenAutenticacao: string;
  let idProdutoTeste: number;
  let idFornecedorTeste: number;

  beforeAll(async () => {
    app = criarAplicativo();
    await app.ready();

    // Login com o administrador padrão
    const respostaLogin = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: "admin@uniqprint.com.br",
        senha: "admin123"
      }
    });

    tokenAutenticacao = JSON.parse(respostaLogin.body).dados.token;

    // Criar produto e fornecedor de teste para os testes de integração
    const produto = await prisma.produto.create({
      data: {
        descricao: "Papel Sulfite A4 75g Especial Teste Compras",
        quantidade_estoque: 10,
        ativo: true
      }
    });
    idProdutoTeste = produto.id;

    const fornecedor = await prisma.fornecedor.create({
      data: {
        nome: "Distribuidor Master Papéis Teste",
        observacao: "Fornecedor para testes de compras",
        ativo: true
      }
    });
    idFornecedorTeste = fornecedor.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.movimentacaoEstoque.deleteMany({
      where: { produto_id: idProdutoTeste }
    });
    await prisma.lancamentoFinanceiro.deleteMany({
      where: { tipo_referencia: "COMPRA" }
    });
    await prisma.compra.deleteMany({
      where: { produto_id: idProdutoTeste }
    });
    await prisma.produto.deleteMany({
      where: { id: idProdutoTeste }
    });
    await prisma.fornecedor.deleteMany({
      where: { id: idFornecedorTeste }
    });

    await app.close();
  });

  it("deve rejeitar acesso à listagem de compras sem autenticação", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/compras"
    });

    expect(resposta.statusCode).toBe(401);
  });

  it("deve registrar uma compra com sucesso, incrementando estoque, criando movimentação de entrada e saída financeira", async () => {
    const estoqueAntes = (
      await prisma.produto.findUniqueOrThrow({ where: { id: idProdutoTeste } })
    ).quantidade_estoque;

    const resposta = await app.inject({
      method: "POST",
      url: "/api/compras",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      },
      payload: {
        produto_id: idProdutoTeste,
        fornecedor_id: idFornecedorTeste,
        quantidade: 5,
        valor_unitario: 20.0
      }
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBeDefined();
    expect(corpo.dados.quantidade).toBe(5);
    expect(corpo.dados.valor_unitario).toBe(20);
    expect(corpo.dados.valor_total).toBe(100);
    expect(corpo.mensagem).toContain("Compra registrada com sucesso");

    const idCompraCriada = corpo.dados.id;

    // 1. Verificar estoque incrementado no banco (de 10 para 15)
    const produtoAtualizado = await prisma.produto.findUniqueOrThrow({
      where: { id: idProdutoTeste }
    });
    expect(produtoAtualizado.quantidade_estoque).toBe(estoqueAntes + 5);

    // 2. Verificar movimentação de estoque tipo ENTRADA criada
    const movimentacao = await prisma.movimentacaoEstoque.findFirst({
      where: {
        tipo_referencia: "COMPRA",
        referencia_id: idCompraCriada
      }
    });
    expect(movimentacao).not.toBeNull();
    expect(movimentacao?.tipo).toBe("ENTRADA");
    expect(movimentacao?.quantidade).toBe(5);
    expect(movimentacao?.produto_id).toBe(idProdutoTeste);

    // 3. Verificar lançamento financeiro tipo SAIDA criado
    const financeiro = await prisma.lancamentoFinanceiro.findFirst({
      where: {
        tipo_referencia: "COMPRA",
        referencia_id: idCompraCriada
      }
    });
    expect(financeiro).not.toBeNull();
    expect(financeiro?.tipo).toBe("SAIDA");
    expect(Number(financeiro?.valor)).toBe(100);
    expect(financeiro?.categoria).toBe("COMPRA");
  });

  it("deve rejeitar compra de produto inativo", async () => {
    const produtoInativo = await prisma.produto.create({
      data: {
        descricao: "Produto Temporário Inativo",
        quantidade_estoque: 0,
        ativo: false
      }
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/api/compras",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      },
      payload: {
        produto_id: produtoInativo.id,
        fornecedor_id: idFornecedorTeste,
        quantidade: 2,
        valor_unitario: 15.0
      }
    });

    expect(resposta.statusCode).toBe(400);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.erro.codigo).toBe("PRODUTO_INATIVO");

    await prisma.produto.delete({ where: { id: produtoInativo.id } });
  });

  it("deve rejeitar compra de fornecedor inativo", async () => {
    const fornecedorInativo = await prisma.fornecedor.create({
      data: {
        nome: "Fornecedor Inativo Teste",
        ativo: false
      }
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/api/compras",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      },
      payload: {
        produto_id: idProdutoTeste,
        fornecedor_id: fornecedorInativo.id,
        quantidade: 2,
        valor_unitario: 15.0
      }
    });

    expect(resposta.statusCode).toBe(400);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.erro.codigo).toBe("FORNECEDOR_INATIVO");

    await prisma.fornecedor.delete({ where: { id: fornecedorInativo.id } });
  });

  it("TESTE DE ATOMICIDADE: Deve reverter todas as alterações quando ocorrer erro na transação", async () => {
    // 1. Criar produto isolado para teste de atomicidade
    const produtoAtomico = await prisma.produto.create({
      data: {
        descricao: "Produto Teste Atomicidade",
        quantidade_estoque: 50,
        ativo: true
      }
    });

    // 2. Executamos uma transação simulando falha no passo financeiro
    let erroOcorreu = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Passo 1: Criar compra
        const compra = await tx.compra.create({
          data: {
            produto_id: produtoAtomico.id,
            fornecedor_id: idFornecedorTeste,
            quantidade: 10,
            valor_unitario: new Prisma.Decimal(30.0),
            valor_total: new Prisma.Decimal(300.0)
          }
        });

        // Passo 2: Incrementar estoque
        await tx.produto.update({
          where: { id: produtoAtomico.id },
          data: { quantidade_estoque: { increment: 10 } }
        });

        // Passo 3: Criar movimentação de estoque
        await tx.movimentacaoEstoque.create({
          data: {
            produto_id: produtoAtomico.id,
            tipo: "ENTRADA",
            quantidade: 10,
            tipo_referencia: "COMPRA",
            referencia_id: compra.id
          }
        });

        // Passo 4: FORÇAR ERRO INESPERADO ANTES DO COMMIT
        throw new Error("FALHA_SIMULADA_LANCAMENTO_FINANCEIRO");
      });
    } catch (err: any) {
      if (err.message === "FALHA_SIMULADA_LANCAMENTO_FINANCEIRO") {
        erroOcorreu = true;
      }
    }

    expect(erroOcorreu).toBe(true);

    // 3. Verificações de Rollback Absoluto:
    // a) Compra NÃO pode existir
    const comprasNoBanco = await prisma.compra.findMany({
      where: { produto_id: produtoAtomico.id }
    });
    expect(comprasNoBanco.length).toBe(0);

    // b) Estoque do produto DEVE continuar intacto (50)
    const produtoAposFalha = await prisma.produto.findUniqueOrThrow({
      where: { id: produtoAtomico.id }
    });
    expect(produtoAposFalha.quantidade_estoque).toBe(50);

    // c) Movimentação de estoque NÃO pode existir
    const movimentacoesNoBanco = await prisma.movimentacaoEstoque.findMany({
      where: { produto_id: produtoAtomico.id }
    });
    expect(movimentacoesNoBanco.length).toBe(0);

    // d) Lançamento financeiro NÃO pode existir
    const financeiroNoBanco = await prisma.lancamentoFinanceiro.findMany({
      where: { descricao: { contains: "Produto Teste Atomicidade" } }
    });
    expect(financeiroNoBanco.length).toBe(0);

    // Limpar produto de teste atômico
    await prisma.produto.delete({ where: { id: produtoAtomico.id } });
  });

  it("deve listar as compras realizadas com paginação e filtros via GET /api/compras", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: `/api/compras?pagina=1&limite=10&produto_id=${idProdutoTeste}&fornecedor_id=${idFornecedorTeste}`,
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(Array.isArray(corpo.dados)).toBe(true);
    expect(corpo.dados.length).toBeGreaterThanOrEqual(1);
    expect(corpo.paginacao).toBeDefined();
    expect(corpo.paginacao.total).toBeGreaterThanOrEqual(1);
  });

  it("deve buscar uma compra por id via GET /api/compras/:id", async () => {
    // 1. Obter uma compra existente
    const compraExistente = await prisma.compra.findFirstOrThrow({
      where: { produto_id: idProdutoTeste }
    });

    const resposta = await app.inject({
      method: "GET",
      url: `/api/compras/${compraExistente.id}`,
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBe(compraExistente.id);
    expect(corpo.dados.produto.id).toBe(idProdutoTeste);
    expect(corpo.dados.fornecedor.id).toBe(idFornecedorTeste);
  });
});
