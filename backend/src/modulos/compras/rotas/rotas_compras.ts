import { FastifyInstance } from "fastify";
import { verificarAutenticacao } from "../../../middlewares/autenticacao_middleware.js";
import { ControladorCompras } from "../controladores/controlador_compras.js";

export async function rotasCompras(aplicativo: FastifyInstance) {
  const controlador = new ControladorCompras();

  aplicativo.register(async (rotasProtegidas) => {
    rotasProtegidas.addHook("preHandler", verificarAutenticacao);

    rotasProtegidas.get("/api/compras", async (requisicao, resposta) => {
      return controlador.listar(requisicao, resposta);
    });

    rotasProtegidas.get(
      "/api/compras/:id",
      async (requisicao: any, resposta) => {
        return controlador.buscarPorId(requisicao, resposta);
      }
    );

    rotasProtegidas.post("/api/compras", async (requisicao, resposta) => {
      return controlador.criar(requisicao, resposta);
    });
  });
}
