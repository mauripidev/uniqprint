import { z } from "zod";

export const schemaCriarCompra = z.object({
  produto_id: z.coerce
    .number({ required_error: "O produto é obrigatório" })
    .int("O ID do produto deve ser um número inteiro")
    .positive("O ID do produto deve ser válido"),
  fornecedor_id: z.coerce
    .number({ required_error: "O fornecedor é obrigatório" })
    .int("O ID do fornecedor deve ser um número inteiro")
    .positive("O ID do fornecedor deve ser válido"),
  quantidade: z.coerce
    .number({ required_error: "A quantidade é obrigatória" })
    .int("A quantidade deve ser um número inteiro")
    .positive("A quantidade deve ser maior que zero"),
  valor_unitario: z.coerce
    .number({ required_error: "O valor unitário é obrigatório" })
    .positive("O valor unitário deve ser maior que zero"),
  data_compra: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
});

export type RequisicaoCriarCompra = z.infer<typeof schemaCriarCompra>;

export const schemaConsultarCompras = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  produto_id: z.coerce.number().int().positive().optional(),
  fornecedor_id: z.coerce.number().int().positive().optional()
});

export type RequisicaoConsultarCompras = z.infer<typeof schemaConsultarCompras>;

export interface CompraResposta {
  id: number;
  data_compra: Date;
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
  criado_em: Date;
  atualizado_em: Date;
}
