import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProvedorAutenticacao } from "../contextos/ContextoAutenticacao.js";
import { TelaVendas } from "../paginas/vendas/TelaVendas.js";
import * as servicoVendas from "../servicos/vendas.js";
import * as servicoClientes from "../servicos/clientes.js";
import * as servicoProdutos from "../servicos/produtos.js";
import * as servicoAutenticacao from "../servicos/autenticacao.js";
import { ErroRequisicaoApi } from "../servicos/api.js";

// Mocks dos serviços
vi.mock("../servicos/autenticacao.js", () => ({
  obterUsuarioAutenticado: vi.fn(),
  realizarLogin: vi.fn(),
  realizarLogout: vi.fn()
}));

vi.mock("../servicos/vendas.js", () => ({
  listarVendas: vi.fn(),
  buscarVendaPorId: vi.fn(),
  registrarVenda: vi.fn()
}));

vi.mock("../servicos/clientes.js", () => ({
  listarClientes: vi.fn(),
  buscarClientePorId: vi.fn(),
  criarCliente: vi.fn(),
  atualizarCliente: vi.fn(),
  inativarCliente: vi.fn()
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

const vendasMock = [
  {
    id: 1,
    data_venda: "2026-09-01T14:00:00.000Z",
    cliente_id: 10,
    cliente: {
      id: 10,
      nome: "Gráfica & Editora Alfa"
    },
    produto_id: 20,
    produto: {
      id: 20,
      descricao: "Banner Lona 440g Fosca"
    },
    quantidade: 3,
    valor_unitario: 80.0,
    valor_total: 240.0,
    criado_em: "2026-09-01T14:00:00.000Z",
    atualizado_em: "2026-09-01T14:00:00.000Z"
  }
];

const clientesMock = [
  {
    id: 10,
    nome: "Gráfica & Editora Alfa",
    telefone: "11999998888",
    observacao: "Cliente parceiro",
    ativo: true,
    criado_em: "2026-08-01T00:00:00.000Z",
    atualizado_em: "2026-08-01T00:00:00.000Z"
  }
];

const produtosMock = [
  {
    id: 20,
    descricao: "Banner Lona 440g Fosca",
    quantidade_estoque: 15,
    ativo: true,
    criado_em: "2026-08-01T00:00:00.000Z",
    atualizado_em: "2026-08-01T00:00:00.000Z"
  }
];

describe("Módulo de Vendas (Front-end)", () => {
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

    vi.mocked(servicoVendas.listarVendas).mockResolvedValue({
      dados: vendasMock,
      paginacao: {
        pagina: 1,
        limite: 10,
        total: 1,
        total_paginas: 1
      }
    });

    vi.mocked(servicoClientes.listarClientes).mockResolvedValue({
      dados: clientesMock,
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

    vi.mocked(servicoProdutos.buscarProdutoPorId).mockResolvedValue({
      id: 20,
      descricao: "Banner Lona 440g Fosca",
      quantidade_estoque: 15,
      ativo: true,
      criado_em: "2026-08-01T00:00:00.000Z",
      atualizado_em: "2026-08-01T00:00:00.000Z"
    });
  });

  it("deve renderizar a tabela com vendas carregadas da API", async () => {
    renderizarComProvedor(<TelaVendas />);

    const linha = await screen.findByTestId("linha-venda-1");
    expect(linha).toBeInTheDocument();
    expect(linha).toHaveTextContent("Gráfica & Editora Alfa");
    expect(linha).toHaveTextContent("Banner Lona 440g Fosca");
    expect(linha).toHaveTextContent("-3 un");
    expect(linha).toHaveTextContent("Concluída");
  });

  it("deve abrir o modal de nova venda e exibir clientes e produtos carregados", async () => {
    renderizarComProvedor(<TelaVendas />);

    const botaoNova = await screen.findByTestId("botao-nova-venda");
    fireEvent.click(botaoNova);

    expect(screen.getByRole("heading", { name: "Nova Venda" })).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "Gráfica & Editora Alfa" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Banner Lona 440g Fosca" })
      ).toBeInTheDocument();
    });
  });

  it("deve consultar e exibir o estoque em tempo real ao selecionar um produto", async () => {
    renderizarComProvedor(<TelaVendas />);

    const botaoNova = await screen.findByTestId("botao-nova-venda");
    fireEvent.click(botaoNova);

    const selectProduto = await screen.findByTestId("select-produto-venda");
    fireEvent.change(selectProduto, { target: { value: "20" } });

    // Deve chamar buscarProdutoPorId para estoque atualizado
    await waitFor(() => {
      expect(servicoProdutos.buscarProdutoPorId).toHaveBeenCalledWith(20);
    });

    const textoEstoque = await screen.findByTestId("texto-estoque-disponivel");
    expect(textoEstoque).toHaveTextContent("15 unidades");
  });

  it("deve calcular a prévia do valor total em tempo real ao digitar quantidade e valor unitário", async () => {
    renderizarComProvedor(<TelaVendas />);

    const botaoNova = await screen.findByTestId("botao-nova-venda");
    fireEvent.click(botaoNova);

    const inputQtd = await screen.findByTestId("input-quantidade-venda");
    const inputValor = screen.getByTestId("input-valor-unitario-venda");
    const elementoPrevia = screen.getByTestId("previa-valor-total");

    fireEvent.change(inputQtd, { target: { value: "4" } });
    fireEvent.change(inputValor, { target: { value: "35.00" } });

    // 4 * 35.00 = 140,00
    expect(elementoPrevia.textContent).toContain("140,00");
  });

  it("deve bloquear no front-end quando a quantidade informada for maior que o estoque disponível", async () => {
    renderizarComProvedor(<TelaVendas />);

    const botaoNova = await screen.findByTestId("botao-nova-venda");
    fireEvent.click(botaoNova);

    const selectProduto = await screen.findByTestId("select-produto-venda");
    fireEvent.change(selectProduto, { target: { value: "20" } });

    await screen.findByTestId("texto-estoque-disponivel");

    const inputQtd = screen.getByTestId("input-quantidade-venda");
    // Digita quantidade maior que o estoque disponível (15)
    fireEvent.change(inputQtd, { target: { value: "20" } });

    expect(await screen.findByTestId("aviso-estoque-insuficiente")).toBeInTheDocument();

    const botaoRegistrar = screen.getByTestId("botao-registrar-venda");
    expect(botaoRegistrar).toBeDisabled();
  });

  it("deve validar campos obrigatórios ao submeter formulário em branco", async () => {
    renderizarComProvedor(<TelaVendas />);

    const botaoNova = await screen.findByTestId("botao-nova-venda");
    fireEvent.click(botaoNova);

    const selectCliente = await screen.findByTestId("select-cliente-venda");
    expect(selectCliente).toBeInTheDocument();

    const botaoRegistrar = screen.getByTestId("botao-registrar-venda");
    fireEvent.click(botaoRegistrar);

    expect(await screen.findByText("A quantidade é obrigatória")).toBeInTheDocument();
    expect(screen.getByText("O valor unitário é obrigatório")).toBeInTheDocument();
  });

  it("deve registrar a venda com sucesso e atualizar a listagem", async () => {
    vi.mocked(servicoVendas.registrarVenda).mockResolvedValueOnce({
      id: 2,
      data_venda: "2026-09-02T10:00:00.000Z",
      cliente_id: 10,
      cliente: { id: 10, nome: "Gráfica & Editora Alfa" },
      produto_id: 20,
      produto: { id: 20, descricao: "Banner Lona 440g Fosca" },
      quantidade: 5,
      valor_unitario: 80.0,
      valor_total: 400.0,
      criado_em: "2026-09-02T10:00:00.000Z",
      atualizado_em: "2026-09-02T10:00:00.000Z"
    });

    renderizarComProvedor(<TelaVendas />);

    const botaoNova = await screen.findByTestId("botao-nova-venda");
    fireEvent.click(botaoNova);

    const selectCliente = await screen.findByTestId("select-cliente-venda");
    const selectProduto = screen.getByTestId("select-produto-venda");
    const inputQtd = screen.getByTestId("input-quantidade-venda");
    const inputValor = screen.getByTestId("input-valor-unitario-venda");
    const botaoRegistrar = screen.getByTestId("botao-registrar-venda");

    fireEvent.change(selectCliente, { target: { value: "10" } });
    fireEvent.change(selectProduto, { target: { value: "20" } });
    await screen.findByTestId("texto-estoque-disponivel");
    fireEvent.change(inputQtd, { target: { value: "5" } });
    fireEvent.change(inputValor, { target: { value: "80.00" } });
    fireEvent.click(botaoRegistrar);

    await waitFor(() => {
      expect(servicoVendas.registrarVenda).toHaveBeenCalledWith({
        cliente_id: 10,
        produto_id: 20,
        quantidade: 5,
        valor_unitario: 80.0,
        data_venda: expect.any(String)
      });
    });

    expect(
      await screen.findByText("Venda registrada com sucesso. Estoque atualizado.")
    ).toBeInTheDocument();
  });

  it("deve tratar amigavelmente o erro ESTOQUE_INSUFICIENTE retornado pelo servidor", async () => {
    vi.mocked(servicoVendas.registrarVenda).mockRejectedValueOnce(
      new ErroRequisicaoApi(
        "Estoque insuficiente para realizar esta venda",
        "ESTOQUE_INSUFICIENTE",
        400
      )
    );

    renderizarComProvedor(<TelaVendas />);

    const botaoNova = await screen.findByTestId("botao-nova-venda");
    fireEvent.click(botaoNova);

    const selectCliente = await screen.findByTestId("select-cliente-venda");
    const selectProduto = screen.getByTestId("select-produto-venda");
    const inputQtd = screen.getByTestId("input-quantidade-venda");
    const inputValor = screen.getByTestId("input-valor-unitario-venda");
    const botaoRegistrar = screen.getByTestId("botao-registrar-venda");

    fireEvent.change(selectCliente, { target: { value: "10" } });
    fireEvent.change(selectProduto, { target: { value: "20" } });
    await screen.findByTestId("texto-estoque-disponivel");
    fireEvent.change(inputQtd, { target: { value: "2" } });
    fireEvent.change(inputValor, { target: { value: "80.00" } });
    fireEvent.click(botaoRegistrar);

    expect(
      await screen.findByText(/O estoque disponível foi alterado antes da conclusão da operação/)
    ).toBeInTheDocument();
  });
});
