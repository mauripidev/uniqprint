import React from "react";
import { CheckCircle2, Shield, User, Clock, Key } from "lucide-react";
import { usarAutenticacao } from "../../contextos/ContextoAutenticacao.js";

export const TelaDashboard: React.FC = () => {
  const { usuario } = usarAutenticacao();

  return (
    <div>
      <div className="cabecalho-dashboard">
        <h1>Bem-vindo, {usuario?.nome}!</h1>
        <p>Sistema Uniqprint de Controle de Compras e Vendas</p>
      </div>

      <div className="grade-cards-dashboard">
        <div className="card-dashboard">
          <div className="card-dashboard-cabecalho">
            <span className="card-dashboard-titulo">Status da Sessão</span>
            <CheckCircle2 size={20} color="var(--sucesso)" />
          </div>
          <div className="card-dashboard-valor">Autenticado</div>
          <div className="card-dashboard-detalhe">
            <span>Sessão segura ativa via Cookie HTTP-Only</span>
          </div>
        </div>

        <div className="card-dashboard">
          <div className="card-dashboard-cabecalho">
            <span className="card-dashboard-titulo">Perfil de Acesso</span>
            <Shield size={20} color="var(--primaria)" />
          </div>
          <div className="card-dashboard-valor">{usuario?.papel}</div>
          <div className="card-dashboard-detalhe" style={{ color: "var(--texto-mutado)" }}>
            <span>{usuario?.email}</span>
          </div>
        </div>

        <div className="card-dashboard">
          <div className="card-dashboard-cabecalho">
            <span className="card-dashboard-titulo">Último Login</span>
            <Clock size={20} color="var(--alerta)" />
          </div>
          <div className="card-dashboard-valor" style={{ fontSize: "1.125rem" }}>
            {usuario?.ultimo_login_em
              ? new Date(usuario.ultimo_login_em).toLocaleString("pt-BR")
              : "Primeiro acesso"}
          </div>
          <div className="card-dashboard-detalhe" style={{ color: "var(--texto-mutado)" }}>
            <span>Registro de auditoria atualizado</span>
          </div>
        </div>
      </div>
    </div>
  );
};
