import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import {
  RepositorioClientes,
  RepositorioClientesPrisma
} from "../../clientes/repositorios/repositorio_clientes.js";
import {
  RepositorioProdutos,
  RepositorioProdutosPrisma
} from "../../produtos/repositorios/repositorio_produtos.js";
import {
  RequisicaoConsultarVendas,
  RequisicaoCriarVenda,
  VendaResposta
} from "../dtos/venda_dto.js";
import {
  RepositorioVendas,
  RepositorioVendasPrisma,
  VendaComRelacoes
} from "../repositorios/repositorio_vendas.js";

export class ServicoVendas {
  constructor(
    private repositorioVendas: RepositorioVendas = new RepositorioVendasPrisma(),
    private repositorioProdutos: RepositorioProdutos = new RepositorioProdutosPrisma(),
    private repositorioClientes: RepositorioClientes = new RepositorioClientesPrisma()
  ) {}

  private mapearParaResposta(venda: VendaComRelacoes): VendaResposta {
    return {
      id: venda.id,
      data_venda: venda.data_venda,
      cliente_id: venda.cliente_id,
      cliente: {
        id: venda.cliente.id,
        nome: venda.cliente.nome
      },
      produto_id: venda.produto_id,
      produto: {
        id: venda.produto.id,
        descricao: venda.produto.descricao
      },
      quantidade: venda.quantidade,
      valor_unitario: Number(venda.valor_unitario),
      valor_total: Number(venda.valor_total),
      criado_em: venda.criado_em,
      atualizado_em: venda.atualizado_em
    };
  }

  async registrarVenda(dados: RequisicaoCriarVenda): Promise<VendaResposta> {
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

    // 3. Validação de cliente
    if (!dados.cliente_id || isNaN(dados.cliente_id)) {
      throw new ErroAplicacao("ID do cliente inválido", "CLIENTE_INVALIDO", 400);
    }

    const cliente = await this.repositorioClientes.buscarPorId(dados.cliente_id);
    if (!cliente) {
      throw new ErroAplicacao("Cliente não encontrado", "CLIENTE_NAO_ENCONTRADO", 404);
    }

    if (!cliente.ativo) {
      throw new ErroAplicacao(
        "Não é possível registrar venda para cliente inativo",
        "CLIENTE_INATIVO",
        400
      );
    }

    // 4. Validação de produto
    if (!dados.produto_id || isNaN(dados.produto_id)) {
      throw new ErroAplicacao("ID do produto inválido", "PRODUTO_INVALIDO", 400);
    }

    const produto = await this.repositorioProdutos.buscarPorId(dados.produto_id);
    if (!produto) {
      throw new ErroAplicacao("Produto não encontrado", "PRODUTO_NAO_ENCONTRADO", 404);
    }

    if (!produto.ativo) {
      throw new ErroAplicacao(
        "Não é possível registrar venda para produto inativo",
        "PRODUTO_INATIVO",
        400
      );
    }

    // 5. Validação de disponibilidade de estoque
    if (produto.quantidade_estoque < dados.quantidade) {
      throw new ErroAplicacao(
        `Estoque insuficiente para realizar esta venda. Estoque disponível: ${produto.quantidade_estoque}, Quantidade solicitada: ${dados.quantidade}`,
        "ESTOQUE_INSUFICIENTE",
        400
      );
    }

    // 6. Cálculo oficial do valor_total no back-end (arredondado para 2 casas decimais)
    const valorUnitarioPrecisao = Number(Number(dados.valor_unitario).toFixed(2));
    const valorTotalCalculado = Number((dados.quantidade * valorUnitarioPrecisao).toFixed(2));

    // 7. Execução atômica da transação com proteção de concorrência
    const vendaCriada = await this.repositorioVendas.executarTransacaoVenda({
      cliente_id: cliente.id,
      produto_id: produto.id,
      quantidade: dados.quantidade,
      valor_unitario: valorUnitarioPrecisao,
      valor_total: valorTotalCalculado,
      data_venda: dados.data_venda,
      produto_descricao: produto.descricao,
      cliente_nome: cliente.nome
    });

    return this.mapearParaResposta(vendaCriada);
  }

  async buscarVendaPorId(id: number): Promise<VendaResposta> {
    if (!id || isNaN(id)) {
      throw new ErroAplicacao("ID da venda inválido", "ID_INVALIDO", 400);
    }

    const venda = await this.repositorioVendas.buscarPorId(id);
    if (!venda) {
      throw new ErroAplicacao("Venda não encontrada", "VENDA_NAO_ENCONTRADA", 404);
    }

    return this.mapearParaResposta(venda);
  }

  async listarVendas(filtros: RequisicaoConsultarVendas) {
    const { pagina, limite, data_inicio, data_fim, cliente_id, produto_id } = filtros;

    const { vendas, total } = await this.repositorioVendas.listar({
      pagina,
      limite,
      data_inicio,
      data_fim,
      cliente_id,
      produto_id
    });

    const totalPaginas = Math.ceil(total / limite) || 1;

    return {
      dados: vendas.map((v) => this.mapearParaResposta(v)),
      paginacao: {
        pagina,
        limite,
        total,
        total_paginas: totalPaginas
      }
    };
  }
}
