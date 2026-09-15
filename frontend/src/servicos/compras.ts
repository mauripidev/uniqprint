import { requisicaoApi } from "./api.js";
import {
  Compra,
  DadosRegistrarCompra,
  FiltrosConsultarCompras,
  RespostaCompraUnica,
  RespostaListagemCompras
} from "../tipos/compras.js";

export async function listarCompras(
  filtros: FiltrosConsultarCompras = {}
): Promise<RespostaListagemCompras> {
  const parametros = new URLSearchParams();

  if (filtros.pagina) parametros.append("pagina", filtros.pagina.toString());
  if (filtros.limite) parametros.append("limite", filtros.limite.toString());
  if (filtros.data_inicio) parametros.append("data_inicio", filtros.data_inicio);
  if (filtros.data_fim) parametros.append("data_fim", filtros.data_fim);
  if (filtros.produto_id) parametros.append("produto_id", filtros.produto_id.toString());
  if (filtros.fornecedor_id) parametros.append("fornecedor_id", filtros.fornecedor_id.toString());

  const query = parametros.toString() ? `?${parametros.toString()}` : "";
  return requisicaoApi<RespostaListagemCompras>(`/compras${query}`);
}

export async function buscarCompraPorId(id: number): Promise<Compra> {
  const resposta = await requisicaoApi<RespostaCompraUnica>(`/compras/${id}`);
  return resposta.dados;
}

export async function registrarCompra(dados: DadosRegistrarCompra): Promise<Compra> {
  const resposta = await requisicaoApi<RespostaCompraUnica>("/compras", {
    method: "POST",
    body: JSON.stringify(dados)
  });
  return resposta.dados;
}
