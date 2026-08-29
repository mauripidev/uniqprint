# PROMPT — IMPLEMENTAÇÃO DA FEATURE 5: REGISTRO DE COMPRAS E ENTRADA DE ESTOQUE

Você é responsável pela implementação da próxima feature do sistema **Uniqprint — Controle de Compras e Vendas**.

## CONTEXTO

As seguintes features já foram implementadas:

* Feature 0 — Fundação e Infraestrutura
* Feature 1 — Autenticação e Gestão de Usuários
* Feature 2 — Cadastro e Gestão de Produtos
* Feature 3 — Cadastro e Gestão de Fornecedores
* Feature 4 — Cadastro e Gestão de Clientes

A implementação de **Clientes está concluída**.

A próxima implementação obrigatória, seguindo o roadmap e a arquitetura definida no projeto, é:

> **Feature 5 — Registro de Compras e Entrada de Estoque**

Esta feature é diferente das anteriores porque representa a primeira operação comercial transacional do sistema.

O registro de uma compra deverá realizar, de forma **atômica**:

```text
Compra
   +
Entrada no estoque
   +
Movimentação de estoque
   +
Saída financeira
```

Se qualquer uma dessas operações falhar, **toda a transação deverá ser desfeita**.

---

# 1. OBJETIVO

Implementar completamente o módulo de **Compras**, permitindo:

* registrar uma compra;
* selecionar fornecedor;
* selecionar produto;
* informar quantidade;
* informar valor unitário;
* calcular valor total;
* validar fornecedor ativo;
* validar produto ativo;
* incrementar estoque;
* registrar movimentação de estoque;
* registrar saída financeira;
* listar compras;
* paginar compras;
* filtrar compras;
* consultar informações da compra;
* garantir integridade transacional;
* utilizar autenticação existente;
* respeitar autorização existente.

A Feature 5 deverá preparar a base para as futuras features de:

```text
Vendas
Estoque
Financeiro
Relatórios
Dashboard
```

**Não implementar essas features agora.**

---

# 2. ARQUITETURA OBRIGATÓRIA

A arquitetura do projeto utiliza **Desenvolvimento Vertical por Feature**.

Portanto, não implementar apenas a API.

A feature deverá contemplar:

```text
Banco / Prisma
      ↓
Back-end
      ↓
Front-end
      ↓
Testes
```

A especificação determina que cada feature deve possuir Banco, Back-end, Front-end e Testes Automatizados.

---

# 3. CAMADAS DO BACK-END

Respeitar obrigatoriamente:

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

A transação de compra deve ser responsabilidade do **serviço/caso de uso**, e não da rota ou do front-end.

O front-end nunca poderá ser responsável por garantir a consistência da operação.

---

# 4. REGRA MAIS IMPORTANTE — TRANSAÇÃO ATÔMICA

O método principal da feature deverá ser equivalente a:

```text
registrarCompra()
```

A operação deverá ser executada dentro de uma única transação de banco.

Fluxo:

```text
registrarCompra()
       ↓
Validar fornecedor
       ↓
Validar produto
       ↓
Validar quantidade
       ↓
Validar valor unitário
       ↓
Calcular valor_total
       ↓
Criar compra
       ↓
Incrementar estoque
       ↓
Criar movimentação de estoque ENTRADA
       ↓
Criar lançamento financeiro SAIDA
       ↓
Commit
```

Se ocorrer qualquer erro:

```text
Rollback
```

Nenhuma parte da operação poderá permanecer parcialmente gravada.

---

# 5. EXEMPLO DE FALHA QUE NÃO PODE OCORRER

Nunca permitir:

```text
Compra criada
     ↓
Estoque atualizado
     ↓
Erro ao criar financeiro
     ↓
Compra permanece criada
     ↓
❌ ESTADO INCONSISTENTE
```

O comportamento correto é:

```text
Compra
Estoque
Movimentação
Financeiro

      ↓

Se qualquer etapa falhar

      ↓

ROLLBACK DE TODA A OPERAÇÃO
```

---

# 6. ANÁLISE OBRIGATÓRIA ANTES DE CODIFICAR

Antes de alterar qualquer arquivo:

1. analisar estrutura atual do projeto;
2. analisar Produtos;
3. analisar Fornecedores;
4. analisar Clientes;
5. analisar autenticação;
6. analisar autorização;
7. analisar padrão de repositories;
8. analisar padrão de services;
9. analisar padrão de controllers;
10. analisar padrão de rotas;
11. analisar schemas Zod;
12. analisar tratamento de erros;
13. analisar padrão de transações Prisma;
14. analisar padrão de testes;
15. analisar componentes de formulário;
16. analisar componentes de tabela;
17. analisar serviço de API;
18. analisar Design System.

**Não criar uma arquitetura paralela.**

Utilizar os padrões já estabelecidos.

---

# 7. NOMENCLATURA

Todo o domínio deve utilizar nomenclatura em PT-BR.

Exemplos:

```text
compra
data_compra
produto_id
quantidade
valor_unitario
valor_total
fornecedor_id
criado_em
atualizado_em
```

Métodos:

```text
registrarCompra()
listarCompras()
buscarCompraPorId()
calcularValorTotal()
```

Não utilizar:

```text
purchase
purchaseDate
productId
quantity
unitPrice
totalValue
supplierId
createPurchase()
```

A regra de nomenclatura PT-BR é obrigatória no projeto.

---

# 8. BANCO DE DADOS

Criar o modelo:

```text
compras
```

A estrutura prevista é:

```text
id
data_compra
produto_id
quantidade
valor_unitario
valor_total
fornecedor_id
criado_em
atualizado_em
```

O plano de banco define essa estrutura explicitamente.

---

# 9. RELACIONAMENTOS

A compra deverá possuir referência para:

```text
produto
fornecedor
```

Conceitualmente:

```text
compras
   │
   ├── produto_id → produtos.id
   │
   └── fornecedor_id → fornecedores.id
```

Não duplicar dados do produto ou fornecedor dentro da compra.

Utilizar os relacionamentos definidos pelo banco.

---

# 10. TIPOS MONETÁRIOS

Os valores monetários deverão utilizar o padrão definido no projeto:

```text
Decimal(15, 2)
```

Isso se aplica a:

```text
valor_unitario
valor_total
```

O documento determina explicitamente `Decimal(15, 2)` para valores monetários.

**Não utilizar `float` para representar valores monetários no banco.**

Evitar erros de precisão.

---

# 11. MIGRATION

Antes de criar a migration:

1. verificar `schema.prisma`;
2. verificar migrations existentes;
3. verificar modelos Produtos;
4. verificar Fornecedores;
5. verificar Clientes;
6. verificar se alguma estrutura de estoque já existe;
7. verificar se existe estrutura financeira necessária.

Criar apenas as alterações necessárias.

Não destruir dados.

Não recriar tabelas existentes.

---

# 12. MOVIMENTAÇÃO DE ESTOQUE

A Feature 5 também deverá utilizar a tabela:

```text
movimentacoes_estoque
```

O modelo previsto é:

```text
id
produto_id
tipo
quantidade
tipo_referencia
referencia_id
criado_em
```

Para uma compra:

```text
tipo = ENTRADA
```

A movimentação deverá apontar para a compra através dos campos de referência disponíveis.

---

# 13. LANÇAMENTO FINANCEIRO

O registro da compra também deverá criar um lançamento financeiro.

Para uma compra:

```text
tipo = SAIDA
```

A Feature 5 define explicitamente que uma compra gera uma saída financeira.

Utilizar a estrutura financeira prevista pelo projeto:

```text
lancamentos_financeiros
```

Não criar uma tabela financeira paralela.

---

# 14. ATENÇÃO — NÃO IMPLEMENTAR O MÓDULO FINANCEIRO

Nesta feature:

> apenas criar o lançamento financeiro necessário para a compra.

Não implementar ainda:

```text
❌ Tela Financeiro
❌ Extrato financeiro
❌ Saldo consolidado
❌ Categorias completas
❌ CRUD financeiro manual
```

Essas responsabilidades pertencem à Feature 8.

---

# 15. BACK-END

Criar:

```text
backend/src/modulos/compras/
```

Seguir o padrão utilizado pelos módulos existentes.

Exemplo:

```text
compras/
├── controladores/
├── servicos/
├── repositorios/
├── schemas/
├── tipos/
└── rotas/
```

Adaptar à estrutura real do projeto.

---

# 16. SERVIÇO PRINCIPAL

Implementar:

```text
registrarCompra()
```

Esse serviço deve:

1. validar entrada;
2. validar fornecedor;
3. validar produto;
4. verificar se estão ativos;
5. validar quantidade;
6. validar valor unitário;
7. calcular `valor_total`;
8. iniciar transação;
9. criar compra;
10. incrementar estoque;
11. registrar movimentação `ENTRADA`;
12. criar lançamento financeiro `SAIDA`;
13. concluir transação.

---

# 17. VALIDAÇÃO DE FORNECEDOR

Antes de registrar a compra:

```text
fornecedor existe?
        ↓
       SIM
        ↓
está ativo?
        ↓
       SIM
        ↓
prosseguir
```

Se:

```text
fornecedor inexistente
```

retornar erro apropriado.

Se:

```text
fornecedor inativo
```

impedir a compra.

A especificação determina explicitamente a validação de fornecedor ativo.

---

# 18. VALIDAÇÃO DE PRODUTO

Antes de registrar a compra:

```text
produto existe?
        ↓
       SIM
        ↓
está ativo?
        ↓
       SIM
        ↓
prosseguir
```

Produto inativo não poderá receber nova compra.

A especificação determina a validação de produto ativo.

---

# 19. VALIDAÇÃO DE QUANTIDADE

A quantidade deve:

* ser obrigatória;
* ser numérica;
* ser inteira;
* ser maior que zero.

Não aceitar:

```text
0
-1
-10
1.5
null
```

Utilizar Zod para validação da entrada.

---

# 20. VALIDAÇÃO DE VALOR UNITÁRIO

O valor unitário deve:

* ser obrigatório;
* ser numérico;
* ser maior que zero;
* respeitar precisão monetária.

Não aceitar:

```text
0
-10
null
NaN
```

Utilizar Decimal no processamento do back-end.

---

# 21. CÁLCULO DO VALOR TOTAL

O valor total deverá ser calculado no back-end.

Regra:

```text
valor_total =
quantidade × valor_unitario
```

Exemplo:

```text
Quantidade: 10
Valor unitário: R$ 25,50

Valor total:
10 × 25,50 = R$ 255,00
```

O front-end pode apresentar uma prévia do cálculo, mas:

> o valor oficial deve ser calculado pelo back-end.

Nunca confiar no `valor_total` enviado pelo cliente.

Preferencialmente, o payload de criação não deve permitir que o front-end determine o valor final.

---

# 22. PAYLOAD

Utilizar estrutura equivalente a:

```json
{
  "data_compra": "2026-08-29",
  "produto_id": 1,
  "quantidade": 10,
  "valor_unitario": 25.50,
  "fornecedor_id": 2
}
```

O `valor_total` deve ser calculado pelo back-end.

Se a API já possuir convenção diferente de datas ou valores, seguir a convenção existente.

---

# 23. ENDPOINT DE CRIAÇÃO

Implementar:

```http
POST /api/compras
```

Esse endpoint deverá chamar:

```text
registrarCompra()
```

Não colocar a transação diretamente na rota.

---

# 24. ENDPOINT DE LISTAGEM

Implementar:

```http
GET /api/compras
```

Com:

* paginação;
* filtros;
* ordenação adequada;
* possibilidade de filtragem por período;
* informações relevantes de produto;
* informações relevantes de fornecedor.

A Feature 5 exige listagem paginada e filtros.

---

# 25. PAGINAÇÃO

Seguir o padrão já existente:

```text
?page=1&limite=20
```

ou a convenção já utilizada no projeto.

Não criar um padrão diferente.

Resposta deve seguir o padrão de paginação já existente.

---

# 26. FILTROS

Implementar filtros necessários para a listagem de compras.

No mínimo considerar:

```text
período
fornecedor
produto
```

A especificação do front-end determina listagem de compras com filtros por período.

Não criar filtros que exijam funcionalidades ainda não previstas sem necessidade.

---

# 27. CONSULTA DE COMPRA

Caso o padrão existente de CRUD utilize consulta individual, implementar:

```http
GET /api/compras/:id
```

Se a especificação atual não exigir esse endpoint explicitamente, verificar a arquitetura existente antes de adicioná-lo.

Não criar APIs desnecessárias.

---

# 28. ESTOQUE — INCREMENTO

Após criar a compra, incrementar:

```text
produtos.quantidade_estoque
```

Exemplo:

```text
Estoque atual: 20
Compra: 5
Novo estoque: 25
```

Essa operação deve ocorrer dentro da mesma transação.

A Feature 5 determina explicitamente o incremento do estoque.

---

# 29. CONCORRÊNCIA

O incremento de estoque deve ser realizado de maneira segura.

Evitar padrão inseguro:

```text
SELECT estoque
↓
calcula no código
↓
UPDATE estoque
```

quando isso puder gerar perda de atualização em concorrência.

Utilizar os mecanismos transacionais/atômicos adequados ao Prisma e ao banco.

A arquitetura determina integridade e tratamento adequado de concorrência para operações de estoque.

---

# 30. MOVIMENTAÇÃO DE ESTOQUE

Para cada compra registrada, criar:

```text
movimentacoes_estoque
```

Com:

```text
tipo = ENTRADA
quantidade = quantidade da compra
produto_id = produto comprado
```

E utilizar:

```text
tipo_referencia
referencia_id
```

para identificar a origem da movimentação.

Não criar movimentação sem compra correspondente.

Não criar compra sem movimentação correspondente.

---

# 31. FINANCEIRO

Para cada compra registrada, criar:

```text
lancamentos_financeiros
```

Com:

```text
tipo = SAIDA
valor = valor_total
```

Associar a origem da operação utilizando:

```text
tipo_referencia
referencia_id
```

quando esse padrão estiver definido no modelo.

---

# 32. CONSISTÊNCIA TRANSACIONAL

Garantir:

```text
Compra criada
        +
Estoque incrementado
        +
Movimentação ENTRADA criada
        +
Financeiro SAIDA criado
```

Tudo em uma única transação.

Teste obrigatório:

```text
forçar erro no lançamento financeiro
        ↓
verificar rollback da compra
        ↓
verificar rollback do estoque
        ↓
verificar rollback da movimentação
```

Nenhum registro parcial poderá permanecer.

---

# 33. FRONT-END

Criar:

```text
frontend/src/servicos/compras.ts
```

Criar o tipo:

```text
Compra
```

E implementar a página de:

```text
Registro de Compras
```

A especificação determina explicitamente serviço, tipos, tela de registro e listagem.

---

# 34. TELA DE REGISTRO DE COMPRAS

Criar uma tela clara para registrar uma compra.

Estrutura sugerida:

```text
Nova Compra

Fornecedor *
[ Selecionar fornecedor ]

Produto *
[ Selecionar produto ]

Quantidade *
[       ]

Valor unitário *
[ R$       ]

Valor total
[ R$ 0,00 ]

[ Cancelar ] [ Registrar compra ]
```

---

# 35. SELEÇÃO DE FORNECEDOR

Utilizar seleção dinâmica.

Somente fornecedores ativos devem ser apresentados para uma nova compra.

A seleção deve utilizar a API existente:

```text
/api/fornecedores
```

Não duplicar a lógica de fornecedores no módulo de compras.

---

# 36. SELEÇÃO DE PRODUTO

Utilizar seleção dinâmica.

Somente produtos ativos devem ser apresentados.

Utilizar:

```text
/api/produtos
```

Não duplicar cadastro de produtos dentro de Compras.

---

# 37. PRÉVIA DO VALOR TOTAL

Enquanto o usuário preencher:

```text
quantidade
valor_unitario
```

mostrar:

```text
Valor total
```

calculado no front-end para feedback imediato.

Porém:

> esse cálculo é apenas uma prévia.

O back-end deverá recalcular o valor oficial.

---

# 38. FEEDBACK DA OPERAÇÃO

Durante o envio:

```text
Registrando compra...
```

Após sucesso:

```text
Compra registrada com sucesso.
Estoque atualizado.
```

Não afirmar algo que a API não tenha confirmado.

---

# 39. ERROS DE NEGÓCIO

Tratar amigavelmente:

```text
Fornecedor inativo
Produto inativo
Produto não encontrado
Fornecedor não encontrado
Quantidade inválida
Valor unitário inválido
Erro ao registrar compra
```

Se ocorrer erro transacional:

```text
Não foi possível registrar a compra. Nenhuma alteração foi realizada.
```

O objetivo é deixar claro ao usuário que a operação foi revertida.

---

# 40. LISTAGEM DE COMPRAS

Criar uma seção/página para consultar compras realizadas.

Exibir:

```text
Data
Fornecedor
Produto
Quantidade
Valor unitário
Valor total
```

Adicionar:

```text
paginação
filtros
```

---

# 41. FILTRO POR PERÍODO

Disponibilizar:

```text
Data inicial
Data final
```

Exemplo:

```text
01/08/2026 → 31/08/2026
```

Consultar os dados no back-end.

Não carregar todas as compras para filtrar no React.

---

# 42. UX

A interface deverá possuir:

* carregamento;
* feedback de sucesso;
* feedback de erro;
* validação;
* estado vazio;
* confirmação quando necessário;
* formulário claro;
* prevenção de múltiplos submits;
* responsividade;
* mensagens amigáveis.

---

# 43. RESPONSIVIDADE

Validar:

```text
Desktop
Tablet
Mobile
```

O formulário deve permanecer utilizável em telas menores.

A tabela de compras deve possuir comportamento adequado para telas estreitas.

---

# 44. AUTENTICAÇÃO

Utilizar exclusivamente o sistema de autenticação já existente.

Não criar:

```text
novo login
novo token
novo middleware
nova sessão
```

---

# 45. AUTORIZAÇÃO

Utilizar o mecanismo de autorização já existente.

A autorização deverá ser validada no back-end.

Não confiar somente na interface.

Não criar novos níveis de acesso sem definição no projeto.

---

# 46. ZOD

Criar schemas para:

```text
criação da compra
parâmetros de consulta
filtros
parâmetros de rota
```

Validar:

```text
produto_id
fornecedor_id
quantidade
valor_unitario
data_compra
```

---

# 47. TESTES BACK-END

Criar testes unitários e de integração.

## Compra válida

Testar:

```text
✓ fornecedor ativo
✓ produto ativo
✓ quantidade válida
✓ valor válido
✓ compra criada
✓ valor_total calculado
✓ estoque incrementado
✓ movimentação ENTRADA criada
✓ lançamento financeiro SAIDA criado
```

---

# 48. TESTE DE ATOMICIDADE

Este é um teste obrigatório.

Simular falha em uma das etapas posteriores.

Exemplo:

```text
Compra
 ↓
Estoque
 ↓
Movimentação
 ↓
ERRO NO FINANCEIRO
```

Verificar:

```text
✓ compra não existe
✓ estoque voltou ao valor anterior
✓ movimentação não existe
✓ lançamento financeiro não existe
```

Esse teste é essencial para comprovar a transação atômica.

---

# 49. TESTES DE VALIDAÇÃO

Testar:

```text
✓ fornecedor inexistente
✓ fornecedor inativo
✓ produto inexistente
✓ produto inativo
✓ quantidade zero
✓ quantidade negativa
✓ quantidade decimal
✓ valor zero
✓ valor negativo
✓ dados ausentes
✓ formato inválido
```

---

# 50. TESTES DE ESTOQUE

Testar:

```text
Estoque = 10
Compra = 5
Resultado = 15
```

Também testar múltiplas compras.

Garantir que o estoque seja atualizado corretamente.

---

# 51. TESTES DE FINANCEIRO

Testar:

```text
Compra:
quantidade = 5
valor_unitario = 20,00

valor_total = 100,00

Lançamento:
tipo = SAIDA
valor = 100,00
```

Garantir consistência entre compra e lançamento.

---

# 52. TESTES FRONT-END

Utilizar:

```text
Vitest
React Testing Library
```

Testar:

```text
✓ renderização
✓ carregamento
✓ fornecedores carregados
✓ produtos carregados
✓ seleção de fornecedor
✓ seleção de produto
✓ preenchimento da quantidade
✓ preenchimento do valor
✓ cálculo da prévia
✓ validação
✓ envio
✓ estado de carregamento
✓ sucesso
✓ erro
✓ listagem
✓ filtros
✓ paginação
```

---

# 53. INTEGRAÇÃO COM PRODUTOS

Validar:

```text
Produto
estoque inicial = 10

Registrar compra:
quantidade = 5

Resultado:
estoque = 15
```

Não alterar diretamente o cadastro de produto além da atualização de estoque necessária à transação.

---

# 54. INTEGRAÇÃO COM FORNECEDORES

Validar:

```text
Fornecedor ativo
    ↓
Pode realizar compra

Fornecedor inativo
    ↓
Compra bloqueada
```

---

# 55. INTEGRAÇÃO COM FINANCEIRO

A compra deverá gerar:

```text
Compra
    ↓
Lançamento financeiro
    ↓
SAIDA
```

Não implementar o módulo Financeiro completo.

---

# 56. NÃO IMPLEMENTAR

Nesta etapa NÃO implementar:

```text
❌ Vendas
❌ Baixa de estoque
❌ Ajuste manual de estoque
❌ Tela de Estoque
❌ Dashboard
❌ Relatórios
❌ Financeiro completo
❌ Auditoria completa
❌ Importação XML
```

A Feature 6 será responsável por Vendas e baixa de estoque.

A Feature 7 será responsável por gestão e ajustes de estoque.

A Feature 8 será responsável pelo controle financeiro completo.

---

# 57. NÃO DUPLICAR FUNCIONALIDADES

Não criar:

```text
cadastro de produtos dentro de compras
cadastro de fornecedores dentro de compras
cadastro de clientes dentro de compras
novo serviço financeiro
novo serviço de estoque
```

Utilizar os módulos existentes.

---

# 58. PREPARAÇÃO PARA AS PRÓXIMAS FEATURES

A implementação deverá deixar o sistema preparado para:

```text
Feature 6
Vendas
    ↓
baixa de estoque
    ↓
movimentação SAIDA
    ↓
financeiro ENTRADA
```

e:

```text
Feature 7
Estoque
    ↓
histórico
    ↓
ajustes
```

A arquitetura deve permitir que essas futuras operações reutilizem os mesmos modelos e regras sem duplicação.

---

# 59. VERIFICAÇÃO DE INTEGRIDADE

Após implementar, validar:

```text
Compra
   │
   ├── Produto existente
   ├── Fornecedor existente
   ├── Estoque atualizado
   ├── Movimentação ENTRADA
   └── Financeiro SAIDA
```

Não deve existir:

```text
compra sem produto
compra sem fornecedor
estoque alterado sem movimentação
movimentação sem compra
financeiro sem origem
```

Dentro do escopo desta feature, garantir essas relações através da transação e das referências existentes.

---

# 60. TESTE MANUAL COMPLETO

Executar no navegador:

```text
1. Fazer login
2. Abrir Compras
3. Selecionar fornecedor
4. Selecionar produto
5. Informar quantidade
6. Informar valor unitário
7. Conferir valor total
8. Registrar compra
9. Confirmar mensagem de sucesso
10. Consultar compra na listagem
11. Verificar estoque atualizado
12. Verificar filtros
13. Testar fornecedor inativo
14. Testar produto inativo
15. Testar dados inválidos
```

---

# 61. CRITÉRIOS DE ACEITE

A Feature 5 somente poderá ser considerada concluída quando:

```text
[✓] Modelo compras
[✓] Migration
[✓] Relacionamento com produto
[✓] Relacionamento com fornecedor
[✓] Modelo movimentacoes_estoque
[✓] Integração financeira
[✓] Repository
[✓] Service
[✓] registrarCompra()
[✓] Transação atômica
[✓] Validação Zod
[✓] Validação de produto ativo
[✓] Validação de fornecedor ativo
[✓] Cálculo de valor_total
[✓] Incremento de estoque
[✓] Movimentação ENTRADA
[✓] Lançamento financeiro SAIDA
[✓] Rollback em caso de erro
[✓] POST /api/compras
[✓] GET /api/compras
[✓] Paginação
[✓] Filtros
[✓] Serviço de API
[✓] Tipos TypeScript
[✓] Tela de registro
[✓] Seleção de fornecedor
[✓] Seleção de produto
[✓] Cálculo de prévia
[✓] Listagem
[✓] Feedbacks
[✓] Responsividade
[✓] Testes unitários
[✓] Testes de integração
[✓] Teste de atomicidade
[✓] Testes front-end
[✓] Fluxo manual completo
```

---

# 62. PROCEDIMENTO OBRIGATÓRIO

Executar nesta ordem:

## Etapa 1 — Análise

Analisar:

```text
Produtos
Fornecedores
Clientes
Autenticação
Autorização
Prisma
Migrations
Padrão de transações
Design System
Testes
```

## Etapa 2 — Banco

Implementar:

```text
compras
movimentacoes_estoque
relacionamentos necessários
```

## Etapa 3 — Back-end

Implementar:

```text
schemas
repositories
services
registrarCompra()
controllers
routes
```

## Etapa 4 — Transação

Implementar e validar:

```text
compra
+
estoque
+
movimentação
+
financeiro
```

dentro de uma única transação.

## Etapa 5 — Front-end

Implementar:

```text
tipos
serviço API
tela de compra
formulário
seleções
prévia
listagem
filtros
```

## Etapa 6 — Testes

Implementar:

```text
unitários
integração
transação
front-end
```

## Etapa 7 — Validação

Executar:

```text
testes
build
servidores
teste manual
responsividade
```

---

# 63. RELATÓRIO FINAL

Ao terminar, apresentar:

```text
1. Arquivos criados
2. Arquivos alterados
3. Migration criada
4. Modelos Prisma
5. Relacionamentos
6. Endpoints
7. Regras de negócio
8. Implementação da transação
9. Estratégia de rollback
10. Alterações de estoque
11. Movimentações criadas
12. Lançamentos financeiros criados
13. Componentes front-end
14. Testes implementados
15. Resultado dos testes
16. Resultado do build
17. Teste manual realizado
18. Problemas encontrados
19. Decisões arquiteturais
20. Pendências
```

Não declarar a feature como concluída caso exista:

```text
erro de compilação
teste quebrado
rollback incompleto
estoque inconsistente
financeiro inconsistente
compra parcialmente gravada
endpoint incompleto
front-end incompleto
```

---

# 64. PRINCÍPIO FINAL

Esta é uma feature crítica do sistema.

Priorizar:

```text
Integridade transacional
Consistência de estoque
Consistência financeira
Segurança
Validação no back-end
Desacoplamento
Testabilidade
Simplicidade
Nomenclatura PT-BR
Preservação do histórico
```

O back-end é a autoridade final sobre as regras de negócio, estoque e financeiro.

O front-end deve apenas consumir a API e fornecer uma boa experiência ao usuário.

A operação de compra deve ser tratada como uma única unidade de negócio:

```text
REGISTRAR COMPRA

        ↓

┌───────────────────────┐
│      TRANSAÇÃO         │
├───────────────────────┤
│ Criar compra           │
│ Atualizar estoque      │
│ Criar movimentação     │
│ Criar saída financeira │
└───────────────────────┘
        ↓
     COMMIT
```

ou, em caso de qualquer falha:

```text
        ↓
     ROLLBACK
        ↓
Nenhuma alteração persistida
```

**Não antecipar a Feature 6.**

Ao concluir esta etapa, a próxima implementação será:

> **Feature 6 — Registro de Vendas e Baixa Atômica de Estoque**
