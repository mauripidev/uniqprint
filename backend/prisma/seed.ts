import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function principal() {
  console.log("🌱 Iniciando seed do banco de dados...");

  const senhaAdminHash = await argon2.hash("admin123", {
    type: argon2.argon2id
  });

  const senhaUserHash = await argon2.hash("user123", {
    type: argon2.argon2id
  });

  // Cria ou atualiza usuário Administrador
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@uniqprint.com.br" },
    update: {
      senha_hash: senhaAdminHash,
      nome: "Administrador Uniqprint",
      papel: "ADMINISTRADOR",
      ativo: true
    },
    create: {
      email: "admin@uniqprint.com.br",
      senha_hash: senhaAdminHash,
      nome: "Administrador Uniqprint",
      papel: "ADMINISTRADOR",
      ativo: true
    }
  });

  // Cria ou atualiza usuário Comum
  const usuarioComum = await prisma.usuario.upsert({
    where: { email: "usuario@uniqprint.com.br" },
    update: {
      senha_hash: senhaUserHash,
      nome: "Operador de Vendas",
      papel: "USUARIO",
      ativo: true
    },
    create: {
      email: "usuario@uniqprint.com.br",
      senha_hash: senhaUserHash,
      nome: "Operador de Vendas",
      papel: "USUARIO",
      ativo: true
    }
  });

  console.log("✅ Usuários criados com sucesso:");
  console.log(`- Admin: ${admin.email} (Senha: admin123)`);
  console.log(`- Usuário: ${usuarioComum.email} (Senha: user123)`);
}

principal()
  .catch((erro) => {
    console.error("❌ Erro ao executar seed:", erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
