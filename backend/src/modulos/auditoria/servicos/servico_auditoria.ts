import { Prisma } from "@prisma/client";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import {
  RegistroAuditoriaResposta,
  RequisicaoConsultarAuditoria,
  RespostaListagemAuditoria
} from "../dtos/auditoria_dto.js";
import {
  RepositorioAuditoria,
  RepositorioAuditoriaPrisma
} from "../repositorios/repositorio_auditoria.js";

const CHAVES_PROIBIDAS = new Set([
  "senha",
  "senha_hash",
  "password",
  "token",
  "token_sessao",
  "cookie",
  "secret",
  "segredo",
  "hash",
  "authorization",
  "credenciais"
]);

export function sanitizarDadosAuditoria(dados: any): any {
  if (!dados || typeof dados !== "object") {
    return dados;
  }

  if (Array.isArray(dados)) {
    return dados.map(sanitizarDadosAuditoria);
  }

  const resultado: Record<string, any> = {};
  for (const [chave, valor] of Object.entries(dados)) {
    const chaveNormalizada = chave.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (CHAVES_PROIBIDAS.has(chaveNormalizada)) {
      continue;
    }
    resultado[chave] = typeof valor === "object" ? sanitizarDadosAuditoria(valor) : valor;
  }
  return resultado;
}

export interface EntradaRegistrarAuditoria {
  usuario_id?: number | null;
  acao: string;
  entidade: string;
  entidade_id?: number | null;
  dados?: Record<string, any> | null;
}

export class ServicoAuditoria {
  constructor(
    private repositorio: RepositorioAuditoria = new RepositorioAuditoriaPrisma()
  ) {}

  async registrarAuditoria(
    entrada: EntradaRegistrarAuditoria,
    tx?: Prisma.TransactionClient
  ) {
    let dadosSerializados: string | null = null;

    if (entrada.dados) {
      const dadosSanitizados = sanitizarDadosAuditoria(entrada.dados);
      dadosSerializados = JSON.stringify(dadosSanitizados);
    }

    return this.repositorio.criar(
      {
        usuario_id: entrada.usuario_id ?? null,
        acao: entrada.acao,
        entidade: entrada.entidade,
        entidade_id: entrada.entidade_id ?? null,
        dados: dadosSerializados
      },
      tx
    );
  }

  async listar(
    filtros: RequisicaoConsultarAuditoria
  ): Promise<RespostaListagemAuditoria> {
    const { pagina, limite, data_inicio, data_fim, usuario_id, acao, entidade } = filtros;

    const { registros, total } = await this.repositorio.listar({
      pagina,
      limite,
      data_inicio,
      data_fim,
      usuario_id,
      acao,
      entidade
    });

    const totalPaginas = Math.ceil(total / limite) || 1;

    const dadosFormatados: RegistroAuditoriaResposta[] = registros.map((r) => {
      let dadosObj: Record<string, any> | null = null;
      if (r.dados) {
        try {
          dadosObj = JSON.parse(r.dados);
        } catch {
          dadosObj = { valor: r.dados };
        }
      }

      return {
        id: r.id,
        usuario_id: r.usuario_id,
        usuario: r.usuario
          ? {
              id: r.usuario.id,
              nome: r.usuario.nome,
              email: r.usuario.email
            }
          : null,
        acao: r.acao,
        entidade: r.entidade,
        entidade_id: r.entidade_id,
        dados: dadosObj,
        criado_em: r.criado_em
      };
    });

    return {
      dados: dadosFormatados,
      paginacao: {
        pagina,
        limite,
        total,
        total_paginas: totalPaginas
      }
    };
  }

  async buscarPorId(id: number): Promise<RegistroAuditoriaResposta> {
    const registro = await this.repositorio.buscarPorId(id);

    if (!registro) {
      throw new ErroAplicacao(
        "Registro de auditoria não encontrado",
        "AUDITORIA_NAO_ENCONTRADA",
        404
      );
    }

    let dadosObj: Record<string, any> | null = null;
    if (registro.dados) {
      try {
        dadosObj = JSON.parse(registro.dados);
      } catch {
        dadosObj = { valor: registro.dados };
      }
    }

    return {
      id: registro.id,
      usuario_id: registro.usuario_id,
      usuario: registro.usuario
        ? {
            id: registro.usuario.id,
            nome: registro.usuario.nome,
            email: registro.usuario.email
          }
        : null,
      acao: registro.acao,
      entidade: registro.entidade,
      entidade_id: registro.entidade_id,
      dados: dadosObj,
      criado_em: registro.criado_em
    };
  }
}
