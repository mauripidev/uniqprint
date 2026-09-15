import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Package,
  Plus,
  ShoppingBag,
  Users
} from "lucide-react";
import { listarVendas } from "../../servicos/vendas.js";
import { listarClientes } from "../../servicos/clientes.js";
import { listarProdutos } from "../../servicos/produtos.js";
import { Venda, PaginacaoInfo } from "../../tipos/vendas.js";
import { Cliente } from "../../tipos/clientes.js";
import { Produto } from "../../tipos/produtos.js";
import { ModalRegistroVenda } from "./ModalRegistroVenda.js";

export const TelaVendas: React.FC = () => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
    pagina: 1,
    limite: 10,
    total: 0,
    total_paginas: 1
  });

  // Filtros
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [clienteFiltro, setClienteFiltro] = useState<string>("");
  const [produtoFiltro, setProdutoFiltro] = useState<string>("");

  // Listas para filtros dinâmicos
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // Estados de controle
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);

  // Carregar opções de filtros uma vez
  useEffect(() => {
    const carregarFiltros = async () => {
      try {
        const [resClientes, resProd] = await Promise.all([
          listarClientes({ limite: 100 }),
          listarProdutos({ limite: 100 })
        ]);
        setClientes(resClientes.dados);
        setProdutos(resProd.dados);
      } catch {
        // Silently continue
      }
    };
    carregarFiltros();
  }, []);

  const carregarVendas = useCallback(
    async (pagina = 1) => {
      setCarregando(true);
      setErro(null);
      try {
        const resposta = await listarVendas({
          pagina,
          limite: 10,
          data_inicio: dataInicio || undefined,
          data_fim: dataFim || undefined,
          cliente_id: clienteFiltro ? Number(clienteFiltro) : undefined,
          produto_id: produtoFiltro ? Number(produtoFiltro) : undefined
        });
        setVendas(resposta.dados);
        setPaginacao(resposta.paginacao);
      } catch (err: any) {
        setErro(err.message || "Erro ao carregar lista de vendas");
      } finally {
        setCarregando(false);
      }
    },
    [dataInicio, dataFim, clienteFiltro, produtoFiltro]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarVendas(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [carregarVendas]);

  const limparFiltros = () => {
    setDataInicio("");
    setDataFim("");
    setClienteFiltro("");
    setProdutoFiltro("");
  };

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

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(valor);
  };

  const lidarComSucessoRegistro = (mensagem: string) => {
    setModalNovoAberto(false);
    setMensagemSucesso(mensagem);
    carregarVendas(1);
    setTimeout(() => setMensagemSucesso(null), 5000);
  };

  return (
    <div className="secao-pagina">
      {/* Cabeçalho */}
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Registro de Vendas</h1>
          <p className="subtitulo-pagina">
            Saída de mercadorias, baixa atômica de estoque e lançamentos financeiros
          </p>
        </div>

        <button
          className="botao-primario"
          onClick={() => setModalNovoAberto(true)}
          data-testid="botao-nova-venda"
        >
          <Plus size={18} />
          <span>Nova Venda</span>
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
          data-testid="alerta-sucesso-vendas"
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
          data-testid="alerta-erro-listagem-vendas"
        >
          <AlertCircle size={18} />
          <span>{erro}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div
        className="barra-ferramentas"
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "flex-end",
          flexWrap: "wrap",
          padding: "1.25rem",
          backgroundColor: "var(--fundo-superficie)",
          border: "1px solid var(--borda-suave)",
          borderRadius: "var(--raio-borda)",
          marginBottom: "1.5rem"
        }}
      >
        {/* Filtro Período: Início */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label
            htmlFor="filtroDataInicio"
            style={{ fontSize: "0.75rem", color: "var(--texto-mutado)", fontWeight: 500 }}
          >
            Data inicial
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Calendar
              size={14}
              style={{ position: "absolute", left: "0.6rem", color: "var(--texto-fraco)", pointerEvents: "none" }}
            />
            <input
              id="filtroDataInicio"
              type="date"
              className="select-filtro"
              style={{ paddingLeft: "2rem" }}
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              data-testid="filtro-data-inicio"
            />
          </div>
        </div>

        {/* Filtro Período: Fim */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label
            htmlFor="filtroDataFim"
            style={{ fontSize: "0.75rem", color: "var(--texto-mutado)", fontWeight: 500 }}
          >
            Data final
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Calendar
              size={14}
              style={{ position: "absolute", left: "0.6rem", color: "var(--texto-fraco)", pointerEvents: "none" }}
            />
            <input
              id="filtroDataFim"
              type="date"
              className="select-filtro"
              style={{ paddingLeft: "2rem" }}
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              data-testid="filtro-data-fim"
            />
          </div>
        </div>

        {/* Filtro Cliente */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label
            htmlFor="filtroCliente"
            style={{ fontSize: "0.75rem", color: "var(--texto-mutado)", fontWeight: 500 }}
          >
            Cliente
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Users
              size={14}
              style={{ position: "absolute", left: "0.6rem", color: "var(--texto-fraco)", pointerEvents: "none" }}
            />
            <select
              id="filtroCliente"
              className="select-filtro"
              style={{ paddingLeft: "2rem", minWidth: "180px" }}
              value={clienteFiltro}
              onChange={(e) => setClienteFiltro(e.target.value)}
              data-testid="filtro-cliente"
            >
              <option value="">Todos os clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtro Produto */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label
            htmlFor="filtroProduto"
            style={{ fontSize: "0.75rem", color: "var(--texto-mutado)", fontWeight: 500 }}
          >
            Produto
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Package
              size={14}
              style={{ position: "absolute", left: "0.6rem", color: "var(--texto-fraco)", pointerEvents: "none" }}
            />
            <select
              id="filtroProduto"
              className="select-filtro"
              style={{ paddingLeft: "2rem", minWidth: "180px" }}
              value={produtoFiltro}
              onChange={(e) => setProdutoFiltro(e.target.value)}
              data-testid="filtro-produto"
            >
              <option value="">Todos os produtos</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.descricao}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Limpar Filtros */}
        {(dataInicio || dataFim || clienteFiltro || produtoFiltro) && (
          <button
            className="botao-secundario"
            onClick={limparFiltros}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.625rem 0.875rem" }}
            title="Limpar todos os filtros"
            data-testid="botao-limpar-filtros"
          >
            <FilterX size={15} />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* Tabela de Vendas */}
      <div className="tabela-conteiner">
        {carregando ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--texto-mutado)" }}>
            <div className="spinner" style={{ margin: "0 auto 0.75rem" }}></div>
            <span>Carregando vendas...</span>
          </div>
        ) : vendas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3.5rem 1rem", color: "var(--texto-mutado)" }}>
            <ShoppingBag size={40} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
            <h3 style={{ color: "var(--texto-titulo)", fontSize: "1.125rem", marginBottom: "0.5rem" }}>
              Nenhuma venda encontrada
            </h3>
            <p style={{ fontSize: "0.875rem", maxWidth: "400px", margin: "0 auto" }}>
              Nenhum registro corresponde aos filtros selecionados ou nenhuma venda foi cadastrada ainda.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="tabela-dados" data-testid="tabela-vendas">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Produto</th>
                  <th style={{ textAlign: "right" }}>Quantidade</th>
                  <th style={{ textAlign: "right" }}>Valor Unitário</th>
                  <th style={{ textAlign: "right" }}>Valor Total</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((venda) => (
                  <tr key={venda.id} data-testid={`linha-venda-${venda.id}`}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span className="coluna-destaque">{formatarData(venda.data_venda)}</span>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--texto-fraco)" }}>
                        #{venda.id}
                      </span>
                    </td>
                    <td>
                      <span className="coluna-destaque">{venda.cliente.nome}</span>
                    </td>
                    <td>
                      <span>{venda.produto.descricao}</span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      <span
                        className="badge-estoque"
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.12)",
                          color: "var(--erro)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "var(--raio-pequeno)",
                          fontSize: "0.8125rem"
                        }}
                      >
                        -{venda.quantidade} un
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatarMoeda(venda.valor_unitario)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--texto-titulo)" }}>
                      {formatarMoeda(venda.valor_total)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className="badge-status status-ativo"
                        title="Venda concluída com estoque baixado e entrada financeira registrada"
                      >
                        Concluída
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {!carregando && vendas.length > 0 && (
          <div className="paginacao-rodape">
            <span className="info-paginacao" data-testid="info-paginacao">
              Mostrando {vendas.length} de {paginacao.total} vendas (Página {paginacao.pagina} de{" "}
              {paginacao.total_paginas})
            </span>

            <div className="botoes-paginacao">
              <button
                className="botao-paginacao"
                onClick={() => carregarVendas(paginacao.pagina - 1)}
                disabled={paginacao.pagina <= 1}
                data-testid="botao-pagina-anterior"
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>

              <button
                className="botao-paginacao"
                onClick={() => carregarVendas(paginacao.pagina + 1)}
                disabled={paginacao.pagina >= paginacao.total_paginas}
                data-testid="botao-proxima-pagina"
              >
                <span>Próxima</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nova Venda */}
      <ModalRegistroVenda
        aberto={modalNovoAberto}
        aoFechar={() => setModalNovoAberto(false)}
        aoRegistrarComSucesso={lidarComSucessoRegistro}
      />
    </div>
  );
};
