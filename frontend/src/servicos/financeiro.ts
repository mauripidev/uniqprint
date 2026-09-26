import { api } from "./api";
import {
  DadosCriarLancamentoFinanceiro,
  DadosAtualizarLancamentoFinanceiro,
  FiltrosLancamentosFinanceiros,
  LancamentoFinanceiro,
  RespostaPaginadaFinanceiro
} from "../tipos/financeiro";

export const servicoFinanceiro = {
  listar: async (filtros?: FiltrosLancamentosFinanceiros): Promise<RespostaPaginadaFinanceiro> => {
    const resposta = await api.get("/api/lancamentos-financeiros", { params: filtros });
    return resposta.data;
  },

  buscarPorId: async (id: number): Promise<LancamentoFinanceiro> => {
    const resposta = await api.get(`/api/lancamentos-financeiros/${id}`);
    return resposta.data;
  },

  criar: async (dados: DadosCriarLancamentoFinanceiro): Promise<LancamentoFinanceiro> => {
    const resposta = await api.post("/api/lancamentos-financeiros", dados);
    return resposta.data;
  },

  atualizar: async (id: number, dados: DadosAtualizarLancamentoFinanceiro): Promise<LancamentoFinanceiro> => {
    const resposta = await api.put(`/api/lancamentos-financeiros/${id}`, dados);
    return resposta.data;
  },

  excluir: async (id: number): Promise<void> => {
    await api.delete(`/api/lancamentos-financeiros/${id}`);
  }
};
