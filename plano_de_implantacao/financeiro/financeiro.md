# PROMPT — IMPLEMENTAÇÃO DA FEATURE 8: CONTROLE FINANCEIRO COMPLETO

Você é responsável pela implementação da próxima feature do sistema **Uniqprint — Controle de Compras e Vendas**.

## CONTEXTO

As seguintes features já foram implementadas:

* Feature 0 — Fundação e Infraestrutura
* Feature 1 — Autenticação e Gestão de Usuários
* Feature 2 — Cadastro e Gestão de Produtos
* Feature 3 — Cadastro e Gestão de Fornecedores
* Feature 4 — Cadastro e Gestão de Clientes
* Feature 5 — Registro de Compras e Entrada de Estoque
* Feature 6 — Registro de Vendas e Baixa Atômica de Estoque
* Feature 7 — Gestão e Ajustes Manuais de Estoque

A próxima implementação obrigatória é:

> **Feature 8 — Controle Financeiro Completo**

De acordo com o plano de implementação, esta feature deverá contemplar:

* tabela `lancamentos_financeiros`;
* módulo `financeiro` no back-end;
* CRUD manual de entradas e saídas;
* extrato financeiro;
* filtros por período e categoria;
* cálculo do saldo consolidado;
* página de Financeiro;
* cards de Total de Entradas, Total de Saídas e Saldo Atual;
* formulário para lançamentos manuais;
* integração com os lançamentos financeiros já originados por compras e vendas;
* testes de saldo, CRUD e integração.

---

# 1. OBJETIVO

Implementar o módulo completo de **Controle Financeiro**, permitindo que o sistema:

1. registre entradas financeiras;
2. registre saídas financeiras;
3. registre lançamentos manuais;
4. mantenha os lançamentos automáticos originados por compras e vendas;
5. consulte o extrato financeiro;
6. filtre lançamentos por período;
7. filtre lançamentos por categoria;
8. calcule o total de entradas;
9. calcule o total de saídas;
10. calcule o saldo consolidado;
11. identifique a origem dos lançamentos automáticos;
12. permita o gerenciamento dos lançamentos manuais;
13. mantenha consistência financeira;
14. disponibilize API REST;
15. disponibilize interface web;
16. possua testes automatizados.

A implementação deverá seguir obrigatoriamente o modelo de **Desenvolvimento Vertical por Feature**:

```text
Banco/Prisma
     ↓
Back-end
     ↓
Front-end
     ↓
Testes
```

A arquitetura define que uma feature somente é considerada concluída quando Banco, Back-end, Front-end e Testes estiverem implementados.

---

# 2. ARQUITETURA OBRIGATÓRIA

Respeitar as camadas existentes:

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

No front-end:

```text
Página / Componente
      ↓
Hook / Estado
      ↓
Serviço de API
      ↓
Backend REST
```

O back-end continua sendo a única autoridade sobre as regras de negócio financeiras.

---

# 3. ANÁLISE OBRIGATÓRIA ANTES DE CODIFICAR

Antes de criar ou modificar arquivos:

1. analisar `schema.prisma`;
2. analisar a tabela atual `lancamentos_financeiros`;
3. analisar a Feature 5 — Compras;
4. analisar a Feature 6 — Vendas;
5. analisar como compras criam lançamentos financeiros;
6. analisar como vendas criam lançamentos financeiros;
7. analisar o módulo de Estoque;
8. analisar autenticação;
9. analisar autorização;
10. analisar repositories existentes;
11. analisar services existentes;
12. analisar controllers;
13. analisar rotas;
14. analisar schemas Zod;
15. analisar tratamento centralizado de erros;
16. analisar paginação;
17. analisar componentes do Design System;
18. analisar formulários existentes;
19. analisar tabelas existentes;
20. analisar testes existentes.

**Não criar uma arquitetura paralela.**

Reutilizar os padrões já existentes no projeto.

---

# 4. NOMENCLATURA

Todos os conceitos do domínio devem utilizar PT-BR, conforme a convenção arquitetural do projeto.

Exemplos:

```text
lancamentos_financeiros
data_lancamento
categoria
tipo
descricao
valor
observacao
tipo_referencia
referencia_id
```

Métodos conceitualmente esperados:

```text
listarLancamentos()
buscarLancamentoPorId()
criarLancamento()
atualizarLancamento()
excluirLancamento()
calcularSaldo()
```

Adaptar os nomes à estrutura real já existente.

---

# 5. MODELO FINANCEIRO

Utilizar como base a tabela:

```text
lancamentos_financeiros
```

O plano define os seguintes campos:

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
```

Antes de alterar o schema:

> verificar o modelo atualmente implementado.

Não recriar uma tabela caso ela já exista.

Não duplicar estruturas.

---

# 6. TIPOS DE LANÇAMENTO

O sistema deverá trabalhar com:

```text
ENTRADA
SAIDA
```

Esses tipos já fazem parte do escopo financeiro do sistema.

Exemplos:

```text
Venda
→ ENTRADA

Compra
→ SAIDA

Recebimento manual
→ ENTRADA

Aluguel
→ SAIDA

Conta
→ SAIDA
```

---

# 7. LANÇAMENTOS AUTOMÁTICOS

As Features anteriores já possuem integração financeira.

Compra:

```text
Compra
   ↓
SAIDA financeira
```

Venda:

```text
Venda
   ↓
ENTRADA financeira
```

Isso está definido explicitamente no plano das Features 5 e 6.
A Feature 8 deve **consumir e apresentar esses lançamentos**.

Não duplicar lançamentos originados de compras e vendas.

---

# 8. ORIGEM DO LANÇAMENTO

Utilizar:

```text
tipo_referencia
referencia_id
```

quando disponível.

Exemplos:

```text
tipo_referencia = COMPRA
referencia_id = 123
```

ou:

```text
tipo_referencia = VENDA
referencia_id = 456
```

Para lançamentos manuais:

```text
tipo_referencia = MANUAL
```

ou a convenção equivalente já utilizada no projeto.

**Não inventar um padrão incompatível com o schema atual.**

---

# 9. LANÇAMENTO MANUAL

A Feature 8 deverá permitir criar lançamentos financeiros manualmente.

Exemplos previstos no plano:

```text
Aluguel
Contas
Recebimentos
```

Exemplos adicionais somente se compatíveis com o modelo:

```text
Energia
Internet
Manutenção
Outras despesas
Outras receitas
```

---

# 10. CRUD FINANCEIRO

Implementar no módulo `financeiro`:

```text
Criar lançamento
Consultar lançamento
Listar lançamentos
Atualizar lançamento
Excluir lançamento
```

A Feature 8 define explicitamente **CRUD manual de entradas/saídas**.

---

# 11. REGRA IMPORTANTE — AUTOMÁTICOS X MANUAIS

Distinguir:

```text
LANÇAMENTO AUTOMÁTICO
        ↓
gerado por Compra/Venda

LANÇAMENTO MANUAL
        ↓
criado pelo usuário
```

O usuário não deve conseguir alterar ou excluir um lançamento automático se isso quebrar a integridade da operação de origem.

Antes de implementar essa proteção:

> verificar como o modelo atual identifica a origem do lançamento.

Se houver `tipo_referencia` e `referencia_id`, utilizar essa informação.

---

# 12. ENDPOINT — LISTAGEM

Implementar:

```http
GET /api/lancamentos-financeiros
```

A rota deverá permitir consultar o extrato financeiro.

---

# 13. PAGINAÇÃO

Utilizar o mesmo padrão de paginação já adotado pelos demais módulos.

Exemplo conceitual:

```http
GET /api/lancamentos-financeiros?page=1&limite=20
```

Não criar um padrão de paginação diferente.

---

# 14. FILTRO POR PERÍODO

A API deverá permitir filtrar:

```text
data inicial
data final
```

Exemplo conceitual:

```http
GET /api/lancamentos-financeiros?dataInicial=2026-01-01&dataFinal=2026-01-31
```

Adaptar os parâmetros ao padrão já existente no projeto.

O filtro deverá ser executado no banco.

Não carregar todo o histórico para filtrar no front-end.

---

# 15. FILTRO POR CATEGORIA

Implementar filtro:

```text
categoria
```

Exemplo:

```text
Todas
Aluguel
Contas
Recebimentos
...
```

As categorias deverão respeitar os valores/modelo já definidos no sistema.

Se não existir enum ou catálogo formal de categorias:

> não inventar uma estrutura complexa sem necessidade.

Implementar a solução compatível com o modelo atual.

---

# 16. FILTRO POR TIPO

Além dos filtros explicitamente definidos, permitir:

```text
Todos
ENTRADA
SAIDA
```

Isso facilita a consulta do extrato.

---

# 17. ORDENAÇÃO DO EXTRATO

O extrato deverá apresentar os lançamentos de forma cronológica.

Preferencialmente:

```text
mais recentes primeiro
```

a menos que o padrão existente determine o contrário.

A ordenação deverá ocorrer no banco.

---

# 18. ENDPOINT — BUSCA POR ID

Implementar, se compatível com o padrão dos demais módulos:

```http
GET /api/lancamentos-financeiros/:id
```

Retornar os dados completos do lançamento.

---

# 19. ENDPOINT — CRIAÇÃO

Implementar:

```http
POST /api/lancamentos-financeiros
```

Payload conceitual:

```json
{
  "tipo": "SAIDA",
  "descricao": "Pagamento de aluguel",
  "valor": 2500.00,
  "data_lancamento": "2026-08-29",
  "categoria": "ALUGUEL",
  "observacao": "Aluguel da loja"
}
```

Adaptar exatamente ao schema existente.

---

# 20. ENDPOINT — ALTERAÇÃO

Implementar:

```http
PUT /api/lancamentos-financeiros/:id
```

ou seguir o padrão REST já utilizado.

A alteração deverá ser permitida para lançamentos manuais.

Não permitir alterações que corrompam lançamentos automáticos vinculados a compras ou vendas.

---

# 21. ENDPOINT — EXCLUSÃO

Implementar:

```http
DELETE /api/lancamentos-financeiros/:id
```

quando compatível com as regras existentes.

Antes de excluir:

```text
verificar origem
```

Se o lançamento tiver origem em:

```text
COMPRA
VENDA
```

não permitir exclusão direta que deixe a operação financeira inconsistente.

Retornar erro de negócio apropriado.

---

# 22. VALIDAÇÃO ZOD

Criar schemas Zod para:

```text
criação
alteração
filtros
paginação
parâmetros
```

Validar:

```text
tipo
descricao
valor
data_lancamento
categoria
observacao
```

A validação deverá existir no back-end.

A validação no front-end é complementar e nunca substitui a validação do back-end.

---

# 23. VALOR MONETÁRIO

Valores financeiros deverão ser tratados como valores monetários precisos.

O plano determina que valores monetários sejam armazenados utilizando tipo decimal.

Não utilizar `float` como fonte de verdade financeira.

Evitar erros de precisão.

---

# 24. VALOR POSITIVO

O campo:

```text
valor
```

deverá representar o valor absoluto do lançamento.

O tipo determina o efeito:

```text
ENTRADA
SAIDA
```

Preferir:

```text
ENTRADA + 100
SAIDA + 100
```

em vez de:

```text
ENTRADA +100
SAIDA -100
```

**Porém**, antes de alterar qualquer comportamento existente, verificar o modelo já implementado pelas Features 5 e 6 e preservar compatibilidade.

---

# 25. CÁLCULO DO SALDO

Implementar endpoint específico para o saldo consolidado.

Conceitualmente:

```http
GET /api/lancamentos-financeiros/saldo
```

O resultado deverá fornecer:

```text
total_entradas
total_saidas
saldo
```

Regra:

```text
saldo = total_entradas - total_saidas
```

---

# 26. SALDO NÃO DEVE SER ARMAZENADO

Não criar um campo:

```text
saldo_atual
```

como fonte de verdade.

O saldo deve ser calculado a partir dos lançamentos financeiros.

Isso evita inconsistência entre:

```text
lançamentos
```

e:

```text
saldo armazenado
```

---

# 27. CÁLCULO COM FILTROS

Se o endpoint de saldo receber filtros de período/categoria/tipo, o cálculo deverá respeitar os mesmos filtros.

Exemplo:

```text
01/08/2026 → 31/08/2026
```

deverá calcular somente os lançamentos desse período.

Se o plano não exigir saldo filtrado, implementar primeiro o saldo consolidado global e não antecipar funcionalidades adicionais sem necessidade.

---

# 28. CARDS FINANCEIROS

A página de Financeiro deverá apresentar:

```text
┌────────────────────┐
│ Total de Entradas  │
│ R$ 00.000,00       │
└────────────────────┘

┌────────────────────┐
│ Total de Saídas    │
│ R$ 00.000,00       │
└────────────────────┘

┌────────────────────┐
│ Saldo Atual        │
│ R$ 00.000,00       │
└────────────────────┘
```

Esses três cards são explicitamente previstos na Feature 8.

---

# 29. PÁGINA DE FINANCEIRO

Criar página:

```text
Financeiro
```

Estrutura conceitual:

```text
Financeiro

[Total de Entradas]
[Total de Saídas]
[Saldo Atual]

Filtros
--------------------------------
Período
Categoria
Tipo

[Filtrar]

Extrato
--------------------------------
Data | Descrição | Categoria | Tipo | Valor | Origem
```

---

# 30. SERVIÇO FRONT-END

Criar:

```text
frontend/src/servicos/financeiro.ts
```

Seguir o padrão existente de serviços.

Responsabilidades:

```text
listarLancamentos()
buscarLancamento()
criarLancamento()
atualizarLancamento()
excluirLancamento()
buscarSaldo()
```

Adaptar à organização real do projeto.

---

# 31. TIPOS TYPESCRIPT

Criar tipos:

```text
LancamentoFinanceiro
```

e os tipos auxiliares necessários.

Exemplo conceitual:

```text
tipo
descricao
valor
data_lancamento
categoria
tipo_referencia
referencia_id
observacao
```

Os tipos devem refletir a API real.

Não duplicar interfaces incompatíveis.

---

# 32. FORMULÁRIO DE LANÇAMENTO MANUAL

Criar formulário com:

```text
Tipo
Descrição
Valor
Data
Categoria
Observação
```

Exemplo:

```text
Novo lançamento

Tipo
( ) Entrada
( ) Saída

Descrição
[________________]

Valor
[R$ _____________]

Data
[__/__/____]

Categoria
[______________]

Observação
[____________________________]

[Cancelar] [Salvar]
```

---

# 33. CATEGORIA

O formulário deverá permitir selecionar/informar a categoria conforme a implementação existente.

Exemplos previstos:

```text
Aluguel
Contas
Recebimentos
```

Evitar transformar categoria em uma funcionalidade independente caso isso não esteja previsto no roadmap.

---

# 34. EDIÇÃO

Permitir editar lançamentos manuais.

Ao abrir edição:

```text
Editar lançamento
```

preencher todos os campos editáveis.

Não permitir alterar:

```text
origem
referencia_id
```

de um lançamento automático.

---

# 35. EXCLUSÃO

Ao excluir lançamento manual:

mostrar confirmação:

```text
Excluir lançamento?

Esta ação removerá o lançamento financeiro.

[Cancelar] [Excluir]
```

Após sucesso:

```text
Lançamento excluído com sucesso.
```

Atualizar:

```text
extrato
cards
saldo
```

---

# 36. IDENTIFICAÇÃO DA ORIGEM

No extrato, apresentar claramente:

```text
Origem
```

Exemplos:

```text
Compra #123
Venda #456
Manual
```

Isso permitirá diferenciar lançamentos automáticos e manuais.

---

# 37. EXTRATO

Colunas sugeridas:

```text
Data
Descrição
Categoria
Tipo
Valor
Origem
Ações
```

Para entrada:

```text
ENTRADA
R$ 1.500,00
```

Para saída:

```text
SAIDA
R$ 800,00
```

Utilizar o Design System existente para diferenciação visual.

---

# 38. ESTADO VAZIO

Quando não houver lançamentos:

```text
Nenhum lançamento financeiro encontrado.
```

Quando filtros não retornarem resultados:

```text
Nenhum lançamento encontrado para os filtros selecionados.
```

---

# 39. LOADING

Implementar:

```text
Carregando dados financeiros...
```

e:

```text
Salvando lançamento...
```

Durante operações:

* impedir submits duplicados;
* preservar feedback visual;
* tratar erros.

---

# 40. TRATAMENTO DE ERROS

Mensagens amigáveis:

```text
Lançamento não encontrado.
Valor inválido.
Tipo de lançamento inválido.
Data inválida.
Categoria inválida.
Lançamento automático não pode ser alterado manualmente.
Lançamento automático não pode ser excluído.
Não foi possível calcular o saldo.
Não foi possível salvar o lançamento.
```

Não expor:

```text
stack trace
SQL
detalhes internos
```

O projeto exige tratamento centralizado de erros e proíbe exposição de informações internas.

---

# 41. AUTENTICAÇÃO

Utilizar a autenticação já implementada.

Não criar:

```text
novo login
novo token
nova sessão
```

---

# 42. AUTORIZAÇÃO

Utilizar o mecanismo de autorização existente.

Não confiar somente na interface.

Exemplo:

```text
Botão "Excluir"
```

pode ser ocultado para determinado perfil, mas o back-end também deverá bloquear a operação quando não autorizada.

O back-end é a autoridade final sobre permissões.

---

# 43. INTEGRAÇÃO COM COMPRAS

Validar que os lançamentos financeiros criados pela Feature 5 continuam funcionando.

Fluxo:

```text
Registrar Compra
      ↓
Compra
      ↓
Estoque + ENTRADA
      ↓
Financeiro + SAIDA
```

A Feature 5 define explicitamente a criação do lançamento financeiro de saída.

---

# 44. INTEGRAÇÃO COM VENDAS

Validar que os lançamentos financeiros criados pela Feature 6 continuam funcionando.

Fluxo:

```text
Registrar Venda
      ↓
Venda
      ↓
Estoque - SAIDA
      ↓
Financeiro + ENTRADA
```

A Feature 6 define explicitamente essa integração.

---

# 45. NÃO DUPLICAR LANÇAMENTOS

Ao abrir a tela financeira:

```text
não criar lançamentos
```

A página deve somente consultar os dados.

Ao registrar compra/venda:

```text
a operação de origem cria o lançamento
```

O módulo financeiro apenas consulta e gerencia os lançamentos que forem manuais.

---

# 46. INTEGRIDADE

Garantir:

```text
Compra → uma saída financeira correspondente
Venda → uma entrada financeira correspondente
Lançamento manual → uma operação financeira correspondente
```

Não criar duplicidades.

---

# 47. TRANSAÇÕES

Não quebrar as transações já existentes nas Features 5 e 6.

Especialmente:

```text
Compra
+
Estoque
+
Movimentação
+
Financeiro
```

deve continuar sendo uma operação atômica.

E:

```text
Venda
+
Estoque
+
Movimentação
+
Financeiro
```

também deve continuar sendo atômica.

---

# 48. BANCO DE DADOS

Verificar:

```text
chaves
foreign keys
índices
constraints
timestamps
decimal
integridade referencial
```

O plano determina integridade referencial, índices e transações nas operações críticas.

Criar migration somente quando necessária.

---

# 49. ÍNDICES

Avaliar índices para as consultas:

```text
data_lancamento
tipo
categoria
tipo_referencia
referencia_id
```

Criar somente os índices realmente utilizados pelas consultas.

---

# 50. PERFORMANCE

As consultas financeiras deverão ser realizadas no banco.

Evitar:

```text
SELECT tudo
      ↓
carregar no Node
      ↓
filtrar
      ↓
somar
```

Preferir:

```text
Banco
 ↓
filtros
 ↓
SUM / agregações
 ↓
resultado
```

Especialmente no cálculo de:

```text
total_entradas
total_saidas
saldo
```

---

# 51. TESTES — CRUD

Implementar testes para:

```text
✓ criar entrada manual
✓ criar saída manual
✓ consultar lançamento
✓ listar lançamentos
✓ atualizar lançamento manual
✓ excluir lançamento manual
✓ validar dados inválidos
```

---

# 52. TESTES — SALDO

Criar cenário:

```text
Entrada = 1.000
Entrada = 500
Saída = 300
Saída = 200
```

Resultado:

```text
Total Entradas = 1.500
Total Saídas = 500
Saldo = 1.000
```

---

# 53. TESTE — SALDO NEGATIVO

Caso:

```text
Entradas = 500
Saídas = 800
```

Resultado:

```text
Saldo = -300
```

O saldo negativo não deve ser confundido com estoque negativo.

Não aplicar a regra de estoque ao financeiro.

---

# 54. TESTE — INTEGRAÇÃO COM COMPRA

Executar:

```text
Registrar compra de R$ 1.000
```

Validar:

```text
✓ compra criada
✓ estoque atualizado
✓ movimentação de estoque criada
✓ lançamento financeiro SAIDA criado
✓ valor = R$ 1.000
```

---

# 55. TESTE — INTEGRAÇÃO COM VENDA

Executar:

```text
Registrar venda de R$ 1.500
```

Validar:

```text
✓ venda criada
✓ estoque atualizado
✓ movimentação criada
✓ lançamento financeiro ENTRADA criado
✓ valor = R$ 1.500
```

---

# 56. TESTE — DUPLICIDADE

Garantir que uma mesma compra não gere dois lançamentos financeiros.

Garantir que uma mesma venda não gere dois lançamentos financeiros.

Se a arquitetura atual já utiliza transações para isso, preservar esse comportamento.

---

# 57. TESTE — FILTRO POR PERÍODO

Criar lançamentos:

```text
01/08
15/08
31/08
01/09
```

Consultar:

```text
01/08 → 31/08
```

Resultado:

```text
somente os três lançamentos de agosto
```

---

# 58. TESTE — FILTRO POR CATEGORIA

Criar:

```text
Aluguel
Contas
Recebimentos
```

Filtrar:

```text
Aluguel
```

Resultado:

```text
somente lançamentos da categoria Aluguel
```

---

# 59. TESTE — FILTRO POR TIPO

Criar:

```text
ENTRADA
SAIDA
```

Filtrar:

```text
ENTRADA
```

Resultado:

```text
somente entradas
```

---

# 60. TESTE — LANÇAMENTO AUTOMÁTICO

Criar uma compra.

Consultar financeiro.

Verificar:

```text
origem = Compra
tipo = SAIDA
```

Criar uma venda.

Consultar financeiro.

Verificar:

```text
origem = Venda
tipo = ENTRADA
```

---

# 61. TESTE — PROTEÇÃO DE LANÇAMENTO AUTOMÁTICO

Se o modelo permitir identificação inequívoca de origem:

```text
Compra #123
```

não deve ser editável/excluível diretamente pelo CRUD manual.

O sistema deverá retornar erro de negócio.

---

# 62. TESTES FRONT-END

Utilizar os frameworks já configurados no projeto.

Testar:

```text
✓ renderização da página
✓ cards financeiros
✓ extrato
✓ filtros
✓ formulário
✓ criação
✓ edição
✓ exclusão
✓ confirmação
✓ loading
✓ estado vazio
✓ mensagens de erro
✓ atualização do saldo
✓ atualização dos cards
```

---

# 63. RESPONSIVIDADE

Validar:

```text
Desktop
Tablet
Mobile
```

A tela financeira deverá continuar utilizável em telas menores.

O extrato deverá possuir comportamento adequado para visualização mobile.

---

# 64. SEGURANÇA

Respeitar as regras existentes:

```text
✓ autenticação
✓ autorização
✓ Zod
✓ Prisma
✓ tratamento centralizado de erros
✓ proteção contra SQL Injection
✓ headers de segurança
```

O plano estabelece Prisma para proteção das queries e Zod para validação dos dados de entrada.

---

# 65. NÃO IMPLEMENTAR NESTA FEATURE

Não antecipar as próximas features.

Não implementar:

```text
❌ Relatórios gerenciais
❌ Relatório de vendas
❌ Relatório de compras
❌ Relatório financeiro avançado
❌ Dashboard consolidado
❌ Auditoria completa
❌ Importação XML
❌ Aplicativo Android
```

A próxima etapa será:

> **Feature 9 — Relatórios Gerenciais**

que terá suas próprias queries, filtros, agregações e telas.

---

# 66. NÃO MODIFICAR FUNCIONALIDADES ANTERIORES DESNECESSARIAMENTE

Não alterar:

```text
Autenticação
Usuários
Produtos
Fornecedores
Clientes
Compras
Vendas
Estoque
```

exceto quando for estritamente necessário para integrar corretamente o módulo financeiro.

Se uma alteração for necessária:

1. identificar o motivo;
2. alterar somente o necessário;
3. executar os testes da feature afetada;
4. executar a suíte completa;
5. verificar regressões.

---

# 67. ORDEM DE IMPLEMENTAÇÃO

Executar exatamente nesta ordem.

## ETAPA 1 — ANÁLISE

Analisar:

```text
schema.prisma
lancamentos_financeiros
compras
vendas
estoque
services
repositories
controllers
rotas
schemas Zod
autorização
front-end
Design System
testes
```

---

## ETAPA 2 — BANCO

Verificar:

```text
modelo
enum
foreign keys
índices
constraints
decimal
timestamps
```

Criar migration somente se necessária.

---

## ETAPA 3 — BACK-END

Criar/ajustar:

```text
modulo financeiro
repositories
services
controllers
schemas
rotas
```

---

## ETAPA 4 — CRUD

Implementar:

```text
criação
consulta
listagem
alteração
exclusão
```

somente para lançamentos permitidos.

---

## ETAPA 5 — EXTRATO

Implementar:

```text
GET /api/lancamentos-financeiros
```

com:

```text
paginação
período
categoria
tipo
ordenação
```

---

## ETAPA 6 — SALDO

Implementar endpoint de saldo consolidado:

```text
GET /api/lancamentos-financeiros/saldo
```

Retornar:

```text
total_entradas
total_saidas
saldo
```

---

## ETAPA 7 — FRONT-END

Implementar:

```text
servico financeiro
tipos
página Financeiro
cards
extrato
filtros
formulário
edição
exclusão
confirmações
feedbacks
```

---

## ETAPA 8 — INTEGRAÇÃO

Validar:

```text
Compra
   ↓
Financeiro SAIDA

Venda
   ↓
Financeiro ENTRADA

Manual
   ↓
Financeiro
```

---

## ETAPA 9 — TESTES

Executar:

```text
testes unitários
testes de integração
testes de CRUD
testes de saldo
testes de filtros
testes de integração compra
testes de integração venda
testes front-end
```

---

## ETAPA 10 — VALIDAÇÃO FINAL

Executar:

```text
lint
testes
build
```

Depois executar teste manual no navegador.

---

# 68. TESTE MANUAL COMPLETO

Executar:

```text
1. Fazer login
2. Abrir Financeiro
3. Conferir Total de Entradas
4. Conferir Total de Saídas
5. Conferir Saldo Atual
6. Consultar extrato
7. Filtrar por período
8. Filtrar por categoria
9. Filtrar por tipo
10. Criar lançamento manual de entrada
11. Conferir extrato
12. Conferir total de entradas
13. Conferir saldo
14. Criar lançamento manual de saída
15. Conferir total de saídas
16. Conferir saldo
17. Editar lançamento manual
18. Conferir atualização
19. Excluir lançamento manual
20. Confirmar exclusão
21. Conferir atualização
22. Registrar uma compra
23. Conferir lançamento financeiro SAIDA
24. Registrar uma venda
25. Conferir lançamento financeiro ENTRADA
26. Verificar origem dos lançamentos
27. Testar paginação
28. Testar estado vazio
29. Testar mensagens de erro
30. Testar responsividade
```

---

# 69. CRITÉRIOS DE ACEITE

A Feature 8 somente poderá ser considerada concluída quando:

```text
[✓] Tabela lancamentos_financeiros validada
[✓] Migration criada se necessária
[✓] Módulo financeiro
[✓] Repository
[✓] Service
[✓] Controller
[✓] Rotas
[✓] Schemas Zod
[✓] CRUD manual
[✓] Entradas
[✓] Saídas
[✓] Extrato
[✓] Paginação
[✓] Filtro por período
[✓] Filtro por categoria
[✓] Filtro por tipo
[✓] Saldo consolidado
[✓] Total de entradas
[✓] Total de saídas
[✓] Integração com compras
[✓] Integração com vendas
[✓] Identificação de origem
[✓] Proteção de lançamentos automáticos
[✓] Serviço financeiro no front-end
[✓] Tipos TypeScript
[✓] Página Financeiro
[✓] Cards
[✓] Extrato
[✓] Formulário
[✓] Edição
[✓] Exclusão
[✓] Confirmação
[✓] Loading
[✓] Estado vazio
[✓] Tratamento de erros
[✓] Responsividade
[✓] Testes de CRUD
[✓] Testes de saldo
[✓] Testes de filtros
[✓] Testes de integração com compras
[✓] Testes de integração com vendas
[✓] Testes front-end
[✓] Lint
[✓] Build
[✓] Suíte de testes sem regressões
```

---

# 70. RELATÓRIO FINAL OBRIGATÓRIO

Ao finalizar a implementação, apresentar:

```text
1. Resumo da implementação
2. Arquivos criados
3. Arquivos alterados
4. Alterações no Prisma
5. Migrations
6. Índices
7. Endpoints criados
8. Endpoints alterados
9. Regras de negócio
10. Modelo de lançamento financeiro
11. Estratégia de cálculo do saldo
12. Estratégia de filtros
13. Estratégia de identificação da origem
14. Estratégia de proteção dos lançamentos automáticos
15. Integração com compras
16. Integração com vendas
17. Componentes front-end
18. Testes criados
19. Resultado dos testes
20. Resultado do lint
21. Resultado do build
22. Teste manual realizado
23. Problemas encontrados
24. Decisões arquiteturais
25. Pendências
```

Não declarar a feature como concluída caso exista:

```text
erro de compilação
teste quebrado
saldo incorreto
duplicidade financeira
lançamento automático inconsistente
filtro incorreto
CRUD incompleto
erro de integração com compras
erro de integração com vendas
front-end incompleto
```

---

# 71. PRINCÍPIO FINAL

O módulo financeiro deve consolidar todas as movimentações financeiras do sistema:

```text
                    FINANCEIRO
                        │
          ┌─────────────┼─────────────┐
          │             │             │
       COMPRAS        VENDAS        MANUAL
          │             │             │
        SAIDA         ENTRADA       ENTRADA
                                    / SAIDA
          │             │             │
          └─────────────┼─────────────┘
                        ↓
              LANCAMENTOS_FINANCEIROS
                        ↓
             ┌──────────┼──────────┐
             │          │          │
          Entradas    Saídas     Saldo
```

A regra fundamental é:

```text
SALDO = TOTAL DE ENTRADAS - TOTAL DE SAÍDAS
```

O módulo financeiro deve ser independente do React e expor todas as regras através da API REST, mantendo o back-end como autoridade das regras de negócio.

A Feature 8 deve preparar o sistema para a próxima etapa, mas **não implementá-la**.

A próxima etapa do roadmap será:

> **Feature 9 — Relatórios Gerenciais**, com relatórios de vendas, compras e financeiro e suas respectivas agregações e filtros.
