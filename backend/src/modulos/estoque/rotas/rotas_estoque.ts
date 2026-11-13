import { FastifyInstance } from "fastify";
import {
  verificarAutenticacao,
  verificarPapel
} from "../../../middlewares/autenticacao_middleware.js";
import { ControladorEstoque } from "../controladores/controlador_estoque.js";

export async function rotasEstoque(aplicativo: FastifyInstance) {
  const controlador = new ControladorEstoque();

  aplicativo.register(async (rotasProtegidas) => {
    rotasProtegidas.addHook("preHandler", verificarAutenticacao);

    rotasProtegidas.get("/api/estoque", async (req, res) => {
      return controlador.listarEstoque(req, res);
    });

    rotasProtegidas.get("/api/estoque/movimentacoes", async (req, res) => {
      return controlador.listarMovimentacoes(req, res);
    });

    rotasProtegidas.register(async (rotasAdmin) => {
      rotasAdmin.addHook("preHandler", verificarPapel(["ADMINISTRADOR"]));

      rotasAdmin.post("/api/estoque/ajustes", async (req, res) => {
        return controlador.registrarAjuste(req, res);
      });
    });
  });
}
