import argon2 from "argon2";

export async function gerarHashSenha(senha: string): Promise<string> {
  return argon2.hash(senha, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });
}

export async function compararSenha(senha: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, senha);
  } catch {
    return false;
  }
}
