import { FastifyInstance } from "fastify";
import { verificarAutenticacao, verificarPapel } from "../../../middlewares/autenticacao_middleware.js";
import { ControladorFinanceiro } from "../controladores/controlador_financeiro.js";

export async function rotasFinanceiro(aplicativo: FastifyInstance) {
  const controlador = new ControladorFinanceiro();

  aplicativo.register(async (rotasProtegidas) => {
    rotasProtegidas.addHook("preHandler", verificarAutenticacao);

    // Listagem do extrato com paginação e filtros
    rotasProtegidas.get("/api/lancamentos-financeiros", async (req, res) => {
      return controlador.listar(req, res);
    });

    // Saldo consolidado (deve ser registrado antes de /:id para evitar conflito de rotas)
    rotasProtegidas.get("/api/lancamentos-financeiros/saldo", async (req, res) => {
      return controlador.calcularSaldo(req, res);
    });

    // Consulta de lançamento por ID
    rotasProtegidas.get("/api/lancamentos-financeiros/:id", async (req: any, res) => {
      return controlador.buscarPorId(req, res);
    });

    // Criação de lançamento manual
    rotasProtegidas.post("/api/lancamentos-financeiros", async (req, res) => {
      return controlador.criar(req, res);
    });

    // Edição de lançamento manual
    rotasProtegidas.put("/api/lancamentos-financeiros/:id", async (req: any, res) => {
      return controlador.atualizar(req, res);
    });

    // Exclusão de lançamento manual (autorização restrita a ADMINISTRADOR)
    rotasProtegidas.register(async (rotasAdmin) => {
      rotasAdmin.addHook("preHandler", verificarPapel(["ADMINISTRADOR"]));
      rotasAdmin.delete("/api/lancamentos-financeiros/:id", async (req: any, res) => {
        return controlador.excluir(req, res);
      });
    });
  });
}
