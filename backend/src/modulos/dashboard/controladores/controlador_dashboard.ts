import { FastifyReply, FastifyRequest } from "fastify";
import { schemaDashboardResumoQuery } from "../dtos/dashboard_dto.js";
import { ServicoDashboard } from "../servicos/servico_dashboard.js";

export class ControladorDashboard {
  constructor(private servico = new ServicoDashboard()) {}

  obterResumo = async (req: FastifyRequest, res: FastifyReply) => {
    const filtros = schemaDashboardResumoQuery.parse(req.query);
    const resultado = await this.servico.obterResumo(filtros);
    return res.status(200).send(resultado);
  };
}
