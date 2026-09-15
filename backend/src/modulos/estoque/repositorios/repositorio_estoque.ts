import { Prisma } from "@prisma/client";
import { prisma } from "../../../banco_de_dados/prisma.js";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";

/** Limiar para considerar estoque como "baixo" */
export const LIMIAR_ESTOQUE_BAIXO = 5;

export interface MovimentacaoComProduto {
  id: number;
  produto_id: number;
  produto: {
    id: number;
    descricao: string;
  };
  tipo: string;
  quantidade: number;
  tipo_referencia: string | null;
  referencia_id: number | null;
  observacao: string | null;
  criado_em: Date;
}

export interface FiltrosListagemEstoque {
  pagina: number;
  limite: number;
  busca?: string;
  status?: "todos" | "normal" | "baixo" | "sem_estoque";
}

export interface FiltrosListagemMovimentacoes {
  pagina: number;
  limite: number;
  produto_id?: number;
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface DadosTransacaoAjuste {
  produto_id: number;
  tipo_ajuste: "ENTRADA" | "SAIDA";
  quantidade: number;
  observacao: string;
}

export interface ResultadoAjuste {
  movimentacao: MovimentacaoComProduto;
  estoque_anterior: number;
  estoque_novo: number;
}

export interface RepositorioEstoque {
  listarEstoque(
    filtros: FiltrosListagemEstoque
  ): Promise<{
    produtos: Array<{
      id: number;
      descricao: string;
      quantidade_estoque: number;
      ativo: boolean;
    }>;
    total: number;
    resumo: {
      total_produtos: number;
      estoque_baixo: number;
      sem_estoque: number;
    };
  }>;

  listarMovimentacoes(
    filtros: FiltrosListagemMovimentacoes
  ): Promise<{ movimentacoes: MovimentacaoComProduto[]; total: number }>;

  executarTransacaoAjuste(dados: DadosTransacaoAjuste): Promise<ResultadoAjuste>;
}

export class RepositorioEstoquePrisma implements RepositorioEstoque {
  async listarEstoque(filtros: FiltrosListagemEstoque) {
    const { pagina, limite, busca, status } = filtros;
    const pular = (pagina - 1) * limite;

    const onde: Prisma.ProdutoWhereInput = {
      ativo: true
    };

    if (busca) {
      onde.descricao = { contains: busca };
    }

    if (status === "baixo") {
      onde.quantidade_estoque = { gt: 0, lte: LIMIAR_ESTOQUE_BAIXO };
    } else if (status === "sem_estoque") {
      onde.quantidade_estoque = 0;
    } else if (status === "normal") {
      onde.quantidade_estoque = { gt: LIMIAR_ESTOQUE_BAIXO };
    }

    // Query principal com paginação
    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        where: onde,
        skip: pular,
        take: limite,
        orderBy: [{ quantidade_estoque: "asc" }, { descricao: "asc" }],
        select: {
          id: true,
          descricao: true,
          quantidade_estoque: true,
          ativo: true
        }
      }),
      prisma.produto.count({ where: onde })
    ]);

    // Resumo (contagens globais, sem filtro de busca/status)
    const [totalProdutos, estoqueBaixo, semEstoque] = await Promise.all([
      prisma.produto.count({ where: { ativo: true } }),
      prisma.produto.count({
        where: { ativo: true, quantidade_estoque: { gt: 0, lte: LIMIAR_ESTOQUE_BAIXO } }
      }),
      prisma.produto.count({
        where: { ativo: true, quantidade_estoque: 0 }
      })
    ]);

    return {
      produtos,
      total,
      resumo: {
        total_produtos: totalProdutos,
        estoque_baixo: estoqueBaixo,
        sem_estoque: semEstoque
      }
    };
  }

  async listarMovimentacoes(filtros: FiltrosListagemMovimentacoes) {
    const { pagina, limite, produto_id, tipo, data_inicio, data_fim } = filtros;
    const pular = (pagina - 1) * limite;

    const onde: Prisma.MovimentacaoEstoqueWhereInput = {};

    if (produto_id) {
      onde.produto_id = produto_id;
    }

    if (tipo) {
      onde.tipo = tipo;
    }

    if (data_inicio || data_fim) {
      onde.criado_em = {};
      if (data_inicio) {
        onde.criado_em.gte = new Date(`${data_inicio}T00:00:00.000`);
      }
      if (data_fim) {
        onde.criado_em.lte = new Date(`${data_fim}T23:59:59.999`);
      }
    }

    const [movimentacoes, total] = await Promise.all([
      prisma.movimentacaoEstoque.findMany({
        where: onde,
        skip: pular,
        take: limite,
        orderBy: [{ criado_em: "desc" }, { id: "desc" }],
        include: {
          produto: {
            select: { id: true, descricao: true }
          }
        }
      }),
      prisma.movimentacaoEstoque.count({ where: onde })
    ]);

    return { movimentacoes, total };
  }

  async executarTransacaoAjuste(dados: DadosTransacaoAjuste): Promise<ResultadoAjuste> {
    return prisma.$transaction(async (tx) => {
      // 1. Buscar produto atual com lock implícito pela transação
      const produtoAtual = await tx.produto.findUnique({
        where: { id: dados.produto_id }
      });

      if (!produtoAtual) {
        throw new ErroAplicacao(
          "Produto não encontrado",
          "PRODUTO_NAO_ENCONTRADO",
          404
        );
      }

      if (!produtoAtual.ativo) {
        throw new ErroAplicacao(
          "Não é possível realizar ajuste para produto inativo",
          "PRODUTO_INATIVO",
          400
        );
      }

      const estoqueAnterior = produtoAtual.quantidade_estoque;

      if (dados.tipo_ajuste === "SAIDA") {
        // 2a. Baixa atômica com proteção de concorrência (padrão de vendas)
        const resultadoUpdate = await tx.produto.updateMany({
          where: {
            id: dados.produto_id,
            ativo: true,
            quantidade_estoque: {
              gte: dados.quantidade
            }
          },
          data: {
            quantidade_estoque: {
              decrement: dados.quantidade
            }
          }
        });

        if (resultadoUpdate.count === 0) {
          throw new ErroAplicacao(
            `O ajuste resultaria em estoque negativo. Estoque disponível: ${estoqueAnterior}, Quantidade solicitada: ${dados.quantidade}`,
            "ESTOQUE_INSUFICIENTE",
            400
          );
        }
      } else {
        // 2b. Incremento atômico (padrão de compras)
        await tx.produto.update({
          where: { id: dados.produto_id },
          data: {
            quantidade_estoque: {
              increment: dados.quantidade
            }
          }
        });
      }

      // 3. Criar movimentação de estoque tipo AJUSTE
      const tipoReferencia = dados.tipo_ajuste === "ENTRADA" ? "AJUSTE_ENTRADA" : "AJUSTE_SAIDA";
      const movimentacao = await tx.movimentacaoEstoque.create({
        data: {
          produto_id: dados.produto_id,
          tipo: "AJUSTE",
          quantidade: dados.quantidade,
          tipo_referencia: tipoReferencia,
          referencia_id: null,
          observacao: dados.observacao
        },
        include: {
          produto: {
            select: { id: true, descricao: true }
          }
        }
      });

      // 4. Calcular novo estoque
      const estoqueNovo = dados.tipo_ajuste === "ENTRADA"
        ? estoqueAnterior + dados.quantidade
        : estoqueAnterior - dados.quantidade;

      return {
        movimentacao,
        estoque_anterior: estoqueAnterior,
        estoque_novo: estoqueNovo
      };
    });
  }
}
