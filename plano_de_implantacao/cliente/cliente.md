# PROMPT — IMPLEMENTAÇÃO DA FEATURE 4: CLIENTES

Você é responsável pela implementação da próxima feature do sistema **Uniqprint — Controle de Compras e Vendas**.

## CONTEXTO

As seguintes features já foram implementadas:

* Feature 0 — Fundação e Infraestrutura
* Feature 1 — Autenticação e Gestão de Usuários
* Feature 2 — Cadastro e Gestão de Produtos
* Feature 3 — Cadastro e Gestão de Fornecedores

A implementação de **Fornecedores está concluída**.

A próxima implementação, seguindo rigorosamente o roadmap e a arquitetura definida no projeto, é:

> **Feature 4 — Cadastro e Gestão de Clientes**

O plano define explicitamente que a Feature 4 deve contemplar:

* tabela `clientes`;
* módulo de back-end `clientes`;
* rotas `/api/clientes`;
* CRUD;
* paginação;
* busca;
* inativação lógica;
* tipos e serviço de API no front-end;
* página de Clientes;
* formulário de cadastro/edição;
* testes de API;
* testes da tela.

**NÃO implementar ainda Compras, Vendas, Estoque ou Financeiro.**

---

# 1. OBJETIVO

Implementar de forma completa o módulo de **Clientes**, seguindo o mesmo padrão arquitetural utilizado nas features de Produtos e Fornecedores.

O módulo deverá permitir:

* cadastrar clientes;
* listar clientes;
* pesquisar clientes;
* consultar cliente por ID;
* editar clientes;
* inativar clientes;
* filtrar clientes ativos/inativos;
* preservar clientes que possuam histórico;
* utilizar autenticação existente;
* respeitar autorização existente;
* preparar a entidade para utilização futura pelo módulo de Vendas.

---

# 2. ARQUITETURA OBRIGATÓRIA

A implementação deve seguir o conceito de **Desenvolvimento Vertical por Feature**.

Uma feature não está concluída apenas quando o back-end funciona.

Implementar obrigatoriamente:

```text
Banco / Prisma
      ↓
Back-end / API
      ↓
Front-end
      ↓
Testes automatizados
```

Essa é a arquitetura definida no projeto.

---

# 3. CAMADAS DO BACK-END

Respeitar exatamente o fluxo:

```text
Rota Fastify
      ↓
Controlador
      ↓
Serviço / Caso de Uso
      ↓
Repositório
      ↓
Prisma ORM
      ↓
MySQL / MariaDB
```

Não colocar regras de negócio diretamente nas rotas.

Não acessar Prisma diretamente pelo controlador.

Não acessar banco diretamente pelo front-end.

---

# 4. FLUXO DO FRONT-END

Respeitar:

```text
Página / Componente
      ↓
Hook / Estado
      ↓
Serviço de API
      ↓
Backend REST
```

O front-end deve ser completamente desacoplado do banco.

O back-end deve permanecer independente do React, pois futuramente a API poderá ser utilizada por aplicações como Android.

---

# 5. ANÁLISE OBRIGATÓRIA ANTES DE CODIFICAR

Antes de criar ou alterar qualquer arquivo:

1. analisar a estrutura atual do projeto;
2. analisar o módulo `produtos`;
3. analisar o módulo `fornecedores`;
4. identificar o padrão de repository;
5. identificar o padrão de service/caso de uso;
6. identificar o padrão de controller;
7. identificar o padrão de rotas;
8. identificar o padrão de schemas Zod;
9. identificar o padrão de tratamento de erros;
10. identificar o padrão de autenticação;
11. identificar o padrão de autorização;
12. identificar o padrão visual da tela de Fornecedores;
13. identificar o padrão de testes;
14. verificar o estado atual do Prisma;
15. verificar as migrations existentes.

**O módulo de Clientes deve seguir o padrão já estabelecido por Produtos e Fornecedores.**

Não criar uma arquitetura paralela.

---

# 6. NOMENCLATURA

O projeto exige nomenclatura **100% PT-BR** para o domínio.

Utilizar:

```text
cliente
nome
telefone
observacao
ativo
criado_em
atualizado_em
```

Funções:

```text
criarCliente()
buscarClientePorId()
listarClientes()
atualizarCliente()
inativarCliente()
```

Arquivos:

```text
FormularioCliente.tsx
TabelaClientes.tsx
servicos/clientes.ts
```

Rotas:

```text
/api/clientes
```

Não utilizar nomes em inglês para entidades ou regras do domínio.

Evitar:

```text
customer
name
phone
observation
active
createCustomer()
updateCustomer()
```

---

# 7. BANCO DE DADOS

Criar o modelo Prisma:

```text
clientes
```

A especificação define os seguintes campos:

```text
id
nome
telefone
observacao
ativo
criado_em
atualizado_em
```

Essa estrutura está explicitamente definida no plano de banco de dados.

## Regras

### `id`

* numérico;
* gerado automaticamente;
* chave primária;
* não criar `identifier`.

### `nome`

* obrigatório;
* não pode ser vazio;
* remover espaços desnecessários;
* validar tamanho.

### `telefone`

* campo previsto no modelo;
* validar formato de acordo com as regras existentes no projeto;
* não inventar requisitos adicionais não definidos pela fonte.

### `observacao`

* opcional;
* aceitar ausência do campo;
* validar tamanho quando aplicável.

### `ativo`

Utilizar:

```text
true
false
```

para permitir inativação lógica.

### Timestamps

Utilizar:

```text
criado_em
atualizado_em
```

---

# 8. PRESERVAÇÃO DE HISTÓRICO

Clientes devem utilizar exclusão lógica.

O projeto define explicitamente:

```text
ativo = false
```

para preservação de histórico.

Portanto:

```text
DELETE físico
    ❌
```

Não utilizar exclusão física.

O cliente deverá permanecer no banco para que futuras vendas possam manter seu histórico.

---

# 9. MIGRATION

Antes de criar a migration:

1. verificar `schema.prisma`;
2. verificar migrations existentes;
3. verificar se `clientes` já existe;
4. verificar relacionamentos atuais;
5. evitar alterações desnecessárias nas tabelas existentes.

Criar somente a migration necessária para Clientes.

Não apagar dados.

Não recriar Produtos ou Fornecedores.

---

# 10. BACK-END — MÓDULO CLIENTES

Criar:

```text
backend/src/modulos/clientes/
```

Seguir o padrão estrutural já existente.

Exemplo:

```text
clientes/
├── controladores/
├── servicos/
├── repositorios/
├── schemas/
├── tipos/
└── rotas/
```

Se o módulo de Fornecedores utilizar estrutura diferente, copiar o padrão real utilizado por ele.

---

# 11. ENDPOINTS

Implementar:

```http
GET    /api/clientes
GET    /api/clientes/:id
POST   /api/clientes
PUT    /api/clientes/:id
DELETE /api/clientes/:id
```

A Feature 4 define `/api/clientes` com CRUD, paginação, busca e inativação lógica.

O `DELETE` deverá realizar inativação lógica.

---

# 12. LISTAGEM

Implementar:

```http
GET /api/clientes
```

Utilizar paginação.

Seguir exatamente o padrão implementado em Produtos e Fornecedores.

Exemplo:

```http
GET /api/clientes?pagina=1&limite=20
```

Resposta esperada conceitualmente:

```json
{
  "dados": [],
  "paginacao": {
    "pagina": 1,
    "limite": 20,
    "total": 0,
    "total_paginas": 0
  }
}
```

Não criar um formato diferente sem necessidade.

---

# 13. PESQUISA

Permitir busca de clientes.

Exemplo:

```http
GET /api/clientes?pagina=1&limite=20&busca=joao
```

A pesquisa deverá ocorrer no banco de dados.

Não carregar todos os clientes em memória para realizar o filtro.

Utilizar o mesmo padrão de busca adotado nas features anteriores.

---

# 14. FILTRO POR STATUS

Permitir:

```text
Todos
Ativos
Inativos
```

Exemplo:

```http
GET /api/clientes?ativo=true
```

Seguir o comportamento já implementado em Produtos e Fornecedores.

---

# 15. CADASTRO

Implementar:

```http
POST /api/clientes
```

Payload:

```json
{
  "nome": "João da Silva",
  "telefone": "(11) 99999-9999",
  "observacao": "Cliente recorrente"
}
```

Regras:

* `nome` obrigatório;
* `nome` não pode ser vazio;
* remover espaços desnecessários;
* validar tamanho;
* `telefone` deve ser validado;
* `observacao` opcional;
* cliente novo deve ser criado como ativo;
* entrada deve ser validada com Zod.

Não criar campos adicionais que não estejam previstos na especificação.

---

# 16. VALIDAÇÃO COM ZOD

Criar schemas para:

```text
criação
atualização
consulta
parâmetros de rota
```

Validar 100% das entradas recebidas pelo back-end.

Essa é uma regra de segurança explícita do projeto.

A validação do front-end não substitui a validação do back-end.

---

# 17. CONSULTA POR ID

Implementar:

```http
GET /api/clientes/:id
```

Quando encontrado:

```text
HTTP 200
```

Quando não encontrado:

```text
HTTP 404
```

Retornar mensagem amigável.

Nunca expor:

```text
stack trace
SQL
detalhes internos
dados sensíveis
```

---

# 18. ATUALIZAÇÃO

Implementar:

```http
PUT /api/clientes/:id
```

Permitir atualização dos campos editáveis:

```text
nome
telefone
observacao
```

Não permitir alteração indevida de:

```text
id
criado_em
```

O comportamento de `ativo` deve seguir o padrão de inativação utilizado nos módulos anteriores.

---

# 19. INATIVAÇÃO

Implementar:

```http
DELETE /api/clientes/:id
```

O comportamento deve ser:

```text
cliente.ativo = false
```

Não executar:

```sql
DELETE FROM clientes
```

A exclusão lógica é uma regra geral do projeto para preservação de histórico.

---

# 20. REATIVAÇÃO

Antes de implementar reativação, verificar como Produtos e Fornecedores foram implementados.

Se existir uma funcionalidade de reativação nesses módulos:

> seguir o mesmo padrão para Clientes.

Se não existir:

> não criar uma regra isolada apenas para Clientes.

Manter consistência entre os módulos.

---

# 21. AUTENTICAÇÃO

Utilizar exclusivamente a autenticação existente.

Todas as operações protegidas devem utilizar o mecanismo atual.

Não criar:

```text
novo login
novo token
novo middleware
nova sessão
novo sistema de autenticação
```

---

# 22. AUTORIZAÇÃO

Utilizar o mecanismo de autorização existente.

A autorização deve ser validada no back-end.

Não confiar apenas em:

```text
botão oculto no React
```

O servidor deve impedir operações não autorizadas.

Não inventar novos níveis de permissão.

Se a implementação de Produtos/Fornecedores já possuir uma regra definida, reutilizá-la.

---

# 23. TRATAMENTO DE ERROS

Utilizar o mecanismo centralizado já existente.

Mensagens devem ser amigáveis.

Exemplos:

```text
Cliente não encontrado.
Nome do cliente é obrigatório.
Telefone inválido.
Não foi possível cadastrar o cliente.
Não foi possível atualizar o cliente.
Não foi possível inativar o cliente.
Usuário não possui permissão para realizar esta operação.
```

Nunca retornar:

```text
stack trace
SQL
credenciais
tokens
senhas
informações internas
```

O projeto determina explicitamente que erros internos não sejam expostos pela API.

---

# 24. FRONT-END

Criar a página:

```text
Clientes
```

Seguir visualmente o padrão já utilizado em:

```text
Produtos
Fornecedores
```

Não criar uma nova linguagem visual.

Reutilizar componentes existentes sempre que possível.

---

# 25. TIPOS TYPESCRIPT

Criar:

```text
frontend/src/tipos/clientes.ts
```

Definir o tipo:

```typescript
interface Cliente {
  id: number
  nome: string
  telefone: string
  observacao?: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
}
```

Adaptar ao padrão real do projeto.

Não duplicar tipos que já estejam disponíveis de forma compartilhada.

---

# 26. SERVIÇO DE API

Criar:

```text
frontend/src/servicos/clientes.ts
```

Disponibilizar métodos equivalentes a:

```text
listarClientes()
buscarClientePorId()
criarCliente()
atualizarCliente()
inativarCliente()
```

Seguir o mesmo padrão de:

```text
servicos/produtos.ts
servicos/fornecedores.ts
```

O serviço deve ser responsável somente pela comunicação com a API.

Não colocar regra de negócio nele.

---

# 27. PÁGINA DE CLIENTES

Criar:

```text
Clientes
```

Cabeçalho:

```text
Clientes

[ + Novo cliente ]
```

Pesquisa:

```text
Buscar cliente...
```

Filtro:

```text
Status:
[ Todos | Ativos | Inativos ]
```

---

# 28. TABELA

Exibir:

```text
ID
Nome
Telefone
Observação
Status
Criado em
Ações
```

Ações:

```text
Editar
Inativar
```

Para registros inativos, seguir o comportamento utilizado nos módulos anteriores.

---

# 29. FORMULÁRIO

Criar formulário para:

```text
Novo cliente
Editar cliente
```

Campos:

```text
Nome *
Telefone
Observação
```

Botões:

```text
Cancelar
Salvar
```

Durante o envio:

```text
Salvando...
```

Impedir múltiplos submits.

---

# 30. VALIDAÇÃO NO FRONT-END

Realizar validação para melhorar a experiência do usuário.

Validar:

```text
Nome obrigatório
Telefone
Limites de caracteres
```

Porém:

> a validação do front-end é apenas uma camada de UX.

A validação definitiva permanece no back-end.

---

# 31. UX

A tela deve possuir:

* carregamento;
* estado vazio;
* erro;
* sucesso;
* validação;
* confirmação de inativação;
* paginação;
* pesquisa;
* filtro;
* feedback de operações;
* responsividade.

Seguir o Design System existente.

---

# 32. ESTADOS

Implementar:

```text
Carregando
Dados carregados
Lista vazia
Erro
Salvando
Sucesso
Erro de validação
Erro de autorização
```

Estado vazio:

```text
Nenhum cliente encontrado.

[ Cadastrar cliente ]
```

---

# 33. RESPONSIVIDADE

Validar:

```text
Desktop
Tablet
Mobile
```

Garantir:

* formulário utilizável;
* tabela não quebrar o layout;
* ações acessíveis;
* pesquisa utilizável;
* filtros utilizáveis;
* paginação utilizável.

Seguir o padrão de Produtos e Fornecedores.

---

# 34. TESTES BACK-END

Implementar testes unitários e de integração.

## Cadastro

Testar:

```text
✓ cliente válido
✓ nome obrigatório
✓ nome vazio
✓ telefone válido
✓ telefone inválido
✓ observação opcional
✓ cliente criado como ativo
```

## Consulta

Testar:

```text
✓ listar clientes
✓ paginação
✓ busca
✓ filtro por status
✓ buscar por ID
✓ cliente inexistente
```

## Atualização

Testar:

```text
✓ atualizar nome
✓ atualizar telefone
✓ atualizar observação
✓ cliente inexistente
✓ dados inválidos
```

## Inativação

Testar:

```text
✓ inativar cliente
✓ cliente inexistente
✓ inativação lógica
✓ registro permanece no banco
```

## Segurança

Testar:

```text
✓ requisição sem autenticação
✓ usuário sem permissão
✓ usuário autorizado
```

---

# 35. TESTES FRONT-END

Utilizar o padrão existente no projeto, incluindo:

```text
Vitest
React Testing Library
```

Testar:

```text
✓ renderização
✓ carregamento
✓ listagem
✓ estado vazio
✓ busca
✓ filtro
✓ abertura do formulário
✓ validação
✓ criação
✓ edição
✓ inativação
✓ mensagens de erro
✓ mensagem de sucesso
✓ paginação
```

---

# 36. FLUXO INTEGRADO

Após implementar, validar:

```text
Login
   ↓
Usuário autenticado
   ↓
Abrir Clientes
   ↓
Listar clientes
   ↓
Cadastrar cliente
   ↓
Cliente aparece na lista
   ↓
Editar cliente
   ↓
Pesquisar cliente
   ↓
Filtrar cliente
   ↓
Inativar cliente
   ↓
Consultar clientes inativos
```

---

# 37. PREPARAÇÃO PARA A FEATURE DE VENDAS

A Feature seguinte será **Registro de Compras e Entrada de Estoque**.

Posteriormente haverá:

```text
Feature 6 — Registro de Vendas
```

A entidade Cliente deverá estar preparada para ser referenciada por `vendas`.

O modelo futuro definido pelo projeto possui:

```text
vendas
├── cliente_id
├── produto_id
├── quantidade
├── valor_unitario
└── valor_total
```

Não implementar a tabela `vendas` nesta etapa.

Não implementar regras de venda.

Apenas garantir que `clientes` seja uma entidade independente e adequada para futura referência.

---

# 38. NÃO IMPLEMENTAR NESTA ETAPA

Não implementar:

```text
❌ Compras
❌ Vendas
❌ Estoque
❌ Financeiro
❌ Relatórios
❌ Dashboard
❌ Auditoria completa
❌ Importação XML
❌ Aplicativo Android
```

A próxima etapa do roadmap após Clientes será Compras e Entrada de Estoque.

---

# 39. NÃO ALTERAR FUNCIONALIDADES EXISTENTES

Evitar alterações em:

```text
Autenticação
Usuários
Produtos
Fornecedores
```

Somente modificar funcionalidades existentes quando for estritamente necessário para integração ou correção de um problema diretamente relacionado à Feature 4.

Se for necessário alterar algo existente:

1. identificar o motivo;
2. explicar a alteração;
3. verificar regressões;
4. executar os testes correspondentes.

---

# 40. VERIFICAÇÃO TÉCNICA

Executar os scripts existentes no projeto.

Validar:

```text
TypeScript
Prisma
Migrations
Testes back-end
Testes front-end
Build
```

Depois iniciar:

```text
Back-end
Front-end
```

e realizar teste manual no navegador.

---

# 41. TESTES MANUAIS

Executar no navegador:

```text
1. Fazer login
2. Acessar Clientes
3. Listar clientes
4. Criar cliente
5. Editar cliente
6. Pesquisar cliente
7. Filtrar ativos
8. Filtrar inativos
9. Inativar cliente
10. Confirmar que o registro não foi excluído fisicamente
11. Testar erros de validação
12. Testar permissões
13. Testar responsividade
```

---

# 42. CRITÉRIOS DE ACEITE

A Feature 4 somente poderá ser considerada concluída quando:

```text
[✓] Modelo Prisma
[✓] Migration
[✓] Repository
[✓] Service
[✓] Controller
[✓] Rotas
[✓] Schemas Zod
[✓] Autenticação
[✓] Autorização
[✓] Paginação
[✓] Pesquisa
[✓] Filtro por status
[✓] Cadastro
[✓] Consulta
[✓] Edição
[✓] Inativação lógica
[✓] Preservação do histórico
[✓] Tipos TypeScript
[✓] Serviço de API
[✓] Página Clientes
[✓] Tabela
[✓] Formulário
[✓] Estados de interface
[✓] Feedbacks
[✓] Responsividade
[✓] Testes back-end
[✓] Testes front-end
[✓] Fluxo integrado
```

---

# 43. PROCEDIMENTO DE IMPLEMENTAÇÃO

Executar obrigatoriamente nesta ordem:

## Etapa 1 — Análise

```text
Projeto
Produtos
Fornecedores
Autenticação
Autorização
Prisma
Migrations
Design System
Testes
```

## Etapa 2 — Banco

```text
Modelo Cliente
Migration
```

## Etapa 3 — Back-end

```text
Repository
Service
Schemas
Controller
Rotas
```

## Etapa 4 — Front-end

```text
Tipos
Serviço API
Página
Tabela
Formulário
Estados
```

## Etapa 5 — Testes

```text
Testes unitários
Testes de integração
Testes de interface
```

## Etapa 6 — Validação

```text
Testes automatizados
Build
Execução local
Teste manual
Responsividade
```

---

# 44. RELATÓRIO FINAL

Ao finalizar, apresentar:

```text
1. Arquivos criados
2. Arquivos alterados
3. Modelo Prisma
4. Migration
5. Endpoints
6. Regras de negócio
7. Componentes front-end
8. Telas
9. Testes implementados
10. Resultado dos testes
11. Resultado do build
12. Problemas encontrados
13. Decisões arquiteturais
14. Pendências
```

Não declarar a feature como concluída caso existam:

```text
erros de compilação
testes quebrados
endpoints incompletos
telas incompletas
erros de integração
```

---

# 45. PRINCÍPIO FINAL

Manter rigorosamente:

```text
Simplicidade
Segurança
Modularidade
Testabilidade
Desacoplamento
Integridade dos dados
Regras de negócio no back-end
Nomenclatura PT-BR
Preservação de histórico
Compatibilidade com futuras features
```

A arquitetura do projeto determina que o back-end seja a autoridade final das regras de negócio e permaneça desacoplado do React.

A implementação desta etapa deve entregar uma **Feature 4 — Clientes completa e funcional**, sem antecipar a implementação de Compras ou qualquer feature posterior.

Ao concluir Clientes, a próxima implementação do roadmap será:

> **Feature 5 — Registro de Compras e Entrada de Estoque**
