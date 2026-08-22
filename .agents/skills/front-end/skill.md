# Skill — Desenvolvimento Front-end

## Objetivo

Desenvolver e manter o front-end do sistema de controle de compras e vendas utilizando:

* React;
* TypeScript;
* Vite;
* React Router;
* API REST;
* Componentização;
* Validação de formulários;
* Interface responsiva.

O front-end deverá ser simples, organizado, seguro e preparado para futuras evoluções.

---

# 1. Regras obrigatórias

## 1.1 Idioma do código

Todos os nomes criados no projeto deverão utilizar **PT-BR**.

Isso inclui:

* Variáveis;
* Funções;
* Métodos;
* Componentes;
* Hooks;
* Tipos;
* Interfaces;
* Arquivos;
* Pastas;
* Rotas;
* Serviços;
* Mensagens;
* Estados;
* Props.

Exemplos corretos:

```typescript
const produtoSelecionado = ...
const quantidadeVenda = ...
const buscarProdutos = ...
const criarVenda = ...
const atualizarEstoque = ...
const gerarRelatorioVendas = ...
```

Evitar:

```typescript
const selectedProduct = ...
const saleQuantity = ...
const fetchProducts = ...
const createSale = ...
const updateStock = ...
```

Nomes provenientes de bibliotecas externas podem permanecer no idioma original.

---

# 2. Estrutura

Utilizar uma organização modular por responsabilidade.

Estrutura sugerida:

```text
frontend/
└── src/
    ├── componentes/
    ├── paginas/
    ├── layouts/
    ├── rotas/
    ├── servicos/
    ├── hooks/
    ├── tipos/
    ├── utilitarios/
    ├── contextos/
    ├── estilos/
    └── principal.tsx
```

Quando o projeto crescer, poderá ser adotada organização adicional por domínio.

Exemplo:

```text
src/
├── modulos/
│   ├── autenticacao/
│   ├── produtos/
│   ├── fornecedores/
│   ├── clientes/
│   ├── compras/
│   ├── vendas/
│   ├── estoque/
│   ├── financeiro/
│   └── relatorios/
│
├── componentes/
├── layouts/
├── rotas/
└── compartilhado/
```

Priorizar a organização por domínio quando isso melhorar a manutenção.

---

# 3. Componentes

Os componentes deverão possuir responsabilidade única.

Evitar componentes muito grandes.

Preferir:

```text
FormularioProduto
TabelaProdutos
CampoPesquisa
Paginacao
Botao
ModalConfirmacao
MensagemErro
Carregando
```

em vez de concentrar toda a interface em um único componente.

---

# 4. Páginas

As páginas principais deverão ser:

```text
Login
Dashboard
Produtos
Fornecedores
Clientes
Compras
Vendas
Estoque
Financeiro
RelatorioVendas
RelatorioCompras
RelatorioFinanceiro
Usuarios
```

As páginas deverão cuidar principalmente da composição da interface.

Regras de negócio não devem ficar espalhadas dentro dos componentes visuais.

---

# 5. Rotas

As rotas deverão utilizar nomenclatura em PT-BR.

Exemplo:

```text
/login
/dashboard
/produtos
/fornecedores
/clientes
/compras
/vendas
/estoque
/financeiro
/relatorios/vendas
/relatorios/compras
/relatorios/financeiro
/usuarios
```

Rotas protegidas deverão exigir autenticação.

---

# 6. Autenticação

Implementar:

```text
login
logout
usuario autenticado
usuario nao autenticado
```

O front-end deverá possuir mecanismo centralizado para verificar a sessão do usuário.

Exemplo conceitual:

```typescript
autenticarUsuario()
encerrarSessao()
buscarUsuarioAutenticado()
verificarAutenticacao()
```

Não duplicar lógica de autenticação em cada página.

---

# 7. Segurança

O front-end deverá seguir as seguintes regras:

* Nunca armazenar senha;
* Nunca exibir senha em logs;
* Nunca armazenar secrets no código;
* Nunca confiar nas validações do front-end como mecanismo de segurança;
* Não armazenar tokens sensíveis em `localStorage` sem necessidade;
* Utilizar HTTPS em produção;
* Não inserir HTML fornecido pelo usuário sem sanitização adequada;
* Tratar erros da API sem expor informações internas;
* Não exibir stack trace;
* Não colocar credenciais no código;
* Não colocar senhas em variáveis públicas do Vite.

O back-end continua sendo a autoridade para autenticação, autorização e regras de negócio.

---

# 8. Comunicação com a API

Criar uma camada centralizada para comunicação com o back-end.

Exemplo:

```text
servicos/
├── api.ts
├── autenticacao.ts
├── produtos.ts
├── fornecedores.ts
├── clientes.ts
├── compras.ts
├── vendas.ts
├── estoque.ts
├── financeiro.ts
└── relatorios.ts
```

Exemplos de funções:

```typescript
listarProdutos()
buscarProdutoPorId()
criarProduto()
atualizarProduto()
inativarProduto()

listarFornecedores()
buscarFornecedorPorId()
criarFornecedor()
atualizarFornecedor()

listarClientes()
buscarClientePorId()
criarCliente()
atualizarCliente()

listarCompras()
buscarCompraPorId()
registrarCompra()

listarVendas()
buscarVendaPorId()
registrarVenda()

buscarEstoque()
listarMovimentacoesEstoque()
ajustarEstoque()

listarLancamentosFinanceiros()
criarLancamentoFinanceiro()
atualizarLancamentoFinanceiro()
excluirLancamentoFinanceiro()

gerarRelatorioVendas()
gerarRelatorioCompras()
gerarRelatorioFinanceiro()
```

---

# 9. Tipagem

Evitar `any`.

Criar tipos específicos.

Exemplo:

```typescript
export interface Produto {
  id: number;
  descricao: string;
  quantidade_estoque: number;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}
```

Exemplo:

```typescript
export interface Venda {
  id: number;
  data_venda: string;
  produto_id: number;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  cliente_id: number | null;
  criado_em: string;
  atualizado_em: string;
}
```

---

# 10. Formulários

Todo formulário deverá possuir:

* Validação;
* Mensagens de erro;
* Estado de carregamento;
* Tratamento de erro da API;
* Feedback de sucesso;
* Bloqueio durante envio;
* Confirmação quando a operação for destrutiva.

Exemplo:

```text
Descrição
[________________________]

[Cancelar] [Salvar]
```

---

# 11. Produto

Campos:

```text
descricao
```

Informações exibidas:

```text
ID
Descrição
Estoque
Status
```

O usuário não deverá informar `id` manualmente.

---

# 12. Fornecedor

Campos:

```text
nome
observacao
```

Informações:

```text
ID
Nome
Observação
Status
```

---

# 13. Cliente

Campos:

```text
nome
telefone
observacao
```

Informações:

```text
ID
Nome
Telefone
Observação
Status
```

---

# 14. Compra

Formulário:

```text
data_compra
produto_id
quantidade
valor_unitario
fornecedor_id
```

O `valor_total` deverá ser calculado pelo back-end.

O front-end poderá apresentar uma prévia:

```text
Quantidade × Valor unitário
```

mas não deverá assumir que esse cálculo é a fonte oficial.

---

# 15. Venda

Formulário:

```text
data_venda
produto_id
quantidade
valor_unitario
cliente_id
```

Antes da confirmação, apresentar:

```text
Estoque disponível
Quantidade da venda
Valor total
```

A validação definitiva de estoque deverá ser feita pelo back-end.

Caso o back-end informe que não existe estoque suficiente, apresentar uma mensagem amigável.

---

# 16. Financeiro

O usuário deverá conseguir registrar:

```text
ENTRADA
SAIDA
```

Campos:

```text
tipo
descricao
valor
data_lancamento
categoria
observacao
```

Exibir:

```text
Total de entradas
Total de saídas
Saldo
```

---

# 17. Relatórios

Criar filtros para:

```text
data inicial
data final
```

Relatório de vendas:

```text
Produto
Quantidade
Valor unitário
Valor total
Cliente
Data
```

Relatório de compras:

```text
Produto
Quantidade
Valor unitário
Valor total
Fornecedor
Data
```

Relatório financeiro:

```text
Data
Tipo
Descrição
Categoria
Valor
```

---

# 18. Dashboard

O dashboard deverá ser simples.

Exibir:

```text
Vendas
Compras
Entradas
Saídas
Saldo
Produtos
Estoque baixo
Últimas vendas
Últimas compras
```

Evitar gráficos excessivos.

Priorizar informações úteis para tomada de decisão rápida.

---

# 19. Paginação

Listagens deverão possuir paginação.

Exemplo:

```text
Página 1 de 5

[Anterior] [1] [2] [3] [4] [5] [Próxima]
```

Não carregar milhares de registros desnecessariamente.

---

# 20. Estados de interface

Toda operação assíncrona deverá considerar:

```text
carregando
sucesso
erro
vazio
```

Exemplo:

```text
Carregando produtos...
```

Caso não existam registros:

```text
Nenhum produto encontrado.
```

---

# 21. Tratamento de erros

Erros da API deverão ser tratados de forma centralizada.

Exemplo:

```typescript
if (erro.codigo === "ESTOQUE_INSUFICIENTE") {
  mostrarMensagem("Não há estoque suficiente para realizar a venda.");
}
```

Não apresentar mensagens técnicas diretamente ao usuário.

---

# 22. Confirmações

Operações como:

* Inativar produto;
* Inativar cliente;
* Inativar fornecedor;
* Excluir lançamento financeiro;

deverão solicitar confirmação.

Exemplo:

```text
Deseja realmente inativar este produto?

[Cancelar] [Confirmar]
```

---

# 23. Acessibilidade

O front-end deverá:

* Utilizar labels nos campos;
* Permitir navegação por teclado;
* Possuir contraste adequado;
* Exibir mensagens de erro associadas aos campos;
* Utilizar elementos HTML semanticamente adequados;
* Não depender exclusivamente de cores para transmitir informações.

---

# 24. Responsividade

O sistema deverá funcionar adequadamente em:

* Desktop;
* Notebook;
* Tablet;
* Smartphone.

A interface mobile deverá ser considerada desde o início, mesmo que o aplicativo Android seja uma funcionalidade futura.

---

# 25. Testes

Criar testes para:

* Login;
* Proteção de rotas;
* Formulários;
* Validações;
* Produtos;
* Fornecedores;
* Clientes;
* Compras;
* Vendas;
* Estoque;
* Financeiro;
* Relatórios;
* Permissões.

Testar principalmente comportamentos, não detalhes internos de implementação.

---

# 26. Regras de implementação

Sempre que implementar uma funcionalidade:

1. Criar ou atualizar os tipos;
2. Criar o serviço de API;
3. Criar componentes necessários;
4. Criar a página;
5. Adicionar rota;
6. Adicionar validações;
7. Adicionar tratamento de erro;
8. Adicionar estado de carregamento;
9. Adicionar testes;
10. Verificar responsividade.

---

# 27. Proibições

Não:

* Criar `identifier`;
* Criar campos duplicados de identificação sem necessidade;
* Colocar regra financeira crítica somente no front-end;
* Calcular estoque como fonte oficial no front-end;
* Confiar no front-end para autorização;
* Usar `any` sem justificativa;
* Colocar secrets no código;
* Armazenar senha;
* Duplicar chamadas HTTP;
* Criar componentes gigantes;
* Misturar acesso à API diretamente em dezenas de componentes.

---

# 28. Critério de conclusão

Uma funcionalidade front-end estará concluída quando:

* Possuir interface funcional;
* Possuir tipagem;
* Estiver integrada à API;
* Possuir validação;
* Possuir tratamento de erros;
* Possuir estados de carregamento e vazio;
* Estiver protegida por autenticação quando necessário;
* Respeitar permissões;
* Estiver responsiva;
* Possuir testes apropriados;
* Utilizar nomenclatura em PT-BR.
