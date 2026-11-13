import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProvedorAutenticacao } from "../contextos/ContextoAutenticacao.js";
import { TelaFinanceiro } from "../paginas/financeiro/TelaFinanceiro.js";
import { servicoFinanceiro } from "../servicos/financeiro.js";
import * as servicoAutenticacao from "../servicos/autenticacao.js";
import { LancamentoFinanceiro } from "../tipos/financeiro.js";

vi.mock("../servicos/autenticacao.js", () => ({
  obterUsuarioAutenticado: vi.fn(),
  realizarLogin: vi.fn(),
  realizarLogout: vi.fn()
}));

vi.mock("../servicos/financeiro.js", () => ({
  servicoFinanceiro: {
    listar: vi.fn(),
    listarLancamentos: vi.fn(),
    buscarPorId: vi.fn(),
    buscarLancamento: vi.fn(),
    criar: vi.fn(),
    criarLancamento: vi.fn(),
    atualizar: vi.fn(),
    atualizarLancamento: vi.fn(),
    excluir: vi.fn(),
    excluirLancamento: vi.fn(),
    buscarSaldo: vi.fn()
  }
}));

const renderizarComProvedor = (componente: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <ProvedorAutenticacao>{componente}</ProvedorAutenticacao>
    </BrowserRouter>
  );
};

const lancamentosMock: LancamentoFinanceiro[] = [
  {
    id: 1,
    tipo: "ENTRADA",
    descricao: "Venda #101 - Banner Promocional",
    valor: 1500.0,
    data_lancamento: "2026-08-15T12:00:00.000Z",
    categoria: "VENDA",
    tipo_referencia: "VENDA",
    referencia_id: 101,
    observacao: "Venda automática",
    criado_em: "2026-08-15T12:00:00.000Z"
  },
  {
    id: 2,
    tipo: "SAIDA",
    descricao: "Compra #50 - Bobina Térmica",
    valor: 600.0,
    data_lancamento: "2026-08-18T14:00:00.000Z",
    categoria: "COMPRA",
    tipo_referencia: "COMPRA",
    referencia_id: 50,
    observacao: "Compra automática",
    criado_em: "2026-08-18T14:00:00.000Z"
  },
  {
    id: 3,
    tipo: "SAIDA",
    descricao: "Aluguel da Loja Agosto",
    valor: 400.0,
    data_lancamento: "2026-08-20T10:00:00.000Z",
    categoria: "ALUGUEL",
    tipo_referencia: "MANUAL",
    referencia_id: null,
    observacao: "Pagamento via PIX",
    criado_em: "2026-08-20T10:00:00.000Z"
  }
];

const resumoMock = {
  total_entradas: 1500.0,
  total_saidas: 1000.0,
  saldo: 500.0,
  saldo_atual: 500.0
};

describe("Módulo de Controle Financeiro (Front-end)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(servicoAutenticacao.obterUsuarioAutenticado).mockResolvedValue({
      id: 1,
      nome: "Administrador Uniqprint",
      email: "admin@uniqprint.com.br",
      papel: "ADMINISTRADOR",
      ativo: true,
      criado_em: "2026-08-01T00:00:00.000Z",
      atualizado_em: "2026-08-01T00:00:00.000Z",
      ultimo_login_em: null
    });

    vi.mocked(servicoFinanceiro.listar).mockResolvedValue({
      dados: lancamentosMock,
      resumo: resumoMock,
      paginacao: {
        pagina: 1,
        limite: 20,
        total: 3,
        total_paginas: 1
      }
    });
  });

  it("deve renderizar a página, título e cabeçalho", async () => {
    renderizarComProvedor(<TelaFinanceiro />);

    await waitFor(() => {
      expect(screen.getByTestId("titulo-pagina-financeiro")).toBeInTheDocument();
      expect(screen.getByText("Controle Financeiro")).toBeInTheDocument();
      expect(screen.getByTestId("botao-novo-lancamento")).toBeInTheDocument();
    });
  });

  it("deve renderizar os cards de resumo financeiro (Entradas, Saídas e Saldo Atual)", async () => {
    renderizarComProvedor(<TelaFinanceiro />);

    await waitFor(() => {
      expect(screen.getByTestId("card-total-entradas")).toBeInTheDocument();
      expect(screen.getByTestId("card-total-saidas")).toBeInTheDocument();
      expect(screen.getByTestId("card-saldo-atual")).toBeInTheDocument();

      // Conferir formatação de moeda R$
      expect(screen.getByTestId("valor-total-entradas").textContent).toContain("1.500,00");
      expect(screen.getByTestId("valor-total-saidas").textContent).toContain("1.000,00");
      expect(screen.getByTestId("valor-saldo-atual").textContent).toContain("500,00");
    });
  });

  it("deve renderizar o extrato com lançamentos e identificação correta da origem", async () => {
    renderizarComProvedor(<TelaFinanceiro />);

    await waitFor(() => {
      expect(screen.getByTestId("tabela-financeiro")).toBeInTheDocument();
      expect(screen.getByText("Venda #101 - Banner Promocional")).toBeInTheDocument();
      expect(screen.getByText("Compra #50 - Bobina Térmica")).toBeInTheDocument();
      expect(screen.getByText("Aluguel da Loja Agosto")).toBeInTheDocument();

      // Conferir origens
      expect(screen.getByTestId("origem-lancamento-1").textContent).toBe("Venda #101");
      expect(screen.getByTestId("origem-lancamento-2").textContent).toBe("Compra #50");
      expect(screen.getByTestId("origem-lancamento-3").textContent).toBe("Manual");

      // Lançamentos automáticos NÃO devem ter botões de editar/excluir
      expect(screen.queryByTestId("botao-editar-lancamento-1")).not.toBeInTheDocument();
      expect(screen.queryByTestId("botao-excluir-lancamento-1")).not.toBeInTheDocument();

      // Lançamento manual DEVE ter botões de editar e excluir (para ADMIN)
      expect(screen.getByTestId("botao-editar-lancamento-3")).toBeInTheDocument();
      expect(screen.getByTestId("botao-excluir-lancamento-3")).toBeInTheDocument();
    });
  });

  it("deve filtrar lançamentos ao enviar o formulário de filtros", async () => {
    renderizarComProvedor(<TelaFinanceiro />);

    await waitFor(() => {
      expect(screen.getByTestId("filtro-categoria")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("filtro-categoria"), {
      target: { value: "ALUGUEL" }
    });
    fireEvent.change(screen.getByTestId("filtro-tipo"), {
      target: { value: "SAIDA" }
    });

    fireEvent.click(screen.getByTestId("botao-aplicar-filtros"));

    await waitFor(() => {
      expect(servicoFinanceiro.listar).toHaveBeenCalledWith(
        expect.objectContaining({
          categoria: "ALUGUEL",
          tipo: "SAIDA"
        })
      );
    });
  });

  it("deve abrir o modal de novo lançamento manual e salvar", async () => {
    vi.mocked(servicoFinanceiro.criar).mockResolvedValueOnce({
      id: 4,
      tipo: "ENTRADA",
      descricao: "Recebimento Extra",
      valor: 800.0,
      data_lancamento: "2026-08-25T12:00:00.000Z",
      categoria: "RECEBIMENTOS",
      tipo_referencia: "MANUAL",
      referencia_id: null,
      observacao: null,
      criado_em: "2026-08-25T12:00:00.000Z"
    });

    renderizarComProvedor(<TelaFinanceiro />);

    await waitFor(() => {
      expect(screen.getByTestId("botao-novo-lancamento")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("botao-novo-lancamento"));

    await waitFor(() => {
      expect(screen.getByText("Novo Lançamento Manual")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("input-descricao"), {
      target: { value: "Recebimento Extra" }
    });
    fireEvent.change(screen.getByTestId("input-valor"), {
      target: { value: "800.00" }
    });
    fireEvent.change(screen.getByTestId("input-categoria"), {
      target: { value: "RECEBIMENTOS" }
    });

    fireEvent.click(screen.getByTestId("botao-salvar-modal-financeiro"));

    await waitFor(() => {
      expect(servicoFinanceiro.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: "ENTRADA",
          descricao: "Recebimento Extra",
          valor: 800.0,
          categoria: "RECEBIMENTOS"
        })
      );
    });
  });

  it("deve abrir modal de edição para lançamento manual e salvar atualização", async () => {
    vi.mocked(servicoFinanceiro.atualizar).mockResolvedValueOnce({
      id: 3,
      tipo: "SAIDA",
      descricao: "Aluguel da Loja Agosto Corrigido",
      valor: 450.0,
      data_lancamento: "2026-08-20T10:00:00.000Z",
      categoria: "ALUGUEL",
      tipo_referencia: "MANUAL",
      referencia_id: null,
      observacao: "Corrigido",
      criado_em: "2026-08-20T10:00:00.000Z"
    });

    renderizarComProvedor(<TelaFinanceiro />);

    await waitFor(() => {
      expect(screen.getByTestId("botao-editar-lancamento-3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("botao-editar-lancamento-3"));

    await waitFor(() => {
      expect(screen.getByText("Editar Lançamento")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Aluguel da Loja Agosto")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("input-descricao"), {
      target: { value: "Aluguel da Loja Agosto Corrigido" }
    });

    fireEvent.click(screen.getByTestId("botao-salvar-modal-financeiro"));

    await waitFor(() => {
      expect(servicoFinanceiro.atualizar).toHaveBeenCalledWith(
        3,
        expect.objectContaining({
          descricao: "Aluguel da Loja Agosto Corrigido"
        })
      );
    });
  });

  it("deve abrir modal de confirmação ao clicar em excluir e realizar exclusão", async () => {
    vi.mocked(servicoFinanceiro.excluir).mockResolvedValueOnce();

    renderizarComProvedor(<TelaFinanceiro />);

    await waitFor(() => {
      expect(screen.getByTestId("botao-excluir-lancamento-3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("botao-excluir-lancamento-3"));

    await waitFor(() => {
      expect(screen.getByText("Excluir lançamento?")).toBeInTheDocument();
      expect(screen.getByText("Esta ação removerá o lançamento financeiro.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("botao-confirmar-modal"));

    await waitFor(() => {
      expect(servicoFinanceiro.excluir).toHaveBeenCalledWith(3);
    });
  });

  it("não deve exibir botão de excluir para usuário comum (perfil sem autorização)", async () => {
    vi.mocked(servicoAutenticacao.obterUsuarioAutenticado).mockResolvedValueOnce({
      id: 2,
      nome: "Operador de Vendas",
      email: "usuario@uniqprint.com.br",
      papel: "USUARIO",
      ativo: true,
      criado_em: "2026-08-01T00:00:00.000Z",
      atualizado_em: "2026-08-01T00:00:00.000Z",
      ultimo_login_em: null
    });

    renderizarComProvedor(<TelaFinanceiro />);

    await waitFor(() => {
      expect(screen.getByTestId("tabela-financeiro")).toBeInTheDocument();
    });

    // Usuário comum não pode excluir
    expect(screen.queryByTestId("botao-excluir-lancamento-3")).not.toBeInTheDocument();
  });

  it("deve exibir estado vazio quando não houver lançamentos", async () => {
    vi.mocked(servicoFinanceiro.listar).mockResolvedValueOnce({
      dados: [],
      resumo: { total_entradas: 0, total_saidas: 0, saldo: 0, saldo_atual: 0 },
      paginacao: { pagina: 1, limite: 20, total: 0, total_paginas: 1 }
    });

    renderizarComProvedor(<TelaFinanceiro />);

    await waitFor(() => {
      expect(screen.getByTestId("estado-vazio-financeiro")).toBeInTheDocument();
      expect(screen.getByText("Nenhum lançamento financeiro encontrado.")).toBeInTheDocument();
    });
  });
});
