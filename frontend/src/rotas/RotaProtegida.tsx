import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usarAutenticacao } from "../contextos/ContextoAutenticacao.js";

interface PropriedadesRotaProtegida {
  children: React.ReactNode;
  papeisPermitidos?: Array<"ADMINISTRADOR" | "USUARIO">;
}

export const RotaProtegida: React.FC<PropriedadesRotaProtegida> = ({
  children,
  papeisPermitidos
}) => {
  const { usuario, estaAutenticado, carregando } = usarAutenticacao();
  const localizacao = useLocation();

  if (carregando) {
    return (
      <div className="conteiner-carregando-tela" data-testid="carregando-sessao">
        <div className="spinner"></div>
        <p className="texto-carregando">Verificando autenticação...</p>
      </div>
    );
  }

  if (!estaAutenticado || !usuario) {
    return <Navigate to="/login" state={{ from: localizacao }} replace />;
  }

  if (papeisPermitidos && !papeisPermitidos.includes(usuario.papel)) {
    return (
      <div className="conteiner-sem-permissao">
        <h2>Acesso Negado</h2>
        <p>Você não possui permissão para acessar esta página.</p>
      </div>
    );
  }

  return <>{children}</>;
};
