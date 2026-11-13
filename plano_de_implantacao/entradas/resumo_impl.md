# Walkthrough — Feature 5: Registro de Compras e Entrada de Estoque

Implementação completa e vertical da **Feature 5: Registro de Compras e Entrada de Estoque** para o sistema **Uniqprint — Controle de Compras e Vendas**.

---

## 1. O Que Foi Implementado

### A. Banco de Dados / Prisma
- **Modelo `Compra`** (`compras`):
  - `id`: Identificador autoincremental
  - `data_compra`: Data da operação
  - `produto_id`: Chave estrangeira para `produtos.id`
  - `quantidade`: Quantidade comprada (inteiro > 0)
  - `valor_unitario`: `Decimal(15, 2)`
  - `valor_total`: `Decimal(15, 2)` (calculado oficialmente no back-end)
  - `fornecedor_id`: Chave estrangeira para `fornecedores.id`
  - `criado_em` e `atualizado_em`
- **Modelo `MovimentacaoEstoque`** (`movimentacoes_estoque`):
  - `id`, `produto_id`, `tipo` (`ENTRADA`), `quantidade`, `tipo_referencia` (`COMPRA`), `referencia_id` (`compra.id`), `observacao`, `criado_em`
- **Modelo `LancamentoFinanceiro`** (`lancamentos_financeiros`):
  - `id`, `tipo` (`SAIDA`), `descricao`, `valor` (`Decimal(15, 2)`), `data_lancamento`, `categoria` (`COMPRA`), `tipo_referencia` (`COMPRA`), `referencia_id` (`compra.id`), `observacao`, `criado_em`, `atualizado_em`
- **Relações nos modelos existentes:**
  - `Produto` atualizado com `compras Compra[]` e `movimentacoes_estoque MovimentacaoEstoque[]`
  - `Fornecedor` atualizado com `compras Compra[]`
- **Migration criada e aplicada com sucesso:**
  - `backend/prisma/migrations/20260907184758_criar_tabelas_compras_estoque_financeiro/migration.sql`

---

### B. Back-end (`backend/src/modulos/compras`)
- **`dtos/compra_dto.ts`**:
  - Schemas Zod de validação para registro (`schemaCriarCompra`) e consulta paginada com filtros (`schemaConsultarCompras`).
- **`repositorios/repositorio_compras.ts`**:
  - `buscarPorId(id)` com includes de produto e fornecedor.
  - `listar(filtros)` com paginação e filtros por período (`data_inicio`, `data_fim`), produto e fornecedor.
  - `executarTransacaoCompra(dados)`: Executa transação atômica usando `prisma.$transaction`. Garante o incremento atômico seguro contra concorrência (`quantidade_estoque: { increment: quantidade }`), gravação da movimentação `ENTRADA` e lançamento financeiro `SAIDA`.
- **`servicos/servico_compras.ts`**:
  - Validações de regra de negócio: fornecedor existente e ativo, produto existente e ativo, quantidade inteira positiva, valor unitário positivo.
  - Cálculo oficial do `valor_total = quantidade * valor_unitario`.
  - Orquestração da transação.
- **`controladores/controlador_compras.ts`**:
  - Métodos `criar`, `listar` e `buscarPorId`.
- **`rotas/rotas_compras.ts`**:
  - `POST /api/compras`
  - `GET /api/compras`
  - `GET /api/compras/:id`
  - Todas sob middleware `verificarAutenticacao`.
- **`aplicativo.ts`**:
  - Registro de `rotasCompras`.

---

### C. Front-end (`frontend/src`)
- **`tipos/compras.ts`**:
  - Tipos TypeScript para Compra, DTOs e respostas da API.
- **`servicos/compras.ts`**:
  - Funções de integração `listarCompras`, `buscarCompraPorId`, `registrarCompra`.
- **`paginas/compras/ModalRegistroCompra.tsx`**:
  - Carregamento dinâmico de produtos e fornecedores ativos.
  - Inputs para Fornecedor, Produto, Quantidade, Valor Unitário e Data.
  - **Cálculo da prévia do valor total em tempo real** formatado em Real (`R$`).
  - Prevenção de múltiplos cliques/submissões com estado de `salvando`.
  - Tratamento de mensagens amigáveis de erro e rollback.
- **`paginas/compras/TelaCompras.tsx`**:
  - Tabela responsiva com Data, Fornecedor, Produto, Quantidade, Valor Unitário, Valor Total e Badge.
  - Barra de ferramentas com filtros por período (`Data inicial`, `Data final`), filtro por Fornecedor e filtro por Produto.
  - Botão de limpar filtros.
  - Paginação completa.
- **`layouts/LayoutPrincipal.tsx`**:
  - Adicionado link de navegação "Compras" com ícone `ShoppingCart`.
- **`rotas/AppRotas.tsx`**:
  - Rota protegida `/compras` mapeada para `TelaCompras`.

---

## 2. Testes Automatizados e Validação

### Testes do Back-end
Executados com `npm.cmd test`:
- `src/modulos/compras/servicos/servico_compras.test.ts` (10 testes unitários)
- `src/modulos/compras/rotas/rotas_compras.test.ts` (testes de integração HTTP e **teste de atomicidade**)
- **Resultado:** **10 arquivos de teste aprovados (74 testes no total)**.

> [!NOTE]
> **Teste de Atomicidade Validado:**
> Foi forçada uma falha na etapa financeira dentro de uma transação com compra e incremento de estoque. O teste comprovou que o rollback foi imediato e absoluto: a compra não foi gravada, o estoque retornou ao estado anterior, e nenhuma movimentação ou lançamento financeiro residual permaneceu no banco.

### Testes do Front-end
Executados com `npm.cmd test`:
- `src/testes/compras.test.tsx` (5 testes com Vitest e Testing Library)
  - Renderização da tabela com compras vindas da API
  - Carregamento de fornecedores e produtos ativos no modal
  - Cálculo dinâmico da prévia de valor total
  - Validação de campos obrigatórios
  - Registro de compra com sucesso e feedback visual
- **Resultado:** **5 arquivos de teste aprovados (25 testes no total)**.

### Compilação de Produção
- `backend`: `npm.cmd run build` (0 erros TypeScript).
- `frontend`: `npm.cmd run build` (0 erros TypeScript / Vite).

---

## 3. Verificação Manual no Navegador

Como ambos os servidores estão em execução:
- **Backend:** `http://localhost:3001`
- **Frontend:** `http://localhost:5173`

Passos para testar no seu navegador:
1. Acesse `http://localhost:5173/login`
2. Faça login com:
   - **E-mail:** `admin@uniqprint.com.br`
   - **Senha:** `admin123`
3. No menu superior, clique em **Compras** (`/compras`).
4. Clique em **+ Nova Compra**.
5. Selecione um fornecedor e um produto (observe o estoque exibido).
6. Digite a quantidade e o valor unitário e veja a prévia calculando em tempo real.
7. Clique em **Registrar compra**.
8. Observe o alerta de sucesso e a nova linha na tabela.
9. Navegue para **Produtos** e confira que o estoque foi incrementado com exatidão.
