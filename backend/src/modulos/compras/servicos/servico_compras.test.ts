import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import { RepositorioFornecedores } from "../../fornecedores/repositorios/repositorio_fornecedores.js";
import { RepositorioProdutos } from "../../produtos/repositorios/repositorio_produtos.js";
import { CompraComRelacoes, RepositorioCompras } from "../repositorios/repositorio_compras.js";
import { ServicoCompras } from "./servico_compras.js";
import { Fornecedor, Produto, Prisma } from "@prisma/client";

describe("Serviço de Compras (Regras de Negócio)", () => {
  let repositorioComprasMock: RepositorioCompras;
  let repositorioProdutosMock: RepositorioProdutos;
  let repositorioFornecedoresMock: RepositorioFornecedores;
  let servicoCompras: ServicoCompras;

  const produtoAtivoExemplo: Produto = {
    id: 10,
    descricao: "Papel Couché 180g A4",
    quantidade_estoque: 20,
    ativo: true,
    criado_em: new Date(),
    atualizado_em: new Date()
  };

  const fornecedorAtivoExemplo: Fornecedor = {
    id: 20,
    nome: "Distribuidora Papel & Cia",
    observacao: "Fornecedor principal",
    ativo: true,
    criado_em: new Date(),
    atualizado_em: new Date()
  };

  const compraExemplo: CompraComRelacoes = {
    id: 100,
    data_compra: new Date("2026-08-29T10:00:00.000Z"),
    produto_id: 10,
    produto: {
      id: 10,
      descricao: "Papel Couché 180g A4"
    },
    quantidade: 5,
    valor_unitario: new Prisma.Decimal(25.5),
    valor_total: new Prisma.Decimal(127.5),
    fornecedor_id: 20,
    fornecedor: {
      id: 20,
      nome: "Distribuidora Papel & Cia"
    },
    criado_em: new Date(),
    atualizado_em: new Date()
  };

  beforeEach(() => {
    repositorioComprasMock = {
      buscarPorId: vi.fn(),
      listar: vi.fn(),
      executarTransacaoCompra: vi.fn()
    };
    repositorioProdutosMock = {
      criar: vi.fn(),
      buscarPorId: vi.fn(),
      buscarPorDescricao: vi.fn(),
      listar: vi.fn(),
      atualizar: vi.fn(),
      inativar: vi.fn()
    };
    repositorioFornecedoresMock = {
      criar: vi.fn(),
      buscarPorId: vi.fn(),
      buscarPorNome: vi.fn(),
      listar: vi.fn(),
      atualizar: vi.fn(),
      inativar: vi.fn()
    };

    servicoCompras = new ServicoCompras(
      repositorioComprasMock,
      repositorioProdutosMock,
      repositorioFornecedoresMock
    );
  });

  describe("Registro de Compra (registrarCompra)", () => {
    it("deve registrar compra válida com cálculo correto do valor total", async () => {
      vi.mocked(repositorioFornecedoresMock.buscarPorId).mockResolvedValueOnce(
        fornecedorAtivoExemplo
      );
      vi.mocked(repositorioProdutosMock.buscarPorId).mockResolvedValueOnce(
        produtoAtivoExemplo
      );
      vi.mocked(repositorioComprasMock.executarTransacaoCompra).mockResolvedValueOnce(
        compraExemplo
      );

      const resultado = await servicoCompras.registrarCompra({
        produto_id: 10,
        fornecedor_id: 20,
        quantidade: 5,
        valor_unitario: 25.5
      });

      expect(resultado.id).toBe(100);
      expect(resultado.quantidade).toBe(5);
      expect(resultado.valor_unitario).toBe(25.5);
      expect(resultado.valor_total).toBe(127.5);
      expect(resultado.produto.descricao).toBe("Papel Couché 180g A4");
      expect(resultado.fornecedor.nome).toBe("Distribuidora Papel & Cia");

      expect(repositorioComprasMock.executarTransacaoCompra).toHaveBeenCalledWith({
        produto_id: 10,
        fornecedor_id: 20,
        quantidade: 5,
        valor_unitario: 25.5,
        valor_total: 127.5,
        data_compra: undefined,
        produto_descricao: "Papel Couché 180g A4",
        fornecedor_nome: "Distribuidora Papel & Cia"
      });
    });

    it("deve rejeitar compra quando fornecedor não for encontrado", async () => {
      vi.mocked(repositorioFornecedoresMock.buscarPorId).mockResolvedValueOnce(null);

      await expect(
        servicoCompras.registrarCompra({
          produto_id: 10,
          fornecedor_id: 999,
          quantidade: 5,
          valor_unitario: 10
        })
      ).rejects.toMatchObject({
        codigo: "FORNECEDOR_NAO_ENCONTRADO",
        statusHttp: 404
      });
    });

    it("deve rejeitar compra quando fornecedor estiver inativo", async () => {
      vi.mocked(repositorioFornecedoresMock.buscarPorId).mockResolvedValueOnce({
        ...fornecedorAtivoExemplo,
        ativo: false
      });

      await expect(
        servicoCompras.registrarCompra({
          produto_id: 10,
          fornecedor_id: 20,
          quantidade: 5,
          valor_unitario: 10
        })
      ).rejects.toMatchObject({
        codigo: "FORNECEDOR_INATIVO",
        statusHttp: 400
      });
    });

    it("deve rejeitar compra quando produto não for encontrado", async () => {
      vi.mocked(repositorioFornecedoresMock.buscarPorId).mockResolvedValueOnce(
        fornecedorAtivoExemplo
      );
      vi.mocked(repositorioProdutosMock.buscarPorId).mockResolvedValueOnce(null);

      await expect(
        servicoCompras.registrarCompra({
          produto_id: 999,
          fornecedor_id: 20,
          quantidade: 5,
          valor_unitario: 10
        })
      ).rejects.toMatchObject({
        codigo: "PRODUTO_NAO_ENCONTRADO",
        statusHttp: 404
      });
    });

    it("deve rejeitar compra quando produto estiver inativo", async () => {
      vi.mocked(repositorioFornecedoresMock.buscarPorId).mockResolvedValueOnce(
        fornecedorAtivoExemplo
      );
      vi.mocked(repositorioProdutosMock.buscarPorId).mockResolvedValueOnce({
        ...produtoAtivoExemplo,
        ativo: false
      });

      await expect(
        servicoCompras.registrarCompra({
          produto_id: 10,
          fornecedor_id: 20,
          quantidade: 5,
          valor_unitario: 10
        })
      ).rejects.toMatchObject({
        codigo: "PRODUTO_INATIVO",
        statusHttp: 400
      });
    });

    it("deve rejeitar quantidade menor ou igual a zero ou não inteira", async () => {
      await expect(
        servicoCompras.registrarCompra({
          produto_id: 10,
          fornecedor_id: 20,
          quantidade: 0,
          valor_unitario: 10
        })
      ).rejects.toMatchObject({
        codigo: "QUANTIDADE_INVALIDA",
        statusHttp: 400
      });

      await expect(
        servicoCompras.registrarCompra({
          produto_id: 10,
          fornecedor_id: 20,
          quantidade: -2,
          valor_unitario: 10
        })
      ).rejects.toMatchObject({
        codigo: "QUANTIDADE_INVALIDA",
        statusHttp: 400
      });

      await expect(
        servicoCompras.registrarCompra({
          produto_id: 10,
          fornecedor_id: 20,
          quantidade: 1.5,
          valor_unitario: 10
        })
      ).rejects.toMatchObject({
        codigo: "QUANTIDADE_INVALIDA",
        statusHttp: 400
      });
    });

    it("deve rejeitar valor unitário menor ou igual a zero", async () => {
      await expect(
        servicoCompras.registrarCompra({
          produto_id: 10,
          fornecedor_id: 20,
          quantidade: 5,
          valor_unitario: 0
        })
      ).rejects.toMatchObject({
        codigo: "VALOR_UNITARIO_INVALIDO",
        statusHttp: 400
      });

      await expect(
        servicoCompras.registrarCompra({
          produto_id: 10,
          fornecedor_id: 20,
          quantidade: 5,
          valor_unitario: -10
        })
      ).rejects.toMatchObject({
        codigo: "VALOR_UNITARIO_INVALIDO",
        statusHttp: 400
      });
    });
  });

  describe("Consulta e Listagem de Compras", () => {
    it("deve buscar uma compra por id existente", async () => {
      vi.mocked(repositorioComprasMock.buscarPorId).mockResolvedValueOnce(compraExemplo);

      const resultado = await servicoCompras.buscarCompraPorId(100);
      expect(resultado.id).toBe(100);
      expect(resultado.produto.descricao).toBe("Papel Couché 180g A4");
    });

    it("deve lançar erro ao buscar por id inexistente", async () => {
      vi.mocked(repositorioComprasMock.buscarPorId).mockResolvedValueOnce(null);

      await expect(servicoCompras.buscarCompraPorId(999)).rejects.toMatchObject({
        codigo: "COMPRA_NAO_ENCONTRADA",
        statusHttp: 404
      });
    });

    it("deve listar compras com paginação e filtros", async () => {
      vi.mocked(repositorioComprasMock.listar).mockResolvedValueOnce({
        compras: [compraExemplo],
        total: 1
      });

      const resultado = await servicoCompras.listarCompras({
        pagina: 1,
        limite: 10,
        produto_id: 10,
        fornecedor_id: 20,
        data_inicio: "2026-08-01",
        data_fim: "2026-08-31"
      });

      expect(resultado.dados.length).toBe(1);
      expect(resultado.paginacao.total).toBe(1);
      expect(resultado.paginacao.total_paginas).toBe(1);
    });
  });
});
