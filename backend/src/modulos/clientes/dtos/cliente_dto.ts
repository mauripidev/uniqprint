import { z } from "zod";

export const schemaCriarCliente = z.object({
  nome: z
    .string({ required_error: "O nome do cliente é obrigatório" })
    .trim()
    .min(1, "O nome do cliente não pode ficar vazio"),
  telefone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const digitos = val.replace(/\D/g, "");
        return digitos.length >= 8 && digitos.length <= 13;
      },
      { message: "Telefone inválido" }
    ),
  observacao: z.string().trim().optional()
});

export type RequisicaoCriarCliente = z.infer<typeof schemaCriarCliente>;

export const schemaAtualizarCliente = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "O nome do cliente não pode ficar vazio")
    .optional(),
  telefone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const digitos = val.replace(/\D/g, "");
        return digitos.length >= 8 && digitos.length <= 13;
      },
      { message: "Telefone inválido" }
    ),
  observacao: z.string().trim().optional(),
  ativo: z.boolean().optional()
});

export type RequisicaoAtualizarCliente = z.infer<typeof schemaAtualizarCliente>;

export const schemaConsultarClientes = z.object({
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

export type RequisicaoConsultarClientes = z.infer<typeof schemaConsultarClientes>;

export interface ClienteResposta {
  id: number;
  nome: string;
  telefone: string | null;
  observacao: string | null;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}
