import { FastifyReply, FastifyRequest } from "fastify";
import {
  schemaConsultarCompras,
  schemaCriarCompra
} from "../dtos/compra_dto.js";
import { ServicoCompras } from "../servicos/servico_compras.js";

export class ControladorCompras {
  constructor(
    private servicoCompras: ServicoCompras = new ServicoCompras()
  ) {}

  async criar(requisicao: FastifyRequest, resposta: FastifyReply) {
    const dados = schemaCriarCompra.parse(requisicao.body);
    const compra = await this.servicoCompras.registrarCompra(dados);

    return resposta.status(201).send({
      dados: compra,
      mensagem: "Compra registrada com sucesso. Estoque atualizado."
    });
  }

  async buscarPorId(
    requisicao: FastifyRequest<{ Params: { id: string } }>,
    resposta: FastifyReply
  ) {
    const id = Number(requisicao.params.id);
    const compra = await this.servicoCompras.buscarCompraPorId(id);

    return resposta.status(200).send({
      dados: compra,
      mensagem: "Compra obtida com sucesso"
    });
  }

  async listar(requisicao: FastifyRequest, resposta: FastifyReply) {
    const filtros = schemaConsultarCompras.parse(requisicao.query);
    const resultado = await this.servicoCompras.listarCompras(filtros);

    return resposta.status(200).send(resultado);
  }
}
