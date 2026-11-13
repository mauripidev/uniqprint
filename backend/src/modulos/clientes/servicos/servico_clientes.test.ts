import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import { RepositorioClientes } from "../repositorios/repositorio_clientes.js";
import { ServicoClientes } from "./servico_clientes.js";
import { Cliente } from "@prisma/client";

describe("Serviço de Clientes (Regras de Negócio)", () => {
  let repositorioMock: RepositorioClientes;
  let servicoClientes: ServicoClientes;

  const clienteExemplo: Cliente = {
    id: 1,
    nome: "Cliente Silva",
    telefone: "(11) 99999-8888",
    observacao: "Cliente antigo",
    ativo: true,
    criado_em: new Date(),
    atualizado_em: new Date()
  };

  beforeEach(() => {
    repositorioMock = {
      criar: vi.fn(),
      buscarPorId: vi.fn(),
      buscarPorNome: vi.fn(),
      listar: vi.fn(),
      atualizar: vi.fn(),
      inativar: vi.fn()
    };
    servicoClientes = new ServicoClientes(repositorioMock);
  });

  describe("Criação de Cliente", () => {
    it("deve criar um cliente válido com sucesso", async () => {
      vi.mocked(repositorioMock.criar).mockResolvedValueOnce(clienteExemplo);

      const resultado = await servicoClientes.criarCliente({
        nome: "Cliente Silva",
        telefone: "(11) 99999-8888",
        observacao: "Cliente antigo"
      });

      expect(resultado.id).toBe(1);
      expect(resultado.nome).toBe("Cliente Silva");
      expect(resultado.telefone).toBe("(11) 99999-8888");
      expect(resultado.ativo).toBe(true);
      expect(repositorioMock.criar).toHaveBeenCalledWith({
        nome: "Cliente Silva",
        telefone: "(11) 99999-8888",
        observacao: "Cliente antigo"
      });
    });

    it("deve rejeitar criação sem nome ou com nome vazio", async () => {
      await expect(
        servicoClientes.criarCliente({ nome: "   " })
      ).rejects.toThrow(ErroAplicacao);

      await expect(
        servicoClientes.criarCliente({ nome: "   " })
      ).rejects.toMatchObject({
        codigo: "NOME_OBRIGATORIO",
        statusHttp: 400
      });
    });

    it("deve rejeitar criação com telefone em formato inválido", async () => {
      await expect(
        servicoClientes.criarCliente({
          nome: "Empresa XPTO",
          telefone: "123"
        })
      ).rejects.toMatchObject({
        codigo: "TELEFONE_INVALIDO",
        statusHttp: 400
      });
    });

    it("deve permitir criação com telefone e observação opcionais/nulos", async () => {
      const clienteSemOpcionais: Cliente = {
        ...clienteExemplo,
        telefone: null,
        observacao: null
      };
      vi.mocked(repositorioMock.criar).mockResolvedValueOnce(clienteSemOpcionais);

      const resultado = await servicoClientes.criarCliente({
        nome: "Cliente Sem Telefone"
      });

      expect(resultado.telefone).toBeNull();
      expect(resultado.observacao).toBeNull();
      expect(repositorioMock.criar).toHaveBeenCalledWith({
        nome: "Cliente Sem Telefone",
        telefone: null,
        observacao: null
      });
    });
  });

  describe("Consulta de Clientes", () => {
    it("deve buscar cliente por ID existente", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(clienteExemplo);

      const resultado = await servicoClientes.buscarClientePorId(1);
      expect(resultado.id).toBe(1);
      expect(resultado.nome).toBe("Cliente Silva");
    });

    it("deve lançar erro 404 ao buscar por ID inexistente", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(null);

      await expect(servicoClientes.buscarClientePorId(999)).rejects.toMatchObject({
        codigo: "CLIENTE_NAO_ENCONTRADO",
        statusHttp: 404
      });
    });

    it("deve listar clientes com dados e paginação calculada", async () => {
      vi.mocked(repositorioMock.listar).mockResolvedValueOnce({
        clientes: [clienteExemplo],
        total: 1
      });

      const resultado = await servicoClientes.listarClientes({
        pagina: 1,
        limite: 10,
        busca: "Silva"
      });

      expect(resultado.dados).toHaveLength(1);
      expect(resultado.paginacao.total).toBe(1);
      expect(resultado.paginacao.total_paginas).toBe(1);
    });
  });

  describe("Atualização de Clientes", () => {
    it("deve atualizar os dados do cliente com sucesso", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(clienteExemplo);
      const clienteAtualizado: Cliente = {
        ...clienteExemplo,
        nome: "Cliente Silva Atualizado",
        telefone: "(11) 98888-7777"
      };
      vi.mocked(repositorioMock.atualizar).mockResolvedValueOnce(clienteAtualizado);

      const resultado = await servicoClientes.atualizarCliente(1, {
        nome: "Cliente Silva Atualizado",
        telefone: "(11) 98888-7777"
      });

      expect(resultado.nome).toBe("Cliente Silva Atualizado");
      expect(resultado.telefone).toBe("(11) 98888-7777");
    });

    it("deve lançar erro 404 ao tentar atualizar cliente inexistente", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(null);

      await expect(
        servicoClientes.atualizarCliente(999, { nome: "Novo Nome" })
      ).rejects.toMatchObject({
        codigo: "CLIENTE_NAO_ENCONTRADO",
        statusHttp: 404
      });
    });

    it("deve lançar erro ao tentar atualizar com nome vazio ou telefone inválido", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValue(clienteExemplo);

      await expect(
        servicoClientes.atualizarCliente(1, { nome: "   " })
      ).rejects.toMatchObject({
        codigo: "NOME_OBRIGATORIO",
        statusHttp: 400
      });

      await expect(
        servicoClientes.atualizarCliente(1, { telefone: "abc" })
      ).rejects.toMatchObject({
        codigo: "TELEFONE_INVALIDO",
        statusHttp: 400
      });
    });
  });

  describe("Inativação de Clientes", () => {
    it("deve inativar logicamente o cliente existente", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(clienteExemplo);
      const clienteInativado: Cliente = {
        ...clienteExemplo,
        ativo: false
      };
      vi.mocked(repositorioMock.inativar).mockResolvedValueOnce(clienteInativado);

      const resultado = await servicoClientes.inativarCliente(1);

      expect(resultado.ativo).toBe(false);
      expect(repositorioMock.inativar).toHaveBeenCalledWith(1);
    });

    it("deve lançar erro 404 ao inativar cliente inexistente", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(null);

      await expect(servicoClientes.inativarCliente(999)).rejects.toMatchObject({
        codigo: "CLIENTE_NAO_ENCONTRADO",
        statusHttp: 404
      });
    });
  });
});
