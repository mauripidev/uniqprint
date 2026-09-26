import React, { useState } from "react";
import { X } from "lucide-react";
import { servicoFinanceiro } from "../../servicos/financeiro";
import { DadosCriarLancamentoFinanceiro, LancamentoFinanceiro } from "../../tipos/financeiro";

interface Props {
  aoFechar: () => void;
  aoSalvar: () => void;
  lancamentoParaEditar?: LancamentoFinanceiro;
}

export const ModalLancamentoFinanceiro: React.FC<Props> = ({ aoFechar, aoSalvar, lancamentoParaEditar }) => {
  const [tipo, setTipo] = useState<"ENTRADA" | "SAIDA">(lancamentoParaEditar?.tipo || "ENTRADA");
  const [descricao, setDescricao] = useState(lancamentoParaEditar?.descricao || "");
  const [valor, setValor] = useState(lancamentoParaEditar ? lancamentoParaEditar.valor.toString() : "");
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
    setCarregando(true);

    try {
      const valorNum = parseFloat(valor);
      if (isNaN(valorNum) || valorNum <= 0) {
        throw new Error("O valor deve ser maior que zero.");
      }

      const dados: DadosCriarLancamentoFinanceiro = {
        tipo,
        descricao,
        valor: valorNum,
        categoria,
        data_lancamento: dataLancamento,
        observacao
      };

      if (lancamentoParaEditar) {
        await servicoFinanceiro.atualizar(lancamentoParaEditar.id, dados);
      } else {
        await servicoFinanceiro.criar(dados);
      }
      
      aoSalvar();
    } catch (err: any) {
      setErro(err.response?.data?.mensagem || err.message || "Erro ao salvar o lançamento.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="overlay-modal">
      <div className="conteudo-modal">
        <header className="cabecalho-modal">
          <h2>{lancamentoParaEditar ? "Editar Lançamento" : "Novo Lançamento Manual"}</h2>
          <button onClick={aoFechar} className="botao-fechar-modal">
            <X size={20} />
          </button>
        </header>

        {erro && <div className="mensagem-erro">{erro}</div>}

        <form onSubmit={lidarComSubmit} className="formulario-modal">
          <div className="grupo-form">
            <label>Tipo de Lançamento</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label>
                <input
                  type="radio"
                  name="tipo"
                  value="ENTRADA"
                  checked={tipo === "ENTRADA"}
                  onChange={() => setTipo("ENTRADA")}
                  disabled={!!lancamentoParaEditar}
                />
                Entrada
              </label>
              <label>
                <input
                  type="radio"
                  name="tipo"
                  value="SAIDA"
                  checked={tipo === "SAIDA"}
                  onChange={() => setTipo("SAIDA")}
                  disabled={!!lancamentoParaEditar}
                />
                Saída
              </label>
            </div>
          </div>

          <div className="grupo-form">
            <label>Descrição</label>
            <input
              type="text"
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Pagamento de Luz"
            />
          </div>

          <div className="grupo-form">
            <label>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="grupo-form">
            <label>Data</label>
            <input
              type="date"
              required
              value={dataLancamento}
              onChange={(e) => setDataLancamento(e.target.value)}
            />
          </div>

          <div className="grupo-form">
            <label>Categoria</label>
            <input
              type="text"
              required
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex: Despesas Fixas"
            />
          </div>

          <div className="grupo-form">
            <label>Observação (Opcional)</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={3}
            />
          </div>

          <footer className="rodape-modal">
            <button type="button" className="botao-cancelar" onClick={aoFechar}>
              Cancelar
            </button>
            <button type="submit" className="botao-acao" disabled={carregando}>
              {carregando ? "Salvando..." : "Salvar Lançamento"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
