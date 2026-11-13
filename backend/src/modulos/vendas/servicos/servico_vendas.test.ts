import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import { RepositorioClientes } from "../../clientes/repositorios/repositorio_clientes.js";
import { RepositorioProdutos } from "../../produtos/repositorios/repositorio_produtos.js";
import { VendaComRelacoes, RepositorioVendas } from "../repositorios/repositorio_vendas.js";
import { ServicoVendas } from "./servico_vendas.js";
import { Cliente, Produto, Prisma } from "@prisma/client";

describe("Serviço de Vendas (Regras de Negócio)", () => {
  let repositorioVendasMock: RepositorioVendas;
  let repositorioProdutosMock: RepositorioProdutos;
  let repositorioClientesMock: RepositorioClientes;
  let servicoVendas: ServicoVendas;

  const clienteAtivoExemplo: Cliente = {
    id: 15,
    nome: "Gráfica & Editora Central",
    telefone: "11988887777",
    observacao: "Cliente corporativo",
    ativo: true,
    criado_em: new Date(),
    atualizado_em: new Date()
  };

  const produtoAtivoExemplo: Produto = {
    id: 25,
    descricao: "Tinta Offset Preta 1kg",
    quantidade_estoque: 30,
    ativo: true,
    criado_em: new Date(),
    atualizado_em: new Date()
  };

  const vendaExemplo: VendaComRelacoes = {
    id: 200,
    data_venda: new Date("2026-09-01T14:00:00.000Z"),
    cliente_id: 15,
    cliente: {
      id: 15,
      nome: "Gráfica & Editora Central"
    },
    produto_id: 25,
    produto: {
      id: 25,
      descricao: "Tinta Offset Preta 1kg"
    },
    quantidade: 4,
    valor_unitario: new Prisma.Decimal(85.5),
    valor_total: new Prisma.Decimal(342.0),
    criado_em: new Date(),
    atualizado_em: new Date()
  };

  beforeEach(() => {
    repositorioVendasMock = {
      buscarPorId: vi.fn(),
      listar: vi.fn(),
      executarTransacaoVenda: vi.fn()
    };
    repositorioProdutosMock = {
      criar: vi.fn(),
      buscarPorId: vi.fn(),
      buscarPorDescricao: vi.fn(),
      listar: vi.fn(),
      atualizar: vi.fn(),
      inativar: vi.fn()
    };
    repositorioClientesMock = {
      criar: vi.fn(),
      buscarPorId: vi.fn(),
      buscarPorNome: vi.fn(),
      listar: vi.fn(),
      atualizar: vi.fn(),
      inativar: vi.fn()
    };

    servicoVendas = new ServicoVendas(
      repositorioVendasMock,
      repositorioProdutosMock,
      repositorioClientesMock
    );
  });

  describe("Registro de Venda (registrarVenda)", () => {
    it("deve registrar venda válida com cálculo correto do valor total oficial no back-end", async () => {
      vi.mocked(repositorioClientesMock.buscarPorId).mockResolvedValueOnce(clienteAtivoExemplo);
      vi.mocked(repositorioProdutosMock.buscarPorId).mockResolvedValueOnce(produtoAtivoExemplo);
      vi.mocked(repositorioVendasMock.executarTransacaoVenda).mockResolvedValueOnce(vendaExemplo);

      const resultado = await servicoVendas.registrarVenda({
        cliente_id: 15,
        produto_id: 25,
        quantidade: 4,
        valor_unitario: 85.5
      });

      expect(resultado.id).toBe(200);
      expect(resultado.quantidade).toBe(4);
      expect(resultado.valor_unitario).toBe(85.5);
      expect(resultado.valor_total).toBe(342.0);
      expect(resultado.cliente.nome).toBe("Gráfica & Editora Central");
      expect(resultado.produto.descricao).toBe("Tinta Offset Preta 1kg");

      expect(repositorioVendasMock.executarTransacaoVenda).toHaveBeenCalledWith({
        cliente_id: 15,
        produto_id: 25,
        quantidade: 4,
        valor_unitario: 85.5,
        valor_total: 342.0,
        data_venda: undefined,
        produto_descricao: "Tinta Offset Preta 1kg",
        cliente_nome: "Gráfica & Editora Central"
      });
    });

    it("deve rejeitar venda quando cliente não for encontrado", async () => {
      vi.mocked(repositorioClientesMock.buscarPorId).mockResolvedValueOnce(null);

      await expect(
        servicoVendas.registrarVenda({
          cliente_id: 999,
          produto_id: 25,
          quantidade: 4,
          valor_unitario: 50
        })
      ).rejects.toMatchObject({
        codigo: "CLIENTE_NAO_ENCONTRADO",
        statusHttp: 404
      });
    });

    it("deve rejeitar venda quando cliente estiver inativo", async () => {
      vi.mocked(repositorioClientesMock.buscarPorId).mockResolvedValueOnce({
        ...clienteAtivoExemplo,
        ativo: false
      });

      await expect(
        servicoVendas.registrarVenda({
          cliente_id: 15,
          produto_id: 25,
          quantidade: 4,
          valor_unitario: 50
        })
      ).rejects.toMatchObject({
        codigo: "CLIENTE_INATIVO",
        statusHttp: 400
      });
    });

    it("deve rejeitar venda quando produto não for encontrado", async () => {
      vi.mocked(repositorioClientesMock.buscarPorId).mockResolvedValueOnce(clienteAtivoExemplo);
      vi.mocked(repositorioProdutosMock.buscarPorId).mockResolvedValueOnce(null);

      await expect(
        servicoVendas.registrarVenda({
          cliente_id: 15,
          produto_id: 999,
          quantidade: 4,
          valor_unitario: 50
        })
      ).rejects.toMatchObject({
        codigo: "PRODUTO_NAO_ENCONTRADO",
        statusHttp: 404
      });
    });

    it("deve rejeitar venda quando produto estiver inativo", async () => {
      vi.mocked(repositorioClientesMock.buscarPorId).mockResolvedValueOnce(clienteAtivoExemplo);
      vi.mocked(repositorioProdutosMock.buscarPorId).mockResolvedValueOnce({
        ...produtoAtivoExemplo,
        ativo: false
      });

      await expect(
        servicoVendas.registrarVenda({
          cliente_id: 15,
          produto_id: 25,
          quantidade: 4,
          valor_unitario: 50
        })
      ).rejects.toMatchObject({
        codigo: "PRODUTO_INATIVO",
        statusHttp: 400
      });
    });

    it("deve rejeitar venda quando quantidade for maior que o estoque disponível (ESTOQUE_INSUFICIENTE)", async () => {
      vi.mocked(repositorioClientesMock.buscarPorId).mockResolvedValueOnce(clienteAtivoExemplo);
      vi.mocked(repositorioProdutosMock.buscarPorId).mockResolvedValueOnce({
        ...produtoAtivoExemplo,
        quantidade_estoque: 3
      });

      await expect(
        servicoVendas.registrarVenda({
          cliente_id: 15,
          produto_id: 25,
          quantidade: 5,
          valor_unitario: 50
        })
      ).rejects.toMatchObject({
        codigo: "ESTOQUE_INSUFICIENTE",
        statusHttp: 400
      });
    });

    it("deve rejeitar quantidade inválida (zero, negativa ou decimal)", async () => {
      await expect(
        servicoVendas.registrarVenda({
          cliente_id: 15,
          produto_id: 25,
          quantidade: 0,
          valor_unitario: 50
        })
      ).rejects.toMatchObject({
        codigo: "QUANTIDADE_INVALIDA",
        statusHttp: 400
      });

      await expect(
        servicoVendas.registrarVenda({
          cliente_id: 15,
          produto_id: 25,
          quantidade: -3,
          valor_unitario: 50
        })
      ).rejects.toMatchObject({
        codigo: "QUANTIDADE_INVALIDA",
        statusHttp: 400
      });

      await expect(
        servicoVendas.registrarVenda({
          cliente_id: 15,
          produto_id: 25,
          quantidade: 2.5,
          valor_unitario: 50
        })
      ).rejects.toMatchObject({
        codigo: "QUANTIDADE_INVALIDA",
        statusHttp: 400
      });
    });

    it("deve rejeitar valor unitário inválido (menor ou igual a zero)", async () => {
      await expect(
        servicoVendas.registrarVenda({
          cliente_id: 15,
          produto_id: 25,
          quantidade: 5,
          valor_unitario: 0
        })
      ).rejects.toMatchObject({
        codigo: "VALOR_UNITARIO_INVALIDO",
        statusHttp: 400
      });

      await expect(
        servicoVendas.registrarVenda({
          cliente_id: 15,
          produto_id: 25,
          quantidade: 5,
          valor_unitario: -10
        })
      ).rejects.toMatchObject({
        codigo: "VALOR_UNITARIO_INVALIDO",
        statusHttp: 400
      });
    });
  });

  describe("Consulta e Listagem de Vendas", () => {
    it("deve buscar uma venda por id existente", async () => {
      vi.mocked(repositorioVendasMock.buscarPorId).mockResolvedValueOnce(vendaExemplo);

      const resultado = await servicoVendas.buscarVendaPorId(200);
      expect(resultado.id).toBe(200);
      expect(resultado.produto.descricao).toBe("Tinta Offset Preta 1kg");
      expect(resultado.cliente.nome).toBe("Gráfica & Editora Central");
    });

    it("deve lançar erro ao buscar por id inexistente", async () => {
      vi.mocked(repositorioVendasMock.buscarPorId).mockResolvedValueOnce(null);

      await expect(servicoVendas.buscarVendaPorId(999)).rejects.toMatchObject({
        codigo: "VENDA_NAO_ENCONTRADA",
        statusHttp: 404
      });
    });

    it("deve listar vendas com paginação e filtros", async () => {
      vi.mocked(repositorioVendasMock.listar).mockResolvedValueOnce({
        vendas: [vendaExemplo],
        total: 1
      });

      const resultado = await servicoVendas.listarVendas({
        pagina: 1,
        limite: 10,
        cliente_id: 15,
        produto_id: 25,
        data_inicio: "2026-09-01",
        data_fim: "2026-09-30"
      });

      expect(resultado.dados.length).toBe(1);
      expect(resultado.paginacao.total).toBe(1);
      expect(resultado.paginacao.total_paginas).toBe(1);
    });
  });
});
