import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProvedorAutenticacao } from "../contextos/ContextoAutenticacao.js";
import { TelaRelatorios } from "../paginas/relatorios/TelaRelatorios.js";
import * as servicoRelatorios from "../servicos/relatorios.js";
import * as servicoProdutos from "../servicos/produtos.js";
import * as servicoClientes from "../servicos/clientes.js";
import * as servicoFornecedores from "../servicos/fornecedores.js";
import * as servicoAutenticacao from "../servicos/autenticacao.js";

// Mocks dos serviços
vi.mock("../servicos/autenticacao.js", () => ({
  obterUsuarioAutenticado: vi.fn(),
  realizarLogin: vi.fn(),
  realizarLogout: vi.fn()
}));

vi.mock("../servicos/relatorios.js", () => ({
  obterRelatorioVendas: vi.fn(),
  obterRelatorioCompras: vi.fn(),
  obterRelatorioFinanceiro: vi.fn(),
  servicoRelatorios: {
    obterRelatorioVendas: vi.fn(),
    obterRelatorioCompras: vi.fn(),
    obterRelatorioFinanceiro: vi.fn()
  }
}));

vi.mock("../servicos/produtos.js", () => ({
  listarProdutos: vi.fn()
}));

vi.mock("../servicos/clientes.js", () => ({
  listarClientes: vi.fn()
}));

vi.mock("../servicos/fornecedores.js", () => ({
  listarFornecedores: vi.fn()
}));

const renderizarComProvedor = (componente: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <ProvedorAutenticacao>{componente}</ProvedorAutenticacao>
    </BrowserRouter>
  );
};

const relatorioVendasMock = {
  resumo: {
    total_vendas: 2,
    valor_total_vendido: 480.0,
    ticket_medio: 240.0,
    quantidade_itens: 6
  },
  filtros_aplicados: {
    periodo: "mes"
  },
  paginacao: {
    pagina: 1,
    limite: 15,
    total: 2,
    total_paginas: 1
  },
  dados: [
    {
      id: 1,
      data_venda: "2026-09-05T10:00:00.000Z",
      cliente_id: 10,
      cliente_nome: "Gráfica & Editora Alfa",
      produto_id: 20,
      produto_descricao: "Banner Lona 440g Fosca",
      quantidade: 3,
      valor_unitario: 80.0,
      valor_total: 240.0
    },
    {
      id: 2,
      data_venda: "2026-09-08T15:30:00.000Z",
      cliente_id: 11,
      cliente_nome: "Comunicação Visual Beta",
      produto_id: 20,
      produto_descricao: "Banner Lona 440g Fosca",
      quantidade: 3,
      valor_unitario: 80.0,
      valor_total: 240.0
    }
  ]
};

const relatorioComprasMock = {
  resumo: {
    total_compras: 1,
    valor_total_comprado: 350.0,
    media_por_compra: 350.0,
    quantidade_itens: 10
  },
  filtros_aplicados: {
    periodo: "mes"
  },
  paginacao: {
    pagina: 1,
    limite: 15,
    total: 1,
    total_paginas: 1
  },
  dados: [
    {
      id: 101,
      data_compra: "2026-09-02T11:00:00.000Z",
      fornecedor_id: 30,
      fornecedor_nome: "Distribuidora de Vinil Silva",
      produto_id: 20,
      produto_descricao: "Banner Lona 440g Fosca",
      quantidade: 10,
      valor_unitario: 35.0,
      valor_total: 350.0
    }
  ]
};

const relatorioFinanceiroMock = {
  resumo: {
    total_entradas: 480.0,
    total_saidas: 350.0,
    saldo: 130.0,
    quantidade_entradas: 2,
    quantidade_saidas: 1,
    media_entradas: 240.0,
    media_saidas: 350.0
  },
  filtros_aplicados: {
    periodo: "mes"
  },
  paginacao: {
    pagina: 1,
    limite: 15,
    total: 3,
    total_paginas: 1
  },
  dados: [
    {
      id: 501,
      tipo: "ENTRADA" as const,
      descricao: "Recebimento Venda #1",
      valor: 240.0,
      data_lancamento: "2026-09-05T10:00:00.000Z",
      categoria: "Venda de Produtos",
      tipo_referencia: "VENDA",
      referencia_id: 1,
      observacao: null
    },
    {
      id: 502,
      tipo: "SAIDA" as const,
      descricao: "Pagamento Compra #101",
      valor: 350.0,
      data_lancamento: "2026-09-02T11:00:00.000Z",
      categoria: "Aquisição de Insumos",
      tipo_referencia: "COMPRA",
      referencia_id: 101,
      observacao: null
    }
  ]
};

const produtosMock = [
  { id: 20, descricao: "Banner Lona 440g Fosca", quantidade_estoque: 15, ativo: true }
];

const clientesMock = [
  { id: 10, nome: "Gráfica & Editora Alfa", ativo: true }
];

const fornecedoresMock = [
  { id: 30, nome: "Distribuidora de Vinil Silva", ativo: true }
];

describe("Módulo de Relatórios Gerenciais (Front-end)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(servicoAutenticacao.obterUsuarioAutenticado).mockResolvedValue({
      id: 1,
      nome: "Administrador Uniqprint",
      email: "admin@uniqprint.com.br",
      papel: "ADMINISTRADOR",
      ativo: true,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      ultimo_login_em: new Date().toISOString()
    });

    vi.mocked(servicoProdutos.listarProdutos).mockResolvedValue({
      dados: produtosMock as any,
      paginacao: {
        total: 1,
        pagina: 1,
        limite: 100,
        total_paginas: 1
      }
    });

    vi.mocked(servicoClientes.listarClientes).mockResolvedValue({
      dados: clientesMock as any,
      paginacao: {
        total: 1,
        pagina: 1,
        limite: 100,
        total_paginas: 1
      }
    });

    vi.mocked(servicoFornecedores.listarFornecedores).mockResolvedValue({
      dados: fornecedoresMock as any,
      paginacao: {
        total: 1,
        pagina: 1,
        limite: 100,
        total_paginas: 1
      }
    });

    vi.mocked(servicoRelatorios.servicoRelatorios.obterRelatorioVendas).mockResolvedValue(
      relatorioVendasMock
    );
    vi.mocked(servicoRelatorios.servicoRelatorios.obterRelatorioCompras).mockResolvedValue(
      relatorioComprasMock
    );
    vi.mocked(servicoRelatorios.servicoRelatorios.obterRelatorioFinanceiro).mockResolvedValue(
      relatorioFinanceiroMock
    );
  });

  it("deve renderizar o título da página e as abas de navegação", async () => {
    renderizarComProvedor(<TelaRelatorios />);

    expect(screen.getByText("Relatórios Gerenciais")).toBeInTheDocument();
    expect(screen.getByTestId("aba-vendas")).toBeInTheDocument();
    expect(screen.getByTestId("aba-compras")).toBeInTheDocument();
    expect(screen.getByTestId("aba-financeiro")).toBeInTheDocument();
  });

  it("deve carregar e renderizar os cards e tabela do relatório de vendas por padrão", async () => {
    renderizarComProvedor(<TelaRelatorios />);

    await waitFor(() => {
      expect(screen.getByTestId("card-total-vendas")).toBeInTheDocument();
      expect(screen.getByTestId("card-ticket-medio")).toBeInTheDocument();
      expect(screen.getByTestId("card-itens-vendidos")).toBeInTheDocument();
    });

    expect(screen.getByTestId("linha-venda-1")).toHaveTextContent("Gráfica & Editora Alfa");
    expect(screen.getByTestId("linha-venda-2")).toHaveTextContent("Comunicação Visual Beta");
  });

  it("deve permitir aplicar filtro por período personalizado com datas válidas", async () => {
    renderizarComProvedor(<TelaRelatorios />);

    await waitFor(() => {
      expect(screen.getByTestId("select-periodo")).toBeInTheDocument();
    });

    // Selecionar período personalizado
    fireEvent.change(screen.getByTestId("select-periodo"), {
      target: { value: "personalizado" }
    });

    // Campos de data inicial e final devem aparecer
    expect(screen.getByTestId("input-data-inicio")).toBeInTheDocument();
    expect(screen.getByTestId("input-data-fim")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("input-data-inicio"), {
      target: { value: "2026-09-01" }
    });
    fireEvent.change(screen.getByTestId("input-data-fim"), {
      target: { value: "2026-09-10" }
    });

    fireEvent.click(screen.getByTestId("botao-aplicar-filtros"));

    await waitFor(() => {
      expect(servicoRelatorios.servicoRelatorios.obterRelatorioVendas).toHaveBeenLastCalledWith(
        expect.objectContaining({
          periodo: "personalizado",
          data_inicio: "2026-09-01",
          data_fim: "2026-09-10"
        })
      );
    });
  });

  it("deve alternar para a aba de compras e exibir os cards e tabela de compras", async () => {
    renderizarComProvedor(<TelaRelatorios />);

    const abaCompras = screen.getByTestId("aba-compras");
    fireEvent.click(abaCompras);

    await waitFor(() => {
      expect(screen.getByTestId("card-total-compras")).toBeInTheDocument();
      expect(screen.getByTestId("card-media-compras")).toBeInTheDocument();
      expect(screen.getByTestId("card-itens-comprados")).toBeInTheDocument();
    });

    expect(screen.getByTestId("linha-compra-101")).toHaveTextContent("Distribuidora de Vinil Silva");
    expect(screen.getByText("#101")).toBeInTheDocument();
  });

  it("deve alternar para a aba financeiro e exibir os cards de entradas, saídas e saldo líquido", async () => {
    renderizarComProvedor(<TelaRelatorios />);

    const abaFinanceiro = screen.getByTestId("aba-financeiro");
    fireEvent.click(abaFinanceiro);

    await waitFor(() => {
      expect(screen.getByTestId("card-total-entradas")).toBeInTheDocument();
      expect(screen.getByTestId("card-total-saidas")).toBeInTheDocument();
      expect(screen.getByTestId("card-saldo-liquido")).toBeInTheDocument();
    });

    expect(screen.getByText("Recebimento Venda #1")).toBeInTheDocument();
    expect(screen.getByText("Pagamento Compra #101")).toBeInTheDocument();
  });

  it("deve renderizar estado vazio quando a consulta não retornar registros", async () => {
    vi.mocked(servicoRelatorios.servicoRelatorios.obterRelatorioVendas).mockResolvedValueOnce({
      resumo: {
        total_vendas: 0,
        valor_total_vendido: 0,
        ticket_medio: 0,
        quantidade_itens: 0
      },
      filtros_aplicados: {},
      paginacao: {
        pagina: 1,
        limite: 15,
        total: 0,
        total_paginas: 1
      },
      dados: []
    });

    renderizarComProvedor(<TelaRelatorios />);

    await waitFor(() => {
      expect(screen.getByTestId("estado-vazio-relatorio")).toBeInTheDocument();
    });
    expect(screen.getByText("Nenhum registro encontrado")).toBeInTheDocument();
  });

  it("deve chamar window.print ao clicar no botão de impressão", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    renderizarComProvedor(<TelaRelatorios />);

    const botaoImprimir = screen.getByTestId("botao-imprimir-relatorio");
    fireEvent.click(botaoImprimir);

    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });
});
