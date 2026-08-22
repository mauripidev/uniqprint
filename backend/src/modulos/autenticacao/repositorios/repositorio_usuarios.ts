import { prisma } from "../../../banco_de_dados/prisma.js";
import { Usuario } from "@prisma/client";

export interface DadosCriarUsuario {
  email: string;
  senha_hash: string;
  nome: string;
  papel?: string;
  ativo?: boolean;
}

export interface RepositorioUsuarios {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: number): Promise<Usuario | null>;
  atualizarUltimoLogin(id: number): Promise<void>;
  criar(dados: DadosCriarUsuario): Promise<Usuario>;
  listar(): Promise<Usuario[]>;
}

export class RepositorioUsuariosPrisma implements RepositorioUsuarios {
  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({
      where: { email }
    });
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    return prisma.usuario.findUnique({
      where: { id }
    });
  }

  async atualizarUltimoLogin(id: number): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { ultimo_login_em: new Date() }
    });
  }

  async criar(dados: DadosCriarUsuario): Promise<Usuario> {
    return prisma.usuario.create({
      data: {
        email: dados.email,
        senha_hash: dados.senha_hash,
        nome: dados.nome,
        papel: dados.papel ?? "USUARIO",
        ativo: dados.ativo ?? true
      }
    });
  }

  async listar(): Promise<Usuario[]> {
    return prisma.usuario.findMany({
      orderBy: { nome: "asc" }
    });
  }
}
