import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import {
  FornecedorResposta,
  RequisicaoAtualizarFornecedor,
  RequisicaoConsultarFornecedores,
  RequisicaoCriarFornecedor
} from "../dtos/fornecedor_dto.js";
import {
  RepositorioFornecedores,
  RepositorioFornecedoresPrisma
} from "../repositorios/repositorio_fornecedores.js";
import { Fornecedor } from "@prisma/client";

export class ServicoFornecedores {
  constructor(
    private repositorioFornecedores: RepositorioFornecedores = new RepositorioFornecedoresPrisma()
  ) {}

  private mapearParaResposta(fornecedor: Fornecedor): FornecedorResposta {
    return {
      id: fornecedor.id,
      nome: fornecedor.nome,
      observacao: fornecedor.observacao,
      ativo: fornecedor.ativo,
      criado_em: fornecedor.criado_em,
      atualizado_em: fornecedor.atualizado_em
    };
  }

  async criarFornecedor(dados: RequisicaoCriarFornecedor): Promise<FornecedorResposta> {
    const nomeNormalizado = dados.nome.trim();

    if (!nomeNormalizado) {
      throw new ErroAplicacao(
        "O nome do fornecedor é obrigatório",
        "NOME_OBRIGATORIO",
        400
      );
    }

    const observacaoNormalizada = dados.observacao !== undefined
      ? (dados.observacao.trim() || null)
      : null;

    const novoFornecedor = await this.repositorioFornecedores.criar({
      nome: nomeNormalizado,
      observacao: observacaoNormalizada
    });

    return this.mapearParaResposta(novoFornecedor);
  }

  async buscarFornecedorPorId(id: number): Promise<FornecedorResposta> {
    if (!id || isNaN(id)) {
      throw new ErroAplicacao("ID do fornecedor inválido", "ID_INVALIDO", 400);
    }

    const fornecedor = await this.repositorioFornecedores.buscarPorId(id);

    if (!fornecedor) {
      throw new ErroAplicacao(
        "Fornecedor não encontrado",
        "FORNECEDOR_NAO_ENCONTRADO",
        404
      );
    }

    return this.mapearParaResposta(fornecedor);
  }

  async listarFornecedores(filtros: RequisicaoConsultarFornecedores) {
    const { pagina, limite, busca, ativo } = filtros;

    const { fornecedores, total } = await this.repositorioFornecedores.listar({
      pagina,
      limite,
      busca,
      ativo
    });

    const totalPaginas = Math.ceil(total / limite) || 1;

    return {
      dados: fornecedores.map((f) => this.mapearParaResposta(f)),
      paginacao: {
        pagina,
        limite,
        total,
        total_paginas: totalPaginas
      }
    };
  }

  async atualizarFornecedor(
    id: number,
    dados: RequisicaoAtualizarFornecedor
  ): Promise<FornecedorResposta> {
    if (!id || isNaN(id)) {
      throw new ErroAplicacao("ID do fornecedor inválido", "ID_INVALIDO", 400);
    }

    const fornecedorExistente = await this.repositorioFornecedores.buscarPorId(id);

    if (!fornecedorExistente) {
      throw new ErroAplicacao(
        "Fornecedor não encontrado",
        "FORNECEDOR_NAO_ENCONTRADO",
        404
      );
    }

    const dadosAtualizacao: {
      nome?: string;
      observacao?: string | null;
      ativo?: boolean;
    } = {};

    if (dados.nome !== undefined) {
      const nomeNormalizado = dados.nome.trim();
      if (!nomeNormalizado) {
        throw new ErroAplicacao(
          "O nome do fornecedor não pode ficar vazio",
          "NOME_OBRIGATORIO",
          400
        );
      }
      dadosAtualizacao.nome = nomeNormalizado;
    }

    if (dados.observacao !== undefined) {
      dadosAtualizacao.observacao = dados.observacao.trim() || null;
    }

    if (dados.ativo !== undefined) {
      dadosAtualizacao.ativo = dados.ativo;
    }

    const fornecedorAtualizado = await this.repositorioFornecedores.atualizar(
      id,
      dadosAtualizacao
    );

    return this.mapearParaResposta(fornecedorAtualizado);
  }

  async inativarFornecedor(id: number): Promise<FornecedorResposta> {
    if (!id || isNaN(id)) {
      throw new ErroAplicacao("ID do fornecedor inválido", "ID_INVALIDO", 400);
    }

    const fornecedorExistente = await this.repositorioFornecedores.buscarPorId(id);

    if (!fornecedorExistente) {
      throw new ErroAplicacao(
        "Fornecedor não encontrado",
        "FORNECEDOR_NAO_ENCONTRADO",
        404
      );
    }

    const fornecedorInativado = await this.repositorioFornecedores.inativar(id);

    return this.mapearParaResposta(fornecedorInativado);
  }
}
