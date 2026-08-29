import { requisicaoApi } from "./api.js";
import {
  DadosAtualizarFornecedor,
  DadosCriarFornecedor,
  FiltrosConsultarFornecedores,
  Fornecedor,
  RespostaFornecedorUnico,
  RespostaListagemFornecedores
} from "../tipos/fornecedores.js";

export async function listarFornecedores(
  filtros: FiltrosConsultarFornecedores = {}
): Promise<RespostaListagemFornecedores> {
  const parametros = new URLSearchParams();

  if (filtros.pagina) parametros.append("pagina", filtros.pagina.toString());
  if (filtros.limite) parametros.append("limite", filtros.limite.toString());
  if (filtros.busca) parametros.append("busca", filtros.busca);
  if (filtros.ativo && filtros.ativo !== "todos") {
    parametros.append("ativo", filtros.ativo);
  }

  const query = parametros.toString() ? `?${parametros.toString()}` : "";
  return requisicaoApi<RespostaListagemFornecedores>(`/fornecedores${query}`);
}

export async function buscarFornecedorPorId(id: number): Promise<Fornecedor> {
  const resposta = await requisicaoApi<RespostaFornecedorUnico>(`/fornecedores/${id}`);
  return resposta.dados;
}

export async function criarFornecedor(dados: DadosCriarFornecedor): Promise<Fornecedor> {
  const resposta = await requisicaoApi<RespostaFornecedorUnico>("/fornecedores", {
    method: "POST",
    body: JSON.stringify(dados)
  });
  return resposta.dados;
}

export async function atualizarFornecedor(
  id: number,
  dados: DadosAtualizarFornecedor
): Promise<Fornecedor> {
  const resposta = await requisicaoApi<RespostaFornecedorUnico>(`/fornecedores/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados)
  });
  return resposta.dados;
}

export async function inativarFornecedor(id: number): Promise<Fornecedor> {
  const resposta = await requisicaoApi<RespostaFornecedorUnico>(`/fornecedores/${id}`, {
    method: "DELETE"
  });
  return resposta.dados;
}
