import { Prisma, RegistroAuditoria } from "@prisma/client";
import { prisma } from "../../../banco_de_dados/prisma.js";

export interface RegistroAuditoriaDbComUsuario extends RegistroAuditoria {
  usuario?: {
    id: number;
    nome: string;
    email: string;
  } | null;
}

export interface FiltrosListagemAuditoria {
  pagina: number;
  limite: number;
  data_inicio?: string;
  data_fim?: string;
  usuario_id?: number;
  acao?: string;
  entidade?: string;
}

export interface DadosCriarAuditoria {
  usuario_id?: number | null;
  acao: string;
  entidade: string;
  entidade_id?: number | null;
  dados?: string | null;
}

export interface RepositorioAuditoria {
  criar(
    dados: DadosCriarAuditoria,
    tx?: Prisma.TransactionClient
  ): Promise<RegistroAuditoria>;
  listar(
    filtros: FiltrosListagemAuditoria
  ): Promise<{ registros: RegistroAuditoriaDbComUsuario[]; total: number }>;
  buscarPorId(id: number): Promise<RegistroAuditoriaDbComUsuario | null>;
}

export class RepositorioAuditoriaPrisma implements RepositorioAuditoria {
  async criar(
    dados: DadosCriarAuditoria,
    tx?: Prisma.TransactionClient
  ): Promise<RegistroAuditoria> {
    const clientePrisma = tx ?? prisma;

    return clientePrisma.registroAuditoria.create({
      data: {
        usuario_id: dados.usuario_id ?? null,
        acao: dados.acao,
        entidade: dados.entidade,
        entidade_id: dados.entidade_id ?? null,
        dados: dados.dados ?? null
      }
    });
  }

  async buscarPorId(id: number): Promise<RegistroAuditoriaDbComUsuario | null> {
    return prisma.registroAuditoria.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });
  }

  async listar(
    filtros: FiltrosListagemAuditoria
  ): Promise<{ registros: RegistroAuditoriaDbComUsuario[]; total: number }> {
    const { pagina, limite, data_inicio, data_fim, usuario_id, acao, entidade } = filtros;
    const pular = (pagina - 1) * limite;

    const onde: Prisma.RegistroAuditoriaWhereInput = {};

    if (usuario_id) {
      onde.usuario_id = usuario_id;
    }

    if (acao) {
      onde.acao = acao;
    }

    if (entidade) {
      onde.entidade = entidade;
    }

    if (data_inicio || data_fim) {
      onde.criado_em = {};
      if (data_inicio) {
        onde.criado_em.gte = data_inicio.includes("T")
          ? new Date(data_inicio)
          : new Date(`${data_inicio}T00:00:00.000`);
      }
      if (data_fim) {
        onde.criado_em.lte = data_fim.includes("T")
          ? new Date(data_fim)
          : new Date(`${data_fim}T23:59:59.999`);
      }
    }

    const [registros, total] = await Promise.all([
      prisma.registroAuditoria.findMany({
        where: onde,
        skip: pular,
        take: limite,
        orderBy: [{ criado_em: "desc" }, { id: "desc" }],
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        }
      }),
      prisma.registroAuditoria.count({ where: onde })
    ]);

    return { registros, total };
  }
}
