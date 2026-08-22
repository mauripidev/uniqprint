import { FastifyInstance } from "fastify";
import { verificarAutenticacao } from "../../../middlewares/autenticacao_middleware.js";
import { ControladorProdutos } from "../controladores/controlador_produtos.js";

export async function rotasProdutos(aplicativo: FastifyInstance) {
  const controlador = new ControladorProdutos();

  aplicativo.register(async (rotasProtegidas) => {
    rotasProtegidas.addHook("preHandler", verificarAutenticacao);

    rotasProtegidas.get("/api/produtos", async (requisicao, resposta) => {
      return controlador.listar(requisicao, resposta);
    });

    rotasProtegidas.get(
      "/api/produtos/:id",
      async (requisicao: any, resposta) => {
        return controlador.buscarPorId(requisicao, resposta);
      }
    );

    rotasProtegidas.post("/api/produtos", async (requisicao, resposta) => {
      return controlador.criar(requisicao, resposta);
    });

    rotasProtegidas.put(
      "/api/produtos/:id",
      async (requisicao: any, resposta) => {
        return controlador.atualizar(requisicao, resposta);
      }
    );

    rotasProtegidas.delete(
      "/api/produtos/:id",
      async (requisicao: any, resposta) => {
        return controlador.inativar(requisicao, resposta);
      }
    );

    rotasProtegidas.patch(
      "/api/produtos/:id/inativar",
      async (requisicao: any, resposta) => {
        return controlador.inativar(requisicao, resposta);
      }
    );
  });
}
