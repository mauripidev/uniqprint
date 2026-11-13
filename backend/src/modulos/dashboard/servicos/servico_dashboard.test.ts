import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import { RepositorioDashboard } from "../repositorios/repositorio_dashboard.js";
import { ServicoDashboard } from "./servico_dashboard.js";

describe("Serviço de Dashboard Consolidado (Regras de Negócio e Consolidação)", () => {
  let repositorioMock: RepositorioDashboard;
  let servico: ServicoDashboard;
  const dataReferencia = new Date("2026-10-15T12:00:00.000Z");

  beforeEach(() => {
    repositorioMock = {
      obterResumoVendas: vi.fn().mockResolvedValue({
        total_vendas: 5,
        valor_total: 1000.5,
        quantidade_itens: 10
      }),
      obterResumoCompras: vi.fn().mockResolvedValue({
        total_compras: 3,
        valor_total: 600.0,
        quantidade_itens: 6
      }),
      obterResumoFinanceiro: vi.fn().mockResolvedValue({
        entradas: 1000.5,
        saidas: 600.0,
        quantidade_entradas: 5,
        quantidade_saidas: 3
      }),
      obterResumoEstoque: vi.fn().mockResolvedValue({
        total_produtos: 25,
        produtos_estoque_baixo: 2
      }),
      obterProdutosCriticos: vi.fn().mockResolvedValue([
        {
          id: 1,
          descricao: "Papel Sulfite A4",
          quantidade_estoque: 2,
          status: "baixo"
        },
        {
          id: 2,
          descricao: "Tinta Preto 500ml",
          quantidade_estoque: 0,
          status: "sem_estoque"
        }
      ]),
      obterUltimasOperacoes: vi.fn().mockResolvedValue([
        {
          id: 10,
          tipo: "VENDA",
          descricao: "Venda #10 - Cliente Exemplo",
          identificador: "#10",
          data: new Date("2026-10-15T10:00:00.000Z"),
          valor: 200.0
        },
        {
          id: 4,
          tipo: "COMPRA",
          descricao: "Compra #4 - Fornecedor Exemplo",
          identificador: "#4",
          data: new Date("2026-10-14T08:00:00.000Z"),
          valor: 150.0
        }
      ])
    };
    servico = new ServicoDashboard(repositorioMock);
  });

  it("deve retornar o resumo consolidado com todos os indicadores", async () => {
    const resultado = await servico.obterResumo({}, dataReferencia);

    expect(resultado).toBeDefined();
    expect(resultado.vendas.total_vendas).toBe(5);
    expect(resultado.vendas.valor_total).toBe(1000.5);
    expect(resultado.compras.total_compras).toBe(3);
    expect(resultado.compras.valor_total).toBe(600.0);
    expect(resultado.financeiro.entradas).toBe(1000.5);
    expect(resultado.financeiro.saidas).toBe(600.0);
    expect(resultado.financeiro.saldo).toBe(400.5); // 1000.5 - 600.0
    expect(resultado.estoque.total_produtos).toBe(25);
    expect(resultado.estoque.produtos_estoque_baixo).toBe(2);
    expect(resultado.estoque.produtos_criticos).toHaveLength(2);
    expect(resultado.ultimas_operacoes).toHaveLength(2);
    expect(resultado.ultimasOperacoes).toHaveLength(2);
  });

  it("deve calcular corretamente o saldo financeiro (Entradas - Saídas)", async () => {
    vi.mocked(repositorioMock.obterResumoFinanceiro).mockResolvedValueOnce({
      entradas: 1500.0,
      saidas: 2000.0,
      quantidade_entradas: 2,
      quantidade_saidas: 4
    });

    const resultado = await servico.obterResumo({}, dataReferencia);
    expect(resultado.financeiro.saldo).toBe(-500.0);
  });

  it("deve tratar corretamente ausência de registros (valores zerados)", async () => {
    vi.mocked(repositorioMock.obterResumoVendas).mockResolvedValueOnce({
      total_vendas: 0,
      valor_total: 0,
      quantidade_itens: 0
    });
    vi.mocked(repositorioMock.obterResumoCompras).mockResolvedValueOnce({
      total_compras: 0,
      valor_total: 0,
      quantidade_itens: 0
    });
    vi.mocked(repositorioMock.obterResumoFinanceiro).mockResolvedValueOnce({
      entradas: 0,
      saidas: 0,
      quantidade_entradas: 0,
      quantidade_saidas: 0
    });
    vi.mocked(repositorioMock.obterResumoEstoque).mockResolvedValueOnce({
      total_produtos: 0,
      produtos_estoque_baixo: 0
    });
    vi.mocked(repositorioMock.obterProdutosCriticos).mockResolvedValueOnce([]);
    vi.mocked(repositorioMock.obterUltimasOperacoes).mockResolvedValueOnce([]);

    const resultado = await servico.obterResumo({}, dataReferencia);

    expect(resultado.vendas.total_vendas).toBe(0);
    expect(resultado.vendas.valor_total).toBe(0);
    expect(resultado.compras.total_compras).toBe(0);
    expect(resultado.financeiro.saldo).toBe(0);
    expect(resultado.estoque.produtos_criticos).toHaveLength(0);
    expect(resultado.ultimas_operacoes).toHaveLength(0);
  });

  it("deve resolver período semanal adequadamente", async () => {
    const resultado = await servico.obterResumo({ periodo: "semana" }, dataReferencia);

    expect(resultado.periodo.tipo).toBe("semana");
    expect(resultado.periodo.data_inicio).toBeDefined();
    expect(resultado.periodo.data_fim).toBeDefined();
    expect(repositorioMock.obterResumoVendas).toHaveBeenCalled();
  });

  it("deve resolver período mensal adequadamente", async () => {
    const resultado = await servico.obterResumo({ periodo: "mes" }, dataReferencia);

    expect(resultado.periodo.tipo).toBe("mes");
    expect(resultado.periodo.data_inicio).toBeDefined();
    expect(resultado.periodo.data_fim).toBeDefined();
  });

  it("deve lançar erro se a data inicial for posterior à data final", async () => {
    await expect(
      servico.obterResumo(
        {
          data_inicio: "2026-10-20",
          data_fim: "2026-10-10"
        },
        dataReferencia
      )
    ).rejects.toThrow(ErroAplicacao);
  });
});
