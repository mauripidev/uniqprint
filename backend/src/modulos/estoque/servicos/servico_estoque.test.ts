import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import { RepositorioProdutos } from "../../produtos/repositorios/repositorio_produtos.js";
import { RepositorioEstoque } from "../repositorios/repositorio_estoque.js";
import { ServicoEstoque } from "./servico_estoque.js";
import { Produto } from "@prisma/client";

describe("Serviço de Estoque (Regras de Negócio e Ajustes Manuais)", () => {
  let repositorioEstoqueMock: RepositorioEstoque;
  let repositorioProdutosMock: RepositorioProdutos;
  let servicoEstoque: ServicoEstoque;

  const produtoAtivoExemplo: Produto = {
    id: 10,
    descricao: "Tinta Sublimática Preta 1L",
    quantidade_estoque: 10,
    ativo: true,
    criado_em: new Date(),
    atualizado_em: new Date()
  };

  const produtoInativoExemplo: Produto = {
    id: 20,
    descricao: "Bobina Térmica Antiga",
    quantidade_estoque: 5,
    ativo: false,
    criado_em: new Date(),
    atualizado_em: new Date()
  };

  beforeEach(() => {
    repositorioEstoqueMock = {
      listarEstoque: vi.fn(),
      listarMovimentacoes: vi.fn(),
      executarTransacaoAjuste: vi.fn()
    };

    repositorioProdutosMock = {
      criar: vi.fn(),
      buscarPorId: vi.fn(),
      buscarPorDescricao: vi.fn(),
      listar: vi.fn(),
      atualizar: vi.fn(),
      inativar: vi.fn()
    };

    servicoEstoque = new ServicoEstoque(
      repositorioEstoqueMock,
      repositorioProdutosMock
    );
  });

  describe("Ajustes Manuais de Estoque (registrarAjuste)", () => {
    it("deve realizar ajuste positivo (+5 em estoque 10 -> 15) com sucesso", async () => {
      vi.mocked(repositorioProdutosMock.buscarPorId).mockResolvedValueOnce(produtoAtivoExemplo);
      vi.mocked(repositorioEstoqueMock.executarTransacaoAjuste).mockResolvedValueOnce({
        movimentacao: {
          id: 101,
          produto_id: 10,
          produto: { id: 10, descricao: "Tinta Sublimática Preta 1L" },
          tipo: "AJUSTE",
          quantidade: 5,
          tipo_referencia: "AJUSTE_ENTRADA",
          referencia_id: null,
          observacao: "Acerto de inventário físico",
          criado_em: new Date()
        },
        estoque_anterior: 10,
        estoque_novo: 15
      });

      const resultado = await servicoEstoque.registrarAjuste({
        produto_id: 10,
        tipo_ajuste: "ENTRADA",
        quantidade: 5,
        observacao: "Acerto de inventário físico"
      });

      expect(resultado.id).toBe(101);
      expect(resultado.produto_id).toBe(10);
      expect(resultado.tipo).toBe("AJUSTE");
      expect(resultado.tipo_referencia).toBe("AJUSTE_ENTRADA");
      expect(resultado.estoque_anterior).toBe(10);
      expect(resultado.estoque_novo).toBe(15);
      expect(repositorioEstoqueMock.executarTransacaoAjuste).toHaveBeenCalledWith({
        produto_id: 10,
        tipo_ajuste: "ENTRADA",
        quantidade: 5,
        observacao: "Acerto de inventário físico"
      });
    });

    it("deve realizar ajuste negativo (-3 em estoque 10 -> 7) com sucesso", async () => {
      vi.mocked(repositorioProdutosMock.buscarPorId).mockResolvedValueOnce(produtoAtivoExemplo);
      vi.mocked(repositorioEstoqueMock.executarTransacaoAjuste).mockResolvedValueOnce({
        movimentacao: {
          id: 102,
          produto_id: 10,
          produto: { id: 10, descricao: "Tinta Sublimática Preta 1L" },
          tipo: "AJUSTE",
          quantidade: 3,
          tipo_referencia: "AJUSTE_SAIDA",
          referencia_id: null,
          observacao: "Frascos danificados no transporte interno",
          criado_em: new Date()
        },
        estoque_anterior: 10,
        estoque_novo: 7
      });

      const resultado = await servicoEstoque.registrarAjuste({
        produto_id: 10,
        tipo_ajuste: "SAIDA",
        quantidade: 3,
        observacao: "Frascos danificados no transporte interno"
      });

      expect(resultado.id).toBe(102);
      expect(resultado.tipo_referencia).toBe("AJUSTE_SAIDA");
      expect(resultado.estoque_anterior).toBe(10);
      expect(resultado.estoque_novo).toBe(7);
    });

    it("deve permitir ajuste negativo exato para zero (-10 em estoque 10 -> 0)", async () => {
      vi.mocked(repositorioProdutosMock.buscarPorId).mockResolvedValueOnce(produtoAtivoExemplo);
      vi.mocked(repositorioEstoqueMock.executarTransacaoAjuste).mockResolvedValueOnce({
        movimentacao: {
          id: 103,
          produto_id: 10,
          produto: { id: 10, descricao: "Tinta Sublimática Preta 1L" },
          tipo: "AJUSTE",
          quantidade: 10,
          tipo_referencia: "AJUSTE_SAIDA",
          referencia_id: null,
          observacao: "Descarte de lote vencido",
          criado_em: new Date()
        },
        estoque_anterior: 10,
        estoque_novo: 0
      });

      const resultado = await servicoEstoque.registrarAjuste({
        produto_id: 10,
        tipo_ajuste: "SAIDA",
        quantidade: 10,
        observacao: "Descarte de lote vencido"
      });

      expect(resultado.estoque_novo).toBe(0);
    });

    it("deve rejeitar ajuste negativo que exceda o estoque disponível (-11 em estoque 10)", async () => {
      vi.mocked(repositorioProdutosMock.buscarPorId).mockResolvedValueOnce(produtoAtivoExemplo);

      await expect(
        servicoEstoque.registrarAjuste({
          produto_id: 10,
          tipo_ajuste: "SAIDA",
          quantidade: 11,
          observacao: "Tentativa de ajuste excessivo"
        })
      ).rejects.toMatchObject({
        codigo: "ESTOQUE_INSUFICIENTE",
        statusHttp: 400
      });

      expect(repositorioEstoqueMock.executarTransacaoAjuste).not.toHaveBeenCalled();
    });

    it("deve rejeitar quantidade zero ou negativa", async () => {
      await expect(
        servicoEstoque.registrarAjuste({
          produto_id: 10,
          tipo_ajuste: "ENTRADA",
          quantidade: 0,
          observacao: "Ajuste zerado"
        })
      ).rejects.toMatchObject({
        codigo: "QUANTIDADE_INVALIDA",
        statusHttp: 400
      });

      await expect(
        servicoEstoque.registrarAjuste({
          produto_id: 10,
          tipo_ajuste: "ENTRADA",
          quantidade: -5,
          observacao: "Ajuste negativo"
        })
      ).rejects.toMatchObject({
        codigo: "QUANTIDADE_INVALIDA",
        statusHttp: 400
      });
    });

    it("deve rejeitar observação vazia ou menor que 3 caracteres", async () => {
      await expect(
        servicoEstoque.registrarAjuste({
          produto_id: 10,
          tipo_ajuste: "ENTRADA",
          quantidade: 5,
          observacao: "  "
        })
      ).rejects.toMatchObject({
        codigo: "OBSERVACAO_INVALIDA",
        statusHttp: 400
      });

      await expect(
        servicoEstoque.registrarAjuste({
          produto_id: 10,
          tipo_ajuste: "ENTRADA",
          quantidade: 5,
          observacao: "ab"
        })
      ).rejects.toMatchObject({
        codigo: "OBSERVACAO_INVALIDA",
        statusHttp: 400
      });
    });

    it("deve rejeitar ajuste para produto inexistente", async () => {
      vi.mocked(repositorioProdutosMock.buscarPorId).mockResolvedValueOnce(null);

      await expect(
        servicoEstoque.registrarAjuste({
          produto_id: 9999,
          tipo_ajuste: "ENTRADA",
          quantidade: 5,
          observacao: "Produto fantasma"
        })
      ).rejects.toMatchObject({
        codigo: "PRODUTO_NAO_ENCONTRADO",
        statusHttp: 404
      });
    });

    it("deve rejeitar ajuste para produto inativo", async () => {
      vi.mocked(repositorioProdutosMock.buscarPorId).mockResolvedValueOnce(produtoInativoExemplo);

      await expect(
        servicoEstoque.registrarAjuste({
          produto_id: 20,
          tipo_ajuste: "ENTRADA",
          quantidade: 5,
          observacao: "Tentativa em produto inativo"
        })
      ).rejects.toMatchObject({
        codigo: "PRODUTO_INATIVO",
        statusHttp: 400
      });
    });
  });

  describe("Listagem e Classificação de Estoque (listarEstoque)", () => {
    it("deve classificar corretamente os status: normal, baixo e sem_estoque", async () => {
      vi.mocked(repositorioEstoqueMock.listarEstoque).mockResolvedValueOnce({
        produtos: [
          { id: 1, descricao: "Produto Abundante", quantidade_estoque: 20, ativo: true },
          { id: 2, descricao: "Produto Limite Normal", quantidade_estoque: 6, ativo: true },
          { id: 3, descricao: "Produto Baixo", quantidade_estoque: 5, ativo: true },
          { id: 4, descricao: "Produto Muito Baixo", quantidade_estoque: 1, ativo: true },
          { id: 5, descricao: "Produto Esgotado", quantidade_estoque: 0, ativo: true }
        ],
        total: 5,
        resumo: {
          total_produtos: 5,
          estoque_baixo: 2,
          sem_estoque: 1
        }
      });

      const resultado = await servicoEstoque.listarEstoque({
        pagina: 1,
        limite: 10,
        status: "todos"
      });

      expect(resultado.dados[0].status).toBe("normal");
      expect(resultado.dados[1].status).toBe("normal");
      expect(resultado.dados[2].status).toBe("baixo");
      expect(resultado.dados[3].status).toBe("baixo");
      expect(resultado.dados[4].status).toBe("sem_estoque");

      expect(resultado.resumo.total_produtos).toBe(5);
      expect(resultado.resumo.estoque_baixo).toBe(2);
      expect(resultado.resumo.sem_estoque).toBe(1);
    });
  });

  describe("Listagem de Movimentações (listarMovimentacoes)", () => {
    it("deve retornar movimentações formatadas com paginação", async () => {
      const dataCriacao = new Date();
      vi.mocked(repositorioEstoqueMock.listarMovimentacoes).mockResolvedValueOnce({
        movimentacoes: [
          {
            id: 1,
            produto_id: 10,
            produto: { id: 10, descricao: "Tinta Sublimática" },
            tipo: "ENTRADA",
            quantidade: 20,
            tipo_referencia: "COMPRA",
            referencia_id: 5,
            observacao: "Entrada por compra",
            criado_em: dataCriacao
          }
        ],
        total: 1
      });

      const resultado = await servicoEstoque.listarMovimentacoes({
        pagina: 1,
        limite: 10
      });

      expect(resultado.dados).toHaveLength(1);
      expect(resultado.dados[0].produto.descricao).toBe("Tinta Sublimática");
      expect(resultado.paginacao.total).toBe(1);
    });
  });
});
