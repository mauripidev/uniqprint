import { Prisma } from "@prisma/client";
import { prisma } from "../../../banco_de_dados/prisma.js";
import {
  ItemDetalhamentoCompra,
  ItemDetalhamentoFinanceiro,
  ItemDetalhamentoVenda,
  ResumoComprasResposta,
  ResumoFinanceiroResposta,
  ResumoVendasResposta
} from "../dtos/relatorios_dto.js";

export interface FiltrosConsultaVendas {
  data_inicio?: Date;
  data_fim?: Date;
  produto_id?: number;
  cliente_id?: number;
  pagina: number;
  limite: number;
}

export interface FiltrosConsultaCompras {
  data_inicio?: Date;
  data_fim?: Date;
  produto_id?: number;
  fornecedor_id?: number;
  pagina: number;
  limite: number;
}

export interface FiltrosConsultaFinanceiro {
  data_inicio?: Date;
  data_fim?: Date;
  tipo?: string;
  categoria?: string;
  pagina: number;
  limite: number;
}

export interface RepositorioRelatorios {
  obterRelatorioVendas(filtros: FiltrosConsultaVendas): Promise<{
    resumo: ResumoVendasResposta;
    dados: ItemDetalhamentoVenda[];
    total: number;
  }>;
  obterRelatorioCompras(filtros: FiltrosConsultaCompras): Promise<{
    resumo: ResumoComprasResposta;
    dados: ItemDetalhamentoCompra[];
    total: number;
  }>;
  obterRelatorioFinanceiro(filtros: FiltrosConsultaFinanceiro): Promise<{
    resumo: ResumoFinanceiroResposta;
    dados: ItemDetalhamentoFinanceiro[];
    total: number;
  }>;
}

export class RepositorioRelatoriosPrisma implements RepositorioRelatorios {
  async obterRelatorioVendas(filtros: FiltrosConsultaVendas) {
    const { data_inicio, data_fim, produto_id, cliente_id, pagina, limite } = filtros;
    const pular = (pagina - 1) * limite;

    const onde: Prisma.VendaWhereInput = {};

    if (produto_id) onde.produto_id = produto_id;
    if (cliente_id) onde.cliente_id = cliente_id;

    if (data_inicio || data_fim) {
      onde.data_venda = {};
      if (data_inicio) onde.data_venda.gte = data_inicio;
      if (data_fim) onde.data_venda.lte = data_fim;
    }

    const [agregacao, vendas, total] = await Promise.all([
      prisma.venda.aggregate({
        where: onde,
        _count: { id: true },
        _sum: {
          valor_total: true,
          quantidade: true
        },
        _avg: {
          valor_total: true
        }
      }),
      prisma.venda.findMany({
        where: onde,
        skip: pular,
        take: limite,
        orderBy: [{ data_venda: "desc" }, { id: "desc" }],
        include: {
          cliente: { select: { id: true, nome: true } },
          produto: { select: { id: true, descricao: true } }
        }
      }),
      prisma.venda.count({ where: onde })
    ]);

    const totalVendas = agregacao._count.id;
    const valorTotalVendido = agregacao._sum.valor_total
      ? Number(agregacao._sum.valor_total)
      : 0;
    const quantidadeItens = agregacao._sum.quantidade ?? 0;
    const ticketMedio =
      totalVendas > 0 ? Number((valorTotalVendido / totalVendas).toFixed(2)) : 0;

    const resumo: ResumoVendasResposta = {
      total_vendas: totalVendas,
      valor_total_vendido: Number(valorTotalVendido.toFixed(2)),
      ticket_medio: ticketMedio,
      quantidade_itens: quantidadeItens
    };

    const dados: ItemDetalhamentoVenda[] = vendas.map((venda) => ({
      id: venda.id,
      data_venda: venda.data_venda,
      cliente_id: venda.cliente_id,
      cliente_nome: venda.cliente.nome,
      produto_id: venda.produto_id,
      produto_descricao: venda.produto.descricao,
      quantidade: venda.quantidade,
      valor_unitario: Number(venda.valor_unitario),
      valor_total: Number(venda.valor_total)
    }));

    return { resumo, dados, total };
  }

  async obterRelatorioCompras(filtros: FiltrosConsultaCompras) {
    const { data_inicio, data_fim, produto_id, fornecedor_id, pagina, limite } = filtros;
    const pular = (pagina - 1) * limite;

    const onde: Prisma.CompraWhereInput = {};

    if (produto_id) onde.produto_id = produto_id;
    if (fornecedor_id) onde.fornecedor_id = fornecedor_id;

    if (data_inicio || data_fim) {
      onde.data_compra = {};
      if (data_inicio) onde.data_compra.gte = data_inicio;
      if (data_fim) onde.data_compra.lte = data_fim;
    }

    const [agregacao, compras, total] = await Promise.all([
      prisma.compra.aggregate({
        where: onde,
        _count: { id: true },
        _sum: {
          valor_total: true,
          quantidade: true
        },
        _avg: {
          valor_total: true
        }
      }),
      prisma.compra.findMany({
        where: onde,
        skip: pular,
        take: limite,
        orderBy: [{ data_compra: "desc" }, { id: "desc" }],
        include: {
          fornecedor: { select: { id: true, nome: true } },
          produto: { select: { id: true, descricao: true } }
        }
      }),
      prisma.compra.count({ where: onde })
    ]);

    const totalCompras = agregacao._count.id;
    const valorTotalComprado = agregacao._sum.valor_total
      ? Number(agregacao._sum.valor_total)
      : 0;
    const quantidadeItens = agregacao._sum.quantidade ?? 0;
    const mediaPorCompra =
      totalCompras > 0 ? Number((valorTotalComprado / totalCompras).toFixed(2)) : 0;

    const resumo: ResumoComprasResposta = {
      total_compras: totalCompras,
      valor_total_comprado: Number(valorTotalComprado.toFixed(2)),
      media_por_compra: mediaPorCompra,
      quantidade_itens: quantidadeItens
    };

    const dados: ItemDetalhamentoCompra[] = compras.map((compra) => ({
      id: compra.id,
      data_compra: compra.data_compra,
      fornecedor_id: compra.fornecedor_id,
      fornecedor_nome: compra.fornecedor.nome,
      produto_id: compra.produto_id,
      produto_descricao: compra.produto.descricao,
      quantidade: compra.quantidade,
      valor_unitario: Number(compra.valor_unitario),
      valor_total: Number(compra.valor_total)
    }));

    return { resumo, dados, total };
  }

  async obterRelatorioFinanceiro(filtros: FiltrosConsultaFinanceiro) {
    const { data_inicio, data_fim, tipo, categoria, pagina, limite } = filtros;
    const pular = (pagina - 1) * limite;

    const onde: Prisma.LancamentoFinanceiroWhereInput = {};

    if (tipo && (tipo === "ENTRADA" || tipo === "SAIDA")) {
      onde.tipo = tipo;
    }
    if (categoria) {
      onde.categoria = { contains: categoria };
    }

    if (data_inicio || data_fim) {
      onde.data_lancamento = {};
      if (data_inicio) onde.data_lancamento.gte = data_inicio;
      if (data_fim) onde.data_lancamento.lte = data_fim;
    }

    const [grupos, lancamentos, total] = await Promise.all([
      prisma.lancamentoFinanceiro.groupBy({
        by: ["tipo"],
        where: onde,
        _count: { id: true },
        _sum: { valor: true },
        _avg: { valor: true }
      }),
      prisma.lancamentoFinanceiro.findMany({
        where: onde,
        skip: pular,
        take: limite,
        orderBy: [{ data_lancamento: "desc" }, { id: "desc" }]
      }),
      prisma.lancamentoFinanceiro.count({ where: onde })
    ]);

    let totalEntradas = 0;
    let totalSaidas = 0;
    let quantidadeEntradas = 0;
    let quantidadeSaidas = 0;

    grupos.forEach((grupo) => {
      const valor = grupo._sum.valor ? Number(grupo._sum.valor) : 0;
      if (grupo.tipo === "ENTRADA") {
        totalEntradas = valor;
        quantidadeEntradas = grupo._count.id;
      } else if (grupo.tipo === "SAIDA") {
        totalSaidas = valor;
        quantidadeSaidas = grupo._count.id;
      }
    });

    const totalEntradasFormatado = Number(totalEntradas.toFixed(2));
    const totalSaidasFormatado = Number(totalSaidas.toFixed(2));
    const saldo = Number((totalEntradasFormatado - totalSaidasFormatado).toFixed(2));
    const mediaEntradas =
      quantidadeEntradas > 0
        ? Number((totalEntradasFormatado / quantidadeEntradas).toFixed(2))
        : 0;
    const mediaSaidas =
      quantidadeSaidas > 0
        ? Number((totalSaidasFormatado / quantidadeSaidas).toFixed(2))
        : 0;

    const resumo: ResumoFinanceiroResposta = {
      total_entradas: totalEntradasFormatado,
      total_saidas: totalSaidasFormatado,
      saldo,
      quantidade_entradas: quantidadeEntradas,
      quantidade_saidas: quantidadeSaidas,
      media_entradas: mediaEntradas,
      media_saidas: mediaSaidas
    };

    const dados: ItemDetalhamentoFinanceiro[] = lancamentos.map((l) => ({
      id: l.id,
      tipo: l.tipo,
      descricao: l.descricao,
      valor: Number(l.valor),
      data_lancamento: l.data_lancamento,
      categoria: l.categoria,
      tipo_referencia: l.tipo_referencia,
      referencia_id: l.referencia_id,
      observacao: l.observacao
    }));

    return { resumo, dados, total };
  }
}
