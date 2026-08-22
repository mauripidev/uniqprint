import { z } from "zod";

export const schemaCriarProduto = z.object({
  descricao: z
    .string({ required_error: "A descrição do produto é obrigatória" })
    .trim()
    .min(1, "A descrição do produto não pode ficar vazia"),
  quantidade_estoque: z
    .number({ invalid_type_error: "A quantidade de estoque deve ser um número" })
    .int("A quantidade de estoque deve ser um número inteiro")
    .min(0, "A quantidade de estoque não pode ser negativa")
    .default(0)
});

export type RequisicaoCriarProduto = z.infer<typeof schemaCriarProduto>;

export const schemaAtualizarProduto = z.object({
  descricao: z
    .string()
    .trim()
    .min(1, "A descrição do produto não pode ficar vazia")
    .optional(),
  ativo: z.boolean().optional()
});

export type RequisicaoAtualizarProduto = z.infer<typeof schemaAtualizarProduto>;

export const schemaConsultarProdutos = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().trim().optional(),
  ativo: z
    .enum(["true", "false", "todos"])
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    })
});

export type RequisicaoConsultarProdutos = z.infer<typeof schemaConsultarProdutos>;

export interface ProdutoResposta {
  id: number;
  descricao: string;
  quantidade_estoque: number;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}
