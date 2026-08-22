import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { ErroAplicacao } from "./erro_aplicacao.js";

export function tratadorErros(
  erro: FastifyError | Error,
  requisicao: FastifyRequest,
  resposta: FastifyReply
) {
  if (erro instanceof ZodError) {
    const campos: Record<string, string[]> = {};
    for (const item of erro.issues) {
      const caminho = item.path.join(".");
      if (!campos[caminho]) {
        campos[caminho] = [];
      }
      campos[caminho].push(item.message);
    }

    return resposta.status(400).send({
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: "Os dados informados são inválidos",
        campos
      }
    });
  }

  if (erro instanceof ErroAplicacao) {
    return resposta.status(erro.statusHttp).send({
      erro: {
        codigo: erro.codigo,
        mensagem: erro.message,
        ...(erro.campos ? { campos: erro.campos } : {})
      }
    });
  }

  // Erros de rate-limit do Fastify
  if ("statusCode" in erro && erro.statusCode === 429) {
    return resposta.status(429).send({
      erro: {
        codigo: "MUITAS_REQUISICOES",
        mensagem: "Muitas tentativas. Por favor, tente novamente mais tarde."
      }
    });
  }

  // Log interno para depuração
  requisicao.log.error(erro);

  // Erro interno 500 genérico sem vazar dados
  return resposta.status(500).send({
    erro: {
      codigo: "ERRO_INTERNO",
      mensagem: "Ocorreu um erro interno no servidor"
    }
  });
}
