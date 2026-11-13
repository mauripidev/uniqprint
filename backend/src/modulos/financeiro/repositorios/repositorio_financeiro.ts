import { Prisma } from "@prisma/client";
import { prisma } from "../../../banco_de_dados/prisma.js";

export interface LancamentoDb {
  id: number;
  tipo: string;
  descricao: string;
  valor: Prisma.Decimal;
  data_lancamento: Date;
  categoria: string;
  tipo_referencia: string | null;
  referencia_id: number | null;
  observacao: string | null;
  criado_em: Date;
}

export interface FiltrosListagemLancamentos {
  pagina: number;
  limite: number;
  data_inicio?: string;
  data_fim?: string;
  categoria?: string;
  tipo?: string;
}

export interface FiltrosResumoFinanceiro {
  data_inicio?: string;
  data_fim?: string;
  categoria?: string;
  tipo?: string;
}

export interface DadosCriarLancamento {
  tipo: string;
  descricao: string;
  valor: number;
  data_lancamento?: string;
  categoria: string;
  observacao?: string | null;
}

export interface DadosAtualizarLancamento extends Partial<DadosCriarLancamento> {}

export interface ResumoFinanceiro {
  total_entradas: number;
  total_saidas: number;
  saldo: number;
  saldo_atual: number;
}

export interface RepositorioFinanceiro {
  listar(filtros: FiltrosListagemLancamentos): Promise<{ lancamentos: LancamentoDb[]; total: number }>;
  buscarPorId(id: number): Promise<LancamentoDb | null>;
  criar(dados: DadosCriarLancamento): Promise<LancamentoDb>;
  atualizar(id: number, dados: DadosAtualizarLancamento): Promise<LancamentoDb>;
  excluir(id: number): Promise<void>;
  calcularResumo(filtros: FiltrosResumoFinanceiro): Promise<ResumoFinanceiro>;
}

export class RepositorioFinanceiroPrisma implements RepositorioFinanceiro {
  private montarClausulaData(data_inicio?: string, data_fim?: string): Prisma.DateTimeFilter | undefined {
    if (!data_inicio && !data_fim) return undefined;

    const filtro: Prisma.DateTimeFilter = {};
    if (data_inicio) {
      filtro.gte = data_inicio.includes("T")
        ? new Date(data_inicio)
        : new Date(`${data_inicio}T00:00:00.000Z`);
    }
    if (data_fim) {
      filtro.lte = data_fim.includes("T")
        ? new Date(data_fim)
        : new Date(`${data_fim}T23:59:59.999Z`);
    }
    return filtro;
  }

  async listar(filtros: FiltrosListagemLancamentos) {
    const { pagina, limite, data_inicio, data_fim, categoria, tipo } = filtros;
    const pular = (pagina - 1) * limite;

    const onde: Prisma.LancamentoFinanceiroWhereInput = {};

    if (categoria) onde.categoria = { contains: categoria };
    if (tipo && (tipo === "ENTRADA" || tipo === "SAIDA")) onde.tipo = tipo;

    const dataFiltro = this.montarClausulaData(data_inicio, data_fim);
    if (dataFiltro) {
      onde.data_lancamento = dataFiltro;
    }

    const [lancamentos, total] = await Promise.all([
      prisma.lancamentoFinanceiro.findMany({
        where: onde,
        skip: pular,
        take: limite,
        orderBy: { data_lancamento: "desc" }
      }),
      prisma.lancamentoFinanceiro.count({ where: onde })
    ]);

    return { lancamentos, total };
  }

  async buscarPorId(id: number) {
    return prisma.lancamentoFinanceiro.findUnique({ where: { id } });
  }

  async criar(dados: DadosCriarLancamento) {
    return prisma.lancamentoFinanceiro.create({
      data: {
        tipo: dados.tipo,
        descricao: dados.descricao,
        valor: new Prisma.Decimal(dados.valor.toFixed(2)),
        data_lancamento: dados.data_lancamento ? new Date(dados.data_lancamento) : new Date(),
        categoria: dados.categoria,
        observacao: dados.observacao,
        tipo_referencia: "MANUAL"
      }
    });
  }

  async atualizar(id: number, dados: DadosAtualizarLancamento) {
    return prisma.lancamentoFinanceiro.update({
      where: { id },
      data: {
        tipo: dados.tipo,
        descricao: dados.descricao,
        valor: dados.valor !== undefined ? new Prisma.Decimal(dados.valor.toFixed(2)) : undefined,
        data_lancamento: dados.data_lancamento ? new Date(dados.data_lancamento) : undefined,
        categoria: dados.categoria,
        observacao: dados.observacao
      }
    });
  }

  async excluir(id: number) {
    await prisma.lancamentoFinanceiro.delete({ where: { id } });
  }

  async calcularResumo(filtros: FiltrosResumoFinanceiro): Promise<ResumoFinanceiro> {
    const onde: Prisma.LancamentoFinanceiroWhereInput = {};

    if (filtros.categoria) {
      onde.categoria = { contains: filtros.categoria };
    }
    if (filtros.tipo && (filtros.tipo === "ENTRADA" || filtros.tipo === "SAIDA")) {
      onde.tipo = filtros.tipo;
    }

    const dataFiltro = this.montarClausulaData(filtros.data_inicio, filtros.data_fim);
    if (dataFiltro) {
      onde.data_lancamento = dataFiltro;
    }

    const agrupamento = await prisma.lancamentoFinanceiro.groupBy({
      by: ["tipo"],
      where: onde,
      _sum: {
        valor: true
      }
    });

    let totalEntradas = 0;
    let totalSaidas = 0;

    agrupamento.forEach((grupo) => {
      const valor = grupo._sum.valor ? Number(grupo._sum.valor) : 0;
      if (grupo.tipo === "ENTRADA") {
        totalEntradas += valor;
      } else if (grupo.tipo === "SAIDA") {
        totalSaidas += valor;
      }
    });

    const totalEntradasFormatado = Number(totalEntradas.toFixed(2));
    const totalSaidasFormatado = Number(totalSaidas.toFixed(2));
    const saldo = Number((totalEntradasFormatado - totalSaidasFormatado).toFixed(2));

    return {
      total_entradas: totalEntradasFormatado,
      total_saidas: totalSaidasFormatado,
      saldo,
      saldo_atual: saldo
    };
  }
}
