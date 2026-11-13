import { z } from "zod";

export const schemaConsultarLancamentos = z
  .object({
    pagina: z.coerce.number().int().min(1).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limite: z.coerce.number().int().min(1).max(100).default(20),
    data_inicio: z.string().optional(),
    data_fim: z.string().optional(),
    dataInicial: z.string().optional(),
    dataFinal: z.string().optional(),
    categoria: z.string().optional(),
    tipo: z.enum(["ENTRADA", "SAIDA", "TODOS"]).optional()
  })
  .transform((dados) => {
    return {
      pagina: dados.pagina || dados.page || 1,
      limite: dados.limite || 20,
      data_inicio: dados.data_inicio || dados.dataInicial,
      data_fim: dados.data_fim || dados.dataFinal,
      categoria: dados.categoria,
      tipo: dados.tipo === "TODOS" ? undefined : dados.tipo
    };
  });

export type RequisicaoConsultarLancamentos = z.infer<typeof schemaConsultarLancamentos>;

export const schemaConsultarSaldo = z
  .object({
    data_inicio: z.string().optional(),
    data_fim: z.string().optional(),
    dataInicial: z.string().optional(),
    dataFinal: z.string().optional(),
    categoria: z.string().optional(),
    tipo: z.enum(["ENTRADA", "SAIDA", "TODOS"]).optional()
  })
  .transform((dados) => {
    return {
      data_inicio: dados.data_inicio || dados.dataInicial,
      data_fim: dados.data_fim || dados.dataFinal,
      categoria: dados.categoria,
      tipo: dados.tipo === "TODOS" ? undefined : dados.tipo
    };
  });

export type RequisicaoConsultarSaldo = z.infer<typeof schemaConsultarSaldo>;

export const schemaCriarLancamento = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA"], {
    required_error: "O tipo é obrigatório",
    invalid_type_error: "Tipo de lançamento inválido"
  }),
  descricao: z
    .string({ required_error: "A descrição é obrigatória" })
    .min(3, "A descrição deve ter pelo menos 3 caracteres"),
  valor: z.coerce
    .number({ required_error: "O valor é obrigatório", invalid_type_error: "Valor inválido" })
    .positive("O valor deve ser maior que zero"),
  data_lancamento: z.string().optional(),
  categoria: z
    .string({ required_error: "A categoria é obrigatória" })
    .min(2, "A categoria deve ter pelo menos 2 caracteres"),
  observacao: z.string().optional().nullable()
});

export type RequisicaoCriarLancamento = z.infer<typeof schemaCriarLancamento>;

export const schemaAtualizarLancamento = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA"], { invalid_type_error: "Tipo de lançamento inválido" }).optional(),
  descricao: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres").optional(),
  valor: z.coerce.number().positive("O valor deve ser maior que zero").optional(),
  data_lancamento: z.string().optional(),
  categoria: z.string().min(2, "A categoria deve ter pelo menos 2 caracteres").optional(),
  observacao: z.string().optional().nullable()
});

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

export interface ResumoFinanceiroResposta {
  total_entradas: number;
  total_saidas: number;
  saldo: number;
  saldo_atual: number;
}
