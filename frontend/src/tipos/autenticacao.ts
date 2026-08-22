export interface Usuario {
  id: number;
  email: string;
  nome: string;
  papel: "ADMINISTRADOR" | "USUARIO";
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  ultimo_login_em: string | null;
}

export interface DadosLogin {
  email: string;
  senha: string;
}

export interface RespostaLogin {
  dados: {
    usuario: Usuario;
    token?: string;
  };
  mensagem: string;
}

export interface RespostaUsuarioEu {
  dados: {
    usuario: Usuario;
  };
  mensagem: string;
}

export interface RespostaSucessoGenerica<T = unknown> {
  dados: T;
  mensagem: string;
}

export interface RespostaErroApi {
  erro: {
    codigo: string;
    mensagem: string;
    campos?: Record<string, string[]>;
  };
}
