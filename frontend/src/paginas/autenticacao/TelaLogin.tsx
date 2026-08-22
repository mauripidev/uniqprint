import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  ShieldCheck
} from "lucide-react";
import { z } from "zod";
import { usarAutenticacao } from "../../contextos/ContextoAutenticacao.js";
import { ErroRequisicaoApi } from "../../servicos/api.js";

const schemaFormularioLogin = z.object({
  email: z
    .string()
    .trim()
    .min(1, "O e-mail é obrigatório")
    .pipe(z.string().email("Informe um e-mail válido")),
  senha: z.string().min(1, "A senha é obrigatória")
});

export const TelaLogin: React.FC = () => {
  const { login, estaAutenticado, carregando: carregandoAutenticacao } =
    usarAutenticacao();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState<string>("");
  const [senha, setSenha] = useState<string>("");
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);

  // Destino após login
  const destino = (location.state as { from?: { pathname: string } })?.from
    ?.pathname || "/";

  if (!carregandoAutenticacao && estaAutenticado) {
    return <Navigate to={destino} replace />;
  }

  const manipularEnvio = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErroGeral(null);
    setErrosCampos({});

    // 1. Validação no cliente com Zod
    const resultadoValidacao = schemaFormularioLogin.safeParse({ email, senha });

    if (!resultadoValidacao.success) {
      const erros: Record<string, string> = {};
      resultadoValidacao.error.errors.forEach((err) => {
        if (err.path[0]) {
          erros[err.path[0].toString()] = err.message;
        }
      });
      setErrosCampos(erros);
      return;
    }

    setEnviando(true);

    try {
      await login({ email: email.trim(), senha });
      navigate(destino, { replace: true });
    } catch (erro) {
      if (erro instanceof ErroRequisicaoApi) {
        setErroGeral(erro.message);
        if (erro.campos) {
          const errosMapeados: Record<string, string> = {};
          for (const [campo, mensagens] of Object.entries(erro.campos)) {
            errosMapeados[campo] = mensagens[0];
          }
          setErrosCampos(errosMapeados);
        }
      } else {
        setErroGeral("Ocorreu um erro ao tentar entrar. Tente novamente.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="tela-login-conteiner">
      <div className="cartao-login">
        <div className="cabecalho-login">
          <div className="logo-badge">
            <ShieldCheck size={28} />
          </div>
          <h1 className="titulo-login">Uniqprint</h1>
          <p className="subtitulo-login">Controle de Compras e Vendas</p>
        </div>

        {erroGeral && (
          <div className="alerta-erro-geral" role="alert" data-testid="alerta-erro">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{erroGeral}</span>
          </div>
        )}

        <form onSubmit={manipularEnvio} className="formulario-login" noValidate>
          <div className="grupo-campo">
            <label htmlFor="email" className="rotulo-campo">
              E-mail
            </label>
            <div className="envoltura-input">
              <span className="icone-campo">
                <Mail size={18} />
              </span>
              <input
                id="email"
                type="email"
                className={`input-texto ${errosCampos.email ? "com-erro" : ""}`}
                placeholder="seu.email@uniqprint.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={enviando}
                autoComplete="email"
                autoFocus
              />
            </div>
            {errosCampos.email && (
              <span className="mensagem-erro-campo" role="alert">
                {errosCampos.email}
              </span>
            )}
          </div>

          <div className="grupo-campo">
            <label htmlFor="senha" className="rotulo-campo">
              Senha
            </label>
            <div className="envoltura-input">
              <span className="icone-campo">
                <Lock size={18} />
              </span>
              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                className={`input-texto ${errosCampos.senha ? "com-erro" : ""}`}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={enviando}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="botao-visibilidade-senha"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                title={mostrarSenha ? "Ocultar senha" : "Exibir senha"}
                tabIndex={-1}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errosCampos.senha && (
              <span className="mensagem-erro-campo" role="alert">
                {errosCampos.senha}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="botao-primario"
            disabled={enviando}
            data-testid="botao-entrar"
          >
            {enviando ? (
              <>
                <div className="spinner" />
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>

        <div className="caixa-dica-credenciais">
          <strong>Credenciais padrão do ambiente:</strong>
          <ul>
            <li>• Admin: <code>admin@uniqprint.com.br</code> / <code>admin123</code></li>
            <li>• Operador: <code>usuario@uniqprint.com.br</code> / <code>user123</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
