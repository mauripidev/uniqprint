import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarAplicativo } from "../../../aplicativo.js";
import { FastifyInstance } from "fastify";

describe("Rotas de Clientes (Integração HTTP)", () => {
  let app: FastifyInstance;
  let tokenAutenticacao: string;

  beforeAll(async () => {
    app = criarAplicativo();
    await app.ready();

    // Login com o usuário administrador padrão
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

  it("deve rejeitar acesso à listagem de clientes sem autenticação", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/clientes"
    });

    expect(resposta.statusCode).toBe(401);
  });

  it("deve criar um cliente com sucesso via POST /api/clientes", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: "/api/clientes",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      },
      payload: {
        nome: "João da Silva Teste",
        telefone: "(11) 99999-9999",
        observacao: "Cliente prioritário"
      }
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBeDefined();
    expect(corpo.dados.nome).toBe("João da Silva Teste");
    expect(corpo.dados.telefone).toBe("(11) 99999-9999");
    expect(corpo.dados.observacao).toBe("Cliente prioritário");
    expect(corpo.dados.ativo).toBe(true);
  });

  it("deve rejeitar criação de cliente com telefone inválido via POST /api/clientes", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: "/api/clientes",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      },
      payload: {
        nome: "Cliente Inválido",
        telefone: "12"
      }
    });

    expect(resposta.statusCode).toBe(400);
  });

  it("deve listar os clientes cadastrados com paginação via GET /api/clientes", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/clientes?pagina=1&limite=10",
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

  it("deve buscar um cliente específico via GET /api/clientes/:id", async () => {
    // 1. Cria cliente
    const resCriar = await app.inject({
      method: "POST",
      url: "/api/clientes",
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: {
        nome: "Maria Oliveira Santos",
        telefone: "(21) 98888-7777",
        observacao: "Faturamento quinzenal"
      }
    });
    const idCliente = JSON.parse(resCriar.body).dados.id;

    // 2. Busca por ID
    const resposta = await app.inject({
      method: "GET",
      url: `/api/clientes/${idCliente}`,
      headers: { authorization: `Bearer ${tokenAutenticacao}` }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBe(idCliente);
    expect(corpo.dados.nome).toBe("Maria Oliveira Santos");
    expect(corpo.dados.telefone).toBe("(21) 98888-7777");
  });

  it("deve atualizar os dados do cliente via PUT /api/clientes/:id", async () => {
    // 1. Cria cliente
    const resCriar = await app.inject({
      method: "POST",
      url: "/api/clientes",
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: {
        nome: "Carlos Eduardo",
        telefone: "(31) 97777-6666"
      }
    });
    const idCliente = JSON.parse(resCriar.body).dados.id;

    // 2. Atualiza
    const resposta = await app.inject({
      method: "PUT",
      url: `/api/clientes/${idCliente}`,
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: {
        nome: "Carlos Eduardo Costa",
        telefone: "(31) 97777-8888",
        observacao: "Alterado telefone principal"
      }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.nome).toBe("Carlos Eduardo Costa");
    expect(corpo.dados.telefone).toBe("(31) 97777-8888");
    expect(corpo.dados.observacao).toBe("Alterado telefone principal");
  });

  it("deve inativar logicamente o cliente via DELETE /api/clientes/:id", async () => {
    // 1. Cria cliente
    const resCriar = await app.inject({
      method: "POST",
      url: "/api/clientes",
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: { nome: "Cliente Para Inativação" }
    });
    const idCliente = JSON.parse(resCriar.body).dados.id;

    // 2. Inativa
    const resposta = await app.inject({
      method: "DELETE",
      url: `/api/clientes/${idCliente}`,
      headers: { authorization: `Bearer ${tokenAutenticacao}` }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.ativo).toBe(false);

    // 3. Verifica que continua existindo porém inativo
    const resVerificacao = await app.inject({
      method: "GET",
      url: `/api/clientes/${idCliente}`,
      headers: { authorization: `Bearer ${tokenAutenticacao}` }
    });
    expect(JSON.parse(resVerificacao.body).dados.ativo).toBe(false);
  });
});
