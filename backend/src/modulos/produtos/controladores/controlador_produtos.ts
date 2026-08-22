import { FastifyReply, FastifyRequest } from "fastify";
import {
  schemaAtualizarProduto,
  schemaConsultarProdutos,
  schemaCriarProduto
} from "../dtos/produto_dto.js";
import { ServicoProdutos } from "../servicos/servico_produtos.js";

export class ControladorProdutos {
  constructor(private servicoProdutos: ServicoProdutos = new ServicoProdutos()) {}

  async criar(requisicao: FastifyRequest, resposta: FastifyReply) {
    const dados = schemaCriarProduto.parse(requisicao.body);
    const produto = await this.servicoProdutos.criarProduto(dados);

    return resposta.status(201).send({
      dados: produto,
      mensagem: "Produto cadastrado com sucesso"
    });
  }

  async buscarPorId(
    requisicao: FastifyRequest<{ Params: { id: string } }>,
    resposta: FastifyReply
  ) {
    const id = Number(requisicao.params.id);
    const produto = await this.servicoProdutos.buscarProdutoPorId(id);

    return resposta.status(200).send({
      dados: produto,
      mensagem: "Produto obtido com sucesso"
    });
  }

  async listar(requisicao: FastifyRequest, resposta: FastifyReply) {
    const filtros = schemaConsultarProdutos.parse(requisicao.query);
    const resultado = await this.servicoProdutos.listarProdutos(filtros);

    return resposta.status(200).send(resultado);
  }

  async atualizar(
    requisicao: FastifyRequest<{ Params: { id: string } }>,
    resposta: FastifyReply
  ) {
    const id = Number(requisicao.params.id);
    const dados = schemaAtualizarProduto.parse(requisicao.body);
    const produto = await this.servicoProdutos.atualizarProduto(id, dados);

    return resposta.status(200).send({
      dados: produto,
      mensagem: "Produto atualizado com sucesso"
    });
  }

  async inativar(
    requisicao: FastifyRequest<{ Params: { id: string } }>,
    resposta: FastifyReply
  ) {
    const id = Number(requisicao.params.id);
    const produto = await this.servicoProdutos.inativarProduto(id);

    return resposta.status(200).send({
      dados: produto,
      mensagem: "Produto inativado com sucesso"
    });
  }
}
