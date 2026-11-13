import {
  RequisicaoRelatorioCompras,
  RequisicaoRelatorioFinanceiro,
  RequisicaoRelatorioVendas,
  RespostaRelatorioCompras,
  RespostaRelatorioFinanceiro,
  RespostaRelatorioVendas
} from "../dtos/relatorios_dto.js";
import {
  RepositorioRelatorios,
  RepositorioRelatoriosPrisma
} from "../repositorios/repositorio_relatorios.js";
import { resolverIntervaloPeriodo } from "../compartilhado/utilitarios_periodo.js";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";

export class ServicoRelatorios {
  constructor(
    private repositorio: RepositorioRelatorios = new RepositorioRelatoriosPrisma()
  ) {}

  async obterRelatorioVendas(
    dados: RequisicaoRelatorioVendas,
    dataReferencia: Date = new Date()
  ): Promise<RespostaRelatorioVendas> {
    const { data_inicio, data_fim, periodo_resolvido } = resolverIntervaloPeriodo(
      dados.periodo,
      dados.data_inicio,
      dados.data_fim,
      dataReferencia
    );

    if (data_inicio && data_fim && data_inicio > data_fim) {
      throw new ErroAplicacao(
        "A data inicial não pode ser posterior à data final",
        "DATAS_INVALIDAS",
        400
      );
    }

    const { resumo, dados: listaVendas, total } =
      await this.repositorio.obterRelatorioVendas({
        data_inicio,
        data_fim,
        produto_id: dados.produto_id,
        cliente_id: dados.cliente_id,
        pagina: dados.pagina,
        limite: dados.limite
      });

    const totalPaginas = Math.ceil(total / dados.limite) || 1;

    return {
      resumo,
      filtros_aplicados: {
        periodo: periodo_resolvido,
        data_inicio: data_inicio ? data_inicio.toISOString() : undefined,
        data_fim: data_fim ? data_fim.toISOString() : undefined,
        produto_id: dados.produto_id,
        cliente_id: dados.cliente_id
      },
      paginacao: {
        pagina: dados.pagina,
        limite: dados.limite,
        total,
        total_paginas: totalPaginas
      },
      dados: listaVendas
    };
  }

  async obterRelatorioCompras(
    dados: RequisicaoRelatorioCompras,
    dataReferencia: Date = new Date()
  ): Promise<RespostaRelatorioCompras> {
    const { data_inicio, data_fim, periodo_resolvido } = resolverIntervaloPeriodo(
      dados.periodo,
      dados.data_inicio,
      dados.data_fim,
      dataReferencia
    );

    if (data_inicio && data_fim && data_inicio > data_fim) {
      throw new ErroAplicacao(
        "A data inicial não pode ser posterior à data final",
        "DATAS_INVALIDAS",
        400
      );
    }

    const { resumo, dados: listaCompras, total } =
      await this.repositorio.obterRelatorioCompras({
        data_inicio,
        data_fim,
        produto_id: dados.produto_id,
        fornecedor_id: dados.fornecedor_id,
        pagina: dados.pagina,
        limite: dados.limite
      });

    const totalPaginas = Math.ceil(total / dados.limite) || 1;

    return {
      resumo,
      filtros_aplicados: {
        periodo: periodo_resolvido,
        data_inicio: data_inicio ? data_inicio.toISOString() : undefined,
        data_fim: data_fim ? data_fim.toISOString() : undefined,
        produto_id: dados.produto_id,
        fornecedor_id: dados.fornecedor_id
      },
      paginacao: {
        pagina: dados.pagina,
        limite: dados.limite,
        total,
        total_paginas: totalPaginas
      },
      dados: listaCompras
    };
  }

  async obterRelatorioFinanceiro(
    dados: RequisicaoRelatorioFinanceiro,
    dataReferencia: Date = new Date()
  ): Promise<RespostaRelatorioFinanceiro> {
    const { data_inicio, data_fim, periodo_resolvido } = resolverIntervaloPeriodo(
      dados.periodo,
      dados.data_inicio,
      dados.data_fim,
      dataReferencia
    );

    if (data_inicio && data_fim && data_inicio > data_fim) {
      throw new ErroAplicacao(
        "A data inicial não pode ser posterior à data final",
        "DATAS_INVALIDAS",
        400
      );
    }

    const { resumo, dados: listaLancamentos, total } =
      await this.repositorio.obterRelatorioFinanceiro({
        data_inicio,
        data_fim,
        tipo: dados.tipo,
        categoria: dados.categoria,
        pagina: dados.pagina,
        limite: dados.limite
      });

    const totalPaginas = Math.ceil(total / dados.limite) || 1;

    return {
      resumo,
      filtros_aplicados: {
        periodo: periodo_resolvido,
        data_inicio: data_inicio ? data_inicio.toISOString() : undefined,
        data_fim: data_fim ? data_fim.toISOString() : undefined,
        tipo: dados.tipo,
        categoria: dados.categoria
      },
      paginacao: {
        pagina: dados.pagina,
        limite: dados.limite,
        total,
        total_paginas: totalPaginas
      },
      dados: listaLancamentos
    };
  }
}
