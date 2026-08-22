import "dotenv/config";
import { z } from "zod";

const schemaAmbiente = z.object({
  PORTA: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),
  AMBIENTE: z.enum(["development", "production", "test"]).default("development"),
  BANCO_DE_DADOS_URL: z.string().min(1, "A variável BANCO_DE_DADOS_URL é obrigatória"),
  JWT_SEGREDO: z.string().min(16, "A variável JWT_SEGREDO deve ter no mínimo 16 caracteres"),
  COOKIE_SEGREDO: z.string().min(16, "A variável COOKIE_SEGREDO deve ter no mínimo 16 caracteres"),
  ORIGEM_FRONTEND: z.string().default("http://localhost:5173")
});

const resultadoValidacao = schemaAmbiente.safeParse(process.env);

if (!resultadoValidacao.success) {
  console.error("❌ Configurações de ambiente inválidas:", resultadoValidacao.error.format());
  throw new Error("Configurações de ambiente inválidas. Corrija o arquivo .env");
}

export const configuracaoAmbiente = resultadoValidacao.data;
