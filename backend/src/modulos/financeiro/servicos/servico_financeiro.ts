import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import {
  RequisicaoConsultarLancamentos,
  RequisicaoCriarLancamento,
  RequisicaoAtualizarLancamento
} from "../dtos/financeiro_dto.js";
import {
  RepositorioFinanceiro,
  RepositorioFinanceiroPrisma
} from "../repositorios/repositorio_financeiro.js";

export class ServicoFinanceiro {
  constructor(private repositorio: RepositorioFinanceiro = new RepositorioFinanceiroPrisma()) {}

  async listar(filtros: RequisicaoConsultarLancamentos) {
    const { pagina, limite, data_inicio, data_fim, categoria, tipo } = filtros;
    
    const { lancamentos, total } = await this.repositorio.listar({
      pagina,
      limite,
      data_inicio,
      data_fim,
      categoria,
      tipo
    });

    const resumo = await this.repositorio.calcularResumo({ data_inicio, data_fim });
    const totalPaginas = Math.ceil(total / limite) || 1;

    return {
      dados: lancamentos.map(l => ({
        id: l.id,
        tipo: l.tipo,
        descricao: l.descricao,
        valor: Number(l.valor),
        data_lancamento: l.data_lancamento,
        categoria: l.categoria,
        tipo_referencia: l.tipo_referencia,
        referencia_id: l.referencia_id,
        observacao: l.observacao,
        criado_em: l.criado_em
      })),
      resumo,
      paginacao: {
        pagina,
        limite,
        total,
        total_paginas: totalPaginas
      }
    };
  }

  async buscarPorId(id: number) {
    const lancamento = await this.repositorio.buscarPorId(id);
    if (!lancamento) {
      throw new ErroAplicacao("Lançamento não encontrado", "LANCAMENTO_NAO_ENCONTRADO", 404);
    }
    return {
      ...lancamento,
      valor: Number(lancamento.valor)
    };
  }

  async criar(dados: RequisicaoCriarLancamento) {
    const lancamento = await this.repositorio.criar(dados);
    return {
      ...lancamento,
      valor: Number(lancamento.valor)
    };
  }

  async atualizar(id: number, dados: RequisicaoAtualizarLancamento) {
    const lancamentoExistente = await this.repositorio.buscarPorId(id);
    if (!lancamentoExistente) {
      throw new ErroAplicacao("Lançamento não encontrado", "LANCAMENTO_NAO_ENCONTRADO", 404);
    }

    if (lancamentoExistente.tipo_referencia && lancamentoExistente.tipo_referencia !== "MANUAL") {
      throw new ErroAplicacao(
        "Não é possível editar um lançamento gerado automaticamente",
        "LANCAMENTO_AUTOMATICO",
        400
      );
    }

    const lancamentoAtualizado = await this.repositorio.atualizar(id, dados);
    return {
      ...lancamentoAtualizado,
      valor: Number(lancamentoAtualizado.valor)
    };
  }

  async excluir(id: number) {
    const lancamentoExistente = await this.repositorio.buscarPorId(id);
    if (!lancamentoExistente) {
      throw new ErroAplicacao("Lançamento não encontrado", "LANCAMENTO_NAO_ENCONTRADO", 404);
    }

    if (lancamentoExistente.tipo_referencia && lancamentoExistente.tipo_referencia !== "MANUAL") {
      throw new ErroAplicacao(
        "Não é possível excluir um lançamento gerado automaticamente",
        "LANCAMENTO_AUTOMATICO",
        400
      );
    }

    await this.repositorio.excluir(id);
  }
}
