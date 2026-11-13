import { api } from "./api.js";
import {
  DadosCriarLancamentoFinanceiro,
  DadosAtualizarLancamentoFinanceiro,
  FiltrosLancamentosFinanceiros,
  LancamentoFinanceiro,
  RespostaPaginadaFinanceiro,
  ResumoFinanceiro
} from "../tipos/financeiro.js";

export const servicoFinanceiro = {
  listar: async (filtros?: FiltrosLancamentosFinanceiros): Promise<RespostaPaginadaFinanceiro> => {
    const resposta = await api.get("/api/lancamentos-financeiros", { params: filtros });
    return resposta.data;
  },

  listarLancamentos: async (filtros?: FiltrosLancamentosFinanceiros): Promise<RespostaPaginadaFinanceiro> => {
    return servicoFinanceiro.listar(filtros);
  },

  buscarPorId: async (id: number): Promise<LancamentoFinanceiro> => {
    const resposta = await api.get(`/api/lancamentos-financeiros/${id}`);
    return resposta.data;
  },

  buscarLancamento: async (id: number): Promise<LancamentoFinanceiro> => {
    return servicoFinanceiro.buscarPorId(id);
  },

  criar: async (dados: DadosCriarLancamentoFinanceiro): Promise<LancamentoFinanceiro> => {
    const resposta = await api.post("/api/lancamentos-financeiros", dados);
    return resposta.data;
  },

  criarLancamento: async (dados: DadosCriarLancamentoFinanceiro): Promise<LancamentoFinanceiro> => {
    return servicoFinanceiro.criar(dados);
  },

  atualizar: async (id: number, dados: DadosAtualizarLancamentoFinanceiro): Promise<LancamentoFinanceiro> => {
    const resposta = await api.put(`/api/lancamentos-financeiros/${id}`, dados);
    return resposta.data;
  },

  atualizarLancamento: async (id: number, dados: DadosAtualizarLancamentoFinanceiro): Promise<LancamentoFinanceiro> => {
    return servicoFinanceiro.atualizar(id, dados);
  },

  excluir: async (id: number): Promise<void> => {
    await api.delete(`/api/lancamentos-financeiros/${id}`);
  },

  excluirLancamento: async (id: number): Promise<void> => {
    return servicoFinanceiro.excluir(id);
  },

  buscarSaldo: async (filtros?: FiltrosLancamentosFinanceiros): Promise<ResumoFinanceiro> => {
    const resposta = await api.get("/api/lancamentos-financeiros/saldo", { params: filtros });
    return resposta.data;
  }
};
