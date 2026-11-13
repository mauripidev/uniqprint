import React, { useEffect, useState } from "react";
import { AlertCircle, Truck, X } from "lucide-react";
import { z } from "zod";
import { Fornecedor } from "../../tipos/fornecedores.js";
import { criarFornecedor, atualizarFornecedor } from "../../servicos/fornecedores.js";
import { ErroRequisicaoApi } from "../../servicos/api.js";

const schemaFornecedor = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "O nome do fornecedor é obrigatório"),
  observacao: z.string().trim().optional()
});

interface PropriedadesModalFormularioFornecedor {
  aberto: boolean;
  fornecedorParaEdicao: Fornecedor | null;
  aoFechar: () => void;
  aoSalvarComSucesso: () => void;
}

export const ModalFormularioFornecedor: React.FC<PropriedadesModalFormularioFornecedor> = ({
  aberto,
  fornecedorParaEdicao,
  aoFechar,
  aoSalvarComSucesso
}) => {
  const [nome, setNome] = useState<string>("");
  const [observacao, setObservacao] = useState<string>("");
  const [ativo, setAtivo] = useState<boolean>(true);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<boolean>(false);

  useEffect(() => {
    if (fornecedorParaEdicao) {
      setNome(fornecedorParaEdicao.nome);
      setObservacao(fornecedorParaEdicao.observacao || "");
      setAtivo(fornecedorParaEdicao.ativo);
    } else {
      setNome("");
      setObservacao("");
      setAtivo(true);
    }
    setErros({});
    setErroGeral(null);
  }, [fornecedorParaEdicao, aberto]);

  if (!aberto) return null;

  const manipularEnvio = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErros({});
    setErroGeral(null);

    const resultado = schemaFornecedor.safeParse({
      nome,
      observacao: observacao || undefined
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
      if (fornecedorParaEdicao) {
        await atualizarFornecedor(fornecedorParaEdicao.id, {
          nome: resultado.data.nome,
          observacao: resultado.data.observacao,
          ativo
        });
      } else {
        await criarFornecedor({
          nome: resultado.data.nome,
          observacao: resultado.data.observacao
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
        setErroGeral("Ocorreu um erro ao salvar o fornecedor. Tente novamente.");
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
            <Truck size={20} color="var(--primaria)" />
            <h3 className="titulo-modal">
              {fornecedorParaEdicao ? "Editar Fornecedor" : "Novo Fornecedor"}
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
              <label htmlFor="nomeFornecedor" className="rotulo-campo">
                Nome do Fornecedor / Razão Social *
              </label>
              <input
                id="nomeFornecedor"
                type="text"
                className={`input-texto ${erros.nome ? "com-erro" : ""}`}
                style={{ paddingLeft: "1rem" }}
                placeholder="Ex: Distribuidora Nacional de Papéis Ltda"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={salvando}
                autoFocus
              />
              {erros.nome && (
                <span className="mensagem-erro-campo">{erros.nome}</span>
              )}
            </div>

            <div className="grupo-campo" style={{ marginBottom: "1.25rem" }}>
              <label htmlFor="observacaoFornecedor" className="rotulo-campo">
                Observações / Informações de Contato
              </label>
              <textarea
                id="observacaoFornecedor"
                className={`input-texto ${erros.observacao ? "com-erro" : ""}`}
                style={{
                  paddingLeft: "1rem",
                  paddingTop: "0.75rem",
                  minHeight: "80px",
                  resize: "vertical",
                  fontFamily: "inherit"
                }}
                placeholder="Ex: Contato comercial: contato@fornecedor.com.br / (11) 98888-7777 - Condição 30 dias"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                disabled={salvando}
              />
              {erros.observacao && (
                <span className="mensagem-erro-campo">{erros.observacao}</span>
              )}
            </div>

            {fornecedorParaEdicao && (
              <div className="grupo-campo" style={{ marginBottom: "1.25rem" }}>
                <label
                  className="rotulo-campo"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    disabled={salvando}
                    style={{
                      width: "18px",
                      height: "18px",
                      accentColor: "var(--primaria)"
                    }}
                  />
                  <span>Fornecedor Ativo no Sistema</span>
                </label>
                <span
                  style={{ fontSize: "0.8125rem", color: "var(--texto-mutado)" }}
                >
                  Fornecedores inativos não podem ser vinculados a novas compras.
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
              data-testid="botao-salvar-fornecedor"
              style={{ width: "auto", minWidth: "120px", marginTop: 0 }}
            >
              {salvando ? (
                <>
                  <div className="spinner" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Fornecedor</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
