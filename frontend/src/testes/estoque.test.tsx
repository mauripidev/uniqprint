import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProvedorAutenticacao } from "../contextos/ContextoAutenticacao.js";
import { TelaEstoque } from "../paginas/estoque/TelaEstoque.js";
import * as servicoEstoque from "../servicos/estoque.js";
import * as servicoAutenticacao from "../servicos/autenticacao.js";
import { ItemEstoque, MovimentacaoEstoque } from "../tipos/estoque.js";

// Mocks dos serviços
vi.mock("../servicos/autenticacao.js", () => ({
  obterUsuarioAutenticado: vi.fn(),
  realizarLogin: vi.fn(),
  realizarLogout: vi.fn()
}));

vi.mock("../servicos/estoque.js", () => ({
  listarEstoque: vi.fn(),
  listarMovimentacoes: vi.fn(),
  registrarAjuste: vi.fn(),
  servicoEstoque: {
    listarEstoque: vi.fn(),
    listarMovimentacoes: vi.fn(),
    registrarAjuste: vi.fn()
  }
}));

const renderizarComProvedor = (componente: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <ProvedorAutenticacao>{componente}</ProvedorAutenticacao>
    </BrowserRouter>
  );
};

const produtosMock: ItemEstoque[] = [
  {
    id: 1,
    descricao: "Papel Couché 180g A4",
    quantidade_estoque: 20,
    ativo: true,
    status: "normal"
  },
  {
    id: 2,
    descricao: "Tinta Sublimática Magenta 500ml",
    quantidade_estoque: 4,
    ativo: true,
    status: "baixo"
  },
  {
    id: 3,
    descricao: "Lona Frontlight 440g",
    quantidade_estoque: 0,
    ativo: true,
    status: "sem_estoque"
  }
];

const movimentacoesMock: MovimentacaoEstoque[] = [
  {
    id: 101,
    produto_id: 1,
    produto: { id: 1, descricao: "Papel Couché 180g A4" },
    tipo: "ENTRADA",
    quantidade: 10,
    tipo_referencia: "COMPRA",
    referencia_id: 15,
    observacao: "Reposição de estoque",
    criado_em: "2026-09-20T10:00:00.000Z"
  },
  {
    id: 102,
    produto_id: 1,
    produto: { id: 1, descricao: "Papel Couché 180g A4" },
    tipo: "AJUSTE",
    quantidade: 2,
    tipo_referencia: "AJUSTE_SAIDA",
    referencia_id: null,
    observacao: "Descarte de folhas danificadas",
    criado_em: "2026-09-21T15:30:00.000Z"
  }
];

describe("Módulo de Estoque (Front-end)", () => {
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

    vi.mocked(servicoEstoque.listarEstoque).mockResolvedValue({
      dados: produtosMock,
      resumo: {
        total_produtos: 3,
        estoque_baixo: 1,
        sem_estoque: 1
      },
      paginacao: {
        pagina: 1,
        limite: 10,
        total: 3,
        total_paginas: 1
      }
    });

    vi.mocked(servicoEstoque.listarMovimentacoes).mockResolvedValue({
      dados: movimentacoesMock,
      paginacao: {
        pagina: 1,
        limite: 8,
        total: 2,
        total_paginas: 1
      }
    });

    vi.mocked(servicoEstoque.registrarAjuste).mockResolvedValue({
      dados: {
        id: 99,
        estoque_novo: 25
      },
      mensagem: "Ajuste realizado com sucesso"
    });
  });

  it("deve renderizar os cards de indicadores consolidados de estoque", async () => {
    renderizarComProvedor(<TelaEstoque />);

    expect(await screen.findByTestId("titulo-pagina-estoque")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("valor-total-produtos")).toHaveTextContent("3");
      expect(screen.getByTestId("valor-estoque-baixo")).toHaveTextContent("1");
      expect(screen.getByTestId("valor-sem-estoque")).toHaveTextContent("1");
    });
  });

  it("deve renderizar a tabela com os produtos e seus respectivos níveis de status", async () => {
    renderizarComProvedor(<TelaEstoque />);

    const linha1 = await screen.findByTestId("linha-estoque-1");
    expect(linha1).toHaveTextContent("Papel Couché 180g A4");
    expect(linha1).toHaveTextContent("20 un");
    expect(screen.getByTestId("badge-status-1")).toHaveTextContent("Normal");

    const linha2 = await screen.findByTestId("linha-estoque-2");
    expect(linha2).toHaveTextContent("Tinta Sublimática Magenta 500ml");
    expect(linha2).toHaveTextContent("4 un");
    expect(screen.getByTestId("badge-status-2")).toHaveTextContent("Estoque Baixo");

    const linha3 = await screen.findByTestId("linha-estoque-3");
    expect(linha3).toHaveTextContent("Lona Frontlight 440g");
    expect(linha3).toHaveTextContent("0 un");
    expect(screen.getByTestId("badge-status-3")).toHaveTextContent("Sem Estoque");
  });

  it("deve filtrar produtos por termo de busca", async () => {
    renderizarComProvedor(<TelaEstoque />);

    const campoBusca = await screen.findByTestId("campo-busca-estoque");
    fireEvent.change(campoBusca, { target: { value: "Couché" } });

    await waitFor(() => {
      expect(servicoEstoque.listarEstoque).toHaveBeenCalledWith(
        expect.objectContaining({
          busca: "Couché"
        })
      );
    });
  });

  it("deve filtrar produtos por nível de status", async () => {
    renderizarComProvedor(<TelaEstoque />);

    const filtroStatus = await screen.findByTestId("filtro-status-estoque");
    fireEvent.change(filtroStatus, { target: { value: "baixo" } });

    await waitFor(() => {
      expect(servicoEstoque.listarEstoque).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "baixo"
        })
      );
    });
  });

  it("deve abrir o modal de ajuste e exibir a prévia de novo estoque em tempo real", async () => {
    renderizarComProvedor(<TelaEstoque />);

    const botaoAjustar1 = await screen.findByTestId("botao-ajustar-1");
    fireEvent.click(botaoAjustar1);

    expect(await screen.findByTestId("modal-ajuste-estoque")).toBeInTheDocument();
    expect(screen.getByTestId("produto-descricao-ajuste")).toHaveTextContent("Papel Couché 180g A4");
    expect(screen.getByTestId("previa-estoque-atual")).toHaveTextContent("20 un");

    // Padrão: ENTRADA de 1 unidade -> Novo: 21 un
    const inputQtd = screen.getByTestId("input-quantidade-ajuste");
    expect(screen.getByTestId("previa-novo-estoque")).toHaveTextContent("21 un");

    // Alterar quantidade para 5 -> 20 + 5 = 25 un
    fireEvent.change(inputQtd, { target: { value: "5" } });
    expect(screen.getByTestId("previa-novo-estoque")).toHaveTextContent("25 un");

    // Alterar para SAÍDA -> 20 - 5 = 15 un
    const opcaoSaida = screen.getByTestId("opcao-ajuste-saida");
    fireEvent.click(opcaoSaida);
    expect(screen.getByTestId("previa-novo-estoque")).toHaveTextContent("15 un");
  });

  it("deve bloquear o botão e exibir alerta no modal quando a saída for maior que o estoque", async () => {
    renderizarComProvedor(<TelaEstoque />);

    const botaoAjustar1 = await screen.findByTestId("botao-ajustar-1");
    fireEvent.click(botaoAjustar1);

    await screen.findByTestId("modal-ajuste-estoque");

    // Selecionar Saída
    fireEvent.click(screen.getByTestId("opcao-ajuste-saida"));

    // Digitar quantidade 25 (maior que o estoque de 20)
    const inputQtd = screen.getByTestId("input-quantidade-ajuste");
    fireEvent.change(inputQtd, { target: { value: "25" } });

    expect(screen.getByTestId("alerta-estoque-insuficiente")).toBeInTheDocument();
    expect(screen.getByTestId("botao-confirmar-ajuste")).toBeDisabled();
  });

  it("deve registrar o ajuste com sucesso e exibir alerta na tela principal", async () => {
    renderizarComProvedor(<TelaEstoque />);

    const botaoAjustar1 = await screen.findByTestId("botao-ajustar-1");
    fireEvent.click(botaoAjustar1);

    await screen.findByTestId("modal-ajuste-estoque");

    const inputQtd = screen.getByTestId("input-quantidade-ajuste");
    fireEvent.change(inputQtd, { target: { value: "5" } });

    const inputObs = screen.getByTestId("input-observacao-ajuste");
    fireEvent.change(inputObs, { target: { value: "Acerto de inventário anual" } });

    const botaoConfirmar = screen.getByTestId("botao-confirmar-ajuste");
    fireEvent.click(botaoConfirmar);

    await waitFor(() => {
      expect(servicoEstoque.registrarAjuste).toHaveBeenCalledWith({
        produto_id: 1,
        tipo_ajuste: "ENTRADA",
        quantidade: 5,
        observacao: "Acerto de inventário anual"
      });
    });

    // Deve exibir alerta de sucesso na tela principal
    expect(await screen.findByTestId("alerta-sucesso-estoque")).toBeInTheDocument();
  });

  it("deve abrir o modal de histórico ao clicar no botão de histórico do produto", async () => {
    renderizarComProvedor(<TelaEstoque />);

    const botaoHistorico1 = await screen.findByTestId("botao-historico-1");
    fireEvent.click(botaoHistorico1);

    expect(await screen.findByTestId("modal-historico-movimentacoes")).toBeInTheDocument();
    expect(await screen.findByTestId("tabela-historico-movimentacoes")).toBeInTheDocument();
    expect(screen.getByText("Reposição de estoque")).toBeInTheDocument();
    expect(screen.getByText("Descarte de folhas danificadas")).toBeInTheDocument();
  });

  it("deve exibir estado vazio quando a busca não encontrar produtos", async () => {
    vi.mocked(servicoEstoque.listarEstoque).mockResolvedValueOnce({
      dados: [],
      resumo: { total_produtos: 0, estoque_baixo: 0, sem_estoque: 0 },
      paginacao: { pagina: 1, limite: 10, total: 0, total_paginas: 1 }
    });

    renderizarComProvedor(<TelaEstoque />);

    expect(await screen.findByTestId("estado-vazio-estoque")).toBeInTheDocument();
    expect(screen.getByText("Nenhum produto encontrado")).toBeInTheDocument();
  });
});
