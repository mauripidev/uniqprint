import { FastifyReply, FastifyRequest } from "fastify";
import { schemaCriarUsuario, schemaLogin } from "../dtos/autenticacao_dto.js";
import { ServicoAutenticacao } from "../servicos/servico_autenticacao.js";

export class ControladorAutenticacao {
  constructor(private servicoAutenticacao: ServicoAutenticacao = new ServicoAutenticacao()) {}

  async login(requisicao: FastifyRequest, resposta: FastifyReply) {
    const dados = schemaLogin.parse(requisicao.body);
    const usuario = await this.servicoAutenticacao.autenticarUsuario(dados);

    // Gera o token JWT com validade de 24 horas
    const token = requisicao.server.jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        papel: usuario.papel
      },
      { expiresIn: "24h" }
    );

    // Define cookie HTTP-Only seguro
    resposta.setCookie("token_sessao", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.AMBIENTE === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 // 24 horas em segundos
    });

    return resposta.status(200).send({
      dados: {
        usuario,
        token
      },
      mensagem: "Login realizado com sucesso"
    });
  }

  async logout(requisicao: FastifyRequest, resposta: FastifyReply) {
    resposta.clearCookie("token_sessao", {
      path: "/",
      httpOnly: true,
      secure: process.env.AMBIENTE === "production",
      sameSite: "lax"
    });

    return resposta.status(200).send({
      dados: null,
      mensagem: "Logout realizado com sucesso"
    });
  }

  async eu(requisicao: FastifyRequest, resposta: FastifyReply) {
    const idUsuario = requisicao.usuarioAutenticado!.id;
    const usuario = await this.servicoAutenticacao.buscarUsuarioAutenticado(idUsuario);

    return resposta.status(200).send({
      dados: { usuario },
      mensagem: "Usuário autenticado obtido com sucesso"
    });
  }

  async criarUsuario(requisicao: FastifyRequest, resposta: FastifyReply) {
    const dados = schemaCriarUsuario.parse(requisicao.body);
    const usuario = await this.servicoAutenticacao.criarUsuario(dados);

    return resposta.status(201).send({
      dados: { usuario },
      mensagem: "Usuário criado com sucesso"
    });
  }

  async listarUsuarios(requisicao: FastifyRequest, resposta: FastifyReply) {
    const usuarios = await this.servicoAutenticacao.listarUsuarios();

    return resposta.status(200).send({
      dados: usuarios,
      mensagem: "Usuários listados com sucesso"
    });
  }
}
