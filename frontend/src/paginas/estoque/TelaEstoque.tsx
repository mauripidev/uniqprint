import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  Package,
  PackageX,
  Search,
  SlidersHorizontal
} from "lucide-react";
import { listarEstoque } from "../../servicos/estoque.js";
import { ItemEstoque, ResumoEstoque } from "../../tipos/estoque.js";
import { ModalAjusteEstoque } from "./ModalAjusteEstoque.js";
import { ModalHistoricoMovimentacoes } from "./ModalHistoricoMovimentacoes.js";

export const TelaEstoque: React.FC = () => {
  const [produtos, setProdutos] = useState<ItemEstoque[]>([]);
  const [resumo, setResumo] = useState<ResumoEstoque>({
    total_produtos: 0,
    estoque_baixo: 0,
    sem_estoque: 0
  });

  const [paginacao, setPaginacao] = useState({
    pagina: 1,
    limite: 10,
    total: 0,
    total_paginas: 1
  });

  // Filtros
  const [busca, setBusca] = useState<string>("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "normal" | "baixo" | "sem_estoque">("todos");

  // Estados de controle
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Modais
  const [produtoParaAjuste, setProdutoParaAjuste] = useState<ItemEstoque | null>(null);
  const [historicoModalAberto, setHistoricoModalAberto] = useState<boolean>(false);
  const [produtoHistorico, setProdutoHistorico] = useState<{ id?: number; descricao?: string }>({});

  const carregarEstoque = useCallback(
    async (pagina = 1) => {
      setCarregando(true);
      setErro(null);
      try {
        const resposta = await listarEstoque({
          pagina,
          limite: 10,
          busca: busca || undefined,
          status: statusFiltro
        });

        setProdutos(resposta.dados);
        setPaginacao(resposta.paginacao);
        if (resposta.resumo) {
          setResumo(resposta.resumo);
        }
      } catch (err: any) {
        setErro(err.message || "Erro ao carregar itens do estoque");
      } finally {
        setCarregando(false);
      }
    },
    [busca, statusFiltro]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarEstoque(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [carregarEstoque]);

  const lidarComSucessoAjuste = (mensagem: string) => {
    setMensagemSucesso(mensagem);
    carregarEstoque(paginacao.pagina);
    setTimeout(() => setMensagemSucesso(null), 5000);
  };

  const abrirHistoricoProduto = (produto: ItemEstoque) => {
    setProdutoHistorico({ id: produto.id, descricao: produto.descricao });
    setHistoricoModalAberto(true);
  };

  const abrirHistoricoGeral = () => {
    setProdutoHistorico({});
    setHistoricoModalAberto(true);
  };

  return (
    <div className="secao-pagina">
      {/* Cabeçalho */}
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina" data-testid="titulo-pagina-estoque">
            Gestão de Estoque
          </h1>
          <p className="subtitulo-pagina">
            Visão consolidada, monitoramento de níveis de estoque, histórico e ajustes manuais
          </p>
        </div>

        <button
          className="botao-secundario"
          onClick={abrirHistoricoGeral}
          data-testid="botao-historico-geral"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <History size={16} />
          <span>Histórico Geral</span>
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
          data-testid="alerta-sucesso-estoque"
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
          data-testid="alerta-erro-estoque"
        >
          <AlertCircle size={18} />
          <span>{erro}</span>
        </div>
      )}

      {/* Cards Indicadores */}
      <div className="grid-cards-resumo-estoque">
        {/* Card: Total de Produtos */}
        <div className="card-indicador-estoque" data-testid="card-total-produtos">
          <div className="card-indicador-info">
            <span className="card-indicador-titulo">Total de Produtos Ativos</span>
            <span className="card-indicador-valor" data-testid="valor-total-produtos">
              {resumo.total_produtos}
            </span>
          </div>
          <div className="card-indicador-icone total">
            <Boxes size={22} />
          </div>
        </div>

        {/* Card: Estoque Baixo */}
        <div className="card-indicador-estoque" data-testid="card-estoque-baixo">
          <div className="card-indicador-info">
            <span className="card-indicador-titulo">Alerta de Estoque Baixo</span>
            <span className="card-indicador-valor" style={{ color: "#fbbf24" }} data-testid="valor-estoque-baixo">
              {resumo.estoque_baixo}
            </span>
          </div>
          <div className="card-indicador-icone baixo">
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* Card: Sem Estoque */}
        <div className="card-indicador-estoque" data-testid="card-sem-estoque">
          <div className="card-indicador-info">
            <span className="card-indicador-titulo">Produtos Sem Estoque</span>
            <span className="card-indicador-valor" style={{ color: "#f87171" }} data-testid="valor-sem-estoque">
              {resumo.sem_estoque}
            </span>
          </div>
          <div className="card-indicador-icone zerado">
            <PackageX size={22} />
          </div>
        </div>
      </div>

      {/* Barra de Ferramentas / Filtros */}
      <div
        className="barra-ferramentas"
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          padding: "1.25rem",
          backgroundColor: "var(--fundo-superficie)",
          border: "1px solid var(--borda-suave)",
          borderRadius: "var(--raio-borda)",
          marginBottom: "1.5rem"
        }}
      >
        {/* Campo de Busca */}
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "0.875rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--texto-mutado)",
              pointerEvents: "none"
            }}
          />
          <input
            type="text"
            className="input-texto"
            placeholder="Buscar por descrição do produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            data-testid="campo-busca-estoque"
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>

        {/* Filtro de Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <SlidersHorizontal size={16} color="var(--texto-mutado)" />
          <select
            className="select-filtro"
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value as any)}
            data-testid="filtro-status-estoque"
            style={{ minWidth: "180px" }}
          >
            <option value="todos">Todos os status</option>
            <option value="normal">Estoque Normal</option>
            <option value="baixo">Estoque Baixo (≤ 5)</option>
            <option value="sem_estoque">Sem Estoque (0)</option>
          </select>
        </div>
      </div>

      {/* Tabela de Dados */}
      {carregando ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "4rem 1rem",
            gap: "1rem",
            color: "var(--texto-mutado)"
          }}
          data-testid="carregando-estoque"
        >
          <Loader2 size={32} className="animacao-girar" />
          <span style={{ fontSize: "0.9375rem" }}>Carregando dados de estoque...</span>
        </div>
      ) : produtos.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 1rem",
            backgroundColor: "var(--fundo-superficie)",
            border: "1px solid var(--borda-suave)",
            borderRadius: "var(--raio-borda)",
            color: "var(--texto-mutado)"
          }}
          data-testid="estado-vazio-estoque"
        >
          <Package size={44} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
          <h3 style={{ fontSize: "1.125rem", color: "var(--texto-titulo)", marginBottom: "0.25rem" }}>
            Nenhum produto encontrado
          </h3>
          <p style={{ fontSize: "0.875rem" }}>
            Nenhum item corresponde aos filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="tabela-container">
          <table className="tabela-dados" data-testid="tabela-estoque">
            <thead>
              <tr>
                <th>Produto</th>
                <th style={{ textAlign: "center" }}>Quantidade em Estoque</th>
                <th style={{ textAlign: "center" }}>Nível de Estoque</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((item) => {
                const statusClasse =
                  item.status === "normal"
                    ? "badge-status-normal"
                    : item.status === "baixo"
                    ? "badge-status-baixo"
                    : "badge-status-sem_estoque";

                const statusTexto =
                  item.status === "normal"
                    ? "Normal"
                    : item.status === "baixo"
                    ? "Estoque Baixo"
                    : "Sem Estoque";

                return (
                  <tr key={item.id} data-testid={`linha-estoque-${item.id}`}>
                    <td style={{ fontWeight: 600, color: "var(--texto-titulo)" }}>
                      {item.descricao}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700, fontSize: "1rem" }}>
                      <span data-testid={`quantidade-estoque-${item.id}`}>
                        {item.quantidade_estoque} un
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`badge-status-estoque ${statusClasse}`}
                        data-testid={`badge-status-${item.id}`}
                      >
                        {statusTexto}
                      </span>
                    </td>
                    <td>
                      <div className="acoes-linha">
                        <button
                          className="botao-acao-icone"
                          title="Ver histórico de movimentações deste produto"
                          onClick={() => abrirHistoricoProduto(item)}
                          data-testid={`botao-historico-${item.id}`}
                        >
                          <History size={16} />
                        </button>
                        <button
                          className="botao-secundario"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", gap: "0.35rem" }}
                          title="Ajustar estoque manualmente"
                          onClick={() => setProdutoParaAjuste(item)}
                          data-testid={`botao-ajustar-${item.id}`}
                        >
                          <ArrowUpDown size={14} />
                          <span>Ajustar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Paginação */}
          <div className="paginacao-container">
            <span className="texto-paginacao">
              Mostrando {produtos.length} de {paginacao.total} produtos
            </span>

            <div className="botoes-paginacao">
              <button
                className="botao-paginacao"
                disabled={paginacao.pagina <= 1 || carregando}
                onClick={() => carregarEstoque(paginacao.pagina - 1)}
                data-testid="botao-pagina-anterior"
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>

              <span className="pagina-atual">
                {paginacao.pagina} / {paginacao.total_paginas || 1}
              </span>

              <button
                className="botao-paginacao"
                disabled={paginacao.pagina >= paginacao.total_paginas || carregando}
                onClick={() => carregarEstoque(paginacao.pagina + 1)}
                data-testid="botao-proxima-pagina"
              >
                <span>Próximo</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Estoque */}
      {produtoParaAjuste && (
        <ModalAjusteEstoque
          produto={produtoParaAjuste}
          aoFechar={() => setProdutoParaAjuste(null)}
          aoSucesso={lidarComSucessoAjuste}
        />
      )}

      {/* Modal de Histórico de Movimentações */}
      {historicoModalAberto && (
        <ModalHistoricoMovimentacoes
          produtoId={produtoHistorico.id}
          produtoDescricao={produtoHistorico.descricao}
          aoFechar={() => setHistoricoModalAberto(false)}
        />
      )}
    </div>
  );
};
