import { FastifyInstance } from "fastify";
import { verificarAutenticacao } from "../../../middlewares/autenticacao_middleware.js";
import { ControladorDashboard } from "../controladores/controlador_dashboard.js";

export async function rotasDashboard(aplicativo: FastifyInstance) {
  const controlador = new ControladorDashboard();

  aplicativo.register(async (rotasProtegidas) => {
    rotasProtegidas.addHook("preHandler", verificarAutenticacao);

    rotasProtegidas.get("/api/dashboard/resumo", async (req, res) => {
      return controlador.obterResumo(req, res);
    });
  });
}
