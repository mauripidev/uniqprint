export interface Produto {
  id: number;
  descricao: string;
  quantidade_estoque: number;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface DadosCriarProduto {
  descricao: string;
  quantidade_estoque?: number;
}

export interface DadosAtualizarProduto {
  descricao?: string;
  ativo?: boolean;
}

export interface FiltrosConsultarProdutos {
  pagina?: number;
  limite?: number;
  busca?: string;
  ativo?: "true" | "false" | "todos";
}

export interface PaginacaoInfo {
  pagina: number;
  limite: number;
  total: number;
  total_paginas: number;
}

export interface RespostaListagemProdutos {
  dados: Produto[];
  paginacao: PaginacaoInfo;
}

export interface RespostaProdutoUnico {
  dados: Produto;
  mensagem: string;
}
