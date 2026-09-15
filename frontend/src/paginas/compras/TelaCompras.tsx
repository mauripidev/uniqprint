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
  ShoppingCart,
  Truck
} from "lucide-react";
import { listarCompras } from "../../servicos/compras.js";
import { listarFornecedores } from "../../servicos/fornecedores.js";
import { listarProdutos } from "../../servicos/produtos.js";
import { Compra, PaginacaoInfo } from "../../tipos/compras.js";
import { Fornecedor } from "../../tipos/fornecedores.js";
import { Produto } from "../../tipos/produtos.js";
import { ModalRegistroCompra } from "./ModalRegistroCompra.js";

export const TelaCompras: React.FC = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
    pagina: 1,
    limite: 10,
    total: 0,
    total_paginas: 1
  });

  // Filtros
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [fornecedorFiltro, setFornecedorFiltro] = useState<string>("");
  const [produtoFiltro, setProdutoFiltro] = useState<string>("");

  // Listas para filtros dinâmicos
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
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
        const [resFornec, resProd] = await Promise.all([
          listarFornecedores({ limite: 100 }),
          listarProdutos({ limite: 100 })
        ]);
        setFornecedores(resFornec.dados);
        setProdutos(resProd.dados);
      } catch {
        // Silently continue
      }
    };
    carregarFiltros();
  }, []);

  const carregarCompras = useCallback(
    async (pagina = 1) => {
      setCarregando(true);
      setErro(null);
      try {
        const resposta = await listarCompras({
          pagina,
          limite: 10,
          data_inicio: dataInicio || undefined,
          data_fim: dataFim || undefined,
          fornecedor_id: fornecedorFiltro ? Number(fornecedorFiltro) : undefined,
          produto_id: produtoFiltro ? Number(produtoFiltro) : undefined
        });
        setCompras(resposta.dados);
        setPaginacao(resposta.paginacao);
      } catch (err: any) {
        setErro(err.message || "Erro ao carregar lista de compras");
      } finally {
        setCarregando(false);
      }
    },
    [dataInicio, dataFim, fornecedorFiltro, produtoFiltro]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarCompras(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [carregarCompras]);

  const limparFiltros = () => {
    setDataInicio("");
    setDataFim("");
    setFornecedorFiltro("");
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
    carregarCompras(1);
    setTimeout(() => setMensagemSucesso(null), 5000);
  };

  return (
    <div className="secao-pagina">
      {/* Cabeçalho */}
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Registro de Compras</h1>
          <p className="subtitulo-pagina">
            Entrada de mercadorias, incremento de estoque e lançamentos financeiros
          </p>
        </div>

        <button
          className="botao-primario"
          onClick={() => setModalNovoAberto(true)}
          data-testid="botao-nova-compra"
        >
          <Plus size={18} />
          <span>Nova Compra</span>
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
          data-testid="alerta-sucesso-compras"
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
          data-testid="alerta-erro-listagem"
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

        {/* Filtro Fornecedor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label
            htmlFor="filtroFornecedor"
            style={{ fontSize: "0.75rem", color: "var(--texto-mutado)", fontWeight: 500 }}
          >
            Fornecedor
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Truck
              size={14}
              style={{ position: "absolute", left: "0.6rem", color: "var(--texto-fraco)", pointerEvents: "none" }}
            />
            <select
              id="filtroFornecedor"
              className="select-filtro"
              style={{ paddingLeft: "2rem", minWidth: "180px" }}
              value={fornecedorFiltro}
              onChange={(e) => setFornecedorFiltro(e.target.value)}
              data-testid="filtro-fornecedor"
            >
              <option value="">Todos os fornecedores</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
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
        {(dataInicio || dataFim || fornecedorFiltro || produtoFiltro) && (
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

      {/* Tabela de Compras */}
      <div className="tabela-conteiner">
        {carregando ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--texto-mutado)" }}>
            <div className="spinner" style={{ margin: "0 auto 0.75rem" }}></div>
            <span>Carregando compras...</span>
          </div>
        ) : compras.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3.5rem 1rem", color: "var(--texto-mutado)" }}>
            <ShoppingCart size={40} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
            <h3 style={{ color: "var(--texto-titulo)", fontSize: "1.125rem", marginBottom: "0.5rem" }}>
              Nenhuma compra encontrada
            </h3>
            <p style={{ fontSize: "0.875rem", maxWidth: "400px", margin: "0 auto" }}>
              Nenhum registro corresponde aos filtros selecionados ou nenhuma compra foi cadastrada ainda.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="tabela-dados" data-testid="tabela-compras">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Fornecedor</th>
                  <th>Produto</th>
                  <th style={{ textAlign: "right" }}>Quantidade</th>
                  <th style={{ textAlign: "right" }}>Valor Unitário</th>
                  <th style={{ textAlign: "right" }}>Valor Total</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((compra) => (
                  <tr key={compra.id} data-testid={`linha-compra-${compra.id}`}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span className="coluna-destaque">{formatarData(compra.data_compra)}</span>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--texto-fraco)" }}>
                        #{compra.id}
                      </span>
                    </td>
                    <td>
                      <span className="coluna-destaque">{compra.fornecedor.nome}</span>
                    </td>
                    <td>
                      <span>{compra.produto.descricao}</span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      <span className="badge-estoque estoque-positivo">
                        +{compra.quantidade} un
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatarMoeda(compra.valor_unitario)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--texto-titulo)" }}>
                      {formatarMoeda(compra.valor_total)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className="badge-status status-ativo"
                        title="Compra concluída com estoque incrementado e saída financeira registrada"
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
        {!carregando && compras.length > 0 && (
          <div className="paginacao-rodape">
            <span className="info-paginacao" data-testid="info-paginacao">
              Mostrando {compras.length} de {paginacao.total} compras (Página {paginacao.pagina} de{" "}
              {paginacao.total_paginas})
            </span>

            <div className="botoes-paginacao">
              <button
                className="botao-paginacao"
                onClick={() => carregarCompras(paginacao.pagina - 1)}
                disabled={paginacao.pagina <= 1}
                data-testid="botao-pagina-anterior"
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>

              <button
                className="botao-paginacao"
                onClick={() => carregarCompras(paginacao.pagina + 1)}
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

      {/* Modal Nova Compra */}
      <ModalRegistroCompra
        aberto={modalNovoAberto}
        aoFechar={() => setModalNovoAberto(false)}
        aoRegistrarComSucesso={lidarComSucessoRegistro}
      />
    </div>
  );
};
