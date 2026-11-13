export interface IntervaloPeriodo {
  data_inicio?: Date;
  data_fim?: Date;
  periodo_resolvido?: "semana" | "mes" | "personalizado";
}

export function resolverIntervaloPeriodo(
  periodo?: "semana" | "mes" | "personalizado",
  dataInicioStr?: string,
  dataFimStr?: string,
  dataReferencia: Date = new Date()
): IntervaloPeriodo {
  if (periodo === "semana") {
    // Semana corrente: segunda-feira 00:00:00 até domingo 23:59:59.999
    const ref = new Date(dataReferencia);
    const diaSemana = ref.getDay(); // 0 = Domingo, 1 = Segunda...
    const diasAteSegunda = (diaSemana + 6) % 7;

    const inicio = new Date(ref);
    inicio.setDate(ref.getDate() - diasAteSegunda);
    inicio.setHours(0, 0, 0, 0);

    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    fim.setHours(23, 59, 59, 999);

    return {
      data_inicio: inicio,
      data_fim: fim,
      periodo_resolvido: "semana"
    };
  }

  if (periodo === "mes") {
    const ano = dataReferencia.getFullYear();
    const mes = dataReferencia.getMonth();

    const inicio = new Date(ano, mes, 1, 0, 0, 0, 0);
    const fim = new Date(ano, mes + 1, 0, 23, 59, 59, 999);

    return {
      data_inicio: inicio,
      data_fim: fim,
      periodo_resolvido: "mes"
    };
  }

  // Personalizado ou datas explícitas
  let data_inicio: Date | undefined = undefined;
  let data_fim: Date | undefined = undefined;

  if (dataInicioStr) {
    data_inicio = dataInicioStr.includes("T")
      ? new Date(dataInicioStr)
      : new Date(`${dataInicioStr}T00:00:00.000Z`);
  }

  if (dataFimStr) {
    data_fim = dataFimStr.includes("T")
      ? new Date(dataFimStr)
      : new Date(`${dataFimStr}T23:59:59.999Z`);
  }

  return {
    data_inicio,
    data_fim,
    periodo_resolvido: periodo || (data_inicio || data_fim ? "personalizado" : undefined)
  };
}
