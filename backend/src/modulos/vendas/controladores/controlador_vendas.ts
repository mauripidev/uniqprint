import { FastifyReply, FastifyRequest } from "fastify";
import {
  schemaConsultarVendas,
  schemaCriarVenda
} from "../dtos/venda_dto.js";
import { ServicoVendas } from "../servicos/servico_vendas.js";

export class ControladorVendas {
  constructor(
    private servicoVendas: ServicoVendas = new ServicoVendas()
  ) {}

  async criar(requisicao: FastifyRequest, resposta: FastifyReply) {
    const dados = schemaCriarVenda.parse(requisicao.body);
    const venda = await this.servicoVendas.registrarVenda(dados);

    return resposta.status(201).send({
      dados: venda,
      mensagem: "Venda registrada com sucesso. Estoque atualizado."
    });
  }

  async buscarPorId(
    requisicao: FastifyRequest<{ Params: { id: string } }>,
    resposta: FastifyReply
  ) {
    const id = Number(requisicao.params.id);
    const venda = await this.servicoVendas.buscarVendaPorId(id);

    return resposta.status(200).send({
      dados: venda,
      mensagem: "Venda obtida com sucesso"
    });
  }

  async listar(requisicao: FastifyRequest, resposta: FastifyReply) {
    const filtros = schemaConsultarVendas.parse(requisicao.query);
    const resultado = await this.servicoVendas.listarVendas(filtros);

    return resposta.status(200).send(resultado);
  }
}
