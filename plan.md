# Plano de Desenvolvimento — Sistema de Controle de Compras e Vendas

## 1. Objetivo

Desenvolver um sistema web simples, seguro e de fácil utilização para controle de:

* Produtos;
* Fornecedores;
* Clientes;
* Compras (entradas);
* Vendas (saídas);
* Estoque;
* Relatórios de compras e vendas;
* Controle financeiro de entradas e saídas;
* Autenticação de usuários.

O sistema deverá possuir uma arquitetura preparada para futuras funcionalidades, especialmente importação de notas fiscais XML e acesso a determinadas funcionalidades por dispositivos Android.

---

# 2. Escopo inicial

A primeira versão do sistema será denominada **MVP (Minimum Viable Product)** e deverá contemplar:

1. Autenticação de usuários;
2. Cadastro de produtos;
3. Cadastro de fornecedores;
4. Cadastro de clientes;
5. Registro de compras;
6. Registro de vendas;
7. Controle automático de estoque;
8. Relatórios de compras;
9. Relatórios de vendas;
10. Controle financeiro;
11. Auditoria básica das operações;
12. Controle de permissões.

O sistema deverá priorizar simplicidade, segurança, manutenção e possibilidade de evolução.

---

# 3. Stack tecnológica

## 3.1 Front-end

* React;
* TypeScript;
* Vite;
* React Router;
* Biblioteca de componentes/UI;
* Axios ou Fetch API para comunicação com o back-end;
* Gerenciamento de estado somente quando necessário;
* Formulários com validação no cliente.

### Responsabilidades

O front-end será responsável por:

* Apresentação das telas;
* Navegação;
* Validação inicial dos formulários;
* Autenticação do usuário;
* Comunicação com a API;
* Exibição de mensagens de erro e sucesso;
* Relatórios;
* Controle de permissões na interface.

A validação realizada no front-end nunca deverá substituir a validação realizada no back-end.

---

# 4. Back-end

## 4.1 Tecnologias

* Node.js;
* TypeScript;
* Fastify;
* Prisma;
* Zod;
* Argon2id;
* API REST.

## 4.2 Responsabilidades

O back-end será responsável por:

* Autenticação;
* Autorização;
* Validação dos dados;
* Regras de negócio;
* Controle de estoque;
* Controle financeiro;
* Relatórios;
* Persistência dos dados;
* Auditoria;
* Proteção contra ataques;
* Exposição da API REST.

Toda regra de negócio importante deverá ser implementada no back-end.

---

# 5. Banco de dados

O sistema deverá utilizar:

* MySQL ou MariaDB.

Recomenda-se utilizar **MySQL 8+** ou versão compatível do MariaDB.

O acesso ao banco deverá ser realizado através do Prisma.

## 5.1 Requisitos do banco

* Chaves primárias;
* Chaves estrangeiras;
* Índices;
* Restrições de integridade;
* Campos `criado_em` e `atualizado_em`;
* Integridade referencial;
* Transações nas operações críticas;
* Valores monetários armazenados em tipo decimal;
* Datas armazenadas em formato apropriado;
* Não armazenar senhas em texto puro.

---

# 6. Convenções de nomenclatura

Todos os nomes relacionados ao domínio da aplicação deverão utilizar **PT-BR**.

Isso inclui:

* Tabelas;
* Campos;
* Variáveis;
* Funções;
* Métodos;
* Classes;
* Serviços;
* Controladores;
* Rotas;
* DTOs;
* Tipos;
* Interfaces;
* Mensagens de erro;
* Eventos.

Tecnologias e bibliotecas poderão manter seus nomes originais, como:

* React;
* TypeScript;
* Node.js;
* Fastify;
* Prisma;
* Zod;
* Argon2id.

## 6.1 Exemplos

Utilizar:

```text
produto
fornecedor
cliente
compra
venda
estoque
movimentacao_estoque
lancamento_financeiro
usuario
relatorio_vendas
```

Evitar:

```text
product
supplier
customer
purchase
sale
stock
financial_entry
user
sales_report
```

Para funções:

```text
criarProduto()
buscarProduto()
atualizarProduto()
inativarProduto()
registrarCompra()
registrarVenda()
atualizarEstoque()
gerarRelatorioVendas()
gerarRelatorioCompras()
```

Evitar:

```text
createProduct()
findProduct()
updateProduct()
deleteProduct()
registerPurchase()
registerSale()
updateStock()
generateSalesReport()
```

---

# 7. Modelo de dados

O campo `id` será utilizado como identificador único das entidades.

Não haverá campo `identifier`.

Exemplo:

```text
id
descricao
criado_em
atualizado_em
```

O `id` deverá ser gerado automaticamente pelo banco de dados ou pela camada de persistência.

---

# 8. Usuário

Tabela: `usuarios`

Campos:

* `id`
* `email`
* `senha_hash`
* `nome`
* `ativo`
* `criado_em`
* `atualizado_em`
* `ultimo_login_em`

### Regras

* `email` deve ser único;
* A senha nunca deverá ser armazenada diretamente;
* `senha_hash` deverá conter somente o resultado do algoritmo de hash;
* Usuário inativo não poderá realizar login.

---

# 9. Produto

Tabela: `produtos`

Campos:

* `id`
* `descricao`
* `quantidade_estoque`
* `ativo`
* `criado_em`
* `atualizado_em`

### Regras

* `descricao` é obrigatória;
* Produto poderá ser inativado sem necessariamente ser excluído;
* Não permitir estoque negativo;
* Operações de compra e venda deverão atualizar o estoque de maneira transacional.

---

# 10. Fornecedor

Tabela: `fornecedores`

Campos:

* `id`
* `nome`
* `observacao`
* `ativo`
* `criado_em`
* `atualizado_em`

### Regras

* `nome` é obrigatório;
* Fornecedor poderá ser inativado;
* Registros históricos de compras deverão continuar vinculados ao fornecedor.

---

# 11. Cliente

Tabela: `clientes`

Campos:

* `id`
* `nome`
* `telefone`
* `observacao`
* `ativo`
* `criado_em`
* `atualizado_em`

### Regras

* `nome` é obrigatório;
* `telefone` poderá ser opcional;
* Cliente poderá ser inativado;
* Registros históricos de vendas deverão continuar vinculados ao cliente.

---

# 12. Compras

Tabela: `compras`

Campos:

* `id`
* `data_compra`
* `produto_id`
* `quantidade`
* `valor_unitario`
* `valor_total`
* `fornecedor_id`
* `criado_em`
* `atualizado_em`

### Regras

Ao registrar uma compra:

1. Validar o produto;
2. Validar o fornecedor;
3. Validar a quantidade;
4. Validar o valor;
5. Registrar a compra;
6. Incrementar o estoque;
7. Registrar a movimentação de estoque;
8. Registrar a movimentação financeira correspondente, quando aplicável;
9. Executar as operações dentro de uma transação.

### Fórmula

```text
valor_total = quantidade × valor_unitario
```

O valor total deverá ser calculado pelo back-end.

---

# 13. Vendas

Tabela: `vendas`

Campos:

* `id`
* `data_venda`
* `produto_id`
* `quantidade`
* `valor_unitario`
* `valor_total`
* `cliente_id`
* `criado_em`
* `atualizado_em`

### Regras

Ao registrar uma venda:

1. Validar o produto;
2. Validar o cliente, quando obrigatório;
3. Validar a quantidade;
4. Validar o valor;
5. Verificar estoque disponível;
6. Registrar a venda;
7. Reduzir o estoque;
8. Registrar a movimentação de estoque;
9. Registrar a movimentação financeira correspondente, quando aplicável;
10. Executar as operações dentro de uma transação.

### Fórmula

```text
valor_total = quantidade × valor_unitario
```

O valor total deverá ser calculado pelo back-end.

---

# 14. Movimentação de estoque

Tabela: `movimentacoes_estoque`

Campos:

* `id`
* `produto_id`
* `tipo`
* `quantidade`
* `tipo_referencia`
* `referencia_id`
* `criado_em`

Tipos:

```text
ENTRADA
SAIDA
AJUSTE
```

Exemplos:

```text
Compra → ENTRADA
Venda → SAIDA
Ajuste manual → AJUSTE
```

A movimentação deverá permitir rastrear como o estoque chegou ao valor atual.

---

# 15. Controle financeiro

Tabela: `lancamentos_financeiros`

Campos:

* `id`
* `tipo`
* `descricao`
* `valor`
* `data_lancamento`
* `categoria`
* `tipo_referencia`
* `referencia_id`
* `observacao`
* `criado_em`
* `atualizado_em`

Tipos:

```text
ENTRADA
SAIDA
```

## 15.1 Lançamento manual

O usuário poderá cadastrar:

### Entrada

Exemplos:

* Recebimento;
* Outros ganhos;
* Serviços;
* Ajustes.

### Saída

Exemplos:

* Aluguel;
* Energia;
* Internet;
* Transporte;
* Despesas administrativas;
* Outras despesas.

## 15.2 Integração com compras e vendas

O sistema deverá ser preparado para relacionar movimentações financeiras com operações comerciais.

Exemplo:

```text
Venda
  ↓
Movimentação financeira de entrada
```

e:

```text
Compra
  ↓
Movimentação financeira de saída
```

Essa integração deverá ser definida de acordo com a regra financeira adotada pelo negócio, especialmente em relação a vendas e compras a prazo.

---

# 16. Relatório de vendas

O sistema deverá permitir consultar:

* Vendas da semana;
* Vendas do mês;
* Período personalizado.

Informações:

* Data;
* ID da venda;
* Produto;
* Quantidade;
* Valor unitário;
* Valor total;
* Cliente.

Resumo:

* Quantidade total vendida;
* Valor total das vendas;
* Quantidade de vendas;
* Produto mais vendido.

---

# 17. Relatório de compras

Deverá possuir:

* Compras da semana;
* Compras do mês;
* Período personalizado.

Informações:

* Data;
* ID da compra;
* Produto;
* Quantidade;
* Valor unitário;
* Valor total;
* Fornecedor.

Resumo:

* Quantidade total comprada;
* Valor total das compras;
* Quantidade de compras;
* Produtos mais comprados.

---

# 18. Dashboard

A tela inicial poderá apresentar um resumo simples:

* Total de vendas no período;
* Total de compras no período;
* Entradas financeiras;
* Saídas financeiras;
* Saldo financeiro;
* Quantidade de produtos;
* Produtos com estoque baixo;
* Últimas vendas;
* Últimas compras.

O dashboard deverá permanecer simples, evitando excesso de informações.

---

# 19. Autenticação

## 19.1 Login

O usuário deverá informar:

```text
email
senha
```

O back-end deverá:

1. Localizar o usuário pelo e-mail;
2. Verificar se o usuário está ativo;
3. Comparar a senha fornecida com o hash armazenado;
4. Criar uma sessão/token;
5. Retornar somente as informações necessárias ao front-end.

## 19.2 Senhas

As senhas **não devem ser criptografadas de forma reversível**.

Deverão ser armazenadas utilizando algoritmo de hash apropriado:

```text
Argon2id
```

Como alternativa:

```text
bcrypt
```

Cada senha deverá possuir salt próprio, fornecido pela biblioteca utilizada.

Nunca armazenar:

```text
senha = "123456"
```

ou qualquer equivalente reversível.

---

# 20. Estratégia de autenticação

Para a aplicação web, recomenda-se utilizar sessão baseada em cookie seguro ou tokens de curta duração com mecanismo apropriado de renovação.

Caso sejam utilizados cookies:

* `HttpOnly`;
* `Secure` em produção;
* `SameSite` adequado;
* Expiração definida;
* Proteção contra CSRF quando aplicável.

Não armazenar tokens sensíveis em `localStorage` sem uma análise específica dos riscos.

---

# 21. Segurança

O sistema deverá ser desenvolvido considerando, no mínimo, os principais riscos do OWASP.

## 21.1 Proteções obrigatórias

* Hash seguro de senhas;
* Validação de entrada;
* Sanitização quando necessária;
* Queries parametrizadas/ORM;
* Proteção contra SQL Injection;
* Proteção contra XSS;
* Proteção contra CSRF quando aplicável;
* Controle de autenticação;
* Controle de autorização;
* Rate limiting no login;
* Proteção contra brute force;
* Headers de segurança;
* HTTPS em produção;
* Controle de CORS;
* Gerenciamento seguro de secrets;
* Logs sem informações sensíveis;
* Tratamento adequado de erros;
* Não retornar stack trace para o usuário em produção.

---

# 22. Controle de acesso

O sistema deverá inicialmente possuir pelo menos dois níveis:

```text
ADMINISTRADOR
USUARIO
```

### ADMINISTRADOR

Pode:

* Gerenciar usuários;
* Gerenciar produtos;
* Gerenciar fornecedores;
* Gerenciar clientes;
* Registrar compras;
* Registrar vendas;
* Gerenciar financeiro;
* Visualizar relatórios.

### USUARIO

As permissões poderão ser limitadas de acordo com a necessidade do negócio.

A autorização deverá ser validada no back-end, não somente ocultando botões no front-end.

---

# 23. API

A API deverá seguir o padrão REST.

Todos os endpoints deverão utilizar nomenclatura em PT-BR.

## Autenticação

```text
POST   /api/autenticacao/login
POST   /api/autenticacao/logout
GET    /api/autenticacao/eu
```

## Produtos

```text
GET    /api/produtos
GET    /api/produtos/:id
POST   /api/produtos
PUT    /api/produtos/:id
DELETE /api/produtos/:id
```

## Fornecedores

```text
GET    /api/fornecedores
GET    /api/fornecedores/:id
POST   /api/fornecedores
PUT    /api/fornecedores/:id
DELETE /api/fornecedores/:id
```

## Clientes

```text
GET    /api/clientes
GET    /api/clientes/:id
POST   /api/clientes
PUT    /api/clientes/:id
DELETE /api/clientes/:id
```

## Compras

```text
GET    /api/compras
GET    /api/compras/:id
POST   /api/compras
```

## Vendas

```text
GET    /api/vendas
GET    /api/vendas/:id
POST   /api/vendas
```

## Estoque

```text
GET    /api/estoque
GET    /api/estoque/:produto_id
POST   /api/estoque/ajustes
GET    /api/estoque/movimentacoes
```

## Financeiro

```text
GET    /api/lancamentos-financeiros
GET    /api/lancamentos-financeiros/:id
POST   /api/lancamentos-financeiros
PUT    /api/lancamentos-financeiros/:id
DELETE /api/lancamentos-financeiros/:id
```

## Relatórios

```text
GET /api/relatorios/vendas
GET /api/relatorios/compras
GET /api/relatorios/financeiro
```

---

# 24. Nomenclatura de funções e métodos

Todos os métodos e funções criados pela aplicação deverão utilizar PT-BR.

Exemplos:

```typescript
criarProduto()
buscarProdutoPorId()
listarProdutos()
atualizarProduto()
inativarProduto()

criarFornecedor()
buscarFornecedorPorId()
listarFornecedores()
atualizarFornecedor()
inativarFornecedor()

criarCliente()
buscarClientePorId()
listarClientes()
atualizarCliente()
inativarCliente()

registrarCompra()
buscarCompraPorId()
listarCompras()

registrarVenda()
buscarVendaPorId()
listarVendas()

adicionarEstoque()
removerEstoque()
ajustarEstoque()
buscarEstoque()
listarMovimentacoesEstoque()

criarLancamentoFinanceiro()
buscarLancamentoFinanceiroPorId()
listarLancamentosFinanceiros()
atualizarLancamentoFinanceiro()
excluirLancamentoFinanceiro()

gerarRelatorioVendas()
gerarRelatorioCompras()
gerarRelatorioFinanceiro()

autenticarUsuario()
validarSenha()
criarSessao()
encerrarSessao()
```

Nomes técnicos fornecidos pelas próprias bibliotecas, frameworks ou APIs externas poderão permanecer em seus formatos originais.

---

# 25. Estrutura do projeto

Uma possível estrutura:

```text
projeto/
│
├── backend/
│   ├── src/
│   │   ├── modulos/
│   │   │   ├── autenticacao/
│   │   │   ├── usuarios/
│   │   │   ├── produtos/
│   │   │   ├── fornecedores/
│   │   │   ├── clientes/
│   │   │   ├── compras/
│   │   │   ├── vendas/
│   │   │   ├── estoque/
│   │   │   ├── financeiro/
│   │   │   ├── relatorios/
│   │   │   └── auditoria/
│   │   │
│   │   ├── banco_de_dados/
│   │   ├── middlewares/
│   │   ├── compartilhado/
│   │   ├── configuracao/
│   │   └── aplicativo.ts
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── paginas/
│   │   ├── componentes/
│   │   ├── layouts/
│   │   ├── servicos/
│   │   ├── hooks/
│   │   ├── rotas/
│   │   ├── tipos/
│   │   └── utilitarios/
│   │
│   └── package.json
│
├── documentos/
├── docker-compose.yml
└── README.md
```

---

# 26. Exclusão de registros

Deve-se evitar exclusão física de registros que possuam histórico relacionado.

Exemplo:

Se um produto possui vendas, não deverá ser simplesmente removido do banco.

Preferencialmente:

```text
ativo = false
```

ou mecanismo equivalente de inativação.

Isso preserva o histórico do sistema.

---

# 27. Transações

Operações que envolvem mais de uma alteração deverão utilizar transações.

## Compra

```text
INICIAR TRANSAÇÃO

Criar compra
Atualizar estoque
Criar movimentação de estoque
Criar movimentação financeira

CONFIRMAR TRANSAÇÃO
```

Se alguma operação falhar:

```text
DESFAZER TRANSAÇÃO
```

## Venda

```text
INICIAR TRANSAÇÃO

Validar estoque
Criar venda
Atualizar estoque
Criar movimentação de estoque
Criar movimentação financeira

CONFIRMAR TRANSAÇÃO
```

Isso evita situações como uma venda registrada sem baixa no estoque.

---

# 28. Concorrência no estoque

A baixa de estoque deverá considerar concorrência.

Exemplo:

```text
Estoque = 5
```

Dois usuários tentam vender:

```text
Usuário A → 4 unidades
Usuário B → 4 unidades
```

O sistema não poderá permitir que o estoque fique negativo.

A operação deverá utilizar transação e mecanismos de bloqueio/atualização atômica adequados ao banco de dados.

---

# 29. Auditoria

Tabela:

```text
registros_auditoria
```

Campos:

* `id`
* `usuario_id`
* `acao`
* `entidade`
* `entidade_id`
* `dados`
* `criado_em`

Exemplos de ações:

```text
LOGIN
CRIAR_PRODUTO
ATUALIZAR_PRODUTO
CRIAR_COMPRA
CRIAR_VENDA
CRIAR_LANCAMENTO_FINANCEIRO
```

A auditoria deverá evitar armazenar senhas, tokens ou outros dados sensíveis.

---

# 30. Tratamento de erros

O back-end deverá possuir tratamento centralizado de erros.

Não retornar informações internas da aplicação.

Em produção, evitar respostas contendo detalhes técnicos da implementação.

O usuário deverá receber uma mensagem amigável.

Os detalhes técnicos deverão permanecer nos logs internos.

---

# 31. Paginação

Listagens deverão utilizar paginação.

Exemplo:

```text
GET /api/produtos?pagina=1&limite=20
```

Resposta:

```json
{
  "dados": [],
  "paginacao": {
    "pagina": 1,
    "limite": 20,
    "total": 100,
    "total_paginas": 5
  }
}
```

---

# 32. Filtros

As principais listagens deverão permitir filtros.

## Vendas

* Data inicial;
* Data final;
* Produto;
* Cliente.

## Compras

* Data inicial;
* Data final;
* Produto;
* Fornecedor.

## Financeiro

* Data inicial;
* Data final;
* Tipo;
* Categoria.

---

# 33. Regras de validação

## Produto

```text
descricao obrigatória
```

## Fornecedor

```text
nome obrigatório
```

## Cliente

```text
nome obrigatório
telefone opcional
```

## Compra

```text
data_compra obrigatória
produto_id obrigatório
quantidade > 0
valor_unitario >= 0
fornecedor_id obrigatório
```

## Venda

```text
data_venda obrigatória
produto_id obrigatório
quantidade > 0
valor_unitario >= 0
cliente_id conforme regra definida
```

## Financeiro

```text
descricao obrigatória
valor > 0
data_lancamento obrigatória
tipo obrigatório
```

---

# 34. Testes

O projeto deverá possuir testes automatizados.

## Back-end

Testar principalmente:

* Login;
* Senha inválida;
* Usuário inexistente;
* Usuário inativo;
* Criação de produto;
* Criação de fornecedor;
* Criação de cliente;
* Compra;
* Venda;
* Estoque;
* Venda sem estoque;
* Financeiro;
* Relatórios;
* Permissões.

## Front-end

Testar principalmente:

* Login;
* Formulários;
* Validações;
* Navegação;
* Exibição de erros;
* Permissões.

## Testes de integração

Deverão validar fluxos completos.

Exemplo:

```text
Criar produto
    ↓
Registrar compra
    ↓
Verificar estoque
    ↓
Registrar venda
    ↓
Verificar estoque
    ↓
Verificar financeiro
```

---

# 35. Roadmap de desenvolvimento

## Fase 1 — Fundação

* [ ] Criar repositório;
* [ ] Configurar TypeScript;
* [ ] Configurar React;
* [ ] Configurar Node.js;
* [ ] Configurar banco;
* [ ] Configurar Prisma;
* [ ] Configurar Docker;
* [ ] Criar estrutura inicial;
* [ ] Configurar lint;
* [ ] Configurar formatter;
* [ ] Configurar testes.

## Fase 2 — Segurança e autenticação

* [ ] Criar tabela de usuários;
* [ ] Implementar hash de senha;
* [ ] Implementar login;
* [ ] Implementar logout;
* [ ] Implementar sessão/token;
* [ ] Implementar middleware de autenticação;
* [ ] Implementar autorização;
* [ ] Implementar limitação de requisições;
* [ ] Configurar headers de segurança.

## Fase 3 — Cadastros

* [ ] Produtos;
* [ ] Fornecedores;
* [ ] Clientes;
* [ ] Usuários.

## Fase 4 — Estoque

* [ ] Criar movimentação de estoque;
* [ ] Integrar compras;
* [ ] Integrar vendas;
* [ ] Implementar validação de estoque;
* [ ] Implementar histórico de movimentações;
* [ ] Implementar ajuste manual.

## Fase 5 — Compras

* [ ] Tela de compras;
* [ ] API de compras;
* [ ] Validações;
* [ ] Atualização de estoque;
* [ ] Integração financeira;
* [ ] Testes.

## Fase 6 — Vendas

* [ ] Tela de vendas;
* [ ] API de vendas;
* [ ] Validações;
* [ ] Validação de estoque;
* [ ] Atualização de estoque;
* [ ] Integração financeira;
* [ ] Testes.

## Fase 7 — Financeiro

* [ ] Lançamento manual de entradas;
* [ ] Lançamento manual de saídas;
* [ ] Extrato;
* [ ] Categorias;
* [ ] Integração com compras;
* [ ] Integração com vendas;
* [ ] Cálculo de saldo.

## Fase 8 — Relatórios

* [ ] Relatório semanal de vendas;
* [ ] Relatório mensal de vendas;
* [ ] Relatório por período;
* [ ] Relatório semanal de compras;
* [ ] Relatório mensal de compras;
* [ ] Relatório financeiro;
* [ ] Dashboard.

## Fase 9 — Qualidade e segurança

* [ ] Testes automatizados;
* [ ] Testes de integração;
* [ ] Teste de permissões;
* [ ] Teste de concorrência de estoque;
* [ ] Análise de segurança;
* [ ] Revisão de logs;
* [ ] Revisão de secrets;
* [ ] Backup;
* [ ] Teste de restauração.

## Fase 10 — Deploy

* [ ] Configurar ambiente de produção;
* [ ] Configurar HTTPS;
* [ ] Configurar banco de produção;
* [ ] Configurar backup;
* [ ] Configurar monitoramento;
* [ ] Configurar logs;
* [ ] Executar migrations;
* [ ] Criar usuário administrador;
* [ ] Realizar testes finais.

---

# 36. Futuras funcionalidades

## 36.1 Importação de nota fiscal XML

O sistema deverá ser preparado para futuramente receber arquivos XML de notas fiscais.

Fluxo esperado:

```text
Upload do XML
   ↓
Validação do XML
   ↓
Leitura dos dados
   ↓
Identificação dos produtos
   ↓
Identificação do fornecedor
   ↓
Pré-visualização
   ↓
Confirmação do usuário
   ↓
Criação da compra
   ↓
Atualização do estoque
   ↓
Atualização financeira
```

A importação deverá possuir uma etapa de pré-visualização e confirmação antes de efetivar alterações no banco.

Também deverá considerar:

* Produto ainda não cadastrado;
* Fornecedor ainda não cadastrado;
* Produto com código diferente;
* Nota duplicada;
* XML inválido;
* Dados inconsistentes.

---

# 37. Futuro aplicativo Android

A arquitetura deverá permitir futuramente que um aplicativo Android consuma a mesma API do sistema.

Não será necessário desenvolver o aplicativo no MVP.

A API deverá ser construída de forma independente do front-end React.

Arquitetura:

```text
              ┌───────────────────┐
              │   API Node.js     │
              │   TypeScript      │
              └─────────┬─────────┘
                        │
             ┌──────────┴──────────┐
             │                     │
   ┌─────────▼─────────┐ ┌────────▼─────────┐
   │ Front-end React   │ │ Aplicativo       │
   │ TypeScript        │ │ Android          │
   └───────────────────┘ └──────────────────┘
```

Isso permitirá que ambos utilizem as mesmas regras de negócio.

---

# 38. Princípios arquiteturais

O desenvolvimento deverá seguir:

1. Simplicidade antes de complexidade;
2. Segurança desde o início;
3. Regras de negócio no back-end;
4. Front-end independente do banco de dados;
5. API independente do front-end;
6. Integridade dos dados;
7. Operações financeiras e de estoque transacionais;
8. Histórico preservado;
9. Código modular;
10. Testabilidade;
11. Configuração por ambiente;
12. Preparação para futuras integrações.

---

# 39. Configuração recomendada

```text
Front-end:
React + TypeScript + Vite

Back-end:
Node.js + TypeScript + Fastify

ORM:
Prisma

Banco:
MySQL ou MariaDB

Validação:
Zod

Hash de senha:
Argon2id

API:
REST

Container:
Docker + Docker Compose

Testes:
Vitest + testes de integração

Controle de versão:
Git
```

---

# 40. Resultado esperado

Ao final do MVP, o sistema deverá permitir que um usuário autenticado execute o fluxo completo:

```text
Cadastrar Produto
       ↓
Cadastrar Fornecedor
       ↓
Registrar Compra
       ↓
Produto entra no estoque
       ↓
Cadastrar Cliente
       ↓
Registrar Venda
       ↓
Produto sai do estoque
       ↓
Movimentação financeira
       ↓
Consultar Dashboard
       ↓
Consultar Relatórios
```

O sistema deverá ser pequeno o suficiente para ser simples de utilizar, mas possuir uma arquitetura organizada o suficiente para suportar as futuras funcionalidades de **importação de notas fiscais XML** e **acesso via Android** sem necessidade de reescrever a aplicação.

---

# 41. Prioridade de implementação

```text
1. Fundação do projeto
2. Banco de dados
3. Autenticação
4. Usuários e permissões
5. Produtos
6. Fornecedores
7. Clientes
8. Estoque
9. Compras
10. Vendas
11. Financeiro
12. Relatórios
13. Dashboard
14. Auditoria
15. Testes
16. Segurança
17. Deploy
18. Funcionalidades futuras
```
