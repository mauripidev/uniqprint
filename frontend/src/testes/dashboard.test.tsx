import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProvedorAutenticacao } from "../contextos/ContextoAutenticacao.js";
import { TelaDashboard } from "../paginas/dashboard/TelaDashboard.js";
import * as servicoDashboard from "../servicos/dashboard.js";
import * as servicoAutenticacao from "../servicos/autenticacao.js";
import { DashboardResumo } from "../tipos/dashboard.js";

// Mock do serviço de autenticação
vi.mock("../servicos/autenticacao.js", () => ({
  obterUsuarioAutenticado: vi.fn(),
  realizarLogin: vi.fn(),
  realizarLogout: vi.fn()
}));

// Mock do serviço de dashboard
vi.mock("../servicos/dashboard.js", () => ({
  obterResumoDashboard: vi.fn(),
  servicoDashboard: {
    obterResumoDashboard: vi.fn()
  }
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const renderizarComProvedor = (componente: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <ProvedorAutenticacao>{componente}</ProvedorAutenticacao>
    </BrowserRouter>
  );
};

const dadosDashboardMock: DashboardResumo = {
  vendas: {
    total_vendas: 12,
    valor_total: 4500.5,
    quantidade_itens: 24
  },
  compras: {
    total_compras: 6,
    valor_total: 2100.0,
    quantidade_itens: 15
  },
  financeiro: {
    entradas: 4500.5,
    saidas: 2100.0,
    saldo: 2400.5,
    quantidade_entradas: 12,
    quantidade_saidas: 6
  },
  estoque: {
    total_produtos: 42,
    produtos_estoque_baixo: 2,
    produtos_criticos: [
      {
        id: 101,
        descricao: "Papel Couché 150g",
        quantidade_estoque: 2,
        status: "baixo"
      },
      {
        id: 102,
        descricao: "Tinta Sublimática Cyan",
        quantidade_estoque: 0,
        status: "sem_estoque"
      }
    ]
  },
  ultimas_operacoes: [
    {
      id: 50,
      tipo: "VENDA",
      descricao: "Venda #50 - Cliente Alfa",
      identificador: "#50",
      data: "2026-10-17T14:30:00.000Z",
      valor: 850.0,
      detalhe: "5x Papel Glossy"
    },
    {
      id: 20,
      tipo: "COMPRA",
      descricao: "Compra #20 - Distribuidora Beta",
      identificador: "#20",
      data: "2026-10-17T11:00:00.000Z",
      valor: 400.0,
      detalhe: "10x Toner"
    }
  ],
  periodo: {
    tipo: "mes",
    data_inicio: "2026-10-01T00:00:00.000Z",
    data_fim: "2026-10-31T23:59:59.999Z"
  }
};

describe("Tela de Dashboard Consolidado (Front-end)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(servicoAutenticacao.obterUsuarioAutenticado).mockResolvedValue({
      id: 1,
      nome: "Administrador Teste",
      email: "admin@uniqprint.com.br",
      papel: "ADMINISTRADOR",
      ativo: true,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      ultimo_login_em: new Date().toISOString()
    });
    vi.mocked(servicoDashboard.obterResumoDashboard).mockResolvedValue(dadosDashboardMock);
  });

  it("deve renderizar o cabeçalho e título do dashboard", async () => {
    renderizarComProvedor(<TelaDashboard />);

    expect(screen.getByRole("heading", { level: 1, name: /dashboard/i })).toBeInTheDocument();
    expect(
      screen.getByText(/visão executiva em tempo real de vendas, compras, estoque e finanças/i)
    ).toBeInTheDocument();
  });

  it("deve exibir e carregar dados consolidados nos cards de resumo", async () => {
    renderizarComProvedor(<TelaDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("card-resumo-vendas")).toBeInTheDocument();
    });

    // Vendas: R$ 4.500,50
    expect(screen.getByTestId("valor-vendas")).toHaveTextContent("4.500,50");
    expect(screen.getByText(/12 vendas/i)).toBeInTheDocument();

    // Compras: R$ 2.100,00
    expect(screen.getByTestId("valor-compras")).toHaveTextContent("2.100,00");
    expect(screen.getByText(/6 compras/i)).toBeInTheDocument();

    // Saldo: R$ 2.400,50
    expect(screen.getByTestId("valor-saldo")).toHaveTextContent("2.400,50");

    // Estoque: 42 produtos
    expect(screen.getByTestId("valor-produtos")).toHaveTextContent("42");
    expect(screen.getByText(/2 produtos com estoque baixo/i)).toBeInTheDocument();
  });

  it("deve renderizar a seção de estoque crítico com produtos e badges", async () => {
    renderizarComProvedor(<TelaDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("secao-estoque-critico")).toBeInTheDocument();
    });

    expect(screen.getByText("Papel Couché 150g")).toBeInTheDocument();
    expect(screen.getByText("Tinta Sublimática Cyan")).toBeInTheDocument();
    expect(screen.getByText("Estoque Baixo")).toBeInTheDocument();
    expect(screen.getByText("Sem Estoque")).toBeInTheDocument();
  });

  it("deve exibir estado vazio quando não há produtos críticos", async () => {
    vi.mocked(servicoDashboard.obterResumoDashboard).mockResolvedValueOnce({
      ...dadosDashboardMock,
      estoque: {
        total_produtos: 20,
        produtos_estoque_baixo: 0,
        produtos_criticos: []
      }
    });

    renderizarComProvedor(<TelaDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("estoque-critico-vazio")).toBeInTheDocument();
    });

    expect(screen.getByText("Nenhum produto com estoque baixo.")).toBeInTheDocument();
  });

  it("deve renderizar a seção de últimas operações com dados e valores", async () => {
    renderizarComProvedor(<TelaDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("secao-ultimas-operacoes")).toBeInTheDocument();
    });

    expect(screen.getByText("#50")).toBeInTheDocument();
    expect(screen.getByText("Venda #50 - Cliente Alfa")).toBeInTheDocument();
    expect(screen.getByText("#20")).toBeInTheDocument();
    expect(screen.getByText("Compra #20 - Distribuidora Beta")).toBeInTheDocument();
  });

  it("deve exibir estado vazio quando não há últimas operações", async () => {
    vi.mocked(servicoDashboard.obterResumoDashboard).mockResolvedValueOnce({
      ...dadosDashboardMock,
      ultimas_operacoes: []
    });

    renderizarComProvedor(<TelaDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("ultimas-operacoes-vazio")).toBeInTheDocument();
    });

    expect(screen.getByText("Nenhuma movimentação encontrada.")).toBeInTheDocument();
  });

  it("deve navegar para /vendas?novo=true ao clicar no atalho de Nova Venda", async () => {
    renderizarComProvedor(<TelaDashboard />);

    const botaoNovaVenda = screen.getByTestId("btn-atalho-nova-venda");
    fireEvent.click(botaoNovaVenda);

    expect(mockNavigate).toHaveBeenCalledWith("/vendas?novo=true");
  });

  it("deve navegar para /compras?novo=true ao clicar no atalho de Nova Compra", async () => {
    renderizarComProvedor(<TelaDashboard />);

    const botaoNovaCompra = screen.getByTestId("btn-atalho-nova-compra");
    fireEvent.click(botaoNovaCompra);

    expect(mockNavigate).toHaveBeenCalledWith("/compras?novo=true");
  });

  it("deve alternar o período ao clicar nos botões de filtro (semana, mes, todos)", async () => {
    renderizarComProvedor(<TelaDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("filtro-periodo-semana")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("filtro-periodo-semana"));

    expect(servicoDashboard.obterResumoDashboard).toHaveBeenCalledWith(
      expect.objectContaining({ periodo: "semana" })
    );

    fireEvent.click(screen.getByTestId("filtro-periodo-todos"));

    expect(servicoDashboard.obterResumoDashboard).toHaveBeenCalledWith(
      expect.objectContaining({ periodo: "todos" })
    );
  });

  it("deve exibir mensagem de erro e permitir tentar novamente em caso de falha da API", async () => {
    vi.mocked(servicoDashboard.obterResumoDashboard).mockRejectedValueOnce(
      new Error("Falha de conexão com a API")
    );

    renderizarComProvedor(<TelaDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-erro")).toBeInTheDocument();
    });

    expect(screen.getByText("Falha de conexão com a API")).toBeInTheDocument();

    // Clicar em Tentar novamente
    vi.mocked(servicoDashboard.obterResumoDashboard).mockResolvedValueOnce(dadosDashboardMock);
    fireEvent.click(screen.getByTestId("btn-tentar-novamente"));

    await waitFor(() => {
      expect(screen.getByTestId("card-resumo-vendas")).toBeInTheDocument();
    });
  });
});
