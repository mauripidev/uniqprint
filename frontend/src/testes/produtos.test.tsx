import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProvedorAutenticacao } from "../contextos/ContextoAutenticacao.js";
import { TelaProdutos } from "../paginas/produtos/TelaProdutos.js";
import * as servicoProdutos from "../servicos/produtos.js";
import * as servicoAutenticacao from "../servicos/autenticacao.js";

// Mocks
vi.mock("../servicos/autenticacao.js", () => ({
  obterUsuarioAutenticado: vi.fn(),
  realizarLogin: vi.fn(),
  realizarLogout: vi.fn()
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

const produtosMock = [
  {
    id: 1,
    descricao: "Papel Sulfite A4 75g",
    quantidade_estoque: 100,
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 2,
    descricao: "Tinta Black Sublimática",
    quantidade_estoque: 0,
    ativo: false,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  }
];

describe("Módulo de Produtos (Front-end)", () => {
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

    vi.mocked(servicoProdutos.listarProdutos).mockResolvedValue({
      dados: produtosMock,
      paginacao: {
        pagina: 1,
        limite: 10,
        total: 2,
        total_paginas: 1
      }
    });
  });

  it("deve renderizar a tabela com os produtos carregados da API", async () => {
    renderizarComProvedor(<TelaProdutos />);

    expect(await screen.findByText("Papel Sulfite A4 75g")).toBeInTheDocument();
    expect(screen.getByText("Tinta Black Sublimática")).toBeInTheDocument();
    expect(screen.getByText("100 un")).toBeInTheDocument();
    expect(screen.getByText("0 un")).toBeInTheDocument();
  });

  it("deve abrir o modal de novo produto e validar descrição obrigatória", async () => {
    renderizarComProvedor(<TelaProdutos />);

    const botaoNovo = await screen.findByTestId("botao-novo-produto");
    fireEvent.click(botaoNovo);

    expect(
      screen.getByRole("heading", { name: "Novo Produto" })
    ).toBeInTheDocument();

    const botaoSalvar = screen.getByTestId("botao-salvar-produto");
    fireEvent.click(botaoSalvar);

    expect(
      await screen.findByText("A descrição do produto é obrigatória")
    ).toBeInTheDocument();
  });

  it("deve cadastrar um novo produto com sucesso", async () => {
    vi.mocked(servicoProdutos.criarProduto).mockResolvedValueOnce({
      id: 3,
      descricao: "Adesivo Brilho",
      quantidade_estoque: 20,
      ativo: true,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    });

    renderizarComProvedor(<TelaProdutos />);

    const botaoNovo = await screen.findByTestId("botao-novo-produto");
    fireEvent.click(botaoNovo);

    const inputDescricao = screen.getByLabelText(/descrição do produto/i);
    const inputEstoque = screen.getByLabelText(/estoque inicial/i);
    const botaoSalvar = screen.getByTestId("botao-salvar-produto");

    fireEvent.change(inputDescricao, { target: { value: "Adesivo Brilho" } });
    fireEvent.change(inputEstoque, { target: { value: "20" } });
    fireEvent.click(botaoSalvar);

    await waitFor(() => {
      expect(servicoProdutos.criarProduto).toHaveBeenCalledWith({
        descricao: "Adesivo Brilho",
        quantidade_estoque: 20
      });
    });
  });

  it("deve abrir o modal de edição com os dados preenchidos", async () => {
    renderizarComProvedor(<TelaProdutos />);

    const botaoEditar = await screen.findByTestId("botao-editar-1");
    fireEvent.click(botaoEditar);

    expect(screen.getByText("Editar Produto")).toBeInTheDocument();
    const inputDescricao = screen.getByLabelText(/descrição do produto/i) as HTMLInputElement;
    expect(inputDescricao.value).toBe("Papel Sulfite A4 75g");
  });

  it("deve abrir o modal de confirmação e inativar o produto", async () => {
    vi.mocked(servicoProdutos.inativarProduto).mockResolvedValueOnce({
      id: 1,
      descricao: "Papel Sulfite A4 75g",
      quantidade_estoque: 100,
      ativo: false,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    });

    renderizarComProvedor(<TelaProdutos />);

    const botaoInativar = await screen.findByTestId("botao-inativar-1");
    fireEvent.click(botaoInativar);

    expect(screen.getByText("Inativar Produto")).toBeInTheDocument();

    const botaoConfirmar = screen.getByTestId("botao-confirmar-modal");
    fireEvent.click(botaoConfirmar);

    await waitFor(() => {
      expect(servicoProdutos.inativarProduto).toHaveBeenCalledWith(1);
    });
  });
});
