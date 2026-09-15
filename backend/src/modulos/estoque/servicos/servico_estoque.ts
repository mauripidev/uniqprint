import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import {
  RepositorioProdutos,
  RepositorioProdutosPrisma
} from "../../produtos/repositorios/repositorio_produtos.js";
import {
  AjusteResposta,
  ItemEstoqueResposta,
  MovimentacaoResposta,
  RequisicaoConsultarEstoque,
  RequisicaoConsultarMovimentacoes,
  RequisicaoRegistrarAjuste
} from "../dtos/estoque_dto.js";
import {
  LIMIAR_ESTOQUE_BAIXO,
  MovimentacaoComProduto,
  RepositorioEstoque,
  RepositorioEstoquePrisma
} from "../repositorios/repositorio_estoque.js";

function classificarStatusEstoque(quantidade: number): "normal" | "baixo" | "sem_estoque" {
  if (quantidade === 0) return "sem_estoque";
  if (quantidade <= LIMIAR_ESTOQUE_BAIXO) return "baixo";
  return "normal";
}

function mapearMovimentacao(mov: MovimentacaoComProduto): MovimentacaoResposta {
  return {
    id: mov.id,
    produto_id: mov.produto_id,
    produto: {
      id: mov.produto.id,
      descricao: mov.produto.descricao
    },
    tipo: mov.tipo,
    quantidade: mov.quantidade,
    tipo_referencia: mov.tipo_referencia,
    referencia_id: mov.referencia_id,
    observacao: mov.observacao,
    criado_em: mov.criado_em
  };
}

export class ServicoEstoque {
  constructor(
    private repositorioEstoque: RepositorioEstoque = new RepositorioEstoquePrisma(),
    private repositorioProdutos: RepositorioProdutos = new RepositorioProdutosPrisma()
  ) {}

  async listarEstoque(filtros: RequisicaoConsultarEstoque) {
    const { pagina, limite, busca, status } = filtros;

    const { produtos, total, resumo } = await this.repositorioEstoque.listarEstoque({
      pagina,
      limite,
      busca,
      status
    });

    const totalPaginas = Math.ceil(total / limite) || 1;

    const dados: ItemEstoqueResposta[] = produtos.map((p) => ({
      id: p.id,
      descricao: p.descricao,
      quantidade_estoque: p.quantidade_estoque,
      ativo: p.ativo,
      status: classificarStatusEstoque(p.quantidade_estoque)
    }));

    return {
      dados,
      resumo,
      paginacao: {
        pagina,
        limite,
        total,
        total_paginas: totalPaginas
      }
    };
  }

  async listarMovimentacoes(filtros: RequisicaoConsultarMovimentacoes) {
    const { pagina, limite, produto_id, tipo, data_inicio, data_fim } = filtros;

    const { movimentacoes, total } = await this.repositorioEstoque.listarMovimentacoes({
      pagina,
      limite,
      produto_id,
      tipo,
      data_inicio,
      data_fim
    });

    const totalPaginas = Math.ceil(total / limite) || 1;

    return {
      dados: movimentacoes.map(mapearMovimentacao),
      paginacao: {
        pagina,
        limite,
        total,
        total_paginas: totalPaginas
      }
    };
  }

  async registrarAjuste(dados: RequisicaoRegistrarAjuste): Promise<AjusteResposta> {
    // 1. Validação de quantidade
    if (!dados.quantidade || dados.quantidade <= 0 || !Number.isInteger(dados.quantidade)) {
      throw new ErroAplicacao(
        "A quantidade deve ser um número inteiro maior que zero",
        "QUANTIDADE_INVALIDA",
        400
      );
    }

    // 2. Validação de observação
    if (!dados.observacao || dados.observacao.trim().length < 3) {
      throw new ErroAplicacao(
        "A justificativa é obrigatória e deve ter pelo menos 3 caracteres",
        "OBSERVACAO_INVALIDA",
        400
      );
    }

    // 3. Validação de produto
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
        "Não é possível realizar ajuste para produto inativo",
        "PRODUTO_INATIVO",
        400
      );
    }

    // 4. Validação prévia de estoque (a validação definitiva ocorre na transação)
    if (dados.tipo_ajuste === "SAIDA" && produto.quantidade_estoque < dados.quantidade) {
      throw new ErroAplicacao(
        `O ajuste resultaria em estoque negativo. Estoque disponível: ${produto.quantidade_estoque}, Quantidade solicitada: ${dados.quantidade}`,
        "ESTOQUE_INSUFICIENTE",
        400
      );
    }

    // 5. Execução atômica da transação
    const resultado = await this.repositorioEstoque.executarTransacaoAjuste({
      produto_id: dados.produto_id,
      tipo_ajuste: dados.tipo_ajuste,
      quantidade: dados.quantidade,
      observacao: dados.observacao.trim()
    });

    return {
      id: resultado.movimentacao.id,
      produto_id: resultado.movimentacao.produto_id,
      produto: {
        id: resultado.movimentacao.produto.id,
        descricao: resultado.movimentacao.produto.descricao
      },
      tipo: resultado.movimentacao.tipo,
      quantidade: resultado.movimentacao.quantidade,
      tipo_referencia: resultado.movimentacao.tipo_referencia!,
      observacao: resultado.movimentacao.observacao!,
      estoque_anterior: resultado.estoque_anterior,
      estoque_novo: resultado.estoque_novo,
      criado_em: resultado.movimentacao.criado_em
    };
  }
}
