export interface UsuarioAuditoria {
  id: number;
  nome: string;
  email: string;
}

export interface RegistroAuditoria {
  id: number;
  usuario_id: number | null;
  usuario?: UsuarioAuditoria | null;
  acao: string;
  entidade: string;
  entidade_id: number | null;
  dados: Record<string, any> | null;
  criado_em: string;
}

export interface PaginacaoAuditoria {
  pagina: number;
  limite: number;
  total: number;
  total_paginas: number;
}

export interface RespostaListagemAuditoria {
  dados: RegistroAuditoria[];
  paginacao: PaginacaoAuditoria;
}

export interface FiltrosAuditoria {
  pagina?: number;
  limite?: number;
  data_inicio?: string;
  data_fim?: string;
  usuario_id?: number;
  acao?: string;
  entidade?: string;
}
