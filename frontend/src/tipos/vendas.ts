export interface Venda {
  id: number;
  data_venda: string;
  cliente_id: number;
  cliente: {
    id: number;
    nome: string;
  };
  produto_id: number;
  produto: {
    id: number;
    descricao: string;
  };
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  criado_em: string;
  atualizado_em: string;
}

export interface DadosRegistrarVenda {
  cliente_id: number;
  produto_id: number;
  quantidade: number;
  valor_unitario: number;
  data_venda?: string;
}

export interface FiltrosConsultarVendas {
  pagina?: number;
  limite?: number;
  data_inicio?: string;
  data_fim?: string;
  cliente_id?: number;
  produto_id?: number;
}

export interface PaginacaoInfo {
  pagina: number;
  limite: number;
  total: number;
  total_paginas: number;
}

export interface RespostaListagemVendas {
  dados: Venda[];
  paginacao: PaginacaoInfo;
}

export interface RespostaVendaUnica {
  dados: Venda;
  mensagem?: string;
}
