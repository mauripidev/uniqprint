import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { criarAplicativo } from "../../../aplicativo.js";
import { prisma } from "../../../banco_de_dados/prisma.js";

describe("Rotas Financeiras e Integridade (Integração HTTP)", () => {
  let app: FastifyInstance;
  let tokenAdmin: string;
  let tokenUsuario: string;

  let idProdutoTeste: number;
  let idFornecedorTeste: number;
  let idClienteTeste: number;
  let idCompraTeste: number;
  let idVendaTeste: number;

  const idsLancamentosParaLimpar: number[] = [];

  beforeAll(async () => {
    app = criarAplicativo();
    await app.ready();

    // 1. Login com Administrador
    const respostaLoginAdmin = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: "admin@uniqprint.com.br",
        senha: "admin123"
      }
    });
    tokenAdmin = JSON.parse(respostaLoginAdmin.body).dados.token;

    // 2. Login com Usuário Comum
    const respostaLoginUser = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: "usuario@uniqprint.com.br",
        senha: "user123"
      }
    });
    tokenUsuario = JSON.parse(respostaLoginUser.body).dados.token;

    // 3. Preparar produto, fornecedor e cliente para testes de compras e vendas integradas
    const produto = await prisma.produto.create({
      data: {
        descricao: "Papel Couché 150g Financeiro Teste",
        quantidade_estoque: 50,
        ativo: true
      }
    });
    idProdutoTeste = produto.id;

    const fornecedor = await prisma.fornecedor.create({
      data: {
        nome: "Distribuidora Papel Forte Financeiro",
        ativo: true
      }
    });
    idFornecedorTeste = fornecedor.id;

    const cliente = await prisma.cliente.create({
      data: {
        nome: "Gráfica Moderna Financeiro Teste",
        ativo: true
      }
    });
    idClienteTeste = cliente.id;
  });

  afterAll(async () => {
    // Limpeza de lançamentos criados
    if (idsLancamentosParaLimpar.length > 0) {
      await prisma.lancamentoFinanceiro.deleteMany({
        where: { id: { in: idsLancamentosParaLimpar } }
      });
    }

    if (idCompraTeste) {
      await prisma.lancamentoFinanceiro.deleteMany({
        where: { tipo_referencia: "COMPRA", referencia_id: idCompraTeste }
      });
      await prisma.movimentacaoEstoque.deleteMany({
        where: { tipo_referencia: "COMPRA", referencia_id: idCompraTeste }
      });
      await prisma.compra.deleteMany({ where: { id: idCompraTeste } });
    }

    if (idVendaTeste) {
      await prisma.lancamentoFinanceiro.deleteMany({
        where: { tipo_referencia: "VENDA", referencia_id: idVendaTeste }
      });
      await prisma.movimentacaoEstoque.deleteMany({
        where: { tipo_referencia: "VENDA", referencia_id: idVendaTeste }
      });
      await prisma.venda.deleteMany({ where: { id: idVendaTeste } });
    }

    await prisma.movimentacaoEstoque.deleteMany({
      where: { produto_id: idProdutoTeste }
    });
    await prisma.produto.deleteMany({ where: { id: idProdutoTeste } });
    await prisma.fornecedor.deleteMany({ where: { id: idFornecedorTeste } });
    await prisma.cliente.deleteMany({ where: { id: idClienteTeste } });

    await app.close();
  });

  describe("Autenticação e Autorização", () => {
    it("deve rejeitar acesso às rotas financeiras sem token (401)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/lancamentos-financeiros"
      });
      expect(res.statusCode).toBe(401);
    });

    it("deve permitir que usuário comum consulte lançamentos", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/lancamentos-financeiros",
        headers: { authorization: `Bearer ${tokenUsuario}` }
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe("CRUD Manual e Validações Zod (Section 51)", () => {
    let idLancamentoEntrada: number;
    let idLancamentoSaida: number;

    it("deve criar lançamento manual de entrada com sucesso (201)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/lancamentos-financeiros",
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: {
          tipo: "ENTRADA",
          descricao: "Aporte Financeiro Teste",
          valor: 1500.0,
          categoria: "RECEBIMENTOS_TESTE",
          data_lancamento: "2026-08-10T12:00:00.000Z",
          observacao: "Entrada para teste"
        }
      });

      expect(res.statusCode).toBe(201);
      const corpo = JSON.parse(res.body);
      expect(corpo.id).toBeDefined();
      expect(corpo.tipo).toBe("ENTRADA");
      expect(corpo.valor).toBe(1500.0);
      expect(corpo.tipo_referencia).toBe("MANUAL");

      idLancamentoEntrada = corpo.id;
      idsLancamentosParaLimpar.push(corpo.id);
    });

    it("deve criar lançamento manual de saída com sucesso (201)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/lancamentos-financeiros",
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: {
          tipo: "SAIDA",
          descricao: "Pagamento Aluguel Galpão Teste",
          valor: 500.0,
          categoria: "ALUGUEL_TESTE",
          data_lancamento: "2026-08-20T12:00:00.000Z",
          observacao: "Saída para teste"
        }
      });

      expect(res.statusCode).toBe(201);
      const corpo = JSON.parse(res.body);
      expect(corpo.id).toBeDefined();
      expect(corpo.tipo).toBe("SAIDA");
      expect(corpo.valor).toBe(500.0);

      idLancamentoSaida = corpo.id;
      idsLancamentosParaLimpar.push(corpo.id);
    });

    it("deve consultar lançamento por ID (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/lancamentos-financeiros/${idLancamentoEntrada}`,
        headers: { authorization: `Bearer ${tokenAdmin}` }
      });

      expect(res.statusCode).toBe(200);
      const corpo = JSON.parse(res.body);
      expect(corpo.id).toBe(idLancamentoEntrada);
      expect(corpo.descricao).toBe("Aporte Financeiro Teste");
    });

    it("deve retornar 404 ao consultar lançamento inexistente", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/lancamentos-financeiros/999999",
        headers: { authorization: `Bearer ${tokenAdmin}` }
      });

      expect(res.statusCode).toBe(404);
    });

    it("deve atualizar lançamento manual com sucesso (200)", async () => {
      const res = await app.inject({
        method: "PUT",
        url: `/api/lancamentos-financeiros/${idLancamentoEntrada}`,
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: {
          descricao: "Aporte Financeiro Teste Atualizado",
          valor: 1600.0
        }
      });

      expect(res.statusCode).toBe(200);
      const corpo = JSON.parse(res.body);
      expect(corpo.descricao).toBe("Aporte Financeiro Teste Atualizado");
      expect(corpo.valor).toBe(1600.0);
    });

    it("deve rejeitar criação com valor zero ou negativo (400)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/lancamentos-financeiros",
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: {
          tipo: "ENTRADA",
          descricao: "Valor Inválido",
          valor: -10,
          categoria: "GERAL"
        }
      });

      expect(res.statusCode).toBe(400);
    });

    it("deve rejeitar criação com tipo inválido (400)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/lancamentos-financeiros",
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: {
          tipo: "OUTRO",
          descricao: "Tipo Inválido",
          valor: 100,
          categoria: "GERAL"
        }
      });

      expect(res.statusCode).toBe(400);
    });

    it("deve rejeitar exclusão de lançamento por usuário comum (403)", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/lancamentos-financeiros/${idLancamentoSaida}`,
        headers: { authorization: `Bearer ${tokenUsuario}` }
      });

      expect(res.statusCode).toBe(403);
    });

    it("deve permitir exclusão de lançamento manual por administrador (204)", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/lancamentos-financeiros/${idLancamentoSaida}`,
        headers: { authorization: `Bearer ${tokenAdmin}` }
      });

      expect(res.statusCode).toBe(204);

      // Conferir que foi excluído
      const busca = await prisma.lancamentoFinanceiro.findUnique({
        where: { id: idLancamentoSaida }
      });
      expect(busca).toBeNull();
    });
  });

  describe("Cálculo de Saldo e Filtros (Section 52, 53, 57, 58, 59)", () => {
    let idEntrada1: number;
    let idEntrada2: number;
    let idSaida1: number;
    let idSaida2: number;

    beforeAll(async () => {
      // Criar cenário da Seção 52:
      // Entrada = 1.000, Entrada = 500, Saída = 300, Saída = 200
      const e1 = await prisma.lancamentoFinanceiro.create({
        data: {
          tipo: "ENTRADA",
          descricao: "Teste Saldo E1",
          valor: 1000.0,
          categoria: "CAT_SALDO_TESTE",
          data_lancamento: new Date("2026-08-01T10:00:00.000Z"),
          tipo_referencia: "MANUAL"
        }
      });
      const e2 = await prisma.lancamentoFinanceiro.create({
        data: {
          tipo: "ENTRADA",
          descricao: "Teste Saldo E2",
          valor: 500.0,
          categoria: "CAT_SALDO_TESTE",
          data_lancamento: new Date("2026-08-15T10:00:00.000Z"),
          tipo_referencia: "MANUAL"
        }
      });
      const s1 = await prisma.lancamentoFinanceiro.create({
        data: {
          tipo: "SAIDA",
          descricao: "Teste Saldo S1",
          valor: 300.0,
          categoria: "CAT_SALDO_TESTE",
          data_lancamento: new Date("2026-08-31T10:00:00.000Z"),
          tipo_referencia: "MANUAL"
        }
      });
      const s2 = await prisma.lancamentoFinanceiro.create({
        data: {
          tipo: "SAIDA",
          descricao: "Teste Saldo S2",
          valor: 200.0,
          categoria: "CAT_OUTRA_TESTE",
          data_lancamento: new Date("2026-09-01T10:00:00.000Z"),
          tipo_referencia: "MANUAL"
        }
      });

      idEntrada1 = e1.id;
      idEntrada2 = e2.id;
      idSaida1 = s1.id;
      idSaida2 = s2.id;
      idsLancamentosParaLimpar.push(e1.id, e2.id, s1.id, s2.id);
    });

    it("deve calcular saldo com filtro de categoria (Entradas=1500, Saídas=300, Saldo=1200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/lancamentos-financeiros/saldo?categoria=CAT_SALDO_TESTE",
        headers: { authorization: `Bearer ${tokenAdmin}` }
      });

      expect(res.statusCode).toBe(200);
      const corpo = JSON.parse(res.body);
      expect(corpo.total_entradas).toBe(1500.0);
      expect(corpo.total_saidas).toBe(300.0);
      expect(corpo.saldo).toBe(1200.0);
    });

    it("deve calcular saldo com filtro por período de agosto (Section 57)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/lancamentos-financeiros/saldo?data_inicio=2026-08-01&data_fim=2026-08-31&categoria=CAT_SALDO_TESTE",
        headers: { authorization: `Bearer ${tokenAdmin}` }
      });

      expect(res.statusCode).toBe(200);
      const corpo = JSON.parse(res.body);
      expect(corpo.total_entradas).toBe(1500.0);
      expect(corpo.total_saidas).toBe(300.0);
      expect(corpo.saldo).toBe(1200.0);
    });

    it("deve filtrar listagem por período (Section 57)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/lancamentos-financeiros?data_inicio=2026-08-01&data_fim=2026-08-31&categoria=CAT_SALDO_TESTE",
        headers: { authorization: `Bearer ${tokenAdmin}` }
      });

      expect(res.statusCode).toBe(200);
      const corpo = JSON.parse(res.body);
      expect(corpo.dados).toHaveLength(3);
    });

    it("deve filtrar listagem por tipo ENTRADA (Section 59)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/lancamentos-financeiros?tipo=ENTRADA&categoria=CAT_SALDO_TESTE",
        headers: { authorization: `Bearer ${tokenAdmin}` }
      });

      expect(res.statusCode).toBe(200);
      const corpo = JSON.parse(res.body);
      expect(corpo.dados).toHaveLength(2);
      expect(corpo.dados.every((d: any) => d.tipo === "ENTRADA")).toBe(true);
    });

    it("deve suportar saldo negativo (Section 53)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/lancamentos-financeiros/saldo?categoria=CAT_OUTRA_TESTE",
        headers: { authorization: `Bearer ${tokenAdmin}` }
      });

      expect(res.statusCode).toBe(200);
      const corpo = JSON.parse(res.body);
      expect(corpo.total_entradas).toBe(0.0);
      expect(corpo.total_saidas).toBe(200.0);
      expect(corpo.saldo).toBe(-200.0);
    });
  });

  describe("Integração com Compras e Vendas e Proteção Automática (Section 54, 55, 56, 60, 61)", () => {
    let idLancamentoCompra: number;
    let idLancamentoVenda: number;

    it("deve registrar compra e criar automaticamente lançamento financeiro SAIDA (Section 54)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/compras",
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: {
          produto_id: idProdutoTeste,
          fornecedor_id: idFornecedorTeste,
          quantidade: 10,
          valor_unitario: 100.0
        }
      });

      expect(res.statusCode).toBe(201);
      const corpo = JSON.parse(res.body);
      idCompraTeste = corpo.dados.id;

      // Verificar que o lançamento financeiro SAIDA foi criado
      const financeiro = await prisma.lancamentoFinanceiro.findFirst({
        where: { tipo_referencia: "COMPRA", referencia_id: idCompraTeste }
      });

      expect(financeiro).not.toBeNull();
      expect(financeiro!.tipo).toBe("SAIDA");
      expect(Number(financeiro!.valor)).toBe(1000.0);
      expect(financeiro!.categoria).toBe("COMPRA");
      idLancamentoCompra = financeiro!.id;
    });

    it("não deve permitir duplicidade de lançamento financeiro na compra (Section 56)", async () => {
      const lancamentos = await prisma.lancamentoFinanceiro.findMany({
        where: { tipo_referencia: "COMPRA", referencia_id: idCompraTeste }
      });
      expect(lancamentos).toHaveLength(1);
    });

    it("deve registrar venda e criar automaticamente lançamento financeiro ENTRADA (Section 55)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/vendas",
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: {
          produto_id: idProdutoTeste,
          cliente_id: idClienteTeste,
          quantidade: 15,
          valor_unitario: 100.0
        }
      });

      expect(res.statusCode).toBe(201);
      const corpo = JSON.parse(res.body);
      idVendaTeste = corpo.dados.id;

      // Verificar que o lançamento financeiro ENTRADA foi criado
      const financeiro = await prisma.lancamentoFinanceiro.findFirst({
        where: { tipo_referencia: "VENDA", referencia_id: idVendaTeste }
      });

      expect(financeiro).not.toBeNull();
      expect(financeiro!.tipo).toBe("ENTRADA");
      expect(Number(financeiro!.valor)).toBe(1500.0);
      expect(financeiro!.categoria).toBe("VENDA");
      idLancamentoVenda = financeiro!.id;
    });

    it("não deve permitir duplicidade de lançamento financeiro na venda (Section 56)", async () => {
      const lancamentos = await prisma.lancamentoFinanceiro.findMany({
        where: { tipo_referencia: "VENDA", referencia_id: idVendaTeste }
      });
      expect(lancamentos).toHaveLength(1);
    });

    it("deve identificar origem no extrato financeiro (Section 60)", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/lancamentos-financeiros/${idLancamentoCompra}`,
        headers: { authorization: `Bearer ${tokenAdmin}` }
      });

      expect(res.statusCode).toBe(200);
      const corpo = JSON.parse(res.body);
      expect(corpo.tipo_referencia).toBe("COMPRA");
      expect(corpo.referencia_id).toBe(idCompraTeste);
    });

    it("deve bloquear alteração de lançamento automático gerado por compra (Section 61)", async () => {
      const res = await app.inject({
        method: "PUT",
        url: `/api/lancamentos-financeiros/${idLancamentoCompra}`,
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: {
          descricao: "Tentativa de Fraudar Compra"
        }
      });

      expect(res.statusCode).toBe(400);
      const corpo = JSON.parse(res.body);
      expect(corpo.erro.codigo).toBe("LANCAMENTO_AUTOMATICO");
    });

    it("deve bloquear exclusão de lançamento automático gerado por venda (Section 61)", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/lancamentos-financeiros/${idLancamentoVenda}`,
        headers: { authorization: `Bearer ${tokenAdmin}` }
      });

      expect(res.statusCode).toBe(400);
      const corpo = JSON.parse(res.body);
      expect(corpo.erro.codigo).toBe("LANCAMENTO_AUTOMATICO");
    });
  });
});
