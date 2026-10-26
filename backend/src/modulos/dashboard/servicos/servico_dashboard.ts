import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import { resolverIntervaloPeriodo } from "../../relatorios/compartilhado/utilitarios_periodo.js";
import {
  DashboardResumoResposta,
  RequisicaoDashboardResumo
} from "../dtos/dashboard_dto.js";
import {
  RepositorioDashboard,
  RepositorioDashboardPrisma
} from "../repositorios/repositorio_dashboard.js";

export class ServicoDashboard {
  constructor(
    private repositorio: RepositorioDashboard = new RepositorioDashboardPrisma()
  ) {}

  async obterResumo(
    dados: Partial<RequisicaoDashboardResumo> = {},
    dataReferencia: Date = new Date()
  ): Promise<DashboardResumoResposta> {
    let data_inicio: Date | undefined;
    let data_fim: Date | undefined;
    let periodo_resolvido: string | undefined;

    if (dados.periodo === "todos") {
      data_inicio = undefined;
      data_fim = undefined;
      periodo_resolvido = "todos";
    } else if (dados.periodo === "hoje") {
      const inicio = new Date(dataReferencia);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(dataReferencia);
      fim.setHours(23, 59, 59, 999);
      data_inicio = inicio;
      data_fim = fim;
      periodo_resolvido = "hoje";
    } else {
      const periodoValido =
        dados.periodo === "semana" || dados.periodo === "mes" || dados.periodo === "personalizado"
          ? dados.periodo
          : undefined;

      const intervalo = resolverIntervaloPeriodo(
        periodoValido,
        dados.data_inicio,
        dados.data_fim,
        dataReferencia
      );
      data_inicio = intervalo.data_inicio;
      data_fim = intervalo.data_fim;
      periodo_resolvido = intervalo.periodo_resolvido;
    }

    if (data_inicio && data_fim && data_inicio > data_fim) {
      throw new ErroAplicacao(
        "A data inicial não pode ser posterior à data final",
        "DATAS_INVALIDAS",
        400
      );
    }

    const [
      vendas,
      compras,
      financeiroBruto,
      estoqueBruto,
      produtosCriticos,
      ultimasOperacoes
    ] = await Promise.all([
      this.repositorio.obterResumoVendas(data_inicio, data_fim),
      this.repositorio.obterResumoCompras(data_inicio, data_fim),
      this.repositorio.obterResumoFinanceiro(data_inicio, data_fim),
      this.repositorio.obterResumoEstoque(),
      this.repositorio.obterProdutosCriticos(5),
      this.repositorio.obterUltimasOperacoes(dados.limite_operacoes ?? 6)
    ]);

    const saldo = Number(
      (financeiroBruto.entradas - financeiroBruto.saidas).toFixed(2)
    );

    return {
      vendas,
      compras,
      financeiro: {
        entradas: financeiroBruto.entradas,
        saidas: financeiroBruto.saidas,
        saldo,
        quantidade_entradas: financeiroBruto.quantidade_entradas,
        quantidade_saidas: financeiroBruto.quantidade_saidas
      },
      estoque: {
        total_produtos: estoqueBruto.total_produtos,
        produtos_estoque_baixo: estoqueBruto.produtos_estoque_baixo,
        produtos_criticos: produtosCriticos
      },
      ultimas_operacoes: ultimasOperacoes,
      ultimasOperacoes: ultimasOperacoes,
      periodo: {
        tipo: periodo_resolvido,
        data_inicio: data_inicio ? data_inicio.toISOString() : undefined,
        data_fim: data_fim ? data_fim.toISOString() : undefined
      }
    };
  }
}
