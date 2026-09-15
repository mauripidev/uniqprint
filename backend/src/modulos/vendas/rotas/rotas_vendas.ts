import { FastifyInstance } from "fastify";
import { verificarAutenticacao } from "../../../middlewares/autenticacao_middleware.js";
import { ControladorVendas } from "../controladores/controlador_vendas.js";

export async function rotasVendas(aplicativo: FastifyInstance) {
  const controlador = new ControladorVendas();

  aplicativo.register(async (rotasProtegidas) => {
    rotasProtegidas.addHook("preHandler", verificarAutenticacao);

    rotasProtegidas.get("/api/vendas", async (requisicao, resposta) => {
      return controlador.listar(requisicao, resposta);
    });

    rotasProtegidas.get(
      "/api/vendas/:id",
      async (requisicao: any, resposta) => {
        return controlador.buscarPorId(requisicao, resposta);
      }
    );

    rotasProtegidas.post("/api/vendas", async (requisicao, resposta) => {
      return controlador.criar(requisicao, resposta);
    });
  });
}
