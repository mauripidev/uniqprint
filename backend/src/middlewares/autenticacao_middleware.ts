import { FastifyReply, FastifyRequest } from "fastify";
import { ErroAplicacao } from "../compartilhado/erros/erro_aplicacao.js";

export interface DadosUsuarioToken {
  id: number;
  email: string;
  papel: string;
}

declare module "fastify" {
  interface FastifyRequest {
    usuarioAutenticado?: DadosUsuarioToken;
  }
}

export async function verificarAutenticacao(
  requisicao: FastifyRequest,
  resposta: FastifyReply
) {
  try {
    // 1. Tenta obter token do cookie ou do header Authorization
    const tokenCookie = requisicao.cookies?.token_sessao;
    const headerAuth = requisicao.headers.authorization;

    let token = "";

    if (tokenCookie) {
      token = tokenCookie;
    } else if (headerAuth && headerAuth.startsWith("Bearer ")) {
      token = headerAuth.substring(7);
    }

    if (!token) {
      throw new ErroAplicacao(
        "Token de autenticação não fornecido",
        "NAO_AUTENTICADO",
        401
      );
    }

    // Valida o token JWT via Fastify JWT
    const dadosDecodificados = await requisicao.server.jwt.verify<DadosUsuarioToken>(token);
    requisicao.usuarioAutenticado = dadosDecodificados;
  } catch (erro) {
    if (erro instanceof ErroAplicacao) {
      throw erro;
    }
    throw new ErroAplicacao(
      "Sessão expirada ou inválida. Faça login novamente.",
      "NAO_AUTENTICADO",
      401
    );
  }
}

export function verificarPapel(papeisPermitidos: string[]) {
  return async (requisicao: FastifyRequest, resposta: FastifyReply) => {
    if (!requisicao.usuarioAutenticado) {
      throw new ErroAplicacao(
        "Acesso não autorizado",
        "NAO_AUTENTICADO",
        401
      );
    }

    if (!papeisPermitidos.includes(requisicao.usuarioAutenticado.papel)) {
      throw new ErroAplicacao(
        "Você não possui permissão para acessar este recurso",
        "ACESSO_NEGADO",
        403
      );
    }
  };
}
