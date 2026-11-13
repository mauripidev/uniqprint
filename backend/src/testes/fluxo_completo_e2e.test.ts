import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { criarAplicativo } from "../aplicativo.js";
import { prisma } from "../banco_de_dados/prisma.js";

describe("Validação E2E do Fluxo Comercial Completo Ponta a Ponta (Feature 11)", () => {
  let app: FastifyInstance;
  let tokenAdmin: string;
  let idUsuarioAdmin: number;

  // Variáveis do ciclo comercial
  let idProduto: number;
  let idFornecedor: number;
  let idCompra: number;
  let idCliente: number;
  let idVenda: number;

  const timestampUnico = Date.now();

  beforeAll(async () => {
    app = criarAplicativo();
    await app.ready();

    // Autenticar com o administrador padrão
    const respostaLogin = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: "admin@uniqprint.com.br",
        senha: "admin123"
      }
    });

    const dadosLogin = JSON.parse(respostaLogin.body);
    tokenAdmin = dadosLogin.dados.token;
    idUsuarioAdmin = dadosLogin.dados.usuario.id;
  });

  afterAll(async () => {
    // Limpeza na ordem inversa de dependências
    if (idVenda) {
      await prisma.lancamentoFinanceiro.deleteMany({
        where: { tipo_referencia: "VENDA", referencia_id: idVenda }
      });
      await prisma.movimentacaoEstoque.deleteMany({
        where: { tipo_referencia: "VENDA", referencia_id: idVenda }
      });
      await prisma.venda.deleteMany({ where: { id: idVenda } });
    }

    if (idCompra) {
      await prisma.lancamentoFinanceiro.deleteMany({
        where: { tipo_referencia: "COMPRA", referencia_id: idCompra }
      });
      await prisma.movimentacaoEstoque.deleteMany({
        where: { tipo_referencia: "COMPRA", referencia_id: idCompra }
      });
      await prisma.compra.deleteMany({ where: { id: idCompra } });
    }

    if (idCliente) {
      await prisma.cliente.deleteMany({ where: { id: idCliente } });
    }

    if (idFornecedor) {
      await prisma.fornecedor.deleteMany({ where: { id: idFornecedor } });
    }

    if (idProduto) {
      await prisma.registroAuditoria.deleteMany({
        where: { entidade: "PRODUTO", entidade_id: idProduto }
      });
      await prisma.produto.deleteMany({ where: { id: idProduto } });
    }

    await app.close();
  });

  it("Passo 1: Autenticar usuário administrador e registrar auditoria de login", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: "admin@uniqprint.com.br",
        senha: "admin123"
      }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.token).toBeDefined();
    expect(corpo.dados.usuario.papel).toBe("ADMINISTRADOR");

    // Verificar se o login foi auditado no banco
    const auditoriaLogin = await prisma.registroAuditoria.findFirst({
      where: {
        usuario_id: idUsuarioAdmin,
        acao: "LOGIN",
        entidade: "USUARIO"
      },
      orderBy: { id: "desc" }
    });

    expect(auditoriaLogin).not.toBeNull();
    expect(auditoriaLogin?.entidade_id).toBe(idUsuarioAdmin);
  });

  it("Passo 2: Criar novo produto com estoque zerado e validar auditoria", async () => {
    const descricaoProduto = `Papel Couche 300g E2E ${timestampUnico}`;

    const resposta = await app.inject({
      method: "POST",
      url: "/api/produtos",
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: {
        descricao: descricaoProduto,
        quantidade_estoque: 0
      }
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBeDefined();
    expect(corpo.dados.descricao).toBe(descricaoProduto);
    expect(corpo.dados.quantidade_estoque).toBe(0);

    idProduto = corpo.dados.id;

    // Verificar se a criação do produto foi auditada
    const auditoriaProduto = await prisma.registroAuditoria.findFirst({
      where: {
        acao: "CRIAR_PRODUTO",
        entidade: "PRODUTO",
        entidade_id: idProduto
      }
    });

    expect(auditoriaProduto).not.toBeNull();
    expect(auditoriaProduto?.usuario_id).toBe(idUsuarioAdmin);
  });

  it("Passo 3: Criar novo fornecedor e validar auditoria", async () => {
    const nomeFornecedor = `Distribuidora Gráfica E2E ${timestampUnico}`;

    const resposta = await app.inject({
      method: "POST",
      url: "/api/fornecedores",
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: {
        nome: nomeFornecedor,
        contato: "Carlos Vendas",
        telefone: "11988887777",
        email: `contato_${timestampUnico}@distribuidorae2e.com`,
        observacao: "Fornecedor criado para teste E2E ponta a ponta"
      }
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBeDefined();
    expect(corpo.dados.nome).toBe(nomeFornecedor);

    idFornecedor = corpo.dados.id;

    // Verificar auditoria do fornecedor
    const auditoriaFornecedor = await prisma.registroAuditoria.findFirst({
      where: {
        acao: "CRIAR_FORNECEDOR",
        entidade: "FORNECEDOR",
        entidade_id: idFornecedor
      }
    });

    expect(auditoriaFornecedor).not.toBeNull();
  });

  it("Passos 4 a 7: Registrar compra e validar estoque incrementado, movimentação de entrada, saída financeira e auditoria", async () => {
    const quantidadeCompra = 50;
    const valorUnitarioCompra = 25.5;
    const valorTotalEsperado = 1275.0; // 50 * 25.50

    // 4. Registrar compra
    const resposta = await app.inject({
      method: "POST",
      url: "/api/compras",
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: {
        produto_id: idProduto,
        fornecedor_id: idFornecedor,
        quantidade: quantidadeCompra,
        valor_unitario: valorUnitarioCompra
      }
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBeDefined();
    expect(corpo.dados.quantidade).toBe(quantidadeCompra);
    expect(corpo.dados.valor_total).toBe(valorTotalEsperado);

    idCompra = corpo.dados.id;

    // 5. Verificar estoque incrementado
    const produtoAposCompra = await prisma.produto.findUniqueOrThrow({
      where: { id: idProduto }
    });
    expect(produtoAposCompra.quantidade_estoque).toBe(quantidadeCompra);

    // 6. Verificar movimentação de estoque tipo ENTRADA
    const movimentacaoEntrada = await prisma.movimentacaoEstoque.findFirst({
      where: {
        produto_id: idProduto,
        tipo: "ENTRADA",
        tipo_referencia: "COMPRA",
        referencia_id: idCompra
      }
    });
    expect(movimentacaoEntrada).not.toBeNull();
    expect(movimentacaoEntrada?.quantidade).toBe(quantidadeCompra);

    // 7. Verificar lançamento financeiro de SAIDA
    const lancamentoSaida = await prisma.lancamentoFinanceiro.findFirst({
      where: {
        tipo: "SAIDA",
        tipo_referencia: "COMPRA",
        referencia_id: idCompra
      }
    });
    expect(lancamentoSaida).not.toBeNull();
    expect(Number(lancamentoSaida?.valor)).toBe(valorTotalEsperado);

    // Validar auditoria de compra
    const auditoriaCompra = await prisma.registroAuditoria.findFirst({
      where: {
        acao: "CRIAR_COMPRA",
        entidade: "COMPRA",
        entidade_id: idCompra
      }
    });
    expect(auditoriaCompra).not.toBeNull();
  });

  it("Passo 8: Criar novo cliente e validar auditoria", async () => {
    const nomeCliente = `Cliente Corporativo E2E ${timestampUnico}`;

    const resposta = await app.inject({
      method: "POST",
      url: "/api/clientes",
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: {
        nome: nomeCliente,
        email: `cliente_${timestampUnico}@corporativoe2e.com`,
        telefone: "11977776666",
        observacao: "Cliente cadastrado para validação do fluxo E2E"
      }
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBeDefined();
    expect(corpo.dados.nome).toBe(nomeCliente);

    idCliente = corpo.dados.id;

    // Verificar auditoria do cliente
    const auditoriaCliente = await prisma.registroAuditoria.findFirst({
      where: {
        acao: "CRIAR_CLIENTE",
        entidade: "CLIENTE",
        entidade_id: idCliente
      }
    });

    expect(auditoriaCliente).not.toBeNull();
  });

  it("Passos 9 a 12: Registrar venda e validar estoque decrementado, movimentação de saída, entrada financeira e auditoria", async () => {
    const quantidadeVenda = 20;
    const valorUnitarioVenda = 60.0;
    const valorTotalEsperado = 1200.0; // 20 * 60.00

    // 9. Registrar venda
    const resposta = await app.inject({
      method: "POST",
      url: "/api/vendas",
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: {
        cliente_id: idCliente,
        produto_id: idProduto,
        quantidade: quantidadeVenda,
        valor_unitario: valorUnitarioVenda
      }
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBeDefined();
    expect(corpo.dados.quantidade).toBe(quantidadeVenda);
    expect(corpo.dados.valor_total).toBe(valorTotalEsperado);

    idVenda = corpo.dados.id;

    // 10. Verificar estoque decrementado (50 comprado - 20 vendido = 30 restante)
    const produtoAposVenda = await prisma.produto.findUniqueOrThrow({
      where: { id: idProduto }
    });
    expect(produtoAposVenda.quantidade_estoque).toBe(30);

    // 11. Verificar movimentação de estoque tipo SAIDA
    const movimentacaoSaida = await prisma.movimentacaoEstoque.findFirst({
      where: {
        produto_id: idProduto,
        tipo: "SAIDA",
        tipo_referencia: "VENDA",
        referencia_id: idVenda
      }
    });
    expect(movimentacaoSaida).not.toBeNull();
    expect(movimentacaoSaida?.quantidade).toBe(quantidadeVenda);

    // 12. Verificar lançamento financeiro de ENTRADA
    const lancamentoEntrada = await prisma.lancamentoFinanceiro.findFirst({
      where: {
        tipo: "ENTRADA",
        tipo_referencia: "VENDA",
        referencia_id: idVenda
      }
    });
    expect(lancamentoEntrada).not.toBeNull();
    expect(Number(lancamentoEntrada?.valor)).toBe(valorTotalEsperado);

    // Validar auditoria de venda
    const auditoriaVenda = await prisma.registroAuditoria.findFirst({
      where: {
        acao: "CRIAR_VENDA",
        entidade: "VENDA",
        entidade_id: idVenda
      }
    });
    expect(auditoriaVenda).not.toBeNull();
  });

  it("Passo 13: Consultar relatórios gerenciais e validar dados das operações", async () => {
    // Relatório de Compras
    const resRelCompras = await app.inject({
      method: "GET",
      url: `/api/relatorios/compras?fornecedor_id=${idFornecedor}`,
      headers: { authorization: `Bearer ${tokenAdmin}` }
    });
    expect(resRelCompras.statusCode).toBe(200);
    const dadosCompras = JSON.parse(resRelCompras.body);
    expect(dadosCompras.resumo.total_compras).toBeGreaterThanOrEqual(1);
    expect(Number(dadosCompras.resumo.valor_total_comprado)).toBeGreaterThanOrEqual(1275);

    // Relatório de Vendas
    const resRelVendas = await app.inject({
      method: "GET",
      url: `/api/relatorios/vendas?cliente_id=${idCliente}`,
      headers: { authorization: `Bearer ${tokenAdmin}` }
    });
    expect(resRelVendas.statusCode).toBe(200);
    const dadosVendas = JSON.parse(resRelVendas.body);
    expect(dadosVendas.resumo.total_vendas).toBeGreaterThanOrEqual(1);
    expect(Number(dadosVendas.resumo.valor_total_vendido)).toBeGreaterThanOrEqual(1200);

    // Relatório Financeiro
    const resRelFin = await app.inject({
      method: "GET",
      url: "/api/relatorios/financeiro",
      headers: { authorization: `Bearer ${tokenAdmin}` }
    });
    expect(resRelFin.statusCode).toBe(200);
    const dadosFin = JSON.parse(resRelFin.body);
    expect(dadosFin.resumo.total_entradas).toBeGreaterThanOrEqual(1200);
    expect(dadosFin.resumo.total_saidas).toBeGreaterThanOrEqual(1275);

    // Relatório de Compras listagem
    expect(Array.isArray(dadosCompras.dados)).toBe(true);
    expect(dadosCompras.dados.some((c: any) => c.id === idCompra)).toBe(true);
  });

  it("Passo 14: Consultar Dashboard consolidado e conferir indicadores", async () => {
    const resDashboard = await app.inject({
      method: "GET",
      url: "/api/dashboard/resumo?periodo=todos",
      headers: { authorization: `Bearer ${tokenAdmin}` }
    });

    expect(resDashboard.statusCode).toBe(200);
    const corpoDash = JSON.parse(resDashboard.body);

    expect(corpoDash.vendas.total_vendas).toBeGreaterThanOrEqual(1);
    expect(corpoDash.vendas.valor_total).toBeGreaterThanOrEqual(1200);
    expect(corpoDash.compras.total_compras).toBeGreaterThanOrEqual(1);
    expect(corpoDash.compras.valor_total).toBeGreaterThanOrEqual(1275);
    expect(corpoDash.financeiro.entradas).toBeGreaterThanOrEqual(1200);
    expect(corpoDash.financeiro.saidas).toBeGreaterThanOrEqual(1275);
    expect(corpoDash.estoque.total_produtos).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(corpoDash.ultimas_operacoes)).toBe(true);
  });

  it("Passo 15: Consultar e validar auditoria centralizada (ordenação, paginação, filtros e dados sensíveis)", async () => {
    // 1. Listagem completa paginada
    const resAuditoria = await app.inject({
      method: "GET",
      url: "/api/auditoria?pagina=1&limite=20",
      headers: { authorization: `Bearer ${tokenAdmin}` }
    });

    expect(resAuditoria.statusCode).toBe(200);
    const corpo = JSON.parse(resAuditoria.body);
    expect(Array.isArray(corpo.dados)).toBe(true);
    expect(corpo.paginacao.total).toBeGreaterThanOrEqual(4);

    // Verificar se não existem dados proibidos (senhas, hashes, tokens) em nenhum registro
    for (const reg of corpo.dados) {
      if (reg.dados) {
        const dadosStr = typeof reg.dados === "string" ? reg.dados : JSON.stringify(reg.dados);
        expect(dadosStr.toLowerCase()).not.toContain("senha_hash");
        expect(dadosStr.toLowerCase()).not.toContain("password");
        expect(dadosStr.toLowerCase()).not.toContain("jwt");
        expect(dadosStr.toLowerCase()).not.toContain("segredo");
      }
    }

    // 2. Filtro por entidade PRODUTO
    const resFiltroEntidade = await app.inject({
      method: "GET",
      url: "/api/auditoria?entidade=PRODUTO",
      headers: { authorization: `Bearer ${tokenAdmin}` }
    });
    expect(resFiltroEntidade.statusCode).toBe(200);
    const corpoEntidade = JSON.parse(resFiltroEntidade.body);
    expect(corpoEntidade.dados.every((r: any) => r.entidade === "PRODUTO")).toBe(true);

    // 3. Filtro por ação CRIAR_VENDA
    const resFiltroAcao = await app.inject({
      method: "GET",
      url: "/api/auditoria?acao=CRIAR_VENDA",
      headers: { authorization: `Bearer ${tokenAdmin}` }
    });
    expect(resFiltroAcao.statusCode).toBe(200);
    const corpoAcao = JSON.parse(resFiltroAcao.body);
    expect(corpoAcao.dados.every((r: any) => r.acao === "CRIAR_VENDA")).toBe(true);

    // 4. Teste de busca por ID
    const primeiroRegistro = corpo.dados[0];
    const resDetalhe = await app.inject({
      method: "GET",
      url: `/api/auditoria/${primeiroRegistro.id}`,
      headers: { authorization: `Bearer ${tokenAdmin}` }
    });
    expect(resDetalhe.statusCode).toBe(200);
    expect(JSON.parse(resDetalhe.body).dados.id).toBe(primeiroRegistro.id);
  });

  it("Passo 16: Teste de casos de borda e integridade transacional", async () => {
    // 1. Tentar vender mais do que o estoque disponível (estoque atual = 30, tentar vender 100)
    const resEstoqueInsuficiente = await app.inject({
      method: "POST",
      url: "/api/vendas",
      headers: { authorization: `Bearer ${tokenAdmin}` },
      payload: {
        cliente_id: idCliente,
        produto_id: idProduto,
        quantidade: 100,
        valor_unitario: 50.0
      }
    });

    expect(resEstoqueInsuficiente.statusCode).toBe(400);
    const erroCorpo = JSON.parse(resEstoqueInsuficiente.body);
    expect(erroCorpo.erro.codigo).toBe("ESTOQUE_INSUFICIENTE");

    // Garantir que o estoque permaneceu intacto em 30
    const produtoIntacto = await prisma.produto.findUniqueOrThrow({
      where: { id: idProduto }
    });
    expect(produtoIntacto.quantidade_estoque).toBe(30);

    // 2. Tentativa de acesso não autorizado à auditoria sem token
    const resSemToken = await app.inject({
      method: "GET",
      url: "/api/auditoria"
    });
    expect(resSemToken.statusCode).toBe(401);
  });
});
