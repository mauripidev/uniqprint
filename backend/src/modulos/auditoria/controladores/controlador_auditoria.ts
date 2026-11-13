import { FastifyReply, FastifyRequest } from "fastify";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import { schemaConsultarAuditoria } from "../dtos/auditoria_dto.js";
import { ServicoAuditoria } from "../servicos/servico_auditoria.js";

export class ControladorAuditoria {
  constructor(private servico: ServicoAuditoria = new ServicoAuditoria()) {}

  listar = async (req: FastifyRequest, res: FastifyReply) => {
    const filtros = schemaConsultarAuditoria.parse(req.query);
    const resultado = await this.servico.listar(filtros);
    return res.status(200).send(resultado);
  };

  buscarPorId = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    res: FastifyReply
  ) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new ErroAplicacao("ID inválido", "ID_INVALIDO", 400);
    }

    const resultado = await this.servico.buscarPorId(id);
    return res.status(200).send({ dados: resultado });
  };
}
