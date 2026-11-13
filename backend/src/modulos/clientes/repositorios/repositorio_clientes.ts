import { prisma } from "../../../banco_de_dados/prisma.js";
import { Cliente } from "@prisma/client";

export interface DadosCriarCliente {
  nome: string;
  telefone?: string | null;
  observacao?: string | null;
}

export interface DadosAtualizarCliente {
  nome?: string;
  telefone?: string | null;
  observacao?: string | null;
  ativo?: boolean;
}

export interface FiltrosListagemClientes {
  pagina: number;
  limite: number;
  busca?: string;
  ativo?: boolean;
}

export interface RepositorioClientes {
  criar(dados: DadosCriarCliente): Promise<Cliente>;
  buscarPorId(id: number): Promise<Cliente | null>;
  buscarPorNome(nome: string): Promise<Cliente | null>;
  listar(filtros: FiltrosListagemClientes): Promise<{ clientes: Cliente[]; total: number }>;
  atualizar(id: number, dados: DadosAtualizarCliente): Promise<Cliente>;
  inativar(id: number): Promise<Cliente>;
}

export class RepositorioClientesPrisma implements RepositorioClientes {
  async criar(dados: DadosCriarCliente): Promise<Cliente> {
    return prisma.cliente.create({
      data: {
        nome: dados.nome,
        telefone: dados.telefone ?? null,
        observacao: dados.observacao ?? null,
        ativo: true
      }
    });
  }

  async buscarPorId(id: number): Promise<Cliente | null> {
    return prisma.cliente.findUnique({
      where: { id }
    });
  }

  async buscarPorNome(nome: string): Promise<Cliente | null> {
    return prisma.cliente.findFirst({
      where: {
        nome: {
          equals: nome
        }
      }
    });
  }

  async listar(
    filtros: FiltrosListagemClientes
  ): Promise<{ clientes: Cliente[]; total: number }> {
    const { pagina, limite, busca, ativo } = filtros;
    const pular = (pagina - 1) * limite;

    const onde: any = {};

    if (busca) {
      onde.OR = [
        { nome: { contains: busca } },
        { telefone: { contains: busca } },
        { observacao: { contains: busca } }
      ];
    }

    if (ativo !== undefined) {
      onde.ativo = ativo;
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where: onde,
        skip: pular,
        take: limite,
        orderBy: { nome: "asc" }
      }),
      prisma.cliente.count({ where: onde })
    ]);

    return { clientes, total };
  }

  async atualizar(id: number, dados: DadosAtualizarCliente): Promise<Cliente> {
    return prisma.cliente.update({
      where: { id },
      data: {
        ...(dados.nome !== undefined ? { nome: dados.nome } : {}),
        ...(dados.telefone !== undefined ? { telefone: dados.telefone } : {}),
        ...(dados.observacao !== undefined ? { observacao: dados.observacao } : {}),
        ...(dados.ativo !== undefined ? { ativo: dados.ativo } : {})
      }
    });
  }

  async inativar(id: number): Promise<Cliente> {
    return prisma.cliente.update({
      where: { id },
      data: { ativo: false }
    });
  }
}
