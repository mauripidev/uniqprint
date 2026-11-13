export interface Compra {
  id: number;
  data_compra: string;
  produto_id: number;
  produto: {
    id: number;
    descricao: string;
  };
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  fornecedor_id: number;
  fornecedor: {
    id: number;
    nome: string;
  };
  criado_em: string;
  atualizado_em: string;
}

export interface DadosRegistrarCompra {
  produto_id: number;
  fornecedor_id: number;
  quantidade: number;
  valor_unitario: number;
  data_compra?: string;
}

export interface FiltrosConsultarCompras {
  pagina?: number;
  limite?: number;
  data_inicio?: string;
  data_fim?: string;
  produto_id?: number;
  fornecedor_id?: number;
}

export interface PaginacaoInfo {
  pagina: number;
  limite: number;
  total: number;
  total_paginas: number;
}

export interface RespostaListagemCompras {
  dados: Compra[];
  paginacao: PaginacaoInfo;
}

export interface RespostaCompraUnica {
  dados: Compra;
  mensagem?: string;
}
