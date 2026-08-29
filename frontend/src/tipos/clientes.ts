export interface Cliente {
  id: number;
  nome: string;
  telefone: string | null;
  observacao: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface DadosCriarCliente {
  nome: string;
  telefone?: string;
  observacao?: string;
}

export interface DadosAtualizarCliente {
  nome?: string;
  telefone?: string;
  observacao?: string;
  ativo?: boolean;
}

export interface FiltrosConsultarClientes {
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

export interface RespostaListagemClientes {
  dados: Cliente[];
  paginacao: PaginacaoInfo;
}

export interface RespostaClienteUnico {
  dados: Cliente;
  mensagem: string;
}
