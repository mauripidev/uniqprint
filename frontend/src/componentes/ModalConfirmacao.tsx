import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface PropriedadesModalConfirmacao {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variante?: "perigo" | "padrao";
  aoConfirmar: () => void;
  aoFechar: () => void;
}

export const ModalConfirmacao: React.FC<PropriedadesModalConfirmacao> = ({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  variante = "padrao",
  aoConfirmar,
  aoFechar
}) => {
  useEffect(() => {
    const lidarComEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && aberto) {
        aoFechar();
      }
    };
    window.addEventListener("keydown", lidarComEsc);
    return () => window.removeEventListener("keydown", lidarComEsc);
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div className="envoltura-modal-backdrop" onClick={aoFechar}>
      <div
        className="conteudo-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal"
      >
        <div className="cabecalho-modal">
          <div className="icone-modal-titulo">
            {variante === "perigo" && <AlertTriangle size={20} color="var(--erro)" />}
            <h3 id="titulo-modal" className="titulo-modal">
              {titulo}
            </h3>
          </div>
          <button
            type="button"
            className="botao-fechar-modal"
            onClick={aoFechar}
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="corpo-modal">
          <p className="texto-modal-mensagem">{mensagem}</p>
        </div>

        <div className="rodape-modal">
          <button
            type="button"
            className="botao-secundario"
            onClick={aoFechar}
            data-testid="botao-cancelar-modal"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            className={variante === "perigo" ? "botao-perigo" : "botao-primario"}
            onClick={aoConfirmar}
            data-testid="botao-confirmar-modal"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};
