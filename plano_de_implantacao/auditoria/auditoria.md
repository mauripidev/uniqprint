# PROMPT — IMPLEMENTAÇÃO DA FEATURE 11: AUDITORIA E TESTE DE FLUXO COMPLETO PONTA A PONTA

Você é responsável pela implementação da próxima e última feature vertical do MVP do sistema **Uniqprint — Controle de Compras e Vendas**.

## CONTEXTO

As seguintes features já foram implementadas:

* Feature 0 — Fundação e Infraestrutura
* Feature 1 — Autenticação e Gestão de Usuários
* Feature 2 — Cadastro e Gestão de Produtos
* Feature 3 — Cadastro e Gestão de Fornecedores
* Feature 4 — Cadastro e Gestão de Clientes
* Feature 5 — Registro de Compras e Entrada de Estoque
* Feature 6 — Registro de Vendas e Baixa de Estoque
* Feature 7 — Gestão e Ajustes Manuais de Estoque
* Feature 8 — Controle Financeiro Completo
* Feature 9 — Relatórios Gerenciais
* Feature 10 — Dashboard Consolidado

A próxima implementação é:

> **Feature 11 — Auditoria e Teste de Fluxo Completo Ponta a Ponta**

Essa feature deve fechar o ciclo do MVP, adicionando auditoria das operações críticas e validando o funcionamento integrado de todo o sistema.

A arquitetura define explicitamente:

```text
Feature 10 — Dashboard Consolidado
                ↓
Feature 11 — Auditoria e Teste de Fluxo Completo
```

---

# 1. OBJETIVO

Implementar dois grandes objetivos:

### Objetivo A — Auditoria

Criar um mecanismo centralizado para registrar operações críticas realizadas no sistema.

### Objetivo B — Validação ponta a ponta

Criar e executar testes automatizados capazes de validar o fluxo comercial completo:

```text
Produto
   ↓
Fornecedor
   ↓
Compra
   ↓
Estoque
   ↓
Cliente
   ↓
Venda
   ↓
Estoque
   ↓
Financeiro
   ↓
Relatórios
```

Esse fluxo é explicitamente definido na Feature 11.

---

# 2. REGRA ARQUITETURAL

Manter obrigatoriamente o desenvolvimento vertical:

```text
Banco / Prisma
      ↓
Back-end
      ↓
Front-end
      ↓
Testes
```

Nenhuma funcionalidade será considerada concluída apenas porque o back-end está funcionando.

Cada parte deve possuir:

* banco;
* back-end;
* front-end, quando aplicável;
* testes automatizados.

Essa é a regra de desenvolvimento vertical definida na arquitetura.

---

# 3. ARQUITETURA DO BACK-END

Manter:

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

A auditoria não deve ser implementada diretamente dentro dos controllers de forma duplicada.

Criar um mecanismo reutilizável de auditoria.

---

# 4. ARQUITETURA DO FRONT-END

Manter:

```text
Página
  ↓
Hook / Estado
  ↓
Serviço de API
  ↓
Backend REST
```

A tela de auditoria deverá consumir a API.

Não acessar banco diretamente.

---

# 5. ANÁLISE OBRIGATÓRIA ANTES DE CODIFICAR

Antes de modificar qualquer código:

1. analisar `plan.md`;
2. analisar `implementation_plan.md`;
3. analisar `.agents/skills/arquitetura/skill.md`;
4. analisar `.agents/skills/back-end/skill.md`;
5. analisar `.agents/skills/front-end/skill.md`;
6. analisar `.agents/rules/arquitetura.md`;
7. analisar `schema.prisma`;
8. analisar autenticação;
9. analisar usuários e permissões;
10. analisar produtos;
11. analisar fornecedores;
12. analisar clientes;
13. analisar compras;
14. analisar vendas;
15. analisar estoque;
16. analisar financeiro;
17. analisar relatórios;
18. analisar Dashboard;
19. analisar tratamento centralizado de erros;
20. analisar padrão de paginação;
21. analisar padrão de filtros;
22. analisar testes existentes.

**Não criar uma arquitetura paralela.**

Reutilizar os padrões estabelecidos nas Features 1–10.

---

# 6. BANCO DE DADOS — TABELA DE AUDITORIA

Criar a tabela:

```text
registros_auditoria
```

A estrutura definida no plano contém:

```text
id
usuario_id
acao
entidade
entidade_id
dados
criado_em
```

---

# 7. MODELO PRISMA

Criar o model Prisma correspondente:

```text
RegistroAuditoria
```

ou utilizar a convenção de nomenclatura já existente no projeto.

Campos conceituais:

```text
id
usuario_id
acao
entidade
entidade_id
dados
criado_em
```

Não alterar a nomenclatura definida pelo projeto sem necessidade.

---

# 8. CAMPO `usuario_id`

Registrar o usuário responsável pela operação.

O usuário deve ser obtido a partir da sessão/autenticação atual.

Não aceitar:

```text
usuario_id
```

enviado pelo front-end como fonte de verdade.

O back-end deve determinar o usuário autenticado.

---

# 9. CAMPO `acao`

Registrar uma ação identificável.

Exemplos definidos no plano:

```text
LOGIN
CRIAR_PRODUTO
ATUALIZAR_PRODUTO
CRIAR_COMPRA
CRIAR_VENDA
CRIAR_LANCAMENTO_FINANCEIRO
```

Utilizar ações consistentes com os módulos já implementados.

---

# 10. CAMPO `entidade`

Registrar a entidade afetada.

Exemplos:

```text
USUARIO
PRODUTO
FORNECEDOR
CLIENTE
COMPRA
VENDA
LANCAMENTO_FINANCEIRO
ESTOQUE
```

Utilizar somente entidades efetivamente existentes.

---

# 11. CAMPO `entidade_id`

Quando existir um registro específico associado à operação, armazenar seu identificador.

Exemplo:

```text
acao = CRIAR_PRODUTO
entidade = PRODUTO
entidade_id = 123
```

Para ações sem uma entidade específica, permitir `null` se isso estiver compatível com o schema.

---

# 12. CAMPO `dados`

O campo `dados` deverá armazenar informações relevantes da operação.

Pode utilizar JSON/JSON string conforme a tecnologia e padrão atual do projeto.

Exemplo conceitual:

```json
{
  "descricao": "Produto A",
  "quantidade_estoque": 10
}
```

Não armazenar informações desnecessárias.

---

# 13. DADOS PROIBIDOS NA AUDITORIA

Nunca registrar:

```text
senhas
hashes de senha
tokens
cookies
credenciais
segredos
dados sensíveis desnecessários
```

O plano determina explicitamente que a auditoria não deve armazenar senhas, tokens ou outros dados sensíveis.

---

# 14. SERVIÇO DE AUDITORIA

Criar um serviço centralizado.

Exemplo conceitual:

```text
registrarAuditoria()
```

Responsabilidade:

```text
receber ação
receber entidade
receber entidade_id
receber dados permitidos
identificar usuário autenticado
persistir registro
```

Não duplicar essa lógica em cada controller.

---

# 15. INTERCEPTOR / SERVIÇO

A Feature 11 determina:

> Interceptor/serviço de auditoria para ações sensíveis.

Implementar de acordo com o padrão mais adequado ao código existente.

Preferir uma solução simples e consistente.

Não introduzir framework adicional apenas para auditoria.

---

# 16. AÇÕES DE AUDITORIA

Auditar obrigatoriamente as operações críticas já definidas.

No mínimo:

```text
LOGIN
CRIAR_PRODUTO
ATUALIZAR_PRODUTO
CRIAR_COMPRA
CRIAR_VENDA
CRIAR_LANCAMENTO_FINANCEIRO
```

Também avaliar operações críticas já existentes nos módulos de:

```text
estoque
clientes
fornecedores
usuários
```

somente quando houver correspondência clara com o comportamento existente.

---

# 17. LOGIN

Registrar auditoria de login conforme definido no plano.

Exemplo:

```text
acao:
LOGIN

entidade:
USUARIO

entidade_id:
ID do usuário autenticado
```

Nunca registrar senha.

Em caso de login inválido, não registrar informações que revelem credenciais.

---

# 18. CRIAÇÃO DE PRODUTO

Ao criar produto:

```text
CRIAR_PRODUTO
```

registrar:

```text
usuario_id
entidade = PRODUTO
entidade_id
dados relevantes
criado_em
```

---

# 19. ALTERAÇÃO DE PRODUTO

Ao alterar produto:

```text
ATUALIZAR_PRODUTO
```

registrar a operação.

Não armazenar dados desnecessários.

---

# 20. COMPRA

Ao concluir uma compra:

```text
CRIAR_COMPRA
```

registrar a auditoria.

Importante:

A auditoria deve acontecer de forma consistente com a transação da compra.

A compra já possui comportamento transacional envolvendo:

```text
compra
estoque
movimentação de estoque
financeiro
```

Não quebrar essa atomicidade.

---

# 21. VENDA

Ao concluir uma venda:

```text
CRIAR_VENDA
```

registrar a auditoria.

A venda já possui transação envolvendo:

```text
venda
estoque
movimentação de estoque
financeiro
```

Não quebrar a atomicidade existente.

---

# 22. FINANCEIRO

Para criação de lançamento manual:

```text
CRIAR_LANCAMENTO_FINANCEIRO
```

registrar auditoria.

Não registrar:

```text
tokens
senhas
credenciais
```

---

# 23. AUDITORIA E TRANSAÇÕES

Analisar cuidadosamente o comportamento transacional.

Regra desejada:

```text
Operação crítica concluída
        ↓
Auditoria correspondente
```

Evitar situações onde:

```text
Operação falhou
        ↓
Auditoria informa sucesso
```

ou:

```text
Operação concluída
        ↓
auditoria falhou silenciosamente
```

Definir o comportamento de acordo com a criticidade e arquitetura existente.

Documentar a decisão.

---

# 24. REPOSITORY DE AUDITORIA

Criar:

```text
auditoria.repository.ts
```

ou seguir a convenção existente.

Implementar operações necessárias para:

```text
registrar
listar
buscar
```

Não criar funcionalidades de edição ou exclusão de auditoria.

---

# 25. REGISTROS DE AUDITORIA NÃO DEVEM SER EDITÁVEIS

A auditoria deve preservar o histórico.

Não criar:

```text
PUT /api/auditoria/:id
DELETE /api/auditoria/:id
```

sem uma necessidade explicitamente definida pela arquitetura.

---

# 26. ENDPOINT DE CONSULTA

Criar endpoint para administradores.

Sugestão:

```http
GET /api/auditoria
```

Utilizar o padrão REST já existente.

---

# 27. PAGINAÇÃO

A consulta de auditoria deve ser paginada.

O plano determina que listagens utilizem paginação.

Utilizar o padrão:

```text
GET /api/auditoria?pagina=1&limite=20
```

Resposta conceitual:

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

Adaptar ao padrão real do projeto.

---

# 28. FILTROS DA AUDITORIA

Implementar filtros úteis.

Priorizar:

```text
data inicial
data final
usuário
ação
entidade
```

Não criar filtros excessivos.

---

# 29. ORDENAÇÃO

Os registros mais recentes devem aparecer primeiro.

Conceitualmente:

```text
criado_em DESC
```

---

# 30. AUTORIZAÇÃO

A tela e API de auditoria devem ser restritas a:

```text
ADMINISTRADOR
```

O plano define explicitamente:

> Tela de consulta de Auditoria (para administradores).

Não confiar somente no front-end para esconder a funcionalidade.

A API também deve verificar a permissão.

---

# 31. USUÁRIO NÃO ADMINISTRADOR

Se um usuário sem permissão tentar acessar:

```http
GET /api/auditoria
```

retornar o erro de autorização definido pelo padrão atual do sistema.

Não revelar registros de auditoria.

---

# 32. SEGURANÇA

Manter todas as regras de segurança existentes.

A arquitetura determina:

```text
Argon2id
sessão/cookies seguros ou tokens com renovação
Zod
rate limiting
Prisma
Helmet
tratamento centralizado de erros
```

Nesta feature, especialmente:

```text
✓ não registrar tokens
✓ não registrar senhas
✓ não expor dados sensíveis
✓ validar parâmetros
✓ verificar autorização no back-end
```

---

# 33. FRONT-END — TELA DE AUDITORIA

Criar:

```text
Auditoria
```

A tela deve ser acessível apenas por administradores.

---

# 34. SERVIÇO FRONT-END

Criar:

```text
servicos/auditoria.ts
```

Método conceitual:

```text
listarAuditoria()
```

---

# 35. TIPOS TYPESCRIPT

Criar:

```text
RegistroAuditoria
AuditoriaFiltro
```

e tipos de paginação conforme padrão existente.

---

# 36. TABELA DE AUDITORIA

Apresentar:

```text
Data
Usuário
Ação
Entidade
ID da entidade
```

Exemplo:

```text
29/08/2026 14:30
Mauricio
CRIAR_VENDA
VENDA
1024
```

Não exibir automaticamente todo o conteúdo de `dados`.

---

# 37. DETALHAMENTO DA AUDITORIA

Permitir visualizar os dados do registro quando necessário.

Pode utilizar:

```text
modal
drawer
expansão da linha
```

Apresentar apenas informações permitidas.

Nunca mostrar:

```text
senha
token
hash
credenciais
```

---

# 38. FILTROS DA TELA

Implementar:

```text
Período
Usuário
Ação
Entidade
```

Com botão:

```text
[Filtrar]
```

e opção:

```text
[Limpar filtros]
```

---

# 39. ESTADO VAZIO

Quando não houver registros:

```text
Nenhum registro de auditoria encontrado.
```

---

# 40. LOADING

Durante carregamento:

```text
Carregando registros de auditoria...
```

Preferencialmente utilizar skeleton ou loading do Design System existente.

---

# 41. ERROS

Em caso de falha:

```text
Não foi possível carregar os registros de auditoria.
```

Nunca mostrar:

```text
SQL
stack trace
estrutura interna
```

---

# 42. RESPONSIVIDADE

A tela deverá funcionar em:

```text
Desktop
Tablet
Mobile
```

Em mobile, evitar tabela impossível de utilizar.

Utilizar:

```text
scroll horizontal
cards
layout adaptativo
```

conforme o Design System existente.

---

# 43. ACESSIBILIDADE

Garantir:

```text
labels
foco de teclado
botões acessíveis
contraste
hierarquia visual
mensagens claras
```

---

# 44. TESTE UNITÁRIO — AUDITORIA

Testar o serviço:

```text
✓ registra auditoria
✓ associa usuário
✓ registra ação
✓ registra entidade
✓ registra entidade_id
✓ registra dados permitidos
✓ não armazena informações proibidas
```

---

# 45. TESTE DE AUTORIZAÇÃO

Testar:

```text
ADMINISTRADOR
```

deve conseguir:

```text
GET /api/auditoria
```

Usuário comum deve receber:

```text
403
```

ou o comportamento equivalente definido pela aplicação.

---

# 46. TESTE DE PAGINAÇÃO

Criar vários registros e validar:

```text
pagina
limite
total
total_paginas
```

---

# 47. TESTE DE FILTROS

Validar:

```text
filtro por usuário
filtro por ação
filtro por entidade
filtro por período
```

---

# 48. TESTE DE ORDENAÇÃO

Criar registros com datas diferentes.

Garantir:

```text
mais recente
      ↓
mais antigo
```

---

# 49. TESTE DE AUDITORIA DE PRODUTO

Executar:

```text
CRIAR PRODUTO
```

e validar a existência de:

```text
CRIAR_PRODUTO
```

em `registros_auditoria`.

---

# 50. TESTE DE AUDITORIA DE COMPRA

Executar:

```text
CRIAR COMPRA
```

e validar:

```text
CRIAR_COMPRA
```

Além disso, verificar que a compra continua atualizando corretamente:

```text
estoque
movimentação de estoque
financeiro
```

---

# 51. TESTE DE AUDITORIA DE VENDA

Executar:

```text
CRIAR VENDA
```

e validar:

```text
CRIAR_VENDA
```

Verificar simultaneamente:

```text
estoque
movimentação
financeiro
```

---

# 52. TESTE DE AUDITORIA FINANCEIRA

Criar lançamento financeiro manual.

Validar:

```text
CRIAR_LANCAMENTO_FINANCEIRO
```

---

# 53. TESTE DE LOGIN

Executar login válido.

Validar:

```text
LOGIN
```

na auditoria.

Garantir que não exista senha ou token no registro.

---

# 54. TESTE DE INTEGRIDADE

Criar uma operação de compra.

Validar:

```text
Compra criada
        ↓
Estoque incrementado
        ↓
Movimentação ENTRADA
        ↓
Financeiro SAIDA
        ↓
Auditoria CRIAR_COMPRA
```

---

# 55. TESTE DE INTEGRIDADE — VENDA

Executar:

```text
Venda
```

Validar:

```text
Venda criada
        ↓
Estoque decrementado
        ↓
Movimentação SAIDA
        ↓
Financeiro ENTRADA
        ↓
Auditoria CRIAR_VENDA
```

---

# 56. TESTE E2E COMPLETO

Criar um teste automatizado que execute o fluxo completo.

Fluxo obrigatório:

```text
1. Autenticar usuário
       ↓
2. Criar produto
       ↓
3. Criar fornecedor
       ↓
4. Registrar compra
       ↓
5. Verificar estoque
       ↓
6. Verificar movimentação de estoque
       ↓
7. Verificar financeiro
       ↓
8. Criar cliente
       ↓
9. Registrar venda
       ↓
10. Verificar estoque
       ↓
11. Verificar movimentação
       ↓
12. Verificar financeiro
       ↓
13. Consultar relatório
       ↓
14. Consultar Dashboard
       ↓
15. Consultar auditoria
```

A arquitetura determina um teste automatizado de integração cobrindo o fluxo completo Produto → Fornecedor → Compra → Estoque → Cliente → Venda → Estoque → Financeiro → Relatórios.

---

# 57. VALIDAÇÃO DO ESTOQUE NO E2E

Após a compra:

```text
estoque inicial
+
quantidade comprada
=
estoque esperado
```

Após a venda:

```text
estoque após compra
-
quantidade vendida
=
estoque final
```

Garantir que nunca exista estoque negativo.

---

# 58. VALIDAÇÃO FINANCEIRA NO E2E

Após a compra:

```text
SAIDA financeira
```

Após a venda:

```text
ENTRADA financeira
```

Validar os lançamentos.

---

# 59. VALIDAÇÃO DOS RELATÓRIOS NO E2E

Após compra e venda:

```text
Relatório de Compras
```

deve refletir a compra realizada.

```text
Relatório de Vendas
```

deve refletir a venda realizada.

```text
Relatório Financeiro
```

deve refletir os lançamentos correspondentes.

---

# 60. VALIDAÇÃO DO DASHBOARD NO E2E

Consultar:

```text
GET /api/dashboard/resumo
```

Validar que os indicadores reflitam as operações realizadas.

---

# 61. VALIDAÇÃO DA AUDITORIA NO E2E

Após concluir o fluxo, consultar:

```text
GET /api/auditoria
```

e verificar os registros esperados.

Exemplo:

```text
LOGIN
CRIAR_PRODUTO
CRIAR_COMPRA
CRIAR_VENDA
```

e outras ações efetivamente auditadas.

---

# 62. TESTE DE FALHA

Validar cenários em que uma operação não pode ser concluída.

Exemplo:

```text
Venda com estoque insuficiente
```

Garantir:

```text
Venda não criada
Estoque não alterado indevidamente
Financeiro não alterado indevidamente
```

e analisar o comportamento esperado da auditoria.

Não registrar uma operação como concluída quando ela falhou.

---

# 63. TESTE DE CONCORRÊNCIA

Como a venda já possui proteção contra concorrência, executar o teste existente e garantir que a implementação da auditoria não quebre essa proteção.

Validar:

```text
duas vendas concorrentes
        ↓
estoque consistente
        ↓
sem estoque negativo
```

---

# 64. REGRESSÃO

Executar toda a suíte de testes existente.

O objetivo é garantir que a introdução da auditoria não altere o comportamento das Features 1–10.

Testar especialmente:

```text
Autenticação
Produtos
Fornecedores
Clientes
Compras
Vendas
Estoque
Financeiro
Relatórios
Dashboard
```

---

# 65. FRONT-END — TESTES

Criar testes para:

```text
✓ tela de auditoria
✓ renderização da tabela
✓ paginação
✓ filtros
✓ loading
✓ estado vazio
✓ tratamento de erro
✓ acesso administrativo
✓ visualização de detalhes
```

---

# 66. TESTE DE PERMISSÃO NO FRONT-END

Usuário administrador:

```text
deve visualizar Auditoria
```

Usuário comum:

```text
não deve visualizar a opção
```

Importante:

Isso é apenas UX.

A autorização real deve continuar no back-end.

---

# 67. PERFORMANCE

A consulta de auditoria deverá utilizar:

```text
paginação
filtros no banco
ordenação no banco
```

Não carregar todo o histórico para o navegador.

---

# 68. ÍNDICES

Analisar a necessidade de índices para:

```text
usuario_id
acao
entidade
criado_em
```

Especialmente porque esses campos poderão ser usados nos filtros.

Criar somente índices justificados pelas consultas reais.

---

# 69. TRATAMENTO DE ERROS

Utilizar o tratamento centralizado.

Nunca retornar:

```text
stack trace
SQL
credenciais
detalhes internos
```

O plano determina que informações internas da aplicação não sejam expostas.

---

# 70. NÃO CRIAR FUNCIONALIDADES FORA DO ESCOPO

Não implementar nesta feature:

```text
❌ importação XML
❌ aplicativo Android
❌ notificações externas
❌ BI avançado
❌ gráficos de auditoria
❌ exclusão de registros de auditoria
❌ edição de registros de auditoria
❌ exportação avançada de auditoria
```

A arquitetura determina que esta etapa seja focada em auditoria e validação ponta a ponta.

---

# 71. REVISÃO FINAL DE RESPONSIVIDADE

A Feature 11 exige uma revisão final de:

```text
responsividade mobile
acessibilidade
mensagens de segurança
```

Revisar todas as telas principais:

```text
Login
Produtos
Fornecedores
Clientes
Compras
Vendas
Estoque
Financeiro
Relatórios
Dashboard
Auditoria
```

---

# 72. REVISÃO DE ACESSIBILIDADE

Verificar:

```text
✓ navegação por teclado
✓ foco
✓ labels
✓ botões
✓ modais
✓ mensagens
✓ tabelas
✓ formulários
✓ contraste
```

---

# 73. REVISÃO DE MENSAGENS DE SEGURANÇA

Garantir que mensagens de erro não revelem informações internas.

Exemplo adequado:

```text
Não foi possível concluir a operação.
```

Evitar:

```text
PrismaClientKnownRequestError...
```

---

# 74. TESTES AUTOMATIZADOS OBRIGATÓRIOS

Executar:

```text
npm run test
```

ou o comando equivalente definido pelo projeto.

A arquitetura especifica Vitest para testes unitários e integração.

---

# 75. TESTE DE FLUXO INTEGRADO

Além dos testes unitários, executar o fluxo:

```text
Compra
 ↓
Estoque
 ↓
Venda
 ↓
Estoque
 ↓
Financeiro
 ↓
Relatórios
```

Esse fluxo é explicitamente previsto no plano de verificação.

---

# 76. VERIFICAÇÃO MANUAL

Iniciar:

```text
npm run dev
```

ou os comandos equivalentes do projeto.

Validar no navegador:

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
Relatórios
Auditoria
```

---

# 77. CASOS DE BORDA

Executar os casos previstos pelo plano:

```text
Venda sem estoque
Login inválido
Valores monetários decimais
Inativações lógicas
```

Além disso:

```text
filtros vazios
período inválido
usuário sem permissão
auditoria sem registros
```

---

# 78. ORDEM DE IMPLEMENTAÇÃO

Executar nesta ordem.

## ETAPA 1 — ANÁLISE

Mapear todas as operações críticas existentes.

---

## ETAPA 2 — BANCO

Criar:

```text
registros_auditoria
```

e migration Prisma.

---

## ETAPA 3 — PRISMA

Atualizar:

```text
schema.prisma
```

e gerar o client conforme padrão existente.

---

## ETAPA 4 — REPOSITORY

Criar repository de auditoria.

---

## ETAPA 5 — SERVIÇO

Criar serviço centralizado:

```text
registrarAuditoria()
```

---

## ETAPA 6 — INTEGRAÇÃO

Integrar auditoria às operações críticas.

Priorizar:

```text
LOGIN
CRIAR_PRODUTO
ATUALIZAR_PRODUTO
CRIAR_COMPRA
CRIAR_VENDA
CRIAR_LANCAMENTO_FINANCEIRO
```

---

## ETAPA 7 — API

Criar:

```http
GET /api/auditoria
```

com paginação e filtros.

---

## ETAPA 8 — AUTORIZAÇÃO

Restringir a consulta a:

```text
ADMINISTRADOR
```

---

## ETAPA 9 — FRONT-END

Criar:

```text
servicos/auditoria.ts
```

e tipos.

---

## ETAPA 10 — TELA

Criar:

```text
Auditoria
```

com:

```text
tabela
filtros
paginação
detalhamento
loading
erro
estado vazio
```

---

## ETAPA 11 — TESTES UNITÁRIOS

Testar serviço e repository.

---

## ETAPA 12 — TESTES DE INTEGRAÇÃO

Testar API e permissões.

---

## ETAPA 13 — TESTE E2E

Executar fluxo completo:

```text
Produto
 ↓
Fornecedor
 ↓
Compra
 ↓
Estoque
 ↓
Cliente
 ↓
Venda
 ↓
Estoque
 ↓
Financeiro
 ↓
Relatórios
 ↓
Dashboard
 ↓
Auditoria
```

---

## ETAPA 14 — REGRESSÃO

Executar toda a suíte existente.

---

## ETAPA 15 — REVISÃO VISUAL

Revisar:

```text
mobile
tablet
desktop
acessibilidade
mensagens
segurança
```

---

## ETAPA 16 — BUILD

Executar:

```text
lint
test
build
```

utilizando os comandos reais definidos no projeto.

---

# 79. TESTE MANUAL COMPLETO

Executar exatamente:

```text
1. Login
2. Confirmar Dashboard
3. Criar produto
4. Verificar auditoria
5. Criar fornecedor
6. Registrar compra
7. Verificar estoque
8. Verificar movimentação
9. Verificar financeiro
10. Verificar auditoria da compra
11. Criar cliente
12. Registrar venda
13. Verificar estoque
14. Verificar movimentação
15. Verificar financeiro
16. Verificar auditoria da venda
17. Abrir Relatórios
18. Conferir compra
19. Conferir venda
20. Conferir financeiro
21. Abrir Dashboard
22. Conferir indicadores
23. Abrir Auditoria
24. Filtrar por usuário
25. Filtrar por ação
26. Filtrar por entidade
27. Filtrar por período
28. Abrir detalhe de auditoria
29. Testar paginação
30. Testar usuário sem permissão
31. Testar mobile
32. Testar tablet
33. Testar desktop
```

---

# 80. CRITÉRIOS DE ACEITE — BANCO

```text
[✓] tabela registros_auditoria
[✓] migration
[✓] model Prisma
[✓] relacionamento com usuário quando aplicável
[✓] índices necessários
```

---

# 81. CRITÉRIOS DE ACEITE — BACK-END

```text
[✓] serviço centralizado de auditoria
[✓] auditoria de LOGIN
[✓] auditoria de criação de produto
[✓] auditoria de atualização de produto
[✓] auditoria de compra
[✓] auditoria de venda
[✓] auditoria financeira
[✓] GET /api/auditoria
[✓] paginação
[✓] filtros
[✓] ordenação
[✓] autorização ADMINISTRADOR
[✓] validação Zod
[✓] tratamento de erros
```

---

# 82. CRITÉRIOS DE ACEITE — FRONT-END

```text
[✓] servicos/auditoria.ts
[✓] tipos TypeScript
[✓] tela Auditoria
[✓] tabela
[✓] filtros
[✓] paginação
[✓] detalhamento
[✓] loading
[✓] estado vazio
[✓] tratamento de erro
[✓] controle visual de permissão
[✓] responsividade
[✓] acessibilidade
```

---

# 83. CRITÉRIOS DE ACEITE — TESTES

```text
[✓] testes unitários
[✓] testes de repository
[✓] testes de API
[✓] testes de autorização
[✓] testes de auditoria
[✓] testes de filtros
[✓] testes de paginação
[✓] testes front-end
[✓] teste E2E completo
[✓] testes de regressão
[✓] 100% da suíte com sucesso
```

A Feature 11 determina a execução de toda a suíte back-end e front-end com 100% de sucesso.

---

# 84. CRITÉRIO PRINCIPAL DE SUCESSO

O sistema deverá conseguir executar:

```text
                 PRODUTO
                    ↓
               FORNECEDOR
                    ↓
                  COMPRA
                    ↓
                 ESTOQUE
                    ↓
                 CLIENTE
                    ↓
                  VENDA
                    ↓
                 ESTOQUE
                    ↓
                FINANCEIRO
                    ↓
                RELATÓRIOS
                    ↓
                DASHBOARD
                    ↓
                 AUDITORIA
```

sem inconsistências.

---

# 85. VALIDAÇÃO FINAL DO ESTOQUE

Ao final do E2E:

```text
Estoque inicial
+ compras
- vendas
± ajustes
=
Estoque atual
```

Garantir consistência com:

```text
produtos.quantidade_estoque
movimentacoes_estoque
```

---

# 86. VALIDAÇÃO FINAL FINANCEIRA

Ao final:

```text
Entradas
-
Saídas
=
Saldo
```

Validar contra os dados do módulo financeiro e dos relatórios.

---

# 87. VALIDAÇÃO FINAL DOS RELATÓRIOS

Garantir:

```text
Compras realizadas
        ↓
Relatório de Compras

Vendas realizadas
        ↓
Relatório de Vendas

Lançamentos financeiros
        ↓
Relatório Financeiro
```

Os relatórios devem refletir as operações reais.

---

# 88. VALIDAÇÃO FINAL DO DASHBOARD

Garantir que o Dashboard reflita:

```text
vendas
compras
entradas
saídas
saldo
produtos
estoque crítico
últimas operações
```

sem divergências dos módulos de origem.

---

# 89. VALIDAÇÃO FINAL DA AUDITORIA

Garantir que as operações críticas realizadas no E2E tenham seus respectivos registros.

Exemplo:

```text
LOGIN
CRIAR_PRODUTO
CRIAR_COMPRA
CRIAR_VENDA
```

e demais ações que estejam efetivamente integradas ao mecanismo de auditoria.

---

# 90. REGRA DE NÃO REGRESSÃO

A implementação da Feature 11 não pode quebrar nenhuma funcionalidade anterior.

Executar testes completos das Features 1–10.

Se algum teste existente falhar:

1. identificar a causa;
2. corrigir;
3. executar novamente;
4. registrar o resultado.

Não simplesmente desabilitar ou remover testes.

---

# 91. RELATÓRIO FINAL DA IMPLEMENTAÇÃO

Ao terminar, apresentar obrigatoriamente:

```text
1. Resumo da implementação
2. Arquivos criados
3. Arquivos alterados
4. Migration criada
5. Model Prisma
6. Estrutura de registros_auditoria
7. Ações auditadas
8. Serviço de auditoria
9. Estratégia transacional
10. Endpoint GET /api/auditoria
11. Regras de autorização
12. Filtros
13. Paginação
14. Ordenação
15. Tela de Auditoria
16. Componentes criados
17. Testes unitários
18. Testes de integração
19. Teste E2E
20. Resultado dos testes
21. Resultado do lint
22. Resultado do build
23. Teste manual
24. Teste responsivo
25. Teste de acessibilidade
26. Problemas encontrados
27. Decisões arquiteturais
28. Pendências
```

---

# 92. REGRA FINAL

Esta feature deve **fechar o ciclo do MVP**.

Não adicionar funcionalidades novas apenas por conveniência.

O resultado final esperado é:

```text
Sistema Uniqprint
       │
       ├── Autenticação
       ├── Produtos
       ├── Fornecedores
       ├── Clientes
       ├── Compras
       ├── Vendas
       ├── Estoque
       ├── Financeiro
       ├── Relatórios
       ├── Dashboard
       └── Auditoria
                │
                ↓
        FLUXO E2E VALIDADO
```

O sistema deve demonstrar que o fluxo comercial completo funciona de forma integrada, transacional, segura e auditável.

A implementação deve permanecer fiel à arquitetura existente, na qual a **Feature 11 é a etapa de Auditoria e Teste de Fluxo Completo Ponta a Ponta**, encerrando o conjunto de features verticais definido no plano.
