export interface ItemEstoque {
  id: number;
  descricao: string;
  quantidade_estoque: number;
  ativo: boolean;
  status: "normal" | "baixo" | "sem_estoque";
}

export interface MovimentacaoEstoque {
  id: number;
  produto_id: number;
  produto: {
    id: number;
    descricao: string;
  };
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE";
  quantidade: number;
  tipo_referencia: string | null;
  referencia_id: number | null;
  observacao: string | null;
  criado_em: string;
}

export interface DadosRegistrarAjuste {
  produto_id: number;
  tipo_ajuste: "ENTRADA" | "SAIDA";
  quantidade: number;
  observacao: string;
}

export interface FiltrosEstoque {
  pagina?: number;
  limite?: number;
  busca?: string;
  status?: "todos" | "normal" | "baixo" | "sem_estoque";
}

export interface FiltrosMovimentacoes {
  pagina?: number;
  limite?: number;
  produto_id?: number;
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface ResumoEstoque {
  total_produtos: number;
  estoque_baixo: number;
  sem_estoque: number;
}

export interface RespostaPaginada<T> {
  dados: T[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  };
  resumo?: ResumoEstoque;
}
