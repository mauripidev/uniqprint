import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import {
  ClienteResposta,
  RequisicaoAtualizarCliente,
  RequisicaoConsultarClientes,
  RequisicaoCriarCliente
} from "../dtos/cliente_dto.js";
import {
  RepositorioClientes,
  RepositorioClientesPrisma
} from "../repositorios/repositorio_clientes.js";
import { Cliente } from "@prisma/client";

function validarTelefoneFormato(telefone?: string | null): boolean {
  if (!telefone) return true;
  const limpo = telefone.trim();
  if (!limpo) return true;
  const digitos = limpo.replace(/\D/g, "");
  return digitos.length >= 8 && digitos.length <= 13;
}

export class ServicoClientes {
  constructor(
    private repositorioClientes: RepositorioClientes = new RepositorioClientesPrisma()
  ) {}

  private mapearParaResposta(cliente: Cliente): ClienteResposta {
    return {
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      observacao: cliente.observacao,
      ativo: cliente.ativo,
      criado_em: cliente.criado_em,
      atualizado_em: cliente.atualizado_em
    };
  }

  async criarCliente(dados: RequisicaoCriarCliente): Promise<ClienteResposta> {
    const nomeNormalizado = dados.nome?.trim();

    if (!nomeNormalizado) {
      throw new ErroAplicacao(
        "O nome do cliente é obrigatório",
        "NOME_OBRIGATORIO",
        400
      );
    }

    if (dados.telefone !== undefined && dados.telefone !== null) {
      if (!validarTelefoneFormato(dados.telefone)) {
        throw new ErroAplicacao("Telefone inválido", "TELEFONE_INVALIDO", 400);
      }
    }

    const telefoneNormalizado = dados.telefone !== undefined
      ? (dados.telefone?.trim() || null)
      : null;

    const observacaoNormalizada = dados.observacao !== undefined
      ? (dados.observacao?.trim() || null)
      : null;

    const novoCliente = await this.repositorioClientes.criar({
      nome: nomeNormalizado,
      telefone: telefoneNormalizado,
      observacao: observacaoNormalizada
    });

    return this.mapearParaResposta(novoCliente);
  }

  async buscarClientePorId(id: number): Promise<ClienteResposta> {
    if (!id || isNaN(id)) {
      throw new ErroAplicacao("ID do cliente inválido", "ID_INVALIDO", 400);
    }

    const cliente = await this.repositorioClientes.buscarPorId(id);

    if (!cliente) {
      throw new ErroAplicacao(
        "Cliente não encontrado",
        "CLIENTE_NAO_ENCONTRADO",
        404
      );
    }

    return this.mapearParaResposta(cliente);
  }

  async listarClientes(filtros: RequisicaoConsultarClientes) {
    const { pagina, limite, busca, ativo } = filtros;

    const { clientes, total } = await this.repositorioClientes.listar({
      pagina,
      limite,
      busca,
      ativo
    });

    const totalPaginas = Math.ceil(total / limite) || 1;

    return {
      dados: clientes.map((c) => this.mapearParaResposta(c)),
      paginacao: {
        pagina,
        limite,
        total,
        total_paginas: totalPaginas
      }
    };
  }

  async atualizarCliente(
    id: number,
    dados: RequisicaoAtualizarCliente
  ): Promise<ClienteResposta> {
    if (!id || isNaN(id)) {
      throw new ErroAplicacao("ID do cliente inválido", "ID_INVALIDO", 400);
    }

    const clienteExistente = await this.repositorioClientes.buscarPorId(id);

    if (!clienteExistente) {
      throw new ErroAplicacao(
        "Cliente não encontrado",
        "CLIENTE_NAO_ENCONTRADO",
        404
      );
    }

    const dadosAtualizacao: {
      nome?: string;
      telefone?: string | null;
      observacao?: string | null;
      ativo?: boolean;
    } = {};

    if (dados.nome !== undefined) {
      const nomeNormalizado = dados.nome.trim();
      if (!nomeNormalizado) {
        throw new ErroAplicacao(
          "O nome do cliente não pode ficar vazio",
          "NOME_OBRIGATORIO",
          400
        );
      }
      dadosAtualizacao.nome = nomeNormalizado;
    }

    if (dados.telefone !== undefined) {
      if (dados.telefone !== null && !validarTelefoneFormato(dados.telefone)) {
        throw new ErroAplicacao("Telefone inválido", "TELEFONE_INVALIDO", 400);
      }
      dadosAtualizacao.telefone = dados.telefone?.trim() || null;
    }

    if (dados.observacao !== undefined) {
      dadosAtualizacao.observacao = dados.observacao?.trim() || null;
    }

    if (dados.ativo !== undefined) {
      dadosAtualizacao.ativo = dados.ativo;
    }

    const clienteAtualizado = await this.repositorioClientes.atualizar(
      id,
      dadosAtualizacao
    );

    return this.mapearParaResposta(clienteAtualizado);
  }

  async inativarCliente(id: number): Promise<ClienteResposta> {
    if (!id || isNaN(id)) {
      throw new ErroAplicacao("ID do cliente inválido", "ID_INVALIDO", 400);
    }

    const clienteExistente = await this.repositorioClientes.buscarPorId(id);

    if (!clienteExistente) {
      throw new ErroAplicacao(
        "Cliente não encontrado",
        "CLIENTE_NAO_ENCONTRADO",
        404
      );
    }

    const clienteInativado = await this.repositorioClientes.inativar(id);

    return this.mapearParaResposta(clienteInativado);
  }
}
