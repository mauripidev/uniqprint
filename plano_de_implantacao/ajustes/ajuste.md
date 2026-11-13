# PROMPT — IMPLEMENTAÇÃO DA FEATURE 7: GESTÃO E AJUSTES MANUAIS DE ESTOQUE

Você é responsável pela implementação da próxima feature do sistema **Uniqprint — Controle de Compras e Vendas**.

## CONTEXTO

As seguintes features já foram concluídas:

* Feature 0 — Fundação e Infraestrutura
* Feature 1 — Autenticação e Gestão de Usuários
* Feature 2 — Cadastro e Gestão de Produtos
* Feature 3 — Cadastro e Gestão de Fornecedores
* Feature 4 — Cadastro e Gestão de Clientes
* Feature 5 — Registro de Compras e Entrada de Estoque
* Feature 6 — Registro de Vendas e Baixa Atômica de Estoque

A próxima implementação obrigatória é:

> **Feature 7 — Gestão e Ajustes Manuais de Estoque**

De acordo com o plano, esta feature contempla:

* refinamento das consultas de `movimentacoes_estoque`;
* módulo de Estoque no back-end;
* visão consolidada do estoque;
* alerta de estoque baixo;
* extrato completo das movimentações;
* ajustes manuais transacionais;
* movimentação do tipo `AJUSTE`;
* página de Estoque;
* histórico de entradas, saídas e ajustes;
* modal de ajuste com confirmação;
* testes de ajustes e integridade histórica.

---

# 1. OBJETIVO

Implementar completamente o módulo de **Gestão de Estoque**, permitindo ao usuário:

1. consultar o estoque atual de todos os produtos;
2. visualizar o estoque consolidado por produto;
3. identificar produtos com estoque baixo;
4. consultar o histórico de movimentações;
5. identificar entradas provenientes de compras;
6. identificar saídas provenientes de vendas;
7. registrar ajustes manuais de estoque;
8. justificar o ajuste;
9. atualizar o estoque de forma transacional;
10. registrar a movimentação `AJUSTE`;
11. preservar integralmente o histórico;
12. utilizar autenticação e autorização existentes;
13. disponibilizar tudo através da API REST;
14. fornecer uma interface web completa;
15. testar as regras no back-end e front-end.

A implementação deverá seguir obrigatoriamente o modelo de **Desenvolvimento Vertical por Feature**:

```text
Banco
  ↓
Back-end
  ↓
Front-end
  ↓
Testes
```

A arquitetura determina que uma feature não é considerada concluída apenas com a implementação do back-end.

---

# 2. ARQUITETURA OBRIGATÓRIA

Respeitar as camadas:

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

O back-end permanece como única autoridade sobre:

```text
regras de negócio
estoque
movimentações
```

O front-end não pode atualizar estoque diretamente.

Essa separação é parte da arquitetura definida no projeto.

---

# 3. PRINCÍPIO CENTRAL DA FEATURE

O estoque deve ser tratado como uma informação derivada de operações e movimentações confiáveis.

A tela deverá permitir visualizar:

```text
ESTOQUE ATUAL
     │
     ├── Produto
     ├── Quantidade disponível
     ├── Status
     └── Alerta de estoque baixo
```

E o histórico:

```text
HISTÓRICO
     │
     ├── ENTRADA → Compra
     ├── SAIDA   → Venda
     └── AJUSTE  → Alteração manual
```

Não apagar ou sobrescrever movimentações anteriores.

O histórico deve ser preservado. O plano estabelece integridade dos dados, operações transacionais e preservação histórica como princípios arquiteturais.

---

# 4. ANÁLISE OBRIGATÓRIA ANTES DE CODIFICAR

Antes de modificar qualquer arquivo:

1. analisar o módulo de Produtos;
2. analisar o módulo de Compras;
3. analisar o módulo de Vendas;
4. analisar o modelo atual de `movimentacoes_estoque`;
5. analisar como a compra registra `ENTRADA`;
6. analisar como a venda registra `SAIDA`;
7. analisar o controle atual de `quantidade_estoque`;
8. analisar autenticação;
9. analisar autorização;
10. analisar schemas Zod;
11. analisar repositories;
12. analisar services;
13. analisar controllers;
14. analisar rotas;
15. analisar tratamento de erros;
16. analisar padrão de paginação;
17. analisar componentes de tabela;
18. analisar modais;
19. analisar Design System;
20. analisar testes existentes.

**Não criar uma arquitetura paralela.**

Reutilizar os padrões já existentes.

---

# 5. NOMENCLATURA

Utilizar nomenclatura em PT-BR.

Exemplos:

```text
estoque
movimentacoes_estoque
produto_id
quantidade
tipo
tipo_referencia
referencia_id
criado_em
```

Métodos:

```text
listarEstoque()
listarMovimentacoes()
registrarAjuste()
consultarEstoqueProduto()
```

Não utilizar nomenclatura em inglês para os conceitos de domínio.

---

# 6. MODELO DE ESTOQUE

O estoque atual continua sendo representado pela quantidade armazenada no produto:

```text
produtos.quantidade_estoque
```

A Feature 7 não deve criar uma segunda fonte de verdade para o estoque.

Não criar:

```text
estoques
saldo_estoque
saldo_atual
```

sem necessidade arquitetural explícita.

Utilizar a estrutura existente.

---

# 7. MOVIMENTAÇÕES DE ESTOQUE

Utilizar a tabela:

```text
movimentacoes_estoque
```

A Feature 5 já utiliza essa tabela para:

```text
ENTRADA
```

A Feature 6 utiliza:

```text
SAIDA
```

Agora a Feature 7 deverá adicionar suporte operacional para:

```text
AJUSTE
```

O plano define explicitamente os tipos:

```text
ENTRADA
SAIDA
AJUSTE
```

e a prevenção absoluta de estoque negativo.

---

# 8. HISTÓRICO É IMUTÁVEL

Nunca editar ou excluir uma movimentação histórica.

Não criar:

```http
PUT /api/estoque/movimentacoes/:id
DELETE /api/estoque/movimentacoes/:id
```

As movimentações devem ser somente de leitura após criadas.

Se um ajuste posterior corrigir um ajuste anterior:

```text
Movimentação anterior
        ↓
permanece no histórico

Novo ajuste
        ↓
nova movimentação
```

Nunca alterar o passado.

---

# 9. TIPOS DE MOVIMENTAÇÃO

A listagem deverá diferenciar visualmente:

```text
ENTRADA
SAIDA
AJUSTE
```

Exemplo:

```text
Compra       → ENTRADA
Venda        → SAIDA
Ajuste +5    → AJUSTE
Ajuste -3    → AJUSTE
```

---

# 10. ENDPOINT — ESTOQUE CONSOLIDADO

Implementar:

```http
GET /api/estoque
```

Esse endpoint deverá retornar o estoque consolidado dos produtos.

Informações mínimas:

```text
produto
quantidade_estoque
status/alerta
```

A Feature 7 determina explicitamente a listagem consolidada com alerta de estoque baixo.

---

# 11. PAGINAÇÃO DO ESTOQUE

Se a quantidade de produtos justificar paginação, utilizar o padrão de paginação já existente no projeto.

Exemplo:

```text
GET /api/estoque?page=1&limite=20
```

Não criar padrão diferente do restante da aplicação.

---

# 12. FILTROS DO ESTOQUE

A listagem deverá permitir, conforme os padrões existentes:

```text
produto
status
estoque baixo
```

Caso exista busca textual no módulo de Produtos, reutilizar o mesmo padrão.

Não duplicar lógica de busca.

---

# 13. ALERTA DE ESTOQUE BAIXO

A tela deve identificar produtos cujo estoque esteja baixo.

Antes de implementar:

> verificar como o limite de estoque baixo está definido no projeto.

Se existir um campo/configuração já estabelecido, reutilizá-lo.

Se o documento não definir um limite numérico específico, **não inventar uma regra de negócio arbitrária**.

Nesse caso, implementar a estrutura necessária para suportar o alerta e utilizar o padrão já existente no projeto.

---

# 14. ESTOQUE ZERO

Produtos com:

```text
quantidade_estoque = 0
```

devem ser identificados de forma clara.

Exemplo:

```text
Estoque: 0
Status: Sem estoque
```

Não considerar estoque zero como estoque negativo.

---

# 15. ESTOQUE NEGATIVO

Estoque negativo é proibido.

Nunca permitir:

```text
quantidade_estoque < 0
```

O plano estabelece explicitamente a prevenção absoluta de estoque negativo.

Essa regra deverá ser aplicada também aos ajustes manuais.

---

# 16. ENDPOINT — HISTÓRICO DE MOVIMENTAÇÕES

Implementar:

```http
GET /api/estoque/movimentacoes
```

Esse endpoint deverá fornecer o extrato completo do histórico.

A Feature 7 determina explicitamente essa rota.

---

# 17. DADOS DO HISTÓRICO

Exibir informações equivalentes a:

```text
Data
Produto
Tipo
Quantidade
Referência
```

Quando disponível, apresentar a origem:

```text
Compra #123
Venda #456
Ajuste manual
```

Utilizar:

```text
tipo_referencia
referencia_id
```

para identificar a origem quando essa estrutura estiver disponível.

---

# 18. FILTROS DO HISTÓRICO

Implementar filtros por:

```text
período
produto
tipo de movimentação
```

Tipos:

```text
Todos
ENTRADA
SAIDA
AJUSTE
```

Os filtros deverão ser aplicados no back-end.

Não carregar todo o histórico para depois filtrar no React.

---

# 19. PAGINAÇÃO DO HISTÓRICO

Utilizar paginação no endpoint:

```http
GET /api/estoque/movimentacoes?page=1&limite=20
```

Seguir o padrão de paginação existente.

---

# 20. ENDPOINT — AJUSTE DE ESTOQUE

Implementar:

```http
POST /api/estoque/ajustes
```

Esse endpoint deverá registrar um ajuste manual.

O ajuste deverá ser transacional.

A Feature 7 determina explicitamente a criação desse endpoint e o uso do tipo `AJUSTE`.

---

# 21. MODELO DE AJUSTE

O ajuste deve permitir representar uma alteração positiva ou negativa.

Exemplo:

```text
Estoque atual: 10
Ajuste: +5
Novo estoque: 15
```

Ou:

```text
Estoque atual: 10
Ajuste: -3
Novo estoque: 7
```

Não permitir que o resultado seja negativo.

---

# 22. PAYLOAD DO AJUSTE

Utilizar estrutura conceitual equivalente a:

```json
{
  "produto_id": 10,
  "quantidade": 5,
  "tipo": "ENTRADA",
  "observacao": "Contagem física do estoque"
}
```

ou a estrutura mais adequada ao modelo existente.

**Importante:**

O documento define a movimentação como `AJUSTE`.

Portanto, caso o domínio utilize quantidade positiva/negativa para representar o efeito do ajuste, preservar:

```text
tipo = AJUSTE
```

e representar o delta de estoque de maneira consistente.

Não criar dois registros para um único ajuste.

---

# 23. RECOMENDAÇÃO DE MODELAGEM

Preferir representar:

```text
tipo = AJUSTE
quantidade = delta
```

Exemplo:

```text
+5 → entrada de ajuste
-3 → saída de ajuste
```

Caso o modelo atual não aceite valores negativos, adaptar a representação sem quebrar o padrão existente.

Antes de decidir, analisar o `schema.prisma` atual.

**Não alterar silenciosamente o contrato existente.**

---

# 24. OBSERVAÇÃO / JUSTIFICATIVA

Todo ajuste manual deverá exigir uma justificativa.

Exemplos:

```text
Contagem física
Produto danificado
Perda
Correção de inventário
Erro de lançamento
```

Se o modelo de `movimentacoes_estoque` ainda não possuir campo apropriado para observação:

1. analisar o schema existente;
2. verificar se existe mecanismo compartilhado;
3. se necessário, adicionar o campo de forma compatível;
4. criar migration.

Não criar um campo duplicado se já existir estrutura equivalente.

---

# 25. TRANSAÇÃO DO AJUSTE

O método principal deverá ser:

```text
registrarAjuste()
```

A operação deverá ocorrer dentro de uma transação.

Fluxo:

```text
registrarAjuste()
       ↓
Validar produto
       ↓
Validar produto ativo
       ↓
Validar quantidade
       ↓
Verificar resultado do estoque
       ↓
Atualizar quantidade_estoque
       ↓
Criar movimentação AJUSTE
       ↓
COMMIT
```

Em caso de erro:

```text
ROLLBACK
```

---

# 26. ATOMICIDADE

Nunca permitir:

```text
Estoque atualizado
       ↓
Erro ao criar movimentação
       ↓
❌ estoque permanece alterado
```

O comportamento correto:

```text
Atualiza estoque
      +
Cria movimentação
      ↓
COMMIT
```

ou:

```text
Erro
 ↓
ROLLBACK
```

A arquitetura estabelece operações de estoque como transacionais.

---

# 27. CONCORRÊNCIA NO AJUSTE

O ajuste também deverá considerar concorrência.

Exemplo:

```text
Estoque = 10

Usuário A:
ajuste -7

Usuário B:
ajuste -5
```

O resultado nunca poderá ser:

```text
-2
```

A operação deve garantir consistência mesmo quando houver atualizações concorrentes.

Utilizar os mecanismos transacionais/atômicos adequados ao banco e ao Prisma.

---

# 28. PRODUTO INATIVO

Verificar a regra existente para produtos inativos.

Antes de permitir ajuste:

```text
produto existe?
produto está ativo?
```

Se a regra do domínio determinar que produto inativo não pode sofrer ajuste, bloquear.

Se o documento não determinar comportamento diferente, seguir o padrão de negócio já utilizado para operações de estoque.

**Não inventar uma regra conflitante com o restante do sistema.**

---

# 29. AJUSTE NÃO DEVE CRIAR COMPRA OU VENDA

Um ajuste manual:

```text
AJUSTE
```

não deve criar:

```text
Compra
Venda
```

e não deve gerar automaticamente:

```text
lancamento financeiro
```

a menos que exista regra explícita no projeto.

O objetivo é corrigir/adequar estoque.

---

# 30. FINANCEIRO

Nesta feature:

> não criar lançamento financeiro para ajustes de estoque, salvo se o modelo/regra atual do projeto determinar explicitamente essa integração.

A Feature 8 será responsável pelo controle financeiro completo.

Não antecipar funcionalidades financeiras.

---

# 31. BACK-END — ESTRUTURA

Criar:

```text
backend/src/modulos/estoque/
```

Seguir o padrão dos módulos existentes.

Conceitualmente:

```text
estoque/
├── controladores/
├── servicos/
├── repositorios/
├── schemas/
├── tipos/
└── rotas/
```

Adaptar à estrutura real.

---

# 32. REPOSITÓRIO

Criar métodos especializados para:

```text
listarEstoque()
listarMovimentacoes()
buscarEstoqueProduto()
registrarAjuste()
```

Evitar colocar queries diretamente em controllers.

---

# 33. REFINAMENTO DAS QUERIES

A Feature 7 prevê:

> refinamento de queries na tabela `movimentacoes_estoque`.

Portanto:

* avaliar índices;
* avaliar joins;
* avaliar filtros;
* avaliar paginação;
* avaliar ordenação por data;
* evitar N+1 queries;
* selecionar apenas os campos necessários.

Não fazer otimizações prematuras sem evidência.

---

# 34. ÍNDICES

Avaliar necessidade de índices para:

```text
produto_id
tipo
criado_em
tipo_referencia
referencia_id
```

Criar apenas os índices que fizerem sentido para as consultas implementadas.

Se forem criados índices:

* adicionar migration;
* verificar impacto;
* documentar.

---

# 35. ZOD

Criar schemas para:

```text
consulta de estoque
filtros
consulta de movimentações
ajuste de estoque
parâmetros de rota
```

Validar:

```text
produto_id
quantidade
observacao
tipo/filtros
datas
paginação
```

A validação deverá ocorrer no back-end.

---

# 36. REGRAS DE QUANTIDADE

Para ajustes:

```text
quantidade != 0
```

deve ser obrigatório.

Não permitir um ajuste que não produza alteração.

Exemplo inválido:

```text
Ajuste: 0
```

Retornar erro de validação.

---

# 37. LIMITE DE AJUSTE

Não inventar limites máximos de quantidade se o documento não os definir.

Entretanto, garantir:

```text
valor válido
inteiro quando aplicável
resultado >= 0
```

e evitar overflow ou valores absurdamente grandes através das validações adequadas ao banco.

---

# 38. FRONT-END

Criar:

```text
frontend/src/servicos/estoque.ts
```

Criar:

```text
frontend/src/tipos/estoque.ts
```

ou seguir a organização já existente.

---

# 39. PÁGINA DE ESTOQUE

Criar:

```text
Estoque
```

com visão consolidada.

Estrutura sugerida:

```text
Estoque

[ Buscar produto... ] [ Status ] [ Estoque baixo ]

--------------------------------------------------
Produto       Estoque       Status       Ações
--------------------------------------------------
Produto A        25         Normal       Histórico
Produto B         3         Baixo        Histórico
Produto C         0         Sem estoque  Histórico
--------------------------------------------------

                     < 1 2 3 >
```

---

# 40. INDICADORES

Se fizer sentido com o Design System existente, apresentar no topo:

```text
Total de produtos
Produtos com estoque baixo
Produtos sem estoque
```

Não criar indicadores financeiros ou dashboards nesta feature.

---

# 41. ALERTA DE ESTOQUE BAIXO

Destacar visualmente:

```text
Estoque baixo
```

e:

```text
Sem estoque
```

Utilizar os componentes/badges existentes.

Não utilizar cores ou padrões visuais inconsistentes com o Design System.

---

# 42. HISTÓRICO

Disponibilizar ação:

```text
Ver histórico
```

Ao acessar:

```text
Histórico de Movimentações
```

Exibir:

```text
Data
Produto
Tipo
Quantidade
Origem
Observação
```

---

# 43. FILTROS DO HISTÓRICO

Interface:

```text
Produto
[ Todos ]

Tipo
[ Todos ]

Período
[ Data inicial ] [ Data final ]

[ Filtrar ]
```

A consulta deverá ser feita na API.

---

# 44. MODAL DE AJUSTE

Disponibilizar:

```text
[ Ajustar estoque ]
```

Abrir modal:

```text
Ajuste de Estoque

Produto
[ Produto selecionado ]

Estoque atual
25 unidades

Tipo de ajuste
(+) Entrada
(-) Saída

Quantidade
[ 5 ]

Novo estoque
30 unidades

Justificativa
[ __________________________ ]

[ Cancelar ] [ Confirmar ajuste ]
```

A interface deverá deixar explícito o efeito do ajuste.

---

# 45. CONFIRMAÇÃO

Antes de efetivar:

```text
Confirmar ajuste?
```

Exemplo:

```text
Produto: Papel A4
Estoque atual: 25
Ajuste: -5
Novo estoque: 20

Justificativa:
Contagem física

[ Cancelar ] [ Confirmar ]
```

A Feature 7 exige modal de ajuste com confirmação.

---

# 46. PRÉVIA DO NOVO ESTOQUE

Enquanto o usuário informa:

```text
tipo
quantidade
```

calcular no front-end:

```text
Novo estoque
```

Exemplo:

```text
Estoque atual: 25
Ajuste: -5
Novo estoque: 20
```

Porém:

> o cálculo do front-end é apenas informativo.

O back-end deverá recalcular/validar o resultado.

---

# 47. BLOQUEIO DE ESTOQUE NEGATIVO NO FRONT

Se:

```text
estoque atual = 3
ajuste = -5
```

mostrar:

```text
Estoque insuficiente para este ajuste.
```

e impedir confirmação na interface.

Mas o back-end também deverá validar.

---

# 48. TRATAMENTO DE CONCORRÊNCIA

Se o estoque mudar entre:

```text
visualização
```

e:

```text
confirmação
```

o back-end deverá ser responsável pela decisão final.

Exemplo:

```text
Tela mostra:
Estoque = 10

Outro usuário altera:
Estoque = 3

Usuário confirma:
Ajuste -5
```

O back-end deverá impedir o resultado negativo.

O front-end deverá apresentar a mensagem de erro retornada pela API.

---

# 49. FEEDBACK DE SUCESSO

Após ajuste:

```text
Ajuste realizado com sucesso.
```

Atualizar:

```text
estoque atual
histórico
```

sem exigir refresh completo da aplicação quando o padrão atual permitir atualização local/revalidação da query.

---

# 50. FEEDBACK DE ERRO

Mensagens amigáveis:

```text
Produto não encontrado.
Produto inativo.
Quantidade inválida.
O ajuste resultaria em estoque negativo.
Não foi possível realizar o ajuste.
```

Não exibir:

```text
SQL
stack trace
detalhes internos
```

---

# 51. ESTADO DE CARREGAMENTO

Implementar estados para:

```text
Carregando estoque...
Carregando movimentações...
Registrando ajuste...
```

Evitar múltiplos submits.

---

# 52. ESTADO VAZIO

Caso não existam movimentações:

```text
Nenhuma movimentação encontrada.
```

Caso não existam produtos:

```text
Nenhum produto encontrado.
```

Não deixar tabelas vazias sem explicação.

---

# 53. RESPONSIVIDADE

Validar:

```text
Desktop
Tablet
Mobile
```

No mobile:

* tabela deve possuir estratégia adequada de visualização;
* filtros devem ser utilizáveis;
* modal não pode ultrapassar a tela;
* ações devem permanecer acessíveis.

---

# 54. AUTENTICAÇÃO

Utilizar a autenticação já existente.

Não criar:

```text
novo login
novo token
nova sessão
novo middleware
```

---

# 55. AUTORIZAÇÃO

Utilizar o mecanismo de autorização existente.

Ajuste de estoque é uma operação sensível.

Portanto:

* validar autorização no back-end;
* não confiar apenas em botões ocultos;
* respeitar o modelo de permissões existente.

Se o projeto já possuir diferenciação entre `ADMINISTRADOR` e `USUARIO`, utilizar essa regra existente.

Não criar uma nova matriz de permissões sem especificação.

---

# 56. AUDITORIA

Não implementar o módulo completo de Auditoria nesta feature.

Entretanto, não remover ou quebrar qualquer mecanismo de auditoria já existente.

Se o sistema já possuir integração automática de auditoria para alterações críticas, garantir que o ajuste seja compatível com ela.

A auditoria completa está prevista posteriormente no roadmap.

---

# 57. TESTES — LISTAGEM

Testar:

```text
✓ lista produtos
✓ retorna estoque atual
✓ pagina corretamente
✓ aplica busca
✓ aplica filtros
✓ identifica estoque baixo
✓ identifica estoque zero
```

---

# 58. TESTES — MOVIMENTAÇÕES

Testar:

```text
✓ retorna ENTRADAS de compras
✓ retorna SAIDAS de vendas
✓ retorna AJUSTES
✓ filtra por tipo
✓ filtra por produto
✓ filtra por período
✓ pagina histórico
✓ mantém ordenação
```

---

# 59. TESTE — AJUSTE POSITIVO

Cenário:

```text
Estoque = 10
Ajuste = +5
```

Resultado:

```text
Estoque = 15
```

E:

```text
movimentação = AJUSTE
quantidade = +5
```

ou a representação equivalente definida pelo modelo.

---

# 60. TESTE — AJUSTE NEGATIVO

Cenário:

```text
Estoque = 10
Ajuste = -3
```

Resultado:

```text
Estoque = 7
```

Criar:

```text
movimentação = AJUSTE
```

---

# 61. TESTE — AJUSTE PARA ZERO

Cenário:

```text
Estoque = 10
Ajuste = -10
```

Resultado:

```text
Estoque = 0
```

Permitido.

---

# 62. TESTE — AJUSTE ABAIXO DE ZERO

Cenário:

```text
Estoque = 10
Ajuste = -11
```

Resultado:

```text
❌ operação rejeitada
```

Garantir:

```text
estoque continua = 10
```

e:

```text
nenhuma movimentação AJUSTE criada
```

---

# 63. TESTE — ROLLBACK

Forçar erro durante o registro do ajuste.

Exemplo:

```text
Atualização de estoque
       ↓
erro ao registrar movimentação
```

Verificar:

```text
✓ estoque volta ao valor anterior
✓ movimentação não persiste
```

---

# 64. TESTE — CONCORRÊNCIA

Criar cenário de duas operações simultâneas.

Exemplo:

```text
Estoque = 10

Ajuste A = -7
Ajuste B = -6
```

Resultado:

```text
uma operação pode ser concluída
outra deve ser rejeitada
```

Mas:

```text
NUNCA estoque < 0
```

---

# 65. TESTE — HISTÓRICO

Depois de:

```text
Compra +10
Venda -3
Ajuste +2
```

o histórico deverá conter:

```text
ENTRADA +10
SAIDA   -3
AJUSTE  +2
```

E o estoque final deverá ser:

```text
9
```

O histórico deverá preservar as três operações.

---

# 66. TESTE — IMUTABILIDADE

Após criar uma movimentação:

```text
não permitir alteração
não permitir exclusão
```

Garantir que não existam endpoints ou serviços que modifiquem o histórico.

---

# 67. TESTES DE INTEGRAÇÃO

Testar o fluxo:

```text
Compra
 ↓
ENTRADA
 ↓
Estoque

Venda
 ↓
SAIDA
 ↓
Estoque

Ajuste
 ↓
AJUSTE
 ↓
Estoque
```

Garantir que todas as operações utilizem a mesma fonte de estoque.

---

# 68. TESTES FRONT-END

Utilizar:

```text
Vitest
React Testing Library
```

Testar:

```text
✓ renderização da página
✓ carregamento do estoque
✓ busca
✓ filtros
✓ estoque baixo
✓ estoque zero
✓ histórico
✓ filtros do histórico
✓ abertura do modal
✓ seleção do produto
✓ exibição do estoque atual
✓ seleção do tipo
✓ quantidade
✓ cálculo do novo estoque
✓ validação
✓ confirmação
✓ loading
✓ sucesso
✓ erro
✓ atualização após ajuste
```

---

# 69. NÃO IMPLEMENTAR

Nesta feature NÃO implementar:

```text
❌ Financeiro completo
❌ Relatórios
❌ Dashboard
❌ Auditoria completa
❌ Importação XML
❌ Aplicativo Android
❌ Controle de lote
❌ Controle de validade
❌ Inventário complexo
❌ Múltiplos depósitos
```

Essas funcionalidades não fazem parte do escopo desta etapa.

A próxima feature planejada após Estoque é:

> **Feature 8 — Controle Financeiro Completo**.

---

# 70. NÃO ALTERAR FEATURES ANTERIORES

Não modificar desnecessariamente:

```text
Autenticação
Usuários
Produtos
Fornecedores
Clientes
Compras
Vendas
```

Se for necessário alterar algum código anterior:

1. explicar a necessidade;
2. alterar somente o necessário;
3. executar os testes existentes;
4. garantir ausência de regressões.

---

# 71. CRITÉRIOS DE ACEITE

A Feature 7 somente poderá ser considerada concluída quando:

```text
[✓] Módulo estoque
[✓] Queries de estoque
[✓] Queries de movimentações
[✓] GET /api/estoque
[✓] GET /api/estoque/movimentacoes
[✓] POST /api/estoque/ajustes
[✓] Listagem consolidada
[✓] Paginação
[✓] Filtros
[✓] Busca
[✓] Alerta de estoque baixo
[✓] Identificação de estoque zero
[✓] Histórico ENTRADA
[✓] Histórico SAIDA
[✓] Histórico AJUSTE
[✓] Histórico preservado
[✓] Ajuste positivo
[✓] Ajuste negativo
[✓] Bloqueio de estoque negativo
[✓] Transação de ajuste
[✓] Rollback
[✓] Proteção contra concorrência
[✓] Validação Zod
[✓] Serviço de API
[✓] Tipos TypeScript
[✓] Página de Estoque
[✓] Histórico
[✓] Modal de ajuste
[✓] Confirmação
[✓] Prévia do novo estoque
[✓] Tratamento de erros
[✓] Feedback de sucesso
[✓] Loading
[✓] Estado vazio
[✓] Responsividade
[✓] Testes back-end
[✓] Testes de integração
[✓] Testes de concorrência
[✓] Testes de rollback
[✓] Testes front-end
```

---

# 72. PROCEDIMENTO DE IMPLEMENTAÇÃO

Executar nesta ordem.

## ETAPA 1 — ANÁLISE

Analisar:

```text
schema.prisma
movimentacoes_estoque
produtos
compras
vendas
services
repositories
controllers
rotas
Zod
autorização
front-end
Design System
testes
```

## ETAPA 2 — BANCO

Verificar se são necessárias:

```text
alterações de schema
índices
campo de observação
enums
constraints
```

Criar migration somente se necessária.

## ETAPA 3 — BACK-END

Implementar:

```text
schemas
repositories
services
controllers
rotas
```

## ETAPA 4 — AJUSTE TRANSACIONAL

Implementar:

```text
registrarAjuste()
```

com:

```text
validação
+
atualização do estoque
+
movimentação AJUSTE
```

em uma única transação.

## ETAPA 5 — CONSULTAS

Implementar:

```text
GET /api/estoque
GET /api/estoque/movimentacoes
```

com paginação e filtros.

## ETAPA 6 — FRONT-END

Implementar:

```text
tipos
serviço API
página Estoque
tabela
filtros
histórico
modal
confirmação
feedbacks
```

## ETAPA 7 — TESTES

Executar:

```text
unitários
integração
ajuste positivo
ajuste negativo
estoque zero
estoque negativo
rollback
concorrência
histórico
front-end
```

## ETAPA 8 — VALIDAÇÃO FINAL

Executar:

```text
lint
testes
build
servidor
teste manual
responsividade
```

---

# 73. TESTE MANUAL COMPLETO

Executar no navegador:

```text
1. Fazer login
2. Abrir Estoque
3. Consultar produtos
4. Verificar quantidade atual
5. Verificar alerta de estoque baixo
6. Verificar produtos sem estoque
7. Abrir histórico
8. Filtrar por produto
9. Filtrar por tipo
10. Filtrar por período
11. Abrir Ajuste de Estoque
12. Selecionar produto
13. Conferir estoque atual
14. Informar ajuste positivo
15. Conferir novo estoque
16. Confirmar
17. Verificar estoque atualizado
18. Verificar movimentação AJUSTE
19. Realizar ajuste negativo
20. Testar tentativa de estoque negativo
21. Confirmar bloqueio
22. Verificar que nenhum histórico inválido foi criado
23. Testar responsividade
```

---

# 74. RELATÓRIO FINAL

Ao concluir, apresentar:

```text
1. Arquivos criados
2. Arquivos alterados
3. Migration
4. Alterações no Prisma
5. Índices criados
6. Endpoints
7. Regras de negócio
8. Estratégia de atualização de estoque
9. Estratégia transacional
10. Estratégia contra concorrência
11. Estratégia de rollback
12. Estratégia de preservação histórica
13. Implementação de AJUSTE
14. Implementação de alertas
15. Componentes front-end
16. Testes implementados
17. Resultado dos testes
18. Resultado do teste de concorrência
19. Resultado do teste de rollback
20. Resultado do build
21. Resultado do teste manual
22. Problemas encontrados
23. Decisões arquiteturais
24. Pendências
```

Não declarar a feature como concluída se houver:

```text
erro de compilação
teste quebrado
estoque negativo
histórico inconsistente
movimentação perdida
rollback incompleto
problema de concorrência
ajuste parcial
endpoint incompleto
front-end incompleto
```

---

# 75. PRINCÍPIO FINAL

O estoque é uma parte central do sistema.

A implementação deve garantir:

```text
              ESTOQUE
                 │
        ┌────────┼────────┐
        │        │        │
     COMPRA    VENDA    AJUSTE
        │        │        │
     ENTRADA    SAIDA    AJUSTE
        │        │        │
        └────────┼────────┘
                 │
                 ▼
        HISTÓRICO PRESERVADO
```

O estoque atual deve permanecer consistente com as operações realizadas.

A regra fundamental é:

```text
NUNCA PERMITIR ESTOQUE NEGATIVO
```

E toda alteração manual deve gerar seu respectivo histórico:

```text
Ajuste
  ↓
Atualização de estoque
  +
Movimentação AJUSTE
  ↓
COMMIT
```

ou:

```text
Qualquer erro
      ↓
ROLLBACK
```

A arquitetura exige simplicidade, segurança, regras de negócio no back-end, integridade dos dados, operações de estoque transacionais, histórico preservado, modularidade e testabilidade.

**Não antecipar a Feature 8.**

Ao concluir esta etapa, a próxima implementação do roadmap será:

> **Feature 8 — Controle Financeiro Completo**
