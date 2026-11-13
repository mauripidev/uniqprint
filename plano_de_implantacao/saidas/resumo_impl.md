# Relatório de Implementação — Feature 6: Registro de Vendas e Baixa Atômica de Estoque

A **Feature 6 — Registro de Vendas e Baixa Atômica de Estoque** foi implementada com sucesso de ponta a ponta (banco de dados, back-end, front-end e testes automatizados), atendendo rigorosamente à regra de implementação vertical e a todos os critérios de integridade e segurança de dados do projeto.

---

## 1. Arquivos Criados

### Back-end & Banco de Dados:
- `backend/prisma/migrations/20260915220547_criar_tabela_vendas/migration.sql`
- [venda_dto.ts](file:///c:/projetos/uniqprint/backend/src/modulos/vendas/dtos/venda_dto.ts)
- [repositorio_vendas.ts](file:///c:/projetos/uniqprint/backend/src/modulos/vendas/repositorios/repositorio_vendas.ts)
- [servico_vendas.ts](file:///c:/projetos/uniqprint/backend/src/modulos/vendas/servicos/servico_vendas.ts)
- [controlador_vendas.ts](file:///c:/projetos/uniqprint/backend/src/modulos/vendas/controladores/controlador_vendas.ts)
- [rotas_vendas.ts](file:///c:/projetos/uniqprint/backend/src/modulos/vendas/rotas/rotas_vendas.ts)
- [servico_vendas.test.ts](file:///c:/projetos/uniqprint/backend/src/modulos/vendas/servicos/servico_vendas.test.ts)
- [rotas_vendas.test.ts](file:///c:/projetos/uniqprint/backend/src/modulos/vendas/rotas/rotas_vendas.test.ts)

### Front-end:
- [vendas.ts (tipos)](file:///c:/projetos/uniqprint/frontend/src/tipos/vendas.ts)
- [vendas.ts (serviço)](file:///c:/projetos/uniqprint/frontend/src/servicos/vendas.ts)
- [ModalRegistroVenda.tsx](file:///c:/projetos/uniqprint/frontend/src/paginas/vendas/ModalRegistroVenda.tsx)
- [TelaVendas.tsx](file:///c:/projetos/uniqprint/frontend/src/paginas/vendas/TelaVendas.tsx)
- [vendas.test.tsx](file:///c:/projetos/uniqprint/frontend/src/testes/vendas.test.tsx)

---

## 2. Arquivos Alterados

- [schema.prisma](file:///c:/projetos/uniqprint/backend/prisma/schema.prisma): Adicionado modelo `Venda` e relações `vendas Venda[]` nos modelos `Cliente` e `Produto`.
- [aplicativo.ts](file:///c:/projetos/uniqprint/backend/src/aplicativo.ts): Registrado o roteador `rotasVendas`.
- [LayoutPrincipal.tsx](file:///c:/projetos/uniqprint/frontend/src/layouts/LayoutPrincipal.tsx): Adicionado link de navegação "Vendas" no menu superior.
- [AppRotas.tsx](file:///c:/projetos/uniqprint/frontend/src/rotas/AppRotas.tsx): Registrada a rota `/vendas` para renderizar `TelaVendas`.

---

## 3. Migration e Modelo Prisma

Migration aplicada: `20260915220547_criar_tabela_vendas`.

```prisma
model Venda {
  id             Int       @id @default(autoincrement())
  data_venda     DateTime  @default(now())
  cliente_id     Int
  produto_id     Int
  quantidade     Int
  valor_unitario Decimal   @db.Decimal(15, 2)
  valor_total    Decimal   @db.Decimal(15, 2)
  criado_em      DateTime  @default(now())
  atualizado_em  DateTime  @updatedAt

  cliente        Cliente   @relation(fields: [cliente_id], references: [id])
  produto        Produto   @relation(fields: [produto_id], references: [id])

  @@map("vendas")
}
```

---

## 4. Endpoints da API

Todas as rotas exigem autenticação ativa (`verificarAutenticacao`):

| Método | Rota | Descrição | Status Sucesso |
|---|---|---|---|
| `POST` | `/api/vendas` | Registra venda e processa baixa atômica de estoque e financeiro | 201 Created |
| `GET` | `/api/vendas` | Lista vendas com paginação (`pagina`, `limite`) e filtros (`data_inicio`, `data_fim`, `cliente_id`, `produto_id`) | 200 OK |
| `GET` | `/api/vendas/:id` | Busca detalhes completos de uma venda por ID | 200 OK |

---

## 5. Estratégia Transacional e Proteção contra Concorrência

A verificação e baixa do estoque são executadas de forma **estritamente atômica** via transação interativa do Prisma (`prisma.$transaction`):

```ts
const resultadoUpdate = await tx.produto.updateMany({
  where: {
    id: dados.produto_id,
    ativo: true,
    quantidade_estoque: {
      gte: dados.quantidade
    }
  },
  data: {
    quantidade_estoque: {
      decrement: dados.quantidade
    }
  }
});

if (resultadoUpdate.count === 0) {
  const produtoAtual = await tx.produto.findUnique({ where: { id: dados.produto_id } });
  if (!produtoAtual) throw new ErroAplicacao("Produto não encontrado", "PRODUTO_NAO_ENCONTRADO", 404);
  if (!produtoAtual.ativo) throw new ErroAplicacao("Não é possível registrar venda para produto inativo", "PRODUTO_INATIVO", 400);
  throw new ErroAplicacao(
    `Estoque insuficiente para realizar esta venda. Estoque disponível: ${produtoAtual.quantidade_estoque}, Quantidade solicitada: ${dados.quantidade}`,
    "ESTOQUE_INSUFICIENTE",
    400
  );
}
```

### Por que isso garante segurança contra concorrência?
- No MySQL (InnoDB), a cláusula `UPDATE ... WHERE id = ? AND quantidade_estoque >= ?` adquire um lock exclusivo de linha (*exclusive row lock*).
- Se duas requisições concorrentes solicitarem 4 unidades simultaneamente de um produto que possui estoque 5:
  1. A primeira transação a obter o lock valida que `5 >= 4`, decrementa o saldo para `1` e retorna `count === 1`.
  2. A segunda transação é enfileirada e espera a liberação do lock. Ao ser executada, avalia a condição com base no novo saldo persistido (`1 >= 4` é falso).
  3. `resultadoUpdate.count` retorna `0`, disparando imediatamente a exceção `ESTOQUE_INSUFICIENTE` e abortando a segunda transação via rollback seguro.
- O saldo final no banco é exatamente `1` e **jamais negativo**.

---

## 6. Movimentações e Lançamentos Criados na Transação

Em cada venda realizada com sucesso:
1. **Movimentação de Estoque**:
   - `tipo`: `"SAIDA"`
   - `quantidade`: `dados.quantidade`
   - `tipo_referencia`: `"VENDA"`
   - `referencia_id`: `venda.id`
   - `observacao`: `"Saída referente à venda #${venda.id}"`
2. **Lançamento Financeiro**:
   - `tipo`: `"ENTRADA"`
   - `valor`: `venda.valor_total`
   - `data_lancamento`: `venda.data_venda`
   - `categoria`: `"VENDA"`
   - `tipo_referencia`: `"VENDA"`
   - `referencia_id`: `venda.id`
   - `observacao`: `"Lançamento automático de entrada pela venda #${venda.id} (Cliente: ${dados.cliente_nome})"`

Se qualquer etapa falhar (inclusive movimentação ou financeiro), o bloco do Prisma executa **rollback completo**, garantindo que nenhuma entidade órfã permaneça.

---

## 7. Experiência e Recursos do Front-end

- **Consulta em Tempo Real do Estoque**: Ao selecionar um produto no `<ModalRegistroVenda>`, a tela invoca `buscarProdutoPorId(id)` no back-end e apresenta o saldo atualizado em tempo real: `Estoque disponível: X unidades`.
- **Bloqueio no Front-end**: Se o operador digitar uma quantidade superior ao estoque disponível, o botão de registrar venda é desabilitado e a mensagem `Estoque insuficiente` é exibida.
- **Prévia de Total**: Cálculo em tempo real de `quantidade × valor_unitario` com indicação visual de que o cálculo oficial é conferido no servidor.
- **Tratamento Amigável de Erro**: Caso o estoque tenha sido consumido por outro usuário antes da submissão, a mensagem amigável é exibida:
  > *"Não foi possível realizar a venda. O estoque disponível foi alterado antes da conclusão da operação. Atualize o estoque e tente novamente."*
  E o estoque em tela é automaticamente re-sincronizado.
- **Listagem e Filtros**: Tela completa de histórico com paginação, visualização de quantidade vendida com indicador negativo (`-X un`), status `Concluída`, formatação monetária e filtros por período, cliente e produto.

---

## 8. Resultados da Verificação e Testes

### Back-end (12 arquivos de teste / 96 testes — 100% aprovados):
- `src/modulos/vendas/servicos/servico_vendas.test.ts` (11 testes):
  - ✓ Venda com dados válidos e total oficial
  - ✓ Rejeição de cliente inexistente (404) e inativo (400)
  - ✓ Rejeição de produto inexistente (404) e inativo (400)
  - ✓ Rejeição de quantidade maior que estoque (`ESTOQUE_INSUFICIENTE`)
  - ✓ Rejeição de quantidade inválida (0, negativa, decimal)
  - ✓ Rejeição de valor unitário inválido (0, negativo)
  - ✓ Consulta por ID e listagem com paginação e filtros
- `src/modulos/vendas/rotas/rotas_vendas.test.ts` (12 testes):
  - ✓ Bloqueio 401 sem autenticação
  - ✓ Fluxo completo: baixa de estoque, movimentação SAIDA e financeiro ENTRADA
  - ✓ Estoque insuficiente rejeita com 400 `ESTOQUE_INSUFICIENTE` sem alterar dados
  - ✓ Estoque zero bloqueia operação
  - ✓ Venda de estoque exato conclui e zera estoque
  - ✓ **Teste de Concorrência**: duas vendas concorrentes para estoque insuficiente garantem que apenas uma passe e o saldo nunca fique negativo
  - ✓ **Teste de Rollback**: falha forçada reverte todas as tabelas e preserva estoque original
  - ✓ Listagem e busca por ID via HTTP

### Front-end (6 arquivos de teste / 33 testes — 100% aprovados):
- `src/testes/vendas.test.tsx` (8 testes):
  - ✓ Renderização da tabela com vendas
  - ✓ Abertura do modal e carregamento dinâmico de clientes e produtos
  - ✓ Consulta e exibição do estoque em tempo real ao selecionar produto
  - ✓ Cálculo da prévia do total
  - ✓ Bloqueio no front-end por estoque insuficiente
  - ✓ Validação de campos obrigatórios
  - ✓ Registro de venda com sucesso e atualização da listagem
  - ✓ Tratamento amigável do erro `ESTOQUE_INSUFICIENTE`

### Builds de Produção:
- `backend`: `tsc` executado sem erros (código de saída 0).
- `frontend`: `tsc && vite build` concluído com sucesso em 10.06s (código de saída 0).
