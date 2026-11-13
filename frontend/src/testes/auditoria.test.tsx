import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProvedorAutenticacao } from "../contextos/ContextoAutenticacao.js";
import { TelaAuditoria } from "../paginas/auditoria/TelaAuditoria.js";
import * as servicoAuditoria from "../servicos/auditoria.js";
import * as servicoAutenticacao from "../servicos/autenticacao.js";

// Mocks
vi.mock("../servicos/autenticacao.js", () => ({
  obterUsuarioAutenticado: vi.fn(),
  realizarLogin: vi.fn(),
  realizarLogout: vi.fn()
}));

vi.mock("../servicos/auditoria.js", () => ({
  listarAuditoria: vi.fn(),
  buscarAuditoriaPorId: vi.fn(),
  servicoAuditoria: {
    listarAuditoria: vi.fn(),
    buscarAuditoriaPorId: vi.fn()
  }
}));

const renderizarComProvedor = (componente: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <ProvedorAutenticacao>{componente}</ProvedorAutenticacao>
    </BrowserRouter>
  );
};

const usuarioAdminMock = {
  id: 1,
  nome: "Admin Teste",
  email: "admin@uniqprint.com",
  papel: "ADMINISTRADOR",
  ativo: true
};

const registrosMock = [
  {
    id: 1,
    usuario_id: 1,
    usuario: { id: 1, nome: "Admin Teste", email: "admin@uniqprint.com" },
    acao: "LOGIN",
    entidade: "USUARIO",
    entidade_id: 1,
    dados: { email: "admin@uniqprint.com", nome: "Admin Teste", papel: "ADMINISTRADOR" },
    criado_em: "2026-10-26T13:00:00.000Z"
  },
  {
    id: 2,
    usuario_id: 1,
    usuario: { id: 1, nome: "Admin Teste", email: "admin@uniqprint.com" },
    acao: "CRIAR_PRODUTO",
    entidade: "PRODUTO",
    entidade_id: 10,
    dados: { descricao: "Banner Lona", quantidade_estoque: 50 },
    criado_em: "2026-10-26T14:00:00.000Z"
  },
  {
    id: 3,
    usuario_id: null,
    usuario: null,
    acao: "CRIAR_COMPRA",
    entidade: "COMPRA",
    entidade_id: 5,
    dados: null,
    criado_em: "2026-10-26T15:00:00.000Z"
  }
];

const respostaListagemMock = {
  dados: registrosMock,
  paginacao: {
    pagina: 1,
    limite: 20,
    total: 3,
    total_paginas: 1
  }
};

describe("TelaAuditoria", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(servicoAutenticacao.obterUsuarioAutenticado).mockResolvedValue({
      dados: { usuario: usuarioAdminMock }
    } as any);

    vi.mocked(servicoAuditoria.listarAuditoria).mockResolvedValue(respostaListagemMock);
  });

  it("deve renderizar a página de auditoria com cabeçalho correto", async () => {
    renderizarComProvedor(<TelaAuditoria />);

    expect(await screen.findByTestId("pagina-auditoria")).toBeInTheDocument();
    expect(screen.getByText("Auditoria do Sistema")).toBeInTheDocument();
    expect(screen.getByText(/Rastreamento de ações/i)).toBeInTheDocument();
  });

  it("deve exibir a tabela de registros ao carregar", async () => {
    renderizarComProvedor(<TelaAuditoria />);

    const tabela = await screen.findByTestId("tabela-auditoria");
    expect(tabela).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("linha-auditoria-1")).toBeInTheDocument();
      expect(screen.getByTestId("linha-auditoria-2")).toBeInTheDocument();
      expect(screen.getByTestId("linha-auditoria-3")).toBeInTheDocument();
    });
  });

  it("deve exibir o badge da ação LOGIN corretamente", async () => {
    renderizarComProvedor(<TelaAuditoria />);

    await waitFor(() => {
      expect(screen.getByTestId("linha-auditoria-1")).toBeInTheDocument();
    });

    const linhaLogin = screen.getByTestId("linha-auditoria-1");
    // The badge text "Login" appears inside the table row
    expect(linhaLogin.querySelector(".badge-info")).toBeInTheDocument();
  });


  it("deve exibir nome do usuário na coluna de usuário", async () => {
    renderizarComProvedor(<TelaAuditoria />);

    await waitFor(() => {
      expect(screen.getAllByText("Admin Teste").length).toBeGreaterThan(0);
    });
  });

  it("deve exibir 'Sistema' para registros sem usuário", async () => {
    renderizarComProvedor(<TelaAuditoria />);

    await waitFor(() => {
      expect(screen.getByTestId("linha-auditoria-3")).toBeInTheDocument();
    });

    expect(screen.getByText("Sistema")).toBeInTheDocument();
  });

  it("deve exibir o painel de filtros", async () => {
    renderizarComProvedor(<TelaAuditoria />);

    expect(await screen.findByTestId("formulario-filtros-auditoria")).toBeInTheDocument();
    expect(screen.getByTestId("input-data-inicio")).toBeInTheDocument();
    expect(screen.getByTestId("input-data-fim")).toBeInTheDocument();
    expect(screen.getByTestId("select-acao")).toBeInTheDocument();
    expect(screen.getByTestId("select-entidade")).toBeInTheDocument();
    expect(screen.getByTestId("botao-aplicar-filtros")).toBeInTheDocument();
    expect(screen.getByTestId("botao-limpar-filtros")).toBeInTheDocument();
  });

  it("deve chamar listarAuditoria com filtros ao submeter o formulário", async () => {
    renderizarComProvedor(<TelaAuditoria />);

    await waitFor(() => {
      expect(screen.getByTestId("formulario-filtros-auditoria")).toBeInTheDocument();
    });

    const selectAcao = screen.getByTestId("select-acao");
    fireEvent.change(selectAcao, { target: { value: "LOGIN" } });

    const botaoFiltrar = screen.getByTestId("botao-aplicar-filtros");
    fireEvent.click(botaoFiltrar);

    await waitFor(() => {
      expect(vi.mocked(servicoAuditoria.listarAuditoria)).toHaveBeenCalledWith(
        expect.objectContaining({ acao: "LOGIN", pagina: 1 })
      );
    });
  });

  it("deve exibir estado vazio quando não há registros", async () => {
    vi.mocked(servicoAuditoria.listarAuditoria).mockResolvedValue({
      dados: [],
      paginacao: { pagina: 1, limite: 20, total: 0, total_paginas: 1 }
    });

    renderizarComProvedor(<TelaAuditoria />);

    expect(await screen.findByTestId("estado-vazio-auditoria")).toBeInTheDocument();
    expect(screen.getByText("Nenhum registro encontrado")).toBeInTheDocument();
  });

  it("deve exibir mensagem de erro quando a requisição falha", async () => {
    vi.mocked(servicoAuditoria.listarAuditoria).mockRejectedValue(
      new Error("Não foi possível conectar ao servidor.")
    );

    renderizarComProvedor(<TelaAuditoria />);

    expect(
      await screen.findByText("Não foi possível conectar ao servidor.")
    ).toBeInTheDocument();
  });

  it("deve abrir o modal de detalhes ao clicar no botão de visualização", async () => {
    vi.mocked(servicoAuditoria.buscarAuditoriaPorId).mockResolvedValue({
      dados: registrosMock[0]
    } as any);

    renderizarComProvedor(<TelaAuditoria />);

    await waitFor(() => {
      expect(screen.getByTestId("botao-detalhe-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("botao-detalhe-1"));

    expect(await screen.findByTestId("modal-detalhes-auditoria")).toBeInTheDocument();
    expect(await screen.findByTestId("detalhe-acao")).toBeInTheDocument();
    expect(await screen.findByTestId("detalhe-entidade")).toBeInTheDocument();
    expect(await screen.findByTestId("detalhe-usuario")).toBeInTheDocument();
  });

  it("deve fechar o modal ao clicar no botão fechar", async () => {
    vi.mocked(servicoAuditoria.buscarAuditoriaPorId).mockResolvedValue({
      dados: registrosMock[0]
    } as any);

    renderizarComProvedor(<TelaAuditoria />);

    await waitFor(() => {
      expect(screen.getByTestId("botao-detalhe-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("botao-detalhe-1"));

    const modal = await screen.findByTestId("modal-detalhes-auditoria");
    expect(modal).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("botao-fechar-modal-auditoria"));

    await waitFor(() => {
      expect(screen.queryByTestId("modal-detalhes-auditoria")).not.toBeInTheDocument();
    });
  });

  it("deve exibir o contador de total de registros", async () => {
    renderizarComProvedor(<TelaAuditoria />);

    expect(await screen.findByTestId("contador-total-registros")).toBeInTheDocument();
    expect(screen.getByTestId("contador-total-registros")).toHaveTextContent("3 registros");
  });

  it("deve exibir o bloco de dados JSON no modal quando há dados", async () => {
    vi.mocked(servicoAuditoria.buscarAuditoriaPorId).mockResolvedValue({
      dados: registrosMock[0]
    } as any);

    renderizarComProvedor(<TelaAuditoria />);

    await waitFor(() => {
      expect(screen.getByTestId("botao-detalhe-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("botao-detalhe-1"));

    expect(await screen.findByTestId("detalhe-dados-json")).toBeInTheDocument();
  });
});
