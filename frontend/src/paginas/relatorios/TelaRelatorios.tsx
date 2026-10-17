import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  ShoppingBag,
  ShoppingCart,
  Banknote,
  Printer,
  Calendar,
  Filter,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Inbox
} from "lucide-react";
import { servicoRelatorios } from "../../servicos/relatorios.js";
import { listarProdutos } from "../../servicos/produtos.js";
import { listarClientes } from "../../servicos/clientes.js";
import { listarFornecedores } from "../../servicos/fornecedores.js";
import {
  PeriodoRelatorio,
  RespostaRelatorioVendas,
  RespostaRelatorioCompras,
  RespostaRelatorioFinanceiro
} from "../../tipos/relatorios.js";
import { Produto } from "../../tipos/produtos.js";
import { Cliente } from "../../tipos/clientes.js";
import { Fornecedor } from "../../tipos/fornecedores.js";

type AbaAtiva = "vendas" | "compras" | "financeiro";

export const TelaRelatorios: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("vendas");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Período e datas
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>("mes");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Filtros de Vendas
  const [produtoIdVendas, setProdutoIdVendas] = useState<number | undefined>(undefined);
  const [clienteIdVendas, setClienteIdVendas] = useState<number | undefined>(undefined);

  // Filtros de Compras
  const [produtoIdCompras, setProdutoIdCompras] = useState<number | undefined>(undefined);
  const [fornecedorIdCompras, setFornecedorIdCompras] = useState<number | undefined>(undefined);

  // Filtros de Financeiro
  const [tipoFinanceiro, setTipoFinanceiro] = useState<"TODOS" | "ENTRADA" | "SAIDA">("TODOS");
  const [categoriaFinanceiro, setCategoriaFinanceiro] = useState("");

  // Paginação
  const [pagina, setPagina] = useState(1);
  const [limite] = useState(15);

  // Resultados
  const [relatorioVendas, setRelatorioVendas] = useState<RespostaRelatorioVendas | null>(null);
  const [relatorioCompras, setRelatorioCompras] = useState<RespostaRelatorioCompras | null>(null);
  const [relatorioFinanceiro, setRelatorioFinanceiro] = useState<RespostaRelatorioFinanceiro | null>(null);

  // Listas para dropdowns de filtros
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  // Carregar listas auxiliares
  useEffect(() => {
    listarProdutos({ limite: 100, ativo: "true" })
      .then((res) => setProdutos(res.dados))
      .catch(() => {});
    listarClientes({ limite: 100, ativo: "true" })
      .then((res) => setClientes(res.dados))
      .catch(() => {});
    listarFornecedores({ limite: 100, ativo: "true" })
      .then((res) => setFornecedores(res.dados))
      .catch(() => {});
  }, []);

  const carregarRelatorio = useCallback(
    async (paginaAlvo: number = pagina) => {
      setCarregando(true);
      setErro(null);

      // Validação de datas
      if (periodo === "personalizado" && dataInicio && dataFim && dataInicio > dataFim) {
        setErro("A data inicial não pode ser posterior à data final.");
        setCarregando(false);
        return;
      }

      try {
        const dataInicioResolvida = (periodo === "personalizado" && dataInicio) ? dataInicio : undefined;
        const dataFimResolvida = (periodo === "personalizado" && dataFim) ? dataFim : undefined;

        if (abaAtiva === "vendas") {
          const res = await servicoRelatorios.obterRelatorioVendas({
            periodo,
            data_inicio: dataInicioResolvida,
            data_fim: dataFimResolvida,
            produto_id: produtoIdVendas,
            cliente_id: clienteIdVendas,
            pagina: paginaAlvo,
            limite
          });
          setRelatorioVendas(res);
        } else if (abaAtiva === "compras") {
          const res = await servicoRelatorios.obterRelatorioCompras({
            periodo,
            data_inicio: dataInicioResolvida,
            data_fim: dataFimResolvida,
            produto_id: produtoIdCompras,
            fornecedor_id: fornecedorIdCompras,
            pagina: paginaAlvo,
            limite
          });
          setRelatorioCompras(res);
        } else if (abaAtiva === "financeiro") {
          const res = await servicoRelatorios.obterRelatorioFinanceiro({
            periodo,
            data_inicio: dataInicioResolvida,
            data_fim: dataFimResolvida,
            tipo: tipoFinanceiro,
            categoria: categoriaFinanceiro.trim() || undefined,
            pagina: paginaAlvo,
            limite
          });
          setRelatorioFinanceiro(res);
        }
      } catch (err: any) {
        setErro(
          err.response?.data?.erro?.mensagem ||
          err.response?.data?.mensagem ||
          "Não foi possível carregar o relatório."
        );
      } finally {
        setCarregando(false);
      }
    },
    [
      abaAtiva,
      periodo,
      dataInicio,
      dataFim,
      produtoIdVendas,
      clienteIdVendas,
      produtoIdCompras,
      fornecedorIdCompras,
      tipoFinanceiro,
      categoriaFinanceiro,
      pagina,
      limite
    ]
  );

  useEffect(() => {
    if (periodo !== "personalizado") {
      carregarRelatorio(pagina);
    }
  }, [abaAtiva, pagina, periodo]);

  const lidarComSubmissaoFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    if (pagina === 1) {
      carregarRelatorio(1);
    } else {
      setPagina(1);
    }
  };

  const limparFiltros = () => {
    setPeriodo("mes");
    setDataInicio("");
    setDataFim("");
    setProdutoIdVendas(undefined);
    setClienteIdVendas(undefined);
    setProdutoIdCompras(undefined);
    setFornecedorIdCompras(undefined);
    setTipoFinanceiro("TODOS");
    setCategoriaFinanceiro("");
    setPagina(1);
  };

  const mudarAba = (novaAba: AbaAtiva) => {
    setAbaAtiva(novaAba);
    setPagina(1);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(valor || 0);
  };

  const formatarData = (dataStr: string) => {
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    } catch {
      return dataStr;
    }
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  return (
    <div className="pagina-relatorios">
      {/* Cabeçalho exclusivo para impressão */}
      <div className="cabecalho-impressao">
        <h2>Uniqprint — Relatório de {abaAtiva.toUpperCase()}</h2>
        <p>Data de Emissão: {new Date().toLocaleString("pt-BR")}</p>
        <p>Filtro de Período: {periodo === "personalizado" ? `${dataInicio} até ${dataFim}` : periodo}</p>
        <hr />
      </div>

      <div className="cabecalho-pagina">
        <div className="titulo-secao">
          <div className="icone-titulo">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1>Relatórios Gerenciais</h1>
            <p className="descricao-secao">
              Consultas consolidadas, análises agregadas e exportação de dados
            </p>
          </div>
        </div>

        <button
          onClick={imprimirRelatorio}
          className="botao-secundario botao-imprimir"
          title="Imprimir ou exportar em PDF"
          data-testid="botao-imprimir-relatorio"
        >
          <Printer size={16} />
          <span>Imprimir Relatório</span>
        </button>
      </div>

      {erro && (
        <div className="alerta-erro" role="alert" style={{ marginBottom: "1.5rem" }}>
          <span>{erro}</span>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="abas-relatorios" data-testid="abas-relatorios">
        <button
          type="button"
          className={`aba-item ${abaAtiva === "vendas" ? "ativa" : ""}`}
          onClick={() => mudarAba("vendas")}
          data-testid="aba-vendas"
        >
          <ShoppingBag size={18} />
          <span>Relatório de Vendas</span>
        </button>

        <button
          type="button"
          className={`aba-item ${abaAtiva === "compras" ? "ativa" : ""}`}
          onClick={() => mudarAba("compras")}
          data-testid="aba-compras"
        >
          <ShoppingCart size={18} />
          <span>Relatório de Compras</span>
        </button>

        <button
          type="button"
          className={`aba-item ${abaAtiva === "financeiro" ? "ativa" : ""}`}
          onClick={() => mudarAba("financeiro")}
          data-testid="aba-financeiro"
        >
          <Banknote size={18} />
          <span>Relatório Financeiro</span>
        </button>
      </div>

      {/* Barra de Filtros Dinâmica */}
      <form onSubmit={lidarComSubmissaoFiltros} className="painel-filtros-relatorio">
        <div className="linha-filtros-relatorio">
          <div className="grupo-filtro-item">
            <label htmlFor="select-periodo">Período</label>
            <select
              id="select-periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as PeriodoRelatorio)}
              className="select-filtro"
              data-testid="select-periodo"
            >
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mês</option>
              <option value="personalizado">Período Personalizado</option>
            </select>
          </div>

          {periodo === "personalizado" && (
            <>
              <div className="grupo-filtro-item">
                <label htmlFor="data-inicio">Data Inicial</label>
                <input
                  id="data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="input-filtro"
                  data-testid="input-data-inicio"
                />
              </div>

              <div className="grupo-filtro-item">
                <label htmlFor="data-fim">Data Final</label>
                <input
                  id="data-fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="input-filtro"
                  data-testid="input-data-fim"
                />
              </div>
            </>
          )}

          {/* Filtros específicos de Vendas */}
          {abaAtiva === "vendas" && (
            <>
              <div className="grupo-filtro-item">
                <label htmlFor="select-produto-venda">Produto</label>
                <select
                  id="select-produto-venda"
                  value={produtoIdVendas || ""}
                  onChange={(e) => setProdutoIdVendas(e.target.value ? Number(e.target.value) : undefined)}
                  className="select-filtro"
                  data-testid="select-produto-venda"
                >
                  <option value="">Todos os Produtos</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.descricao}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grupo-filtro-item">
                <label htmlFor="select-cliente-venda">Cliente</label>
                <select
                  id="select-cliente-venda"
                  value={clienteIdVendas || ""}
                  onChange={(e) => setClienteIdVendas(e.target.value ? Number(e.target.value) : undefined)}
                  className="select-filtro"
                  data-testid="select-cliente-venda"
                >
                  <option value="">Todos os Clientes</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Filtros específicos de Compras */}
          {abaAtiva === "compras" && (
            <>
              <div className="grupo-filtro-item">
                <label htmlFor="select-produto-compra">Produto</label>
                <select
                  id="select-produto-compra"
                  value={produtoIdCompras || ""}
                  onChange={(e) => setProdutoIdCompras(e.target.value ? Number(e.target.value) : undefined)}
                  className="select-filtro"
                  data-testid="select-produto-compra"
                >
                  <option value="">Todos os Produtos</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.descricao}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grupo-filtro-item">
                <label htmlFor="select-fornecedor-compra">Fornecedor</label>
                <select
                  id="select-fornecedor-compra"
                  value={fornecedorIdCompras || ""}
                  onChange={(e) => setFornecedorIdCompras(e.target.value ? Number(e.target.value) : undefined)}
                  className="select-filtro"
                  data-testid="select-fornecedor-compra"
                >
                  <option value="">Todos os Fornecedores</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Filtros específicos de Financeiro */}
          {abaAtiva === "financeiro" && (
            <>
              <div className="grupo-filtro-item">
                <label htmlFor="select-tipo-financeiro">Tipo</label>
                <select
                  id="select-tipo-financeiro"
                  value={tipoFinanceiro}
                  onChange={(e) => setTipoFinanceiro(e.target.value as "TODOS" | "ENTRADA" | "SAIDA")}
                  className="select-filtro"
                  data-testid="select-tipo-financeiro"
                >
                  <option value="TODOS">Todos os Tipos</option>
                  <option value="ENTRADA">Entradas</option>
                  <option value="SAIDA">Saídas</option>
                </select>
              </div>

              <div className="grupo-filtro-item">
                <label htmlFor="input-categoria">Categoria</label>
                <input
                  id="input-categoria"
                  type="text"
                  placeholder="Ex: Venda, Material..."
                  value={categoriaFinanceiro}
                  onChange={(e) => setCategoriaFinanceiro(e.target.value)}
                  className="input-filtro"
                  data-testid="input-categoria-financeiro"
                />
              </div>
            </>
          )}

          <div className="acoes-filtros-relatorio">
            <button
              type="submit"
              className="botao-primario"
              disabled={carregando}
              data-testid="botao-aplicar-filtros"
            >
              <Filter size={16} />
              <span>{carregando ? "Carregando..." : "Aplicar"}</span>
            </button>

            <button
              type="button"
              onClick={limparFiltros}
              className="botao-secundario"
              title="Redefinir filtros"
              data-testid="botao-limpar-filtros"
            >
              <RotateCcw size={16} />
              <span>Limpar</span>
            </button>
          </div>
        </div>
      </form>

      {/* Conteúdo da Aba Vendas */}
      {abaAtiva === "vendas" && (
        <div className="secao-aba-conteudo" data-testid="secao-relatorio-vendas">
          {/* Cards de Resumo */}
          <div className="grade-resumo-financeiro" style={{ marginBottom: "1.5rem" }}>
            <div className="card-metrica-financeira card-entradas" data-testid="card-total-vendas">
              <div className="cabecalho-card-metrica">
                <span className="titulo-metrica">Total de Vendas</span>
                <div className="icone-metrica-fin entrada">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="valor-metrica">
                {formatarMoeda(relatorioVendas?.resumo.valor_total_vendido || 0)}
              </div>
              <span className="subtitulo-metrica">
                {relatorioVendas?.resumo.total_vendas || 0} venda(s) registrada(s)
              </span>
            </div>

            <div className="card-metrica-financeira" data-testid="card-ticket-medio">
              <div className="cabecalho-card-metrica">
                <span className="titulo-metrica">Ticket Médio</span>
                <div className="icone-metrica-fin">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="valor-metrica">
                {formatarMoeda(relatorioVendas?.resumo.ticket_medio || 0)}
              </div>
              <span className="subtitulo-metrica">Média por venda realizada</span>
            </div>

            <div className="card-metrica-financeira" data-testid="card-itens-vendidos">
              <div className="cabecalho-card-metrica">
                <span className="titulo-metrica">Itens Vendidos</span>
                <div className="icone-metrica-fin">
                  <Package size={20} />
                </div>
              </div>
              <div className="valor-metrica">
                {relatorioVendas?.resumo.quantidade_itens || 0}
              </div>
              <span className="subtitulo-metrica">Volume total de produtos</span>
            </div>
          </div>

          {/* Tabela de Detalhamento */}
          <div className="tabela-conteiner">
            <table className="tabela" data-testid="tabela-relatorio-vendas">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Produto</th>
                  <th style={{ textAlign: "right" }}>Qtd</th>
                  <th style={{ textAlign: "right" }}>Valor Unit.</th>
                  <th style={{ textAlign: "right" }}>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={7} className="conteiner-carregando-tabela">
                      <span>Carregando dados do relatório...</span>
                    </td>
                  </tr>
                ) : !relatorioVendas || relatorioVendas.dados.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="estado-vazio" data-testid="estado-vazio-relatorio">
                        <Inbox size={48} />
                        <h3>Nenhum registro encontrado</h3>
                        <p>Nenhuma venda localizada para os filtros selecionados.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  relatorioVendas.dados.map((item) => (
                    <tr key={item.id} data-testid={`linha-venda-${item.id}`}>
                      <td>{formatarData(item.data_venda)}</td>
                      <td>#{item.id}</td>
                      <td>{item.cliente_nome}</td>
                      <td>{item.produto_descricao}</td>
                      <td style={{ textAlign: "right" }}>{item.quantidade}</td>
                      <td style={{ textAlign: "right" }}>{formatarMoeda(item.valor_unitario)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {formatarMoeda(item.valor_total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Paginação */}
            {relatorioVendas && relatorioVendas.paginacao.total_paginas > 1 && (
              <div className="paginacao-rodape">
                <span className="info-paginacao">
                  Página {relatorioVendas.paginacao.pagina} de {relatorioVendas.paginacao.total_paginas} (
                  {relatorioVendas.paginacao.total} registros)
                </span>
                <div className="botoes-paginacao">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={relatorioVendas.paginacao.pagina <= 1}
                    className="botao-paginacao"
                  >
                    Anterior
                  </button>
                  <span className="numero-pagina">{relatorioVendas.paginacao.pagina}</span>
                  <button
                    onClick={() => setPagina((p) => Math.min(relatorioVendas.paginacao.total_paginas, p + 1))}
                    disabled={relatorioVendas.paginacao.pagina >= relatorioVendas.paginacao.total_paginas}
                    className="botao-paginacao"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba Compras */}
      {abaAtiva === "compras" && (
        <div className="secao-aba-conteudo" data-testid="secao-relatorio-compras">
          {/* Cards de Resumo */}
          <div className="grade-resumo-financeiro" style={{ marginBottom: "1.5rem" }}>
            <div className="card-metrica-financeira card-saidas" data-testid="card-total-compras">
              <div className="cabecalho-card-metrica">
                <span className="titulo-metrica">Total de Compras</span>
                <div className="icone-metrica-fin saida">
                  <TrendingDown size={20} />
                </div>
              </div>
              <div className="valor-metrica">
                {formatarMoeda(relatorioCompras?.resumo.valor_total_comprado || 0)}
              </div>
              <span className="subtitulo-metrica">
                {relatorioCompras?.resumo.total_compras || 0} compra(s) registrada(s)
              </span>
            </div>

            <div className="card-metrica-financeira" data-testid="card-media-compras">
              <div className="cabecalho-card-metrica">
                <span className="titulo-metrica">Média por Compra</span>
                <div className="icone-metrica-fin">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="valor-metrica">
                {formatarMoeda(relatorioCompras?.resumo.media_por_compra || 0)}
              </div>
              <span className="subtitulo-metrica">Média investida por compra</span>
            </div>

            <div className="card-metrica-financeira" data-testid="card-itens-comprados">
              <div className="cabecalho-card-metrica">
                <span className="titulo-metrica">Itens Comprados</span>
                <div className="icone-metrica-fin">
                  <Package size={20} />
                </div>
              </div>
              <div className="valor-metrica">
                {relatorioCompras?.resumo.quantidade_itens || 0}
              </div>
              <span className="subtitulo-metrica">Volume total adquirido</span>
            </div>
          </div>

          {/* Tabela de Detalhamento */}
          <div className="tabela-conteiner">
            <table className="tabela" data-testid="tabela-relatorio-compras">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>ID</th>
                  <th>Fornecedor</th>
                  <th>Produto</th>
                  <th style={{ textAlign: "right" }}>Qtd</th>
                  <th style={{ textAlign: "right" }}>Valor Unit.</th>
                  <th style={{ textAlign: "right" }}>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={7} className="conteiner-carregando-tabela">
                      <span>Carregando dados do relatório...</span>
                    </td>
                  </tr>
                ) : !relatorioCompras || relatorioCompras.dados.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="estado-vazio" data-testid="estado-vazio-relatorio">
                        <Inbox size={48} />
                        <h3>Nenhum registro encontrado</h3>
                        <p>Nenhuma compra localizada para os filtros selecionados.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  relatorioCompras.dados.map((item) => (
                    <tr key={item.id} data-testid={`linha-compra-${item.id}`}>
                      <td>{formatarData(item.data_compra)}</td>
                      <td>#{item.id}</td>
                      <td>{item.fornecedor_nome}</td>
                      <td>{item.produto_descricao}</td>
                      <td style={{ textAlign: "right" }}>{item.quantidade}</td>
                      <td style={{ textAlign: "right" }}>{formatarMoeda(item.valor_unitario)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {formatarMoeda(item.valor_total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Paginação */}
            {relatorioCompras && relatorioCompras.paginacao.total_paginas > 1 && (
              <div className="paginacao-rodape">
                <span className="info-paginacao">
                  Página {relatorioCompras.paginacao.pagina} de {relatorioCompras.paginacao.total_paginas} (
                  {relatorioCompras.paginacao.total} registros)
                </span>
                <div className="botoes-paginacao">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={relatorioCompras.paginacao.pagina <= 1}
                    className="botao-paginacao"
                  >
                    Anterior
                  </button>
                  <span className="numero-pagina">{relatorioCompras.paginacao.pagina}</span>
                  <button
                    onClick={() => setPagina((p) => Math.min(relatorioCompras.paginacao.total_paginas, p + 1))}
                    disabled={relatorioCompras.paginacao.pagina >= relatorioCompras.paginacao.total_paginas}
                    className="botao-paginacao"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba Financeiro */}
      {abaAtiva === "financeiro" && (
        <div className="secao-aba-conteudo" data-testid="secao-relatorio-financeiro">
          {/* Cards de Resumo */}
          <div className="grade-resumo-financeiro" style={{ marginBottom: "1.5rem" }}>
            <div className="card-metrica-financeira card-entradas" data-testid="card-total-entradas">
              <div className="cabecalho-card-metrica">
                <span className="titulo-metrica">Total de Entradas</span>
                <div className="icone-metrica-fin entrada">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="valor-metrica">
                {formatarMoeda(relatorioFinanceiro?.resumo.total_entradas || 0)}
              </div>
              <span className="subtitulo-metrica">
                Média: {formatarMoeda(relatorioFinanceiro?.resumo.media_entradas || 0)} (
                {relatorioFinanceiro?.resumo.quantidade_entradas || 0} lançamentos)
              </span>
            </div>

            <div className="card-metrica-financeira card-saidas" data-testid="card-total-saidas">
              <div className="cabecalho-card-metrica">
                <span className="titulo-metrica">Total de Saídas</span>
                <div className="icone-metrica-fin saida">
                  <TrendingDown size={20} />
                </div>
              </div>
              <div className="valor-metrica">
                {formatarMoeda(relatorioFinanceiro?.resumo.total_saidas || 0)}
              </div>
              <span className="subtitulo-metrica">
                Média: {formatarMoeda(relatorioFinanceiro?.resumo.media_saidas || 0)} (
                {relatorioFinanceiro?.resumo.quantidade_saidas || 0} lançamentos)
              </span>
            </div>

            <div
              className={`card-metrica-financeira ${(relatorioFinanceiro?.resumo.saldo || 0) >= 0 ? "card-saldo-positivo" : "card-saldo-negativo"}`}
              data-testid="card-saldo-liquido"
            >
              <div className="cabecalho-card-metrica">
                <span className="titulo-metrica">Saldo Líquido</span>
                <div className="icone-metrica-fin">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="valor-metrica">
                {formatarMoeda(relatorioFinanceiro?.resumo.saldo || 0)}
              </div>
              <span className="subtitulo-metrica">Entradas subtraídas das Saídas</span>
            </div>
          </div>

          {/* Tabela de Detalhamento */}
          <div className="tabela-conteiner">
            <table className="tabela" data-testid="tabela-relatorio-financeiro">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Origem</th>
                  <th style={{ textAlign: "right" }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={6} className="conteiner-carregando-tabela">
                      <span>Carregando dados do relatório...</span>
                    </td>
                  </tr>
                ) : !relatorioFinanceiro || relatorioFinanceiro.dados.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="estado-vazio" data-testid="estado-vazio-relatorio">
                        <Inbox size={48} />
                        <h3>Nenhum registro encontrado</h3>
                        <p>Nenhum lançamento localizado para os filtros selecionados.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  relatorioFinanceiro.dados.map((item) => (
                    <tr key={item.id} data-testid={`linha-financeiro-${item.id}`}>
                      <td>{formatarData(item.data_lancamento)}</td>
                      <td>
                        <span className={`badge-financeiro-tipo ${item.tipo === "ENTRADA" ? "entrada" : "saida"}`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td>{item.descricao}</td>
                      <td>
                        <span className="tag-categoria">{item.categoria}</span>
                      </td>
                      <td>
                        <span className="badge-origem">
                          {item.tipo_referencia
                            ? `${item.tipo_referencia} #${item.referencia_id}`
                            : "MANUAL"}
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 600,
                          color: item.tipo === "ENTRADA" ? "var(--sucesso)" : "var(--erro)"
                        }}
                      >
                        {item.tipo === "ENTRADA" ? "+" : "-"} {formatarMoeda(item.valor)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Paginação */}
            {relatorioFinanceiro && relatorioFinanceiro.paginacao.total_paginas > 1 && (
              <div className="paginacao-rodape">
                <span className="info-paginacao">
                  Página {relatorioFinanceiro.paginacao.pagina} de {relatorioFinanceiro.paginacao.total_paginas} (
                  {relatorioFinanceiro.paginacao.total} registros)
                </span>
                <div className="botoes-paginacao">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={relatorioFinanceiro.paginacao.pagina <= 1}
                    className="botao-paginacao"
                  >
                    Anterior
                  </button>
                  <span className="numero-pagina">{relatorioFinanceiro.paginacao.pagina}</span>
                  <button
                    onClick={() => setPagina((p) => Math.min(relatorioFinanceiro.paginacao.total_paginas, p + 1))}
                    disabled={relatorioFinanceiro.paginacao.pagina >= relatorioFinanceiro.paginacao.total_paginas}
                    className="botao-paginacao"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
