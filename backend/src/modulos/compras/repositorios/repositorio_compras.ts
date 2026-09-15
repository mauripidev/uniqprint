import { Prisma } from "@prisma/client";
import { prisma } from "../../../banco_de_dados/prisma.js";

export interface CompraComRelacoes {
  id: number;
  data_compra: Date;
  produto_id: number;
  produto: {
    id: number;
    descricao: string;
  };
  quantidade: number;
  valor_unitario: Prisma.Decimal;
  valor_total: Prisma.Decimal;
  fornecedor_id: number;
  fornecedor: {
    id: number;
    nome: string;
  };
  criado_em: Date;
  atualizado_em: Date;
}

export interface FiltrosListagemCompras {
  pagina: number;
  limite: number;
  data_inicio?: string;
  data_fim?: string;
  produto_id?: number;
  fornecedor_id?: number;
}

export interface DadosTransacaoCompra {
  produto_id: number;
  fornecedor_id: number;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  data_compra?: Date;
  produto_descricao: string;
  fornecedor_nome: string;
}

export interface RepositorioCompras {
  buscarPorId(id: number): Promise<CompraComRelacoes | null>;
  listar(
    filtros: FiltrosListagemCompras
  ): Promise<{ compras: CompraComRelacoes[]; total: number }>;
  executarTransacaoCompra(dados: DadosTransacaoCompra): Promise<CompraComRelacoes>;
}

export class RepositorioComprasPrisma implements RepositorioCompras {
  async buscarPorId(id: number): Promise<CompraComRelacoes | null> {
    return prisma.compra.findUnique({
      where: { id },
      include: {
        produto: {
          select: { id: true, descricao: true }
        },
        fornecedor: {
          select: { id: true, nome: true }
        }
      }
    });
  }

  async listar(
    filtros: FiltrosListagemCompras
  ): Promise<{ compras: CompraComRelacoes[]; total: number }> {
    const { pagina, limite, data_inicio, data_fim, produto_id, fornecedor_id } = filtros;
    const pular = (pagina - 1) * limite;

    const onde: Prisma.CompraWhereInput = {};

    if (produto_id) {
      onde.produto_id = produto_id;
    }

    if (fornecedor_id) {
      onde.fornecedor_id = fornecedor_id;
    }

    if (data_inicio || data_fim) {
      onde.data_compra = {};
      if (data_inicio) {
        onde.data_compra.gte = new Date(`${data_inicio}T00:00:00.000`);
      }
      if (data_fim) {
        onde.data_compra.lte = new Date(`${data_fim}T23:59:59.999`);
      }
    }

    const [compras, total] = await Promise.all([
      prisma.compra.findMany({
        where: onde,
        skip: pular,
        take: limite,
        orderBy: [{ data_compra: "desc" }, { id: "desc" }],
        include: {
          produto: {
            select: { id: true, descricao: true }
          },
          fornecedor: {
            select: { id: true, nome: true }
          }
        }
      }),
      prisma.compra.count({ where: onde })
    ]);

    return { compras, total };
  }

  async executarTransacaoCompra(dados: DadosTransacaoCompra): Promise<CompraComRelacoes> {
    return prisma.$transaction(async (tx) => {
      // 1. Criar compra
      const compra = await tx.compra.create({
        data: {
          data_compra: dados.data_compra ?? new Date(),
          produto_id: dados.produto_id,
          fornecedor_id: dados.fornecedor_id,
          quantidade: dados.quantidade,
          valor_unitario: new Prisma.Decimal(dados.valor_unitario.toFixed(2)),
          valor_total: new Prisma.Decimal(dados.valor_total.toFixed(2))
        }
      });

      // 2. Incrementar estoque atomicamente
      await tx.produto.update({
        where: { id: dados.produto_id },
        data: {
          quantidade_estoque: {
            increment: dados.quantidade
          }
        }
      });

      // 3. Criar movimentação de estoque tipo ENTRADA
      await tx.movimentacaoEstoque.create({
        data: {
          produto_id: dados.produto_id,
          tipo: "ENTRADA",
          quantidade: dados.quantidade,
          tipo_referencia: "COMPRA",
          referencia_id: compra.id,
          observacao: `Entrada referente à compra #${compra.id}`
        }
      });

      // 4. Criar lançamento financeiro tipo SAIDA
      await tx.lancamentoFinanceiro.create({
        data: {
          tipo: "SAIDA",
          descricao: `Compra #${compra.id} - ${dados.produto_descricao}`,
          valor: new Prisma.Decimal(dados.valor_total.toFixed(2)),
          data_lancamento: compra.data_compra,
          categoria: "COMPRA",
          tipo_referencia: "COMPRA",
          referencia_id: compra.id,
          observacao: `Lançamento automático de saída pela compra #${compra.id} (Fornecedor: ${dados.fornecedor_nome})`
        }
      });

      // Retornar compra completa
      return tx.compra.findUniqueOrThrow({
        where: { id: compra.id },
        include: {
          produto: {
            select: { id: true, descricao: true }
          },
          fornecedor: {
            select: { id: true, nome: true }
          }
        }
      });
    });
  }
}
