export interface Fornecedor {
  id: number;
  nome: string;
  observacao: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface DadosCriarFornecedor {
  nome: string;
  observacao?: string;
}

export interface DadosAtualizarFornecedor {
  nome?: string;
  observacao?: string;
  ativo?: boolean;
}

export interface FiltrosConsultarFornecedores {
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

export interface RespostaListagemFornecedores {
  dados: Fornecedor[];
  paginacao: PaginacaoInfo;
}

export interface RespostaFornecedorUnico {
  dados: Fornecedor;
  mensagem: string;
}
