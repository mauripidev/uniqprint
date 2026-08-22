import { FastifyInstance } from "fastify";
import {
  verificarAutenticacao,
  verificarPapel
} from "../../../middlewares/autenticacao_middleware.js";
import { ControladorAutenticacao } from "../controladores/controlador_autenticacao.js";

export async function rotasAutenticacao(aplicativo: FastifyInstance) {
  const controlador = new ControladorAutenticacao();

  // Rotas públicas de autenticação
  aplicativo.post("/api/autenticacao/login", {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute"
      }
    }
  }, async (requisicao, resposta) => {
    return controlador.login(requisicao, resposta);
  });

  aplicativo.post("/api/autenticacao/logout", async (requisicao, resposta) => {
    return controlador.logout(requisicao, resposta);
  });

  // Rota autenticada para obter os dados do usuário atual
  aplicativo.get(
    "/api/autenticacao/eu",
    { preHandler: [verificarAutenticacao] },
    async (requisicao, resposta) => {
      return controlador.eu(requisicao, resposta);
    }
  );

  // Rotas de usuários
  aplicativo.post("/api/usuarios", async (requisicao, resposta) => {
    return controlador.criarUsuario(requisicao, resposta);
  });

  aplicativo.get(
    "/api/usuarios",
    { preHandler: [verificarAutenticacao, verificarPapel(["ADMINISTRADOR"])] },
    async (requisicao, resposta) => {
      return controlador.listarUsuarios(requisicao, resposta);
    }
  );
}
