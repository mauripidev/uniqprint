import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProvedorAutenticacao } from "../contextos/ContextoAutenticacao.js";
import { TelaFornecedores } from "../paginas/fornecedores/TelaFornecedores.js";
import * as servicoFornecedores from "../servicos/fornecedores.js";
import * as servicoAutenticacao from "../servicos/autenticacao.js";

// Mocks
vi.mock("../servicos/autenticacao.js", () => ({
  obterUsuarioAutenticado: vi.fn(),
  realizarLogin: vi.fn(),
  realizarLogout: vi.fn()
}));

vi.mock("../servicos/fornecedores.js", () => ({
  listarFornecedores: vi.fn(),
  buscarFornecedorPorId: vi.fn(),
  criarFornecedor: vi.fn(),
  atualizarFornecedor: vi.fn(),
  inativarFornecedor: vi.fn()
}));

const renderizarComProvedor = (componente: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <ProvedorAutenticacao>{componente}</ProvedorAutenticacao>
    </BrowserRouter>
  );
};

const fornecedoresMock = [
  {
    id: 1,
    nome: "Distribuidora Nacional de Papéis",
    observacao: "Entrega em 24h - Contato: João",
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 2,
    nome: "Tintas & Cia Brasil",
    observacao: null,
    ativo: false,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  }
];

describe("Módulo de Fornecedores (Front-end)", () => {
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

    vi.mocked(servicoFornecedores.listarFornecedores).mockResolvedValue({
      dados: fornecedoresMock,
      paginacao: {
        pagina: 1,
        limite: 10,
        total: 2,
        total_paginas: 1
      }
    });
  });

  it("deve renderizar a tabela com os fornecedores carregados da API", async () => {
    renderizarComProvedor(<TelaFornecedores />);

    expect(
      await screen.findByText("Distribuidora Nacional de Papéis")
    ).toBeInTheDocument();
    expect(screen.getByText("Tintas & Cia Brasil")).toBeInTheDocument();
    expect(
      screen.getByText("Entrega em 24h - Contato: João")
    ).toBeInTheDocument();
  });

  it("deve abrir o modal de novo fornecedor e validar nome obrigatório", async () => {
    renderizarComProvedor(<TelaFornecedores />);

    const botaoNovo = await screen.findByTestId("botao-novo-fornecedor");
    fireEvent.click(botaoNovo);

    expect(
      screen.getByRole("heading", { name: "Novo Fornecedor" })
    ).toBeInTheDocument();

    const botaoSalvar = screen.getByTestId("botao-salvar-fornecedor");
    fireEvent.click(botaoSalvar);

    expect(
      await screen.findByText("O nome do fornecedor é obrigatório")
    ).toBeInTheDocument();
  });

  it("deve cadastrar um novo fornecedor com sucesso", async () => {
    vi.mocked(servicoFornecedores.criarFornecedor).mockResolvedValueOnce({
      id: 3,
      nome: "Adesivos Paulistas",
      observacao: "Prazo de 7 dias",
      ativo: true,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    });

    renderizarComProvedor(<TelaFornecedores />);

    const botaoNovo = await screen.findByTestId("botao-novo-fornecedor");
    fireEvent.click(botaoNovo);

    const inputNome = screen.getByLabelText(/nome do fornecedor/i);
    const inputObservacao = screen.getByLabelText(/observações/i);
    const botaoSalvar = screen.getByTestId("botao-salvar-fornecedor");

    fireEvent.change(inputNome, { target: { value: "Adesivos Paulistas" } });
    fireEvent.change(inputObservacao, { target: { value: "Prazo de 7 dias" } });
    fireEvent.click(botaoSalvar);

    await waitFor(() => {
      expect(servicoFornecedores.criarFornecedor).toHaveBeenCalledWith({
        nome: "Adesivos Paulistas",
        observacao: "Prazo de 7 dias"
      });
    });
  });

  it("deve abrir o modal de edição com os dados preenchidos", async () => {
    renderizarComProvedor(<TelaFornecedores />);

    const botaoEditar = await screen.findByTestId("botao-editar-1");
    fireEvent.click(botaoEditar);

    expect(screen.getByText("Editar Fornecedor")).toBeInTheDocument();
    const inputNome = screen.getByLabelText(/nome do fornecedor/i) as HTMLInputElement;
    expect(inputNome.value).toBe("Distribuidora Nacional de Papéis");
  });

  it("deve abrir o modal de confirmação e inativar o fornecedor", async () => {
    vi.mocked(servicoFornecedores.inativarFornecedor).mockResolvedValueOnce({
      id: 1,
      nome: "Distribuidora Nacional de Papéis",
      observacao: "Entrega em 24h - Contato: João",
      ativo: false,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    });

    renderizarComProvedor(<TelaFornecedores />);

    const botaoInativar = await screen.findByTestId("botao-inativar-1");
    fireEvent.click(botaoInativar);

    expect(screen.getByText("Inativar Fornecedor")).toBeInTheDocument();

    const botaoConfirmar = screen.getByTestId("botao-confirmar-modal");
    fireEvent.click(botaoConfirmar);

    await waitFor(() => {
      expect(servicoFornecedores.inativarFornecedor).toHaveBeenCalledWith(1);
    });
  });
});
