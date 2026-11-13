import { requisicaoApi } from "./api.js";
import { DashboardResumo, FiltrosDashboard } from "../tipos/dashboard.js";

export async function obterResumoDashboard(
  filtros: FiltrosDashboard = {}
): Promise<DashboardResumo> {
  const parametros = new URLSearchParams();

  if (filtros.periodo) parametros.append("periodo", filtros.periodo);
  if (filtros.data_inicio) parametros.append("data_inicio", filtros.data_inicio);
  if (filtros.data_fim) parametros.append("data_fim", filtros.data_fim);
  if (filtros.limite_operacoes) {
    parametros.append("limite_operacoes", filtros.limite_operacoes.toString());
  }

  const query = parametros.toString() ? `?${parametros.toString()}` : "";
  return requisicaoApi<DashboardResumo>(`/dashboard/resumo${query}`);
}

export const servicoDashboard = {
  obterResumoDashboard
};
