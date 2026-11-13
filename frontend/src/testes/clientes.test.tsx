import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProvedorAutenticacao } from "../contextos/ContextoAutenticacao.js";
import { TelaClientes } from "../paginas/clientes/TelaClientes.js";
import * as servicoClientes from "../servicos/clientes.js";
import * as servicoAutenticacao from "../servicos/autenticacao.js";

// Mocks
vi.mock("../servicos/autenticacao.js", () => ({
  obterUsuarioAutenticado: vi.fn(),
  realizarLogin: vi.fn(),
  realizarLogout: vi.fn()
}));

vi.mock("../servicos/clientes.js", () => ({
  listarClientes: vi.fn(),
  buscarClientePorId: vi.fn(),
  criarCliente: vi.fn(),
  atualizarCliente: vi.fn(),
  inativarCliente: vi.fn()
}));

const renderizarComProvedor = (componente: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <ProvedorAutenticacao>{componente}</ProvedorAutenticacao>
    </BrowserRouter>
  );
};

const clientesMock = [
  {
    id: 1,
    nome: "Empresa Grafica Alpha",
    telefone: "(11) 99999-1111",
    observacao: "Entrega em horário comercial",
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 2,
    nome: "Comércio Beta Ltda",
    telefone: "(21) 98888-2222",
    observacao: null,
    ativo: false,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  }
];

describe("Módulo de Clientes (Front-end)", () => {
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

    vi.mocked(servicoClientes.listarClientes).mockResolvedValue({
      dados: clientesMock,
      paginacao: {
        pagina: 1,
        limite: 10,
        total: 2,
        total_paginas: 1
      }
    });
  });

  it("deve renderizar a tabela com os clientes carregados da API", async () => {
    renderizarComProvedor(<TelaClientes />);

    expect(
      await screen.findByText("Empresa Grafica Alpha")
    ).toBeInTheDocument();
    expect(screen.getByText("Comércio Beta Ltda")).toBeInTheDocument();
    expect(screen.getByText("(11) 99999-1111")).toBeInTheDocument();
    expect(
      screen.getByText("Entrega em horário comercial")
    ).toBeInTheDocument();
  });

  it("deve abrir o modal de novo cliente e validar nome obrigatório", async () => {
    renderizarComProvedor(<TelaClientes />);

    const botaoNovo = await screen.findByTestId("botao-novo-cliente");
    fireEvent.click(botaoNovo);

    expect(
      screen.getByRole("heading", { name: "Novo Cliente" })
    ).toBeInTheDocument();

    const botaoSalvar = screen.getByTestId("botao-salvar-cliente");
    fireEvent.click(botaoSalvar);

    expect(
      await screen.findByText("O nome do cliente é obrigatório")
    ).toBeInTheDocument();
  });

  it("deve cadastrar um novo cliente com sucesso", async () => {
    vi.mocked(servicoClientes.criarCliente).mockResolvedValueOnce({
      id: 3,
      nome: "Delta Editora",
      telefone: "(11) 97777-3333",
      observacao: "Cliente VIP",
      ativo: true,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    });

    renderizarComProvedor(<TelaClientes />);

    const botaoNovo = await screen.findByTestId("botao-novo-cliente");
    fireEvent.click(botaoNovo);

    const inputNome = screen.getByLabelText(/nome do cliente/i);
    const inputTelefone = screen.getByLabelText(/telefone/i);
    const inputObservacao = screen.getByLabelText(/observações/i);
    const botaoSalvar = screen.getByTestId("botao-salvar-cliente");

    fireEvent.change(inputNome, { target: { value: "Delta Editora" } });
    fireEvent.change(inputTelefone, { target: { value: "(11) 97777-3333" } });
    fireEvent.change(inputObservacao, { target: { value: "Cliente VIP" } });
    fireEvent.click(botaoSalvar);

    await waitFor(() => {
      expect(servicoClientes.criarCliente).toHaveBeenCalledWith({
        nome: "Delta Editora",
        telefone: "(11) 97777-3333",
        observacao: "Cliente VIP"
      });
    });
  });

  it("deve abrir o modal de edição com os dados preenchidos", async () => {
    renderizarComProvedor(<TelaClientes />);

    const botaoEditar = await screen.findByTestId("botao-editar-1");
    fireEvent.click(botaoEditar);

    expect(screen.getByText("Editar Cliente")).toBeInTheDocument();
    const inputNome = screen.getByLabelText(/nome do cliente/i) as HTMLInputElement;
    const inputTelefone = screen.getByLabelText(/telefone/i) as HTMLInputElement;
    expect(inputNome.value).toBe("Empresa Grafica Alpha");
    expect(inputTelefone.value).toBe("(11) 99999-1111");
  });

  it("deve abrir o modal de confirmação e inativar o cliente", async () => {
    vi.mocked(servicoClientes.inativarCliente).mockResolvedValueOnce({
      id: 1,
      nome: "Empresa Grafica Alpha",
      telefone: "(11) 99999-1111",
      observacao: "Entrega em horário comercial",
      ativo: false,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    });

    renderizarComProvedor(<TelaClientes />);

    const botaoInativar = await screen.findByTestId("botao-inativar-1");
    fireEvent.click(botaoInativar);

    expect(screen.getByText("Inativar Cliente")).toBeInTheDocument();

    const botaoConfirmar = screen.getByTestId("botao-confirmar-modal");
    fireEvent.click(botaoConfirmar);

    await waitFor(() => {
      expect(servicoClientes.inativarCliente).toHaveBeenCalledWith(1);
    });
  });
});
