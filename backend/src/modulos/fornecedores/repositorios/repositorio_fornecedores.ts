import { prisma } from "../../../banco_de_dados/prisma.js";
import { Fornecedor } from "@prisma/client";

export interface DadosCriarFornecedor {
  nome: string;
  observacao?: string | null;
}

export interface DadosAtualizarFornecedor {
  nome?: string;
  observacao?: string | null;
  ativo?: boolean;
}

export interface FiltrosListagemFornecedores {
  pagina: number;
  limite: number;
  busca?: string;
  ativo?: boolean;
}

export interface RepositorioFornecedores {
  criar(dados: DadosCriarFornecedor): Promise<Fornecedor>;
  buscarPorId(id: number): Promise<Fornecedor | null>;
  buscarPorNome(nome: string): Promise<Fornecedor | null>;
  listar(filtros: FiltrosListagemFornecedores): Promise<{ fornecedores: Fornecedor[]; total: number }>;
  atualizar(id: number, dados: DadosAtualizarFornecedor): Promise<Fornecedor>;
  inativar(id: number): Promise<Fornecedor>;
}

export class RepositorioFornecedoresPrisma implements RepositorioFornecedores {
  async criar(dados: DadosCriarFornecedor): Promise<Fornecedor> {
    return prisma.fornecedor.create({
      data: {
        nome: dados.nome,
        observacao: dados.observacao ?? null,
        ativo: true
      }
    });
  }

  async buscarPorId(id: number): Promise<Fornecedor | null> {
    return prisma.fornecedor.findUnique({
      where: { id }
    });
  }

  async buscarPorNome(nome: string): Promise<Fornecedor | null> {
    return prisma.fornecedor.findFirst({
      where: {
        nome: {
          equals: nome
        }
      }
    });
  }

  async listar(
    filtros: FiltrosListagemFornecedores
  ): Promise<{ fornecedores: Fornecedor[]; total: number }> {
    const { pagina, limite, busca, ativo } = filtros;
    const pular = (pagina - 1) * limite;

    const onde: any = {};

    if (busca) {
      onde.OR = [
        { nome: { contains: busca } },
        { observacao: { contains: busca } }
      ];
    }

    if (ativo !== undefined) {
      onde.ativo = ativo;
    }

    const [fornecedores, total] = await Promise.all([
      prisma.fornecedor.findMany({
        where: onde,
        skip: pular,
        take: limite,
        orderBy: { nome: "asc" }
      }),
      prisma.fornecedor.count({ where: onde })
    ]);

    return { fornecedores, total };
  }

  async atualizar(id: number, dados: DadosAtualizarFornecedor): Promise<Fornecedor> {
    return prisma.fornecedor.update({
      where: { id },
      data: {
        ...(dados.nome !== undefined ? { nome: dados.nome } : {}),
        ...(dados.observacao !== undefined ? { observacao: dados.observacao } : {}),
        ...(dados.ativo !== undefined ? { ativo: dados.ativo } : {})
      }
    });
  }

  async inativar(id: number): Promise<Fornecedor> {
    return prisma.fornecedor.update({
      where: { id },
      data: { ativo: false }
    });
  }
}
