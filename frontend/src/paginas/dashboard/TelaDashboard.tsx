import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Zap
} from "lucide-react";
import { obterResumoDashboard } from "../../servicos/dashboard.js";
import { DashboardResumo } from "../../tipos/dashboard.js";

type TipoPeriodo = "mes" | "semana" | "todos";

export const TelaDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<TipoPeriodo>("mes");
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(valor);
  };

  const formatarData = (dataStr: string | Date) => {
    if (!dataStr) return "-";
    const data = new Date(dataStr);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(data);
  };

  const carregarDashboard = useCallback(
    async (periodoSelecionado: TipoPeriodo) => {
      setCarregando(true);
      setErro(null);
      try {
        const dados = await obterResumoDashboard({
          periodo: periodoSelecionado === "todos" ? "todos" : periodoSelecionado
        });
        setResumo(dados);
      } catch (err) {
        setErro(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o dashboard."
        );
      } finally {
        setCarregando(false);
      }
    },
    []
  );

  useEffect(() => {
    carregarDashboard(periodo);
  }, [carregarDashboard, periodo]);

  const alternarPeriodo = (novoPeriodo: TipoPeriodo) => {
    setPeriodo(novoPeriodo);
  };

  const saldo = resumo?.financeiro.saldo ?? 0;
  const saldoPositivo = saldo >= 0;

  return (
    <div className="painel-dashboard">
      {/* 1. Cabeçalho */}
      <header className="dashboard-cabecalho">
        <div className="dashboard-cabecalho-info">
          <h1>Dashboard</h1>
          <p>Visão executiva em tempo real de vendas, compras, estoque e finanças</p>
        </div>

        <div className="dashboard-cabecalho-controles">
          <div className="dashboard-seletor-periodo" role="group" aria-label="Seletor de período">
            <button
              type="button"
              className={`btn-periodo ${periodo === "mes" ? "ativo" : ""}`}
              onClick={() => alternarPeriodo("mes")}
              data-testid="filtro-periodo-mes"
            >
              Mês Atual
            </button>
            <button
              type="button"
              className={`btn-periodo ${periodo === "semana" ? "ativo" : ""}`}
              onClick={() => alternarPeriodo("semana")}
              data-testid="filtro-periodo-semana"
            >
              Semana Atual
            </button>
            <button
              type="button"
              className={`btn-periodo ${periodo === "todos" ? "ativo" : ""}`}
              onClick={() => alternarPeriodo("todos")}
              data-testid="filtro-periodo-todos"
            >
              Todos
            </button>
          </div>

          <button
            type="button"
            className="btn-atualizar-dashboard"
            onClick={() => carregarDashboard(periodo)}
            title="Atualizar dados do dashboard"
            data-testid="btn-atualizar-dashboard"
          >
            <RefreshCw size={15} className={carregando ? "animacao-rotacao" : ""} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      {/* 2. Barra de Atalhos Rápidos */}
      <section className="dashboard-atalhos-container" aria-label="Ações Rápidas">
        <div className="dashboard-atalhos-info">
          <div className="dashboard-atalhos-icone">
            <Zap size={20} />
          </div>
          <div className="dashboard-atalhos-texto">
            <strong>Atalhos Operacionais</strong>
            <span>Registre novas transações rapidamente no sistema</span>
          </div>
        </div>

        <div className="dashboard-botoes-atalho">
          <button
            type="button"
            className="btn-atalho-venda"
            onClick={() => navigate("/vendas?novo=true")}
            data-testid="btn-atalho-nova-venda"
          >
            <Plus size={16} />
            <ShoppingBag size={16} />
            <span>Nova Venda</span>
          </button>

          <button
            type="button"
            className="btn-atalho-compra"
            onClick={() => navigate("/compras?novo=true")}
            data-testid="btn-atalho-nova-compra"
          >
            <Plus size={16} />
            <ShoppingCart size={16} />
            <span>Nova Compra</span>
          </button>
        </div>
      </section>

      {/* 3. Feedback de Erro */}
      {erro && (
        <div className="dashboard-erro-card" role="alert" data-testid="dashboard-erro">
          <AlertTriangle size={36} color="var(--erro)" />
          <h3>Não foi possível carregar o dashboard</h3>
          <p>{erro}</p>
          <button
            type="button"
            className="btn-tentar-novamente"
            onClick={() => carregarDashboard(periodo)}
            data-testid="btn-tentar-novamente"
          >
            <RefreshCw size={16} />
            <span>Tentar novamente</span>
          </button>
        </div>
      )}

      {/* 4. Estado de Carregamento (Skeleton Pulse) */}
      {carregando && !resumo && (
        <div data-testid="dashboard-loading" aria-label="Carregando dados do dashboard">
          <div style={{ textAlign: "center", padding: "1rem", color: "var(--texto-mutado)", fontSize: "0.95rem" }}>
            Carregando dashboard...
          </div>
          <div className="dashboard-skeleton-grade">
            <div className="dashboard-skeleton-card" />
            <div className="dashboard-skeleton-card" />
            <div className="dashboard-skeleton-card" />
            <div className="dashboard-skeleton-card" />
          </div>
          <div className="dashboard-secoes-dupla" style={{ marginTop: "1.5rem" }}>
            <div className="dashboard-skeleton-secao" />
            <div className="dashboard-skeleton-secao" />
          </div>
        </div>
      )}

      {/* 5. Conteúdo Consolidado */}
      {resumo && !erro && (
        <>
          {/* Grade de 4 Cards KPIs */}
          <section className="grade-cards-dashboard" aria-label="Indicadores principais">
            {/* Card Vendas */}
            <article className="card-kpi card-kpi-vendas" data-testid="card-resumo-vendas">
              <div>
                <div className="card-kpi-cabecalho">
                  <span className="card-kpi-titulo">Total de Vendas</span>
                  <div className="card-kpi-icone">
                    <ShoppingBag size={18} color="#10b981" />
                  </div>
                </div>
                <div className="card-kpi-valor" data-testid="valor-vendas">
                  {formatarMoeda(resumo.vendas.valor_total)}
                </div>
                <div className="card-kpi-subtexto">
                  <span>
                    {resumo.vendas.total_vendas}{" "}
                    {resumo.vendas.total_vendas === 1 ? "venda" : "vendas"} (
                    {resumo.vendas.quantidade_itens}{" "}
                    {resumo.vendas.quantidade_itens === 1 ? "item" : "itens"})
                  </span>
                </div>
              </div>
              <div className="card-kpi-rodape">
                <Link to="/vendas" className="card-kpi-link">
                  <span>Ver vendas</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>

            {/* Card Compras */}
            <article className="card-kpi card-kpi-compras" data-testid="card-resumo-compras">
              <div>
                <div className="card-kpi-cabecalho">
                  <span className="card-kpi-titulo">Total de Compras</span>
                  <div className="card-kpi-icone">
                    <ShoppingCart size={18} color="#3b82f6" />
                  </div>
                </div>
                <div className="card-kpi-valor" data-testid="valor-compras">
                  {formatarMoeda(resumo.compras.valor_total)}
                </div>
                <div className="card-kpi-subtexto">
                  <span>
                    {resumo.compras.total_compras}{" "}
                    {resumo.compras.total_compras === 1 ? "compra" : "compras"} (
                    {resumo.compras.quantidade_itens}{" "}
                    {resumo.compras.quantidade_itens === 1 ? "item" : "itens"})
                  </span>
                </div>
              </div>
              <div className="card-kpi-rodape">
                <Link to="/compras" className="card-kpi-link">
                  <span>Ver compras</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>

            {/* Card Financeiro / Saldo */}
            <article
              className={`card-kpi ${
                saldoPositivo ? "card-kpi-financeiro-positivo" : "card-kpi-financeiro-negativo"
              }`}
              data-testid="card-resumo-financeiro"
            >
              <div>
                <div className="card-kpi-cabecalho">
                  <span className="card-kpi-titulo">Saldo Financeiro</span>
                  <div className="card-kpi-icone">
                    <Banknote size={18} color={saldoPositivo ? "#10b981" : "#ef4444"} />
                  </div>
                </div>
                <div
                  className={`card-kpi-valor ${
                    saldoPositivo ? "saldo-positivo" : "saldo-negativo"
                  }`}
                  data-testid="valor-saldo"
                >
                  {formatarMoeda(saldo)}
                </div>
                <div className="card-kpi-subtexto">
                  <span>
                    Entradas: {formatarMoeda(resumo.financeiro.entradas)} | Saídas:{" "}
                    {formatarMoeda(resumo.financeiro.saidas)}
                  </span>
                </div>
              </div>
              <div className="card-kpi-rodape">
                <Link to="/financeiro" className="card-kpi-link">
                  <span>Ver financeiro</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>

            {/* Card Estoque */}
            <article className="card-kpi card-kpi-estoque" data-testid="card-resumo-estoque">
              <div>
                <div className="card-kpi-cabecalho">
                  <span className="card-kpi-titulo">Estoque de Produtos</span>
                  <div className="card-kpi-icone">
                    <Package size={18} color="#f59e0b" />
                  </div>
                </div>
                <div className="card-kpi-valor" data-testid="valor-produtos">
                  {resumo.estoque.total_produtos}
                </div>
                <div className="card-kpi-subtexto">
                  {resumo.estoque.produtos_estoque_baixo > 0 ? (
                    <span style={{ color: "var(--alerta)", fontWeight: 600 }}>
                      ⚠ {resumo.estoque.produtos_estoque_baixo}{" "}
                      {resumo.estoque.produtos_estoque_baixo === 1
                        ? "produto com estoque baixo"
                        : "produtos com estoque baixo"}
                    </span>
                  ) : (
                    <span style={{ color: "var(--sucesso)" }}>
                      ✓ Todos os produtos em nível normal
                    </span>
                  )}
                </div>
              </div>
              <div className="card-kpi-rodape">
                <Link to="/estoque" className="card-kpi-link">
                  <span>Ver estoque</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          </section>

          {/* Seções Duplas: Estoque Crítico e Últimas Operações */}
          <div className="dashboard-secoes-dupla">
            {/* Seção Estoque Crítico */}
            <section
              className="dashboard-secao-card"
              aria-labelledby="titulo-estoque-critico"
              data-testid="secao-estoque-critico"
            >
              <div className="dashboard-secao-cabecalho">
                <div className="dashboard-secao-titulo" id="titulo-estoque-critico">
                  <AlertTriangle size={18} color="var(--alerta)" />
                  <span>Atenção: produtos com estoque baixo</span>
                </div>
                <Link to="/estoque" className="card-kpi-link">
                  <span>Ver estoque completo</span>
                </Link>
              </div>

              <div className="dashboard-secao-corpo">
                {resumo.estoque.produtos_criticos.length === 0 ? (
                  <div className="dashboard-vazio" data-testid="estoque-critico-vazio">
                    <div className="dashboard-vazio-icone">
                      <CheckCircle2 size={24} color="var(--sucesso)" />
                    </div>
                    <strong>Estoque seguro</strong>
                    <p>Nenhum produto com estoque baixo.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="tabela-estoque-critico">
                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th style={{ textAlign: "center" }}>Quantidade</th>
                          <th style={{ textAlign: "right" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumo.estoque.produtos_criticos.map((prod) => (
                          <tr key={prod.id} data-testid={`linha-produto-critico-${prod.id}`}>
                            <td style={{ fontWeight: 600 }}>{prod.descricao}</td>
                            <td style={{ textAlign: "center", fontWeight: 700 }}>
                              {prod.quantidade_estoque}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {prod.status === "sem_estoque" ? (
                                <span className="badge-estoque-sem">Sem Estoque</span>
                              ) : (
                                <span className="badge-estoque-baixo">Estoque Baixo</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* Seção Últimas Operações */}
            <section
              className="dashboard-secao-card"
              aria-labelledby="titulo-ultimas-operacoes"
              data-testid="secao-ultimas-operacoes"
            >
              <div className="dashboard-secao-cabecalho">
                <div className="dashboard-secao-titulo" id="titulo-ultimas-operacoes">
                  <Clock size={18} color="var(--primaria)" />
                  <span>Últimas movimentações</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--texto-mutado)" }}>
                  Recentes
                </div>
              </div>

              <div className="dashboard-secao-corpo">
                {(!resumo.ultimas_operacoes || resumo.ultimas_operacoes.length === 0) ? (
                  <div className="dashboard-vazio" data-testid="ultimas-operacoes-vazio">
                    <div className="dashboard-vazio-icone">
                      <Clock size={24} />
                    </div>
                    <strong>Sem movimentações recentes</strong>
                    <p>Nenhuma movimentação encontrada.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="tabela-ultimas-operacoes">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Tipo</th>
                          <th>Descrição</th>
                          <th style={{ textAlign: "right" }}>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumo.ultimas_operacoes.map((op, idx) => (
                          <tr key={`${op.tipo}-${op.id}-${idx}`} data-testid={`linha-operacao-${idx}`}>
                            <td style={{ color: "var(--texto-mutado)", fontSize: "0.8rem" }}>
                              {formatarData(op.data)}
                            </td>
                            <td>
                              <span
                                className={`badge-operacao ${
                                  op.tipo === "VENDA"
                                    ? "badge-operacao-venda"
                                    : "badge-operacao-compra"
                                }`}
                              >
                                {op.tipo}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{op.identificador}</div>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "var(--texto-mutado)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: "220px"
                                }}
                              >
                                {op.descricao}
                              </div>
                            </td>
                            <td
                              style={{ textAlign: "right" }}
                              className={
                                op.tipo === "VENDA"
                                  ? "operacao-valor-venda"
                                  : "operacao-valor-compra"
                              }
                            >
                              {formatarMoeda(op.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};
