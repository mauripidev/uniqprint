import { FastifyInstance } from "fastify";
import { verificarAutenticacao } from "../../../middlewares/autenticacao_middleware.js";
import { ControladorRelatorios } from "../controladores/controlador_relatorios.js";

export async function rotasRelatorios(aplicativo: FastifyInstance) {
  const controlador = new ControladorRelatorios();

  aplicativo.register(async (rotasProtegidas) => {
    rotasProtegidas.addHook("preHandler", verificarAutenticacao);

    rotasProtegidas.get("/api/relatorios/vendas", async (req, res) => {
      return controlador.obterRelatorioVendas(req, res);
    });

    rotasProtegidas.get("/api/relatorios/compras", async (req, res) => {
      return controlador.obterRelatorioCompras(req, res);
    });

    rotasProtegidas.get("/api/relatorios/financeiro", async (req, res) => {
      return controlador.obterRelatorioFinanceiro(req, res);
    });
  });
}
