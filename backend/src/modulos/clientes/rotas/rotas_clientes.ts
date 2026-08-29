import { FastifyInstance } from "fastify";
import { verificarAutenticacao } from "../../../middlewares/autenticacao_middleware.js";
import { ControladorClientes } from "../controladores/controlador_clientes.js";

export async function rotasClientes(aplicativo: FastifyInstance) {
  const controlador = new ControladorClientes();

  aplicativo.register(async (rotasProtegidas) => {
    rotasProtegidas.addHook("preHandler", verificarAutenticacao);

    rotasProtegidas.get("/api/clientes", async (requisicao, resposta) => {
      return controlador.listar(requisicao, resposta);
    });

    rotasProtegidas.get(
      "/api/clientes/:id",
      async (requisicao: any, resposta) => {
        return controlador.buscarPorId(requisicao, resposta);
      }
    );

    rotasProtegidas.post("/api/clientes", async (requisicao, resposta) => {
      return controlador.criar(requisicao, resposta);
    });

    rotasProtegidas.put(
      "/api/clientes/:id",
      async (requisicao: any, resposta) => {
        return controlador.atualizar(requisicao, resposta);
      }
    );

    rotasProtegidas.delete(
      "/api/clientes/:id",
      async (requisicao: any, resposta) => {
        return controlador.inativar(requisicao, resposta);
      }
    );

    rotasProtegidas.patch(
      "/api/clientes/:id/inativar",
      async (requisicao: any, resposta) => {
        return controlador.inativar(requisicao, resposta);
      }
    );
  });
}
