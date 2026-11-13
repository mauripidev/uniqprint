# PROMPT — IMPLEMENTAÇÃO DA FEATURE 10: DASHBOARD CONSOLIDADO

Você é responsável pela implementação da próxima feature do sistema **Uniqprint — Controle de Compras e Vendas**.

## CONTEXTO

As seguintes features já foram implementadas e validadas:

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

A próxima implementação obrigatória é:

> **Feature 10 — Dashboard Consolidado**

A arquitetura define que o Dashboard deve consolidar informações de vendas, compras, financeiro e estoque em uma visão simples e objetiva.

---

# 1. OBJETIVO

Implementar o **Dashboard Consolidado** como a principal tela inicial do sistema após o login.

O Dashboard deverá fornecer uma visão rápida da situação atual do negócio, consolidando:

```text
Vendas
Compras
Financeiro
Estoque
Últimas operações
Alertas
```

O Dashboard deve ser:

* simples;
* rápido;
* objetivo;
* visualmente claro;
* útil para tomada de decisão;
* baseado nos dados reais do sistema.

Não transformar o Dashboard em uma tela complexa de BI.

O plano original determina que o Dashboard deverá permanecer simples, evitando excesso de informações.

---

# 2. REGRA ARQUITETURAL

Seguir obrigatoriamente o desenvolvimento vertical:

```text
Banco / Prisma
      ↓
Back-end
      ↓
Front-end
      ↓
Testes
```

A arquitetura determina que cada feature deve contemplar banco, back-end, front-end e testes.

---

# 3. ARQUITETURA DO BACK-END

Manter obrigatoriamente:

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

Não permitir acesso direto ao banco pelo controller.

O back-end continua sendo a autoridade das regras de negócio.

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

O React não deve acessar o banco.

O Dashboard deve consumir exclusivamente a API.

---

# 5. ANÁLISE OBRIGATÓRIA ANTES DE CODIFICAR

Antes de criar ou modificar qualquer código:

1. analisar `plan.md`;
2. analisar `implementation_plan.md`;
3. analisar `.agents/skills/arquitetura/skill.md`;
4. analisar `.agents/skills/back-end/skill.md`;
5. analisar `.agents/skills/front-end/skill.md`;
6. analisar `.agents/rules/arquitetura.md`;
7. analisar `schema.prisma`;
8. analisar módulo de produtos;
9. analisar módulo de estoque;
10. analisar módulo de compras;
11. analisar módulo de vendas;
12. analisar módulo financeiro;
13. analisar módulo de relatórios;
14. analisar rotas existentes;
15. analisar serviços existentes;
16. analisar repositories existentes;
17. analisar componentes existentes;
18. analisar layout atual;
19. analisar sistema de navegação;
20. analisar testes existentes.

Não criar uma arquitetura paralela.

Reutilizar os padrões já utilizados nas Features 1–9.

---

# 6. ENDPOINT PRINCIPAL

Implementar:

```http
GET /api/dashboard/resumo
```

Esse endpoint está explicitamente definido na Feature 10.

---

# 7. RESPONSABILIDADE DO ENDPOINT

O endpoint deverá consolidar os principais indicadores do sistema em uma única resposta.

O resultado deverá conter informações relacionadas a:

```text
Vendas
Compras
Financeiro
Produtos
Estoque crítico
Últimas operações
```

Evitar que o front-end precise realizar diversas chamadas independentes para montar o Dashboard.

---

# 8. ESTRUTURA CONCEITUAL DA RESPOSTA

Criar um contrato semelhante a:

```json
{
  "vendas": {},
  "compras": {},
  "financeiro": {},
  "estoque": {},
  "ultimasOperacoes": []
}
```

A estrutura final deve ser adaptada aos modelos reais existentes.

Não inventar campos que não tenham correspondência nos dados do sistema.

---

# 9. RESUMO DE VENDAS

O Dashboard deverá apresentar:

```text
Total de vendas no período
```

Conforme definido no plano, o Dashboard deve apresentar o total de vendas do período.

Utilizar os dados reais do módulo de vendas.

Não duplicar regras de cálculo existentes.

---

# 10. RESUMO DE COMPRAS

Apresentar:

```text
Total de compras no período
```

O valor deverá ser obtido diretamente dos dados de compras existentes.

---

# 11. RESUMO FINANCEIRO

Apresentar:

```text
Entradas financeiras
Saídas financeiras
Saldo financeiro
```

Esses indicadores fazem parte explicitamente do Dashboard.

Regra:

```text
Saldo = Entradas - Saídas
```

Sempre que possível, reutilizar a mesma regra/cálculo já utilizado no módulo financeiro.

Não criar uma segunda implementação conflitante do cálculo de saldo.

---

# 12. RESUMO DE PRODUTOS

Apresentar:

```text
Quantidade de produtos
```

O indicador deve representar os produtos cadastrados conforme a regra existente no sistema.

Verificar no modelo atual se produtos inativos devem ou não fazer parte dessa contagem.

Não assumir a regra sem verificar o comportamento já implementado no módulo de produtos.

---

# 13. ESTOQUE CRÍTICO

Apresentar:

```text
Produtos com estoque baixo
```

Esse indicador está explicitamente definido no escopo do Dashboard.

Utilizar a mesma regra de estoque baixo já existente na Feature 7.

Não criar uma regra diferente.

---

# 14. LISTA DE PRODUTOS COM ESTOQUE BAIXO

Além da quantidade, o Dashboard deverá apresentar uma lista/tabela compacta dos produtos críticos.

Informações sugeridas:

```text
Produto
Quantidade atual
Indicador de estoque baixo
```

Utilizar os campos realmente disponíveis.

Exemplo visual:

```text
ESTOQUE BAIXO

Produto             Estoque
--------------------------------
Produto A              2
Produto B              1
Produto C              3
```

---

# 15. ÚLTIMAS OPERAÇÕES

O Dashboard deverá apresentar:

```text
Últimas vendas
Últimas compras
```

conforme definido no plano original.

A Feature 10 também determina a apresentação das últimas movimentações.

---

# 16. MODELO DE ÚLTIMAS OPERAÇÕES

Criar uma estrutura unificada, quando possível:

```text
Data
Tipo
Descrição
Valor
```

Exemplo:

```text
29/08  Venda    Venda #1024       R$ 450,00
29/08  Compra   Compra #204       R$ 300,00
28/08  Venda    Venda #1023       R$ 180,00
28/08  Compra   Compra #203       R$ 500,00
```

Adaptar aos modelos existentes.

Não duplicar registros no banco apenas para alimentar o Dashboard.

---

# 17. PERÍODO DO DASHBOARD

O endpoint deverá trabalhar com um período definido.

Antes de implementar, verificar como a Feature 9 implementou seus filtros e reutilizar o mesmo padrão quando fizer sentido.

Priorizar:

```text
Período atual
```

ou o padrão de período já utilizado pelo sistema.

Não criar múltiplas formas de seleção de período se isso não estiver suportado pela arquitetura existente.

---

# 18. CONSOLIDAÇÃO

O endpoint deverá consolidar os dados necessários.

Priorizar consultas eficientes.

Não fazer:

```text
buscar todas as vendas
buscar todas as compras
buscar todos os lançamentos
buscar todos os produtos
↓
agregar tudo no Node.js
```

Preferir:

```text
Banco
 ↓
COUNT
SUM
GROUP BY
ORDER BY
LIMIT
WHERE
 ↓
resultado consolidado
```

---

# 19. PERFORMANCE

O Dashboard será uma tela frequentemente acessada.

Portanto:

* evitar consultas desnecessárias;
* evitar N+1;
* utilizar agregações;
* limitar listas de últimas operações;
* selecionar somente campos necessários;
* utilizar índices quando necessário;
* evitar carregar registros completos.

Não implementar cache complexo nesta feature sem necessidade.

---

# 20. REPOSITORY

Criar o repository específico do Dashboard conforme o padrão atual.

Exemplo conceitual:

```text
dashboard.repository.ts
```

Responsabilidades:

```text
obterResumoVendas()
obterResumoCompras()
obterResumoFinanceiro()
obterResumoEstoque()
obterProdutosEstoqueBaixo()
obterUltimasOperacoes()
```

Os nomes devem seguir o padrão real do projeto.

---

# 21. SERVICE

Criar um serviço/caso de uso responsável pela consolidação.

Exemplo:

```text
obterResumoDashboard()
```

Esse serviço deverá coordenar os repositories e montar a resposta final.

---

# 22. CONTROLLER

Criar o controller responsável por:

```text
GET /api/dashboard/resumo
```

O controller deve:

1. receber a requisição;
2. validar parâmetros;
3. chamar o serviço;
4. retornar o resultado;
5. utilizar o tratamento centralizado de erros.

Não colocar regras de negócio no controller.

---

# 23. VALIDAÇÃO

Utilizar Zod.

A arquitetura exige validação de 100% dos dados de entrada no back-end.

Caso o endpoint tenha parâmetros de período:

```text
dataInicial
dataFinal
```

validar:

```text
dataInicial <= dataFinal
```

Se não houver parâmetros, utilizar o padrão definido pelo projeto.

---

# 24. SEGURANÇA

O endpoint deve exigir autenticação.

Utilizar o mecanismo de autenticação já implementado.

Não criar autenticação paralela.

Garantir que o usuário autenticado somente receba informações permitidas pela aplicação.

---

# 25. FRONT-END — PÁGINA PRINCIPAL

Transformar o Dashboard na página inicial após o login.

Fluxo:

```text
Login
  ↓
Dashboard
```

A Feature 10 define explicitamente uma página inicial do Dashboard pós-login.

---

# 26. SERVIÇO FRONT-END

Criar:

```text
servicos/dashboard.ts
```

com método equivalente a:

```text
obterResumoDashboard()
```

Criar tipos TypeScript para o contrato da API.

---

# 27. TIPOS TYPESCRIPT

Criar tipos equivalentes a:

```text
DashboardResumo
DashboardVendas
DashboardCompras
DashboardFinanceiro
DashboardEstoque
DashboardOperacao
```

Os nomes devem seguir o padrão existente.

Os tipos devem refletir exatamente a resposta da API.

---

# 28. LAYOUT DO DASHBOARD

O Dashboard deverá ser visualmente simples.

Estrutura sugerida:

```text
┌─────────────────────────────────────────────┐
│ Dashboard                                   │
│ Visão geral do negócio                      │
├────────────┬────────────┬───────────────────┤
│ Vendas     │ Compras    │ Saldo             │
│ R$ ...     │ R$ ...     │ R$ ...            │
├────────────┴────────────┴───────────────────┤
│                                             │
│ Entradas       Saídas                       │
│ R$ ...         R$ ...                       │
│                                             │
├──────────────────────────┬──────────────────┤
│ Estoque baixo            │ Últimas operações│
│                          │                  │
│ Produto A     2          │ Venda #...      │
│ Produto B     1          │ Compra #...     │
│                          │ Venda #...      │
└──────────────────────────┴──────────────────┘
```

Adaptar ao Design System já existente.

---

# 29. CARDS DE RESUMO

Criar cards para:

```text
Total de Vendas
Total de Compras
Entradas
Saídas
Saldo
Quantidade de Produtos
Produtos com Estoque Baixo
```

Não obrigatoriamente colocar todos os indicadores em cards independentes se isso prejudicar a experiência.

O objetivo é manter o Dashboard simples.

---

# 30. CARD DE VENDAS

Exibir:

```text
Vendas
R$ XX.XXX,XX
```

Opcionalmente:

```text
Quantidade de vendas
```

somente se essa informação já estiver disponível de forma eficiente.

---

# 31. CARD DE COMPRAS

Exibir:

```text
Compras
R$ XX.XXX,XX
```

Opcionalmente:

```text
Quantidade de compras
```

---

# 32. CARD FINANCEIRO

Exibir:

```text
Entradas
R$ XX.XXX,XX

Saídas
R$ XX.XXX,XX

Saldo
R$ XX.XXX,XX
```

O saldo deve ser claramente identificável.

---

# 33. CARD DE ESTOQUE

Exibir:

```text
Produtos
XXX

Estoque baixo
XX
```

Permitir que o usuário compreenda rapidamente a situação do estoque.

---

# 34. ALERTA DE ESTOQUE BAIXO

Criar uma seção:

```text
Atenção: produtos com estoque baixo
```

Exibir os produtos críticos.

Exemplo:

```text
⚠ Produto A — 2 unidades
⚠ Produto B — 1 unidade
⚠ Produto C — 3 unidades
```

Utilizar o componente de alerta existente quando disponível.

---

# 35. ATALHOS RÁPIDOS

A Feature 10 exige atalhos rápidos:

```text
Nova Venda
Nova Compra
```

Criar botões de destaque:

```text
[ + Nova Venda ]

[ + Nova Compra ]
```

Ao clicar, navegar para as respectivas telas existentes.

Não duplicar os formulários de venda ou compra dentro do Dashboard.

---

# 36. ÚLTIMAS MOVIMENTAÇÕES

Criar seção:

```text
Últimas movimentações
```

Exibir quantidade limitada de registros.

Exemplo:

```text
29/08  Venda    #1024    R$ 450,00
29/08  Compra   #204     R$ 300,00
28/08  Venda    #1023    R$ 180,00
```

Adicionar link:

```text
Ver todas
```

somente quando houver uma tela adequada já implementada.

---

# 37. LOADING

Durante carregamento:

```text
Carregando dashboard...
```

Preferencialmente utilizar skeleton/loading visual.

Não apresentar cards com valores incorretos enquanto a API estiver carregando.

---

# 38. ESTADO VAZIO

Se não existirem operações:

```text
Nenhuma movimentação encontrada.
```

Se não existirem produtos críticos:

```text
Nenhum produto com estoque baixo.
```

---

# 39. ERRO

Se a API falhar:

```text
Não foi possível carregar o dashboard.
```

Adicionar:

```text
[Tentar novamente]
```

se compatível com o padrão atual da aplicação.

Não exibir:

```text
stack trace
SQL
erro interno
```

---

# 40. RESPONSIVIDADE

O Dashboard deve funcionar em:

```text
Desktop
Tablet
Mobile
```

No mobile:

* cards devem reorganizar;
* tabelas devem ser responsivas;
* atalhos devem permanecer acessíveis;
* informações importantes devem aparecer primeiro.

---

# 41. ACESSIBILIDADE

Garantir:

```text
labels adequados
foco de teclado
botões acessíveis
hierarquia de títulos
contraste
mensagens claras
```

Não utilizar apenas cor para comunicar estado.

---

# 42. NAVEGAÇÃO

Após login:

```text
/login
   ↓
/dashboard
```

O Dashboard deverá ser a página inicial.

Verificar o React Router existente antes de alterar as rotas.

---

# 43. MENU

Se existir menu lateral/superior:

```text
Dashboard
Produtos
Fornecedores
Clientes
Compras
Vendas
Estoque
Financeiro
Relatórios
```

Garantir que:

```text
Dashboard
```

esteja claramente disponível.

Não alterar a navegação existente sem necessidade.

---

# 44. NÃO CRIAR GRÁFICOS DESNECESSÁRIOS

Não transformar esta feature em um sistema de BI.

Não implementar automaticamente:

```text
❌ gráficos complexos
❌ mapas
❌ heatmaps
❌ indicadores preditivos
❌ inteligência artificial
❌ previsão de vendas
❌ comparativos avançados
```

A especificação determina um Dashboard simples, evitando excesso de informações.

---

# 45. NÃO DUPLICAR RELATÓRIOS

O Dashboard deve apresentar apenas resumos.

Para análises detalhadas, utilizar a Feature 9:

```text
Dashboard
   ↓
Resumo
   ↓
Relatórios
   ↓
Detalhamento
```

Não copiar as tabelas completas de vendas, compras e financeiro para o Dashboard.

---

# 46. INTEGRAÇÃO COM RELATÓRIOS

Quando houver necessidade de detalhamento:

```text
Dashboard
    ↓
Ver relatório
    ↓
Relatórios
```

Reutilizar as páginas existentes.

---

# 47. INTEGRAÇÃO COM ESTOQUE

O indicador de estoque baixo deve utilizar a mesma regra da Feature 7.

Não criar um segundo conceito de:

```text
estoque baixo
```

---

# 48. INTEGRAÇÃO COM FINANCEIRO

Os indicadores:

```text
Entradas
Saídas
Saldo
```

devem ser consistentes com o módulo financeiro.

Não duplicar regras financeiras.

---

# 49. INTEGRAÇÃO COM VENDAS

O total de vendas do Dashboard deve ser consistente com os dados utilizados pelo Relatório de Vendas.

Exemplo:

```text
Dashboard:
Total de vendas = R$ 10.000

Relatório de Vendas:
Mesmo período = R$ 10.000
```

---

# 50. INTEGRAÇÃO COM COMPRAS

O total de compras deve ser consistente com o Relatório de Compras.

---

# 51. TESTES — BACK-END

Criar testes para:

```text
✓ endpoint /api/dashboard/resumo
✓ usuário autenticado
✓ resumo de vendas
✓ resumo de compras
✓ entradas financeiras
✓ saídas financeiras
✓ saldo
✓ quantidade de produtos
✓ produtos com estoque baixo
✓ últimas operações
✓ ausência de registros
✓ filtros/período, quando aplicável
✓ tratamento de erros
```

A Feature 10 exige especificamente testes do endpoint do Dashboard.

---

# 52. TESTE DE CONSISTÊNCIA

Criar dados controlados:

```text
Vendas = R$ 1.000
Compras = R$ 600
Entradas = R$ 1.000
Saídas = R$ 600
```

Validar:

```text
Saldo = R$ 400
```

---

# 53. TESTE DE ESTOQUE CRÍTICO

Criar produtos:

```text
Produto A → estoque crítico
Produto B → estoque normal
```

Validar que apenas:

```text
Produto A
```

apareça na lista de estoque baixo.

Utilizar exatamente a regra de estoque baixo existente no módulo de estoque.

---

# 54. TESTE DE ÚLTIMAS OPERAÇÕES

Criar várias operações.

Validar:

```text
ordenação correta
limite de registros
tipo da operação
data
valor
```

Garantir que as operações mais recentes apareçam primeiro.

---

# 55. TESTES FRONT-END

Criar testes de renderização dos componentes.

A Feature 10 exige testes de renderização de componentes.

Testar:

```text
✓ Dashboard renderiza
✓ cards aparecem
✓ valores são exibidos
✓ estoque baixo aparece
✓ últimas operações aparecem
✓ botão Nova Venda funciona
✓ botão Nova Compra funciona
✓ loading
✓ estado vazio
✓ erro
```

---

# 56. TESTE DE NAVEGAÇÃO

Validar:

```text
Login
 ↓
Dashboard
 ↓
Nova Venda
```

e:

```text
Dashboard
 ↓
Nova Compra
```

Garantir que os atalhos utilizem as rotas já existentes.

---

# 57. TESTE RESPONSIVO

Validar visualmente:

```text
Desktop
Tablet
Mobile
```

Verificar principalmente:

```text
cards
alerta de estoque
últimas movimentações
atalhos
menu
```

---

# 58. PERFORMANCE DO FRONT-END

Não fazer chamadas individuais para cada card.

Preferir:

```text
GET /api/dashboard/resumo
```

retornando os dados necessários.

O Dashboard deve carregar utilizando o mínimo possível de chamadas de API.

---

# 59. CACHE

Não implementar Redis ou mecanismo complexo de cache nesta feature.

Somente utilizar cache se já existir infraestrutura no projeto.

O MVP deve priorizar simplicidade.

---

# 60. NÃO ALTERAR FEATURES ANTERIORES

Não modificar desnecessariamente:

```text
Produtos
Fornecedores
Clientes
Compras
Vendas
Estoque
Financeiro
Relatórios
```

Caso uma alteração seja indispensável:

1. explicar o motivo;
2. fazer a menor alteração possível;
3. executar os testes afetados;
4. executar a suíte completa.

---

# 61. NÃO IMPLEMENTAR NESTA FEATURE

Não implementar ainda:

```text
❌ Auditoria
❌ tabela registros_auditoria
❌ fluxo E2E completo
❌ importação XML
❌ aplicativo Android
❌ funcionalidades futuras
```

A próxima etapa será a **Feature 11 — Auditoria e Teste de Fluxo Completo Ponta a Ponta**.

---

# 62. ORDEM DE IMPLEMENTAÇÃO

Executar exatamente nesta ordem:

## ETAPA 1 — ANÁLISE

Mapear os módulos:

```text
Produtos
Estoque
Compras
Vendas
Financeiro
Relatórios
```

---

## ETAPA 2 — DEFINIÇÃO DO CONTRATO

Definir:

```text
DashboardResumo
```

com os dados necessários.

---

## ETAPA 3 — QUERIES

Criar consultas eficientes para:

```text
vendas
compras
financeiro
produtos
estoque crítico
últimas operações
```

---

## ETAPA 4 — REPOSITORY

Criar os métodos de acesso aos dados.

---

## ETAPA 5 — SERVICE

Criar:

```text
obterResumoDashboard()
```

---

## ETAPA 6 — ZOD

Criar validação dos parâmetros, caso existam.

---

## ETAPA 7 — CONTROLLER

Implementar o controller.

---

## ETAPA 8 — ROTA

Registrar:

```http
GET /api/dashboard/resumo
```

---

## ETAPA 9 — TESTES BACK-END

Testar:

```text
endpoint
agregações
integrações
estoque
financeiro
últimas operações
```

---

## ETAPA 10 — FRONT-END SERVICE

Criar:

```text
servicos/dashboard.ts
```

---

## ETAPA 11 — TIPOS

Criar os tipos TypeScript.

---

## ETAPA 12 — DASHBOARD

Criar a página:

```text
Dashboard
```

---

## ETAPA 13 — CARDS

Implementar os indicadores.

---

## ETAPA 14 — ESTOQUE CRÍTICO

Implementar alerta/listagem.

---

## ETAPA 15 — ÚLTIMAS OPERAÇÕES

Implementar a lista.

---

## ETAPA 16 — ATALHOS

Implementar:

```text
Nova Venda
Nova Compra
```

---

## ETAPA 17 — LOADING / ERRO / VAZIO

Implementar todos os estados.

---

## ETAPA 18 — RESPONSIVIDADE

Testar:

```text
Desktop
Tablet
Mobile
```

---

## ETAPA 19 — TESTES FRONT-END

Criar testes de renderização e interação.

---

## ETAPA 20 — REGRESSÃO

Executar toda a suíte das Features 1–10.

---

# 63. TESTE MANUAL COMPLETO

Executar:

```text
1. Fazer login
2. Verificar redirecionamento para Dashboard
3. Verificar cards
4. Conferir total de vendas
5. Conferir total de compras
6. Conferir entradas
7. Conferir saídas
8. Conferir saldo
9. Conferir quantidade de produtos
10. Conferir produtos com estoque baixo
11. Conferir últimas operações
12. Clicar em Nova Venda
13. Voltar ao Dashboard
14. Clicar em Nova Compra
15. Voltar ao Dashboard
16. Verificar responsividade
17. Simular ausência de dados
18. Simular erro da API
19. Testar loading
```

---

# 64. CRITÉRIOS DE ACEITE

A Feature 10 somente estará concluída quando:

```text
[✓] Endpoint GET /api/dashboard/resumo
[✓] Repository
[✓] Service
[✓] Controller
[✓] Rota
[✓] Validação Zod quando aplicável

[✓] Total de vendas
[✓] Total de compras
[✓] Entradas
[✓] Saídas
[✓] Saldo
[✓] Quantidade de produtos
[✓] Produtos com estoque baixo
[✓] Últimas operações

[✓] servicos/dashboard.ts
[✓] Tipos TypeScript
[✓] Página Dashboard
[✓] Cards de resumo
[✓] Alerta de estoque baixo
[✓] Últimas movimentações
[✓] Atalho Nova Venda
[✓] Atalho Nova Compra

[✓] Loading
[✓] Estado vazio
[✓] Tratamento de erros
[✓] Responsividade
[✓] Acessibilidade

[✓] Testes do endpoint
[✓] Testes de agregação
[✓] Testes de renderização
[✓] Testes de interação
[✓] Testes de regressão
[✓] Lint
[✓] Build
```

---

# 65. VALIDAÇÃO FINAL DE CONSISTÊNCIA

Comparar:

```text
Dashboard
   ↕
Relatórios
   ↕
Módulos de origem
```

Garantir que:

```text
Dashboard Vendas
=
Relatório de Vendas

Dashboard Compras
=
Relatório de Compras

Dashboard Financeiro
=
Financeiro

Dashboard Estoque
=
Estoque
```

Não aceitar divergências de cálculo.

---

# 66. SEGURANÇA FINAL

Garantir:

```text
✓ autenticação obrigatória
✓ validação Zod
✓ Prisma para queries
✓ nenhum SQL inseguro
✓ nenhum dado sensível
✓ nenhum stack trace
✓ nenhum token em logs
```

As regras de segurança do projeto exigem validação de entrada, proteção contra SQL Injection via Prisma, tratamento centralizado de erros e back-end como autoridade final.

---

# 67. RELATÓRIO FINAL DA IMPLEMENTAÇÃO

Ao concluir, apresentar:

```text
1. Resumo da implementação
2. Arquivos criados
3. Arquivos alterados
4. Endpoint implementado
5. Contrato da API
6. Queries utilizadas
7. Estratégia de agregação
8. Indicadores implementados
9. Estratégia de últimas operações
10. Estratégia de estoque crítico
11. Componentes criados
12. Rotas front-end
13. Testes criados
14. Resultado dos testes
15. Resultado do lint
16. Resultado do build
17. Teste manual
18. Problemas encontrados
19. Decisões arquiteturais
20. Pendências
```

---

# 68. PRINCÍPIO FINAL

O Dashboard deve ser uma **visão executiva rápida**, não uma segunda tela de relatórios.

A experiência ideal é:

```text
                    LOGIN
                      ↓
                  DASHBOARD
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
      VENDAS       COMPRAS       FINANCEIRO
        │             │             │
        └─────────────┼─────────────┘
                      ↓
                   ESTOQUE
                      ↓
              ALERTAS + RESUMOS
                      ↓
             ÚLTIMAS OPERAÇÕES
                      ↓
             ATALHOS RÁPIDOS
              ↙             ↘
        NOVA VENDA       NOVA COMPRA
```

O Dashboard deve responder rapidamente às perguntas:

```text
Quanto vendemos?
Quanto compramos?
Quanto entrou?
Quanto saiu?
Qual é o saldo?
Quantos produtos temos?
Quais produtos estão com estoque baixo?
O que aconteceu recentemente?
```

**Não adicionar complexidade além disso nesta feature.**

A Feature 10 deve preparar o sistema para a próxima etapa, que será **Auditoria e Teste de Fluxo Completo Ponta a Ponta**, sem antecipá-la.
