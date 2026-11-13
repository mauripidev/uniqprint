import { z } from "zod";

export const schemaConsultarAuditoria = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  usuario_id: z.coerce.number().int().positive().optional(),
  acao: z.string().trim().optional(),
  entidade: z.string().trim().optional()
});

export type RequisicaoConsultarAuditoria = z.infer<typeof schemaConsultarAuditoria>;

export interface RegistroAuditoriaResposta {
  id: number;
  usuario_id: number | null;
  usuario?: {
    id: number;
    nome: string;
    email: string;
  } | null;
  acao: string;
  entidade: string;
  entidade_id: number | null;
  dados: Record<string, any> | null;
  criado_em: Date | string;
}

export interface RespostaListagemAuditoria {
  dados: RegistroAuditoriaResposta[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  };
}
