import { describe, expect, it } from "vitest";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import {
  DadosCriarAuditoria,
  FiltrosListagemAuditoria,
  RegistroAuditoriaDbComUsuario,
  RepositorioAuditoria
} from "../repositorios/repositorio_auditoria.js";
import {
  sanitizarDadosAuditoria,
  ServicoAuditoria
} from "./servico_auditoria.js";

class RepositorioAuditoriaMemoria implements RepositorioAuditoria {
  public registros: RegistroAuditoriaDbComUsuario[] = [];
  private proximoId = 1;

  async criar(dados: DadosCriarAuditoria): Promise<RegistroAuditoriaDbComUsuario> {
    const novo: RegistroAuditoriaDbComUsuario = {
      id: this.proximoId++,
      usuario_id: dados.usuario_id ?? null,
      acao: dados.acao,
      entidade: dados.entidade,
      entidade_id: dados.entidade_id ?? null,
      dados: dados.dados ?? null,
      criado_em: new Date()
    };
    this.registros.push(novo);
    return novo;
  }

  async buscarPorId(id: number): Promise<RegistroAuditoriaDbComUsuario | null> {
    return this.registros.find((r) => r.id === id) ?? null;
  }

  async listar(
    filtros: FiltrosListagemAuditoria
  ): Promise<{ registros: RegistroAuditoriaDbComUsuario[]; total: number }> {
    let filtrados = [...this.registros];

    if (filtros.usuario_id) {
      filtrados = filtrados.filter((r) => r.usuario_id === filtros.usuario_id);
    }
    if (filtros.acao) {
      filtrados = filtrados.filter((r) => r.acao === filtros.acao);
    }
    if (filtros.entidade) {
      filtrados = filtrados.filter((r) => r.entidade === filtros.entidade);
    }
    if (filtros.data_inicio) {
      const inicio = new Date(filtros.data_inicio);
      filtrados = filtrados.filter((r) => r.criado_em >= inicio);
    }
    if (filtros.data_fim) {
      const fim = new Date(filtros.data_fim);
      filtrados = filtrados.filter((r) => r.criado_em <= fim);
    }

    filtrados.sort((a, b) => b.criado_em.getTime() - a.criado_em.getTime());

    const total = filtrados.length;
    const inicio = (filtros.pagina - 1) * filtros.limite;
    const paginados = filtrados.slice(inicio, inicio + filtros.limite);

    return { registros: paginados, total };
  }
}

describe("Serviço de Auditoria (Regras de Negócio e Sanitização)", () => {
  it("deve registrar auditoria corretamente com usuário, ação, entidade e dados permitidos", async () => {
    const repo = new RepositorioAuditoriaMemoria();
    const servico = new ServicoAuditoria(repo);

    const registro = await servico.registrarAuditoria({
      usuario_id: 1,
      acao: "CRIAR_PRODUTO",
      entidade: "PRODUTO",
      entidade_id: 42,
      dados: {
        descricao: "Papel Sulfite A4",
        quantidade_estoque: 100
      }
    });

    expect(registro.id).toBeDefined();
    expect(registro.usuario_id).toBe(1);
    expect(registro.acao).toBe("CRIAR_PRODUTO");
    expect(registro.entidade).toBe("PRODUTO");
    expect(registro.entidade_id).toBe(42);
    expect(registro.dados).toContain("Papel Sulfite A4");
    expect(registro.dados).toContain("100");
  });

  it("não deve armazenar senhas, hashes, tokens, cookies e credenciais", async () => {
    const repo = new RepositorioAuditoriaMemoria();
    const servico = new ServicoAuditoria(repo);

    const dadosSensiveis = {
      email: "admin@uniqprint.com.br",
      senha: "super_senha_secreta",
      senha_hash: "$argon2id$v=19$m=65536,t=3,p=4$hashsecreto",
      token: "jwt_token_muito_longo",
      token_sessao: "sessao_cookie_123",
      cookie: "meu_cookie",
      secret: "segredo_da_api",
      dados_validos: "informação permitida"
    };

    const sanitizado = sanitizarDadosAuditoria(dadosSensiveis);
    expect(sanitizado.email).toBe("admin@uniqprint.com.br");
    expect(sanitizado.dados_validos).toBe("informação permitida");
    expect(sanitizado.senha).toBeUndefined();
    expect(sanitizado.senha_hash).toBeUndefined();
    expect(sanitizado.token).toBeUndefined();
    expect(sanitizado.token_sessao).toBeUndefined();
    expect(sanitizado.cookie).toBeUndefined();
    expect(sanitizado.secret).toBeUndefined();

    // Testar gravação pelo serviço
    const registro = await servico.registrarAuditoria({
      usuario_id: 1,
      acao: "LOGIN",
      entidade: "USUARIO",
      entidade_id: 1,
      dados: dadosSensiveis
    });

    expect(registro.dados).not.toContain("super_senha_secreta");
    expect(registro.dados).not.toContain("hashsecreto");
    expect(registro.dados).not.toContain("jwt_token_muito_longo");
    expect(registro.dados).toContain("admin@uniqprint.com.br");
  });

  it("deve listar registros de auditoria com paginação correta", async () => {
    const repo = new RepositorioAuditoriaMemoria();
    const servico = new ServicoAuditoria(repo);

    for (let i = 1; i <= 25; i++) {
      await servico.registrarAuditoria({
        usuario_id: 1,
        acao: `ACAO_${i}`,
        entidade: "ENTIDADE_TESTE",
        entidade_id: i,
        dados: { contador: i }
      });
    }

    const resultadoPagina1 = await servico.listar({
      pagina: 1,
      limite: 10
    });

    expect(resultadoPagina1.dados).toHaveLength(10);
    expect(resultadoPagina1.paginacao.total).toBe(25);
    expect(resultadoPagina1.paginacao.total_paginas).toBe(3);
    expect(resultadoPagina1.paginacao.pagina).toBe(1);

    const resultadoPagina3 = await servico.listar({
      pagina: 3,
      limite: 10
    });

    expect(resultadoPagina3.dados).toHaveLength(5);
    expect(resultadoPagina3.paginacao.pagina).toBe(3);
  });

  it("deve filtrar registros por usuário, ação e entidade", async () => {
    const repo = new RepositorioAuditoriaMemoria();
    const servico = new ServicoAuditoria(repo);

    await servico.registrarAuditoria({
      usuario_id: 1,
      acao: "CRIAR_PRODUTO",
      entidade: "PRODUTO",
      entidade_id: 1
    });

    await servico.registrarAuditoria({
      usuario_id: 2,
      acao: "CRIAR_VENDA",
      entidade: "VENDA",
      entidade_id: 1
    });

    const filtroUsuario = await servico.listar({
      pagina: 1,
      limite: 10,
      usuario_id: 2
    });
    expect(filtroUsuario.dados).toHaveLength(1);
    expect(filtroUsuario.dados[0].acao).toBe("CRIAR_VENDA");

    const filtroAcao = await servico.listar({
      pagina: 1,
      limite: 10,
      acao: "CRIAR_PRODUTO"
    });
    expect(filtroAcao.dados).toHaveLength(1);
    expect(filtroAcao.dados[0].entidade).toBe("PRODUTO");

    const filtroEntidade = await servico.listar({
      pagina: 1,
      limite: 10,
      entidade: "VENDA"
    });
    expect(filtroEntidade.dados).toHaveLength(1);
  });

  it("deve buscar registro de auditoria por id existente e lançar erro se inexistente", async () => {
    const repo = new RepositorioAuditoriaMemoria();
    const servico = new ServicoAuditoria(repo);

    const criado = await servico.registrarAuditoria({
      usuario_id: 1,
      acao: "CRIAR_LANCAMENTO_FINANCEIRO",
      entidade: "LANCAMENTO_FINANCEIRO",
      entidade_id: 99,
      dados: { valor: 150 }
    });

    const encontrado = await servico.buscarPorId(criado.id);
    expect(encontrado.id).toBe(criado.id);
    expect(encontrado.acao).toBe("CRIAR_LANCAMENTO_FINANCEIRO");
    expect(encontrado.dados?.valor).toBe(150);

    await expect(servico.buscarPorId(99999)).rejects.toThrow(ErroAplicacao);
  });
});
