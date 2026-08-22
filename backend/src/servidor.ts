import { criarAplicativo } from "./aplicativo.js";
import { configuracaoAmbiente } from "./configuracao/ambiente.js";

async function iniciarServidor() {
  const aplicativo = criarAplicativo();

  try {
    const endereco = await aplicativo.listen({
      port: configuracaoAmbiente.PORTA,
      host: configuracaoAmbiente.HOST
    });
    console.log(`🚀 Servidor Uniqprint Back-end rodando em: ${endereco}`);
  } catch (erro) {
    aplicativo.log.error(erro);
    process.exit(1);
  }
}

iniciarServidor();
