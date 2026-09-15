import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import {
  RepositorioFornecedores,
  RepositorioFornecedoresPrisma
} from "../../fornecedores/repositorios/repositorio_fornecedores.js";
import {
  RepositorioProdutos,
  RepositorioProdutosPrisma
} from "../../produtos/repositorios/repositorio_produtos.js";
import {
  CompraResposta,
  RequisicaoConsultarCompras,
  RequisicaoCriarCompra
} from "../dtos/compra_dto.js";
import {
  CompraComRelacoes,
  RepositorioCompras,
  RepositorioComprasPrisma
} from "../repositorios/repositorio_compras.js";

export class ServicoCompras {
  constructor(
    private repositorioCompras: RepositorioCompras = new RepositorioComprasPrisma(),
    private repositorioProdutos: RepositorioProdutos = new RepositorioProdutosPrisma(),
    private repositorioFornecedores: RepositorioFornecedores = new RepositorioFornecedoresPrisma()
  ) {}

  private mapearParaResposta(compra: CompraComRelacoes): CompraResposta {
    return {
      id: compra.id,
      data_compra: compra.data_compra,
      produto_id: compra.produto_id,
      produto: {
        id: compra.produto.id,
        descricao: compra.produto.descricao
      },
      quantidade: compra.quantidade,
      valor_unitario: Number(compra.valor_unitario),
      valor_total: Number(compra.valor_total),
      fornecedor_id: compra.fornecedor_id,
      fornecedor: {
        id: compra.fornecedor.id,
        nome: compra.fornecedor.nome
      },
      criado_em: compra.criado_em,
      atualizado_em: compra.atualizado_em
    };
  }

  async registrarCompra(dados: RequisicaoCriarCompra): Promise<CompraResposta> {
    // 1. Validação de quantidade
    if (!dados.quantidade || dados.quantidade <= 0 || !Number.isInteger(dados.quantidade)) {
      throw new ErroAplicacao(
        "A quantidade deve ser um número inteiro maior que zero",
        "QUANTIDADE_INVALIDA",
        400
      );
    }

    // 2. Validação de valor unitário
    if (!dados.valor_unitario || dados.valor_unitario <= 0 || isNaN(dados.valor_unitario)) {
      throw new ErroAplicacao(
        "O valor unitário deve ser maior que zero",
        "VALOR_UNITARIO_INVALIDO",
        400
      );
    }

    // 3. Validação de fornecedor
    if (!dados.fornecedor_id || isNaN(dados.fornecedor_id)) {
      throw new ErroAplicacao("ID do fornecedor inválido", "FORNECEDOR_INVALIDO", 400);
    }

    const fornecedor = await this.repositorioFornecedores.buscarPorId(dados.fornecedor_id);
    if (!fornecedor) {
      throw new ErroAplicacao(
        "Fornecedor não encontrado",
        "FORNECEDOR_NAO_ENCONTRADO",
        404
      );
    }

    if (!fornecedor.ativo) {
      throw new ErroAplicacao(
        "Não é possível registrar compra para fornecedor inativo",
        "FORNECEDOR_INATIVO",
        400
      );
    }

    // 4. Validação de produto
    if (!dados.produto_id || isNaN(dados.produto_id)) {
      throw new ErroAplicacao("ID do produto inválido", "PRODUTO_INVALIDO", 400);
    }

    const produto = await this.repositorioProdutos.buscarPorId(dados.produto_id);
    if (!produto) {
      throw new ErroAplicacao(
        "Produto não encontrado",
        "PRODUTO_NAO_ENCONTRADO",
        404
      );
    }

    if (!produto.ativo) {
      throw new ErroAplicacao(
        "Não é possível registrar compra para produto inativo",
        "PRODUTO_INATIVO",
        400
      );
    }

    // 5. Cálculo oficial do valor_total no back-end
    const valorUnitarioPrecisao = Number(Number(dados.valor_unitario).toFixed(2));
    const valorTotalCalculado = Number((dados.quantidade * valorUnitarioPrecisao).toFixed(2));

    // 6. Execução atômica da transação
    const compraCriada = await this.repositorioCompras.executarTransacaoCompra({
      produto_id: produto.id,
      fornecedor_id: fornecedor.id,
      quantidade: dados.quantidade,
      valor_unitario: valorUnitarioPrecisao,
      valor_total: valorTotalCalculado,
      data_compra: dados.data_compra,
      produto_descricao: produto.descricao,
      fornecedor_nome: fornecedor.nome
    });

    return this.mapearParaResposta(compraCriada);
  }

  async buscarCompraPorId(id: number): Promise<CompraResposta> {
    if (!id || isNaN(id)) {
      throw new ErroAplicacao("ID da compra inválido", "ID_INVALIDO", 400);
    }

    const compra = await this.repositorioCompras.buscarPorId(id);
    if (!compra) {
      throw new ErroAplicacao("Compra não encontrada", "COMPRA_NAO_ENCONTRADA", 404);
    }

    return this.mapearParaResposta(compra);
  }

  async listarCompras(filtros: RequisicaoConsultarCompras) {
    const { pagina, limite, data_inicio, data_fim, produto_id, fornecedor_id } = filtros;

    const { compras, total } = await this.repositorioCompras.listar({
      pagina,
      limite,
      data_inicio,
      data_fim,
      produto_id,
      fornecedor_id
    });

    const totalPaginas = Math.ceil(total / limite) || 1;

    return {
      dados: compras.map((c) => this.mapearParaResposta(c)),
      paginacao: {
        pagina,
        limite,
        total,
        total_paginas: totalPaginas
      }
    };
  }
}
