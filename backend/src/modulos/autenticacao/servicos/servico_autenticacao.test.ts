import { describe, expect, it } from "vitest";
import { ErroAplicacao } from "../../../compartilhado/erros/erro_aplicacao.js";
import {
  compararSenha,
  gerarHashSenha
} from "../../../compartilhado/utilitarios/criptografia.js";
import {
  DadosCriarUsuario,
  RepositorioUsuarios
} from "../repositorios/repositorio_usuarios.js";
import { ServicoAutenticacao } from "./servico_autenticacao.js";
import { Usuario } from "@prisma/client";

// Mock em memória do repositório para testes unitários isolados
class RepositorioUsuariosMemoria implements RepositorioUsuarios {
  public usuarios: Usuario[] = [];
  private proximoId = 1;

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const usuario = this.usuarios.find((u) => u.email === email);
    return usuario ?? null;
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    const usuario = this.usuarios.find((u) => u.id === id);
    return usuario ?? null;
  }

  async atualizarUltimoLogin(id: number): Promise<void> {
    const usuario = this.usuarios.find((u) => u.id === id);
    if (usuario) {
      usuario.ultimo_login_em = new Date();
    }
  }

  async criar(dados: DadosCriarUsuario): Promise<Usuario> {
    const novoUsuario: Usuario = {
      id: this.proximoId++,
      email: dados.email,
      senha_hash: dados.senha_hash,
      nome: dados.nome,
      papel: dados.papel ?? "USUARIO",
      ativo: dados.ativo ?? true,
      criado_em: new Date(),
      atualizado_em: new Date(),
      ultimo_login_em: null
    };
    this.usuarios.push(novoUsuario);
    return novoUsuario;
  }

  async listar(): Promise<Usuario[]> {
    return [...this.usuarios];
  }
}

describe("Criptografia de Senhas (Argon2id)", () => {
  it("deve gerar hash e validar senha com sucesso", async () => {
    const senha = "minhasenhaforte123";
    const hash = await gerarHashSenha(senha);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(senha);
    expect(hash).toContain("$argon2id$");

    const senhaCorreta = await compararSenha(senha, hash);
    expect(senhaCorreta).toBe(true);

    const senhaIncorreta = await compararSenha("outrasenha", hash);
    expect(senhaIncorreta).toBe(false);
  });
});

describe("ServicoAutenticacao (Regras de Negócio)", () => {
  it("deve criar um novo usuário e autenticar com sucesso", async () => {
    const repositorio = new RepositorioUsuariosMemoria();
    const servico = new ServicoAutenticacao(repositorio);

    const usuarioCriado = await servico.criarUsuario({
      email: "teste@uniqprint.com.br",
      senha: "senhaSegura123",
      nome: "Usuário Teste",
      papel: "ADMINISTRADOR",
      ativo: true
    });

    expect(usuarioCriado.id).toBeDefined();
    expect(usuarioCriado.email).toBe("teste@uniqprint.com.br");
    expect(usuarioCriado.nome).toBe("Usuário Teste");
    expect(usuarioCriado.papel).toBe("ADMINISTRADOR");

    // Autenticar com credenciais corretas
    const usuarioAutenticado = await servico.autenticarUsuario({
      email: "teste@uniqprint.com.br",
      senha: "senhaSegura123"
    });

    expect(usuarioAutenticado.id).toBe(usuarioCriado.id);
  });

  it("não deve permitir cadastrar usuário com e-mail duplicado", async () => {
    const repositorio = new RepositorioUsuariosMemoria();
    const servico = new ServicoAutenticacao(repositorio);

    await servico.criarUsuario({
      email: "duplicado@uniqprint.com.br",
      senha: "senhaSegura123",
      nome: "Primeiro",
      papel: "USUARIO",
      ativo: true
    });

    await expect(
      servico.criarUsuario({
        email: "duplicado@uniqprint.com.br",
        senha: "outrasenha123",
        nome: "Segundo",
        papel: "USUARIO",
        ativo: true
      })
    ).rejects.toThrow(ErroAplicacao);
  });

  it("deve falhar na autenticação com senha incorreta e retornar mensagem genérica", async () => {
    const repositorio = new RepositorioUsuariosMemoria();
    const servico = new ServicoAutenticacao(repositorio);

    await servico.criarUsuario({
      email: "usuario@uniqprint.com.br",
      senha: "senhaCorreta123",
      nome: "Usuário",
      papel: "USUARIO",
      ativo: true
    });

    await expect(
      servico.autenticarUsuario({
        email: "usuario@uniqprint.com.br",
        senha: "senhaErrada"
      })
    ).rejects.toMatchObject({
      codigo: "CREDENCIAS_INVALIDAS",
      statusHttp: 401
    });
  });

  it("deve falhar na autenticação de e-mail inexistente com mesma mensagem genérica", async () => {
    const repositorio = new RepositorioUsuariosMemoria();
    const servico = new ServicoAutenticacao(repositorio);

    await expect(
      servico.autenticarUsuario({
        email: "inexistente@uniqprint.com.br",
        senha: "qualquersenha"
      })
    ).rejects.toMatchObject({
      codigo: "CREDENCIAS_INVALIDAS",
      statusHttp: 401
    });
  });

  it("não deve permitir autenticação de usuário inativo", async () => {
    const repositorio = new RepositorioUsuariosMemoria();
    const servico = new ServicoAutenticacao(repositorio);

    await servico.criarUsuario({
      email: "inativo@uniqprint.com.br",
      senha: "senhaCorreta123",
      nome: "Usuário Inativo",
      papel: "USUARIO",
      ativo: false
    });

    await expect(
      servico.autenticarUsuario({
        email: "inativo@uniqprint.com.br",
        senha: "senhaCorreta123"
      })
    ).rejects.toMatchObject({
      codigo: "USUARIO_INATIVO",
      statusHttp: 403
    });
  });
});
