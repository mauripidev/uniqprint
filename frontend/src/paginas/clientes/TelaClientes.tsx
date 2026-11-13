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
  Users
} from "lucide-react";
import { ModalConfirmacao } from "../../componentes/ModalConfirmacao.js";
import { inativarCliente, listarClientes } from "../../servicos/clientes.js";
import { Cliente, PaginacaoInfo } from "../../tipos/clientes.js";
import { ModalFormularioCliente } from "./ModalFormularioCliente.js";

export const TelaClientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
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
  const [clienteEmEdicao, setClienteEmEdicao] = useState<Cliente | null>(null);
  const [modalInativarAberto, setModalInativarAberto] = useState<boolean>(false);
  const [clienteParaInativar, setClienteParaInativar] = useState<Cliente | null>(null);

  const carregarClientes = useCallback(
    async (pagina = 1) => {
      setCarregando(true);
      setErro(null);
      try {
        const resposta = await listarClientes({
          pagina,
          limite: 10,
          busca: busca.trim() || undefined,
          ativo: filtroAtivo
        });
        setClientes(resposta.dados);
        setPaginacao(resposta.paginacao);
      } catch (err: any) {
        setErro(err.message || "Erro ao carregar lista de clientes");
      } finally {
        setCarregando(false);
      }
    },
    [busca, filtroAtivo]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarClientes(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [carregarClientes]);

  const abrirModalNovo = () => {
    setClienteEmEdicao(null);
    setModalFormAberto(true);
  };

  const abrirModalEdicao = (cliente: Cliente) => {
    setClienteEmEdicao(cliente);
    setModalFormAberto(true);
  };

  const abrirModalInativacao = (cliente: Cliente) => {
    setClienteParaInativar(cliente);
    setModalInativarAberto(true);
  };

  const confirmarInativacao = async () => {
    if (!clienteParaInativar) return;
    try {
      await inativarCliente(clienteParaInativar.id);
      setMensagemSucesso(`Cliente "${clienteParaInativar.nome}" inativado com sucesso.`);
      setModalInativarAberto(false);
      setClienteParaInativar(null);
      carregarClientes(paginacao.pagina);
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err: any) {
      setErro(err.message || "Erro ao inativar o cliente");
    }
  };

  const lidarComSucessoFormulario = () => {
    setModalFormAberto(false);
    setMensagemSucesso(
      clienteEmEdicao
        ? "Cliente atualizado com sucesso!"
        : "Novo cliente cadastrado com sucesso!"
    );
    carregarClientes(paginacao.pagina);
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Cadastro de Clientes</h1>
          <p className="subtitulo-pagina">
            Gerencie a base de clientes e parceiros comerciais da empresa.
          </p>
        </div>

        <button
          type="button"
          className="botao-primario"
          style={{ width: "auto", marginTop: 0 }}
          onClick={abrirModalNovo}
          data-testid="botao-novo-cliente"
        >
          <Plus size={18} />
          <span>Novo Cliente</span>
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
            placeholder="Pesquisar cliente por nome, telefone ou observação..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            data-testid="input-pesquisa-cliente"
          />
        </div>

        <div className="filtro-status-conteiner">
          <label htmlFor="filtroStatusCliente" className="rotulo-filtro">
            Status:
          </label>
          <select
            id="filtroStatusCliente"
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

      {/* Tabela de Clientes */}
      <div className="tabela-conteiner">
        {carregando ? (
          <div className="conteiner-carregando-tabela" data-testid="carregando-tabela">
            <div className="spinner" />
            <p>Carregando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="estado-vazio" data-testid="estado-vazio-clientes">
            <Users size={48} color="var(--texto-fraco)" />
            <h3>Nenhum cliente encontrado</h3>
            <p>
              {busca
                ? "Tente refinar sua busca por outro termo."
                : "Clique em 'Novo Cliente' para cadastrar o primeiro cliente."}
            </p>
          </div>
        ) : (
          <table className="tabela-dados" data-testid="tabela-clientes">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>ID</th>
                <th>Nome / Razão Social</th>
                <th style={{ width: "160px" }}>Telefone</th>
                <th>Observações</th>
                <th style={{ width: "120px", textAlign: "center" }}>Status</th>
                <th style={{ width: "160px" }}>Cadastrado em</th>
                <th style={{ width: "120px", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id} data-testid={`linha-cliente-${cliente.id}`}>
                  <td className="coluna-id">#{cliente.id}</td>
                  <td className="coluna-destaque">{cliente.nome}</td>
                  <td style={{ color: "var(--texto-normal)", fontSize: "0.875rem" }}>
                    {cliente.telefone || "—"}
                  </td>
                  <td style={{ color: "var(--texto-mutado)", fontSize: "0.875rem" }}>
                    {cliente.observacao || "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className={`badge-status ${
                        cliente.ativo ? "status-ativo" : "status-inativo"
                      }`}
                    >
                      {cliente.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ color: "var(--texto-mutado)", fontSize: "0.8125rem" }}>
                    {new Date(cliente.criado_em).toLocaleDateString("pt-BR")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="acoes-linha">
                      <button
                        type="button"
                        className="botao-acao-icone"
                        title="Editar Cliente"
                        onClick={() => abrirModalEdicao(cliente)}
                        data-testid={`botao-editar-${cliente.id}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      {cliente.ativo && (
                        <button
                          type="button"
                          className="botao-acao-icone botao-inativar"
                          title="Inativar Cliente"
                          onClick={() => abrirModalInativacao(cliente)}
                          data-testid={`botao-inativar-${cliente.id}`}
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
        {!carregando && clientes.length > 0 && (
          <div className="paginacao-rodape">
            <span className="info-paginacao">
              Mostrando {clientes.length} de {paginacao.total} clientes
            </span>
            <div className="botoes-paginacao">
              <button
                type="button"
                className="botao-paginacao"
                disabled={paginacao.pagina <= 1}
                onClick={() => carregarClientes(paginacao.pagina - 1)}
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
                onClick={() => carregarClientes(paginacao.pagina + 1)}
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
      <ModalFormularioCliente
        aberto={modalFormAberto}
        clienteParaEdicao={clienteEmEdicao}
        aoFechar={() => setModalFormAberto(false)}
        aoSalvarComSucesso={lidarComSucessoFormulario}
      />

      {/* Modal de Confirmação de Inativação */}
      <ModalConfirmacao
        aberto={modalInativarAberto}
        titulo="Inativar Cliente"
        mensagem={`Deseja realmente inativar o cliente "${clienteParaInativar?.nome}"? Ele não poderá mais ser selecionado para novas vendas.`}
        textoConfirmar="Sim, Inativar"
        variante="perigo"
        aoFechar={() => {
          setModalInativarAberto(false);
          setClienteParaInativar(null);
        }}
        aoConfirmar={confirmarInativacao}
      />
    </div>
  );
};
