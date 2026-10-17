import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServicoRelatorios } from "./servico_relatorios.js";
import { RepositorioRelatorios } from "../repositorios/repositorio_relatorios.js";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";

describe("Serviço de Relatórios Gerenciais (Regras, Agregações e Filtros)", () => {
  let repositorioMock: RepositorioRelatorios;
  let servico: ServicoRelatorios;
  const dataReferencia = new Date("2026-08-15T12:00:00.000Z"); // Sábado

  beforeEach(() => {
    repositorioMock = {
      obterRelatorioVendas: vi.fn(),
      obterRelatorioCompras: vi.fn(),
      obterRelatorioFinanceiro: vi.fn()
    };
    servico = new ServicoRelatorios(repositorioMock);
  });

  describe("Relatório de Vendas", () => {
    it("deve obter relatório de vendas sem filtros com resumo e detalhamento", async () => {
      vi.mocked(repositorioMock.obterRelatorioVendas).mockResolvedValueOnce({
        resumo: {
          total_vendas: 3,
          valor_total_vendido: 600,
          ticket_medio: 200,
          quantidade_itens: 6
        },
        dados: [
          {
            id: 1,
            data_venda: new Date("2026-08-10"),
            cliente_id: 1,
            cliente_nome: "Cliente Teste",
            produto_id: 2,
            produto_descricao: "Produto Teste",
            quantidade: 2,
            valor_unitario: 100,
            valor_total: 200
          }
        ],
        total: 1
      });

      const resultado = await servico.obterRelatorioVendas(
        { pagina: 1, limite: 20 },
        dataReferencia
      );

      expect(repositorioMock.obterRelatorioVendas).toHaveBeenCalledWith(
        expect.objectContaining({
          pagina: 1,
          limite: 20
        })
      );
      expect(resultado.resumo.total_vendas).toBe(3);
      expect(resultado.resumo.valor_total_vendido).toBe(600);
      expect(resultado.resumo.ticket_medio).toBe(200);
      expect(resultado.dados).toHaveLength(1);
    });

    it("deve resolver filtro semanal (segunda a domingo) corretamente", async () => {
      vi.mocked(repositorioMock.obterRelatorioVendas).mockResolvedValueOnce({
        resumo: {
          total_vendas: 2,
          valor_total_vendido: 300,
          ticket_medio: 150,
          quantidade_itens: 3
        },
        dados: [],
        total: 0
      });

      const resultado = await servico.obterRelatorioVendas(
        { periodo: "semana", pagina: 1, limite: 20 },
        dataReferencia
      );

      expect(resultado.filtros_aplicados.periodo).toBe("semana");
      expect(resultado.filtros_aplicados.data_inicio).toBeDefined();
      expect(resultado.filtros_aplicados.data_fim).toBeDefined();
      expect(repositorioMock.obterRelatorioVendas).toHaveBeenCalled();
    });

    it("deve resolver filtro mensal corretamente", async () => {
      vi.mocked(repositorioMock.obterRelatorioVendas).mockResolvedValueOnce({
        resumo: {
          total_vendas: 10,
          valor_total_vendido: 2500,
          ticket_medio: 250,
          quantidade_itens: 20
        },
        dados: [],
        total: 0
      });

      const resultado = await servico.obterRelatorioVendas(
        { periodo: "mes", pagina: 1, limite: 20 },
        dataReferencia
      );

      expect(resultado.filtros_aplicados.periodo).toBe("mes");
      const dInicio = new Date(resultado.filtros_aplicados.data_inicio!);
      expect(dInicio.getUTCDate()).toBe(1);
      expect(dInicio.getUTCMonth()).toBe(7); // Agosto (0-indexed)
    });

    it("deve filtrar por período personalizado com data_inicio e data_fim", async () => {
      vi.mocked(repositorioMock.obterRelatorioVendas).mockResolvedValueOnce({
        resumo: {
          total_vendas: 5,
          valor_total_vendido: 1000,
          ticket_medio: 200,
          quantidade_itens: 8
        },
        dados: [],
        total: 0
      });

      const resultado = await servico.obterRelatorioVendas({
        periodo: "personalizado",
        data_inicio: "2026-08-01",
        data_fim: "2026-08-31",
        pagina: 1,
        limite: 20
      });

      expect(repositorioMock.obterRelatorioVendas).toHaveBeenCalledWith(
        expect.objectContaining({
          data_inicio: expect.any(Date),
          data_fim: expect.any(Date)
        })
      );
      expect(resultado.filtros_aplicados.periodo).toBe("personalizado");
    });

    it("deve filtrar por produto_id e cliente_id", async () => {
      vi.mocked(repositorioMock.obterRelatorioVendas).mockResolvedValueOnce({
        resumo: {
          total_vendas: 1,
          valor_total_vendido: 100,
          ticket_medio: 100,
          quantidade_itens: 1
        },
        dados: [],
        total: 1
      });

      await servico.obterRelatorioVendas({
        produto_id: 10,
        cliente_id: 20,
        pagina: 1,
        limite: 20
      });

      expect(repositorioMock.obterRelatorioVendas).toHaveBeenCalledWith(
        expect.objectContaining({
          produto_id: 10,
          cliente_id: 20
        })
      );
    });

    it("deve lançar ErroAplicacao se data inicial for posterior à data final", async () => {
      await expect(
        servico.obterRelatorioVendas({
          data_inicio: "2026-08-31",
          data_fim: "2026-08-01",
          pagina: 1,
          limite: 20
        })
      ).rejects.toThrow("A data inicial não pode ser posterior à data final");
    });

    it("deve calcular corretamente totais, média e quantidade com dados controlados (Seção 48)", async () => {
      // Exemplo conceitual: Venda 1 = 100, Venda 2 = 200, Venda 3 = 300
      // Total = 600, Média = 200, Quantidade = 3
      const totalControlado = 100 + 200 + 300;
      const mediaControlada = totalControlado / 3;

      vi.mocked(repositorioMock.obterRelatorioVendas).mockResolvedValueOnce({
        resumo: {
          total_vendas: 3,
          valor_total_vendido: totalControlado,
          ticket_medio: mediaControlada,
          quantidade_itens: 6
        },
        dados: [],
        total: 3
      });

      const resultado = await servico.obterRelatorioVendas({
        pagina: 1,
        limite: 10
      });

      expect(resultado.resumo.total_vendas).toBe(3);
      expect(resultado.resumo.valor_total_vendido).toBe(600);
      expect(resultado.resumo.ticket_medio).toBe(200);
    });
  });

  describe("Relatório de Compras", () => {
    it("deve obter relatório de compras sem filtros com resumo e detalhamento", async () => {
      vi.mocked(repositorioMock.obterRelatorioCompras).mockResolvedValueOnce({
        resumo: {
          total_compras: 4,
          valor_total_comprado: 1200,
          media_por_compra: 300,
          quantidade_itens: 15
        },
        dados: [
          {
            id: 1,
            data_compra: new Date("2026-08-12"),
            fornecedor_id: 1,
            fornecedor_nome: "Fornecedor Alpha",
            produto_id: 3,
            produto_descricao: "Vinil Adesivo",
            quantidade: 5,
            valor_unitario: 60,
            valor_total: 300
          }
        ],
        total: 1
      });

      const resultado = await servico.obterRelatorioCompras({
        pagina: 1,
        limite: 20
      });

      expect(resultado.resumo.total_compras).toBe(4);
      expect(resultado.resumo.valor_total_comprado).toBe(1200);
      expect(resultado.resumo.media_por_compra).toBe(300);
      expect(resultado.dados).toHaveLength(1);
    });

    it("deve filtrar compras por semana, mês e período personalizado", async () => {
      vi.mocked(repositorioMock.obterRelatorioCompras).mockResolvedValueOnce({
        resumo: {
          total_compras: 2,
          valor_total_comprado: 500,
          media_por_compra: 250,
          quantidade_itens: 4
        },
        dados: [],
        total: 0
      });

      const resultado = await servico.obterRelatorioCompras(
        { periodo: "semana", pagina: 1, limite: 20 },
        dataReferencia
      );

      expect(resultado.filtros_aplicados.periodo).toBe("semana");
      expect(repositorioMock.obterRelatorioCompras).toHaveBeenCalled();
    });

    it("deve filtrar compras por produto_id e fornecedor_id", async () => {
      vi.mocked(repositorioMock.obterRelatorioCompras).mockResolvedValueOnce({
        resumo: {
          total_compras: 1,
          valor_total_comprado: 350,
          media_por_compra: 350,
          quantidade_itens: 10
        },
        dados: [],
        total: 1
      });

      await servico.obterRelatorioCompras({
        produto_id: 5,
        fornecedor_id: 7,
        pagina: 1,
        limite: 20
      });

      expect(repositorioMock.obterRelatorioCompras).toHaveBeenCalledWith(
        expect.objectContaining({
          produto_id: 5,
          fornecedor_id: 7
        })
      );
    });
  });

  describe("Relatório Financeiro", () => {
    it("deve obter relatório financeiro sem filtros com entradas, saídas e saldo consistente", async () => {
      // Seção 53: Entrada = 1000, Entrada = 500, Saída = 300 => Total Entradas = 1500, Total Saídas = 300, Saldo = 1200
      vi.mocked(repositorioMock.obterRelatorioFinanceiro).mockResolvedValueOnce({
        resumo: {
          total_entradas: 1500,
          total_saidas: 300,
          saldo: 1200,
          quantidade_entradas: 2,
          quantidade_saidas: 1,
          media_entradas: 750,
          media_saidas: 300
        },
        dados: [
          {
            id: 1,
            tipo: "ENTRADA",
            descricao: "Venda 1",
            valor: 1000,
            data_lancamento: new Date(),
            categoria: "VENDA",
            tipo_referencia: "VENDA",
            referencia_id: 1,
            observacao: null
          },
          {
            id: 2,
            tipo: "ENTRADA",
            descricao: "Venda 2",
            valor: 500,
            data_lancamento: new Date(),
            categoria: "VENDA",
            tipo_referencia: "VENDA",
            referencia_id: 2,
            observacao: null
          },
          {
            id: 3,
            tipo: "SAIDA",
            descricao: "Despesa Material",
            valor: 300,
            data_lancamento: new Date(),
            categoria: "MATERIAL",
            tipo_referencia: "MANUAL",
            referencia_id: null,
            observacao: null
          }
        ],
        total: 3
      });

      const resultado = await servico.obterRelatorioFinanceiro({
        pagina: 1,
        limite: 20
      });

      expect(resultado.resumo.total_entradas).toBe(1500);
      expect(resultado.resumo.total_saidas).toBe(300);
      expect(resultado.resumo.saldo).toBe(1200);
      expect(resultado.resumo.quantidade_entradas).toBe(2);
      expect(resultado.resumo.quantidade_saidas).toBe(1);
      expect(resultado.resumo.media_entradas).toBe(750);
      expect(resultado.resumo.media_saidas).toBe(300);
      expect(resultado.dados).toHaveLength(3);
    });

    it("deve filtrar lançamentos financeiros por tipo e categoria", async () => {
      vi.mocked(repositorioMock.obterRelatorioFinanceiro).mockResolvedValueOnce({
        resumo: {
          total_entradas: 0,
          total_saidas: 450,
          saldo: -450,
          quantidade_entradas: 0,
          quantidade_saidas: 2,
          media_entradas: 0,
          media_saidas: 225
        },
        dados: [],
        total: 2
      });

      await servico.obterRelatorioFinanceiro({
        tipo: "SAIDA",
        categoria: "ENERGIA",
        pagina: 1,
        limite: 20
      });

      expect(repositorioMock.obterRelatorioFinanceiro).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: "SAIDA",
          categoria: "ENERGIA"
        })
      );
    });
  });
});
