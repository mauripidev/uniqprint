import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Plus,
  Filter,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { servicoFinanceiro } from "../../servicos/financeiro.js";
import { LancamentoFinanceiro, ResumoFinanceiro } from "../../tipos/financeiro.js";
import { ModalLancamentoFinanceiro } from "./ModalLancamentoFinanceiro.js";
import { ModalConfirmacao } from "../../componentes/ModalConfirmacao.js";
import { ContextoAutenticacao } from "../../contextos/ContextoAutenticacao.js";

export const TelaFinanceiro: React.FC = () => {
  const contextoAutenticacao = useContext(ContextoAutenticacao);
  const usuario = contextoAutenticacao?.usuario;
  const ehAdmin = usuario?.papel === "ADMINISTRADOR";

  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    total_entradas: 0,
    total_saidas: 0,
    saldo: 0,
    saldo_atual: 0
  });
  const [carregando, setCarregando] = useState(true);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Paginação
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // Filtros aplicados
  const [filtroTipo, setFiltroTipo] = useState<"ENTRADA" | "SAIDA" | "TODOS">("TODOS");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // Modais
  const [modalAberto, setModalAberto] = useState(false);
  const [lancamentoEditando, setLancamentoEditando] = useState<LancamentoFinanceiro | undefined>(undefined);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  const temFiltrosAtivos =
    filtroTipo !== "TODOS" ||
    filtroCategoria.trim() !== "" ||
    filtroDataInicio !== "" ||
    filtroDataFim !== "";

  const carregarDados = useCallback(
    async (paginaAlvo: number = pagina) => {
      setCarregando(true);
      setErro(null);
      try {
        const resposta = await servicoFinanceiro.listar({
          pagina: paginaAlvo,
          limite: 20,
          tipo: filtroTipo !== "TODOS" ? filtroTipo : undefined,
          categoria: filtroCategoria.trim() || undefined,
          data_inicio: filtroDataInicio || undefined,
          data_fim: filtroDataFim || undefined
        });

        setLancamentos(resposta.dados);
        setResumo(resposta.resumo);
        setPagina(resposta.paginacao.pagina);
        setTotalPaginas(resposta.paginacao.total_paginas);
        setTotalRegistros(resposta.paginacao.total);
      } catch (err: any) {
        setErro(
          err.response?.data?.erro?.mensagem ||
          err.response?.data?.mensagem ||
          "Não foi possível carregar os dados financeiros."
        );
      } finally {
        setCarregando(false);
      }
    },
    [pagina, filtroTipo, filtroCategoria, filtroDataInicio, filtroDataFim]
  );

  useEffect(() => {
    carregarDados(pagina);
  }, [pagina, filtroTipo]);

  const aplicarFiltros = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPagina(1);
    carregarDados(1);
  };

  const limparFiltros = () => {
    setFiltroTipo("TODOS");
    setFiltroCategoria("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setPagina(1);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(valor);
  };

  const formatarData = (dataStr: string) => {
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    } catch {
      return dataStr;
    }
  };

  const formatarOrigem = (lancamento: LancamentoFinanceiro) => {
    if (lancamento.tipo_referencia === "COMPRA") {
      return `Compra #${lancamento.referencia_id}`;
    }
    if (lancamento.tipo_referencia === "VENDA") {
      return `Venda #${lancamento.referencia_id}`;
    }
    return "Manual";
  };

  const confirmarExclusao = async () => {
    if (!idParaExcluir) return;

    try {
      await servicoFinanceiro.excluir(idParaExcluir);
      setMensagemSucesso("Lançamento excluído com sucesso.");
      setIdParaExcluir(null);
      carregarDados(pagina);
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err: any) {
      setErro(
        err.response?.data?.erro?.mensagem ||
        err.response?.data?.mensagem ||
        "Não foi possível excluir o lançamento."
      );
      setIdParaExcluir(null);
    }
  };

  const saldoExibicao = resumo.saldo !== undefined ? resumo.saldo : resumo.saldo_atual;

  return (
    <div className="secao-pagina">
      {/* Cabeçalho */}
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina" data-testid="titulo-pagina-financeiro">
            Controle Financeiro
          </h1>
          <p className="subtitulo-pagina">
            Consolidação de receitas, despesas, extrato e lançamentos manuais
          </p>
        </div>

        <button
          className="botao-primario"
          onClick={() => {
            setLancamentoEditando(undefined);
            setModalAberto(true);
          }}
          data-testid="botao-novo-lancamento"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Plus size={16} />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Alertas */}
      {mensagemSucesso && (
        <div
          className="alerta-sucesso"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1rem",
            marginBottom: "1.5rem",
            backgroundColor: "var(--sucesso-fundo)",
            border: "1px solid var(--sucesso-borda)",
            borderRadius: "var(--raio-pequeno)",
            color: "var(--sucesso)"
          }}
          data-testid="alerta-sucesso-financeiro"
        >
          <CheckCircle size={18} />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {erro && (
        <div
          className="alerta-erro"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1rem",
            marginBottom: "1.5rem",
            backgroundColor: "var(--erro-fundo)",
            border: "1px solid var(--erro-borda)",
            borderRadius: "var(--raio-pequeno)",
            color: "var(--erro)"
          }}
          data-testid="alerta-erro-financeiro"
        >
          <AlertCircle size={18} />
          <span>{erro}</span>
        </div>
      )}

      {/* Cards Indicadores de Resumo (Section 28) */}
      <div className="grid-cards-resumo-financeiro">
        {/* Total de Entradas */}
        <div
          className="card-indicador-financeiro entradas"
          data-testid="card-total-entradas"
        >
          <div className="card-indicador-info">
            <span className="card-indicador-titulo">Total de Entradas</span>
            <span
              className="card-indicador-valor valor-destaque-positivo"
              data-testid="valor-total-entradas"
            >
              {formatarMoeda(resumo.total_entradas)}
            </span>
          </div>
          <div className="card-indicador-icone">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Total de Saídas */}
        <div
          className="card-indicador-financeiro saidas"
          data-testid="card-total-saidas"
        >
          <div className="card-indicador-info">
            <span className="card-indicador-titulo">Total de Saídas</span>
            <span
              className="card-indicador-valor valor-destaque-negativo"
              data-testid="valor-total-saidas"
            >
              {formatarMoeda(resumo.total_saidas)}
            </span>
          </div>
          <div className="card-indicador-icone">
            <TrendingDown size={22} />
          </div>
        </div>

        {/* Saldo Atual */}
        <div
          className={`card-indicador-financeiro ${
            saldoExibicao >= 0 ? "saldo-positivo" : "saldo-negativo"
          }`}
          data-testid="card-saldo-atual"
        >
          <div className="card-indicador-info">
            <span className="card-indicador-titulo">Saldo Atual</span>
            <span
              className={`card-indicador-valor ${
                saldoExibicao >= 0 ? "valor-destaque-positivo" : "valor-destaque-negativo"
              }`}
              data-testid="valor-saldo-atual"
            >
              {formatarMoeda(saldoExibicao)}
            </span>
          </div>
          <div className="card-indicador-icone">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Painel de Filtros (Section 29) */}
      <form onSubmit={aplicarFiltros} className="painel-filtros-financeiro">
        <div className="linha-filtros-financeiro">
          <div className="grupo-filtro-item">
            <label htmlFor="filtro-inicio">Data Inicial</label>
            <input
              id="filtro-inicio"
              type="date"
              className="campo-texto"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              data-testid="filtro-data-inicio"
            />
          </div>

          <div className="grupo-filtro-item">
            <label htmlFor="filtro-fim">Data Final</label>
            <input
              id="filtro-fim"
              type="date"
              className="campo-texto"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              data-testid="filtro-data-fim"
            />
          </div>

          <div className="grupo-filtro-item">
            <label htmlFor="filtro-categoria">Categoria</label>
            <input
              id="filtro-categoria"
              type="text"
              className="campo-texto"
              placeholder="Buscar categoria..."
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              data-testid="filtro-categoria"
            />
          </div>

          <div className="grupo-filtro-item">
            <label htmlFor="filtro-tipo">Tipo</label>
            <select
              id="filtro-tipo"
              className="campo-selecao"
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value as any);
                setPagina(1);
              }}
              data-testid="filtro-tipo"
            >
              <option value="TODOS">Todos os tipos</option>
              <option value="ENTRADA">Entradas</option>
              <option value="SAIDA">Saídas</option>
            </select>
          </div>

          <div className="acoes-filtros-financeiro">
            <button
              type="submit"
              className="botao-primario"
              data-testid="botao-aplicar-filtros"
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Filter size={15} />
              <span>Filtrar</span>
            </button>
            {temFiltrosAtivos && (
              <button
                type="button"
                className="botao-secundario"
                onClick={limparFiltros}
                data-testid="botao-limpar-filtros"
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <RotateCcw size={15} />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Extrato / Tabela de Lançamentos (Section 29, 36, 37, 38) */}
      <div className="conteiner-tabela">
        <table className="tabela-dados" data-testid="tabela-financeiro">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th>Origem</th>
              <th style={{ textAlign: "right" }}>Valor</th>
              <th style={{ textAlign: "center" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={7}>
                  <div className="conteiner-carregando-tabela" data-testid="loading-financeiro">
                    <span>Carregando dados financeiros...</span>
                  </div>
                </td>
              </tr>
            ) : lancamentos.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="estado-vazio" data-testid="estado-vazio-financeiro">
                    <h3>
                      {temFiltrosAtivos
                        ? "Nenhum lançamento encontrado para os filtros selecionados."
                        : "Nenhum lançamento financeiro encontrado."}
                    </h3>
                    <p>
                      {temFiltrosAtivos
                        ? "Tente ajustar o período ou a categoria pesquisada."
                        : "Cadastre um lançamento manual ou registre compras e vendas para movimentar o financeiro."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              lancamentos.map((lanc) => {
                const ehManual = !lanc.tipo_referencia || lanc.tipo_referencia === "MANUAL";

                return (
                  <tr key={lanc.id} data-testid={`linha-lancamento-${lanc.id}`}>
                    <td>{formatarData(lanc.data_lancamento)}</td>
                    <td style={{ fontWeight: 600 }}>{lanc.descricao}</td>
                    <td>{lanc.categoria}</td>
                    <td>
                      <span
                        className={`badge-financeiro-tipo ${
                          lanc.tipo === "ENTRADA" ? "entrada" : "saida"
                        }`}
                        data-testid={`badge-tipo-${lanc.id}`}
                      >
                        {lanc.tipo}
                      </span>
                    </td>
                    <td>
                      <span className="badge-origem" data-testid={`origem-lancamento-${lanc.id}`}>
                        {formatarOrigem(lanc)}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color:
                          lanc.tipo === "ENTRADA"
                            ? "var(--sucesso)"
                            : "var(--erro)"
                      }}
                      data-testid={`valor-lancamento-${lanc.id}`}
                    >
                      {lanc.tipo === "ENTRADA" ? "+" : "-"} {formatarMoeda(lanc.valor)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div
                        className="acoes-linha"
                        style={{ justifyContent: "center", display: "flex", gap: "0.25rem" }}
                      >
                        {ehManual && (
                          <button
                            type="button"
                            className="botao-acao-icone"
                            title="Editar lançamento"
                            onClick={() => {
                              setLancamentoEditando(lanc);
                              setModalAberto(true);
                            }}
                            data-testid={`botao-editar-lancamento-${lanc.id}`}
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {ehManual && ehAdmin && (
                          <button
                            type="button"
                            className="botao-acao-icone botao-inativar"
                            title="Excluir lançamento"
                            onClick={() => setIdParaExcluir(lanc.id)}
                            data-testid={`botao-excluir-lancamento-${lanc.id}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="paginacao-rodape">
            <span className="info-paginacao">
              Mostrando {lancamentos.length} de {totalRegistros} lançamentos
            </span>
            <div className="botoes-paginacao">
              <button
                type="button"
                className="botao-paginacao"
                disabled={pagina <= 1 || carregando}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                data-testid="botao-pagina-anterior"
              >
                Anterior
              </button>
              <span className="numero-pagina">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                type="button"
                className="botao-paginacao"
                disabled={pagina >= totalPaginas || carregando}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                data-testid="botao-pagina-proxima"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Formulário (Criar / Editar) */}
      {modalAberto && (
        <ModalLancamentoFinanceiro
          aoFechar={() => {
            setModalAberto(false);
            setLancamentoEditando(undefined);
          }}
          aoSalvar={(mensagem) => {
            setModalAberto(false);
            setLancamentoEditando(undefined);
            setMensagemSucesso(mensagem);
            carregarDados(pagina);
            setTimeout(() => setMensagemSucesso(null), 4000);
          }}
          lancamentoParaEditar={lancamentoEditando}
        />
      )}

      {/* Modal Confirmação de Exclusão (Section 35) */}
      <ModalConfirmacao
        aberto={idParaExcluir !== null}
        titulo="Excluir lançamento?"
        mensagem="Esta ação removerá o lançamento financeiro."
        textoConfirmar="Excluir"
        textoCancelar="Cancelar"
        variante="perigo"
        aoConfirmar={confirmarExclusao}
        aoFechar={() => setIdParaExcluir(null)}
      />
    </div>
  );
};
