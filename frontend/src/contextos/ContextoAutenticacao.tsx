import React, { createContext, useContext, useEffect, useState } from "react";
import { DadosLogin, Usuario } from "../tipos/autenticacao.js";
import {
  obterUsuarioAutenticado,
  realizarLogin,
  realizarLogout
} from "../servicos/autenticacao.js";

interface ContextoAutenticacaoTipo {
  usuario: Usuario | null;
  estaAutenticado: boolean;
  carregando: boolean;
  login: (dados: DadosLogin) => Promise<Usuario>;
  logout: () => Promise<void>;
  recarregarUsuario: () => Promise<void>;
}

const ContextoAutenticacao = createContext<ContextoAutenticacaoTipo | undefined>(
  undefined
);

export const ProvedorAutenticacao: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);

  useEffect(() => {
    async function carregarSessaoInicial() {
      try {
        const usuarioAtual = await obterUsuarioAutenticado();
        setUsuario(usuarioAtual);
      } catch {
        setUsuario(null);
      } finally {
        setCarregando(false);
      }
    }

    carregarSessaoInicial();
  }, []);

  const login = async (dados: DadosLogin): Promise<Usuario> => {
    setCarregando(true);
    try {
      const usuarioLogado = await realizarLogin(dados);
      setUsuario(usuarioLogado);
      return usuarioLogado;
    } finally {
      setCarregando(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await realizarLogout();
    } finally {
      setUsuario(null);
    }
  };

  const recarregarUsuario = async (): Promise<void> => {
    try {
      const usuarioAtual = await obterUsuarioAutenticado();
      setUsuario(usuarioAtual);
    } catch {
      setUsuario(null);
    }
  };

  return (
    <ContextoAutenticacao.Provider
      value={{
        usuario,
        estaAutenticado: !!usuario,
        carregando,
        login,
        logout,
        recarregarUsuario
      }}
    >
      {children}
    </ContextoAutenticacao.Provider>
  );
};

export function usarAutenticacao(): ContextoAutenticacaoTipo {
  const contexto = useContext(ContextoAutenticacao);
  if (!contexto) {
    throw new Error(
      "usarAutenticacao deve ser utilizado dentro de um ProvedorAutenticacao"
    );
  }
  return contexto;
}
