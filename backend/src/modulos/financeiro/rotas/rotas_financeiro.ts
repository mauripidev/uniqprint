import { FastifyInstance } from "fastify";
import { verificarAutenticacao, verificarPapel } from "../../../middlewares/autenticacao_middleware.js";
import { ControladorFinanceiro } from "../controladores/controlador_financeiro.js";

export async function rotasFinanceiro(aplicativo: FastifyInstance) {
  const controlador = new ControladorFinanceiro();

  aplicativo.register(async (rotasProtegidas) => {
    rotasProtegidas.addHook("preHandler", verificarAutenticacao);
    rotasProtegidas.addHook("preHandler", verificarPapel(["ADMINISTRADOR"]));

    rotasProtegidas.get("/api/lancamentos-financeiros", async (req, res) => {
      return controlador.listar(req, res);
    });

    rotasProtegidas.get("/api/lancamentos-financeiros/:id", async (req: any, res) => {
      return controlador.buscarPorId(req, res);
    });

    rotasProtegidas.post("/api/lancamentos-financeiros", async (req, res) => {
      return controlador.criar(req, res);
    });

    rotasProtegidas.put("/api/lancamentos-financeiros/:id", async (req: any, res) => {
      return controlador.atualizar(req, res);
    });

    rotasProtegidas.delete("/api/lancamentos-financeiros/:id", async (req: any, res) => {
      return controlador.excluir(req, res);
    });
  });
}
