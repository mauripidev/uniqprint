import React, { useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, ArrowRight, Loader2, Sliders, X } from "lucide-react";
import { registrarAjuste } from "../../servicos/estoque.js";
import { ItemEstoque } from "../../tipos/estoque.js";

interface ModalAjusteEstoqueProps {
  produto: ItemEstoque;
  aoFechar: () => void;
  aoSucesso: (mensagem: string) => void;
}

export const ModalAjusteEstoque: React.FC<ModalAjusteEstoqueProps> = ({
  produto,
  aoFechar,
  aoSucesso
}) => {
  const [tipoAjuste, setTipoAjuste] = useState<"ENTRADA" | "SAIDA">("ENTRADA");
  const [quantidadeStr, setQuantidadeStr] = useState<string>("1");
  const [observacao, setObservacao] = useState<string>("");
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const quantidade = parseInt(quantidadeStr, 10) || 0;
  const estoqueAtual = produto.quantidade_estoque;
  const novoEstoque =
    tipoAjuste === "ENTRADA"
      ? estoqueAtual + (quantidade > 0 ? quantidade : 0)
      : estoqueAtual - (quantidade > 0 ? quantidade : 0);

  const estoqueInsuficiente = tipoAjuste === "SAIDA" && quantidade > estoqueAtual;

  const lidarComEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (quantidade <= 0) {
      setErro("A quantidade deve ser um número inteiro maior que zero.");
      return;
    }

    if (estoqueInsuficiente) {
      setErro("Estoque insuficiente para este ajuste. A quantidade não pode exceder o estoque atual.");
      return;
    }

    if (!observacao.trim() || observacao.trim().length < 3) {
      setErro("A justificativa é obrigatória e deve conter pelo menos 3 caracteres.");
      return;
    }

    setSalvando(true);
    try {
      await registrarAjuste({
        produto_id: produto.id,
        tipo_ajuste: tipoAjuste,
        quantidade,
        observacao: observacao.trim()
      });

      aoSucesso(`Ajuste de estoque realizado com sucesso para "${produto.descricao}"!`);
      aoFechar();
    } catch (err: any) {
      setErro(err.message || "Erro ao registrar ajuste de estoque.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="envoltura-modal-backdrop" data-testid="modal-ajuste-estoque">
      <div className="conteudo-modal-largo">
        {/* Cabeçalho */}
        <div className="cabecalho-modal">
          <div className="icone-modal-titulo">
            <Sliders size={20} color="var(--cor-primaria, #60a5fa)" />
            <h2 className="titulo-modal">Ajuste Manual de Estoque</h2>
          </div>
          <button
            type="button"
            className="botao-fechar-modal"
            onClick={aoFechar}
            data-testid="botao-fechar-modal-ajuste"
            disabled={salvando}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={lidarComEnvio}>
          <div className="corpo-modal">
            {erro && (
              <div
                className="alerta-erro"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  marginBottom: "1rem",
                  backgroundColor: "var(--erro-fundo)",
                  border: "1px solid var(--erro-borda)",
                  borderRadius: "var(--raio-pequeno)",
                  color: "var(--erro)",
                  fontSize: "0.875rem"
                }}
                data-testid="alerta-erro-modal"
              >
                <AlertCircle size={16} />
                <span>{erro}</span>
              </div>
            )}

            {/* Informações do Produto */}
            <div
              style={{
                padding: "0.875rem 1rem",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--borda-suave)",
                borderRadius: "var(--raio-pequeno)",
                marginBottom: "1.25rem"
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "var(--texto-mutado)", marginBottom: "0.25rem" }}>
                Produto selecionado:
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--texto-titulo)" }} data-testid="produto-descricao-ajuste">
                {produto.descricao}
              </div>
            </div>

            {/* Segmented Control - Tipo de Ajuste */}
            <div className="campo-formulario" style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.8125rem", color: "var(--texto-corpo)", fontWeight: 600, marginBottom: "0.5rem", display: "block" }}>
                Tipo de Ajuste
              </label>
              <div className="seletor-tipo-ajuste">
                <button
                  type="button"
                  className={`botao-opcao-ajuste ${tipoAjuste === "ENTRADA" ? "ativo-entrada" : ""}`}
                  onClick={() => setTipoAjuste("ENTRADA")}
                  data-testid="opcao-ajuste-entrada"
                >
                  <ArrowUp size={16} />
                  <span>Entrada (+)</span>
                </button>
                <button
                  type="button"
                  className={`botao-opcao-ajuste ${tipoAjuste === "SAIDA" ? "ativo-saida" : ""}`}
                  onClick={() => setTipoAjuste("SAIDA")}
                  data-testid="opcao-ajuste-saida"
                >
                  <ArrowDown size={16} />
                  <span>Saída (-)</span>
                </button>
              </div>
            </div>

            {/* Quantidade */}
            <div className="campo-formulario" style={{ marginBottom: "1rem" }}>
              <label htmlFor="quantidadeAjuste" style={{ fontSize: "0.8125rem", color: "var(--texto-corpo)", fontWeight: 600, marginBottom: "0.35rem", display: "block" }}>
                Quantidade do Ajuste
              </label>
              <input
                id="quantidadeAjuste"
                type="number"
                min="1"
                step="1"
                className="input-texto"
                value={quantidadeStr}
                onChange={(e) => setQuantidadeStr(e.target.value)}
                placeholder="Ex: 5"
                required
                data-testid="input-quantidade-ajuste"
              />
            </div>

            {/* Painel Prévia em Tempo Real */}
            <div className="painel-previa-estoque" data-testid="painel-previa-estoque">
              <div className="previa-bloco">
                <span className="previa-rotulo">Estoque Atual</span>
                <span className="previa-numero-atual" data-testid="previa-estoque-atual">
                  {estoqueAtual} un
                </span>
              </div>
              <ArrowRight size={20} className="previa-separador-seta" />
              <div className="previa-bloco" style={{ alignItems: "flex-end" }}>
                <span className="previa-rotulo">Novo Saldo Estimado</span>
                <span
                  className={`previa-numero-novo ${estoqueInsuficiente ? "invalido" : "valido"}`}
                  data-testid="previa-novo-estoque"
                >
                  {novoEstoque} un
                </span>
              </div>
            </div>

            {estoqueInsuficiente && (
              <div
                style={{
                  color: "var(--erro)",
                  fontSize: "0.8125rem",
                  marginTop: "-0.75rem",
                  marginBottom: "1rem"
                }}
                data-testid="alerta-estoque-insuficiente"
              >
                Atenção: A saída é maior que o estoque atual disponível ({estoqueAtual} un).
              </div>
            )}

            {/* Justificativa / Observação */}
            <div className="campo-formulario">
              <label htmlFor="observacaoAjuste" style={{ fontSize: "0.8125rem", color: "var(--texto-corpo)", fontWeight: 600, marginBottom: "0.35rem", display: "block" }}>
                Justificativa / Observação *
              </label>
              <textarea
                id="observacaoAjuste"
                className="input-texto"
                rows={3}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Correção de inventário anual / Quebra de material / Doação..."
                required
                data-testid="input-observacao-ajuste"
                style={{ resize: "vertical", minHeight: "70px" }}
              />
            </div>
          </div>

          {/* Rodapé com botões de ação */}
          <div className="rodape-modal">
            <button
              type="button"
              className="botao-secundario"
              onClick={aoFechar}
              disabled={salvando}
              data-testid="botao-cancelar-ajuste"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="botao-primario"
              disabled={salvando || estoqueInsuficiente || quantidade <= 0}
              data-testid="botao-confirmar-ajuste"
            >
              {salvando ? (
                <>
                  <Loader2 size={16} className="animacao-girar" />
                  <span>Registrando...</span>
                </>
              ) : (
                <span>Confirmar Ajuste</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
