import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { criarAplicativo } from "../../../aplicativo.js";
import { prisma } from "../../../banco_de_dados/prisma.js";

describe("Rotas de Dashboard Consolidado (Integração HTTP)", () => {
  let app: FastifyInstance;
  let tokenAdmin: string;
  let tokenUsuario: string;

  let idProdutoCritico: number;
  let idProdutoNormal: number;
  let idFornecedorTeste: number;
  let idClienteTeste: number;
  let idCompraTeste: number;
  let idVendaTeste: number;
  let idLancamentoEntrada: number;
  let idLancamentoSaida: number;

  beforeAll(async () => {
    app = criarAplicativo();
    await app.ready();

    // 1. Login com admin
    const respostaLoginAdmin = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: "admin@uniqprint.com.br",
        senha: "admin123"
      }
    });
    tokenAdmin = JSON.parse(respostaLoginAdmin.body).dados.token;

    // 2. Login com usuário comum
    const respostaLoginUser = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: "usuario@uniqprint.com.br",
        senha: "user123"
      }
    });
    tokenUsuario = JSON.parse(respostaLoginUser.body).dados.token;

    // 3. Criar produtos de teste (um crítico e um normal)
    const prodCritico = await prisma.produto.create({
      data: {
        descricao: "Produto Dashboard Critico Teste",
        quantidade_estoque: 2,
        ativo: true
      }
    });
    idProdutoCritico = prodCritico.id;

    const prodNormal = await prisma.produto.create({
      data: {
        descricao: "Produto Dashboard Normal Teste",
        quantidade_estoque: 40,
        ativo: true
      }
    });
    idProdutoNormal = prodNormal.id;

    // 4. Criar fornecedor e cliente de teste
    const fornecedor = await prisma.fornecedor.create({
      data: {
        nome: "Fornecedor Dashboard Teste",
        ativo: true
      }
    });
    idFornecedorTeste = fornecedor.id;

    const cliente = await prisma.cliente.create({
      data: {
        nome: "Cliente Dashboard Teste",
        ativo: true
      }
    });
    idClienteTeste = cliente.id;

    // 5. Criar compra controlada (R$ 600,00)
    const compra = await prisma.compra.create({
      data: {
        fornecedor_id: idFornecedorTeste,
        produto_id: idProdutoNormal,
        quantidade: 6,
        valor_unitario: 100.0,
        valor_total: 600.0,
        data_compra: new Date()
      }
    });
    idCompraTeste = compra.id;

    // 6. Criar venda controlada (R$ 1000,00)
    const venda = await prisma.venda.create({
      data: {
        cliente_id: idClienteTeste,
        produto_id: idProdutoNormal,
        quantidade: 5,
        valor_unitario: 200.0,
        valor_total: 1000.0,
        data_venda: new Date()
      }
    });
    idVendaTeste = venda.id;

    // 7. Criar lançamentos financeiros correspondentes (Entrada: R$ 1000, Saída: R$ 600)
    const lancamentoEntrada = await prisma.lancamentoFinanceiro.create({
      data: {
        tipo: "ENTRADA",
        descricao: "Recebimento Venda Dashboard Teste",
        valor: 1000.0,
        categoria: "VENDAS",
        tipo_referencia: "VENDA",
        referencia_id: idVendaTeste,
        data_lancamento: new Date()
      }
    });
    idLancamentoEntrada = lancamentoEntrada.id;

    const lancamentoSaida = await prisma.lancamentoFinanceiro.create({
      data: {
        tipo: "SAIDA",
        descricao: "Pagamento Compra Dashboard Teste",
        valor: 600.0,
        categoria: "COMPRAS",
        tipo_referencia: "COMPRA",
        referencia_id: idCompraTeste,
        data_lancamento: new Date()
      }
    });
    idLancamentoSaida = lancamentoSaida.id;
  });

  afterAll(async () => {
    if (idLancamentoEntrada) {
      await prisma.lancamentoFinanceiro.deleteMany({
        where: { id: { in: [idLancamentoEntrada, idLancamentoSaida] } }
      });
    }
    if (idVendaTeste) {
      await prisma.venda.deleteMany({ where: { id: idVendaTeste } });
    }
    if (idCompraTeste) {
      await prisma.compra.deleteMany({ where: { id: idCompraTeste } });
    }
    if (idClienteTeste) {
      await prisma.cliente.deleteMany({ where: { id: idClienteTeste } });
    }
    if (idFornecedorTeste) {
      await prisma.fornecedor.deleteMany({ where: { id: idFornecedorTeste } });
    }
    if (idProdutoCritico || idProdutoNormal) {
      await prisma.produto.deleteMany({
        where: { id: { in: [idProdutoCritico, idProdutoNormal] } }
      });
    }

    await app.close();
  });

  describe("Segurança", () => {
    it("deve retornar 401 ao tentar acessar sem token de autenticação", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/api/dashboard/resumo"
      });

      expect(resposta.statusCode).toBe(401);
    });
  });

  describe("Consulta e Agregações", () => {
    it("deve retornar resumo consolidado com sucesso para usuário autenticado", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/api/dashboard/resumo",
        headers: {
          authorization: `Bearer ${tokenUsuario}`
        }
      });

      expect(resposta.statusCode).toBe(200);
      const corpo = JSON.parse(resposta.body);

      // Verificação de estrutura
      expect(corpo).toHaveProperty("vendas");
      expect(corpo).toHaveProperty("compras");
      expect(corpo).toHaveProperty("financeiro");
      expect(corpo).toHaveProperty("estoque");
      expect(corpo).toHaveProperty("ultimas_operacoes");
      expect(corpo).toHaveProperty("ultimasOperacoes");

      // Valores numéricos esperados
      expect(typeof corpo.vendas.total_vendas).toBe("number");
      expect(typeof corpo.vendas.valor_total).toBe("number");
      expect(typeof corpo.compras.total_compras).toBe("number");
      expect(typeof corpo.compras.valor_total).toBe("number");
      expect(typeof corpo.financeiro.entradas).toBe("number");
      expect(typeof corpo.financeiro.saidas).toBe("number");
      expect(typeof corpo.financeiro.saldo).toBe("number");
      expect(typeof corpo.estoque.total_produtos).toBe("number");
      expect(typeof corpo.estoque.produtos_estoque_baixo).toBe("number");
      expect(Array.isArray(corpo.estoque.produtos_criticos)).toBe(true);
      expect(Array.isArray(corpo.ultimas_operacoes)).toBe(true);
    });

    it("deve conter consistência no cálculo de saldo (entradas - saídas)", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/api/dashboard/resumo",
        headers: {
          authorization: `Bearer ${tokenAdmin}`
        }
      });

      const corpo = JSON.parse(resposta.body);
      const esperado = Number(
        (corpo.financeiro.entradas - corpo.financeiro.saidas).toFixed(2)
      );
      expect(corpo.financeiro.saldo).toBe(esperado);
    });

    it("deve incluir o produto com estoque baixo na lista de produtos críticos", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/api/dashboard/resumo",
        headers: {
          authorization: `Bearer ${tokenAdmin}`
        }
      });

      const corpo = JSON.parse(resposta.body);
      const produtoEncontrado = corpo.estoque.produtos_criticos.find(
        (p: { id: number }) => p.id === idProdutoCritico
      );

      expect(produtoEncontrado).toBeDefined();
      expect(produtoEncontrado.quantidade_estoque).toBe(2);
      expect(produtoEncontrado.status).toBe("baixo");

      // O produto normal (estoque = 40) não deve estar na lista de críticos
      const produtoNormalEncontrado = corpo.estoque.produtos_criticos.find(
        (p: { id: number }) => p.id === idProdutoNormal
      );
      expect(produtoNormalEncontrado).toBeUndefined();
    });

    it("deve retornar últimas operações contendo vendas e compras ordenadas por data", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/api/dashboard/resumo?limite_operacoes=10",
        headers: {
          authorization: `Bearer ${tokenAdmin}`
        }
      });

      const corpo = JSON.parse(resposta.body);
      expect(corpo.ultimas_operacoes.length).toBeGreaterThanOrEqual(2);

      const opVenda = corpo.ultimas_operacoes.find(
        (op: { tipo: string; id: number }) => op.tipo === "VENDA" && op.id === idVendaTeste
      );
      const opCompra = corpo.ultimas_operacoes.find(
        (op: { tipo: string; id: number }) => op.tipo === "COMPRA" && op.id === idCompraTeste
      );

      expect(opVenda).toBeDefined();
      expect(opVenda.valor).toBe(1000);
      expect(opCompra).toBeDefined();
      expect(opCompra.valor).toBe(600);
    });

    it("deve permitir filtrar por período semana e mes", async () => {
      const resSemana = await app.inject({
        method: "GET",
        url: "/api/dashboard/resumo?periodo=semana",
        headers: {
          authorization: `Bearer ${tokenAdmin}`
        }
      });
      expect(resSemana.statusCode).toBe(200);

      const resMes = await app.inject({
        method: "GET",
        url: "/api/dashboard/resumo?periodo=mes",
        headers: {
          authorization: `Bearer ${tokenAdmin}`
        }
      });
      expect(resMes.statusCode).toBe(200);
    });

    it("deve rejeitar com 400 se data inicial for posterior à data final", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/api/dashboard/resumo?data_inicio=2026-10-25&data_fim=2026-10-10",
        headers: {
          authorization: `Bearer ${tokenAdmin}`
        }
      });

      expect(resposta.statusCode).toBe(400);
    });
  });
});
