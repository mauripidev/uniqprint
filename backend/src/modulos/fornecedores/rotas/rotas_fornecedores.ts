import { FastifyInstance } from "fastify";
import { verificarAutenticacao } from "../../../middlewares/autenticacao_middleware.js";
import { ControladorFornecedores } from "../controladores/controlador_fornecedores.js";

export async function rotasFornecedores(aplicativo: FastifyInstance) {
  const controlador = new ControladorFornecedores();

  aplicativo.register(async (rotasProtegidas) => {
    rotasProtegidas.addHook("preHandler", verificarAutenticacao);

    rotasProtegidas.get("/api/fornecedores", async (requisicao, resposta) => {
      return controlador.listar(requisicao, resposta);
    });

    rotasProtegidas.get(
      "/api/fornecedores/:id",
      async (requisicao: any, resposta) => {
        return controlador.buscarPorId(requisicao, resposta);
      }
    );

    rotasProtegidas.post("/api/fornecedores", async (requisicao, resposta) => {
      return controlador.criar(requisicao, resposta);
    });

    rotasProtegidas.put(
      "/api/fornecedores/:id",
      async (requisicao: any, resposta) => {
        return controlador.atualizar(requisicao, resposta);
      }
    );

    rotasProtegidas.delete(
      "/api/fornecedores/:id",
      async (requisicao: any, resposta) => {
        return controlador.inativar(requisicao, resposta);
      }
    );

    rotasProtegidas.patch(
      "/api/fornecedores/:id/inativar",
      async (requisicao: any, resposta) => {
        return controlador.inativar(requisicao, resposta);
      }
    );
  });
}
