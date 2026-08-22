import { z } from "zod";

export const schemaLogin = z.object({
  email: z
    .string({ required_error: "O e-mail é obrigatório" })
    .email("O formato do e-mail é inválido")
    .trim()
    .toLowerCase(),
  senha: z
    .string({ required_error: "A senha é obrigatória" })
    .min(1, "A senha é obrigatória")
});

export type RequisicaoLogin = z.infer<typeof schemaLogin>;

export const schemaCriarUsuario = z.object({
  email: z
    .string({ required_error: "O e-mail é obrigatório" })
    .email("O formato do e-mail é inválido")
    .trim()
    .toLowerCase(),
  senha: z
    .string({ required_error: "A senha é obrigatória" })
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
  nome: z
    .string({ required_error: "O nome é obrigatório" })
    .min(2, "O nome deve ter no mínimo 2 caracteres")
    .trim(),
  papel: z.enum(["ADMINISTRADOR", "USUARIO"]).default("USUARIO"),
  ativo: z.boolean().default(true)
});

export type RequisicaoCriarUsuario = z.infer<typeof schemaCriarUsuario>;

export interface UsuarioResposta {
  id: number;
  email: string;
  nome: string;
  papel: string;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
  ultimo_login_em: Date | null;
}
