import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import { compararSenha, gerarHashSenha } from "../../../compartilhado/utilitarios/criptografia.js";
import {
  RequisicaoCriarUsuario,
  RequisicaoLogin,
  UsuarioResposta
} from "../dtos/autenticacao_dto.js";
import {
  RepositorioUsuarios,
  RepositorioUsuariosPrisma
} from "../repositorios/repositorio_usuarios.js";
import { Usuario } from "@prisma/client";

export class ServicoAutenticacao {
  constructor(
    private repositorioUsuarios: RepositorioUsuarios = new RepositorioUsuariosPrisma()
  ) {}

  private mapearParaResposta(usuario: Usuario): UsuarioResposta {
    return {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      papel: usuario.papel,
      ativo: usuario.ativo,
      criado_em: usuario.criado_em,
      atualizado_em: usuario.atualizado_em,
      ultimo_login_em: usuario.ultimo_login_em
    };
  }

  async autenticarUsuario(dados: RequisicaoLogin): Promise<UsuarioResposta> {
    const usuario = await this.repositorioUsuarios.buscarPorEmail(dados.email);

    if (!usuario) {
      // Mensagem genérica para segurança (evita enumeração de usuários)
      throw new ErroAplicacao(
        "E-mail ou senha incorretos",
        "CREDENCIAS_INVALIDAS",
        401
      );
    }

    if (!usuario.ativo) {
      throw new ErroAplicacao(
        "Usuário inativo. Entre em contato com o administrador do sistema.",
        "USUARIO_INATIVO",
        403
      );
    }

    const senhaValida = await compararSenha(dados.senha, usuario.senha_hash);

    if (!senhaValida) {
      throw new ErroAplicacao(
        "E-mail ou senha incorretos",
        "CREDENCIAS_INVALIDAS",
        401
      );
    }

    await this.repositorioUsuarios.atualizarUltimoLogin(usuario.id);

    return this.mapearParaResposta(usuario);
  }

  async buscarUsuarioAutenticado(id: number): Promise<UsuarioResposta> {
    const usuario = await this.repositorioUsuarios.buscarPorId(id);

    if (!usuario) {
      throw new ErroAplicacao("Usuário não encontrado", "USUARIO_NAO_ENCONTRADO", 404);
    }

    if (!usuario.ativo) {
      throw new ErroAplicacao(
        "Usuário inativo. Sessão encerrada.",
        "USUARIO_INATIVO",
        403
      );
    }

    return this.mapearParaResposta(usuario);
  }

  async criarUsuario(dados: RequisicaoCriarUsuario): Promise<UsuarioResposta> {
    const usuarioExistente = await this.repositorioUsuarios.buscarPorEmail(dados.email);

    if (usuarioExistente) {
      throw new ErroAplicacao(
        "Já existe um usuário cadastrado com este e-mail",
        "EMAIL_JA_CADASTRADO",
        409
      );
    }

    const senha_hash = await gerarHashSenha(dados.senha);

    const novoUsuario = await this.repositorioUsuarios.criar({
      email: dados.email,
      senha_hash,
      nome: dados.nome,
      papel: dados.papel,
      ativo: dados.ativo
    });

    return this.mapearParaResposta(novoUsuario);
  }

  async listarUsuarios(): Promise<UsuarioResposta[]> {
    const usuarios = await this.repositorioUsuarios.listar();
    return usuarios.map((u) => this.mapearParaResposta(u));
  }
}
