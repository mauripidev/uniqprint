import React, { useEffect, useState, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  PowerOff,
  Search,
  Truck
} from "lucide-react";
import { ModalConfirmacao } from "../../componentes/ModalConfirmacao.js";
import { inativarFornecedor, listarFornecedores } from "../../servicos/fornecedores.js";
import { Fornecedor, PaginacaoInfo } from "../../tipos/fornecedores.js";
import { ModalFormularioFornecedor } from "./ModalFormularioFornecedor.js";

export const TelaFornecedores: React.FC = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
    pagina: 1,
    limite: 10,
    total: 0,
    total_paginas: 1
  });
  const [busca, setBusca] = useState<string>("");
  const [filtroAtivo, setFiltroAtivo] = useState<"todos" | "true" | "false">("todos");
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Estados dos modais
  const [modalFormAberto, setModalFormAberto] = useState<boolean>(false);
  const [fornecedorEmEdicao, setFornecedorEmEdicao] = useState<Fornecedor | null>(null);
  const [modalInativarAberto, setModalInativarAberto] = useState<boolean>(false);
  const [fornecedorParaInativar, setFornecedorParaInativar] = useState<Fornecedor | null>(null);

  const carregarFornecedores = useCallback(
    async (pagina = 1) => {
      setCarregando(true);
      setErro(null);
      try {
        const resposta = await listarFornecedores({
          pagina,
          limite: 10,
          busca: busca.trim() || undefined,
          ativo: filtroAtivo
        });
        setFornecedores(resposta.dados);
        setPaginacao(resposta.paginacao);
      } catch (err: any) {
        setErro(err.message || "Erro ao carregar lista de fornecedores");
      } finally {
        setCarregando(false);
      }
    },
    [busca, filtroAtivo]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarFornecedores(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [carregarFornecedores]);

  const abrirModalNovo = () => {
    setFornecedorEmEdicao(null);
    setModalFormAberto(true);
  };

  const abrirModalEdicao = (fornecedor: Fornecedor) => {
    setFornecedorEmEdicao(fornecedor);
    setModalFormAberto(true);
  };

  const abrirModalInativacao = (fornecedor: Fornecedor) => {
    setFornecedorParaInativar(fornecedor);
    setModalInativarAberto(true);
  };

  const confirmarInativacao = async () => {
    if (!fornecedorParaInativar) return;
    try {
      await inativarFornecedor(fornecedorParaInativar.id);
      setMensagemSucesso(`Fornecedor "${fornecedorParaInativar.nome}" inativado com sucesso.`);
      setModalInativarAberto(false);
      setFornecedorParaInativar(null);
      carregarFornecedores(paginacao.pagina);
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err: any) {
      setErro(err.message || "Erro ao inativar o fornecedor");
    }
  };

  const lidarComSucessoFormulario = () => {
    setModalFormAberto(false);
    setMensagemSucesso(
      fornecedorEmEdicao
        ? "Fornecedor atualizado com sucesso!"
        : "Novo fornecedor cadastrado com sucesso!"
    );
    carregarFornecedores(paginacao.pagina);
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Cadastro de Fornecedores</h1>
          <p className="subtitulo-pagina">
            Gerencie os parceiros e fornecedores de insumos da empresa.
          </p>
        </div>

        <button
          type="button"
          className="botao-primario"
          style={{ width: "auto", marginTop: 0 }}
          onClick={abrirModalNovo}
          data-testid="botao-novo-fornecedor"
        >
          <Plus size={18} />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      {mensagemSucesso && (
        <div className="alerta-sucesso" role="alert">
          <CheckCircle size={18} />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {erro && (
        <div className="alerta-erro-geral" style={{ marginBottom: "1rem" }} role="alert">
          <AlertCircle size={18} />
          <span>{erro}</span>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="barra-ferramentas">
        <div className="campo-pesquisa-conteiner">
          <Search size={18} className="icone-pesquisa" />
          <input
            type="text"
            className="input-pesquisa"
            placeholder="Pesquisar fornecedor por nome ou observação..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            data-testid="input-pesquisa-fornecedor"
          />
        </div>

        <div className="filtro-status-conteiner">
          <label htmlFor="filtroStatusFornecedor" className="rotulo-filtro">
            Status:
          </label>
          <select
            id="filtroStatusFornecedor"
            className="select-filtro"
            value={filtroAtivo}
            onChange={(e) =>
              setFiltroAtivo(e.target.value as "todos" | "true" | "false")
            }
          >
            <option value="todos">Todos</option>
            <option value="true">Apenas Ativos</option>
            <option value="false">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Tabela de Fornecedores */}
      <div className="tabela-conteiner">
        {carregando ? (
          <div className="conteiner-carregando-tabela" data-testid="carregando-tabela">
            <div className="spinner" />
            <p>Carregando fornecedores...</p>
          </div>
        ) : fornecedores.length === 0 ? (
          <div className="estado-vazio" data-testid="estado-vazio-fornecedores">
            <Truck size={48} color="var(--texto-fraco)" />
            <h3>Nenhum fornecedor encontrado</h3>
            <p>
              {busca
                ? "Tente refinar sua busca por outro termo."
                : "Clique em 'Novo Fornecedor' para cadastrar o primeiro parceiro comercial."}
            </p>
          </div>
        ) : (
          <table className="tabela-dados" data-testid="tabela-fornecedores">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>ID</th>
                <th>Nome / Razão Social</th>
                <th>Observações</th>
                <th style={{ width: "120px", textAlign: "center" }}>Status</th>
                <th style={{ width: "160px" }}>Cadastrado em</th>
                <th style={{ width: "120px", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((fornecedor) => (
                <tr key={fornecedor.id} data-testid={`linha-fornecedor-${fornecedor.id}`}>
                  <td className="coluna-id">#{fornecedor.id}</td>
                  <td className="coluna-destaque">{fornecedor.nome}</td>
                  <td style={{ color: "var(--texto-mutado)", fontSize: "0.875rem" }}>
                    {fornecedor.observacao || "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className={`badge-status ${
                        fornecedor.ativo ? "status-ativo" : "status-inativo"
                      }`}
                    >
                      {fornecedor.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ color: "var(--texto-mutado)", fontSize: "0.8125rem" }}>
                    {new Date(fornecedor.criado_em).toLocaleDateString("pt-BR")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="acoes-linha">
                      <button
                        type="button"
                        className="botao-acao-icone"
                        title="Editar Fornecedor"
                        onClick={() => abrirModalEdicao(fornecedor)}
                        data-testid={`botao-editar-${fornecedor.id}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      {fornecedor.ativo && (
                        <button
                          type="button"
                          className="botao-acao-icone botao-inativar"
                          title="Inativar Fornecedor"
                          onClick={() => abrirModalInativacao(fornecedor)}
                          data-testid={`botao-inativar-${fornecedor.id}`}
                        >
                          <PowerOff size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Paginação */}
        {!carregando && fornecedores.length > 0 && (
          <div className="paginacao-rodape">
            <span className="info-paginacao">
              Mostrando {fornecedores.length} de {paginacao.total} fornecedores
            </span>
            <div className="botoes-paginacao">
              <button
                type="button"
                className="botao-paginacao"
                disabled={paginacao.pagina <= 1}
                onClick={() => carregarFornecedores(paginacao.pagina - 1)}
                data-testid="paginacao-anterior"
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>
              <span className="numero-pagina">
                Página {paginacao.pagina} de {paginacao.total_paginas}
              </span>
              <button
                type="button"
                className="botao-paginacao"
                disabled={paginacao.pagina >= paginacao.total_paginas}
                onClick={() => carregarFornecedores(paginacao.pagina + 1)}
                data-testid="paginacao-proxima"
              >
                <span>Próxima</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação e Edição */}
      <ModalFormularioFornecedor
        aberto={modalFormAberto}
        fornecedorParaEdicao={fornecedorEmEdicao}
        aoFechar={() => setModalFormAberto(false)}
        aoSalvarComSucesso={lidarComSucessoFormulario}
      />

      {/* Modal de Confirmação de Inativação */}
      <ModalConfirmacao
        aberto={modalInativarAberto}
        titulo="Inativar Fornecedor"
        mensagem={`Deseja realmente inativar o fornecedor "${fornecedorParaInativar?.nome}"? Ele não poderá mais ser selecionado para novos lançamentos de compras.`}
        textoConfirmar="Sim, Inativar"
        variante="perigo"
        aoFechar={() => {
          setModalInativarAberto(false);
          setFornecedorParaInativar(null);
        }}
        aoConfirmar={confirmarInativacao}
      />
    </div>
  );
};
