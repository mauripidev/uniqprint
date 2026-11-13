import React, { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { servicoFinanceiro } from "../../servicos/financeiro.js";
import { DadosCriarLancamentoFinanceiro, LancamentoFinanceiro } from "../../tipos/financeiro.js";

interface Props {
  aoFechar: () => void;
  aoSalvar: (mensagem: string) => void;
  lancamentoParaEditar?: LancamentoFinanceiro;
}

export const ModalLancamentoFinanceiro: React.FC<Props> = ({
  aoFechar,
  aoSalvar,
  lancamentoParaEditar
}) => {
  const [tipo, setTipo] = useState<"ENTRADA" | "SAIDA">(
    lancamentoParaEditar?.tipo || "ENTRADA"
  );
  const [descricao, setDescricao] = useState(lancamentoParaEditar?.descricao || "");
  const [valor, setValor] = useState(
    lancamentoParaEditar ? String(lancamentoParaEditar.valor) : ""
  );
  const [categoria, setCategoria] = useState(lancamentoParaEditar?.categoria || "");
  const [dataLancamento, setDataLancamento] = useState(
    lancamentoParaEditar
      ? new Date(lancamentoParaEditar.data_lancamento).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [observacao, setObservacao] = useState(lancamentoParaEditar?.observacao || "");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const lidarComSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    const valorNumerico = parseFloat(valor.replace(",", "."));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro("Valor inválido. O valor deve ser maior que zero.");
      return;
    }

    if (descricao.trim().length < 3) {
      setErro("A descrição deve ter pelo menos 3 caracteres.");
      return;
    }

    if (categoria.trim().length < 2) {
      setErro("A categoria deve ter pelo menos 2 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      const dados: DadosCriarLancamentoFinanceiro = {
        tipo,
        descricao: descricao.trim(),
        valor: valorNumerico,
        categoria: categoria.trim(),
        data_lancamento: dataLancamento,
        observacao: observacao.trim() || undefined
      };

      if (lancamentoParaEditar) {
        await servicoFinanceiro.atualizar(lancamentoParaEditar.id, dados);
        aoSalvar("Lançamento atualizado com sucesso.");
      } else {
        await servicoFinanceiro.criar(dados);
        aoSalvar("Lançamento manual registrado com sucesso.");
      }
    } catch (err: any) {
      const msgErro =
        err.response?.data?.erro?.mensagem ||
        err.response?.data?.mensagem ||
        err.message ||
        "Não foi possível salvar o lançamento.";
      setErro(msgErro);
    } finally {
      setCarregando(false);
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
        <header className="cabecalho-modal">
          <div className="icone-modal-titulo">
            <h3 className="titulo-modal">
              {lancamentoParaEditar ? "Editar Lançamento" : "Novo Lançamento Manual"}
            </h3>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="botao-fechar-modal"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </header>

        {erro && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              backgroundColor: "var(--erro-fundo)",
              borderBottom: "1px solid var(--erro-borda)",
              color: "var(--erro)",
              fontSize: "0.875rem"
            }}
            data-testid="alerta-erro-modal"
          >
            <AlertCircle size={16} />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={lidarComSubmit}>
          <div className="corpo-modal" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "var(--texto-corpo)"
                }}
              >
                Tipo de Lançamento
              </label>
              <div style={{ display: "flex", gap: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="tipo"
                    value="ENTRADA"
                    checked={tipo === "ENTRADA"}
                    onChange={() => setTipo("ENTRADA")}
                    disabled={!!lancamentoParaEditar || carregando}
                    data-testid="radio-tipo-entrada"
                  />
                  <span>Entrada</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="tipo"
                    value="SAIDA"
                    checked={tipo === "SAIDA"}
                    onChange={() => setTipo("SAIDA")}
                    disabled={!!lancamentoParaEditar || carregando}
                    data-testid="radio-tipo-saida"
                  />
                  <span>Saída</span>
                </label>
              </div>
            </div>

            <div>
              <label
                htmlFor="campo-descricao"
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  marginBottom: "0.35rem",
                  color: "var(--texto-corpo)"
                }}
              >
                Descrição *
              </label>
              <input
                id="campo-descricao"
                type="text"
                className="campo-texto"
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Aluguel da sede, Conta de Luz"
                disabled={carregando}
                data-testid="input-descricao"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label
                  htmlFor="campo-valor"
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    marginBottom: "0.35rem",
                    color: "var(--texto-corpo)"
                  }}
                >
                  Valor (R$) *
                </label>
                <input
                  id="campo-valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="campo-texto"
                  required
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  disabled={carregando}
                  data-testid="input-valor"
                />
              </div>

              <div>
                <label
                  htmlFor="campo-data"
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    marginBottom: "0.35rem",
                    color: "var(--texto-corpo)"
                  }}
                >
                  Data *
                </label>
                <input
                  id="campo-data"
                  type="date"
                  className="campo-texto"
                  required
                  value={dataLancamento}
                  onChange={(e) => setDataLancamento(e.target.value)}
                  disabled={carregando}
                  data-testid="input-data"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="campo-categoria"
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  marginBottom: "0.35rem",
                  color: "var(--texto-corpo)"
                }}
              >
                Categoria *
              </label>
              <input
                id="campo-categoria"
                type="text"
                className="campo-texto"
                required
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ex: Aluguel, Contas, Recebimentos"
                disabled={carregando}
                data-testid="input-categoria"
              />
            </div>

            <div>
              <label
                htmlFor="campo-observacao"
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  marginBottom: "0.35rem",
                  color: "var(--texto-corpo)"
                }}
              >
                Observação (Opcional)
              </label>
              <textarea
                id="campo-observacao"
                className="campo-texto"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observações complementares..."
                rows={2}
                disabled={carregando}
                data-testid="textarea-observacao"
              />
            </div>
          </div>

          <footer className="rodape-modal">
            <button
              type="button"
              className="botao-secundario"
              onClick={aoFechar}
              disabled={carregando}
              data-testid="botao-cancelar-modal-financeiro"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="botao-primario"
              disabled={carregando}
              data-testid="botao-salvar-modal-financeiro"
            >
              {carregando ? "Salvando lançamento..." : "Salvar"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
