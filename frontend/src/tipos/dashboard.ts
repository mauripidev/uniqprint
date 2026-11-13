export interface DashboardVendas {
  total_vendas: number;
  valor_total: number;
  quantidade_itens: number;
}

export interface DashboardCompras {
  total_compras: number;
  valor_total: number;
  quantidade_itens: number;
}

export interface DashboardFinanceiro {
  entradas: number;
  saidas: number;
  saldo: number;
  quantidade_entradas: number;
  quantidade_saidas: number;
}

export interface ProdutoEstoqueCritico {
  id: number;
  descricao: string;
  quantidade_estoque: number;
  status: "baixo" | "sem_estoque";
}

export interface DashboardEstoque {
  total_produtos: number;
  produtos_estoque_baixo: number;
  produtos_criticos: ProdutoEstoqueCritico[];
}

export interface DashboardOperacao {
  id: number;
  tipo: "VENDA" | "COMPRA";
  descricao: string;
  identificador: string;
  data: string;
  valor: number;
  detalhe?: string;
}

export interface DashboardPeriodoInfo {
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface DashboardResumo {
  vendas: DashboardVendas;
  compras: DashboardCompras;
  financeiro: DashboardFinanceiro;
  estoque: DashboardEstoque;
  ultimas_operacoes: DashboardOperacao[];
  ultimasOperacoes?: DashboardOperacao[];
  periodo: DashboardPeriodoInfo;
}

export interface FiltrosDashboard {
  periodo?: "hoje" | "semana" | "mes" | "ano" | "todos" | "personalizado";
  data_inicio?: string;
  data_fim?: string;
  limite_operacoes?: number;
}
