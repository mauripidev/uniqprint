import { z } from "zod";

export const schemaCriarVenda = z.object({
  cliente_id: z.coerce
    .number({ required_error: "O cliente é obrigatório" })
    .int("O ID do cliente deve ser um número inteiro")
    .positive("O ID do cliente deve ser válido"),
  produto_id: z.coerce
    .number({ required_error: "O produto é obrigatório" })
    .int("O ID do produto deve ser um número inteiro")
    .positive("O ID do produto deve ser válido"),
  quantidade: z.coerce
    .number({ required_error: "A quantidade é obrigatória" })
    .int("A quantidade deve ser um número inteiro")
    .positive("A quantidade deve ser maior que zero"),
  valor_unitario: z.coerce
    .number({ required_error: "O valor unitário é obrigatório" })
    .positive("O valor unitário deve ser maior que zero"),
  data_venda: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
});

export type RequisicaoCriarVenda = z.infer<typeof schemaCriarVenda>;

export const schemaConsultarVendas = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  cliente_id: z.coerce.number().int().positive().optional(),
  produto_id: z.coerce.number().int().positive().optional()
});

export type RequisicaoConsultarVendas = z.infer<typeof schemaConsultarVendas>;

export interface VendaResposta {
  id: number;
  data_venda: Date;
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
  criado_em: Date;
  atualizado_em: Date;
}
