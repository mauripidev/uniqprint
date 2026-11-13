import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, History, Loader2, X } from "lucide-react";
import { listarMovimentacoes } from "../../servicos/estoque.js";
import { MovimentacaoEstoque } from "../../tipos/estoque.js";

interface ModalHistoricoMovimentacoesProps {
  produtoId?: number;
  produtoDescricao?: string;
  aoFechar: () => void;
}

export const ModalHistoricoMovimentacoes: React.FC<ModalHistoricoMovimentacoesProps> = ({
  produtoId,
  produtoDescricao,
  aoFechar
}) => {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros
  const [tipo, setTipo] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  // Paginação
  const [pagina, setPagina] = useState<number>(1);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);

  const carregarHistorico = useCallback(
    async (pag = 1) => {
      setCarregando(true);
      setErro(null);
      try {
        const resposta = await listarMovimentacoes({
          pagina: pag,
          limite: 8,
          produto_id: produtoId,
          tipo: tipo ? (tipo as any) : undefined,
          data_inicio: dataInicio || undefined,
          data_fim: dataFim || undefined
        });

        setMovimentacoes(resposta.dados);
        setPagina(resposta.paginacao.pagina);
        setTotalPaginas(resposta.paginacao.total_paginas);
        setTotalRegistros(resposta.paginacao.total);
      } catch (err: any) {
        setErro(err.message || "Erro ao carregar histórico de movimentações.");
      } finally {
        setCarregando(false);
      }
    },
    [produtoId, tipo, dataInicio, dataFim]
  );

  useEffect(() => {
    carregarHistorico(1);
  }, [carregarHistorico]);

  const formatarData = (dataIso: string) => {
    try {
      const data = new Date(dataIso);
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(data);
    } catch {
      return dataIso;
    }
  };

  const formatarOrigem = (mov: MovimentacaoEstoque) => {
    if (mov.tipo_referencia === "COMPRA" && mov.referencia_id) {
      return `Compra #${mov.referencia_id}`;
    }
    if (mov.tipo_referencia === "VENDA" && mov.referencia_id) {
      return `Venda #${mov.referencia_id}`;
    }
    if (mov.tipo_referencia === "AJUSTE_ENTRADA" || mov.tipo_referencia === "AJUSTE_SAIDA") {
      return "Ajuste Manual";
    }
    return mov.tipo_referencia || "Sistema";
  };

  return (
    <div className="envoltura-modal-backdrop" data-testid="modal-historico-movimentacoes">
      <div className="conteudo-modal-historico">
        {/* Cabeçalho */}
        <div className="cabecalho-modal">
          <div className="icone-modal-titulo">
            <History size={20} color="var(--cor-primaria, #60a5fa)" />
            <div>
              <h2 className="titulo-modal">Histórico de Movimentações</h2>
              {produtoDescricao && (
                <span style={{ fontSize: "0.8125rem", color: "var(--texto-mutado)" }}>
                  Produto: {produtoDescricao}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="botao-fechar-modal"
            onClick={aoFechar}
            data-testid="botao-fechar-modal-historico"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filtros */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid var(--borda-suave)",
            backgroundColor: "rgba(255, 255, 255, 0.01)",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "flex-end"
          }}
        >
          {/* Filtro Tipo */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--texto-mutado)", fontWeight: 500 }}>
              Tipo
            </label>
            <select
              className="select-filtro"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              data-testid="filtro-tipo-historico"
              style={{ minWidth: "130px" }}
            >
              <option value="">Todos os tipos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
              <option value="AJUSTE">Ajuste</option>
            </select>
          </div>

          {/* Filtro Data Inicial */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--texto-mutado)", fontWeight: 500 }}>
              Data Inicial
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Calendar
                size={14}
                style={{ position: "absolute", left: "0.6rem", color: "var(--texto-fraco)", pointerEvents: "none" }}
              />
              <input
                type="date"
                className="select-filtro"
                style={{ paddingLeft: "2rem" }}
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                data-testid="filtro-data-inicio-historico"
              />
            </div>
          </div>

          {/* Filtro Data Final */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--texto-mutado)", fontWeight: 500 }}>
              Data Final
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Calendar
                size={14}
                style={{ position: "absolute", left: "0.6rem", color: "var(--texto-fraco)", pointerEvents: "none" }}
              />
              <input
                type="date"
                className="select-filtro"
                style={{ paddingLeft: "2rem" }}
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                data-testid="filtro-data-fim-historico"
              />
            </div>
          </div>
        </div>

        {/* Corpo / Tabela */}
        <div className="corpo-modal" style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1.5rem" }}>
          {erro && (
            <div
              className="alerta-erro"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
                backgroundColor: "var(--erro-fundo)",
                border: "1px solid var(--erro-borda)",
                borderRadius: "var(--raio-pequeno)",
                color: "var(--erro)"
              }}
            >
              <AlertCircle size={16} />
              <span>{erro}</span>
            </div>
          )}

          {carregando ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "3rem 1rem",
                gap: "0.75rem",
                color: "var(--texto-mutado)"
              }}
              data-testid="loading-historico"
            >
              <Loader2 size={24} className="animacao-girar" />
              <span>Carregando movimentações...</span>
            </div>
          ) : movimentacoes.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 1rem",
                color: "var(--texto-mutado)"
              }}
              data-testid="estado-vazio-historico"
            >
              <History size={36} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
              <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Nenhuma movimentação encontrada</p>
              <p style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>
                Não foram encontrados registros para os filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="tabela-container" style={{ border: "1px solid var(--borda-suave)", borderRadius: "var(--raio-pequeno)" }}>
              <table className="tabela-dados" data-testid="tabela-historico-movimentacoes">
                <thead>
                  <tr>
                    <th>Data / Hora</th>
                    {!produtoId && <th>Produto</th>}
                    <th>Tipo</th>
                    <th>Quantidade</th>
                    <th>Origem</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoes.map((mov) => {
                    const tipoClasse =
                      mov.tipo === "ENTRADA"
                        ? "badge-mov-entrada"
                        : mov.tipo === "SAIDA"
                        ? "badge-mov-saida"
                        : "badge-mov-ajuste";

                    return (
                      <tr key={mov.id}>
                        <td style={{ fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
                          {formatarData(mov.criado_em)}
                        </td>
                        {!produtoId && (
                          <td style={{ fontWeight: 500 }}>
                            {mov.produto?.descricao || `Produto #${mov.produto_id}`}
                          </td>
                        )}
                        <td>
                          <span className={`badge-mov-tipo ${tipoClasse}`}>
                            {mov.tipo}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {mov.tipo === "SAIDA" ? `-${mov.quantidade}` : `+${mov.quantidade}`}
                        </td>
                        <td style={{ fontSize: "0.8125rem", color: "var(--texto-mutado)" }}>
                          {formatarOrigem(mov)}
                        </td>
                        <td style={{ fontSize: "0.8125rem", color: "var(--texto-corpo)", maxWidth: "240px" }}>
                          {mov.observacao || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rodapé / Paginação */}
        <div
          className="rodape-modal"
          style={{ justifyContent: "space-between", padding: "0.875rem 1.5rem" }}
        >
          <span style={{ fontSize: "0.8125rem", color: "var(--texto-mutado)" }}>
            Total: {totalRegistros} movimentações
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              className="botao-secundario"
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
              disabled={pagina <= 1 || carregando}
              onClick={() => carregarHistorico(pagina - 1)}
              data-testid="botao-pagina-anterior-historico"
            >
              <ChevronLeft size={14} />
              <span>Anterior</span>
            </button>
            <span style={{ fontSize: "0.75rem", color: "var(--texto-mutado)", padding: "0 0.25rem" }}>
              {pagina} de {totalPaginas || 1}
            </span>
            <button
              type="button"
              className="botao-secundario"
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
              disabled={pagina >= totalPaginas || carregando}
              onClick={() => carregarHistorico(pagina + 1)}
              data-testid="botao-proxima-pagina-historico"
            >
              <span>Próximo</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
