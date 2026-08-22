import { describe, expect, it } from "vitest";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import {
  DadosAtualizarProduto,
  DadosCriarProduto,
  FiltrosListagemProdutos,
  RepositorioProdutos
} from "../repositorios/repositorio_produtos.js";
import { ServicoProdutos } from "./servico_produtos.js";
import { Produto } from "@prisma/client";

// Mock em memória do repositório de produtos
class RepositorioProdutosMemoria implements RepositorioProdutos {
  public produtos: Produto[] = [];
  private proximoId = 1;

  async criar(dados: DadosCriarProduto): Promise<Produto> {
    const novoProduto: Produto = {
      id: this.proximoId++,
      descricao: dados.descricao,
      quantidade_estoque: dados.quantidade_estoque ?? 0,
      ativo: true,
      criado_em: new Date(),
      atualizado_em: new Date()
    };
    this.produtos.push(novoProduto);
    return novoProduto;
  }

  async buscarPorId(id: number): Promise<Produto | null> {
    return this.produtos.find((p) => p.id === id) ?? null;
  }

  async buscarPorDescricao(descricao: string): Promise<Produto | null> {
    return this.produtos.find((p) => p.descricao === descricao) ?? null;
  }

  async listar(
    filtros: FiltrosListagemProdutos
  ): Promise<{ produtos: Produto[]; total: number }> {
    let filtrados = [...this.produtos];

    if (filtros.busca) {
      filtrados = filtrados.filter((p) =>
        p.descricao.toLowerCase().includes(filtros.busca!.toLowerCase())
      );
    }

    if (filtros.ativo !== undefined) {
      filtrados = filtrados.filter((p) => p.ativo === filtros.ativo);
    }

    const total = filtrados.length;
    const inicio = (filtros.pagina - 1) * filtros.limite;
    const paginados = filtrados.slice(inicio, inicio + filtros.limite);

    return { produtos: paginados, total };
  }

  async atualizar(id: number, dados: DadosAtualizarProduto): Promise<Produto> {
    const produto = this.produtos.find((p) => p.id === id);
    if (!produto) throw new Error("Produto não encontrado");

    if (dados.descricao !== undefined) produto.descricao = dados.descricao;
    if (dados.ativo !== undefined) produto.ativo = dados.ativo;
    produto.atualizado_em = new Date();

    return produto;
  }

  async inativar(id: number): Promise<Produto> {
    return this.atualizar(id, { ativo: false });
  }
}

describe("ServicoProdutos (Regras de Negócio de Produtos)", () => {
  it("deve criar um produto com sucesso e estoque inicial padrão 0", async () => {
    const repositorio = new RepositorioProdutosMemoria();
    const servico = new ServicoProdutos(repositorio);

    const produto = await servico.criarProduto({
      descricao: "Papel Sulfite A4 75g",
      quantidade_estoque: 0
    });

    expect(produto.id).toBeDefined();
    expect(produto.descricao).toBe("Papel Sulfite A4 75g");
    expect(produto.quantidade_estoque).toBe(0);
    expect(produto.ativo).toBe(true);
  });

  it("não deve permitir criar produto com descrição vazia", async () => {
    const repositorio = new RepositorioProdutosMemoria();
    const servico = new ServicoProdutos(repositorio);

    await expect(
      servico.criarProduto({
        descricao: "   ",
        quantidade_estoque: 10
      })
    ).rejects.toMatchObject({
      codigo: "DESCRICAO_OBRIGATORIA",
      statusHttp: 400
    });
  });

  it("não deve permitir criar produto com estoque negativo", async () => {
    const repositorio = new RepositorioProdutosMemoria();
    const servico = new ServicoProdutos(repositorio);

    await expect(
      servico.criarProduto({
        descricao: "Tinta Magenta",
        quantidade_estoque: -5
      })
    ).rejects.toMatchObject({
      codigo: "ESTOQUE_INVALIDO",
      statusHttp: 400
    });
  });

  it("deve listar produtos com paginação", async () => {
    const repositorio = new RepositorioProdutosMemoria();
    const servico = new ServicoProdutos(repositorio);

    await servico.criarProduto({ descricao: "Produto 1", quantidade_estoque: 10 });
    await servico.criarProduto({ descricao: "Produto 2", quantidade_estoque: 20 });
    await servico.criarProduto({ descricao: "Produto 3", quantidade_estoque: 30 });

    const resultado = await servico.listarProdutos({
      pagina: 1,
      limite: 2
    });

    expect(resultado.dados.length).toBe(2);
    expect(resultado.paginacao.total).toBe(3);
    expect(resultado.paginacao.total_paginas).toBe(2);
  });

  it("deve buscar produto por ID existente e lançar erro para inexistente", async () => {
    const repositorio = new RepositorioProdutosMemoria();
    const servico = new ServicoProdutos(repositorio);

    const criado = await servico.criarProduto({
      descricao: "Banner Lona 440g",
      quantidade_estoque: 5
    });

    const encontrado = await servico.buscarProdutoPorId(criado.id);
    expect(encontrado.id).toBe(criado.id);

    await expect(servico.buscarProdutoPorId(999)).rejects.toMatchObject({
      codigo: "PRODUTO_NAO_ENCONTRADO",
      statusHttp: 404
    });
  });

  it("deve atualizar a descrição de um produto", async () => {
    const repositorio = new RepositorioProdutosMemoria();
    const servico = new ServicoProdutos(repositorio);

    const criado = await servico.criarProduto({
      descricao: "Adesivo Vinil",
      quantidade_estoque: 15
    });

    const atualizado = await servico.atualizarProduto(criado.id, {
      descricao: "Adesivo Vinil Fosco Premium"
    });

    expect(atualizado.descricao).toBe("Adesivo Vinil Fosco Premium");
  });

  it("deve inativar logicamente um produto (ativo = false)", async () => {
    const repositorio = new RepositorioProdutosMemoria();
    const servico = new ServicoProdutos(repositorio);

    const criado = await servico.criarProduto({
      descricao: "Cartão de Visita",
      quantidade_estoque: 100
    });

    const inativado = await servico.inativarProduto(criado.id);
    expect(inativado.ativo).toBe(false);

    // Produto ainda deve existir no banco para histórico
    const busca = await servico.buscarProdutoPorId(criado.id);
    expect(busca.ativo).toBe(false);
  });
});
