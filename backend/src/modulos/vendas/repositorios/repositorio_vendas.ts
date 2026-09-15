import { Prisma } from "@prisma/client";
import { prisma } from "../../../banco_de_dados/prisma.js";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";

export interface VendaComRelacoes {
  id: number;
  data_venda: Date;
  cliente_id: number;
  cliente: {
    id: number;
    nome: string;
  };
  produto_id: number;
  produto: {
    id: number;
    descricao: string;
  };
  quantidade: number;
  valor_unitario: Prisma.Decimal;
  valor_total: Prisma.Decimal;
  criado_em: Date;
  atualizado_em: Date;
}

export interface FiltrosListagemVendas {
  pagina: number;
  limite: number;
  data_inicio?: string;
  data_fim?: string;
  cliente_id?: number;
  produto_id?: number;
}

export interface DadosTransacaoVenda {
  cliente_id: number;
  produto_id: number;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  data_venda?: Date;
  produto_descricao: string;
  cliente_nome: string;
}

export interface RepositorioVendas {
  buscarPorId(id: number): Promise<VendaComRelacoes | null>;
  listar(
    filtros: FiltrosListagemVendas
  ): Promise<{ vendas: VendaComRelacoes[]; total: number }>;
  executarTransacaoVenda(dados: DadosTransacaoVenda): Promise<VendaComRelacoes>;
}

export class RepositorioVendasPrisma implements RepositorioVendas {
  async buscarPorId(id: number): Promise<VendaComRelacoes | null> {
    return prisma.venda.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, nome: true }
        },
        produto: {
          select: { id: true, descricao: true }
        }
      }
    });
  }

  async listar(
    filtros: FiltrosListagemVendas
  ): Promise<{ vendas: VendaComRelacoes[]; total: number }> {
    const { pagina, limite, data_inicio, data_fim, cliente_id, produto_id } = filtros;
    const pular = (pagina - 1) * limite;

    const onde: Prisma.VendaWhereInput = {};

    if (cliente_id) {
      onde.cliente_id = cliente_id;
    }

    if (produto_id) {
      onde.produto_id = produto_id;
    }

    if (data_inicio || data_fim) {
      onde.data_venda = {};
      if (data_inicio) {
        onde.data_venda.gte = new Date(`${data_inicio}T00:00:00.000`);
      }
      if (data_fim) {
        onde.data_venda.lte = new Date(`${data_fim}T23:59:59.999`);
      }
    }

    const [vendas, total] = await Promise.all([
      prisma.venda.findMany({
        where: onde,
        skip: pular,
        take: limite,
        orderBy: [{ data_venda: "desc" }, { id: "desc" }],
        include: {
          cliente: {
            select: { id: true, nome: true }
          },
          produto: {
            select: { id: true, descricao: true }
          }
        }
      }),
      prisma.venda.count({ where: onde })
    ]);

    return { vendas, total };
  }

  async executarTransacaoVenda(dados: DadosTransacaoVenda): Promise<VendaComRelacoes> {
    return prisma.$transaction(async (tx) => {
      // 1. Baixa atômica do estoque com validação de concorrência:
      // O MySQL (InnoDB) adquire lock de linha na execução do UPDATE condicional.
      // Operações concorrentes são serializadas: se quantidade_estoque < dados.quantidade,
      // nenhuma linha atende ao critério e o resultado retornado terá count === 0.
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
        // Consultar o produto atual para reportar o motivo exato de negócio
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
            "Não é possível registrar venda para produto inativo",
            "PRODUTO_INATIVO",
            400
          );
        }

        throw new ErroAplicacao(
          `Estoque insuficiente para realizar esta venda. Estoque disponível: ${produtoAtual.quantidade_estoque}, Quantidade solicitada: ${dados.quantidade}`,
          "ESTOQUE_INSUFICIENTE",
          400
        );
      }

      // 2. Criar a venda persistindo cliente_id, produto_id e valores monetários Decimal(15,2)
      const venda = await tx.venda.create({
        data: {
          data_venda: dados.data_venda ?? new Date(),
          cliente_id: dados.cliente_id,
          produto_id: dados.produto_id,
          quantidade: dados.quantidade,
          valor_unitario: new Prisma.Decimal(dados.valor_unitario.toFixed(2)),
          valor_total: new Prisma.Decimal(dados.valor_total.toFixed(2))
        }
      });

      // 3. Criar movimentação de estoque tipo SAIDA associada à venda
      await tx.movimentacaoEstoque.create({
        data: {
          produto_id: dados.produto_id,
          tipo: "SAIDA",
          quantidade: dados.quantidade,
          tipo_referencia: "VENDA",
          referencia_id: venda.id,
          observacao: `Saída referente à venda #${venda.id}`
        }
      });

      // 4. Criar lançamento financeiro tipo ENTRADA com valor igual a valor_total
      await tx.lancamentoFinanceiro.create({
        data: {
          tipo: "ENTRADA",
          descricao: `Venda #${venda.id} - ${dados.produto_descricao}`,
          valor: new Prisma.Decimal(dados.valor_total.toFixed(2)),
          data_lancamento: venda.data_venda,
          categoria: "VENDA",
          tipo_referencia: "VENDA",
          referencia_id: venda.id,
          observacao: `Lançamento automático de entrada pela venda #${venda.id} (Cliente: ${dados.cliente_nome})`
        }
      });

      // 5. Retornar a venda completa com relacionamentos
      return tx.venda.findUniqueOrThrow({
        where: { id: venda.id },
        include: {
          cliente: {
            select: { id: true, nome: true }
          },
          produto: {
            select: { id: true, descricao: true }
          }
        }
      });
    });
  }
}
