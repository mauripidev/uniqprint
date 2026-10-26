import { Prisma } from "@prisma/client";
import { prisma } from "../../../banco_de_dados/prisma.js";
import { LIMIAR_ESTOQUE_BAIXO } from "../../estoque/repositorios/repositorio_estoque.js";
import {
  DashboardCompras,
  DashboardOperacao,
  DashboardVendas,
  ProdutoEstoqueCritico
} from "../dtos/dashboard_dto.js";

export interface ResumoFinanceiroBruto {
  entradas: number;
  saidas: number;
  quantidade_entradas: number;
  quantidade_saidas: number;
}

export interface ResumoEstoqueBruto {
  total_produtos: number;
  produtos_estoque_baixo: number;
}

export interface RepositorioDashboard {
  obterResumoVendas(dataInicio?: Date, dataFim?: Date): Promise<DashboardVendas>;
  obterResumoCompras(dataInicio?: Date, dataFim?: Date): Promise<DashboardCompras>;
  obterResumoFinanceiro(dataInicio?: Date, dataFim?: Date): Promise<ResumoFinanceiroBruto>;
  obterResumoEstoque(): Promise<ResumoEstoqueBruto>;
  obterProdutosCriticos(limite?: number): Promise<ProdutoEstoqueCritico[]>;
  obterUltimasOperacoes(limite?: number): Promise<DashboardOperacao[]>;
}

export class RepositorioDashboardPrisma implements RepositorioDashboard {
  async obterResumoVendas(dataInicio?: Date, dataFim?: Date): Promise<DashboardVendas> {
    const onde: Prisma.VendaWhereInput = {};

    if (dataInicio || dataFim) {
      onde.data_venda = {};
      if (dataInicio) onde.data_venda.gte = dataInicio;
      if (dataFim) onde.data_venda.lte = dataFim;
    }

    const agregacao = await prisma.venda.aggregate({
      where: onde,
      _count: { id: true },
      _sum: {
        valor_total: true,
        quantidade: true
      }
    });

    const totalVendas = agregacao._count.id;
    const valorTotal = agregacao._sum.valor_total
      ? Number(Number(agregacao._sum.valor_total).toFixed(2))
      : 0;
    const quantidadeItens = agregacao._sum.quantidade ?? 0;

    return {
      total_vendas: totalVendas,
      valor_total: valorTotal,
      quantidade_itens: quantidadeItens
    };
  }

  async obterResumoCompras(dataInicio?: Date, dataFim?: Date): Promise<DashboardCompras> {
    const onde: Prisma.CompraWhereInput = {};

    if (dataInicio || dataFim) {
      onde.data_compra = {};
      if (dataInicio) onde.data_compra.gte = dataInicio;
      if (dataFim) onde.data_compra.lte = dataFim;
    }

    const agregacao = await prisma.compra.aggregate({
      where: onde,
      _count: { id: true },
      _sum: {
        valor_total: true,
        quantidade: true
      }
    });

    const totalCompras = agregacao._count.id;
    const valorTotal = agregacao._sum.valor_total
      ? Number(Number(agregacao._sum.valor_total).toFixed(2))
      : 0;
    const quantidadeItens = agregacao._sum.quantidade ?? 0;

    return {
      total_compras: totalCompras,
      valor_total: valorTotal,
      quantidade_itens: quantidadeItens
    };
  }

  async obterResumoFinanceiro(dataInicio?: Date, dataFim?: Date): Promise<ResumoFinanceiroBruto> {
    const onde: Prisma.LancamentoFinanceiroWhereInput = {};

    if (dataInicio || dataFim) {
      onde.data_lancamento = {};
      if (dataInicio) onde.data_lancamento.gte = dataInicio;
      if (dataFim) onde.data_lancamento.lte = dataFim;
    }

    const grupos = await prisma.lancamentoFinanceiro.groupBy({
      by: ["tipo"],
      where: onde,
      _count: { id: true },
      _sum: { valor: true }
    });

    let entradas = 0;
    let saidas = 0;
    let quantidadeEntradas = 0;
    let quantidadeSaidas = 0;

    for (const grupo of grupos) {
      const valor = grupo._sum.valor ? Number(grupo._sum.valor) : 0;
      if (grupo.tipo === "ENTRADA") {
        entradas = valor;
        quantidadeEntradas = grupo._count.id;
      } else if (grupo.tipo === "SAIDA") {
        saidas = valor;
        quantidadeSaidas = grupo._count.id;
      }
    }

    return {
      entradas: Number(entradas.toFixed(2)),
      saidas: Number(saidas.toFixed(2)),
      quantidade_entradas: quantidadeEntradas,
      quantidade_saidas: quantidadeSaidas
    };
  }

  async obterResumoEstoque(): Promise<ResumoEstoqueBruto> {
    const [totalProdutos, produtosEstoqueBaixo] = await Promise.all([
      prisma.produto.count({
        where: { ativo: true }
      }),
      prisma.produto.count({
        where: {
          ativo: true,
          quantidade_estoque: { lte: LIMIAR_ESTOQUE_BAIXO }
        }
      })
    ]);

    return {
      total_produtos: totalProdutos,
      produtos_estoque_baixo: produtosEstoqueBaixo
    };
  }

  async obterProdutosCriticos(limite: number = 5): Promise<ProdutoEstoqueCritico[]> {
    const produtos = await prisma.produto.findMany({
      where: {
        ativo: true,
        quantidade_estoque: { lte: LIMIAR_ESTOQUE_BAIXO }
      },
      orderBy: [
        { quantidade_estoque: "asc" },
        { descricao: "asc" }
      ],
      take: limite,
      select: {
        id: true,
        descricao: true,
        quantidade_estoque: true
      }
    });

    return produtos.map((p) => ({
      id: p.id,
      descricao: p.descricao,
      quantidade_estoque: p.quantidade_estoque,
      status: p.quantidade_estoque === 0 ? "sem_estoque" : "baixo"
    }));
  }

  async obterUltimasOperacoes(limite: number = 6): Promise<DashboardOperacao[]> {
    const [vendas, compras] = await Promise.all([
      prisma.venda.findMany({
        take: limite,
        orderBy: [{ data_venda: "desc" }, { id: "desc" }],
        include: {
          cliente: { select: { id: true, nome: true } },
          produto: { select: { id: true, descricao: true } }
        }
      }),
      prisma.compra.findMany({
        take: limite,
        orderBy: [{ data_compra: "desc" }, { id: "desc" }],
        include: {
          fornecedor: { select: { id: true, nome: true } },
          produto: { select: { id: true, descricao: true } }
        }
      })
    ]);

    const operacoes: DashboardOperacao[] = [
      ...vendas.map((v) => ({
        id: v.id,
        tipo: "VENDA" as const,
        descricao: `Venda #${v.id} - ${v.cliente.nome}`,
        identificador: `#${v.id}`,
        data: v.data_venda,
        valor: Number(v.valor_total),
        detalhe: `${v.quantidade}x ${v.produto.descricao}`
      })),
      ...compras.map((c) => ({
        id: c.id,
        tipo: "COMPRA" as const,
        descricao: `Compra #${c.id} - ${c.fornecedor.nome}`,
        identificador: `#${c.id}`,
        data: c.data_compra,
        valor: Number(c.valor_total),
        detalhe: `${c.quantidade}x ${c.produto.descricao}`
      }))
    ];

    operacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return operacoes.slice(0, limite);
  }
}
