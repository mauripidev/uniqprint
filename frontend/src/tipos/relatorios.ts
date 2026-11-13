export type PeriodoRelatorio = "semana" | "mes" | "personalizado";

export interface FiltrosRelatorioVendas {
  periodo?: PeriodoRelatorio;
  data_inicio?: string;
  data_fim?: string;
  produto_id?: number;
  cliente_id?: number;
  pagina?: number;
  limite?: number;
}

export interface ResumoVendasResposta {
  total_vendas: number;
  valor_total_vendido: number;
  ticket_medio: number;
  quantidade_itens: number;
}

export interface ItemDetalhamentoVenda {
  id: number;
  data_venda: string;
  cliente_id: number;
  cliente_nome: string;
  produto_id: number;
  produto_descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface RespostaRelatorioVendas {
  resumo: ResumoVendasResposta;
  filtros_aplicados: {
    periodo?: string;
    data_inicio?: string;
    data_fim?: string;
    produto_id?: number;
    cliente_id?: number;
  };
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  };
  dados: ItemDetalhamentoVenda[];
}

export interface FiltrosRelatorioCompras {
  periodo?: PeriodoRelatorio;
  data_inicio?: string;
  data_fim?: string;
  produto_id?: number;
  fornecedor_id?: number;
  pagina?: number;
  limite?: number;
}

export interface ResumoComprasResposta {
  total_compras: number;
  valor_total_comprado: number;
  media_por_compra: number;
  quantidade_itens: number;
}

export interface ItemDetalhamentoCompra {
  id: number;
  data_compra: string;
  fornecedor_id: number;
  fornecedor_nome: string;
  produto_id: number;
  produto_descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface RespostaRelatorioCompras {
  resumo: ResumoComprasResposta;
  filtros_aplicados: {
    periodo?: string;
    data_inicio?: string;
    data_fim?: string;
    produto_id?: number;
    fornecedor_id?: number;
  };
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  };
  dados: ItemDetalhamentoCompra[];
}

export interface FiltrosRelatorioFinanceiro {
  periodo?: PeriodoRelatorio;
  data_inicio?: string;
  data_fim?: string;
  tipo?: "ENTRADA" | "SAIDA" | "TODOS";
  categoria?: string;
  pagina?: number;
  limite?: number;
}

export interface ResumoFinanceiroResposta {
  total_entradas: number;
  total_saidas: number;
  saldo: number;
  quantidade_entradas: number;
  quantidade_saidas: number;
  media_entradas: number;
  media_saidas: number;
}

export interface ItemDetalhamentoFinanceiro {
  id: number;
  tipo: "ENTRADA" | "SAIDA";
  descricao: string;
  valor: number;
  data_lancamento: string;
  categoria: string;
  tipo_referencia: string | null;
  referencia_id: number | null;
  observacao: string | null;
}

export interface RespostaRelatorioFinanceiro {
  resumo: ResumoFinanceiroResposta;
  filtros_aplicados: {
    periodo?: string;
    data_inicio?: string;
    data_fim?: string;
    tipo?: string;
    categoria?: string;
  };
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  };
  dados: ItemDetalhamentoFinanceiro[];
}
