import { requisicaoApi } from "./api.js";
import {
  DadosAtualizarProduto,
  DadosCriarProduto,
  FiltrosConsultarProdutos,
  Produto,
  RespostaListagemProdutos,
  RespostaProdutoUnico
} from "../tipos/produtos.js";

export async function listarProdutos(
  filtros: FiltrosConsultarProdutos = {}
): Promise<RespostaListagemProdutos> {
  const parametros = new URLSearchParams();

  if (filtros.pagina) parametros.append("pagina", filtros.pagina.toString());
  if (filtros.limite) parametros.append("limite", filtros.limite.toString());
  if (filtros.busca) parametros.append("busca", filtros.busca);
  if (filtros.ativo && filtros.ativo !== "todos") {
    parametros.append("ativo", filtros.ativo);
  }

  const query = parametros.toString() ? `?${parametros.toString()}` : "";
  return requisicaoApi<RespostaListagemProdutos>(`/produtos${query}`);
}

export async function buscarProdutoPorId(id: number): Promise<Produto> {
  const resposta = await requisicaoApi<RespostaProdutoUnico>(`/produtos/${id}`);
  return resposta.dados;
}

export async function criarProduto(dados: DadosCriarProduto): Promise<Produto> {
  const resposta = await requisicaoApi<RespostaProdutoUnico>("/produtos", {
    method: "POST",
    body: JSON.stringify(dados)
  });
  return resposta.dados;
}

export async function atualizarProduto(
  id: number,
  dados: DadosAtualizarProduto
): Promise<Produto> {
  const resposta = await requisicaoApi<RespostaProdutoUnico>(`/produtos/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados)
  });
  return resposta.dados;
}

export async function inativarProduto(id: number): Promise<Produto> {
  const resposta = await requisicaoApi<RespostaProdutoUnico>(`/produtos/${id}`, {
    method: "DELETE"
  });
  return resposta.dados;
}
