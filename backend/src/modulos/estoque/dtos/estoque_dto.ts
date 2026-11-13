import { z } from "zod";

// ==========================================
// Schemas de Consulta
// ==========================================

export const schemaConsultarEstoque = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().optional(),
  status: z.enum(["todos", "normal", "baixo", "sem_estoque"]).default("todos")
});

export type RequisicaoConsultarEstoque = z.infer<typeof schemaConsultarEstoque>;

export const schemaConsultarMovimentacoes = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  produto_id: z.coerce.number().int().positive().optional(),
  tipo: z.enum(["ENTRADA", "SAIDA", "AJUSTE"]).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional()
});

export type RequisicaoConsultarMovimentacoes = z.infer<typeof schemaConsultarMovimentacoes>;

// ==========================================
// Schema de Ajuste
// ==========================================

export const schemaRegistrarAjuste = z.object({
  produto_id: z.coerce
    .number({ required_error: "O produto é obrigatório" })
    .int("O ID do produto deve ser um número inteiro")
    .positive("O ID do produto deve ser válido"),
  tipo_ajuste: z.enum(["ENTRADA", "SAIDA"], {
    required_error: "O tipo de ajuste é obrigatório",
    invalid_type_error: "O tipo de ajuste deve ser ENTRADA ou SAIDA"
  }),
  quantidade: z.coerce
    .number({ required_error: "A quantidade é obrigatória" })
    .int("A quantidade deve ser um número inteiro")
    .positive("A quantidade deve ser maior que zero"),
  observacao: z
    .string({ required_error: "A justificativa é obrigatória" })
    .min(3, "A justificativa deve ter pelo menos 3 caracteres")
    .max(500, "A justificativa deve ter no máximo 500 caracteres")
});

export type RequisicaoRegistrarAjuste = z.infer<typeof schemaRegistrarAjuste>;

// ==========================================
// Interfaces de Resposta
// ==========================================

export interface ItemEstoqueResposta {
  id: number;
  descricao: string;
  quantidade_estoque: number;
  ativo: boolean;
  status: "normal" | "baixo" | "sem_estoque";
}

export interface ResumoEstoque {
  total_produtos: number;
  estoque_baixo: number;
  sem_estoque: number;
}

export interface MovimentacaoResposta {
  id: number;
  produto_id: number;
  produto: {
    id: number;
    descricao: string;
  };
  tipo: string;
  quantidade: number;
  tipo_referencia: string | null;
  referencia_id: number | null;
  observacao: string | null;
  criado_em: Date;
}

export interface AjusteResposta {
  id: number;
  produto_id: number;
  produto: {
    id: number;
    descricao: string;
  };
  tipo: string;
  quantidade: number;
  tipo_referencia: string;
  observacao: string;
  estoque_anterior: number;
  estoque_novo: number;
  criado_em: Date;
}
