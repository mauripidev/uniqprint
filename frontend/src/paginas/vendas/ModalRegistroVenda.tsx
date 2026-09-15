import React, { useEffect, useState } from "react";
import { AlertCircle, DollarSign, Package, ShoppingBag, X } from "lucide-react";
import { z } from "zod";
import { registrarVenda } from "../../servicos/vendas.js";
import { buscarProdutoPorId, listarProdutos } from "../../servicos/produtos.js";
import { listarClientes } from "../../servicos/clientes.js";
import { Produto } from "../../tipos/produtos.js";
import { Cliente } from "../../tipos/clientes.js";
import { ErroRequisicaoApi } from "../../servicos/api.js";

const schemaRegistroVenda = z.object({
  cliente_id: z
    .string()
    .trim()
    .min(1, "Selecione um cliente")
    .refine((v) => Number(v) > 0, "Selecione um cliente"),
  produto_id: z
    .string()
    .trim()
    .min(1, "Selecione um produto")
    .refine((v) => Number(v) > 0, "Selecione um produto"),
  quantidade: z
    .string()
    .trim()
    .min(1, "A quantidade é obrigatória")
    .refine((v) => {
      const n = Number(v);
      return !isNaN(n) && Number.isInteger(n) && n > 0;
    }, "A quantidade deve ser maior que zero"),
  valor_unitario: z
    .string()
    .trim()
    .min(1, "O valor unitário é obrigatório")
    .refine((v) => {
      const n = Number(v.replace(",", "."));
      return !isNaN(n) && n > 0;
    }, "O valor unitário deve ser maior que zero"),
  data_venda: z.string().optional()
});

interface PropriedadesModalRegistroVenda {
  aberto: boolean;
  aoFechar: () => void;
  aoRegistrarComSucesso: (mensagem: string) => void;
}

export const ModalRegistroVenda: React.FC<PropriedadesModalRegistroVenda> = ({
  aberto,
  aoFechar,
  aoRegistrarComSucesso
}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregandoDados, setCarregandoDados] = useState<boolean>(false);

  const [clienteId, setClienteId] = useState<string>("");
  const [produtoId, setProdutoId] = useState<string>("");
  const [quantidade, setQuantidade] = useState<string>("");
  const [valorUnitario, setValorUnitario] = useState<string>("");
  const [dataVenda, setDataVenda] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Estoque em tempo real consultado no back-end
  const [estoqueDisponivel, setEstoqueDisponivel] = useState<number | null>(null);
  const [carregandoEstoque, setCarregandoEstoque] = useState<boolean>(false);

  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<boolean>(false);

  // Carregar clientes e produtos ativos ao abrir modal
  useEffect(() => {
    if (!aberto) return;

    const carregarOpcoes = async () => {
      setCarregandoDados(true);
      try {
        const [resClientes, resProdutos] = await Promise.all([
          listarClientes({ ativo: "true", limite: 100 }),
          listarProdutos({ ativo: "true", limite: 100 })
        ]);
        setClientes(resClientes.dados);
        setProdutos(resProdutos.dados);
      } catch {
        setErroGeral("Erro ao carregar lista de clientes e produtos ativos.");
      } finally {
        setCarregandoDados(false);
      }
    };

    carregarOpcoes();

    // Resetar formulário
    setClienteId("");
    setProdutoId("");
    setQuantidade("");
    setValorUnitario("");
    setDataVenda(new Date().toISOString().split("T")[0]);
    setEstoqueDisponivel(null);
    setErros({});
    setErroGeral(null);
  }, [aberto]);

  // Consulta do estoque em tempo real direto da API ao selecionar um produto
  const lidarComMudancaProduto = async (novoProdutoId: string) => {
    setProdutoId(novoProdutoId);
    setErros((prev) => {
      const novos = { ...prev };
      delete novos.produto_id;
      delete novos.quantidade;
      return novos;
    });

    if (!novoProdutoId) {
      setEstoqueDisponivel(null);
      return;
    }

    setCarregandoEstoque(true);
    try {
      const produtoAtualizado = await buscarProdutoPorId(Number(novoProdutoId));
      setEstoqueDisponivel(produtoAtualizado.quantidade_estoque);
    } catch {
      setErroGeral("Não foi possível consultar o estoque atual do produto.");
    } finally {
      setCarregandoEstoque(false);
    }
  };

  if (!aberto) return null;

  // Cálculo da prévia em tempo real
  const qtdNum = Number(quantidade) || 0;
  const valUnitNum = Number(valorUnitario.replace(",", ".")) || 0;
  const previaValorTotal = qtdNum > 0 && valUnitNum > 0 ? qtdNum * valUnitNum : 0;

  // Bloqueio de UX no front-end por estoque insuficiente
  const estoqueInsuficienteBloqueio =
    estoqueDisponivel !== null && qtdNum > 0 && qtdNum > estoqueDisponivel;

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(valor);
  };

  const manipularEnvio = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErros({});
    setErroGeral(null);

    const validacao = schemaRegistroVenda.safeParse({
      cliente_id: clienteId,
      produto_id: produtoId,
      quantidade,
      valor_unitario: valorUnitario.replace(",", "."),
      data_venda: dataVenda || undefined
    });

    if (!validacao.success) {
      const errosMapeados: Record<string, string> = {};
      validacao.error.errors.forEach((err) => {
        const campo = err.path[0]?.toString();
        if (campo && !errosMapeados[campo]) {
          errosMapeados[campo] = err.message;
        }
      });
      setErros(errosMapeados);
      return;
    }

    // Bloqueio preventivo no front-end
    if (estoqueDisponivel !== null && Number(validacao.data.quantidade) > estoqueDisponivel) {
      setErros((prev) => ({
        ...prev,
        quantidade: `Estoque insuficiente. Disponível: ${estoqueDisponivel} un`
      }));
      return;
    }

    setSalvando(true);

    try {
      await registrarVenda({
        cliente_id: Number(validacao.data.cliente_id),
        produto_id: Number(validacao.data.produto_id),
        quantidade: Number(validacao.data.quantidade),
        valor_unitario: Number(validacao.data.valor_unitario.replace(",", ".")),
        data_venda: validacao.data.data_venda
      });

      aoRegistrarComSucesso("Venda registrada com sucesso. Estoque atualizado.");
    } catch (erro: any) {
      if (erro instanceof ErroRequisicaoApi) {
        if (erro.codigo === "ESTOQUE_INSUFICIENTE") {
          setErroGeral(
            "Não foi possível realizar a venda. O estoque disponível foi alterado antes da conclusão da operação. Atualize o estoque e tente novamente."
          );
          // Re-sincronizar estoque do produto em tempo real
          if (produtoId) {
            buscarProdutoPorId(Number(produtoId))
              .then((p) => setEstoqueDisponivel(p.quantidade_estoque))
              .catch(() => {});
          }
        } else {
          setErroGeral(erro.message);
        }

        if (erro.campos) {
          const camposErro: Record<string, string> = {};
          for (const [campo, msgs] of Object.entries(erro.campos)) {
            camposErro[campo] = msgs[0];
          }
          setErros(camposErro);
        }
      } else {
        setErroGeral(
          "Não foi possível registrar a venda. Nenhuma alteração foi realizada."
        );
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="envoltura-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          aoFechar();
        }
      }}
    >
      <div
        className="conteudo-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: "580px" }}
      >
        <div className="cabecalho-modal">
          <div className="icone-modal-titulo">
            <ShoppingBag size={20} color="var(--primaria)" />
            <h3 className="titulo-modal">Nova Venda</h3>
          </div>
          <button
            type="button"
            className="botao-fechar-modal"
            onClick={aoFechar}
            aria-label="Fechar formulário"
            disabled={salvando}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={manipularEnvio} noValidate>
          <div className="corpo-modal">
            {erroGeral && (
              <div
                className="alerta-erro-geral"
                style={{ marginBottom: "1.25rem" }}
                data-testid="alerta-erro-venda"
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{erroGeral}</span>
              </div>
            )}

            {carregandoDados ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--texto-mutado)" }}>
                <div className="spinner" style={{ margin: "0 auto 0.5rem" }}></div>
                <span>Carregando opções disponíveis...</span>
              </div>
            ) : (
              <>
                {/* Seleção de Cliente */}
                <div className="grupo-campo" style={{ marginBottom: "1.25rem" }}>
                  <label htmlFor="clienteVenda" className="rotulo-campo">
                    Cliente *
                  </label>
                  <select
                    id="clienteVenda"
                    className={`input-texto ${erros.cliente_id ? "com-erro" : ""}`}
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    disabled={salvando}
                    data-testid="select-cliente-venda"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                  {erros.cliente_id && (
                    <span className="mensagem-erro-campo">{erros.cliente_id}</span>
                  )}
                </div>

                {/* Seleção de Produto */}
                <div className="grupo-campo" style={{ marginBottom: "1.25rem" }}>
                  <label htmlFor="produtoVenda" className="rotulo-campo">
                    Produto *
                  </label>
                  <select
                    id="produtoVenda"
                    className={`input-texto ${erros.produto_id ? "com-erro" : ""}`}
                    value={produtoId}
                    onChange={(e) => lidarComMudancaProduto(e.target.value)}
                    disabled={salvando}
                    data-testid="select-produto-venda"
                  >
                    <option value="">Selecione um produto...</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.descricao}
                      </option>
                    ))}
                  </select>
                  {erros.produto_id && (
                    <span className="mensagem-erro-campo">{erros.produto_id}</span>
                  )}
                </div>

                {/* Exibição de Estoque em Tempo Real */}
                {produtoId && (
                  <div
                    style={{
                      marginBottom: "1.25rem",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--raio-pequeno)",
                      backgroundColor:
                        carregandoEstoque
                          ? "var(--fundo-secundario)"
                          : estoqueDisponivel !== null && estoqueDisponivel > 0
                          ? "rgba(16, 185, 129, 0.08)"
                          : "rgba(239, 68, 68, 0.08)",
                      border: `1px solid ${
                        carregandoEstoque
                          ? "var(--borda-suave)"
                          : estoqueDisponivel !== null && estoqueDisponivel > 0
                          ? "rgba(16, 185, 129, 0.25)"
                          : "rgba(239, 68, 68, 0.25)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                    data-testid="indicador-estoque-disponivel"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Package
                        size={18}
                        color={
                          carregandoEstoque
                            ? "var(--texto-mutado)"
                            : estoqueDisponivel !== null && estoqueDisponivel > 0
                            ? "#10b981"
                            : "#ef4444"
                        }
                      />
                      <span style={{ fontSize: "0.875rem", color: "var(--texto-corpo)", fontWeight: 500 }}>
                        Estoque disponível em tempo real:
                      </span>
                    </div>

                    <div>
                      {carregandoEstoque ? (
                        <span style={{ fontSize: "0.8125rem", color: "var(--texto-mutado)" }}>
                          Consultando...
                        </span>
                      ) : estoqueDisponivel !== null ? (
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.9375rem",
                            color: estoqueDisponivel > 0 ? "#10b981" : "#ef4444"
                          }}
                          data-testid="texto-estoque-disponivel"
                        >
                          {estoqueDisponivel} unidades
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Linha: Quantidade e Valor Unitário */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div className="grupo-campo">
                    <label htmlFor="quantidadeVenda" className="rotulo-campo">
                      Quantidade *
                    </label>
                    <input
                      id="quantidadeVenda"
                      type="number"
                      min="1"
                      step="1"
                      className={`input-texto ${
                        erros.quantidade || estoqueInsuficienteBloqueio ? "com-erro" : ""
                      }`}
                      placeholder="Ex: 5"
                      value={quantidade}
                      onChange={(e) => setQuantidade(e.target.value)}
                      disabled={salvando}
                      data-testid="input-quantidade-venda"
                    />
                    {erros.quantidade && (
                      <span className="mensagem-erro-campo">{erros.quantidade}</span>
                    )}
                    {estoqueInsuficienteBloqueio && !erros.quantidade && (
                      <span
                        className="mensagem-erro-campo"
                        data-testid="aviso-estoque-insuficiente"
                      >
                        Estoque insuficiente.
                      </span>
                    )}
                  </div>

                  <div className="grupo-campo">
                    <label htmlFor="valorUnitarioVenda" className="rotulo-campo">
                      Valor Unitário (R$) *
                    </label>
                    <input
                      id="valorUnitarioVenda"
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={`input-texto ${erros.valor_unitario ? "com-erro" : ""}`}
                      placeholder="Ex: 50,00"
                      value={valorUnitario}
                      onChange={(e) => setValorUnitario(e.target.value)}
                      disabled={salvando}
                      data-testid="input-valor-unitario-venda"
                    />
                    {erros.valor_unitario && (
                      <span className="mensagem-erro-campo">{erros.valor_unitario}</span>
                    )}
                  </div>
                </div>

                {/* Data da Venda */}
                <div className="grupo-campo" style={{ marginBottom: "1.25rem" }}>
                  <label htmlFor="dataVenda" className="rotulo-campo">
                    Data da Venda
                  </label>
                  <input
                    id="dataVenda"
                    type="date"
                    className="input-texto"
                    value={dataVenda}
                    onChange={(e) => setDataVenda(e.target.value)}
                    disabled={salvando}
                    data-testid="input-data-venda"
                  />
                </div>

                {/* Caixa de Prévia do Valor Total */}
                <div
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.08)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    borderRadius: "var(--raio-pequeno)",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "0.5rem"
                  }}
                >
                  <div>
                    <span style={{ display: "block", fontSize: "0.8125rem", color: "var(--texto-mutado)" }}>
                      Valor total (Prévia calculada)
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--texto-fraco)" }}>
                      Oficial recalculado no back-end
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "1.375rem",
                      fontWeight: 700,
                      color: previaValorTotal > 0 ? "var(--texto-titulo)" : "var(--texto-fraco)"
                    }}
                    data-testid="previa-valor-total"
                  >
                    {formatarMoeda(previaValorTotal)}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="rodape-modal">
            <button
              type="button"
              className="botao-secundario"
              onClick={aoFechar}
              disabled={salvando}
              data-testid="botao-cancelar-venda"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="botao-primario"
              disabled={
                salvando ||
                carregandoDados ||
                carregandoEstoque ||
                estoqueInsuficienteBloqueio
              }
              data-testid="botao-registrar-venda"
              title={estoqueInsuficienteBloqueio ? "Estoque insuficiente para a quantidade solicitada" : ""}
            >
              {salvando ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }}></div>
                  <span>Registrando venda...</span>
                </>
              ) : (
                <>
                  <DollarSign size={16} />
                  <span>Registrar venda</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
