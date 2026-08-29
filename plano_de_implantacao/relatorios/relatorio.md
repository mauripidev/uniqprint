# PROMPT — IMPLEMENTAÇÃO DA FEATURE 9: RELATÓRIOS GERENCIAIS

Você é responsável pela implementação da próxima feature do sistema **Uniqprint — Controle de Compras e Vendas**.

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

A próxima implementação obrigatória é:

> **Feature 9 — Relatórios Gerenciais**

Conforme definido no plano arquitetural, esta feature deverá implementar:

* queries otimizadas com agregações no banco;
* módulo `relatorios`;
* relatório de vendas;
* relatório de compras;
* relatório financeiro;
* filtros por semana;
* filtros por mês;
* filtros por período personalizado;
* filtros por produtos;
* filtros por clientes;
* filtros por fornecedores;
* resumos com totais e médias;
* tabelas detalhadas;
* opção de exportação/impressão;
* testes de agregação e integridade;
* testes dos filtros no front-end.

---

# 1. OBJETIVO

Implementar o módulo de **Relatórios Gerenciais** utilizando exclusivamente os dados já existentes no sistema.

Os relatórios deverão permitir ao usuário analisar:

```text
Vendas
Compras
Financeiro
```

com filtros e agregações executados preferencialmente no banco de dados.

O objetivo não é criar novas regras de negócio para vendas, compras ou financeiro.

O objetivo é:

> **consultar, agregar, filtrar e apresentar os dados existentes de forma gerencial.**

---

# 2. REGRA ARQUITETURAL PRINCIPAL

Seguir obrigatoriamente o padrão de desenvolvimento vertical:

```text
Banco / Prisma
      ↓
Back-end
      ↓
Front-end
      ↓
Testes
```

Uma feature somente poderá ser considerada concluída quando todas essas camadas estiverem implementadas e testadas.

---

# 3. ARQUITETURA DO BACK-END

Respeitar a arquitetura:

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

O relatório não deverá acessar o banco diretamente a partir do controller.

---

# 4. ARQUITETURA DO FRONT-END

Seguir:

```text
Página
  ↓
Hook / Estado
  ↓
Serviço de API
  ↓
Backend REST
```

Não implementar consultas diretamente nos componentes.

Criar:

```text
servicos/relatorios.ts
```

conforme definido no plano.

---

# 5. ANÁLISE OBRIGATÓRIA ANTES DE CODIFICAR

Antes de alterar qualquer arquivo:

1. analisar `implementation_plan.md`;
2. analisar `plan.md`;
3. analisar `.agents/skills/arquitetura/skill.md`;
4. analisar `.agents/skills/back-end/skill.md`;
5. analisar `.agents/skills/front-end/skill.md`;
6. analisar `.agents/rules/arquitetura.md`;
7. analisar `schema.prisma`;
8. analisar tabela/modelo de `vendas`;
9. analisar tabela/modelo de `compras`;
10. analisar `lancamentos_financeiros`;
11. analisar `produtos`;
12. analisar `clientes`;
13. analisar `fornecedores`;
14. analisar serviços existentes;
15. analisar repositories existentes;
16. analisar controllers;
17. analisar rotas;
18. analisar schemas Zod;
19. analisar padrão de paginação;
20. analisar Design System;
21. analisar telas existentes;
22. analisar testes existentes.

**Não criar arquitetura paralela.**

Reutilizar os padrões já estabelecidos nas Features 1–8.

---

# 6. PRINCÍPIO FUNDAMENTAL

Os relatórios deverão ser construídos sobre os dados existentes.

Não duplicar dados apenas para gerar relatórios.

Não criar:

```text
tabela_relatorio_vendas
tabela_relatorio_compras
tabela_relatorio_financeiro
```

sem justificativa arquitetural explícita.

A especificação determina:

> **Queries otimizadas com agregações no banco de dados.**

Portanto, priorizar:

```text
Banco
 ↓
filtros
 ↓
JOINs
 ↓
GROUP BY
 ↓
SUM / AVG / COUNT
 ↓
resultado
```

em vez de:

```text
Banco
 ↓
carregar milhares de registros
 ↓
Node.js
 ↓
filtrar/agregar em memória
```

---

# 7. MÓDULO

Criar:

```text
relatorios
```

O módulo deverá ser independente dos módulos:

```text
vendas
compras
financeiro
```

Ele deverá **consultar** esses dados, não duplicar suas regras de negócio.

---

# 8. ENDPOINTS OBRIGATÓRIOS

Implementar:

```http
GET /api/relatorios/vendas
GET /api/relatorios/compras
GET /api/relatorios/financeiro
```

Essas três rotas são explicitamente definidas na Feature 9.

---

# 9. RELATÓRIO DE VENDAS

Implementar:

```http
GET /api/relatorios/vendas
```

O relatório deverá permitir análise das vendas realizadas.

Informações esperadas:

```text
período
quantidade de vendas
valor total vendido
ticket médio
```

Além disso, disponibilizar dados detalhados suficientes para a tabela do front-end.

---

# 10. FILTROS DO RELATÓRIO DE VENDAS

Implementar filtros por:

```text
semana
mês
período personalizado
produto
cliente
```

Esses filtros fazem parte explicitamente do escopo da Feature 9.

Não filtrar os dados somente no front-end.

---

# 11. PERÍODO — RELATÓRIO DE VENDAS

Oferecer:

```text
Esta semana
Este mês
Período personalizado
```

O período personalizado deverá permitir:

```text
data inicial
data final
```

Validar:

```text
data inicial <= data final
```

---

# 12. RESUMO DE VENDAS

Retornar informações agregadas como:

```text
total de vendas
valor total vendido
ticket médio
```

Conforme o escopo:

> **resumos com totais e médias.**

---

# 13. DETALHAMENTO DE VENDAS

A tabela deverá apresentar informações úteis para análise.

Exemplo conceitual:

```text
Data
Venda
Cliente
Quantidade de itens
Valor total
```

Adaptar aos campos efetivamente existentes no banco.

Não inventar informações que não existam.

---

# 14. RELATÓRIO DE COMPRAS

Implementar:

```http
GET /api/relatorios/compras
```

O relatório deverá permitir analisar as compras realizadas.

Informações esperadas:

```text
quantidade de compras
valor total comprado
média por compra
```

e detalhamento das compras.

---

# 15. FILTROS DO RELATÓRIO DE COMPRAS

Implementar:

```text
semana
mês
período personalizado
produto
fornecedor
```

Esses filtros são definidos no escopo da Feature 9.

---

# 16. RESUMO DE COMPRAS

Apresentar:

```text
Total de compras
Valor total comprado
Média por compra
```

Calcular os valores no banco sempre que possível.

---

# 17. DETALHAMENTO DE COMPRAS

Tabela conceitual:

```text
Data
Compra
Fornecedor
Quantidade de itens
Valor total
```

Utilizar somente informações disponíveis no modelo atual.

---

# 18. RELATÓRIO FINANCEIRO

Implementar:

```http
GET /api/relatorios/financeiro
```

O relatório deverá utilizar os dados do módulo financeiro já implementado.

Não recriar regras de cálculo financeiro.

Utilizar os lançamentos financeiros existentes.

---

# 19. FILTROS DO RELATÓRIO FINANCEIRO

Implementar:

```text
semana
mês
período personalizado
```

Quando compatível com os dados existentes, permitir filtros adicionais relevantes ao financeiro, sem expandir o escopo desnecessariamente.

---

# 20. RESUMO FINANCEIRO

Apresentar:

```text
Total de Entradas
Total de Saídas
Saldo
```

Regra:

```text
Saldo = Total de Entradas - Total de Saídas
```

Esses dados devem ser consistentes com o módulo de Controle Financeiro já implementado.

---

# 21. MÉDIAS FINANCEIRAS

Quando aplicável ao modelo atual, apresentar médias relacionadas ao período.

Exemplo:

```text
Média de entradas
Média de saídas
```

Não criar indicadores financeiros que não tenham significado claro para os dados disponíveis.

---

# 22. DETALHAMENTO FINANCEIRO

Tabela conceitual:

```text
Data
Descrição
Categoria
Tipo
Valor
Origem
```

Reutilizar os dados do módulo financeiro.

---

# 23. FILTROS DINÂMICOS

No front-end, os filtros deverão ser dinâmicos conforme o relatório selecionado.

Exemplo:

### Vendas

```text
Período
Produto
Cliente
```

### Compras

```text
Período
Produto
Fornecedor
```

### Financeiro

```text
Período
```

Os filtros deverão ser enviados à API.

Não fazer filtragem somente em memória.

---

# 24. INTERFACE DE RELATÓRIOS

Criar uma área:

```text
Relatórios
```

Com navegação clara entre:

```text
Relatório de Vendas
Relatório de Compras
Relatório Financeiro
```

Pode ser implementado utilizando:

```text
tabs
submenus
cards
ou rotas independentes
```

desde que siga o padrão visual existente.

---

# 25. RELATÓRIO DE VENDAS — FRONT-END

Criar página:

```text
Relatório de Vendas
```

Estrutura sugerida:

```text
Relatório de Vendas

Período
[Esta semana ▼]

Produto
[Todos ▼]

Cliente
[Todos ▼]

[Aplicar filtros]

------------------------------------

Total de vendas
R$ XX.XXX,XX

Ticket médio
R$ XXX,XX

Quantidade de vendas
XXX

------------------------------------

Tabela de vendas
```

---

# 26. RELATÓRIO DE COMPRAS — FRONT-END

Criar:

```text
Relatório de Compras
```

Estrutura:

```text
Período
[Este mês ▼]

Produto
[Todos ▼]

Fornecedor
[Todos ▼]

[Aplicar filtros]

------------------------------------

Total de compras
R$ XX.XXX,XX

Média por compra
R$ XXX,XX

Quantidade de compras
XXX

------------------------------------

Tabela de compras
```

---

# 27. RELATÓRIO FINANCEIRO — FRONT-END

Criar:

```text
Relatório Financeiro
```

Estrutura:

```text
Período
[Este mês ▼]

[Aplicar filtros]

------------------------------------

Total de Entradas
R$ XX.XXX,XX

Total de Saídas
R$ XX.XXX,XX

Saldo
R$ XX.XXX,XX

------------------------------------

Tabela financeira
```

---

# 28. PERÍODO PERSONALIZADO

Quando selecionado:

```text
Período personalizado
```

mostrar:

```text
Data inicial
[__/__/____]

Data final
[__/__/____]
```

Validar antes de consultar a API.

---

# 29. FEEDBACK DE FILTROS

Ao aplicar filtros:

```text
Carregando relatório...
```

Após sucesso:

```text
Relatório atualizado.
```

Em caso de erro:

```text
Não foi possível carregar o relatório.
```

---

# 30. ESTADO VAZIO

Quando nenhum dado for encontrado:

```text
Nenhum registro encontrado para os filtros selecionados.
```

Não apresentar tabela vazia sem explicação.

---

# 31. EXPORTAÇÃO / IMPRESSÃO

A Feature 9 prevê:

> **opção de exportação/impressão.**

Implementar uma solução simples e compatível com a aplicação.

Priorizar inicialmente:

```text
Imprimir relatório
```

utilizando uma versão adequada para impressão.

Se já existir infraestrutura de exportação, reutilizá-la.

Não criar uma biblioteca pesada apenas para exportação sem necessidade.

---

# 32. IMPRESSÃO

Criar visual específico para:

```text
window.print()
```

ou mecanismo equivalente.

Na impressão:

ocultar:

```text
menu
botões
filtros interativos
elementos desnecessários
```

e apresentar:

```text
título
período
filtros utilizados
resumo
tabela
data de geração
```

---

# 33. EXPORTAÇÃO

Se houver exportação estruturada já prevista no projeto, reutilizar.

Caso seja implementada exportação nesta feature, priorizar formato simples e apropriado ao MVP.

Não antecipar:

```text
PDF complexo
Excel avançado
integrações externas
```

sem necessidade arquitetural.

---

# 34. SERVIÇO FRONT-END

Criar:

```text
servicos/relatorios.ts
```

com métodos equivalentes a:

```text
obterRelatorioVendas()
obterRelatorioCompras()
obterRelatorioFinanceiro()
```

Adicionar tipos TypeScript correspondentes.

---

# 35. TIPOS TYPESCRIPT

Criar tipos específicos:

```text
RelatorioVendas
RelatorioCompras
RelatorioFinanceiro
```

e os tipos necessários para:

```text
resumo
filtros
detalhamento
```

Os tipos devem refletir exatamente os contratos da API.

---

# 36. ZOD

Criar schemas Zod para os parâmetros das três APIs.

Validar:

```text
datas
produto
cliente
fornecedor
período
```

conforme os campos realmente existentes.

A validação deverá ocorrer no back-end.

---

# 37. SEGURANÇA

Utilizar a autenticação existente.

Utilizar o mecanismo de autorização existente.

Não criar nova autenticação.

Não confiar nos filtros enviados pelo front-end.

Validar todos os parâmetros no back-end.

O plano determina validação de 100% dos dados de entrada com Zod e o back-end como autoridade final.

---

# 38. PERFORMANCE

Os relatórios deverão utilizar agregações no banco.

Priorizar:

```text
SUM
AVG
COUNT
GROUP BY
JOIN
WHERE
```

quando aplicável.

Não buscar todos os registros para realizar agregações em JavaScript.

---

# 39. ÍNDICES

Analisar as consultas geradas pelos relatórios.

Verificar necessidade de índices em campos utilizados frequentemente em:

```text
WHERE
JOIN
ORDER BY
GROUP BY
```

Não criar índices indiscriminadamente.

---

# 40. PAGINAÇÃO

Relatórios agregados devem retornar somente os dados necessários.

Para tabelas detalhadas extensas, utilizar o padrão de paginação já existente no projeto, caso aplicável.

Não carregar milhares de registros no navegador sem necessidade.

---

# 41. CONSISTÊNCIA COM VENDAS

Validar:

```text
Relatório de Vendas
=
dados reais de vendas
```

Não alterar o cálculo original da venda.

O relatório apenas consulta e agrega.

---

# 42. CONSISTÊNCIA COM COMPRAS

Validar:

```text
Relatório de Compras
=
dados reais de compras
```

Não alterar regras de estoque ou financeiro.

---

# 43. CONSISTÊNCIA COM FINANCEIRO

Validar:

```text
Relatório Financeiro
=
lancamentos_financeiros
```

O total de entradas, saídas e saldo deve ser consistente com o módulo financeiro.

---

# 44. NÃO DUPLICAR REGRAS

Não implementar novamente:

```text
registro de venda
registro de compra
controle de estoque
lançamento financeiro
```

Os relatórios deverão consultar os módulos existentes.

---

# 45. TESTES — VENDAS

Criar testes para:

```text
✓ relatório sem filtros
✓ filtro por semana
✓ filtro por mês
✓ período personalizado
✓ filtro por produto
✓ filtro por cliente
✓ cálculo do total
✓ cálculo da média
✓ quantidade de vendas
✓ detalhamento
```

---

# 46. TESTES — COMPRAS

Criar:

```text
✓ relatório sem filtros
✓ filtro por semana
✓ filtro por mês
✓ período personalizado
✓ filtro por produto
✓ filtro por fornecedor
✓ cálculo do total
✓ cálculo da média
✓ quantidade de compras
✓ detalhamento
```

---

# 47. TESTES — FINANCEIRO

Criar:

```text
✓ relatório sem filtros
✓ filtro por semana
✓ filtro por mês
✓ período personalizado
✓ total de entradas
✓ total de saídas
✓ cálculo do saldo
✓ detalhamento
```

---

# 48. TESTES DE AGREGAÇÃO

Criar dados controlados.

Exemplo:

```text
Venda 1 = R$ 100
Venda 2 = R$ 200
Venda 3 = R$ 300
```

Validar:

```text
Total = R$ 600
Média = R$ 200
Quantidade = 3
```

O mesmo princípio deverá ser aplicado a compras e financeiro.

---

# 49. TESTES DE FILTRO POR DATA

Criar registros:

```text
01/08
10/08
20/08
31/08
01/09
```

Consultar:

```text
01/08 → 31/08
```

Garantir que:

```text
01/09
```

não apareça.

---

# 50. TESTE DE FILTRO POR PRODUTO

Criar operações envolvendo:

```text
Produto A
Produto B
```

Filtrar:

```text
Produto A
```

Garantir que somente os dados correspondentes sejam considerados.

---

# 51. TESTE DE FILTRO POR CLIENTE

Criar vendas:

```text
Cliente A
Cliente B
```

Filtrar:

```text
Cliente A
```

Garantir que somente vendas do Cliente A sejam retornadas/agregadas.

---

# 52. TESTE DE FILTRO POR FORNECEDOR

Criar compras:

```text
Fornecedor A
Fornecedor B
```

Filtrar:

```text
Fornecedor A
```

Garantir que somente compras do fornecedor selecionado sejam consideradas.

---

# 53. TESTE DE CONSISTÊNCIA FINANCEIRA

Criar:

```text
Entrada = 1.000
Entrada = 500
Saída = 300
```

Validar:

```text
Total Entradas = 1.500
Total Saídas = 300
Saldo = 1.200
```

O resultado deve ser consistente com o módulo financeiro.

---

# 54. TESTES FRONT-END

Testar:

```text
✓ renderização do relatório
✓ filtros
✓ período personalizado
✓ aplicação dos filtros
✓ loading
✓ estado vazio
✓ mensagens de erro
✓ cards de resumo
✓ tabela
✓ impressão
```

---

# 55. TESTES DE REGRESSÃO

Depois da implementação:

```text
npm run test
```

ou o comando equivalente existente no projeto.

Garantir que as Features 1–8 continuem funcionando.

Especialmente:

```text
Autenticação
Produtos
Fornecedores
Clientes
Compras
Vendas
Estoque
Financeiro
```

---

# 56. RESPONSIVIDADE

Testar:

```text
Desktop
Tablet
Mobile
```

As tabelas de relatório devem possuir comportamento adequado em telas pequenas.

Não permitir que a interface fique inutilizável por excesso de colunas.

---

# 57. ACESSIBILIDADE

Garantir:

```text
labels
foco de teclado
botões identificáveis
contraste adequado
mensagens compreensíveis
```

Não depender exclusivamente de cor para comunicar informações.

---

# 58. TRATAMENTO DE ERROS

Nunca expor:

```text
SQL
stack trace
detalhes internos
estrutura do banco
```

Utilizar o tratamento centralizado existente.

O plano determina explicitamente que informações internas não sejam expostas nas respostas da API.

---

# 59. NÃO IMPLEMENTAR NESTA FEATURE

Não antecipar as próximas etapas.

Não implementar:

```text
❌ Dashboard Consolidado
❌ Auditoria
❌ Fluxo E2E completo
❌ Importação XML
❌ Aplicativo Android
```

A próxima feature será:

> **Feature 10 — Dashboard Consolidado**

que possui endpoint próprio `/api/dashboard/resumo` e tela inicial pós-login.

---

# 60. NÃO MODIFICAR FEATURES ANTERIORES

Não modificar desnecessariamente:

```text
Autenticação
Produtos
Fornecedores
Clientes
Compras
Vendas
Estoque
Financeiro
```

Caso seja indispensável alterar algum módulo:

1. documentar o motivo;
2. fazer a menor alteração possível;
3. executar os testes desse módulo;
4. executar a suíte completa.

---

# 61. ORDEM DE IMPLEMENTAÇÃO

Executar nesta ordem:

## ETAPA 1 — ANÁLISE

Mapear:

```text
Vendas
Compras
Financeiro
Produtos
Clientes
Fornecedores
```

---

## ETAPA 2 — CONSULTAS

Definir as queries necessárias.

Priorizar:

```text
filtros no banco
agregações no banco
JOINs no banco
```

---

## ETAPA 3 — REPOSITORIES

Criar os métodos necessários para:

```text
relatório de vendas
relatório de compras
relatório financeiro
```

---

## ETAPA 4 — SERVICES

Criar:

```text
obterRelatorioVendas()
obterRelatorioCompras()
obterRelatorioFinanceiro()
```

adaptando aos padrões reais do projeto.

---

## ETAPA 5 — VALIDAÇÃO

Criar schemas Zod para:

```text
filtros
datas
identificadores
paginação
```

---

## ETAPA 6 — CONTROLLERS

Implementar os controllers das três APIs.

---

## ETAPA 7 — ROTAS

Registrar:

```http
GET /api/relatorios/vendas
GET /api/relatorios/compras
GET /api/relatorios/financeiro
```

---

## ETAPA 8 — FRONT-END

Criar:

```text
servicos/relatorios.ts
tipos
Relatório de Vendas
Relatório de Compras
Relatório Financeiro
```

---

## ETAPA 9 — FILTROS

Implementar:

```text
semana
mês
período personalizado
produto
cliente
fornecedor
```

conforme o relatório.

---

## ETAPA 10 — RESUMOS

Implementar:

```text
totais
médias
quantidades
saldo
```

conforme aplicável.

---

## ETAPA 11 — TABELAS

Implementar detalhamento dos dados.

---

## ETAPA 12 — IMPRESSÃO / EXPORTAÇÃO

Implementar a funcionalidade prevista pela Feature 9.

---

## ETAPA 13 — TESTES

Executar testes:

```text
unitários
integração
agregação
filtros
front-end
```

---

## ETAPA 14 — VALIDAÇÃO FINAL

Executar:

```text
lint
testes
build
```

e testar manualmente no navegador.

---

# 62. TESTE MANUAL COMPLETO

Executar o seguinte roteiro:

```text
1. Fazer login
2. Abrir Relatórios
3. Abrir Relatório de Vendas
4. Consultar sem filtros
5. Filtrar por semana
6. Filtrar por mês
7. Utilizar período personalizado
8. Filtrar por produto
9. Filtrar por cliente
10. Conferir totais
11. Conferir média
12. Conferir tabela
13. Imprimir relatório

14. Abrir Relatório de Compras
15. Consultar sem filtros
16. Filtrar por semana
17. Filtrar por mês
18. Utilizar período personalizado
19. Filtrar por produto
20. Filtrar por fornecedor
21. Conferir totais
22. Conferir média
23. Conferir tabela
24. Imprimir relatório

25. Abrir Relatório Financeiro
26. Consultar sem filtros
27. Filtrar por semana
28. Filtrar por mês
29. Utilizar período personalizado
30. Conferir entradas
31. Conferir saídas
32. Conferir saldo
33. Conferir tabela
34. Imprimir relatório

35. Testar estado vazio
36. Testar erro de API
37. Testar loading
38. Testar mobile
39. Testar tablet
40. Testar desktop
```

---

# 63. CRITÉRIOS DE ACEITE

A Feature 9 somente poderá ser considerada concluída quando:

```text
[✓] Módulo relatorios
[✓] Repository de relatórios
[✓] Services
[✓] Controllers
[✓] Schemas Zod
[✓] Rotas
[✓] GET /api/relatorios/vendas
[✓] GET /api/relatorios/compras
[✓] GET /api/relatorios/financeiro

[✓] Filtro semanal
[✓] Filtro mensal
[✓] Período personalizado
[✓] Filtro por produto
[✓] Filtro por cliente
[✓] Filtro por fornecedor

[✓] Agregações no banco
[✓] Totais
[✓] Médias
[✓] Quantidades
[✓] Saldo financeiro
[✓] Tabelas detalhadas

[✓] servicos/relatorios.ts
[✓] Tipos TypeScript
[✓] Tela de Relatório de Vendas
[✓] Tela de Relatório de Compras
[✓] Tela de Relatório Financeiro
[✓] Filtros dinâmicos
[✓] Loading
[✓] Estado vazio
[✓] Tratamento de erros
[✓] Impressão/exportação

[✓] Testes de agregação
[✓] Testes de integridade
[✓] Testes de filtros
[✓] Testes front-end
[✓] Testes de regressão
[✓] Lint
[✓] Build
```

---

# 64. VALIDAÇÃO DE INTEGRIDADE

Validar especialmente:

```text
Vendas
   ↓
Relatório de Vendas

Compras
   ↓
Relatório de Compras

Financeiro
   ↓
Relatório Financeiro
```

E o fluxo geral:

```text
Compra
   ↓
Estoque
   ↓
Financeiro
   ↓
Relatório de Compras
   ↓
Relatório Financeiro
```

e:

```text
Venda
   ↓
Estoque
   ↓
Financeiro
   ↓
Relatório de Vendas
   ↓
Relatório Financeiro
```

---

# 65. REGRA DE CONSISTÊNCIA

O relatório nunca deverá apresentar valores incompatíveis com os módulos de origem.

Por exemplo:

```text
Total do Relatório de Vendas
=
soma das vendas consideradas pelo filtro
```

```text
Total do Relatório de Compras
=
soma das compras consideradas pelo filtro
```

```text
Saldo do Relatório Financeiro
=
Entradas - Saídas
```

---

# 66. RELATÓRIO FINAL DA IMPLEMENTAÇÃO

Ao terminar, apresentar obrigatoriamente:

```text
1. Resumo da implementação
2. Arquivos criados
3. Arquivos alterados
4. Queries criadas
5. Índices criados/alterados
6. Endpoints implementados
7. Parâmetros de cada endpoint
8. Estrutura dos retornos
9. Filtros disponíveis
10. Estratégia de agregação
11. Estratégia de paginação
12. Estratégia de impressão/exportação
13. Componentes front-end
14. Testes criados
15. Resultado dos testes
16. Resultado do lint
17. Resultado do build
18. Teste manual realizado
19. Problemas encontrados
20. Decisões arquiteturais
21. Pendências
```

---

# 67. PRINCÍPIO FINAL

Esta implementação deve transformar os dados operacionais existentes em informações gerenciais:

```text
                 RELATÓRIOS
                     │
       ┌─────────────┼─────────────┐
       │             │             │
     VENDAS        COMPRAS      FINANCEIRO
       │             │             │
       ↓             ↓             ↓
   Agregações     Agregações    Agregações
       │             │             │
       └─────────────┼─────────────┘
                     ↓
              RESUMOS + TABELAS
                     ↓
             FILTROS GERENCIAIS
                     ↓
              IMPRESSÃO/EXPORTAÇÃO
```

A Feature 9 deve permanecer focada exclusivamente em **Relatórios Gerenciais**.

Não implementar o Dashboard nesta etapa.

A próxima etapa do roadmap será a **Feature 10 — Dashboard Consolidado**, que utilizará os dados de vendas, compras, financeiro e estoque para apresentar KPIs e últimas operações.
