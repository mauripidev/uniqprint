import React, { useEffect, useState } from "react";
import { AlertCircle, User, X } from "lucide-react";
import { z } from "zod";
import { Cliente } from "../../tipos/clientes.js";
import { criarCliente, atualizarCliente } from "../../servicos/clientes.js";
import { ErroRequisicaoApi } from "../../servicos/api.js";

const schemaCliente = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "O nome do cliente é obrigatório"),
  telefone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const digitos = val.replace(/\D/g, "");
        return digitos.length >= 8 && digitos.length <= 13;
      },
      { message: "Telefone inválido" }
    ),
  observacao: z.string().trim().optional()
});

interface PropriedadesModalFormularioCliente {
  aberto: boolean;
  clienteParaEdicao: Cliente | null;
  aoFechar: () => void;
  aoSalvarComSucesso: () => void;
}

export const ModalFormularioCliente: React.FC<PropriedadesModalFormularioCliente> = ({
  aberto,
  clienteParaEdicao,
  aoFechar,
  aoSalvarComSucesso
}) => {
  const [nome, setNome] = useState<string>("");
  const [telefone, setTelefone] = useState<string>("");
  const [observacao, setObservacao] = useState<string>("");
  const [ativo, setAtivo] = useState<boolean>(true);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<boolean>(false);

  useEffect(() => {
    if (clienteParaEdicao) {
      setNome(clienteParaEdicao.nome);
      setTelefone(clienteParaEdicao.telefone || "");
      setObservacao(clienteParaEdicao.observacao || "");
      setAtivo(clienteParaEdicao.ativo);
    } else {
      setNome("");
      setTelefone("");
      setObservacao("");
      setAtivo(true);
    }
    setErros({});
    setErroGeral(null);
  }, [clienteParaEdicao, aberto]);

  if (!aberto) return null;

  const manipularEnvio = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErros({});
    setErroGeral(null);

    const resultado = schemaCliente.safeParse({
      nome,
      telefone: telefone || undefined,
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
      if (clienteParaEdicao) {
        await atualizarCliente(clienteParaEdicao.id, {
          nome: resultado.data.nome,
          telefone: resultado.data.telefone,
          observacao: resultado.data.observacao,
          ativo
        });
      } else {
        await criarCliente({
          nome: resultado.data.nome,
          telefone: resultado.data.telefone,
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
        setErroGeral("Ocorreu um erro ao salvar o cliente. Tente novamente.");
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
            <User size={20} color="var(--primaria)" />
            <h3 className="titulo-modal">
              {clienteParaEdicao ? "Editar Cliente" : "Novo Cliente"}
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
              <label htmlFor="nomeCliente" className="rotulo-campo">
                Nome do Cliente / Razão Social *
              </label>
              <input
                id="nomeCliente"
                type="text"
                className={`input-texto ${erros.nome ? "com-erro" : ""}`}
                style={{ paddingLeft: "1rem" }}
                placeholder="Ex: Gráfica & Editora Central Ltda"
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
              <label htmlFor="telefoneCliente" className="rotulo-campo">
                Telefone / Celular
              </label>
              <input
                id="telefoneCliente"
                type="text"
                className={`input-texto ${erros.telefone ? "com-erro" : ""}`}
                style={{ paddingLeft: "1rem" }}
                placeholder="Ex: (11) 98888-7777"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                disabled={salvando}
              />
              {erros.telefone && (
                <span className="mensagem-erro-campo">{erros.telefone}</span>
              )}
            </div>

            <div className="grupo-campo" style={{ marginBottom: "1.25rem" }}>
              <label htmlFor="observacaoCliente" className="rotulo-campo">
                Observações / Informações Adicionais
              </label>
              <textarea
                id="observacaoCliente"
                className={`input-texto ${erros.observacao ? "com-erro" : ""}`}
                style={{
                  paddingLeft: "1rem",
                  paddingTop: "0.75rem",
                  minHeight: "80px",
                  resize: "vertical",
                  fontFamily: "inherit"
                }}
                placeholder="Ex: Contato financeiro: financeiro@cliente.com.br - Condição faturamento mensal"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                disabled={salvando}
              />
              {erros.observacao && (
                <span className="mensagem-erro-campo">{erros.observacao}</span>
              )}
            </div>

            {clienteParaEdicao && (
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
                  <span>Cliente Ativo no Sistema</span>
                </label>
                <span
                  style={{ fontSize: "0.8125rem", color: "var(--texto-mutado)" }}
                >
                  Clientes inativos não podem ser vinculados a novas vendas.
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
              data-testid="botao-salvar-cliente"
              style={{ width: "auto", minWidth: "120px", marginTop: 0 }}
            >
              {salvando ? (
                <>
                  <div className="spinner" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Cliente</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
