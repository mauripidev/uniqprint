import React, { useEffect, useState } from "react";
import { AlertCircle, DollarSign, ShoppingCart, X } from "lucide-react";
import { z } from "zod";
import { registrarCompra } from "../../servicos/compras.js";
import { listarProdutos } from "../../servicos/produtos.js";
import { listarFornecedores } from "../../servicos/fornecedores.js";
import { Produto } from "../../tipos/produtos.js";
import { Fornecedor } from "../../tipos/fornecedores.js";
import { ErroRequisicaoApi } from "../../servicos/api.js";

const schemaRegistroCompra = z.object({
  fornecedor_id: z
    .string()
    .trim()
    .min(1, "Selecione um fornecedor")
    .refine((v) => Number(v) > 0, "Selecione um fornecedor"),
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
  data_compra: z.string().optional()
});

interface PropriedadesModalRegistroCompra {
  aberto: boolean;
  aoFechar: () => void;
  aoRegistrarComSucesso: (mensagem: string) => void;
}

export const ModalRegistroCompra: React.FC<PropriedadesModalRegistroCompra> = ({
  aberto,
  aoFechar,
  aoRegistrarComSucesso
}) => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregandoDados, setCarregandoDados] = useState<boolean>(false);

  const [fornecedorId, setFornecedorId] = useState<string>("");
  const [produtoId, setProdutoId] = useState<string>("");
  const [quantidade, setQuantidade] = useState<string>("");
  const [valorUnitario, setValorUnitario] = useState<string>("");
  const [dataCompra, setDataCompra] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<boolean>(false);

  // Carregar produtos e fornecedores ativos
  useEffect(() => {
    if (!aberto) return;

    const carregarOpcoes = async () => {
      setCarregandoDados(true);
      try {
        const [resFornecedores, resProdutos] = await Promise.all([
          listarFornecedores({ ativo: "true", limite: 100 }),
          listarProdutos({ ativo: "true", limite: 100 })
        ]);
        setFornecedores(resFornecedores.dados);
        setProdutos(resProdutos.dados);
      } catch {
        setErroGeral("Erro ao carregar lista de produtos e fornecedores ativos.");
      } finally {
        setCarregandoDados(false);
      }
    };

    carregarOpcoes();

    // Resetar formulário
    setFornecedorId("");
    setProdutoId("");
    setQuantidade("");
    setValorUnitario("");
    setDataCompra(new Date().toISOString().split("T")[0]);
    setErros({});
    setErroGeral(null);
  }, [aberto]);

  if (!aberto) return null;

  // Cálculo da prévia em tempo real
  const qtdNum = Number(quantidade) || 0;
  const valUnitNum = Number(valorUnitario.replace(",", ".")) || 0;
  const previaValorTotal = qtdNum > 0 && valUnitNum > 0 ? qtdNum * valUnitNum : 0;

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

    const validacao = schemaRegistroCompra.safeParse({
      fornecedor_id: fornecedorId,
      produto_id: produtoId,
      quantidade,
      valor_unitario: valorUnitario.replace(",", "."),
      data_compra: dataCompra || undefined
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

    setSalvando(true);

    try {
      await registrarCompra({
        fornecedor_id: Number(validacao.data.fornecedor_id),
        produto_id: Number(validacao.data.produto_id),
        quantidade: Number(validacao.data.quantidade),
        valor_unitario: Number(validacao.data.valor_unitario.replace(",", ".")),
        data_compra: validacao.data.data_compra
      });

      aoRegistrarComSucesso(
        "Compra registrada com sucesso. Estoque atualizado."
      );
    } catch (erro: any) {
      if (erro instanceof ErroRequisicaoApi) {
        setErroGeral(erro.message);
        if (erro.campos) {
          const camposErro: Record<string, string> = {};
          for (const [campo, msgs] of Object.entries(erro.campos)) {
            camposErro[campo] = msgs[0];
          }
          setErros(camposErro);
        }
      } else {
        setErroGeral(
          "Não foi possível registrar a compra. Nenhuma alteração foi realizada."
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
            <ShoppingCart size={20} color="var(--primaria)" />
            <h3 className="titulo-modal">Nova Compra</h3>
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
                data-testid="alerta-erro-compra"
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
                {/* Seleção de Fornecedor */}
                <div className="grupo-campo" style={{ marginBottom: "1.25rem" }}>
                  <label htmlFor="fornecedorCompra" className="rotulo-campo">
                    Fornecedor *
                  </label>
                  <select
                    id="fornecedorCompra"
                    className={`input-texto ${erros.fornecedor_id ? "com-erro" : ""}`}
                    value={fornecedorId}
                    onChange={(e) => setFornecedorId(e.target.value)}
                    disabled={salvando}
                    data-testid="select-fornecedor-compra"
                  >
                    <option value="">Selecione um fornecedor...</option>
                    {fornecedores.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome}
                      </option>
                    ))}
                  </select>
                  {erros.fornecedor_id && (
                    <span className="mensagem-erro-campo">{erros.fornecedor_id}</span>
                  )}
                </div>

                {/* Seleção de Produto */}
                <div className="grupo-campo" style={{ marginBottom: "1.25rem" }}>
                  <label htmlFor="produtoCompra" className="rotulo-campo">
                    Produto *
                  </label>
                  <select
                    id="produtoCompra"
                    className={`input-texto ${erros.produto_id ? "com-erro" : ""}`}
                    value={produtoId}
                    onChange={(e) => setProdutoId(e.target.value)}
                    disabled={salvando}
                    data-testid="select-produto-compra"
                  >
                    <option value="">Selecione um produto...</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.descricao} (Estoque atual: {p.quantidade_estoque})
                      </option>
                    ))}
                  </select>
                  {erros.produto_id && (
                    <span className="mensagem-erro-campo">{erros.produto_id}</span>
                  )}
                </div>

                {/* Linha: Quantidade e Valor Unitário */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div className="grupo-campo">
                    <label htmlFor="quantidadeCompra" className="rotulo-campo">
                      Quantidade *
                    </label>
                    <input
                      id="quantidadeCompra"
                      type="number"
                      min="1"
                      step="1"
                      className={`input-texto ${erros.quantidade ? "com-erro" : ""}`}
                      placeholder="Ex: 10"
                      value={quantidade}
                      onChange={(e) => setQuantidade(e.target.value)}
                      disabled={salvando}
                      data-testid="input-quantidade-compra"
                    />
                    {erros.quantidade && (
                      <span className="mensagem-erro-campo">{erros.quantidade}</span>
                    )}
                  </div>

                  <div className="grupo-campo">
                    <label htmlFor="valorUnitarioCompra" className="rotulo-campo">
                      Valor Unitário (R$) *
                    </label>
                    <input
                      id="valorUnitarioCompra"
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={`input-texto ${erros.valor_unitario ? "com-erro" : ""}`}
                      placeholder="Ex: 25,50"
                      value={valorUnitario}
                      onChange={(e) => setValorUnitario(e.target.value)}
                      disabled={salvando}
                      data-testid="input-valor-unitario-compra"
                    />
                    {erros.valor_unitario && (
                      <span className="mensagem-erro-campo">{erros.valor_unitario}</span>
                    )}
                  </div>
                </div>

                {/* Data da Compra */}
                <div className="grupo-campo" style={{ marginBottom: "1.25rem" }}>
                  <label htmlFor="dataCompra" className="rotulo-campo">
                    Data da Compra
                  </label>
                  <input
                    id="dataCompra"
                    type="date"
                    className="input-texto"
                    value={dataCompra}
                    onChange={(e) => setDataCompra(e.target.value)}
                    disabled={salvando}
                    data-testid="input-data-compra"
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
              data-testid="botao-cancelar-compra"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="botao-primario"
              disabled={salvando || carregandoDados}
              data-testid="botao-registrar-compra"
            >
              {salvando ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }}></div>
                  <span>Registrando compra...</span>
                </>
              ) : (
                <>
                  <DollarSign size={16} />
                  <span>Registrar compra</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
