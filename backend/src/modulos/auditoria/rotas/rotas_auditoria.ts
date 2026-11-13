import { FastifyInstance } from "fastify";
import {
  verificarAutenticacao,
  verificarPapel
} from "../../../middlewares/autenticacao_middleware.js";
import { ControladorAuditoria } from "../controladores/controlador_auditoria.js";

export async function rotasAuditoria(aplicativo: FastifyInstance) {
  const controlador = new ControladorAuditoria();

  aplicativo.register(async (rotasProtegidas) => {
    rotasProtegidas.addHook("preHandler", verificarAutenticacao);

    rotasProtegidas.register(async (rotasAdmin) => {
      rotasAdmin.addHook("preHandler", verificarPapel(["ADMINISTRADOR"]));

      rotasAdmin.get("/api/auditoria", async (req, res) => {
        return controlador.listar(req, res);
      });

      rotasAdmin.get("/api/auditoria/:id", async (req: any, res) => {
        return controlador.buscarPorId(req, res);
      });
    });
  });
}
