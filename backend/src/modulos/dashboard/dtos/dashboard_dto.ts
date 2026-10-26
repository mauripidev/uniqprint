import { z } from "zod";

function validarOrdemDatas(dataInicio?: string, dataFim?: string): boolean {
  if (!dataInicio || !dataFim) return true;
  const dInicio = new Date(dataInicio);
  const dFim = new Date(dataFim);
  if (isNaN(dInicio.getTime()) || isNaN(dFim.getTime())) return true;
  return dInicio <= dFim;
}

export const schemaDashboardResumoQuery = z
  .object({
    periodo: z.enum(["hoje", "semana", "mes", "ano", "todos", "personalizado"]).optional(),
    data_inicio: z.string().optional(),
    data_fim: z.string().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    limite_operacoes: z.coerce.number().int().min(1).max(50).default(6)
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

export type RequisicaoDashboardResumo = z.infer<typeof schemaDashboardResumoQuery>;

export interface DashboardVendas {
  total_vendas: number;
  valor_total: number;
  quantidade_itens: number;
}

export interface DashboardCompras {
  total_compras: number;
  valor_total: number;
  quantidade_itens: number;
}

export interface DashboardFinanceiro {
  entradas: number;
  saidas: number;
  saldo: number;
  quantidade_entradas: number;
  quantidade_saidas: number;
}

export interface ProdutoEstoqueCritico {
  id: number;
  descricao: string;
  quantidade_estoque: number;
  status: "baixo" | "sem_estoque";
}

export interface DashboardEstoque {
  total_produtos: number;
  produtos_estoque_baixo: number;
  produtos_criticos: ProdutoEstoqueCritico[];
}

export interface DashboardOperacao {
  id: number;
  tipo: "VENDA" | "COMPRA";
  descricao: string;
  identificador: string;
  data: Date;
  valor: number;
  detalhe?: string;
}

export interface DashboardPeriodoInfo {
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface DashboardResumoResposta {
  vendas: DashboardVendas;
  compras: DashboardCompras;
  financeiro: DashboardFinanceiro;
  estoque: DashboardEstoque;
  ultimas_operacoes: DashboardOperacao[];
  ultimasOperacoes: DashboardOperacao[];
  periodo: DashboardPeriodoInfo;
}
