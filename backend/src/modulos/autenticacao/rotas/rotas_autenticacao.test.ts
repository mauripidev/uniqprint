import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarAplicativo } from "../../../aplicativo.js";
import { FastifyInstance } from "fastify";

describe("Rotas de Autenticação (Integração HTTP)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = criarAplicativo();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/status - deve retornar status operacional da API", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/status"
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.status).toBe("operacional");
  });

  it("POST /api/autenticacao/login - deve rejeitar formato de e-mail inválido com erro Zod", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: "email-invalido",
        senha: "123"
      }
    });

    expect(resposta.statusCode).toBe(400);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.erro.codigo).toBe("DADOS_INVALIDOS");
    expect(corpo.erro.campos.email).toBeDefined();
  });

  it("POST /api/autenticacao/login - deve autenticar usuário existente com sucesso e definir cookie", async () => {
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
    expect(corpo.dados.usuario.email).toBe("admin@uniqprint.com.br");
    expect(corpo.dados.usuario.nome).toBe("Administrador Uniqprint");
    expect(corpo.dados.usuario.papel).toBe("ADMINISTRADOR");
    expect(corpo.dados.token).toBeDefined();

    // Verifica se cookie de sessão foi retornado no header
    const cookies = resposta.cookies;
    const cookieSessao = cookies.find((c) => c.name === "token_sessao");
    expect(cookieSessao).toBeDefined();
    expect(cookieSessao?.httpOnly).toBe(true);
  });

  it("GET /api/autenticacao/eu - deve rejeitar requisição sem token/cookie", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/autenticacao/eu"
    });

    expect(resposta.statusCode).toBe(401);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.erro.codigo).toBe("NAO_AUTENTICADO");
  });

  it("GET /api/autenticacao/eu - deve retornar usuário logado quando autenticado", async () => {
    // 1. Faz login
    const respostaLogin = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: "admin@uniqprint.com.br",
        senha: "admin123"
      }
    });

    const token = JSON.parse(respostaLogin.body).dados.token;

    // 2. Consulta /eu via Bearer Token
    const respostaEu = await app.inject({
      method: "GET",
      url: "/api/autenticacao/eu",
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(respostaEu.statusCode).toBe(200);
    const corpo = JSON.parse(respostaEu.body);
    expect(corpo.dados.usuario.email).toBe("admin@uniqprint.com.br");
  });

  it("POST /api/autenticacao/logout - deve limpar cookie de sessão", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: "/api/autenticacao/logout"
    });

    expect(resposta.statusCode).toBe(200);
    const cookieSessao = resposta.cookies.find((c) => c.name === "token_sessao");
    // O cookie deve estar expirado ou vazio
    expect(cookieSessao?.value).toBe("");
  });
});
