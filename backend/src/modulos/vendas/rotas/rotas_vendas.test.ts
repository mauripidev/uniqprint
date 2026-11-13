import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { criarAplicativo } from "../../../aplicativo.js";
import { prisma } from "../../../banco_de_dados/prisma.js";
import { Prisma } from "@prisma/client";

describe("Rotas de Vendas e Integridade Transacional (Integração HTTP)", () => {
  let app: FastifyInstance;
  let tokenAutenticacao: string;
  let idProdutoTeste: number;
  let idClienteTeste: number;

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

    // Criar produto e cliente de teste para os testes de integração
    const produto = await prisma.produto.create({
      data: {
        descricao: "Papel Sulfite A4 75g Especial Teste Vendas",
        quantidade_estoque: 20,
        ativo: true
      }
    });
    idProdutoTeste = produto.id;

    const cliente = await prisma.cliente.create({
      data: {
        nome: "Cliente Master Teste Vendas",
        telefone: "11977776666",
        observacao: "Cliente para testes de vendas",
        ativo: true
      }
    });
    idClienteTeste = cliente.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.movimentacaoEstoque.deleteMany({
      where: { produto_id: idProdutoTeste }
    });
    await prisma.lancamentoFinanceiro.deleteMany({
      where: { tipo_referencia: "VENDA" }
    });
    await prisma.venda.deleteMany({
      where: { produto_id: idProdutoTeste }
    });
    await prisma.produto.deleteMany({
      where: { id: idProdutoTeste }
    });
    await prisma.cliente.deleteMany({
      where: { id: idClienteTeste }
    });

    await app.close();
  });

  it("deve rejeitar acesso às rotas de vendas sem autenticação (401)", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/vendas"
    });

    expect(resposta.statusCode).toBe(401);
  });

  it("deve registrar uma venda com sucesso, decrementando estoque, criando movimentação de saída e entrada financeira", async () => {
    const estoqueAntes = (
      await prisma.produto.findUniqueOrThrow({ where: { id: idProdutoTeste } })
    ).quantidade_estoque;

    const resposta = await app.inject({
      method: "POST",
      url: "/api/vendas",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      },
      payload: {
        produto_id: idProdutoTeste,
        cliente_id: idClienteTeste,
        quantidade: 5,
        valor_unitario: 50.0
      }
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBeDefined();
    expect(corpo.dados.quantidade).toBe(5);
    expect(corpo.dados.valor_unitario).toBe(50);
    expect(corpo.dados.valor_total).toBe(250);
    expect(corpo.mensagem).toContain("Venda registrada com sucesso");

    const idVendaCriada = corpo.dados.id;

    // 1. Verificar estoque decrementado no banco (de 20 para 15)
    const produtoAtualizado = await prisma.produto.findUniqueOrThrow({
      where: { id: idProdutoTeste }
    });
    expect(produtoAtualizado.quantidade_estoque).toBe(estoqueAntes - 5);

    // 2. Verificar movimentação de estoque tipo SAIDA criada
    const movimentacao = await prisma.movimentacaoEstoque.findFirst({
      where: {
        tipo_referencia: "VENDA",
        referencia_id: idVendaCriada
      }
    });
    expect(movimentacao).not.toBeNull();
    expect(movimentacao?.tipo).toBe("SAIDA");
    expect(movimentacao?.quantidade).toBe(5);
    expect(movimentacao?.produto_id).toBe(idProdutoTeste);

    // 3. Verificar lançamento financeiro tipo ENTRADA criado
    const financeiro = await prisma.lancamentoFinanceiro.findFirst({
      where: {
        tipo_referencia: "VENDA",
        referencia_id: idVendaCriada
      }
    });
    expect(financeiro).not.toBeNull();
    expect(financeiro?.tipo).toBe("ENTRADA");
    expect(Number(financeiro?.valor)).toBe(250);
    expect(financeiro?.categoria).toBe("VENDA");
  });

  it("deve rejeitar venda quando estoque for insuficiente (ESTOQUE_INSUFICIENTE)", async () => {
    // Produto com estoque = 5
    const produtoEstoqueCinco = await prisma.produto.create({
      data: {
        descricao: "Produto Estoque 5 Teste",
        quantidade_estoque: 5,
        ativo: true
      }
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/api/vendas",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      },
      payload: {
        produto_id: produtoEstoqueCinco.id,
        cliente_id: idClienteTeste,
        quantidade: 6, // Solicita mais que o disponível
        valor_unitario: 30.0
      }
    });

    expect(resposta.statusCode).toBe(400);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.erro.codigo).toBe("ESTOQUE_INSUFICIENTE");
    expect(corpo.erro.mensagem).toContain("Estoque insuficiente");

    // Verificar que estoque permaneceu intacto (5)
    const produtoChecagem = await prisma.produto.findUniqueOrThrow({
      where: { id: produtoEstoqueCinco.id }
    });
    expect(produtoChecagem.quantidade_estoque).toBe(5);

    // Nenhuma venda ou movimentação criada
    const vendasExistentes = await prisma.venda.findMany({
      where: { produto_id: produtoEstoqueCinco.id }
    });
    expect(vendasExistentes.length).toBe(0);

    await prisma.produto.delete({ where: { id: produtoEstoqueCinco.id } });
  });

  it("deve rejeitar venda quando estoque for zero", async () => {
    const produtoEstoqueZero = await prisma.produto.create({
      data: {
        descricao: "Produto Estoque Zero Teste",
        quantidade_estoque: 0,
        ativo: true
      }
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/api/vendas",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      },
      payload: {
        produto_id: produtoEstoqueZero.id,
        cliente_id: idClienteTeste,
        quantidade: 1,
        valor_unitario: 30.0
      }
    });

    expect(resposta.statusCode).toBe(400);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.erro.codigo).toBe("ESTOQUE_INSUFICIENTE");

    await prisma.produto.delete({ where: { id: produtoEstoqueZero.id } });
  });

  it("deve permitir venda da quantidade exata do estoque e zerar o saldo", async () => {
    const produtoEstoqueDez = await prisma.produto.create({
      data: {
        descricao: "Produto Estoque Dez Teste",
        quantidade_estoque: 10,
        ativo: true
      }
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/api/vendas",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      },
      payload: {
        produto_id: produtoEstoqueDez.id,
        cliente_id: idClienteTeste,
        quantidade: 10, // Venda total
        valor_unitario: 25.0
      }
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBeDefined();

    const produtoAtualizado = await prisma.produto.findUniqueOrThrow({
      where: { id: produtoEstoqueDez.id }
    });
    expect(produtoAtualizado.quantidade_estoque).toBe(0);

    // Limpeza
    await prisma.movimentacaoEstoque.deleteMany({ where: { produto_id: produtoEstoqueDez.id } });
    await prisma.lancamentoFinanceiro.deleteMany({ where: { referencia_id: corpo.dados.id, tipo_referencia: "VENDA" } });
    await prisma.venda.deleteMany({ where: { produto_id: produtoEstoqueDez.id } });
    await prisma.produto.delete({ where: { id: produtoEstoqueDez.id } });
  });

  it("deve rejeitar venda de produto inativo", async () => {
    const produtoInativo = await prisma.produto.create({
      data: {
        descricao: "Produto Inativo Vendas Teste",
        quantidade_estoque: 10,
        ativo: false
      }
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/api/vendas",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      },
      payload: {
        produto_id: produtoInativo.id,
        cliente_id: idClienteTeste,
        quantidade: 2,
        valor_unitario: 15.0
      }
    });

    expect(resposta.statusCode).toBe(400);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.erro.codigo).toBe("PRODUTO_INATIVO");

    await prisma.produto.delete({ where: { id: produtoInativo.id } });
  });

  it("deve rejeitar venda de cliente inativo", async () => {
    const clienteInativo = await prisma.cliente.create({
      data: {
        nome: "Cliente Inativo Vendas Teste",
        ativo: false
      }
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/api/vendas",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      },
      payload: {
        produto_id: idProdutoTeste,
        cliente_id: clienteInativo.id,
        quantidade: 2,
        valor_unitario: 15.0
      }
    });

    expect(resposta.statusCode).toBe(400);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.erro.codigo).toBe("CLIENTE_INATIVO");

    await prisma.cliente.delete({ where: { id: clienteInativo.id } });
  });

  it("TESTE DE CONCORRÊNCIA: Duas vendas simultâneas não podem gerar estoque negativo", async () => {
    // Estoque inicial = 5
    const produtoConcorrente = await prisma.produto.create({
      data: {
        descricao: "Produto Teste Concorrência",
        quantidade_estoque: 5,
        ativo: true
      }
    });

    // Venda A solicita 4, Venda B solicita 4 simultaneamente
    const requisicaoA = app.inject({
      method: "POST",
      url: "/api/vendas",
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: {
        produto_id: produtoConcorrente.id,
        cliente_id: idClienteTeste,
        quantidade: 4,
        valor_unitario: 20.0
      }
    });

    const requisicaoB = app.inject({
      method: "POST",
      url: "/api/vendas",
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: {
        produto_id: produtoConcorrente.id,
        cliente_id: idClienteTeste,
        quantidade: 4,
        valor_unitario: 20.0
      }
    });

    const [resA, resB] = await Promise.all([requisicaoA, requisicaoB]);

    const statusList = [resA.statusCode, resB.statusCode];
    // Exatamente uma deve ter sucesso (201) e a outra deve ser rejeitada por estoque insuficiente (400)
    expect(statusList).toContain(201);
    expect(statusList).toContain(400);

    const resSucesso = resA.statusCode === 201 ? resA : resB;
    const resFalha = resA.statusCode === 400 ? resA : resB;

    const corpoFalha = JSON.parse(resFalha.body);
    expect(corpoFalha.erro.codigo).toBe("ESTOQUE_INSUFICIENTE");

    // Verificar estoque final no banco: deve ser exatamente 1 (5 - 4). JAMAIS negativo!
    const produtoFinal = await prisma.produto.findUniqueOrThrow({
      where: { id: produtoConcorrente.id }
    });
    expect(produtoFinal.quantidade_estoque).toBe(1);

    // Limpeza
    const idSucesso = JSON.parse(resSucesso.body).dados.id;
    await prisma.movimentacaoEstoque.deleteMany({ where: { produto_id: produtoConcorrente.id } });
    await prisma.lancamentoFinanceiro.deleteMany({ where: { referencia_id: idSucesso, tipo_referencia: "VENDA" } });
    await prisma.venda.deleteMany({ where: { produto_id: produtoConcorrente.id } });
    await prisma.produto.delete({ where: { id: produtoConcorrente.id } });
  });

  it("TESTE DE ATOMICIDADE E ROLLBACK: Deve reverter todas as alterações quando ocorrer erro na transação", async () => {
    const produtoAtomico = await prisma.produto.create({
      data: {
        descricao: "Produto Teste Atomicidade Vendas",
        quantidade_estoque: 40,
        ativo: true
      }
    });

    let erroOcorreu = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Passo 1: Baixar estoque
        await tx.produto.update({
          where: { id: produtoAtomico.id },
          data: { quantidade_estoque: { decrement: 10 } }
        });

        // Passo 2: Criar venda
        const venda = await tx.venda.create({
          data: {
            produto_id: produtoAtomico.id,
            cliente_id: idClienteTeste,
            quantidade: 10,
            valor_unitario: new Prisma.Decimal(50.0),
            valor_total: new Prisma.Decimal(500.0)
          }
        });

        // Passo 3: Criar movimentação de saída
        await tx.movimentacaoEstoque.create({
          data: {
            produto_id: produtoAtomico.id,
            tipo: "SAIDA",
            quantidade: 10,
            tipo_referencia: "VENDA",
            referencia_id: venda.id
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

    // Verificações de Rollback Absoluto:
    // a) Venda NÃO pode existir
    const vendasNoBanco = await prisma.venda.findMany({
      where: { produto_id: produtoAtomico.id }
    });
    expect(vendasNoBanco.length).toBe(0);

    // b) Estoque do produto DEVE continuar intacto (40)
    const produtoAposFalha = await prisma.produto.findUniqueOrThrow({
      where: { id: produtoAtomico.id }
    });
    expect(produtoAposFalha.quantidade_estoque).toBe(40);

    // c) Movimentação de estoque NÃO pode existir
    const movimentacoesNoBanco = await prisma.movimentacaoEstoque.findMany({
      where: { produto_id: produtoAtomico.id }
    });
    expect(movimentacoesNoBanco.length).toBe(0);

    // Limpar produto de teste atômico
    await prisma.produto.delete({ where: { id: produtoAtomico.id } });
  });

  it("deve listar as vendas realizadas com paginação e filtros via GET /api/vendas", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: `/api/vendas?pagina=1&limite=10&produto_id=${idProdutoTeste}&cliente_id=${idClienteTeste}`,
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

  it("deve buscar uma venda por id via GET /api/vendas/:id", async () => {
    const vendaExistente = await prisma.venda.findFirstOrThrow({
      where: { produto_id: idProdutoTeste }
    });

    const resposta = await app.inject({
      method: "GET",
      url: `/api/vendas/${vendaExistente.id}`,
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBe(vendaExistente.id);
    expect(corpo.dados.produto.id).toBe(idProdutoTeste);
    expect(corpo.dados.cliente.id).toBe(idClienteTeste);
  });
});
