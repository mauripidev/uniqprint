import { FastifyReply, FastifyRequest } from "fastify";
import { ServicoRelatorios } from "../servicos/servico_relatorios.js";
import {
  schemaRelatorioComprasQuery,
  schemaRelatorioFinanceiroQuery,
  schemaRelatorioVendasQuery
} from "../dtos/relatorios_dto.js";

export class ControladorRelatorios {
  constructor(private servico = new ServicoRelatorios()) {}

  obterRelatorioVendas = async (req: FastifyRequest, res: FastifyReply) => {
    const filtros = schemaRelatorioVendasQuery.parse(req.query);
    const resultado = await this.servico.obterRelatorioVendas(filtros);
    return res.status(200).send(resultado);
  };

  obterRelatorioCompras = async (req: FastifyRequest, res: FastifyReply) => {
    const filtros = schemaRelatorioComprasQuery.parse(req.query);
    const resultado = await this.servico.obterRelatorioCompras(filtros);
    return res.status(200).send(resultado);
  };

  obterRelatorioFinanceiro = async (req: FastifyRequest, res: FastifyReply) => {
    const filtros = schemaRelatorioFinanceiroQuery.parse(req.query);
    const resultado = await this.servico.obterRelatorioFinanceiro(filtros);
    return res.status(200).send(resultado);
  };
}
