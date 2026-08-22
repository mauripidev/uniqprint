import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyJwt from "@fastify/jwt";
import fastifyRateLimit from "@fastify/rate-limit";
import fastify from "fastify";
import { configuracaoAmbiente } from "./configuracao/ambiente.js";
import { tratadorErros } from "./compartilhado/erros/tratador_erros.js";
import { rotasAutenticacao } from "./modulos/autenticacao/rotas/rotas_autenticacao.js";
import { rotasProdutos } from "./modulos/produtos/rotas/rotas_produtos.js";

export function criarAplicativo() {
  const aplicativo = fastify({
    logger: configuracaoAmbiente.AMBIENTE === "development"
  });

  // Plugins de segurança e utilidades
  aplicativo.register(fastifyHelmet, {
    contentSecurityPolicy: false
  });

  aplicativo.register(fastifyCors, {
    origin: (origem, cb) => {
      // Permite requisições da origem do frontend configurada ou requisições locais
      cb(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
  });

  aplicativo.register(fastifyCookie, {
    secret: configuracaoAmbiente.COOKIE_SEGREDO,
    parseOptions: {}
  });

  aplicativo.register(fastifyJwt, {
    secret: configuracaoAmbiente.JWT_SEGREDO,
    cookie: {
      cookieName: "token_sessao",
      signed: false
    }
  });

  aplicativo.register(fastifyRateLimit, {
    max: 100,
    timeWindow: "1 minute"
  });

  // Parser de JSON tolerante a body vazio (evita erro em requisições DELETE sem corpo)
  aplicativo.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (req, body, done) => {
      if (!body || (typeof body === "string" && body.trim() === "")) {
        done(null, {});
        return;
      }
      try {
        const json = JSON.parse(body);
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    }
  );

  // Tratador centralizado de erros
  aplicativo.setErrorHandler(tratadorErros);

  // Endpoint de status / health check
  aplicativo.get("/api/status", async () => {
    return {
      status: "operacional",
      timestamp: new Date().toISOString(),
      versao: "1.0.0"
    };
  });

  // Registro dos módulos da aplicação
  aplicativo.register(rotasAutenticacao);
  aplicativo.register(rotasProdutos);

  return aplicativo;
}
