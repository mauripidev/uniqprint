import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import { RepositorioFinanceiro, LancamentoDb } from "../repositorios/repositorio_financeiro.js";
import { ServicoFinanceiro } from "./servico_financeiro.js";
import { Prisma } from "@prisma/client";

describe("Serviço Financeiro (Regras de Negócio e Cálculos)", () => {
  let repositorioMock: RepositorioFinanceiro;
  let servicoFinanceiro: ServicoFinanceiro;

  const dataExemplo = new Date("2026-08-15T10:00:00.000Z");

  const lancamentoManualExemplo: LancamentoDb = {
    id: 1,
    tipo: "SAIDA",
    descricao: "Pagamento de Aluguel",
    valor: new Prisma.Decimal("2500.00"),
    data_lancamento: dataExemplo,
    categoria: "ALUGUEL",
    tipo_referencia: "MANUAL",
    referencia_id: null,
    observacao: "Aluguel da sede",
    criado_em: dataExemplo
  };

  const lancamentoAutomaticoCompra: LancamentoDb = {
    id: 2,
    tipo: "SAIDA",
    descricao: "Compra #10 - Bobina Térmica",
    valor: new Prisma.Decimal("1000.00"),
    data_lancamento: dataExemplo,
    categoria: "COMPRA",
    tipo_referencia: "COMPRA",
    referencia_id: 10,
    observacao: "Lançamento automático de saída pela compra #10",
    criado_em: dataExemplo
  };

  const lancamentoAutomaticoVenda: LancamentoDb = {
    id: 3,
    tipo: "ENTRADA",
    descricao: "Venda #20 - Banner Lona",
    valor: new Prisma.Decimal("1500.00"),
    data_lancamento: dataExemplo,
    categoria: "VENDA",
    tipo_referencia: "VENDA",
    referencia_id: 20,
    observacao: "Lançamento automático de entrada pela venda #20",
    criado_em: dataExemplo
  };

  beforeEach(() => {
    repositorioMock = {
      listar: vi.fn(),
      buscarPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      excluir: vi.fn(),
      calcularResumo: vi.fn()
    };

    servicoFinanceiro = new ServicoFinanceiro(repositorioMock);
  });

  describe("Listagem e Filtros", () => {
    it("deve listar lançamentos com resumo e paginação", async () => {
      vi.mocked(repositorioMock.listar).mockResolvedValueOnce({
        lancamentos: [lancamentoManualExemplo],
        total: 1
      });
      vi.mocked(repositorioMock.calcularResumo).mockResolvedValueOnce({
        total_entradas: 0,
        total_saidas: 2500,
        saldo: -2500,
        saldo_atual: -2500
      });

      const resultado = await servicoFinanceiro.listar({
        pagina: 1,
        limite: 20,
        categoria: "ALUGUEL"
      });

      expect(resultado.dados).toHaveLength(1);
      expect(resultado.dados[0].id).toBe(1);
      expect(resultado.dados[0].valor).toBe(2500);
      expect(resultado.resumo.saldo).toBe(-2500);
      expect(resultado.paginacao.total).toBe(1);
      expect(resultado.paginacao.total_paginas).toBe(1);
    });
  });

  describe("Cálculo do Saldo (Section 52 & 53)", () => {
    it("deve calcular saldo positivo consolidado: Entradas=1500, Saídas=500 -> Saldo=1000", async () => {
      vi.mocked(repositorioMock.calcularResumo).mockResolvedValueOnce({
        total_entradas: 1500,
        total_saidas: 500,
        saldo: 1000,
        saldo_atual: 1000
      });

      const resumo = await servicoFinanceiro.calcularSaldo({});

      expect(resumo.total_entradas).toBe(1500);
      expect(resumo.total_saidas).toBe(500);
      expect(resumo.saldo).toBe(1000);
    });

    it("deve calcular saldo negativo consolidado: Entradas=500, Saídas=800 -> Saldo=-300", async () => {
      vi.mocked(repositorioMock.calcularResumo).mockResolvedValueOnce({
        total_entradas: 500,
        total_saidas: 800,
        saldo: -300,
        saldo_atual: -300
      });

      const resumo = await servicoFinanceiro.calcularSaldo({});

      expect(resumo.total_entradas).toBe(500);
      expect(resumo.total_saidas).toBe(800);
      expect(resumo.saldo).toBe(-300);
    });
  });

  describe("CRUD e Proteção de Lançamentos Automáticos (Section 51 & 61)", () => {
    it("deve criar lançamento manual de entrada com sucesso", async () => {
      const novoLancamento: LancamentoDb = {
        id: 4,
        tipo: "ENTRADA",
        descricao: "Aporte de Capital",
        valor: new Prisma.Decimal("5000.00"),
        data_lancamento: dataExemplo,
        categoria: "APORTE",
        tipo_referencia: "MANUAL",
        referencia_id: null,
        observacao: "Aporte sócios",
        criado_em: dataExemplo
      };

      vi.mocked(repositorioMock.criar).mockResolvedValueOnce(novoLancamento);

      const resultado = await servicoFinanceiro.criar({
        tipo: "ENTRADA",
        descricao: "Aporte de Capital",
        valor: 5000,
        categoria: "APORTE",
        observacao: "Aporte sócios"
      });

      expect(resultado.id).toBe(4);
      expect(resultado.valor).toBe(5000);
      expect(resultado.tipo).toBe("ENTRADA");
    });

    it("deve buscar lançamento por ID com sucesso", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(lancamentoManualExemplo);

      const resultado = await servicoFinanceiro.buscarPorId(1);

      expect(resultado.id).toBe(1);
      expect(resultado.valor).toBe(2500);
    });

    it("deve lançar erro 404 quando lançamento não for encontrado", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(null);

      await expect(servicoFinanceiro.buscarPorId(999)).rejects.toThrowError(
        new ErroAplicacao("Lançamento não encontrado", "LANCAMENTO_NAO_ENCONTRADO", 404)
      );
    });

    it("deve permitir atualizar lançamento manual", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(lancamentoManualExemplo);
      vi.mocked(repositorioMock.atualizar).mockResolvedValueOnce({
        ...lancamentoManualExemplo,
        descricao: "Pagamento de Aluguel Atualizado",
        valor: new Prisma.Decimal("2600.00")
      });

      const resultado = await servicoFinanceiro.atualizar(1, {
        descricao: "Pagamento de Aluguel Atualizado",
        valor: 2600
      });

      expect(resultado.descricao).toBe("Pagamento de Aluguel Atualizado");
      expect(resultado.valor).toBe(2600);
    });

    it("deve rejeitar alteração de lançamento automático gerado por compra (400)", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(lancamentoAutomaticoCompra);

      await expect(
        servicoFinanceiro.atualizar(2, {
          descricao: "Tentativa de alteração"
        })
      ).rejects.toThrowError(
        new ErroAplicacao(
          "Lançamento automático não pode ser alterado manualmente.",
          "LANCAMENTO_AUTOMATICO",
          400
        )
      );
    });

    it("deve rejeitar alteração de lançamento automático gerado por venda (400)", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(lancamentoAutomaticoVenda);

      await expect(
        servicoFinanceiro.atualizar(3, {
          valor: 2000
        })
      ).rejects.toThrowError(
        new ErroAplicacao(
          "Lançamento automático não pode ser alterado manualmente.",
          "LANCAMENTO_AUTOMATICO",
          400
        )
      );
    });

    it("deve permitir excluir lançamento manual", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(lancamentoManualExemplo);
      vi.mocked(repositorioMock.excluir).mockResolvedValueOnce();

      await expect(servicoFinanceiro.excluir(1)).resolves.not.toThrow();
      expect(repositorioMock.excluir).toHaveBeenCalledWith(1);
    });

    it("deve rejeitar exclusão de lançamento automático gerado por compra (400)", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(lancamentoAutomaticoCompra);

      await expect(servicoFinanceiro.excluir(2)).rejects.toThrowError(
        new ErroAplicacao(
          "Lançamento automático não pode ser excluído.",
          "LANCAMENTO_AUTOMATICO",
          400
        )
      );
    });

    it("deve rejeitar exclusão de lançamento automático gerado por venda (400)", async () => {
      vi.mocked(repositorioMock.buscarPorId).mockResolvedValueOnce(lancamentoAutomaticoVenda);

      await expect(servicoFinanceiro.excluir(3)).rejects.toThrowError(
        new ErroAplicacao(
          "Lançamento automático não pode ser excluído.",
          "LANCAMENTO_AUTOMATICO",
          400
        )
      );
    });
  });
});
