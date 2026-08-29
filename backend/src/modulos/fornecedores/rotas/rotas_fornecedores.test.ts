import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarAplicativo } from "../../../aplicativo.js";
import { FastifyInstance } from "fastify";

describe("Rotas de Fornecedores (Integração HTTP)", () => {
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

  it("deve rejeitar acesso à listagem de fornecedores sem autenticação", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/fornecedores"
    });

    expect(resposta.statusCode).toBe(401);
  });

  it("deve criar um fornecedor com sucesso via POST /api/fornecedores", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: "/api/fornecedores",
      headers: {
        authorization: `Bearer ${tokenAutenticacao}`
      },
      payload: {
        nome: "Distribuidora Nacional de Insumos",
        observacao: "Fornecedor homologado de toners e papéis especiais"
      }
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBeDefined();
    expect(corpo.dados.nome).toBe("Distribuidora Nacional de Insumos");
    expect(corpo.dados.observacao).toBe(
      "Fornecedor homologado de toners e papéis especiais"
    );
    expect(corpo.dados.ativo).toBe(true);
  });

  it("deve listar os fornecedores cadastrados com paginação via GET /api/fornecedores", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/fornecedores?pagina=1&limite=10",
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

  it("deve buscar um fornecedor específico via GET /api/fornecedores/:id", async () => {
    // 1. Cria fornecedor
    const resCriar = await app.inject({
      method: "POST",
      url: "/api/fornecedores",
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: {
        nome: "Suprimentos Express",
        observacao: "Contato: Maria"
      }
    });
    const idFornecedor = JSON.parse(resCriar.body).dados.id;

    // 2. Busca por ID
    const resposta = await app.inject({
      method: "GET",
      url: `/api/fornecedores/${idFornecedor}`,
      headers: { authorization: `Bearer ${tokenAutenticacao}` }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBe(idFornecedor);
    expect(corpo.dados.nome).toBe("Suprimentos Express");
  });

  it("deve atualizar os dados do fornecedor via PUT /api/fornecedores/:id", async () => {
    // 1. Cria fornecedor
    const resCriar = await app.inject({
      method: "POST",
      url: "/api/fornecedores",
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: { nome: "Papéis Silva", observacao: "Antiga observacao" }
    });
    const idFornecedor = JSON.parse(resCriar.body).dados.id;

    // 2. Atualiza
    const resposta = await app.inject({
      method: "PUT",
      url: `/api/fornecedores/${idFornecedor}`,
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: {
        nome: "Papéis Silva & Santos Ltda",
        observacao: "Prazo de 15 dias"
      }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.nome).toBe("Papéis Silva & Santos Ltda");
    expect(corpo.dados.observacao).toBe("Prazo de 15 dias");
  });

  it("deve inativar logicamente o fornecedor via DELETE /api/fornecedores/:id", async () => {
    // 1. Cria fornecedor
    const resCriar = await app.inject({
      method: "POST",
      url: "/api/fornecedores",
      headers: { authorization: `Bearer ${tokenAutenticacao}` },
      payload: { nome: "Fornecedor Provisório" }
    });
    const idFornecedor = JSON.parse(resCriar.body).dados.id;

    // 2. Inativa
    const resposta = await app.inject({
      method: "DELETE",
      url: `/api/fornecedores/${idFornecedor}`,
      headers: { authorization: `Bearer ${tokenAutenticacao}` }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.ativo).toBe(false);

    // 3. Verifica que continua existindo porém inativo
    const resVerificacao = await app.inject({
      method: "GET",
      url: `/api/fornecedores/${idFornecedor}`,
      headers: { authorization: `Bearer ${tokenAutenticacao}` }
    });
    expect(JSON.parse(resVerificacao.body).dados.ativo).toBe(false);
  });
});
