import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { criarAplicativo } from "../../../aplicativo.js";
import { prisma } from "../../../banco_de_dados/prisma.js";
import { gerarHashSenha } from "../../../compartilhado/utilitarios/criptografia.js";

describe("Rotas de Auditoria e Controle de Acesso (Integração HTTP)", () => {
  let app: FastifyInstance;
  let tokenAdmin: string;
  let tokenUsuarioComum: string;
  let idUsuarioComum: number;
  let idRegistroTeste1: number;
  let idRegistroTeste2: number;

  beforeAll(async () => {
    app = criarAplicativo();
    await app.ready();

    // 1. Obter token de Administrador
    const loginAdmin = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: "admin@uniqprint.com.br",
        senha: "admin123"
      }
    });
    tokenAdmin = JSON.parse(loginAdmin.body).dados.token;

    // 2. Criar e autenticar usuário comum (não admin) para teste de autorização
    const senhaHash = await gerarHashSenha("usuario123");
    const usuarioComum = await prisma.usuario.create({
      data: {
        email: `usuario_teste_auditoria_${Date.now()}@uniqprint.com.br`,
        nome: "Usuário Comum Teste",
        senha_hash: senhaHash,
        papel: "USUARIO",
        ativo: true
      }
    });
    idUsuarioComum = usuarioComum.id;

    const loginComum = await app.inject({
      method: "POST",
      url: "/api/autenticacao/login",
      payload: {
        email: usuarioComum.email,
        senha: "usuario123"
      }
    });
    tokenUsuarioComum = JSON.parse(loginComum.body).dados.token;

    // 3. Criar registros de auditoria específicos para testes de rotas
    const reg1 = await prisma.registroAuditoria.create({
      data: {
        usuario_id: idUsuarioComum,
        acao: "TESTE_ROTA_AUDITORIA_1",
        entidade: "TESTE_ENTIDADE_1",
        entidade_id: 1001,
        dados: JSON.stringify({ detalhe: "Registro 1" }),
        criado_em: new Date("2026-08-01T10:00:00.000Z")
      }
    });
    idRegistroTeste1 = reg1.id;

    const reg2 = await prisma.registroAuditoria.create({
      data: {
        usuario_id: idUsuarioComum,
        acao: "TESTE_ROTA_AUDITORIA_2",
        entidade: "TESTE_ENTIDADE_2",
        entidade_id: 1002,
        dados: JSON.stringify({ detalhe: "Registro 2" }),
        criado_em: new Date("2026-08-02T10:00:00.000Z")
      }
    });
    idRegistroTeste2 = reg2.id;
  });

  afterAll(async () => {
    // Limpar dados criados
    await prisma.registroAuditoria.deleteMany({
      where: {
        id: { in: [idRegistroTeste1, idRegistroTeste2] }
      }
    });
    await prisma.registroAuditoria.deleteMany({
      where: {
        usuario_id: idUsuarioComum
      }
    });
    await prisma.usuario.deleteMany({
      where: { id: idUsuarioComum }
    });

    await app.close();
  });

  it("deve rejeitar acesso à auditoria sem token de autenticação com 401", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/auditoria"
    });

    expect(resposta.statusCode).toBe(401);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.erro.codigo).toBe("NAO_AUTENTICADO");
  });

  it("deve rejeitar acesso à auditoria por usuário não administrador com 403", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/auditoria",
      headers: {
        authorization: `Bearer ${tokenUsuarioComum}`
      }
    });

    expect(resposta.statusCode).toBe(403);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.erro.codigo).toBe("ACESSO_NEGADO");
  });

  it("deve permitir acesso à listagem de auditoria para ADMINISTRADOR", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/auditoria?pagina=1&limite=10",
      headers: {
        authorization: `Bearer ${tokenAdmin}`
      }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados).toBeDefined();
    expect(Array.isArray(corpo.dados)).toBe(true);
    expect(corpo.paginacao).toBeDefined();
    expect(corpo.paginacao.pagina).toBe(1);
    expect(corpo.paginacao.limite).toBe(10);
    expect(corpo.paginacao.total).toBeGreaterThanOrEqual(2);
  });

  it("deve filtrar auditoria por ação", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/auditoria?acao=TESTE_ROTA_AUDITORIA_1",
      headers: {
        authorization: `Bearer ${tokenAdmin}`
      }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.length).toBeGreaterThanOrEqual(1);
    expect(corpo.dados[0].acao).toBe("TESTE_ROTA_AUDITORIA_1");
  });

  it("deve filtrar auditoria por entidade", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/auditoria?entidade=TESTE_ENTIDADE_2",
      headers: {
        authorization: `Bearer ${tokenAdmin}`
      }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.length).toBeGreaterThanOrEqual(1);
    expect(corpo.dados[0].entidade).toBe("TESTE_ENTIDADE_2");
  });

  it("deve filtrar auditoria por período de datas", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/api/auditoria?data_inicio=2026-08-01&data_fim=2026-08-01",
      headers: {
        authorization: `Bearer ${tokenAdmin}`
      }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    const encontrados = corpo.dados.filter(
      (r: any) => r.acao === "TESTE_ROTA_AUDITORIA_1"
    );
    expect(encontrados.length).toBe(1);
  });

  it("deve obter detalhe de registro de auditoria por ID existente", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: `/api/auditoria/${idRegistroTeste1}`,
      headers: {
        authorization: `Bearer ${tokenAdmin}`
      }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.dados.id).toBe(idRegistroTeste1);
    expect(corpo.dados.acao).toBe("TESTE_ROTA_AUDITORIA_1");
    expect(corpo.dados.dados?.detalhe).toBe("Registro 1");
  });
});
