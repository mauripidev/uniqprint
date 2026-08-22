# Skill — Desenvolvimento Back-end

## Objetivo

Desenvolver e manter o back-end do sistema de controle de compras e vendas utilizando:

* Node.js;
* TypeScript;
* Fastify;
* Prisma;
* MySQL ou MariaDB;
* Zod;
* Argon2id;
* API REST.

O back-end será a autoridade do sistema para autenticação, autorização, regras de negócio, estoque, financeiro e integridade dos dados.

---

# 1. Regras obrigatórias

## 1.1 Idioma do código

Todos os nomes criados pela aplicação deverão utilizar **PT-BR**.

Isso inclui:

* Variáveis;
* Funções;
* Métodos;
* Classes;
* Interfaces;
* Tipos;
* Serviços;
* Controladores;
* Repositórios;
* Casos de uso;
* DTOs;
* Schemas;
* Rotas;
* Tabelas;
* Campos;
* Mensagens;
* Erros;
* Eventos.

Exemplos:

```typescript
criarProduto()
buscarProdutoPorId()
listarProdutos()
atualizarProduto()
inativarProduto()

registrarCompra()
registrarVenda()

adicionarEstoque()
removerEstoque()
ajustarEstoque()

criarLancamentoFinanceiro()
gerarRelatorioVendas()
```

Evitar:

```typescript
createProduct()
findProductById()
listProducts()
updateProduct()
deleteProduct()

registerPurchase()
registerSale()

updateStock()
generateSalesReport()
```

Nomes provenientes de bibliotecas externas poderão permanecer no idioma original.

---

# 2. Arquitetura

Utilizar arquitetura modular.

Estrutura sugerida:

```text
backend/
├── src/
│   ├── modulos/
│   │   ├── autenticacao/
│   │   ├── usuarios/
│   │   ├── produtos/
│   │   ├── fornecedores/
│   │   ├── clientes/
│   │   ├── compras/
│   │   ├── vendas/
│   │   ├── estoque/
│   │   ├── financeiro/
│   │   ├── relatorios/
│   │   └── auditoria/
│   │
│   ├── banco_de_dados/
│   ├── middlewares/
│   ├── plugins/
│   ├── configuracao/
│   ├── compartilhado/
│   └── aplicativo.ts
│
├── prisma/
│   └── schema.prisma
│
└── package.json
```

Cada módulo deverá possuir responsabilidade bem definida.

---

# 3. Separação de responsabilidades

Sempre que possível separar:

```text
Rota
 ↓
Controlador
 ↓
Caso de uso/Serviço
 ↓
Repositório
 ↓
Banco de dados
```

Exemplo:

```text
POST /api/vendas
       ↓
controladorVendas
       ↓
registrarVenda
       ↓
repositorioVendas
       ↓
Prisma
       ↓
MySQL/MariaDB
```

A rota não deverá conter toda a regra de negócio.

---

# 4. Banco de dados

Utilizar Prisma.

O banco poderá ser:

```text
MySQL
```

ou:

```text
MariaDB
```

Todas as alterações estruturais deverão ser realizadas através de migrations.

Não alterar manualmente o banco de produção sem um procedimento controlado.

---

# 5. Convenções do banco

Utilizar nomes em PT-BR.

Exemplo:

```text
usuarios
produtos
fornecedores
clientes
compras
vendas
movimentacoes_estoque
lancamentos_financeiros
registros_auditoria
```

Campos:

```text
id
nome
descricao
quantidade
valor
criado_em
atualizado_em
```

Não utilizar:

```text
identifier
product
supplier
customer
created_at
updated_at
```

---

# 6. Identificadores

As entidades deverão possuir apenas o `id` como identificador interno.

Não criar:

```text
identifier
codigo_interno
identificador
```

sem uma necessidade de negócio claramente definida.

O usuário não deverá precisar informar o `id`.

O `id` será gerado automaticamente.

---

# 7. Modelo de usuário

Tabela:

```text
usuarios
```

Campos:

```text
id
email
senha_hash
nome
ativo
criado_em
atualizado_em
ultimo_login_em
```

`email` deverá possuir índice único.

---

# 8. Senhas

Senhas nunca poderão ser armazenadas em texto puro.

Utilizar:

```text
Argon2id
```

Como alternativa:

```text
bcrypt
```

Exemplo conceitual:

```typescript
senhaHash = gerarHashSenha(senha)
```

Para autenticação:

```typescript
senhaValida = compararSenha(senha, usuario.senha_hash)
```

Nunca criar criptografia própria.

Nunca armazenar:

```text
senha
senha_original
senha_criptografada_reversivel
```

---

# 9. Autenticação

Implementar:

```text
POST /api/autenticacao/login
POST /api/autenticacao/logout
GET /api/autenticacao/eu
```

Fluxo:

```text
E-mail + senha
      ↓
Buscar usuário
      ↓
Verificar usuário ativo
      ↓
Comparar senha
      ↓
Criar sessão/token
      ↓
Retornar usuário autenticado
```

Falha de autenticação deverá retornar mensagem genérica.

Não informar se o e-mail existe ou não quando isso puder facilitar enumeração de usuários.

---

# 10. Autorização

Autenticação responde:

```text
Quem é o usuário?
```

Autorização responde:

```text
O que esse usuário pode fazer?
```

As duas responsabilidades deverão ser separadas.

A autorização deverá ser validada no back-end.

Nunca confiar no front-end.

---

# 11. Segurança

Implementar proteção contra:

* SQL Injection;
* XSS;
* CSRF quando aplicável;
* Brute force;
* Enumeração de usuários;
* Mass assignment;
* Manipulação de IDs;
* Acesso não autorizado;
* Dados inválidos;
* Requisições excessivas;
* Vazamento de informações;
* Secrets expostos;
* Erros internos expostos.

Utilizar:

* Prisma;
* Validação com Zod;
* Rate limiting;
* Headers de segurança;
* CORS configurado;
* HTTPS em produção;
* Cookies seguros quando utilizados.

---

# 12. Validação

Toda entrada externa deverá ser validada.

Entradas incluem:

* Body;
* Query string;
* Parâmetros;
* Headers relevantes;
* Arquivos;
* Dados de integrações.

Utilizar Zod ou mecanismo equivalente.

Nunca confiar no TypeScript para validar dados recebidos pela API.

---

# 13. Produto

Modelo:

```text
Produto
├── id
├── descricao
├── quantidade_estoque
├── ativo
├── criado_em
└── atualizado_em
```

Funções:

```typescript
criarProduto()
buscarProdutoPorId()
listarProdutos()
atualizarProduto()
inativarProduto()
```

Regras:

* `descricao` obrigatória;
* Produto inativo não deve ser utilizado em novas operações;
* Histórico deverá ser preservado;
* Estoque não poderá ficar negativo.

---

# 14. Fornecedor

Modelo:

```text
Fornecedor
├── id
├── nome
├── observacao
├── ativo
├── criado_em
└── atualizado_em
```

Funções:

```typescript
criarFornecedor()
buscarFornecedorPorId()
listarFornecedores()
atualizarFornecedor()
inativarFornecedor()
```

---

# 15. Cliente

Modelo:

```text
Cliente
├── id
├── nome
├── telefone
├── observacao
├── ativo
├── criado_em
└── atualizado_em
```

Funções:

```typescript
criarCliente()
buscarClientePorId()
listarClientes()
atualizarCliente()
inativarCliente()
```

---

# 16. Compra

Modelo:

```text
Compra
├── id
├── data_compra
├── produto_id
├── quantidade
├── valor_unitario
├── valor_total
├── fornecedor_id
├── criado_em
└── atualizado_em
```

Função principal:

```typescript
registrarCompra()
```

Fluxo obrigatório:

```text
Validar dados
     ↓
Validar produto
     ↓
Validar fornecedor
     ↓
Calcular valor total
     ↓
Criar compra
     ↓
Adicionar estoque
     ↓
Registrar movimentação de estoque
     ↓
Registrar financeiro quando aplicável
```

Tudo deverá ocorrer dentro de uma transação.

---

# 17. Venda

Modelo:

```text
Venda
├── id
├── data_venda
├── produto_id
├── quantidade
├── valor_unitario
├── valor_total
├── cliente_id
├── criado_em
└── atualizado_em
```

Função principal:

```typescript
registrarVenda()
```

Fluxo obrigatório:

```text
Validar dados
     ↓
Validar produto
     ↓
Validar cliente
     ↓
Verificar estoque
     ↓
Calcular valor total
     ↓
Criar venda
     ↓
Remover estoque
     ↓
Registrar movimentação de estoque
     ↓
Registrar financeiro quando aplicável
```

Tudo deverá ocorrer dentro de uma transação.

---

# 18. Estoque

Tabela:

```text
movimentacoes_estoque
```

Campos:

```text
id
produto_id
tipo
quantidade
tipo_referencia
referencia_id
criado_em
```

Tipos:

```text
ENTRADA
SAIDA
AJUSTE
```

Funções:

```typescript
buscarEstoque()
adicionarEstoque()
removerEstoque()
ajustarEstoque()
listarMovimentacoesEstoque()
```

---

# 19. Regra crítica do estoque

Nunca permitir:

```text
quantidade_estoque < 0
```

Antes de uma saída:

```text
if estoque < quantidade
    rejeitar operação
```

Entretanto, essa verificação deverá ser feita de forma segura dentro da transação para evitar problemas de concorrência.

Não fazer somente:

```text
buscar estoque
verificar
depois atualizar
```

sem proteção transacional.

---

# 20. Concorrência

Exemplo:

```text
Estoque = 5
```

Usuário A:

```text
Venda de 4
```

Usuário B:

```text
Venda de 4
```

Somente uma operação poderá consumir o estoque disponível.

Utilizar mecanismos transacionais e de concorrência suportados pelo banco.

---

# 21. Financeiro

Tabela:

```text
lancamentos_financeiros
```

Campos:

```text
id
tipo
descricao
valor
data_lancamento
categoria
tipo_referencia
referencia_id
observacao
criado_em
atualizado_em
```

Tipos:

```text
ENTRADA
SAIDA
```

Funções:

```typescript
criarLancamentoFinanceiro()
buscarLancamentoFinanceiroPorId()
listarLancamentosFinanceiros()
atualizarLancamentoFinanceiro()
excluirLancamentoFinanceiro()
calcularSaldoFinanceiro()
```

---

# 22. Compras e financeiro

Quando configurado para gerar movimentação financeira automaticamente:

```text
Compra
  ↓
Lançamento financeiro
  ↓
SAIDA
```

A relação deverá ser armazenada através de:

```text
tipo_referencia
referencia_id
```

Não duplicar informações desnecessariamente.

---

# 23. Vendas e financeiro

Quando configurado para gerar movimentação financeira automaticamente:

```text
Venda
  ↓
Lançamento financeiro
  ↓
ENTRADA
```

A relação deverá permitir identificar a origem do lançamento.

---

# 24. Relatórios

Implementar:

```typescript
gerarRelatorioVendas()
gerarRelatorioCompras()
gerarRelatorioFinanceiro()
```

Filtros:

```text
data_inicial
data_final
produto_id
cliente_id
fornecedor_id
tipo
categoria
```

Os filtros deverão ser aplicados no banco sempre que possível.

Evitar buscar todos os registros para depois filtrar em memória.

---

# 25. Relatório de vendas

Deverá permitir:

* Semana;
* Mês;
* Período personalizado.

Informações:

```text
data
produto
quantidade
valor_unitario
valor_total
cliente
```

Resumo:

```text
quantidade_total
valor_total
quantidade_vendas
```

---

# 26. Relatório de compras

Deverá permitir:

* Semana;
* Mês;
* Período personalizado.

Informações:

```text
data
produto
quantidade
valor_unitario
valor_total
fornecedor
```

Resumo:

```text
quantidade_total
valor_total
quantidade_compras
```

---

# 27. API REST

Endpoints:

```text
POST   /api/autenticacao/login
POST   /api/autenticacao/logout
GET    /api/autenticacao/eu

GET    /api/produtos
GET    /api/produtos/:id
POST   /api/produtos
PUT    /api/produtos/:id
DELETE /api/produtos/:id

GET    /api/fornecedores
GET    /api/fornecedores/:id
POST   /api/fornecedores
PUT    /api/fornecedores/:id
DELETE /api/fornecedores/:id

GET    /api/clientes
GET    /api/clientes/:id
POST   /api/clientes
PUT    /api/clientes/:id
DELETE /api/clientes/:id

GET    /api/compras
GET    /api/compras/:id
POST   /api/compras

GET    /api/vendas
GET    /api/vendas/:id
POST   /api/vendas

GET    /api/estoque
GET    /api/estoque/:produto_id
POST   /api/estoque/ajustes
GET    /api/estoque/movimentacoes

GET    /api/lancamentos-financeiros
GET    /api/lancamentos-financeiros/:id
POST   /api/lancamentos-financeiros
PUT    /api/lancamentos-financeiros/:id
DELETE /api/lancamentos-financeiros/:id

GET    /api/relatorios/vendas
GET    /api/relatorios/compras
GET    /api/relatorios/financeiro
```

---

# 28. Respostas HTTP

Utilizar corretamente:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

---

# 29. Formato de resposta

Sucesso:

```json
{
  "dados": {},
  "mensagem": "Operação realizada com sucesso"
}
```

Lista:

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

Erro:

```json
{
  "erro": {
    "codigo": "DADOS_INVALIDOS",
    "mensagem": "Os dados informados são inválidos",
    "campos": {}
  }
}
```

As respostas deverão ser consistentes em toda a API.

---

# 30. Tratamento de erros

Implementar tratamento centralizado.

Erros internos não deverão ser enviados ao cliente.

Não retornar:

```text
stack trace
consulta SQL
credenciais
estrutura interna do banco
caminhos do servidor
```

Criar erros de domínio quando apropriado.

Exemplos:

```text
PRODUTO_NAO_ENCONTRADO
FORNECEDOR_NAO_ENCONTRADO
CLIENTE_NAO_ENCONTRADO
ESTOQUE_INSUFICIENTE
USUARIO_NAO_AUTORIZADO
DADOS_INVALIDOS
```

---

# 31. Auditoria

Tabela:

```text
registros_auditoria
```

Campos:

```text
id
usuario_id
acao
entidade
entidade_id
dados
criado_em
```

Registrar operações importantes:

```text
LOGIN
CRIAR_PRODUTO
ATUALIZAR_PRODUTO
INATIVAR_PRODUTO
CRIAR_COMPRA
CRIAR_VENDA
CRIAR_LANCAMENTO_FINANCEIRO
AJUSTAR_ESTOQUE
```

Nunca registrar:

```text
senha
senha_hash
token
cookie
secret
```

---

# 32. Exclusão

Evitar exclusão física de entidades que possuam histórico.

Preferir:

```text
ativo = false
```

Para:

* Produtos;
* Clientes;
* Fornecedores;
* Usuários.

Exclusão física somente deverá ser utilizada quando não houver dependências ou quando houver uma justificativa clara.

---

# 33. Paginação

Toda listagem potencialmente grande deverá possuir paginação.

Exemplo:

```text
GET /api/produtos?pagina=1&limite=20
```

Validar:

```text
pagina >= 1
limite > 0
limite <= limite_maximo
```

Não permitir que o cliente solicite quantidade ilimitada de registros.

---

# 34. Ordenação

Quando houver ordenação dinâmica, utilizar lista explícita de campos permitidos.

Nunca concatenar diretamente um campo recebido pelo usuário em uma consulta SQL.

Exemplo conceitual:

```typescript
const camposPermitidos = [
  "nome",
  "criado_em"
];
```

---

# 35. Configuração

Utilizar variáveis de ambiente.

Exemplo:

```env
AMBIENTE=
PORTA=
BANCO_DE_DADOS_URL=
SEGREDO_SESSAO=
ORIGEM_FRONTEND=
```

Secrets não devem ser versionados.

Validar as variáveis obrigatórias na inicialização da aplicação.

Se uma configuração crítica estiver ausente, a aplicação deverá falhar de maneira clara.

---

# 36. Logs

Utilizar logs estruturados.

Registrar:

* Inicialização;
* Erros;
* Operações importantes;
* Tentativas de autenticação;
* Falhas de integração;
* Eventos críticos.

Não registrar:

* Senhas;
* Tokens;
* Cookies;
* Secrets;
* Dados sensíveis desnecessários.

---

# 37. Banco e transações

Utilizar transações nas operações que envolvem múltiplas alterações.

Exemplo:

```text
registrarVenda()
    ↓
INICIAR TRANSAÇÃO
    ↓
validarEstoque()
    ↓
criarVenda()
    ↓
removerEstoque()
    ↓
criarMovimentacaoEstoque()
    ↓
criarLancamentoFinanceiro()
    ↓
CONFIRMAR TRANSAÇÃO
```

Se qualquer etapa falhar:

```text
DESFAZER TRANSAÇÃO
```

Nenhuma operação parcialmente concluída deverá permanecer no banco.

---

# 38. Valores monetários

Nunca utilizar ponto flutuante de maneira ingênua para representar valores monetários.

No banco, utilizar:

```text
DECIMAL
```

Exemplo conceitual:

```text
DECIMAL(15,2)
```

Os valores deverão ser tratados cuidadosamente para evitar erros de arredondamento.

---

# 39. Datas

Utilizar nomes explícitos:

```text
data_compra
data_venda
data_lancamento
criado_em
atualizado_em
ultimo_login_em
```

Definir uma política única de fuso horário para o sistema.

Conversões entre banco, API e front-end deverão ser consistentes.

---

# 40. Testes

Implementar testes unitários, integração e, quando necessário, testes de API.

Testar obrigatoriamente:

### Autenticação

```text
login válido
senha inválida
usuário inexistente
usuário inativo
```

### Produtos

```text
criação
consulta
alteração
inativação
```

### Compras

```text
compra válida
produto inexistente
fornecedor inexistente
quantidade inválida
valor inválido
atualização do estoque
```

### Vendas

```text
venda válida
produto inexistente
cliente inexistente
quantidade inválida
estoque insuficiente
atualização do estoque
```

### Financeiro

```text
entrada
saída
saldo
```

### Segurança

```text
acesso sem autenticação
acesso sem permissão
tentativa de acesso a recurso de outro contexto
rate limiting
validação de entrada
```

---

# 41. Teste de fluxo completo

Deverá existir pelo menos um teste representando o fluxo:

```text
Criar produto
      ↓
Criar fornecedor
      ↓
Criar compra
      ↓
Verificar estoque
      ↓
Criar cliente
      ↓
Criar venda
      ↓
Verificar estoque
      ↓
Verificar movimentação de estoque
      ↓
Verificar movimentação financeira
      ↓
Gerar relatório
```

---

# 42. Performance

Priorizar consultas eficientes.

Regras:

* Utilizar índices;
* Utilizar paginação;
* Evitar N+1;
* Filtrar no banco;
* Agregar no banco quando apropriado;
* Não carregar dados desnecessários;
* Selecionar somente campos necessários quando apropriado.

---

# 43. Integridade

Utilizar:

* Chaves estrangeiras;
* Índices;
* Restrições;
* Transações;
* Valores padrão quando apropriado;
* Campos obrigatórios;
* Tipos adequados.

O banco deverá impedir estados inválidos sempre que possível.

---

# 44. Preparação para XML

A arquitetura deverá permitir futuramente um módulo:

```text
modulos/
└── notas_fiscais/
```

Possíveis funções:

```typescript
validarArquivoXml()
lerNotaFiscalXml()
identificarFornecedor()
identificarProdutos()
verificarNotaDuplicada()
prepararCompraDaNota()
importarNotaFiscal()
```

A importação deverá ser desacoplada do módulo atual de compras.

Fluxo futuro:

```text
XML
 ↓
Leitura
 ↓
Validação
 ↓
Pré-visualização
 ↓
Confirmação
 ↓
Compra
 ↓
Estoque
 ↓
Financeiro
```

---

# 45. Preparação para Android

O back-end não deverá depender do front-end React.

Todas as regras de negócio deverão estar disponíveis através da API.

Arquitetura:

```text
             API
              │
       ┌──────┴──────┐
       │             │
    React         Android
```

Isso permitirá que o aplicativo Android futuro utilize:

* Autenticação;
* Produtos;
* Clientes;
* Fornecedores;
* Estoque;
* Vendas;
* Compras;
* Financeiro;

de acordo com as permissões concedidas.

---

# 46. Proibições

Não:

* Criar campo `identifier`;
* Criar regras de negócio somente no front-end;
* Armazenar senha;
* Criar algoritmo próprio de hash;
* Confiar em dados enviados pelo cliente;
* Permitir SQL construído diretamente com entrada do usuário;
* Retornar stack trace em produção;
* Expor secrets;
* Permitir estoque negativo;
* Registrar venda parcialmente;
* Registrar compra parcialmente;
* Ignorar transações em operações críticas;
* Excluir histórico comercial sem justificativa;
* Usar `any` indiscriminadamente;
* Criar funções gigantes;
* Misturar acesso ao banco diretamente em controladores;
* Duplicar regras de negócio entre módulos.

---

# 47. Ordem de implementação

Implementar preferencialmente nesta ordem:

```text
1. Configuração do projeto
2. Banco de dados
3. Prisma
4. Usuários
5. Autenticação
6. Autorização
7. Produtos
8. Fornecedores
9. Clientes
10. Estoque
11. Compras
12. Vendas
13. Financeiro
14. Relatórios
15. Auditoria
16. Testes
17. Segurança
18. Performance
19. Deploy
```

---

# 48. Critério de conclusão

Uma funcionalidade de back-end estará concluída quando:

* Possuir modelo de dados adequado;
* Possuir migration;
* Possuir validação;
* Possuir regras de negócio;
* Possuir autenticação quando necessária;
* Possuir autorização quando necessária;
* Possuir tratamento de erros;
* Possuir testes;
* Possuir logs apropriados;
* Utilizar transação quando necessário;
* Respeitar integridade do banco;
* Não expor informações sensíveis;
* Utilizar nomenclatura em PT-BR;
* Estar preparada para consumo pelo front-end React e futuramente pelo Android.
