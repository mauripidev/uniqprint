import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProvedorAutenticacao } from "../contextos/ContextoAutenticacao.js";
import { TelaCompras } from "../paginas/compras/TelaCompras.js";
import * as servicoCompras from "../servicos/compras.js";
import * as servicoFornecedores from "../servicos/fornecedores.js";
import * as servicoProdutos from "../servicos/produtos.js";
import * as servicoAutenticacao from "../servicos/autenticacao.js";

// Mocks dos serviços
vi.mock("../servicos/autenticacao.js", () => ({
  obterUsuarioAutenticado: vi.fn(),
  realizarLogin: vi.fn(),
  realizarLogout: vi.fn()
}));

vi.mock("../servicos/compras.js", () => ({
  listarCompras: vi.fn(),
  buscarCompraPorId: vi.fn(),
  registrarCompra: vi.fn()
}));

vi.mock("../servicos/fornecedores.js", () => ({
  listarFornecedores: vi.fn(),
  buscarFornecedorPorId: vi.fn(),
  criarFornecedor: vi.fn(),
  atualizarFornecedor: vi.fn(),
  inativarFornecedor: vi.fn()
}));

vi.mock("../servicos/produtos.js", () => ({
  listarProdutos: vi.fn(),
  buscarProdutoPorId: vi.fn(),
  criarProduto: vi.fn(),
  atualizarProduto: vi.fn(),
  inativarProduto: vi.fn()
}));

const renderizarComProvedor = (componente: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <ProvedorAutenticacao>{componente}</ProvedorAutenticacao>
    </BrowserRouter>
  );
};

const comprasMock = [
  {
    id: 1,
    data_compra: "2026-08-29T10:00:00.000Z",
    produto_id: 10,
    produto: {
      id: 10,
      descricao: "Papel Couché Brilho 150g"
    },
    quantidade: 20,
    valor_unitario: 35.5,
    valor_total: 710.0,
    fornecedor_id: 2,
    fornecedor: {
      id: 2,
      nome: "Distribuidora Papel Forte"
    },
    criado_em: "2026-08-29T10:00:00.000Z",
    atualizado_em: "2026-08-29T10:00:00.000Z"
  }
];

const fornecedoresMock = [
  {
    id: 2,
    nome: "Distribuidora Papel Forte",
    observacao: "Entrega rápida",
    ativo: true,
    criado_em: "2026-08-01T00:00:00.000Z",
    atualizado_em: "2026-08-01T00:00:00.000Z"
  }
];

const produtosMock = [
  {
    id: 10,
    descricao: "Papel Couché Brilho 150g",
    quantidade_estoque: 50,
    ativo: true,
    criado_em: "2026-08-01T00:00:00.000Z",
    atualizado_em: "2026-08-01T00:00:00.000Z"
  }
];

describe("Módulo de Compras (Front-end)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(servicoAutenticacao.obterUsuarioAutenticado).mockResolvedValue({
      id: 1,
      email: "admin@uniqprint.com.br",
      nome: "Administrador Uniqprint",
      papel: "ADMINISTRADOR",
      ativo: true,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      ultimo_login_em: null
    });

    vi.mocked(servicoCompras.listarCompras).mockResolvedValue({
      dados: comprasMock,
      paginacao: {
        pagina: 1,
        limite: 10,
        total: 1,
        total_paginas: 1
      }
    });

    vi.mocked(servicoFornecedores.listarFornecedores).mockResolvedValue({
      dados: fornecedoresMock,
      paginacao: {
        pagina: 1,
        limite: 100,
        total: 1,
        total_paginas: 1
      }
    });

    vi.mocked(servicoProdutos.listarProdutos).mockResolvedValue({
      dados: produtosMock,
      paginacao: {
        pagina: 1,
        limite: 100,
        total: 1,
        total_paginas: 1
      }
    });
  });

  it("deve renderizar a tabela com compras carregadas da API", async () => {
    renderizarComProvedor(<TelaCompras />);

    const linha = await screen.findByTestId("linha-compra-1");
    expect(linha).toBeInTheDocument();
    expect(linha).toHaveTextContent("Papel Couché Brilho 150g");
    expect(linha).toHaveTextContent("+20 un");
    expect(linha).toHaveTextContent("Concluída");
  });

  it("deve abrir o modal de nova compra e exibir fornecedores e produtos carregados", async () => {
    renderizarComProvedor(<TelaCompras />);

    const botaoNova = await screen.findByTestId("botao-nova-compra");
    fireEvent.click(botaoNova);

    expect(screen.getByRole("heading", { name: "Nova Compra" })).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "Distribuidora Papel Forte" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /Papel Couché Brilho 150g/ })
      ).toBeInTheDocument();
    });
  });

  it("deve calcular a prévia do valor total em tempo real ao digitar quantidade e valor unitário", async () => {
    renderizarComProvedor(<TelaCompras />);

    const botaoNova = await screen.findByTestId("botao-nova-compra");
    fireEvent.click(botaoNova);

    const inputQtd = await screen.findByTestId("input-quantidade-compra");
    const inputValor = screen.getByTestId("input-valor-unitario-compra");
    const elementoPrevia = screen.getByTestId("previa-valor-total");

    fireEvent.change(inputQtd, { target: { value: "10" } });
    fireEvent.change(inputValor, { target: { value: "25.50" } });

    // 10 * 25.50 = 255,00
    expect(elementoPrevia.textContent).toContain("255,00");
  });

  it("deve validar campos obrigatórios ao submeter formulário em branco", async () => {
    renderizarComProvedor(<TelaCompras />);

    const botaoNova = await screen.findByTestId("botao-nova-compra");
    fireEvent.click(botaoNova);

    // Aguardar o carregamento inicial dos dados do modal
    const selectFornecedor = await screen.findByTestId("select-fornecedor-compra");
    expect(selectFornecedor).toBeInTheDocument();

    const botaoRegistrar = screen.getByTestId("botao-registrar-compra");
    fireEvent.click(botaoRegistrar);

    expect(await screen.findByText("A quantidade é obrigatória")).toBeInTheDocument();
    expect(screen.getByText("O valor unitário é obrigatório")).toBeInTheDocument();
  });

  it("deve registrar a compra com sucesso e atualizar a listagem", async () => {
    vi.mocked(servicoCompras.registrarCompra).mockResolvedValueOnce({
      id: 2,
      data_compra: "2026-08-30T10:00:00.000Z",
      produto_id: 10,
      produto: { id: 10, descricao: "Papel Couché Brilho 150g" },
      quantidade: 15,
      valor_unitario: 30.0,
      valor_total: 450.0,
      fornecedor_id: 2,
      fornecedor: { id: 2, nome: "Distribuidora Papel Forte" },
      criado_em: "2026-08-30T10:00:00.000Z",
      atualizado_em: "2026-08-30T10:00:00.000Z"
    });

    renderizarComProvedor(<TelaCompras />);

    const botaoNova = await screen.findByTestId("botao-nova-compra");
    fireEvent.click(botaoNova);

    const selectFornecedor = await screen.findByTestId("select-fornecedor-compra");
    const selectProduto = screen.getByTestId("select-produto-compra");
    const inputQtd = screen.getByTestId("input-quantidade-compra");
    const inputValor = screen.getByTestId("input-valor-unitario-compra");
    const botaoRegistrar = screen.getByTestId("botao-registrar-compra");

    fireEvent.change(selectFornecedor, { target: { value: "2" } });
    fireEvent.change(selectProduto, { target: { value: "10" } });
    fireEvent.change(inputQtd, { target: { value: "15" } });
    fireEvent.change(inputValor, { target: { value: "30.00" } });
    fireEvent.click(botaoRegistrar);

    await waitFor(() => {
      expect(servicoCompras.registrarCompra).toHaveBeenCalledWith({
        fornecedor_id: 2,
        produto_id: 10,
        quantidade: 15,
        valor_unitario: 30.0,
        data_compra: expect.any(String)
      });
    });

    expect(
      await screen.findByText("Compra registrada com sucesso. Estoque atualizado.")
    ).toBeInTheDocument();
  });
});
