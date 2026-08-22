import { requisicaoApi } from "./api.js";
import {
  DadosLogin,
  RespostaLogin,
  RespostaSucessoGenerica,
  RespostaUsuarioEu,
  Usuario
} from "../tipos/autenticacao.js";

export async function realizarLogin(dados: DadosLogin): Promise<Usuario> {
  const resposta = await requisicaoApi<RespostaLogin>("/autenticacao/login", {
    method: "POST",
    body: JSON.stringify(dados)
  });

  return resposta.dados.usuario;
}

export async function realizarLogout(): Promise<void> {
  await requisicaoApi<RespostaSucessoGenerica<null>>("/autenticacao/logout", {
    method: "POST"
  });
}

export async function obterUsuarioAutenticado(): Promise<Usuario> {
  const resposta = await requisicaoApi<RespostaUsuarioEu>("/autenticacao/eu", {
    method: "GET"
  });

  return resposta.dados.usuario;
}
