import React, { useEffect, useState, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Package,
  Plus,
  PowerOff,
  Search
} from "lucide-react";
import { ModalConfirmacao } from "../../componentes/ModalConfirmacao.js";
import { inativarProduto, listarProdutos } from "../../servicos/produtos.js";
import { PaginacaoInfo, Produto } from "../../tipos/produtos.js";
import { ModalFormularioProduto } from "./ModalFormularioProduto.js";

export const TelaProdutos: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
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
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<Produto | null>(null);
  const [modalInativarAberto, setModalInativarAberto] = useState<boolean>(false);
  const [produtoParaInativar, setProdutoParaInativar] = useState<Produto | null>(null);

  const carregarProdutos = useCallback(
    async (pagina = 1) => {
      setCarregando(true);
      setErro(null);
      try {
        const resposta = await listarProdutos({
          pagina,
          limite: 10,
          busca: busca.trim() || undefined,
          ativo: filtroAtivo
        });
        setProdutos(resposta.dados);
        setPaginacao(resposta.paginacao);
      } catch (err: any) {
        setErro(err.message || "Erro ao carregar lista de produtos");
      } finally {
        setCarregando(false);
      }
    },
    [busca, filtroAtivo]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarProdutos(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [carregarProdutos]);

  const abrirModalNovo = () => {
    setProdutoEmEdicao(null);
    setModalFormAberto(true);
  };

  const abrirModalEdicao = (produto: Produto) => {
    setProdutoEmEdicao(produto);
    setModalFormAberto(true);
  };

  const abrirModalInativacao = (produto: Produto) => {
    setProdutoParaInativar(produto);
    setModalInativarAberto(true);
  };

  const confirmarInativacao = async () => {
    if (!produtoParaInativar) return;
    try {
      await inativarProduto(produtoParaInativar.id);
      setMensagemSucesso(`Produto "${produtoParaInativar.descricao}" inativado com sucesso.`);
      setModalInativarAberto(false);
      setProdutoParaInativar(null);
      carregarProdutos(paginacao.pagina);
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err: any) {
      setErro(err.message || "Erro ao inativar o produto");
    }
  };

  const lidarComSucessoFormulario = () => {
    setModalFormAberto(false);
    setMensagemSucesso(
      produtoEmEdicao
        ? "Produto atualizado com sucesso!"
        : "Novo produto cadastrado com sucesso!"
    );
    carregarProdutos(paginacao.pagina);
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Cadastro de Produtos</h1>
          <p className="subtitulo-pagina">
            Gerencie os itens disponíveis no catálogo e controle seus estoques.
          </p>
        </div>

        <button
          type="button"
          className="botao-primario"
          style={{ width: "auto", marginTop: 0 }}
          onClick={abrirModalNovo}
          data-testid="botao-novo-produto"
        >
          <Plus size={18} />
          <span>Novo Produto</span>
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
            placeholder="Pesquisar produto por descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            data-testid="input-pesquisa-produto"
          />
        </div>

        <div className="filtro-status-conteiner">
          <label htmlFor="filtroStatus" className="rotulo-filtro">
            Status:
          </label>
          <select
            id="filtroStatus"
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

      {/* Tabela de Produtos */}
      <div className="tabela-conteiner">
        {carregando ? (
          <div className="conteiner-carregando-tabela" data-testid="carregando-tabela">
            <div className="spinner" />
            <p>Carregando produtos...</p>
          </div>
        ) : produtos.length === 0 ? (
          <div className="estado-vazio" data-testid="estado-vazio-produtos">
            <Package size={48} color="var(--texto-fraco)" />
            <h3>Nenhum produto encontrado</h3>
            <p>
              {busca
                ? "Tente refinar sua busca por outro termo."
                : "Clique em 'Novo Produto' para cadastrar o primeiro item do catálogo."}
            </p>
          </div>
        ) : (
          <table className="tabela-dados" data-testid="tabela-produtos">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>ID</th>
                <th>Descrição</th>
                <th style={{ width: "140px", textAlign: "center" }}>Estoque</th>
                <th style={{ width: "120px", textAlign: "center" }}>Status</th>
                <th style={{ width: "160px" }}>Cadastrado em</th>
                <th style={{ width: "120px", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id} data-testid={`linha-produto-${produto.id}`}>
                  <td className="coluna-id">#{produto.id}</td>
                  <td className="coluna-destaque">{produto.descricao}</td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className={`badge-estoque ${
                        produto.quantidade_estoque > 0
                          ? "estoque-positivo"
                          : "estoque-zerado"
                      }`}
                    >
                      {produto.quantidade_estoque} un
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className={`badge-status ${
                        produto.ativo ? "status-ativo" : "status-inativo"
                      }`}
                    >
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ color: "var(--texto-mutado)", fontSize: "0.8125rem" }}>
                    {new Date(produto.criado_em).toLocaleDateString("pt-BR")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="acoes-linha">
                      <button
                        type="button"
                        className="botao-acao-icone"
                        title="Editar Produto"
                        onClick={() => abrirModalEdicao(produto)}
                        data-testid={`botao-editar-${produto.id}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      {produto.ativo && (
                        <button
                          type="button"
                          className="botao-acao-icone botao-inativar"
                          title="Inativar Produto"
                          onClick={() => abrirModalInativacao(produto)}
                          data-testid={`botao-inativar-${produto.id}`}
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
        {!carregando && produtos.length > 0 && (
          <div className="paginacao-rodape">
            <span className="info-paginacao">
              Mostrando {produtos.length} de {paginacao.total} produtos
            </span>
            <div className="botoes-paginacao">
              <button
                type="button"
                className="botao-paginacao"
                disabled={paginacao.pagina <= 1}
                onClick={() => carregarProdutos(paginacao.pagina - 1)}
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
                onClick={() => carregarProdutos(paginacao.pagina + 1)}
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
      <ModalFormularioProduto
        aberto={modalFormAberto}
        produtoParaEdicao={produtoEmEdicao}
        aoFechar={() => setModalFormAberto(false)}
        aoSalvarComSucesso={lidarComSucessoFormulario}
      />

      {/* Modal de Confirmação de Inativação */}
      <ModalConfirmacao
        aberto={modalInativarAberto}
        titulo="Inativar Produto"
        mensagem={`Deseja realmente inativar o produto "${produtoParaInativar?.descricao}"? Ele não poderá mais ser selecionado em novas operações comerciais.`}
        textoConfirmar="Sim, Inativar"
        variante="perigo"
        aoFechar={() => {
          setModalInativarAberto(false);
          setProdutoParaInativar(null);
        }}
        aoConfirmar={confirmarInativacao}
      />
    </div>
  );
};
