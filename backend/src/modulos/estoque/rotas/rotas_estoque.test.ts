import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { criarAplicativo } from "../../../aplicativo.js";
import { prisma } from "../../../banco_de_dados/prisma.js";

describe("Rotas de Estoque e Ajustes Manuais (Integração HTTP)", () => {
  let app: FastifyInstance;
  let tokenAdmin: string;
  let tokenUsuario: string;
  let idProdutoTeste: number;

  beforeAll(async () => {
    app = criarAplicativo();
    await app.ready();

    // Login com o administrador padrão
    const respostaLoginAdmin = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: "admin@uniqprint.com.br",
        senha: "admin123"
      }
    });
    tokenAdmin = JSON.parse(respostaLoginAdmin.body).dados.token;

    // Login com o usuário comum padrão
    const respostaLoginUsuario = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: "usuario@uniqprint.com.br",
        senha: "user123"
      }
    });
    tokenUsuario = JSON.parse(respostaLoginUsuario.body).dados.token;

    // Criar produto de teste com estoque inicial 10
    const produto = await prisma.produto.create({
      data: {
        descricao: "Papel Fotográfico Glossy Teste Estoque",
        quantidade_estoque: 10,
        ativo: true
      }
    });
    idProdutoTeste = produto.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.movimentacaoEstoque.deleteMany({
      where: { produto_id: idProdutoTeste }
    });
    await prisma.produto.deleteMany({
      where: { id: idProdutoTeste }
    });

    await app.close();
  });

  describe("Segurança e Autenticação", () => {
    it("deve rejeitar acesso à listagem de estoque sem autenticação", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/api/estoque"
      });

      expect(resposta.statusCode).toBe(401);
    });

    it("deve rejeitar acesso ao histórico de movimentações sem autenticação", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/api/estoque/movimentacoes"
      });

      expect(resposta.statusCode).toBe(401);
    });

    it("deve rejeitar solicitação de ajuste sem papel de ADMINISTRADOR", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/api/estoque/ajustes",
        headers: {
          authorization: `Bearer ${tokenUsuario}`
        },
        payload: {
          produto_id: idProdutoTeste,
          tipo_ajuste: "ENTRADA",
          quantidade: 5,
          observacao: "Tentativa por usuário não-admin"
        }
      });

      expect(resposta.statusCode).toBe(403);
    });
  });

  describe("Listagens", () => {
    it("deve listar o estoque consolidado com resumo de alertas", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/api/estoque?pagina=1&limite=10",
        headers: {
          authorization: `Bearer ${tokenAdmin}`
        }
      });

      expect(resposta.statusCode).toBe(200);
      const corpo = JSON.parse(resposta.body);
      expect(corpo.dados).toBeDefined();
      expect(Array.isArray(corpo.dados)).toBe(true);
      expect(corpo.resumo).toBeDefined();
      expect(corpo.resumo.total_produtos).toBeGreaterThanOrEqual(1);
      expect(corpo.paginacao).toBeDefined();
    });

    it("deve filtrar estoque por termo de busca", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/api/estoque?busca=Fotogr%C3%A1fico",
        headers: {
          authorization: `Bearer ${tokenAdmin}`
        }
      });

      expect(resposta.statusCode).toBe(200);
      const corpo = JSON.parse(resposta.body);
      expect(corpo.dados.some((p: any) => p.id === idProdutoTeste)).toBe(true);
    });

    it("deve listar movimentações de estoque", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: `/api/estoque/movimentacoes?produto_id=${idProdutoTeste}`,
        headers: {
          authorization: `Bearer ${tokenAdmin}`
        }
      });

      expect(resposta.statusCode).toBe(200);
      const corpo = JSON.parse(resposta.body);
      expect(corpo.dados).toBeDefined();
      expect(corpo.paginacao).toBeDefined();
    });
  });

  describe("Ajustes Manuais de Estoque (Transações)", () => {
    it("deve registrar ajuste positivo (ENTRADA) e incrementar o saldo físico", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/api/estoque/ajustes",
        headers: {
          authorization: `Bearer ${tokenAdmin}`
        },
        payload: {
          produto_id: idProdutoTeste,
          tipo_ajuste: "ENTRADA",
          quantidade: 5,
          observacao: "Entrada por acerto de estoque"
        }
      });

      expect(resposta.statusCode).toBe(201);
      const corpo = JSON.parse(resposta.body);
      expect(corpo.dados.tipo).toBe("AJUSTE");
      expect(corpo.dados.tipo_referencia).toBe("AJUSTE_ENTRADA");
      expect(corpo.dados.estoque_anterior).toBe(10);
      expect(corpo.dados.estoque_novo).toBe(15);

      // Verificar persistência no banco
      const produtoNoBanco = await prisma.produto.findUniqueOrThrow({
        where: { id: idProdutoTeste }
      });
      expect(produtoNoBanco.quantidade_estoque).toBe(15);
    });

    it("deve registrar ajuste negativo (SAIDA) e decrementar o saldo físico", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/api/estoque/ajustes",
        headers: {
          authorization: `Bearer ${tokenAdmin}`
        },
        payload: {
          produto_id: idProdutoTeste,
          tipo_ajuste: "SAIDA",
          quantidade: 4,
          observacao: "Baixa por avaria no manuseio"
        }
      });

      expect(resposta.statusCode).toBe(201);
      const corpo = JSON.parse(resposta.body);
      expect(corpo.dados.tipo_referencia).toBe("AJUSTE_SAIDA");
      expect(corpo.dados.estoque_anterior).toBe(15);
      expect(corpo.dados.estoque_novo).toBe(11);

      // Verificar persistência no banco
      const produtoNoBanco = await prisma.produto.findUniqueOrThrow({
        where: { id: idProdutoTeste }
      });
      expect(produtoNoBanco.quantidade_estoque).toBe(11);
    });

    it("deve rejeitar ajuste negativo que exceda a quantidade disponível", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/api/estoque/ajustes",
        headers: {
          authorization: `Bearer ${tokenAdmin}`
        },
        payload: {
          produto_id: idProdutoTeste,
          tipo_ajuste: "SAIDA",
          quantidade: 50,
          observacao: "Tentativa de saída excessiva"
        }
      });

      expect(resposta.statusCode).toBe(400);
      const corpo = JSON.parse(resposta.body);
      expect(corpo.erro.codigo).toBe("ESTOQUE_INSUFICIENTE");
    });

    it("deve rejeitar payload inválido (justificativa muito curta)", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/api/estoque/ajustes",
        headers: {
          authorization: `Bearer ${tokenAdmin}`
        },
        payload: {
          produto_id: idProdutoTeste,
          tipo_ajuste: "ENTRADA",
          quantidade: 5,
          observacao: "a"
        }
      });

      expect(resposta.statusCode).toBe(400);
    });
  });
});
