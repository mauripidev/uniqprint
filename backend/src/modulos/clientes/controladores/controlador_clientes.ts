import { FastifyReply, FastifyRequest } from "fastify";
import {
  schemaAtualizarCliente,
  schemaConsultarClientes,
  schemaCriarCliente
} from "../dtos/cliente_dto.js";
import { ServicoClientes } from "../servicos/servico_clientes.js";

export class ControladorClientes {
  constructor(
    private servicoClientes: ServicoClientes = new ServicoClientes()
  ) {}

  async criar(requisicao: FastifyRequest, resposta: FastifyReply) {
    const dados = schemaCriarCliente.parse(requisicao.body);
    const cliente = await this.servicoClientes.criarCliente(dados);

    return resposta.status(201).send({
      dados: cliente,
      mensagem: "Cliente cadastrado com sucesso"
    });
  }

  async buscarPorId(
    requisicao: FastifyRequest<{ Params: { id: string } }>,
    resposta: FastifyReply
  ) {
    const id = Number(requisicao.params.id);
    const cliente = await this.servicoClientes.buscarClientePorId(id);

    return resposta.status(200).send({
      dados: cliente,
      mensagem: "Cliente obtido com sucesso"
    });
  }

  async listar(requisicao: FastifyRequest, resposta: FastifyReply) {
    const filtros = schemaConsultarClientes.parse(requisicao.query);
    const resultado = await this.servicoClientes.listarClientes(filtros);

    return resposta.status(200).send(resultado);
  }

  async atualizar(
    requisicao: FastifyRequest<{ Params: { id: string } }>,
    resposta: FastifyReply
  ) {
    const id = Number(requisicao.params.id);
    const dados = schemaAtualizarCliente.parse(requisicao.body);
    const cliente = await this.servicoClientes.atualizarCliente(id, dados);

    return resposta.status(200).send({
      dados: cliente,
      mensagem: "Cliente atualizado com sucesso"
    });
  }

  async inativar(
    requisicao: FastifyRequest<{ Params: { id: string } }>,
    resposta: FastifyReply
  ) {
    const id = Number(requisicao.params.id);
    const cliente = await this.servicoClientes.inativarCliente(id);

    return resposta.status(200).send({
      dados: cliente,
      mensagem: "Cliente inativado com sucesso"
    });
  }
}
