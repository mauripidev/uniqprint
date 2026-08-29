import { describe, expect, it } from "vitest";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import {
  DadosAtualizarFornecedor,
  DadosCriarFornecedor,
  FiltrosListagemFornecedores,
  RepositorioFornecedores
} from "../repositorios/repositorio_fornecedores.js";
import { ServicoFornecedores } from "./servico_fornecedores.js";
import { Fornecedor } from "@prisma/client";

// Mock em memória do repositório de fornecedores
class RepositorioFornecedoresMemoria implements RepositorioFornecedores {
  public fornecedores: Fornecedor[] = [];
  private proximoId = 1;

  async criar(dados: DadosCriarFornecedor): Promise<Fornecedor> {
    const novoFornecedor: Fornecedor = {
      id: this.proximoId++,
      nome: dados.nome,
      observacao: dados.observacao ?? null,
      ativo: true,
      criado_em: new Date(),
      atualizado_em: new Date()
    };
    this.fornecedores.push(novoFornecedor);
    return novoFornecedor;
  }

  async buscarPorId(id: number): Promise<Fornecedor | null> {
    return this.fornecedores.find((f) => f.id === id) ?? null;
  }

  async buscarPorNome(nome: string): Promise<Fornecedor | null> {
    return this.fornecedores.find((f) => f.nome === nome) ?? null;
  }

  async listar(
    filtros: FiltrosListagemFornecedores
  ): Promise<{ fornecedores: Fornecedor[]; total: number }> {
    let filtrados = [...this.fornecedores];

    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      filtrados = filtrados.filter(
        (f) =>
          f.nome.toLowerCase().includes(termo) ||
          (f.observacao && f.observacao.toLowerCase().includes(termo))
      );
    }

    if (filtros.ativo !== undefined) {
      filtrados = filtrados.filter((f) => f.ativo === filtros.ativo);
    }

    const total = filtrados.length;
    const inicio = (filtros.pagina - 1) * filtros.limite;
    const paginados = filtrados.slice(inicio, inicio + filtros.limite);

    return { fornecedores: paginados, total };
  }

  async atualizar(id: number, dados: DadosAtualizarFornecedor): Promise<Fornecedor> {
    const fornecedor = this.fornecedores.find((f) => f.id === id);
    if (!fornecedor) throw new Error("Fornecedor não encontrado");

    if (dados.nome !== undefined) fornecedor.nome = dados.nome;
    if (dados.observacao !== undefined) fornecedor.observacao = dados.observacao;
    if (dados.ativo !== undefined) fornecedor.ativo = dados.ativo;
    fornecedor.atualizado_em = new Date();

    return fornecedor;
  }

  async inativar(id: number): Promise<Fornecedor> {
    return this.atualizar(id, { ativo: false });
  }
}

describe("ServicoFornecedores (Regras de Negócio de Fornecedores)", () => {
  it("deve criar um fornecedor com sucesso e status ativo por padrão", async () => {
    const repositorio = new RepositorioFornecedoresMemoria();
    const servico = new ServicoFornecedores(repositorio);

    const fornecedor = await servico.criarFornecedor({
      nome: "Distribuidora de Papéis Alpha",
      observacao: "Entrega em 24h"
    });

    expect(fornecedor.id).toBeDefined();
    expect(fornecedor.nome).toBe("Distribuidora de Papéis Alpha");
    expect(fornecedor.observacao).toBe("Entrega em 24h");
    expect(fornecedor.ativo).toBe(true);
  });

  it("não deve permitir criar fornecedor com nome vazio ou apenas espaços", async () => {
    const repositorio = new RepositorioFornecedoresMemoria();
    const servico = new ServicoFornecedores(repositorio);

    await expect(
      servico.criarFornecedor({
        nome: "   ",
        observacao: "Sem nome válido"
      })
    ).rejects.toMatchObject({
      codigo: "NOME_OBRIGATORIO",
      statusHttp: 400
    });
  });

  it("deve listar fornecedores com paginação e filtro de busca", async () => {
    const repositorio = new RepositorioFornecedoresMemoria();
    const servico = new ServicoFornecedores(repositorio);

    await servico.criarFornecedor({ nome: "Papelaria Central" });
    await servico.criarFornecedor({ nome: "Tintas & Cia" });
    await servico.criarFornecedor({ nome: "Papel & Arte Distribuidora" });

    const resultadoBusca = await servico.listarFornecedores({
      pagina: 1,
      limite: 10,
      busca: "Papel"
    });


    expect(resultadoBusca.dados.length).toBe(2);
    expect(resultadoBusca.paginacao.total).toBe(2);

    const resultadoPaginado = await servico.listarFornecedores({
      pagina: 1,
      limite: 2
    });
    expect(resultadoPaginado.dados.length).toBe(2);
    expect(resultadoPaginado.paginacao.total).toBe(3);
    expect(resultadoPaginado.paginacao.total_paginas).toBe(2);
  });

  it("deve buscar fornecedor por ID existente e lançar erro 404 para inexistente", async () => {
    const repositorio = new RepositorioFornecedoresMemoria();
    const servico = new ServicoFornecedores(repositorio);

    const criado = await servico.criarFornecedor({
      nome: "Gráfica Fornecedora Matriz"
    });

    const encontrado = await servico.buscarFornecedorPorId(criado.id);
    expect(encontrado.id).toBe(criado.id);
    expect(encontrado.nome).toBe("Gráfica Fornecedora Matriz");

    await expect(servico.buscarFornecedorPorId(999)).rejects.toMatchObject({
      codigo: "FORNECEDOR_NAO_ENCONTRADO",
      statusHttp: 404
    });
  });

  it("deve atualizar os dados de um fornecedor", async () => {
    const repositorio = new RepositorioFornecedoresMemoria();
    const servico = new ServicoFornecedores(repositorio);

    const criado = await servico.criarFornecedor({
      nome: "Fornecedor Antigo",
      observacao: "Obs inicial"
    });

    const atualizado = await servico.atualizarFornecedor(criado.id, {
      nome: "Fornecedor Atualizado Ltda",
      observacao: "Nova observação atualizada"
    });

    expect(atualizado.nome).toBe("Fornecedor Atualizado Ltda");
    expect(atualizado.observacao).toBe("Nova observação atualizada");
  });

  it("não deve permitir atualizar fornecedor com nome vazio", async () => {
    const repositorio = new RepositorioFornecedoresMemoria();
    const servico = new ServicoFornecedores(repositorio);

    const criado = await servico.criarFornecedor({
      nome: "Fornecedor Válido"
    });

    await expect(
      servico.atualizarFornecedor(criado.id, { nome: "   " })
    ).rejects.toMatchObject({
      codigo: "NOME_OBRIGATORIO",
      statusHttp: 400
    });
  });

  it("deve inativar logicamente um fornecedor (ativo = false)", async () => {
    const repositorio = new RepositorioFornecedoresMemoria();
    const servico = new ServicoFornecedores(repositorio);

    const criado = await servico.criarFornecedor({
      nome: "Fornecedor Para Inativar"
    });

    const inativado = await servico.inativarFornecedor(criado.id);
    expect(inativado.ativo).toBe(false);

    // O fornecedor ainda deve continuar no banco para manter integridade com histórico de compras
    const busca = await servico.buscarFornecedorPorId(criado.id);
    expect(busca.ativo).toBe(false);
  });
});
