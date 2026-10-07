import { FastifyReply, FastifyRequest } from "fastify";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import { ServicoFinanceiro } from "../servicos/servico_financeiro.js";
import {
  schemaConsultarLancamentos,
  schemaConsultarSaldo,
  schemaCriarLancamento,
  schemaAtualizarLancamento
} from "../dtos/financeiro_dto.js";

export class ControladorFinanceiro {
  constructor(private servico = new ServicoFinanceiro()) {}

  listar = async (req: FastifyRequest, res: FastifyReply) => {
    const filtros = schemaConsultarLancamentos.parse(req.query);
    const resultado = await this.servico.listar(filtros);
    return res.status(200).send(resultado);
  };

  calcularSaldo = async (req: FastifyRequest, res: FastifyReply) => {
    const filtros = schemaConsultarSaldo.parse(req.query);
    const resultado = await this.servico.calcularSaldo(filtros);
    return res.status(200).send(resultado);
  };

  buscarPorId = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new ErroAplicacao("ID inválido", "ID_INVALIDO", 400);
    }

    const resultado = await this.servico.buscarPorId(id);
    return res.status(200).send(resultado);
  };

  criar = async (req: FastifyRequest, res: FastifyReply) => {
    const dados = schemaCriarLancamento.parse(req.body);
    const resultado = await this.servico.criar(dados);
    return res.status(201).send(resultado);
  };

  atualizar = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new ErroAplicacao("ID inválido", "ID_INVALIDO", 400);
    }

    const dados = schemaAtualizarLancamento.parse(req.body);
    const resultado = await this.servico.atualizar(id, dados);
    return res.status(200).send(resultado);
  };

  excluir = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new ErroAplicacao("ID inválido", "ID_INVALIDO", 400);
    }

    await this.servico.excluir(id);
    return res.status(204).send();
  };
}
