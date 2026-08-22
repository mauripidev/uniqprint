import { RespostaErroApi } from "../tipos/autenticacao.js";

export class ErroRequisicaoApi extends Error {
  public readonly codigo: string;
  public readonly statusHttp: number;
  public readonly campos?: Record<string, string[]>;

  constructor(
    mensagem: string,
    codigo = "ERRO_DESCONHECIDO",
    statusHttp = 500,
    campos?: Record<string, string[]>
  ) {
    super(mensagem);
    this.name = "ErroRequisicaoApi";
    this.codigo = codigo;
    this.statusHttp = statusHttp;
    this.campos = campos;
  }
}

const URL_BASE = "/api";

export async function requisicaoApi<T>(
  caminho: string,
  opcoes: RequestInit = {}
): Promise<T> {
  const url = `${URL_BASE}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;

  const cabecalhosPadrao: Record<string, string> = {
    "Content-Type": "application/json"
  };

  const configuracao: RequestInit = {
    ...opcoes,
    credentials: "include", // Envia e recebe cookies HTTP-Only automaticamente
    headers: {
      ...cabecalhosPadrao,
      ...opcoes.headers
    }
  };

  try {
    const resposta = await fetch(url, configuracao);

    let dadosJson: unknown = null;
    try {
      dadosJson = await resposta.json();
    } catch {
      // Caso a resposta não seja JSON
    }

    if (!resposta.ok) {
      const erroApi = dadosJson as RespostaErroApi | null;
      const mensagem =
        erroApi?.erro?.mensagem || `Erro na requisição (Código HTTP ${resposta.status})`;
      const codigo = erroApi?.erro?.codigo || "ERRO_REQUISICAO";
      const campos = erroApi?.erro?.campos;

      throw new ErroRequisicaoApi(mensagem, codigo, resposta.status, campos);
    }

    return dadosJson as T;
  } catch (erro) {
    if (erro instanceof ErroRequisicaoApi) {
      throw erro;
    }

    throw new ErroRequisicaoApi(
      "Não foi possível conectar ao servidor. Verifique sua conexão.",
      "FALHA_CONEXAO",
      0
    );
  }
}
