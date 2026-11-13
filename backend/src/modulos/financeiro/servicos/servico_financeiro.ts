import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import {
  RequisicaoConsultarLancamentos,
  RequisicaoConsultarSaldo,
  RequisicaoCriarLancamento,
  RequisicaoAtualizarLancamento
} from "../dtos/financeiro_dto.js";
import {
  RepositorioFinanceiro,
  RepositorioFinanceiroPrisma
} from "../repositorios/repositorio_financeiro.js";
import { ServicoAuditoria } from "../../auditoria/servicos/servico_auditoria.js";

export class ServicoFinanceiro {
  constructor(
    private repositorio: RepositorioFinanceiro = new RepositorioFinanceiroPrisma(),
    private servicoAuditoria: ServicoAuditoria = new ServicoAuditoria()
  ) {}

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

    const resumo = await this.repositorio.calcularResumo({
      data_inicio,
      data_fim,
      categoria,
      tipo
    });

    const totalPaginas = Math.ceil(total / limite) || 1;

    return {
      dados: lancamentos.map((l) => ({
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

  async calcularSaldo(filtros: RequisicaoConsultarSaldo) {
    return this.repositorio.calcularResumo(filtros);
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

  async criar(dados: RequisicaoCriarLancamento, usuarioId?: number) {
    const lancamento = await this.repositorio.criar(dados);

    await this.servicoAuditoria.registrarAuditoria({
      usuario_id: usuarioId ?? null,
      acao: "CRIAR_LANCAMENTO_FINANCEIRO",
      entidade: "LANCAMENTO_FINANCEIRO",
      entidade_id: lancamento.id,
      dados: {
        tipo: lancamento.tipo,
        descricao: lancamento.descricao,
        valor: Number(lancamento.valor),
        categoria: lancamento.categoria
      }
    });

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
        "Lançamento automático não pode ser alterado manualmente.",
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
        "Lançamento automático não pode ser excluído.",
        "LANCAMENTO_AUTOMATICO",
        400
      );
    }

    await this.repositorio.excluir(id);
  }
}
