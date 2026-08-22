import { prisma } from "../banco_de_dados/prisma.js";

async function validarFluxoCompletoProdutos() {
  console.log("================================================================");
  console.log("🚀 INICIANDO VALIDAÇÃO DO FLUXO COMPLETO DE PRODUTOS");
  console.log("================================================================");

  const URL_API = "http://localhost:3001/api";

  // 1. Autenticação para obter token de sessão
  console.log("\n🔑 0. Autenticando com usuário Administrador...");
  const resLogin = await fetch(`${URL_API}/autenticacao/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@uniqprint.com.br",
      senha: "admin123"
    })
  });

  const dadosLogin = await resLogin.json();
  const token = dadosLogin.dados.token;
  console.log("✅ Autenticado com sucesso! Usuário:", dadosLogin.dados.usuario.nome);

  const headersAutenticados = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // 2. CRIAR PRODUTO
  console.log("\n📦 1. CRIAR PRODUTO (POST /api/produtos)...");
  const resCriar = await fetch(`${URL_API}/produtos`, {
    method: "POST",
    headers: headersAutenticados,
    body: JSON.stringify({
      descricao: "Lona Vinílica 440g Fosca 1.60m",
      quantidade_estoque: 35
    })
  });

  const dadosCriacao = await resCriar.json();
  console.log("Status HTTP:", resCriar.status);
  console.log("Produto criado:", dadosCriacao.dados);

  if (resCriar.status !== 201 || !dadosCriacao.dados.id) {
    throw new Error("Falha ao criar produto");
  }

  const idProduto = dadosCriacao.dados.id;

  // 3. LISTAR PRODUTO
  console.log("\n📋 2. LISTAR PRODUTOS (GET /api/produtos?busca=Lona)...");
  const resListar = await fetch(
    `${URL_API}/produtos?busca=Lona+Vin%C3%ADlica&pagina=1&limite=10`,
    {
      method: "GET",
      headers: headersAutenticados
    }
  );

  const dadosListagem = await resListar.json();
  console.log("Status HTTP:", resListar.status);
  console.log("Total encontrado:", dadosListagem.paginacao.total);
  console.log("Produtos retornados:", dadosListagem.dados.map((p: any) => ({
    id: p.id,
    descricao: p.descricao,
    estoque: p.quantidade_estoque,
    ativo: p.ativo
  })));

  const produtoNaLista = dadosListagem.dados.find((p: any) => p.id === idProduto);
  if (!produtoNaLista) {
    throw new Error("Produto recém-criado não foi encontrado na listagem");
  }
  console.log("✅ Produto localizado na listagem paginada!");

  // 4. EDITAR PRODUTO
  console.log("\n✏️ 3. EDITAR PRODUTO (PUT /api/produtos/:id)...");
  const novaDescricao = "Lona Vinílica 440g Fosca 1.60m - Alta Resistência UV";
  const resEditar = await fetch(`${URL_API}/produtos/${idProduto}`, {
    method: "PUT",
    headers: headersAutenticados,
    body: JSON.stringify({
      descricao: novaDescricao
    })
  });

  const dadosEdicao = await resEditar.json();
  console.log("Status HTTP:", resEditar.status);
  console.log("Produto após edição:", dadosEdicao.dados);

  if (resEditar.status !== 200 || dadosEdicao.dados.descricao !== novaDescricao) {
    throw new Error("Falha ao editar produto");
  }
  console.log("✅ Produto atualizado com sucesso!");

  // 5. INATIVAR PRODUTO
  console.log("\n⛔ 4. INATIVAR PRODUTO (DELETE /api/produtos/:id)...");
  const resInativar = await fetch(`${URL_API}/produtos/${idProduto}`, {
    method: "DELETE",
    headers: headersAutenticados
  });

  const dadosInativacao = await resInativar.json();
  console.log("Status HTTP:", resInativar.status);
  console.log("Produto após inativação:", dadosInativacao.dados);

  if (resInativar.status !== 200 || dadosInativacao.dados.ativo !== false) {
    throw new Error("Falha ao inativar produto");
  }
  console.log("✅ Produto inativado logicamente (ativo: false)!");

  // 6. VERIFICAR RESULTADO NO BANCO DE DADOS
  console.log("\n🗄️ 5. VERIFICAR RESULTADO DIRETAMENTE NO BANCO DE DADOS (MySQL)...");
  const produtoNoBanco = await prisma.produto.findUnique({
    where: { id: idProduto }
  });

  console.log("Registro recuperado direto do MySQL:", produtoNoBanco);

  if (!produtoNoBanco) {
    throw new Error("Produto não encontrado no banco de dados!");
  }

  if (produtoNoBanco.id !== idProduto) {
    throw new Error("ID inconsistente no banco de dados!");
  }

  if (produtoNoBanco.descricao !== novaDescricao) {
    throw new Error("Descrição inconsistente no banco de dados!");
  }

  if (produtoNoBanco.ativo !== false) {
    throw new Error("Status de inativação não persistiu no banco de dados!");
  }

  if (produtoNoBanco.quantidade_estoque !== 35) {
    throw new Error("Estoque alterado indevidamente no banco de dados!");
  }

  await prisma.$disconnect();

  console.log("\n================================================================");
  console.log("🎉 FLUXO COMPLETO DE PRODUTOS VALIDADO COM SUCESSO TOTAL!");
  console.log("================================================================");
}

validarFluxoCompletoProdutos().catch((err) => {
  console.error("❌ ERRO NO FLUXO:", err);
  process.exit(1);
});
