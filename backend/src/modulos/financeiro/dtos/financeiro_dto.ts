import { z } from "zod";

export const schemaConsultarLancamentos = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  categoria: z.string().optional(),
  tipo: z.enum(["ENTRADA", "SAIDA"]).optional(),
});

export type RequisicaoConsultarLancamentos = z.infer<typeof schemaConsultarLancamentos>;

export const schemaCriarLancamento = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA"], { required_error: "O tipo é obrigatório" }),
  descricao: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),
  valor: z.coerce.number().positive("O valor deve ser maior que zero"),
  data_lancamento: z.string().optional(),
  categoria: z.string().min(2, "A categoria deve ter pelo menos 2 caracteres"),
  observacao: z.string().optional(),
});

export type RequisicaoCriarLancamento = z.infer<typeof schemaCriarLancamento>;

export const schemaAtualizarLancamento = schemaCriarLancamento.partial();

export type RequisicaoAtualizarLancamento = z.infer<typeof schemaAtualizarLancamento>;

export interface LancamentoResposta {
  id: number;
  tipo: string;
  descricao: string;
  valor: number;
  data_lancamento: Date;
  categoria: string;
  tipo_referencia: string | null;
  referencia_id: number | null;
  observacao: string | null;
  criado_em: Date;
}
