import { requisicaoApi } from "./api.js";
import {
  DadosRegistrarVenda,
  FiltrosConsultarVendas,
  RespostaListagemVendas,
  RespostaVendaUnica,
  Venda
} from "../tipos/vendas.js";

export async function listarVendas(
  filtros: FiltrosConsultarVendas = {}
): Promise<RespostaListagemVendas> {
  const parametros = new URLSearchParams();

  if (filtros.pagina) parametros.append("pagina", filtros.pagina.toString());
  if (filtros.limite) parametros.append("limite", filtros.limite.toString());
  if (filtros.data_inicio) parametros.append("data_inicio", filtros.data_inicio);
  if (filtros.data_fim) parametros.append("data_fim", filtros.data_fim);
  if (filtros.cliente_id) parametros.append("cliente_id", filtros.cliente_id.toString());
  if (filtros.produto_id) parametros.append("produto_id", filtros.produto_id.toString());

  const query = parametros.toString() ? `?${parametros.toString()}` : "";
  return requisicaoApi<RespostaListagemVendas>(`/vendas${query}`);
}

export async function buscarVendaPorId(id: number): Promise<Venda> {
  const resposta = await requisicaoApi<RespostaVendaUnica>(`/vendas/${id}`);
  return resposta.dados;
}

export async function registrarVenda(
  dados: DadosRegistrarVenda
): Promise<Venda> {
  const resposta = await requisicaoApi<RespostaVendaUnica>("/vendas", {
    method: "POST",
    body: JSON.stringify(dados)
  });
  return resposta.dados;
}
