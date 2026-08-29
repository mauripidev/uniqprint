import { FastifyReply, FastifyRequest } from "fastify";
import {
  schemaAtualizarFornecedor,
  schemaConsultarFornecedores,
  schemaCriarFornecedor
} from "../dtos/fornecedor_dto.js";
import { ServicoFornecedores } from "../servicos/servico_fornecedores.js";

export class ControladorFornecedores {
  constructor(
    private servicoFornecedores: ServicoFornecedores = new ServicoFornecedores()
  ) {}

  async criar(requisicao: FastifyRequest, resposta: FastifyReply) {
    const dados = schemaCriarFornecedor.parse(requisicao.body);
    const fornecedor = await this.servicoFornecedores.criarFornecedor(dados);

    return resposta.status(201).send({
      dados: fornecedor,
      mensagem: "Fornecedor cadastrado com sucesso"
    });
  }

  async buscarPorId(
    requisicao: FastifyRequest<{ Params: { id: string } }>,
    resposta: FastifyReply
  ) {
    const id = Number(requisicao.params.id);
    const fornecedor = await this.servicoFornecedores.buscarFornecedorPorId(id);

    return resposta.status(200).send({
      dados: fornecedor,
      mensagem: "Fornecedor obtido com sucesso"
    });
  }

  async listar(requisicao: FastifyRequest, resposta: FastifyReply) {
    const filtros = schemaConsultarFornecedores.parse(requisicao.query);
    const resultado = await this.servicoFornecedores.listarFornecedores(filtros);

    return resposta.status(200).send(resultado);
  }

  async atualizar(
    requisicao: FastifyRequest<{ Params: { id: string } }>,
    resposta: FastifyReply
  ) {
    const id = Number(requisicao.params.id);
    const dados = schemaAtualizarFornecedor.parse(requisicao.body);
    const fornecedor = await this.servicoFornecedores.atualizarFornecedor(id, dados);

    return resposta.status(200).send({
      dados: fornecedor,
      mensagem: "Fornecedor atualizado com sucesso"
    });
  }

  async inativar(
    requisicao: FastifyRequest<{ Params: { id: string } }>,
    resposta: FastifyReply
  ) {
    const id = Number(requisicao.params.id);
    const fornecedor = await this.servicoFornecedores.inativarFornecedor(id);

    return resposta.status(200).send({
      dados: fornecedor,
      mensagem: "Fornecedor inativado com sucesso"
    });
  }
}
