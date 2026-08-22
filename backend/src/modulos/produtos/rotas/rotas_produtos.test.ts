import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarAplicativo } from "../../../aplicativo.js";
import { FastifyInstance } from "fastify";

describe("Rotas de Produtos (Integração HTTP)", () => {
  let app: FastifyInstance;
  let tokenAutenticacao: string;

  beforeAll(async () => {
    app = criarAplicativo();
    await app.ready();

    // Faz login para obter o token para as requisições autenticadas
    const respostaLogin = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: "admin@uniqprint.com.br",
        senha: "admin123"
      }
    });

    tokenAutenticacao = JSON.parse(respostaLogin.body).dados.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve rejeitar acesso à listagem de produtos sem autenticação", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/produtos"
    });

    expect(resposta.statusCode).toBe(401);
  });

  it("deve criar um produto com sucesso via POST /api/produtos", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: "/api/produtos",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      },
      payload: {
        descricao: "Papel Fotográfico Glossy 180g",
        quantidade_estoque: 50
      }
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBeDefined();
    expect(corpo.dados.descricao).toBe("Papel Fotográfico Glossy 180g");
    expect(corpo.dados.quantidade_estoque).toBe(50);
    expect(corpo.dados.ativo).toBe(true);
  });

  it("deve listar os produtos cadastrados com paginação via GET /api/produtos", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/produtos?pagina=1&limite=10",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(Array.isArray(corpo.dados)).toBe(true);
    expect(corpo.paginacao).toBeDefined();
    expect(corpo.paginacao.pagina).toBe(1);
    expect(corpo.dados.length).toBeGreaterThanOrEqual(1);
  });

  it("deve buscar um produto específico via GET /api/produtos/:id", async () => {
    // 1. Cria produto
    const resCriar = await app.inject({
      method: "POST",
      url: "/api/produtos",
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: { descricao: "Tinta Sublimática Ciano", quantidade_estoque: 12 }
    });
    const idProduto = JSON.parse(resCriar.body).dados.id;

    // 2. Busca por ID
    const resposta = await app.inject({
      method: "GET",
      url: `/api/produtos/${idProduto}`,
      headers: { authorization: `Bearer ${tokenAutenticacao}` }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBe(idProduto);
    expect(corpo.dados.descricao).toBe("Tinta Sublimática Ciano");
  });

  it("deve atualizar os dados do produto via PUT /api/produtos/:id", async () => {
    // 1. Cria produto
    const resCriar = await app.inject({
      method: "POST",
      url: "/api/produtos",
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: { descricao: "Placa PVC 2mm", quantidade_estoque: 5 }
    });
    const idProduto = JSON.parse(resCriar.body).dados.id;

    // 2. Atualiza
    const resposta = await app.inject({
      method: "PUT",
      url: `/api/produtos/${idProduto}`,
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: { descricao: "Placa PVC Expandido 2mm Branco" }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.descricao).toBe("Placa PVC Expandido 2mm Branco");
  });

  it("deve inativar logicamente o produto via DELETE /api/produtos/:id", async () => {
    // 1. Cria produto
    const resCriar = await app.inject({
      method: "POST",
      url: "/api/produtos",
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: { descricao: "Fita Dupla Face 3M", quantidade_estoque: 20 }
    });
    const idProduto = JSON.parse(resCriar.body).dados.id;

    // 2. Inativa
    const resposta = await app.inject({
      method: "DELETE",
      url: `/api/produtos/${idProduto}`,
      headers: { authorization: `Bearer ${tokenAutenticacao}` }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.ativo).toBe(false);

    // 3. Verifica que continua existindo porém inativo
    const resVerificacao = await app.inject({
      method: "GET",
      url: `/api/produtos/${idProduto}`,
      headers: { authorization: `Bearer ${tokenAutenticacao}` }
    });
    expect(JSON.parse(resVerificacao.body).dados.ativo).toBe(false);
  });
});
