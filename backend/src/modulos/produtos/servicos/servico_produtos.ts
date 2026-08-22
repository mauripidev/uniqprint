import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import {
  ProdutoResposta,
  RequisicaoAtualizarProduto,
  RequisicaoConsultarProdutos,
  RequisicaoCriarProduto
} from "../dtos/produto_dto.js";
import {
  RepositorioProdutos,
  RepositorioProdutosPrisma
} from "../repositorios/repositorio_produtos.js";
import { Produto } from "@prisma/client";

export class ServicoProdutos {
  constructor(
    private repositorioProdutos: RepositorioProdutos = new RepositorioProdutosPrisma()
  ) {}

  private mapearParaResposta(produto: Produto): ProdutoResposta {
    return {
      id: produto.id,
      descricao: produto.descricao,
      quantidade_estoque: produto.quantidade_estoque,
      ativo: produto.ativo,
      criado_em: produto.criado_em,
      atualizado_em: produto.atualizado_em
    };
  }

  async criarProduto(dados: RequisicaoCriarProduto): Promise<ProdutoResposta> {
    const descricaoNormalizada = dados.descricao.trim();

    if (!descricaoNormalizada) {
      throw new ErroAplicacao(
        "A descrição do produto é obrigatória",
        "DESCRICAO_OBRIGATORIA",
        400
      );
    }

    if (dados.quantidade_estoque !== undefined && dados.quantidade_estoque < 0) {
      throw new ErroAplicacao(
        "A quantidade de estoque não pode ser negativa",
        "ESTOQUE_INVALIDO",
        400
      );
    }

    const novoProduto = await this.repositorioProdutos.criar({
      descricao: descricaoNormalizada,
      quantidade_estoque: dados.quantidade_estoque ?? 0
    });

    return this.mapearParaResposta(novoProduto);
  }

  async buscarProdutoPorId(id: number): Promise<ProdutoResposta> {
    if (!id || isNaN(id)) {
      throw new ErroAplicacao("ID do produto inválido", "ID_INVALIDO", 400);
    }

    const produto = await this.repositorioProdutos.buscarPorId(id);

    if (!produto) {
      throw new ErroAplicacao(
        "Produto não encontrado",
        "PRODUTO_NAO_ENCONTRADO",
        404
      );
    }

    return this.mapearParaResposta(produto);
  }

  async listarProdutos(filtros: RequisicaoConsultarProdutos) {
    const { pagina, limite, busca, ativo } = filtros;

    const { produtos, total } = await this.repositorioProdutos.listar({
      pagina,
      limite,
      busca,
      ativo
    });

    const totalPaginas = Math.ceil(total / limite) || 1;

    return {
      dados: produtos.map((p) => this.mapearParaResposta(p)),
      paginacao: {
        pagina,
        limite,
        total,
        total_paginas: totalPaginas
      }
    };
  }

  async atualizarProduto(
    id: number,
    dados: RequisicaoAtualizarProduto
  ): Promise<ProdutoResposta> {
    if (!id || isNaN(id)) {
      throw new ErroAplicacao("ID do produto inválido", "ID_INVALIDO", 400);
    }

    const produtoExistente = await this.repositorioProdutos.buscarPorId(id);

    if (!produtoExistente) {
      throw new ErroAplicacao(
        "Produto não encontrado",
        "PRODUTO_NAO_ENCONTRADO",
        404
      );
    }

    const dadosAtualizacao: { descricao?: string; ativo?: boolean } = {};

    if (dados.descricao !== undefined) {
      const descricaoNormalizada = dados.descricao.trim();
      if (!descricaoNormalizada) {
        throw new ErroAplicacao(
          "A descrição do produto não pode ficar vazia",
          "DESCRICAO_OBRIGATORIA",
          400
        );
      }
      dadosAtualizacao.descricao = descricaoNormalizada;
    }

    if (dados.ativo !== undefined) {
      dadosAtualizacao.ativo = dados.ativo;
    }

    const produtoAtualizado = await this.repositorioProdutos.atualizar(
      id,
      dadosAtualizacao
    );

    return this.mapearParaResposta(produtoAtualizado);
  }

  async inativarProduto(id: number): Promise<ProdutoResposta> {
    if (!id || isNaN(id)) {
      throw new ErroAplicacao("ID do produto inválido", "ID_INVALIDO", 400);
    }

    const produtoExistente = await this.repositorioProdutos.buscarPorId(id);

    if (!produtoExistente) {
      throw new ErroAplicacao(
        "Produto não encontrado",
        "PRODUTO_NAO_ENCONTRADO",
        404
      );
    }

    const produtoInativado = await this.repositorioProdutos.inativar(id);

    return this.mapearParaResposta(produtoInativado);
  }
}
