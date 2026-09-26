import React, { useState, useEffect } from "react";
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, Trash2, Edit } from "lucide-react";
import { servicoFinanceiro } from "../../servicos/financeiro";
import { LancamentoFinanceiro, ResumoFinanceiro } from "../../tipos/financeiro";
import { ModalLancamentoFinanceiro } from "./ModalLancamentoFinanceiro";

export const TelaFinanceiro: React.FC = () => {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro>({ total_entradas: 0, total_saidas: 0, saldo_atual: 0 });
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [lancamentoEditando, setLancamentoEditando] = useState<LancamentoFinanceiro | undefined>(undefined);
  
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState<"ENTRADA" | "SAIDA" | "TODOS">("TODOS");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const resposta = await servicoFinanceiro.listar({
        pagina,
        limite: 20,
        tipo: filtroTipo !== "TODOS" ? filtroTipo : undefined,
        categoria: filtroCategoria || undefined
      });
      setLancamentos(resposta.dados);
      setResumo(resposta.resumo);
      setTotalPaginas(resposta.paginacao.total_paginas);
    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [pagina, filtroTipo, filtroCategoria]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
  };

  const formatarData = (dataStr: string) => {
    return new Date(dataStr).toLocaleDateString("pt-BR");
  };

  const lidarComExclusao = async (id: number) => {
    if (window.confirm("Deseja realmente excluir este lançamento?")) {
      try {
        await servicoFinanceiro.excluir(id);
        carregarDados();
      } catch (error: any) {
        alert(error.response?.data?.mensagem || "Erro ao excluir");
      }
    }
  };

  return (
    <div className="pagina-container">
      <header className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Controle Financeiro</h1>
          <p className="subtitulo-pagina">Acompanhe as entradas e saídas financeiras.</p>
        </div>
        <button className="botao-acao" onClick={() => { setLancamentoEditando(undefined); setModalAberto(true); }}>
          <Plus size={16} />
          Novo Lançamento
        </button>
      </header>

      {/* Cards de Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', backgroundColor: 'var(--cor-fundo-card)', borderRadius: '8px', border: '1px solid var(--cor-borda)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--cor-texto-secundario)' }}>Total de Entradas</h3>
            <TrendingUp size={20} color="var(--cor-sucesso)" />
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--cor-sucesso)' }}>
            {formatarMoeda(resumo.total_entradas)}
          </p>
        </div>
        
        <div style={{ padding: '20px', backgroundColor: 'var(--cor-fundo-card)', borderRadius: '8px', border: '1px solid var(--cor-borda)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--cor-texto-secundario)' }}>Total de Saídas</h3>
            <TrendingDown size={20} color="var(--cor-erro)" />
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--cor-erro)' }}>
            {formatarMoeda(resumo.total_saidas)}
          </p>
        </div>

        <div style={{ padding: '20px', backgroundColor: 'var(--cor-fundo-card)', borderRadius: '8px', border: '1px solid var(--cor-borda)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--cor-texto-secundario)' }}>Saldo Atual</h3>
            <DollarSign size={20} color="var(--cor-primaria)" />
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: resumo.saldo_atual >= 0 ? 'var(--cor-sucesso)' : 'var(--cor-erro)' }}>
            {formatarMoeda(resumo.saldo_atual)}
          </p>
        </div>
      </div>

      <div className="barra-filtros">
        <div className="campo-busca">
          <Search size={16} />
          <input
            type="text"
            placeholder="Filtrar por categoria..."
            value={filtroCategoria}
            onChange={(e) => {
              setFiltroCategoria(e.target.value);
              setPagina(1);
            }}
          />
        </div>
        <div className="filtros-acoes">
          <select
            value={filtroTipo}
            onChange={(e) => {
              setFiltroTipo(e.target.value as any);
              setPagina(1);
            }}
            className="seletor-padrao"
          >
            <option value="TODOS">Todos os Tipos</option>
            <option value="ENTRADA">Apenas Entradas</option>
            <option value="SAIDA">Apenas Saídas</option>
          </select>
        </div>
      </div>

      <div className="container-tabela">
        <table className="tabela-dados">
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
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                  Carregando...
                </td>
              </tr>
            ) : lancamentos.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            ) : (
              lancamentos.map((lanc) => (
                <tr key={lanc.id}>
                  <td>{formatarData(lanc.data_lancamento)}</td>
                  <td>{lanc.descricao}</td>
                  <td>{lanc.categoria}</td>
                  <td>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor: lanc.tipo === "ENTRADA" ? "rgba(40, 167, 69, 0.2)" : "rgba(220, 53, 69, 0.2)",
                        color: lanc.tipo === "ENTRADA" ? "var(--cor-sucesso)" : "var(--cor-erro)"
                      }}
                    >
                      {lanc.tipo}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: "var(--cor-texto-secundario)", border: "1px solid var(--cor-borda)", padding: "2px 6px", borderRadius: "4px" }}>
                      {lanc.tipo_referencia || "MANUAL"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    {formatarMoeda(lanc.valor)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className="acoes-linha" style={{ justifyContent: "center" }}>
                      {(!lanc.tipo_referencia || lanc.tipo_referencia === "MANUAL") && (
                        <>
                          <button
                            className="botao-icone"
                            title="Editar"
                            onClick={() => {
                              setLancamentoEditando(lanc);
                              setModalAberto(true);
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="botao-icone erro"
                            title="Excluir"
                            onClick={() => lidarComExclusao(lanc.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="paginacao">
          <button
            disabled={pagina === 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
          >
            Anterior
          </button>
          <span>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            disabled={pagina === totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          >
            Próxima
          </button>
        </div>
      )}

      {modalAberto && (
        <ModalLancamentoFinanceiro
          aoFechar={() => {
            setModalAberto(false);
            setLancamentoEditando(undefined);
          }}
          aoSalvar={() => {
            setModalAberto(false);
            setLancamentoEditando(undefined);
            carregarDados();
          }}
          lancamentoParaEditar={lancamentoEditando}
        />
      )}
    </div>
  );
};
