import React, { useEffect, useState } from "react";
import { AlertCircle, Package, X } from "lucide-react";
import { z } from "zod";
import { Produto } from "../../tipos/produtos.js";
import { criarProduto, atualizarProduto } from "../../servicos/produtos.js";
import { ErroRequisicaoApi } from "../../servicos/api.js";

const schemaProduto = z.object({
  descricao: z
    .string()
    .trim()
    .min(1, "A descrição do produto é obrigatória"),
  quantidade_estoque: z.coerce
    .number()
    .int("A quantidade de estoque deve ser um número inteiro")
    .min(0, "A quantidade de estoque não pode ser negativa")
    .default(0)
});

interface PropriedadesModalFormularioProduto {
  aberto: boolean;
  produtoParaEdicao: Produto | null;
  aoFechar: () => void;
  aoSalvarComSucesso: () => void;
}

export const ModalFormularioProduto: React.FC<PropriedadesModalFormularioProduto> = ({
  aberto,
  produtoParaEdicao,
  aoFechar,
  aoSalvarComSucesso
}) => {
  const [descricao, setDescricao] = useState<string>("");
  const [quantidadeEstoque, setQuantidadeEstoque] = useState<number>(0);
  const [ativo, setAtivo] = useState<boolean>(true);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<boolean>(false);

  useEffect(() => {
    if (produtoParaEdicao) {
      setDescricao(produtoParaEdicao.descricao);
      setQuantidadeEstoque(produtoParaEdicao.quantidade_estoque);
      setAtivo(produtoParaEdicao.ativo);
    } else {
      setDescricao("");
      setQuantidadeEstoque(0);
      setAtivo(true);
    }
    setErros({});
    setErroGeral(null);
  }, [produtoParaEdicao, aberto]);

  if (!aberto) return null;

  const manipularEnvio = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErros({});
    setErroGeral(null);

    const resultado = schemaProduto.safeParse({
      descricao,
      quantidade_estoque: quantidadeEstoque
    });

    if (!resultado.success) {
      const errosMapeados: Record<string, string> = {};
      resultado.error.errors.forEach((err) => {
        if (err.path[0]) {
          errosMapeados[err.path[0].toString()] = err.message;
        }
      });
      setErros(errosMapeados);
      return;
    }

    setSalvando(true);

    try {
      if (produtoParaEdicao) {
        await atualizarProduto(produtoParaEdicao.id, {
          descricao: resultado.data.descricao,
          ativo
        });
      } else {
        await criarProduto({
          descricao: resultado.data.descricao,
          quantidade_estoque: resultado.data.quantidade_estoque
        });
      }
      aoSalvarComSucesso();
    } catch (erro) {
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
        setErroGeral("Ocorreu um erro ao salvar o produto. Tente novamente.");
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="envoltura-modal-backdrop" onClick={aoFechar}>
      <div
        className="conteudo-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="cabecalho-modal">
          <div className="icone-modal-titulo">
            <Package size={20} color="var(--primaria)" />
            <h3 className="titulo-modal">
              {produtoParaEdicao ? "Editar Produto" : "Novo Produto"}
            </h3>
          </div>
          <button
            type="button"
            className="botao-fechar-modal"
            onClick={aoFechar}
            aria-label="Fechar formulário"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={manipularEnvio} noValidate>
          <div className="corpo-modal">
            {erroGeral && (
              <div className="alerta-erro-geral" style={{ marginBottom: "1rem" }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{erroGeral}</span>
              </div>
            )}

            <div className="grupo-campo" style={{ marginBottom: "1.25rem" }}>
              <label htmlFor="descricao" className="rotulo-campo">
                Descrição do Produto *
              </label>
              <input
                id="descricao"
                type="text"
                className={`input-texto ${erros.descricao ? "com-erro" : ""}`}
                style={{ paddingLeft: "1rem" }}
                placeholder="Ex: Papel Sulfite A4 75g"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={salvando}
                autoFocus
              />
              {erros.descricao && (
                <span className="mensagem-erro-campo">{erros.descricao}</span>
              )}
            </div>

            {!produtoParaEdicao && (
              <div className="grupo-campo" style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="quantidadeEstoque" className="rotulo-campo">
                  Estoque Inicial
                </label>
                <input
                  id="quantidadeEstoque"
                  type="number"
                  min="0"
                  step="1"
                  className={`input-texto ${erros.quantidade_estoque ? "com-erro" : ""}`}
                  style={{ paddingLeft: "1rem" }}
                  value={quantidadeEstoque}
                  onChange={(e) => setQuantidadeEstoque(Number(e.target.value))}
                  disabled={salvando}
                />
                {erros.quantidade_estoque && (
                  <span className="mensagem-erro-campo">
                    {erros.quantidade_estoque}
                  </span>
                )}
              </div>
            )}

            {produtoParaEdicao && (
              <div className="grupo-campo" style={{ marginBottom: "1.25rem" }}>
                <label className="rotulo-campo" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    disabled={salvando}
                    style={{ width: "18px", height: "18px", accentColor: "var(--primaria)" }}
                  />
                  <span>Produto Ativo no Sistema</span>
                </label>
                <span style={{ fontSize: "0.8125rem", color: "var(--texto-mutado)" }}>
                  Produtos inativos não podem ser selecionados para novas compras ou vendas.
                </span>
              </div>
            )}
          </div>

          <div className="rodape-modal">
            <button
              type="button"
              className="botao-secundario"
              onClick={aoFechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="botao-primario"
              disabled={salvando}
              data-testid="botao-salvar-produto"
              style={{ width: "auto", minWidth: "120px", marginTop: 0 }}
            >
              {salvando ? (
                <>
                  <div className="spinner" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Produto</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
