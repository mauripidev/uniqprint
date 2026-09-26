import { requisicaoApi } from "./api.js";
import {
  DadosRegistrarAjuste,
  FiltrosEstoque,
  FiltrosMovimentacoes,
  ItemEstoque,
  MovimentacaoEstoque,
  RespostaPaginada
} from "../tipos/estoque.js";

export async function listarEstoque(
  filtros: FiltrosEstoque = {}
): Promise<RespostaPaginada<ItemEstoque>> {
  const parametros = new URLSearchParams();

  if (filtros.pagina) parametros.append("pagina", filtros.pagina.toString());
  if (filtros.limite) parametros.append("limite", filtros.limite.toString());
  if (filtros.busca) parametros.append("busca", filtros.busca);
  if (filtros.status) parametros.append("status", filtros.status);

  const query = parametros.toString() ? `?${parametros.toString()}` : "";
  return requisicaoApi<RespostaPaginada<ItemEstoque>>(`/estoque${query}`);
}

export async function listarMovimentacoes(
  filtros: FiltrosMovimentacoes = {}
): Promise<RespostaPaginada<MovimentacaoEstoque>> {
  const parametros = new URLSearchParams();

  if (filtros.pagina) parametros.append("pagina", filtros.pagina.toString());
  if (filtros.limite) parametros.append("limite", filtros.limite.toString());
  if (filtros.produto_id) parametros.append("produto_id", filtros.produto_id.toString());
  if (filtros.tipo) parametros.append("tipo", filtros.tipo);
  if (filtros.data_inicio) parametros.append("data_inicio", filtros.data_inicio);
  if (filtros.data_fim) parametros.append("data_fim", filtros.data_fim);

  const query = parametros.toString() ? `?${parametros.toString()}` : "";
  return requisicaoApi<RespostaPaginada<MovimentacaoEstoque>>(`/estoque/movimentacoes${query}`);
}

export async function registrarAjuste(dados: DadosRegistrarAjuste): Promise<any> {
  return requisicaoApi<any>("/estoque/ajustes", {
    method: "POST",
    body: JSON.stringify(dados)
  });
}

export const servicoEstoque = {
  listarEstoque,
  listarMovimentacoes,
  registrarAjuste
};
