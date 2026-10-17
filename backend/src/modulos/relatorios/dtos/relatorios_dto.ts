import { z } from "zod";

function validarOrdemDatas(dataInicio?: string, dataFim?: string): boolean {
  if (!dataInicio || !dataFim) return true;
  const dInicio = new Date(dataInicio);
  const dFim = new Date(dataFim);
  if (isNaN(dInicio.getTime()) || isNaN(dFim.getTime())) return true;
  return dInicio <= dFim;
}

export const schemaRelatorioVendasQuery = z
  .object({
    periodo: z.enum(["semana", "mes", "personalizado"]).optional(),
    data_inicio: z.string().optional(),
    data_fim: z.string().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    produto_id: z.coerce.number().int().positive().optional(),
    cliente_id: z.coerce.number().int().positive().optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(20)
  })
  .transform((dados) => {
    const data_inicio = dados.data_inicio || dados.dataInicio;
    const data_fim = dados.data_fim || dados.dataFim;
    return {
      ...dados,
      data_inicio,
      data_fim
    };
  })
  .refine(
    (dados) => validarOrdemDatas(dados.data_inicio, dados.data_fim),
    {
      message: "A data inicial não pode ser posterior à data final",
      path: ["data_inicio"]
    }
  );

export type RequisicaoRelatorioVendas = z.infer<typeof schemaRelatorioVendasQuery>;

export const schemaRelatorioComprasQuery = z
  .object({
    periodo: z.enum(["semana", "mes", "personalizado"]).optional(),
    data_inicio: z.string().optional(),
    data_fim: z.string().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    produto_id: z.coerce.number().int().positive().optional(),
    fornecedor_id: z.coerce.number().int().positive().optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(20)
  })
  .transform((dados) => {
    const data_inicio = dados.data_inicio || dados.dataInicio;
    const data_fim = dados.data_fim || dados.dataFim;
    return {
      ...dados,
      data_inicio,
      data_fim
    };
  })
  .refine(
    (dados) => validarOrdemDatas(dados.data_inicio, dados.data_fim),
    {
      message: "A data inicial não pode ser posterior à data final",
      path: ["data_inicio"]
    }
  );

export type RequisicaoRelatorioCompras = z.infer<typeof schemaRelatorioComprasQuery>;

export const schemaRelatorioFinanceiroQuery = z
  .object({
    periodo: z.enum(["semana", "mes", "personalizado"]).optional(),
    data_inicio: z.string().optional(),
    data_fim: z.string().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    tipo: z.enum(["ENTRADA", "SAIDA", "TODOS"]).optional(),
    categoria: z.string().optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(20)
  })
  .transform((dados) => {
    const data_inicio = dados.data_inicio || dados.dataInicio;
    const data_fim = dados.data_fim || dados.dataFim;
    return {
      ...dados,
      data_inicio,
      data_fim,
      tipo: dados.tipo === "TODOS" ? undefined : dados.tipo
    };
  })
  .refine(
    (dados) => validarOrdemDatas(dados.data_inicio, dados.data_fim),
    {
      message: "A data inicial não pode ser posterior à data final",
      path: ["data_inicio"]
    }
  );

export type RequisicaoRelatorioFinanceiro = z.infer<typeof schemaRelatorioFinanceiroQuery>;

export interface ResumoVendasResposta {
  total_vendas: number;
  valor_total_vendido: number;
  ticket_medio: number;
  quantidade_itens: number;
}

export interface ItemDetalhamentoVenda {
  id: number;
  data_venda: Date | string;
  cliente_id: number;
  cliente_nome: string;
  produto_id: number;
  produto_descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface RespostaRelatorioVendas {
  resumo: ResumoVendasResposta;
  filtros_aplicados: {
    periodo?: string;
    data_inicio?: string;
    data_fim?: string;
    produto_id?: number;
    cliente_id?: number;
  };
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  };
  dados: ItemDetalhamentoVenda[];
}

export interface ResumoComprasResposta {
  total_compras: number;
  valor_total_comprado: number;
  media_por_compra: number;
  quantidade_itens: number;
}

export interface ItemDetalhamentoCompra {
  id: number;
  data_compra: Date | string;
  fornecedor_id: number;
  fornecedor_nome: string;
  produto_id: number;
  produto_descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface RespostaRelatorioCompras {
  resumo: ResumoComprasResposta;
  filtros_aplicados: {
    periodo?: string;
    data_inicio?: string;
    data_fim?: string;
    produto_id?: number;
    fornecedor_id?: number;
  };
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  };
  dados: ItemDetalhamentoCompra[];
}

export interface ResumoFinanceiroResposta {
  total_entradas: number;
  total_saidas: number;
  saldo: number;
  quantidade_entradas: number;
  quantidade_saidas: number;
  media_entradas: number;
  media_saidas: number;
}

export interface ItemDetalhamentoFinanceiro {
  id: number;
  tipo: string;
  descricao: string;
  valor: number;
  data_lancamento: Date | string;
  categoria: string;
  tipo_referencia: string | null;
  referencia_id: number | null;
  observacao: string | null;
}

export interface RespostaRelatorioFinanceiro {
  resumo: ResumoFinanceiroResposta;
  filtros_aplicados: {
    periodo?: string;
    data_inicio?: string;
    data_fim?: string;
    tipo?: string;
    categoria?: string;
  };
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  };
  dados: ItemDetalhamentoFinanceiro[];
}
