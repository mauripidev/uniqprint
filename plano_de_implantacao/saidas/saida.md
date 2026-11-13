# PROMPT — IMPLEMENTAÇÃO DA FEATURE 6: REGISTRO DE VENDAS E BAIXA ATÔMICA DE ESTOQUE

Você é responsável pela implementação da próxima feature do sistema **Uniqprint — Controle de Compras e Vendas**.

## CONTEXTO

As seguintes features já foram concluídas:

* Feature 0 — Fundação e Infraestrutura
* Feature 1 — Autenticação e Gestão de Usuários
* Feature 2 — Cadastro e Gestão de Produtos
* Feature 3 — Cadastro e Gestão de Fornecedores
* Feature 4 — Cadastro e Gestão de Clientes
* Feature 5 — Registro de Compras e Entrada de Estoque

A próxima implementação obrigatória é:

> **Feature 6 — Registro de Vendas e Baixa Atômica de Estoque**

O roadmap define essa feature como uma operação transacional envolvendo:

```text
Cliente
Produto
Estoque
Venda
Movimentação de estoque
Financeiro
```

A operação deverá ser atômica e garantir que o estoque jamais fique negativo.

---

# 1. OBJETIVO

Implementar completamente o módulo de **Vendas**, permitindo:

* registrar uma venda;
* selecionar cliente;
* selecionar produto;
* consultar estoque disponível;
* informar quantidade;
* informar valor unitário;
* calcular o valor total;
* validar cliente;
* validar produto;
* verificar estoque suficiente;
* impedir venda acima do estoque;
* realizar baixa de estoque;
* registrar movimentação de estoque `SAIDA`;
* registrar lançamento financeiro `ENTRADA`;
* listar vendas;
* paginar vendas;
* aplicar filtros;
* proteger a operação contra concorrência;
* utilizar autenticação existente;
* respeitar autorização existente.

A Feature 6 deve ser implementada de ponta a ponta:

```text
Banco / Prisma
        ↓
Back-end / API
        ↓
Front-end
        ↓
Testes
```

A arquitetura determina que nenhuma feature seja considerada concluída apenas no back-end.

---

# 2. ARQUITETURA OBRIGATÓRIA

Respeitar:

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

Essa separação faz parte da arquitetura definida no projeto.

---

# 3. PRINCÍPIO MAIS IMPORTANTE

A venda deve ser tratada como uma única operação de negócio.

```text
REGISTRAR VENDA
      ↓
Validar cliente
      ↓
Validar produto
      ↓
Verificar estoque disponível
      ↓
Garantir concorrência segura
      ↓
Criar venda
      ↓
Baixar estoque
      ↓
Criar movimentação SAIDA
      ↓
Criar lançamento financeiro ENTRADA
      ↓
COMMIT
```

Se qualquer etapa falhar:

```text
ROLLBACK
```

Nenhuma alteração parcial deverá permanecer.

---

# 4. ANÁLISE OBRIGATÓRIA ANTES DE CODIFICAR

Antes de modificar qualquer arquivo:

1. analisar a estrutura atual do projeto;
2. analisar o módulo de Produtos;
3. analisar o módulo de Fornecedores;
4. analisar o módulo de Clientes;
5. analisar o módulo de Compras;
6. analisar como `registrarCompra()` foi implementado;
7. analisar a implementação da transação Prisma;
8. analisar movimentações de estoque;
9. analisar lançamentos financeiros;
10. analisar autenticação;
11. analisar autorização;
12. analisar schemas Zod;
13. analisar padrão de erros;
14. analisar testes;
15. analisar componentes de formulário;
16. analisar tabelas;
17. analisar serviços de API;
18. analisar Design System.

**O módulo de Vendas deve seguir os padrões já existentes.**

Não criar uma arquitetura paralela.

---

# 5. NOMENCLATURA

Utilizar nomenclatura PT-BR em todo o domínio.

Exemplos:

```text
venda
cliente_id
produto_id
quantidade
valor_unitario
valor_total
data_venda
criado_em
atualizado_em
```

Métodos:

```text
registrarVenda()
listarVendas()
buscarVendaPorId()
verificarEstoqueDisponivel()
calcularValorTotal()
```

Não utilizar:

```text
sale
customer_id
product_id
quantity
unit_price
total_value
createSale()
```

A arquitetura estabelece nomenclatura de domínio em PT-BR.

---

# 6. BANCO DE DADOS

Criar o modelo:

```text
vendas
```

Utilizar a estrutura definida pelo projeto:

```text
id
data_venda
cliente_id
produto_id
quantidade
valor_unitario
valor_total
criado_em
atualizado_em
```

Antes de criar o modelo, verificar o `schema.prisma` atual e manter compatibilidade com os modelos já existentes.

Não duplicar produtos ou clientes dentro da venda.

Utilizar relacionamentos através dos respectivos IDs.

---

# 7. VALORES MONETÁRIOS

Utilizar o padrão monetário já definido no projeto:

```text
Decimal(15, 2)
```

Para:

```text
valor_unitario
valor_total
```

Não utilizar `float` como representação persistente de valores monetários.

---

# 8. RELACIONAMENTOS

A venda deverá referenciar:

```text
vendas
  │
  ├── cliente_id → clientes.id
  │
  └── produto_id → produtos.id
```

Não criar uma cópia dos dados do cliente ou produto na venda.

O registro histórico deverá utilizar os relacionamentos definidos pelo banco.

---

# 9. CLIENTE

Antes de registrar uma venda:

```text
cliente existe?
      ↓
     SIM
      ↓
cliente está ativo?
      ↓
     SIM
      ↓
prosseguir
```

Caso o cliente não exista:

```text
404 / erro de negócio apropriado
```

Caso esteja inativo:

```text
impedir venda
```

Utilizar o mesmo padrão de validação existente nos módulos anteriores.

---

# 10. PRODUTO

Antes de registrar uma venda:

```text
produto existe?
      ↓
     SIM
      ↓
produto está ativo?
      ↓
     SIM
      ↓
prosseguir
```

Produto inexistente ou inativo deverá impedir a venda.

Não permitir venda de produto inativo.

---

# 11. QUANTIDADE

A quantidade deve:

* ser obrigatória;
* ser inteira;
* ser maior que zero.

Não aceitar:

```text
0
-1
-5
1.5
null
```

Validar utilizando Zod no back-end.

---

# 12. VALOR UNITÁRIO

O valor unitário deve:

* ser obrigatório;
* ser maior que zero;
* utilizar precisão monetária adequada;
* ser processado utilizando Decimal.

Não aceitar:

```text
0
valor negativo
NaN
null
```

---

# 13. VALOR TOTAL

O back-end deverá calcular:

```text
valor_total =
quantidade × valor_unitario
```

Exemplo:

```text
Quantidade: 3
Valor unitário: R$ 50,00

Total:
R$ 150,00
```

O front-end pode realizar uma prévia do cálculo.

Porém:

> o valor oficial deverá ser calculado no back-end.

Nunca confiar em `valor_total` enviado pelo navegador.

---

# 14. ESTOQUE — REGRA CRÍTICA

A venda somente poderá ser realizada se:

```text
quantidade_solicitada <= estoque_disponivel
```

Exemplo:

```text
Estoque: 10
Venda: 7

Permitido.
Novo estoque: 3
```

Exemplo:

```text
Estoque: 10
Venda: 11

❌ BLOQUEAR
```

O projeto determina explicitamente a prevenção absoluta de estoque negativo.

---

# 15. ERRO DE ESTOQUE INSUFICIENTE

Quando não houver estoque suficiente, retornar um erro de negócio identificável.

Utilizar o conceito:

```text
ESTOQUE_INSUFICIENTE
```

O front-end deverá tratar esse erro de forma amigável.

Mensagem sugerida:

```text
Estoque insuficiente para realizar esta venda.
```

Se possível, apresentar também:

```text
Estoque disponível: X
Quantidade solicitada: Y
```

---

# 16. CONCORRÊNCIA — REGRA CRÍTICA

A verificação de estoque deve ser protegida contra concorrência.

Não implementar uma solução insegura como:

```text
SELECT estoque
      ↓
verifica no código
      ↓
UPDATE estoque
```

sem proteção transacional adequada.

Cenário:

```text
Estoque = 5

Venda A solicita 4
Venda B solicita 4
```

As duas requisições não podem ser autorizadas simultaneamente resultando em:

```text
estoque = -3
```

O sistema deve garantir consistência mesmo com requisições concorrentes.

A Feature 6 exige explicitamente verificação atômica do estoque disponível contra concorrência.

---

# 17. BAIXA ATÔMICA DO ESTOQUE

A atualização deve garantir:

```text
estoque >= quantidade_vendida
```

e somente então realizar:

```text
estoque = estoque - quantidade
```

A operação deve ser protegida pela estratégia transacional adequada ao Prisma e ao banco utilizado.

---

# 18. SERVIÇO PRINCIPAL

Implementar:

```text
registrarVenda()
```

Responsabilidades:

1. validar entrada;
2. validar cliente;
3. validar produto;
4. validar ativos;
5. validar quantidade;
6. validar valor unitário;
7. calcular valor total;
8. iniciar transação;
9. verificar estoque de forma segura;
10. realizar baixa de estoque;
11. criar venda;
12. criar movimentação `SAIDA`;
13. criar lançamento financeiro `ENTRADA`;
14. concluir transação.

---

# 19. ORDEM DA OPERAÇÃO

Utilizar uma ordem segura.

Conceitualmente:

```text
Início da transação
       ↓
Validar entidades
       ↓
Obter/garantir estoque de forma segura
       ↓
Validar disponibilidade
       ↓
Baixar estoque
       ↓
Criar venda
       ↓
Criar movimentação SAIDA
       ↓
Criar financeiro ENTRADA
       ↓
COMMIT
```

Se ocorrer qualquer erro:

```text
ROLLBACK
```

---

# 20. MOVIMENTAÇÃO DE ESTOQUE

Cada venda deverá gerar uma movimentação:

```text
movimentacoes_estoque
```

Com:

```text
tipo = SAIDA
```

Utilizar:

```text
produto_id
quantidade
tipo_referencia
referencia_id
```

para relacionar a movimentação à venda.

Não criar movimentação de saída sem venda correspondente.

Não permitir venda persistida sem sua movimentação correspondente.

---

# 21. FINANCEIRO

Cada venda deverá gerar:

```text
lancamentos_financeiros
```

Com:

```text
tipo = ENTRADA
```

e:

```text
valor = valor_total
```

A Feature 6 define explicitamente que a venda gera uma entrada financeira.

Não implementar nesta etapa o módulo Financeiro completo.

---

# 22. ATOMICIDADE COMPLETA

A venda deverá manter consistência entre:

```text
Venda
+
Estoque
+
Movimentação
+
Financeiro
```

Exemplo:

```text
Venda criada
    ↓
Estoque baixado
    ↓
Movimentação criada
    ↓
Financeiro criado
    ↓
COMMIT
```

Caso o financeiro falhe:

```text
ROLLBACK
```

Resultado:

```text
❌ venda não persiste
❌ estoque volta ao estado anterior
❌ movimentação não persiste
❌ financeiro não persiste
```

---

# 23. ENDPOINT DE CRIAÇÃO

Implementar:

```http
POST /api/vendas
```

Payload conceitual:

```json
{
  "data_venda": "2026-08-29",
  "cliente_id": 10,
  "produto_id": 5,
  "quantidade": 2,
  "valor_unitario": 100.00
}
```

Não aceitar `valor_total` como fonte de verdade.

O back-end deve calcular o valor total.

---

# 24. ENDPOINT DE LISTAGEM

Implementar:

```http
GET /api/vendas
```

Com:

* paginação;
* filtros;
* ordenação;
* informações do cliente;
* informações do produto.

Seguir exatamente o padrão utilizado na listagem de Compras.

---

# 25. FILTROS

Implementar filtros adequados para vendas.

No mínimo:

```text
período
cliente
produto
```

O projeto define filtros para operações e consultas futuras e determina que filtros sejam aplicados no banco quando necessários.

Não carregar toda a tabela para filtrar no React.

---

# 26. PAGINAÇÃO

Seguir o padrão existente no projeto.

Exemplo:

```text
?page=1&limite=20
```

Não criar uma convenção diferente.

---

# 27. CONSULTA INDIVIDUAL

Se o padrão de Compras possuir consulta individual, implementar:

```http
GET /api/vendas/:id
```

Seguir a mesma convenção arquitetural existente.

---

# 28. BACK-END — ESTRUTURA

Criar:

```text
backend/src/modulos/vendas/
```

Seguir a mesma organização de Compras.

Conceitualmente:

```text
vendas/
├── controladores/
├── servicos/
├── repositorios/
├── schemas/
├── tipos/
└── rotas/
```

Adaptar ao padrão real do projeto.

---

# 29. SCHEMAS ZOD

Criar schemas para:

```text
criação
consulta
filtros
parâmetros de rota
```

Validar 100% dos dados recebidos.

A segurança do projeto determina validação de 100% dos dados de entrada com Zod.

---

# 30. TRATAMENTO DE ERROS

Utilizar o tratamento centralizado já existente.

Nunca retornar:

```text
stack trace
SQL
detalhes internos
dados sensíveis
```

A API deve retornar mensagens amigáveis.

Exemplos:

```text
Cliente não encontrado.
Cliente inativo.
Produto não encontrado.
Produto inativo.
Quantidade inválida.
Valor unitário inválido.
Estoque insuficiente para realizar esta venda.
Não foi possível registrar a venda.
```

O projeto determina explicitamente que stack traces, SQL e dados sensíveis não sejam expostos pela API.

---

# 31. FRONT-END

Criar:

```text
frontend/src/servicos/vendas.ts
```

Criar:

```text
frontend/src/tipos/vendas.ts
```

com o tipo:

```text
Venda
```

Seguir o padrão já estabelecido para Produtos, Fornecedores, Clientes e Compras.

---

# 32. TELA DE REGISTRO DE VENDAS

Criar:

```text
Registro de Vendas
```

Estrutura sugerida:

```text
Nova Venda

Cliente *
[ Selecionar cliente ]

Produto *
[ Selecionar produto ]

Estoque disponível
[ 25 unidades ]

Quantidade *
[       ]

Valor unitário *
[ R$       ]

Valor total
[ R$ 0,00 ]

[ Cancelar ] [ Registrar venda ]
```

---

# 33. CLIENTES NA TELA

Utilizar seleção dinâmica.

Apresentar somente clientes ativos para novas vendas.

Utilizar:

```text
/api/clientes
```

Não duplicar cadastro de clientes dentro de Vendas.

---

# 34. PRODUTOS NA TELA

Utilizar seleção dinâmica.

Apresentar somente produtos ativos.

Utilizar:

```text
/api/produtos
```

Ao selecionar um produto:

> consultar e apresentar o estoque disponível.

---

# 35. ESTOQUE EM TEMPO REAL

Ao selecionar o produto, apresentar:

```text
Estoque disponível: 25
```

A tela deverá consultar a informação atual do back-end.

Não utilizar exclusivamente um valor armazenado anteriormente no estado do React.

O projeto exige indicação em tempo real do estoque disponível na tela de vendas.

---

# 36. BLOQUEIO NO FRONT-END

Se:

```text
quantidade solicitada > estoque disponível
```

o formulário deverá:

```text
bloquear a operação
```

e informar:

```text
Estoque insuficiente.
```

Porém:

> esse bloqueio é apenas uma melhoria de UX.

A validação definitiva deverá continuar no back-end.

---

# 37. CONCORRÊNCIA NO FRONT-END

Mesmo que a tela mostre:

```text
Estoque disponível: 5
```

outro usuário poderá consumir estoque antes do envio.

Portanto:

```text
Front-end
    ↓
pode bloquear antecipadamente

Back-end
    ↓
DEVE validar novamente
```

O back-end é a autoridade final.

Se ocorrer concorrência e o estoque tiver sido consumido:

```text
ESTOQUE_INSUFICIENTE
```

deverá ser tratado amigavelmente.

---

# 38. PRÉVIA DO TOTAL

Enquanto o usuário digita:

```text
quantidade
valor unitário
```

calcular:

```text
valor total
```

Exemplo:

```text
5 × R$ 30,00 = R$ 150,00
```

O cálculo exibido é apenas uma prévia.

O valor oficial será calculado novamente no back-end.

---

# 39. FEEDBACK DE SUCESSO

Após a venda:

```text
Venda registrada com sucesso.
```

O sistema deverá refletir:

```text
estoque atualizado
```

e permitir que a venda apareça na listagem.

---

# 40. ERRO DE ESTOQUE

Se o back-end retornar:

```text
ESTOQUE_INSUFICIENTE
```

mostrar algo como:

```text
Não foi possível realizar a venda.

O estoque disponível foi alterado antes da conclusão da operação.
Atualize o estoque e tente novamente.
```

Não exibir stack trace ou detalhes internos.

---

# 41. LISTAGEM DE VENDAS

Criar listagem contendo:

```text
Data
Cliente
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

Seguir visualmente a listagem de Compras.

---

# 42. RESPONSIVIDADE

Validar:

```text
Desktop
Tablet
Mobile
```

Garantir:

* formulário utilizável;
* seleção de cliente;
* seleção de produto;
* informação de estoque;
* mensagens;
* tabela;
* filtros;
* paginação.

---

# 43. AUTENTICAÇÃO

Utilizar exclusivamente a autenticação já implementada.

Não criar:

```text
novo login
novo token
novo middleware
nova sessão
```

---

# 44. AUTORIZAÇÃO

Utilizar o mecanismo existente.

A autorização deverá ser validada no servidor.

Não confiar apenas em:

```text
botões escondidos
rotas protegidas no React
```

O back-end continua sendo a autoridade final de permissões e regras de negócio.

---

# 45. TESTES — VENDA COM SUCESSO

Implementar teste garantindo:

```text
Cliente ativo
Produto ativo
Estoque suficiente
Quantidade válida
Valor válido
```

Resultado:

```text
✓ venda criada
✓ valor total correto
✓ estoque decrementado
✓ movimentação SAIDA criada
✓ financeiro ENTRADA criado
```

---

# 46. TESTES — ESTOQUE INSUFICIENTE

Exemplo:

```text
Estoque = 5
Venda = 6
```

Resultado:

```text
❌ venda não criada
❌ estoque não alterado
❌ movimentação não criada
❌ financeiro não criado
```

Retornar:

```text
ESTOQUE_INSUFICIENTE
```

---

# 47. TESTE — ESTOQUE ZERO

Exemplo:

```text
Estoque = 0
Venda = 1
```

Resultado:

```text
❌ venda bloqueada
```

Nunca permitir estoque negativo.

---

# 48. TESTE — VENDA DO ESTOQUE EXATO

Exemplo:

```text
Estoque = 10
Venda = 10
```

Resultado:

```text
✓ venda permitida
✓ novo estoque = 0
```

---

# 49. TESTE — CONCORRÊNCIA

Este é um teste obrigatório.

Cenário:

```text
Estoque = 5

Venda A = 4
Venda B = 4
```

Executar as duas operações de forma concorrente.

Resultado esperado:

```text
Somente uma poderá consumir os 5 itens integralmente.
```

Ou, dependendo da ordem/estratégia de execução:

```text
uma venda é concluída
outra recebe ESTOQUE_INSUFICIENTE
```

Mas jamais:

```text
estoque negativo
```

---

# 50. TESTE — ROLLBACK

Forçar falha após a baixa de estoque.

Exemplo:

```text
estoque baixado
        ↓
falha ao criar movimentação
```

Verificar:

```text
✓ venda não persiste
✓ estoque retorna ao estado anterior
✓ movimentação não persiste
✓ financeiro não persiste
```

Também realizar cenário equivalente forçando falha no financeiro.

---

# 51. TESTES — CLIENTE

Testar:

```text
✓ cliente existente
✓ cliente ativo
✓ cliente inexistente
✓ cliente inativo
```

Clientes inativos não podem gerar novas vendas.

---

# 52. TESTES — PRODUTO

Testar:

```text
✓ produto existente
✓ produto ativo
✓ produto inexistente
✓ produto inativo
```

Produtos inativos não podem ser vendidos.

---

# 53. TESTES — VALIDAÇÃO

Testar:

```text
✓ quantidade ausente
✓ quantidade zero
✓ quantidade negativa
✓ quantidade decimal
✓ valor ausente
✓ valor zero
✓ valor negativo
✓ cliente ausente
✓ produto ausente
```

---

# 54. TESTES FRONT-END

Utilizar o padrão existente:

```text
Vitest
React Testing Library
```

Testar:

```text
✓ renderização
✓ carregamento
✓ clientes carregados
✓ produtos carregados
✓ seleção de cliente
✓ seleção de produto
✓ estoque disponível
✓ alteração da quantidade
✓ cálculo da prévia
✓ bloqueio por estoque insuficiente
✓ envio
✓ loading
✓ sucesso
✓ erro ESTOQUE_INSUFICIENTE
✓ listagem
✓ filtros
✓ paginação
```

---

# 55. TESTE DE INTEGRAÇÃO COMPLETO

Executar:

```text
Login
   ↓
Vendas
   ↓
Selecionar cliente
   ↓
Selecionar produto
   ↓
Consultar estoque
   ↓
Informar quantidade
   ↓
Registrar venda
   ↓
Venda criada
   ↓
Estoque baixado
   ↓
Movimentação SAIDA
   ↓
Financeiro ENTRADA
```

---

# 56. NÃO IMPLEMENTAR NESTA ETAPA

Não implementar:

```text
❌ Gestão de Estoque completa
❌ Ajustes manuais de estoque
❌ Extrato de movimentações
❌ Dashboard
❌ Relatórios
❌ Financeiro completo
❌ Auditoria completa
❌ Importação XML
```

Essas responsabilidades pertencem às features seguintes.

O roadmap determina:

```text
Feature 6 → Vendas
Feature 7 → Gestão e Ajustes de Estoque
Feature 8 → Controle Financeiro
Feature 9 → Relatórios
Feature 10 → Dashboard
Feature 11 → Auditoria
```

---

# 57. NÃO ALTERAR FEATURES ANTERIORES

Evitar alterações em:

```text
Autenticação
Usuários
Produtos
Fornecedores
Clientes
Compras
```

Somente modificar código anterior se houver necessidade técnica direta para integrar Vendas.

Se for necessário alterar:

1. identificar o motivo;
2. explicar a alteração;
3. executar os testes existentes;
4. garantir que não haja regressão.

---

# 58. VERIFICAÇÃO DE INTEGRIDADE

Após a implementação, garantir:

```text
Venda
 │
 ├── Cliente válido
 ├── Produto válido
 ├── Estoque suficiente
 ├── Estoque decrementado
 ├── Movimentação SAIDA
 └── Financeiro ENTRADA
```

Nunca permitir:

```text
venda sem estoque suficiente
estoque negativo
venda sem movimentação
venda sem lançamento financeiro
estoque alterado sem operação correspondente
```

---

# 59. TESTE MANUAL COMPLETO

No navegador:

```text
1. Fazer login
2. Abrir Vendas
3. Selecionar cliente
4. Selecionar produto
5. Conferir estoque disponível
6. Informar quantidade
7. Conferir valor total
8. Registrar venda
9. Confirmar mensagem de sucesso
10. Confirmar estoque reduzido
11. Consultar venda na listagem
12. Testar quantidade maior que o estoque
13. Testar produto inativo
14. Testar cliente inativo
15. Testar filtros
16. Testar paginação
17. Testar responsividade
```

---

# 60. CRITÉRIOS DE ACEITE

A Feature 6 somente poderá ser considerada concluída quando:

```text
[✓] Modelo vendas
[✓] Migration
[✓] Relacionamento com cliente
[✓] Relacionamento com produto
[✓] Repository
[✓] Service
[✓] registrarVenda()
[✓] Schemas Zod
[✓] Validação de cliente
[✓] Validação de produto
[✓] Validação de ativos
[✓] Validação de quantidade
[✓] Validação de valor
[✓] Cálculo do valor total
[✓] Verificação de estoque
[✓] Proteção contra estoque negativo
[✓] Proteção contra concorrência
[✓] Baixa de estoque
[✓] Movimentação SAIDA
[✓] Financeiro ENTRADA
[✓] Transação atômica
[✓] Rollback
[✓] POST /api/vendas
[✓] GET /api/vendas
[✓] Paginação
[✓] Filtros
[✓] Tipos TypeScript
[✓] Serviço de API
[✓] Tela de Vendas
[✓] Seleção de cliente
[✓] Seleção de produto
[✓] Estoque disponível
[✓] Cálculo de prévia
[✓] Bloqueio de estoque insuficiente
[✓] Tratamento ESTOQUE_INSUFICIENTE
[✓] Listagem
[✓] Testes unitários
[✓] Testes de integração
[✓] Teste de concorrência
[✓] Teste de rollback
[✓] Testes front-end
[✓] Fluxo manual
```

---

# 61. PROCEDIMENTO DE IMPLEMENTAÇÃO

Executar obrigatoriamente nesta ordem:

## Etapa 1 — Análise

```text
Produtos
Fornecedores
Clientes
Compras
Estoque
Financeiro
Autenticação
Autorização
Prisma
Transações
Design System
Testes
```

## Etapa 2 — Banco

```text
Modelo vendas
Relacionamentos
Migration
```

## Etapa 3 — Back-end

```text
Schemas
Repository
Service
registrarVenda()
Controller
Rotas
```

## Etapa 4 — Transação

Implementar:

```text
Validação
    ↓
Estoque seguro
    ↓
Baixa
    ↓
Venda
    ↓
Movimentação SAIDA
    ↓
Financeiro ENTRADA
```

## Etapa 5 — Front-end

Implementar:

```text
Tipos
Serviço API
Tela
Formulário
Cliente
Produto
Estoque disponível
Quantidade
Valor
Total
Listagem
Filtros
```

## Etapa 6 — Testes

Executar:

```text
Unitários
Integração
Estoque insuficiente
Concorrência
Rollback
Front-end
```

## Etapa 7 — Validação

Executar:

```text
Testes
Build
Servidor
Teste manual
Responsividade
```

---

# 62. RELATÓRIO FINAL

Ao finalizar, apresentar:

```text
1. Arquivos criados
2. Arquivos alterados
3. Migration
4. Modelo Prisma
5. Relacionamentos
6. Endpoints
7. Regras de negócio
8. Estratégia de controle de estoque
9. Estratégia de concorrência
10. Estratégia transacional
11. Estratégia de rollback
12. Movimentações criadas
13. Lançamentos financeiros criados
14. Componentes front-end
15. Testes implementados
16. Resultado dos testes
17. Resultado do teste de concorrência
18. Resultado do teste de rollback
19. Resultado do build
20. Teste manual
21. Problemas encontrados
22. Decisões arquiteturais
23. Pendências
```

Não declarar a feature como concluída se houver:

```text
erro de compilação
teste quebrado
estoque inconsistente
estoque negativo
falha de concorrência
rollback incompleto
venda parcialmente persistida
financeiro inconsistente
endpoint incompleto
front-end incompleto
```

---

# 63. PRINCÍPIO FINAL

A Feature 6 é uma das operações mais críticas do sistema.

Priorizar:

```text
INTEGRIDADE DO ESTOQUE
        +
ATOMICIDADE
        +
CONCORRÊNCIA
        +
CONSISTÊNCIA FINANCEIRA
        +
SEGURANÇA
        +
VALIDAÇÃO NO BACK-END
```

A arquitetura determina que o back-end seja a autoridade final das regras de negócio, estoque e financeiro.

O objetivo final desta feature é garantir:

```text
              REGISTRAR VENDA
                     │
                     ▼
             ┌───────────────┐
             │ Validar dados │
             └───────┬───────┘
                     ▼
             ┌───────────────┐
             │ Validar estoque│
             └───────┬───────┘
                     ▼
             ┌───────────────┐
             │ Baixar estoque│
             └───────┬───────┘
                     ▼
             ┌───────────────┐
             │ Criar venda   │
             └───────┬───────┘
                     ▼
             ┌───────────────┐
             │ SAIDA estoque │
             └───────┬───────┘
                     ▼
             ┌───────────────┐
             │ ENTRADA finan.│
             └───────┬───────┘
                     ▼
                   COMMIT
```

Em qualquer falha:

```text
ROLLBACK COMPLETO
```

**Não antecipar a Feature 7.**

Ao concluir esta etapa, a próxima implementação do roadmap será:

> **Feature 7 — Gestão e Ajustes Manuais de Estoque**
