export interface LancamentoFinanceiro {
  id: number;
  tipo: "ENTRADA" | "SAIDA";
  descricao: string;
  valor: number;
  data_lancamento: string;
  categoria: string;
  tipo_referencia: string | null;
  referencia_id: number | null;
  observacao: string | null;
  criado_em: string;
}

export interface FiltrosLancamentosFinanceiros {
  pagina?: number;
  limite?: number;
  data_inicio?: string;
  data_fim?: string;
  categoria?: string;
  tipo?: "ENTRADA" | "SAIDA" | "TODOS";
}

export interface DadosCriarLancamentoFinanceiro {
  tipo: "ENTRADA" | "SAIDA";
  descricao: string;
  valor: number;
  data_lancamento?: string;
  categoria: string;
  observacao?: string;
}

export interface DadosAtualizarLancamentoFinanceiro extends Partial<DadosCriarLancamentoFinanceiro> {}

export interface ResumoFinanceiro {
  total_entradas: number;
  total_saidas: number;
  saldo_atual: number;
}

export interface RespostaPaginadaFinanceiro {
  dados: LancamentoFinanceiro[];
  resumo: ResumoFinanceiro;
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  };
}
