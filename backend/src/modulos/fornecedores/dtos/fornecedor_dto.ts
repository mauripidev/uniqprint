import { z } from "zod";

export const schemaCriarFornecedor = z.object({
  nome: z
    .string({ required_error: "O nome do fornecedor é obrigatório" })
    .trim()
    .min(1, "O nome do fornecedor não pode ficar vazio"),
  observacao: z.string().trim().optional()
});

export type RequisicaoCriarFornecedor = z.infer<typeof schemaCriarFornecedor>;

export const schemaAtualizarFornecedor = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "O nome do fornecedor não pode ficar vazio")
    .optional(),
  observacao: z.string().trim().optional(),
  ativo: z.boolean().optional()
});

export type RequisicaoAtualizarFornecedor = z.infer<typeof schemaAtualizarFornecedor>;

export const schemaConsultarFornecedores = z.object({
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

export type RequisicaoConsultarFornecedores = z.infer<typeof schemaConsultarFornecedores>;

export interface FornecedorResposta {
  id: number;
  nome: string;
  observacao: string | null;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}
