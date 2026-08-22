import { prisma } from "../../../banco_de_dados/prisma.js";
import { Produto } from "@prisma/client";

export interface DadosCriarProduto {
  descricao: string;
  quantidade_estoque?: number;
}

export interface DadosAtualizarProduto {
  descricao?: string;
  ativo?: boolean;
}

export interface FiltrosListagemProdutos {
  pagina: number;
  limite: number;
  busca?: string;
  ativo?: boolean;
}

export interface RepositorioProdutos {
  criar(dados: DadosCriarProduto): Promise<Produto>;
  buscarPorId(id: number): Promise<Produto | null>;
  buscarPorDescricao(descricao: string): Promise<Produto | null>;
  listar(filtros: FiltrosListagemProdutos): Promise<{ produtos: Produto[]; total: number }>;
  atualizar(id: number, dados: DadosAtualizarProduto): Promise<Produto>;
  inativar(id: number): Promise<Produto>;
}

export class RepositorioProdutosPrisma implements RepositorioProdutos {
  async criar(dados: DadosCriarProduto): Promise<Produto> {
    return prisma.produto.create({
      data: {
        descricao: dados.descricao,
        quantidade_estoque: dados.quantidade_estoque ?? 0,
        ativo: true
      }
    });
  }

  async buscarPorId(id: number): Promise<Produto | null> {
    return prisma.produto.findUnique({
      where: { id }
    });
  }

  async buscarPorDescricao(descricao: string): Promise<Produto | null> {
    return prisma.produto.findFirst({
      where: {
        descricao: {
          equals: descricao
        }
      }
    });
  }

  async listar(
    filtros: FiltrosListagemProdutos
  ): Promise<{ produtos: Produto[]; total: number }> {
    const { pagina, limite, busca, ativo } = filtros;
    const pular = (pagina - 1) * limite;

    const onde: {
      descricao?: { contains: string };
      ativo?: boolean;
    } = {};

    if (busca) {
      onde.descricao = { contains: busca };
    }

    if (ativo !== undefined) {
      onde.ativo = ativo;
    }

    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        where: onde,
        skip: pular,
        take: limite,
        orderBy: { descricao: "asc" }
      }),
      prisma.produto.count({ where: onde })
    ]);

    return { produtos, total };
  }

  async atualizar(id: number, dados: DadosAtualizarProduto): Promise<Produto> {
    return prisma.produto.update({
      where: { id },
      data: {
        ...(dados.descricao !== undefined ? { descricao: dados.descricao } : {}),
        ...(dados.ativo !== undefined ? { ativo: dados.ativo } : {})
      }
    });
  }

  async inativar(id: number): Promise<Produto> {
    return prisma.produto.update({
      where: { id },
      data: { ativo: false }
    });
  }
}
