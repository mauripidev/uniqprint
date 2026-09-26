import { FastifyReply, FastifyRequest } from "fastify";
import { ServicoEstoque } from "../servicos/servico_estoque.js";
import {
  schemaConsultarEstoque,
  schemaConsultarMovimentacoes,
  schemaRegistrarAjuste
} from "../dtos/estoque_dto.js";

export class ControladorEstoque {
  constructor(private servicoEstoque = new ServicoEstoque()) {}

  listarEstoque = async (req: FastifyRequest, res: FastifyReply) => {
    const filtros = schemaConsultarEstoque.parse(req.query);
    const resultado = await this.servicoEstoque.listarEstoque(filtros);
    return res.status(200).send(resultado);
  };

  listarMovimentacoes = async (req: FastifyRequest, res: FastifyReply) => {
    const filtros = schemaConsultarMovimentacoes.parse(req.query);
    const resultado = await this.servicoEstoque.listarMovimentacoes(filtros);
    return res.status(200).send(resultado);
  };

  registrarAjuste = async (req: FastifyRequest, res: FastifyReply) => {
    const dados = schemaRegistrarAjuste.parse(req.body);
    const resultado = await this.servicoEstoque.registrarAjuste(dados);
    return res.status(201).send({
      dados: resultado,
      mensagem: "Ajuste de estoque registrado com sucesso."
    });
  };
}
