import { requisicaoApi } from "./api.js";
import {
  FiltrosRelatorioCompras,
  FiltrosRelatorioFinanceiro,
  FiltrosRelatorioVendas,
  RespostaRelatorioCompras,
  RespostaRelatorioFinanceiro,
  RespostaRelatorioVendas
} from "../tipos/relatorios.js";

export async function obterRelatorioVendas(
  filtros: FiltrosRelatorioVendas = {}
): Promise<RespostaRelatorioVendas> {
  const parametros = new URLSearchParams();

  if (filtros.periodo) parametros.append("periodo", filtros.periodo);
  if (filtros.data_inicio) parametros.append("data_inicio", filtros.data_inicio);
  if (filtros.data_fim) parametros.append("data_fim", filtros.data_fim);
  if (filtros.produto_id) parametros.append("produto_id", filtros.produto_id.toString());
  if (filtros.cliente_id) parametros.append("cliente_id", filtros.cliente_id.toString());
  if (filtros.pagina) parametros.append("pagina", filtros.pagina.toString());
  if (filtros.limite) parametros.append("limite", filtros.limite.toString());

  const query = parametros.toString() ? `?${parametros.toString()}` : "";
  return requisicaoApi<RespostaRelatorioVendas>(`/relatorios/vendas${query}`);
}

export async function obterRelatorioCompras(
  filtros: FiltrosRelatorioCompras = {}
): Promise<RespostaRelatorioCompras> {
  const parametros = new URLSearchParams();

  if (filtros.periodo) parametros.append("periodo", filtros.periodo);
  if (filtros.data_inicio) parametros.append("data_inicio", filtros.data_inicio);
  if (filtros.data_fim) parametros.append("data_fim", filtros.data_fim);
  if (filtros.produto_id) parametros.append("produto_id", filtros.produto_id.toString());
  if (filtros.fornecedor_id) parametros.append("fornecedor_id", filtros.fornecedor_id.toString());
  if (filtros.pagina) parametros.append("pagina", filtros.pagina.toString());
  if (filtros.limite) parametros.append("limite", filtros.limite.toString());

  const query = parametros.toString() ? `?${parametros.toString()}` : "";
  return requisicaoApi<RespostaRelatorioCompras>(`/relatorios/compras${query}`);
}

export async function obterRelatorioFinanceiro(
  filtros: FiltrosRelatorioFinanceiro = {}
): Promise<RespostaRelatorioFinanceiro> {
  const parametros = new URLSearchParams();

  if (filtros.periodo) parametros.append("periodo", filtros.periodo);
  if (filtros.data_inicio) parametros.append("data_inicio", filtros.data_inicio);
  if (filtros.data_fim) parametros.append("data_fim", filtros.data_fim);
  if (filtros.tipo && filtros.tipo !== "TODOS") parametros.append("tipo", filtros.tipo);
  if (filtros.categoria) parametros.append("categoria", filtros.categoria);
  if (filtros.pagina) parametros.append("pagina", filtros.pagina.toString());
  if (filtros.limite) parametros.append("limite", filtros.limite.toString());

  const query = parametros.toString() ? `?${parametros.toString()}` : "";
  return requisicaoApi<RespostaRelatorioFinanceiro>(`/relatorios/financeiro${query}`);
}

export const servicoRelatorios = {
  obterRelatorioVendas,
  obterRelatorioCompras,
  obterRelatorioFinanceiro
};
