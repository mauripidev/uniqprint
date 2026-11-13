import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Filter,
  RotateCcw,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  User,
  Clock,
  Tag,
  Database,
  Activity
} from "lucide-react";
import { listarAuditoria, buscarAuditoriaPorId } from "../../servicos/auditoria.js";
import { RegistroAuditoria, FiltrosAuditoria } from "../../tipos/auditoria.js";

const ACOES_DISPONIVEIS = [
  "LOGIN",
  "CRIAR_PRODUTO",
  "ATUALIZAR_PRODUTO",
  "CRIAR_COMPRA",
  "CRIAR_VENDA",
  "CRIAR_CLIENTE",
  "ATUALIZAR_CLIENTE",
  "CRIAR_FORNECEDOR",
  "ATUALIZAR_FORNECEDOR",
  "CRIAR_LANCAMENTO",
  "ATUALIZAR_LANCAMENTO",
  "EXCLUIR_LANCAMENTO"
];

const ENTIDADES_DISPONIVEIS = [
  "USUARIO",
  "PRODUTO",
  "COMPRA",
  "VENDA",
  "CLIENTE",
  "FORNECEDOR",
  "LANCAMENTO"
];

const ETIQUETA_ACAO: Record<string, { label: string; cor: string }> = {
  LOGIN: { label: "Login", cor: "badge-info" },
  CRIAR_PRODUTO: { label: "Criar Produto", cor: "badge-sucesso" },
  ATUALIZAR_PRODUTO: { label: "Atualizar Produto", cor: "badge-aviso" },
  CRIAR_COMPRA: { label: "Criar Compra", cor: "badge-sucesso" },
  CRIAR_VENDA: { label: "Criar Venda", cor: "badge-sucesso" },
  CRIAR_CLIENTE: { label: "Criar Cliente", cor: "badge-sucesso" },
  ATUALIZAR_CLIENTE: { label: "Atualizar Cliente", cor: "badge-aviso" },
  CRIAR_FORNECEDOR: { label: "Criar Fornecedor", cor: "badge-sucesso" },
  ATUALIZAR_FORNECEDOR: { label: "Atualizar Fornecedor", cor: "badge-aviso" },
  CRIAR_LANCAMENTO: { label: "Criar Lançamento", cor: "badge-sucesso" },
  ATUALIZAR_LANCAMENTO: { label: "Atualizar Lançamento", cor: "badge-aviso" },
  EXCLUIR_LANCAMENTO: { label: "Excluir Lançamento", cor: "badge-perigo" }
};

function formatarDataHora(dataStr: string): string {
  try {
    return new Date(dataStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch {
    return dataStr;
  }
}

function etiquetaAcao(acao: string) {
  const config = ETIQUETA_ACAO[acao] ?? { label: acao, cor: "badge-neutro" };
  return <span className={`badge-auditoria ${config.cor}`}>{config.label}</span>;
}

interface ModalDetalhesProps {
  registro: RegistroAuditoria;
  onFechar: () => void;
}

const ModalDetalhes: React.FC<ModalDetalhesProps> = ({ registro, onFechar }) => {
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-auditoria"
      data-testid="modal-detalhes-auditoria"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="modal-conteudo modal-auditoria-detalhe">
        <div className="modal-cabecalho">
          <h2 id="titulo-modal-auditoria" className="modal-titulo">
            <ShieldCheck size={20} />
            Detalhes do Registro de Auditoria #{registro.id}
          </h2>
          <button
            onClick={onFechar}
            className="botao-fechar-modal"
            aria-label="Fechar modal"
            data-testid="botao-fechar-modal-auditoria"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-corpo">
          <div className="grade-info-auditoria">
            <div className="info-auditoria-item">
              <span className="info-auditoria-label">
                <Clock size={14} /> Data/Hora
              </span>
              <span className="info-auditoria-valor" data-testid="detalhe-data">
                {formatarDataHora(registro.criado_em)}
              </span>
            </div>

            <div className="info-auditoria-item">
              <span className="info-auditoria-label">
                <Activity size={14} /> Ação
              </span>
              <span className="info-auditoria-valor" data-testid="detalhe-acao">
                {etiquetaAcao(registro.acao)}
              </span>
            </div>

            <div className="info-auditoria-item">
              <span className="info-auditoria-label">
                <Tag size={14} /> Entidade
              </span>
              <span className="info-auditoria-valor" data-testid="detalhe-entidade">
                {registro.entidade}
                {registro.entidade_id && (
                  <span className="id-entidade"> (ID: {registro.entidade_id})</span>
                )}
              </span>
            </div>

            <div className="info-auditoria-item">
              <span className="info-auditoria-label">
                <User size={14} /> Usuário
              </span>
              <span className="info-auditoria-valor" data-testid="detalhe-usuario">
                {registro.usuario ? (
                  <>
                    {registro.usuario.nome}{" "}
                    <span className="email-usuario">({registro.usuario.email})</span>
                  </>
                ) : (
                  <span className="sem-usuario">Sistema / Anônimo</span>
                )}
              </span>
            </div>
          </div>

          {registro.dados && Object.keys(registro.dados).length > 0 && (
            <div className="secao-dados-auditoria">
              <h3 className="titulo-dados-auditoria">
                <Database size={16} /> Dados Registrados
              </h3>
              <pre
                className="pre-dados-auditoria"
                data-testid="detalhe-dados-json"
              >
                {JSON.stringify(registro.dados, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TelaAuditoria: React.FC = () => {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const limite = 20;

  // Filtros
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [acaoFiltro, setAcaoFiltro] = useState("");
  const [entidadeFiltro, setEntidadeFiltro] = useState("");
  const [usuarioIdFiltro, setUsuarioIdFiltro] = useState("");

  // Modal de detalhes
  const [registroSelecionado, setRegistroSelecionado] = useState<RegistroAuditoria | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  const carregarRegistros = useCallback(
    async (paginaAlvo: number = 1) => {
      setCarregando(true);
      setErro(null);

      const filtros: FiltrosAuditoria = {
        pagina: paginaAlvo,
        limite
      };

      if (dataInicio) filtros.data_inicio = dataInicio;
      if (dataFim) filtros.data_fim = dataFim;
      if (acaoFiltro) filtros.acao = acaoFiltro;
      if (entidadeFiltro) filtros.entidade = entidadeFiltro;
      if (usuarioIdFiltro) filtros.usuario_id = parseInt(usuarioIdFiltro, 10);

      try {
        const resposta = await listarAuditoria(filtros);
        setRegistros(resposta.dados);
        setTotalPaginas(resposta.paginacao.total_paginas);
        setTotalRegistros(resposta.paginacao.total);
        setPagina(paginaAlvo);
      } catch (err: any) {
        setErro(
          err.message ||
            err.response?.data?.erro?.mensagem ||
            "Não foi possível carregar os registros de auditoria."
        );
      } finally {
        setCarregando(false);
      }
    },
    [dataInicio, dataFim, acaoFiltro, entidadeFiltro, usuarioIdFiltro, limite]
  );

  useEffect(() => {
    carregarRegistros(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lidarComSubmissaoFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
    carregarRegistros(1);
  };

  const limparFiltros = () => {
    setDataInicio("");
    setDataFim("");
    setAcaoFiltro("");
    setEntidadeFiltro("");
    setUsuarioIdFiltro("");
    setPagina(1);
    // recarregar sem filtros
    setTimeout(() => carregarRegistros(1), 0);
  };

  const abrirDetalhes = async (id: number) => {
    setCarregandoDetalhe(true);
    try {
      const resposta = await buscarAuditoriaPorId(id);
      setRegistroSelecionado(resposta.dados);
    } catch {
      // fallback: usar dados já carregados
      const local = registros.find((r) => r.id === id);
      if (local) setRegistroSelecionado(local);
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  return (
    <div className="pagina-auditoria" data-testid="pagina-auditoria">
      {/* Cabeçalho */}
      <div className="cabecalho-pagina">
        <div className="titulo-secao">
          <div className="icone-titulo">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1>Auditoria do Sistema</h1>
            <p className="descricao-secao">
              Rastreamento de ações realizadas pelos usuários no sistema
            </p>
          </div>
        </div>

        {totalRegistros > 0 && (
          <div className="badge-total-auditoria" data-testid="contador-total-registros">
            {totalRegistros} registro{totalRegistros !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Alerta de erro */}
      {erro && (
        <div className="alerta-erro" role="alert" style={{ marginBottom: "1.5rem" }}>
          <span>{erro}</span>
        </div>
      )}

      {/* Painel de filtros */}
      <form
        onSubmit={lidarComSubmissaoFiltros}
        className="painel-filtros-relatorio"
        data-testid="formulario-filtros-auditoria"
      >
        <div className="linha-filtros-relatorio" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div className="grupo-filtro-item">
            <label htmlFor="filtro-data-inicio">Data Início</label>
            <input
              id="filtro-data-inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="input-filtro"
              data-testid="input-data-inicio"
            />
          </div>

          <div className="grupo-filtro-item">
            <label htmlFor="filtro-data-fim">Data Fim</label>
            <input
              id="filtro-data-fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="input-filtro"
              data-testid="input-data-fim"
            />
          </div>

          <div className="grupo-filtro-item">
            <label htmlFor="filtro-acao">Ação</label>
            <select
              id="filtro-acao"
              value={acaoFiltro}
              onChange={(e) => setAcaoFiltro(e.target.value)}
              className="select-filtro"
              data-testid="select-acao"
            >
              <option value="">Todas as Ações</option>
              {ACOES_DISPONIVEIS.map((a) => (
                <option key={a} value={a}>
                  {ETIQUETA_ACAO[a]?.label ?? a}
                </option>
              ))}
            </select>
          </div>

          <div className="grupo-filtro-item">
            <label htmlFor="filtro-entidade">Entidade</label>
            <select
              id="filtro-entidade"
              value={entidadeFiltro}
              onChange={(e) => setEntidadeFiltro(e.target.value)}
              className="select-filtro"
              data-testid="select-entidade"
            >
              <option value="">Todas as Entidades</option>
              {ENTIDADES_DISPONIVEIS.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          <div className="grupo-filtro-item">
            <label htmlFor="filtro-usuario-id">ID do Usuário</label>
            <input
              id="filtro-usuario-id"
              type="number"
              min="1"
              placeholder="Ex: 1"
              value={usuarioIdFiltro}
              onChange={(e) => setUsuarioIdFiltro(e.target.value)}
              className="input-filtro"
              data-testid="input-usuario-id"
            />
          </div>

          <div className="acoes-filtros-relatorio">
            <button
              type="submit"
              className="botao-primario"
              disabled={carregando}
              data-testid="botao-aplicar-filtros"
            >
              <Filter size={16} />
              <span>{carregando ? "Carregando..." : "Filtrar"}</span>
            </button>

            <button
              type="button"
              onClick={limparFiltros}
              className="botao-secundario"
              title="Limpar filtros"
              data-testid="botao-limpar-filtros"
            >
              <RotateCcw size={16} />
              <span>Limpar</span>
            </button>
          </div>
        </div>
      </form>

      {/* Tabela */}
      <div className="tabela-conteiner">
        <table className="tabela" data-testid="tabela-auditoria">
          <thead>
            <tr>
              <th>#ID</th>
              <th>Data / Hora</th>
              <th>Usuário</th>
              <th>Ação</th>
              <th>Entidade</th>
              <th>ID Entidade</th>
              <th style={{ textAlign: "center" }}>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={7} className="conteiner-carregando-tabela">
                  <span>Carregando registros de auditoria...</span>
                </td>
              </tr>
            ) : registros.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="estado-vazio" data-testid="estado-vazio-auditoria">
                    <Inbox size={48} />
                    <h3>Nenhum registro encontrado</h3>
                    <p>Não há registros de auditoria para os filtros selecionados.</p>
                  </div>
                </td>
              </tr>
            ) : (
              registros.map((r) => (
                <tr key={r.id} data-testid={`linha-auditoria-${r.id}`}>
                  <td>
                    <span className="id-registro">#{r.id}</span>
                  </td>
                  <td className="coluna-data-auditoria">{formatarDataHora(r.criado_em)}</td>
                  <td>
                    {r.usuario ? (
                      <span className="nome-usuario-auditoria">{r.usuario.nome}</span>
                    ) : (
                      <span className="sem-usuario">Sistema</span>
                    )}
                  </td>
                  <td>{etiquetaAcao(r.acao)}</td>
                  <td>
                    <span className="entidade-auditoria">{r.entidade}</span>
                  </td>
                  <td>{r.entidade_id ?? "—"}</td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => abrirDetalhes(r.id)}
                      className="botao-acao-tabela botao-visualizar"
                      title="Ver detalhes"
                      aria-label={`Ver detalhes do registro ${r.id}`}
                      data-testid={`botao-detalhe-${r.id}`}
                      disabled={carregandoDetalhe}
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="paginacao-rodape" data-testid="paginacao-auditoria">
            <span className="info-paginacao">
              Página {pagina} de {totalPaginas} ({totalRegistros} registros)
            </span>
            <div className="botoes-paginacao">
              <button
                onClick={() => carregarRegistros(pagina - 1)}
                disabled={pagina <= 1 || carregando}
                className="botao-paginacao"
                data-testid="botao-pagina-anterior"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <span className="numero-pagina">{pagina}</span>
              <button
                onClick={() => carregarRegistros(pagina + 1)}
                disabled={pagina >= totalPaginas || carregando}
                className="botao-paginacao"
                data-testid="botao-proxima-pagina"
              >
                Próxima
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {registroSelecionado && (
        <ModalDetalhes
          registro={registroSelecionado}
          onFechar={() => setRegistroSelecionado(null)}
        />
      )}
    </div>
  );
};
