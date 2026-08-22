export class ErroAplicacao extends Error {
  public readonly codigo: string;
  public readonly statusHttp: number;
  public readonly campos?: Record<string, string[]>;

  constructor(
    mensagem: string,
    codigo = "ERRO_INTERNO",
    statusHttp = 400,
    campos?: Record<string, string[]>
  ) {
    super(mensagem);
    this.name = "ErroAplicacao";
    this.codigo = codigo;
    this.statusHttp = statusHttp;
    this.campos = campos;
  }
}
