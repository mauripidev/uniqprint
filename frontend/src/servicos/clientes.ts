import { requisicaoApi } from "./api.js";
import {
  Cliente,
  DadosAtualizarCliente,
  DadosCriarCliente,
  FiltrosConsultarClientes,
  RespostaClienteUnico,
  RespostaListagemClientes
} from "../tipos/clientes.js";

export async function listarClientes(
  filtros: FiltrosConsultarClientes = {}
): Promise<RespostaListagemClientes> {
  const parametros = new URLSearchParams();

  if (filtros.pagina) parametros.append("pagina", filtros.pagina.toString());
  if (filtros.limite) parametros.append("limite", filtros.limite.toString());
  if (filtros.busca) parametros.append("busca", filtros.busca);
  if (filtros.ativo && filtros.ativo !== "todos") {
    parametros.append("ativo", filtros.ativo);
  }

  const query = parametros.toString() ? `?${parametros.toString()}` : "";
  return requisicaoApi<RespostaListagemClientes>(`/clientes${query}`);
}

export async function buscarClientePorId(id: number): Promise<Cliente> {
  const resposta = await requisicaoApi<RespostaClienteUnico>(`/clientes/${id}`);
  return resposta.dados;
}

export async function criarCliente(dados: DadosCriarCliente): Promise<Cliente> {
  const resposta = await requisicaoApi<RespostaClienteUnico>("/clientes", {
    method: "POST",
    body: JSON.stringify(dados)
  });
  return resposta.dados;
}

export async function atualizarCliente(
  id: number,
  dados: DadosAtualizarCliente
): Promise<Cliente> {
  const resposta = await requisicaoApi<RespostaClienteUnico>(`/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados)
  });
  return resposta.dados;
}

export async function inativarCliente(id: number): Promise<Cliente> {
  const resposta = await requisicaoApi<RespostaClienteUnico>(`/clientes/${id}`, {
    method: "DELETE"
  });
  return resposta.dados;
}
