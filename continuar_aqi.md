# Feature 7 — Gestão e Ajustes Manuais de Estoque

Implementação completa do módulo de estoque, incluindo visão consolidada de produtos com alertas, histórico de movimentações (ENTRADA, SAIDA, AJUSTE), e ajustes manuais transacionais com proteção contra concorrência e estoque negativo.

## Análise do Codebase Atual

O projeto segue um padrão vertical consistente:
- **Backend**: Fastify + Prisma + MySQL, com camadas `dtos/` (schemas Zod), `repositorios/`, `servicos/`, `controladores/`, `rotas/`
- **Frontend**: React + React Router + CSS custom (dark theme premium), com `tipos/`, `servicos/`, `paginas/`
- **Schema Prisma**: Já possui `MovimentacaoEstoque` com campos `tipo`, `quantidade`, `tipo_referencia`, `referencia_id`, `observacao`
- **Padrão transacional**: Vendas usam `updateMany` com WHERE condicional para lock otimista; Compras usam `increment`
- **Autenticação**: `verificarAutenticacao` + `verificarPapel(["ADMINISTRADOR"])` disponível

> [!IMPORTANT]
> O campo `observacao` já existe em `movimentacoes_estoque` no schema Prisma — **não é necessária migration**.

> [!NOTE]
> O campo `quantidade` em `movimentacoes_estoque` é do tipo `Int` (sempre positivo). As features 5 e 6 armazenam quantidades positivas. Para ajustes, usaremos o mesmo padrão: `quantidade` é sempre positiva, e o `tipo = "AJUSTE"` combinado com `tipo_referencia = "AJUSTE_ENTRADA"` ou `"AJUSTE_SAIDA"` indica a direção. Isso mantém consistência com o modelo existente.

---

## Proposed Changes

### Backend — Módulo Estoque

#### [NEW] [estoque_dto.ts](file:///c:/projetos/uniqprint/backend/src/modulos/estoque/dtos/estoque_dto.ts)

Schemas Zod para validação:
- `schemaConsultarEstoque` — filtros: `pagina`, `limite`, `busca`, `status` (todos/normal/baixo/sem_estoque)
- `schemaConsultarMovimentacoes` — filtros: `pagina`, `limite`, `produto_id`, `tipo` (ENTRADA/SAIDA/AJUSTE), `data_inicio`, `data_fim`
- `schemaRegistrarAjuste` — campos: `produto_id`, `tipo_ajuste` (ENTRADA/SAIDA), `quantidade` (inteiro positivo, ≠ 0), `observacao` (string obrigatória, mín 3 chars)

---

#### [NEW] [repositorio_estoque.ts](file:///c:/projetos/uniqprint/backend/src/modulos/estoque/repositorios/repositorio_estoque.ts)

Interface `RepositorioEstoque` + implementação `RepositorioEstoquePrisma`:
- `listarEstoque(filtros)` — query em `produtos` com paginação, busca por descrição, filtro por status de estoque. Retorna `{produtos, total, resumo: {total_produtos, estoque_baixo, sem_estoque}}`
- `listarMovimentacoes(filtros)` — query em `movimentacoes_estoque` com include `produto`, filtros por tipo/produto/período, ordenação por `criado_em desc`
- `executarTransacaoAjuste(dados)` — transação Prisma:
  1. Se AJUSTE_ENTRADA: `produto.update` com `increment`
  2. Se AJUSTE_SAIDA: `updateMany` com WHERE `quantidade_estoque >= dados.quantidade` (padrão de concorrência das vendas)
  3. Criar `movimentacaoEstoque` com `tipo = "AJUSTE"`, `tipo_referencia = "AJUSTE_ENTRADA"/"AJUSTE_SAIDA"`
  4. Retornar movimentação criada com include produto

> [!IMPORTANT]
> Para alerta de estoque baixo, usaremos um limiar de **5 unidades** (≤ 5 e > 0 = "Baixo", = 0 = "Sem estoque", > 5 = "Normal"). Esse limiar pode ser ajustado facilmente no serviço. Caso o projeto defina outro valor, basta alterar uma constante.

---

#### [NEW] [servico_estoque.ts](file:///c:/projetos/uniqprint/backend/src/modulos/estoque/servicos/servico_estoque.ts)

Classe `ServicoEstoque`:
- `listarEstoque(filtros)` — delega ao repositório, mapeia resposta
- `listarMovimentacoes(filtros)` — delega ao repositório, mapeia resposta
- `registrarAjuste(dados)` — validações:
  1. Validar quantidade > 0 e inteiro
  2. Validar observação presente (min 3 chars)
  3. Buscar produto (usar `RepositorioProdutos` existente)
  4. Produto existe? Produto ativo?
  5. Se SAIDA: estoque >= quantidade?
  6. Delegar transação ao repositório

---

#### [NEW] [controlador_estoque.ts](file:///c:/projetos/uniqprint/backend/src/modulos/estoque/controladores/controlador_estoque.ts)

Classe `ControladorEstoque` (mesma estrutura dos controladores existentes):
- `listarEstoque(req, res)` — parse query com Zod
- `listarMovimentacoes(req, res)` — parse query com Zod
- `registrarAjuste(req, res)` — parse body com Zod, chama serviço, retorna 201

---

#### [NEW] [rotas_estoque.ts](file:///c:/projetos/uniqprint/backend/src/modulos/estoque/rotas/rotas_estoque.ts)

Registro de rotas protegidas:
- `GET /api/estoque` — autenticação obrigatória
- `GET /api/estoque/movimentacoes` — autenticação obrigatória
- `POST /api/estoque/ajustes` — autenticação + papel `ADMINISTRADOR` (operação sensível)

---

#### [MODIFY] [aplicativo.ts](file:///c:/projetos/uniqprint/backend/src/aplicativo.ts)

Adicionar import e registro de `rotasEstoque`.

---

### Prisma — Índices

#### [MODIFY] [schema.prisma](file:///c:/projetos/uniqprint/backend/prisma/schema.prisma)

Adicionar índices na model `MovimentacaoEstoque` para otimizar consultas da Feature 7:
```prisma
@@index([produto_id, tipo])
@@index([criado_em])
```

Será necessário rodar `npx prisma migrate dev` após a alteração.

---

### Backend — Testes

#### [NEW] [servico_estoque.test.ts](file:///c:/projetos/uniqprint/backend/src/modulos/estoque/servicos/servico_estoque.test.ts)

Testes unitários com mocks (padrão idêntico ao `servico_compras.test.ts`):
- Ajuste positivo (+5 em estoque 10 → 15)
- Ajuste negativo (-3 em estoque 10 → 7)
- Ajuste para zero (-10 em estoque 10 → 0)
- Rejeição: ajuste abaixo de zero (-11 em estoque 10)
- Rejeição: quantidade zero
- Rejeição: produto inexistente
- Rejeição: produto inativo
- Rejeição: observação vazia
- Listagem de estoque com filtros
- Listagem de movimentações com filtros

#### [NEW] [rotas_estoque.test.ts](file:///c:/projetos/uniqprint/backend/src/modulos/estoque/rotas/rotas_estoque.test.ts)

Testes de integração das rotas (padrão idêntico ao `rotas_compras.test.ts`):
- GET /api/estoque retorna listagem paginada
- GET /api/estoque/movimentacoes retorna histórico
- POST /api/estoque/ajustes com dados válidos
- POST /api/estoque/ajustes com dados inválidos
- Verificação de autenticação/autorização

---

### Frontend — Tipos e Serviço

#### [NEW] [estoque.ts](file:///c:/projetos/uniqprint/frontend/src/tipos/estoque.ts)

Types TypeScript:
- `ItemEstoque` — id, descricao, quantidade_estoque, ativo, status
- `MovimentacaoEstoque` — id, produto_id, produto, tipo, quantidade, tipo_referencia, referencia_id, observacao, criado_em
- `DadosRegistrarAjuste` — produto_id, tipo_ajuste, quantidade, observacao
- `FiltrosEstoque`, `FiltrosMovimentacoes`
- `ResumoEstoque` — total_produtos, estoque_baixo, sem_estoque
- Interfaces de resposta paginada

#### [NEW] [estoque.ts](file:///c:/projetos/uniqprint/frontend/src/servicos/estoque.ts)

Funções de API (mesmo padrão do `vendas.ts`):
- `listarEstoque(filtros)` → `GET /api/estoque`
- `listarMovimentacoes(filtros)` → `GET /api/estoque/movimentacoes`
- `registrarAjuste(dados)` → `POST /api/estoque/ajustes`

---

### Frontend — Página de Estoque

#### [NEW] [TelaEstoque.tsx](file:///c:/projetos/uniqprint/frontend/src/paginas/estoque/TelaEstoque.tsx)

Componente principal com:
- **Indicadores no topo**: cards com Total de Produtos, Estoque Baixo, Sem Estoque (usando CSS vars existentes)
- **Barra de filtros**: busca textual por produto, filtro por status (Normal/Baixo/Sem estoque)
- **Tabela consolidada**: Produto, Estoque, Status (badge colorido), Ações (botão Histórico, botão Ajustar)
- **Paginação**: mesmo padrão de `TelaVendas`
- **Estado vazio**: "Nenhum produto encontrado"
- **Loading**: spinner consistente
- **Alerts**: sucesso/erro para ajustes

#### [NEW] [ModalAjusteEstoque.tsx](file:///c:/projetos/uniqprint/frontend/src/paginas/estoque/ModalAjusteEstoque.tsx)

Modal de ajuste de estoque com:
- Produto selecionado (nome + estoque atual)
- Tipo de ajuste: Entrada (+) / Saída (-) — radio buttons
- Campo quantidade (inteiro positivo)
- **Prévia em tempo real**: "Novo estoque: X unidades"
- Validação frontend: bloqueia se resultado < 0 ("Estoque insuficiente para este ajuste")
- Campo observação/justificativa (obrigatório)
- Botões Cancelar / Confirmar Ajuste
- Estado de loading ("Registrando ajuste...")
- Após confirmação → step de confirmação com resumo antes de enviar

#### [NEW] [ModalHistoricoMovimentacoes.tsx](file:///c:/projetos/uniqprint/frontend/src/paginas/estoque/ModalHistoricoMovimentacoes.tsx)

Modal/seção de histórico com:
- Filtros: Tipo (Todos/ENTRADA/SAIDA/AJUSTE), Período (data início/fim)
- Tabela: Data, Tipo (badge colorido), Quantidade, Origem (Compra #X / Venda #X / Ajuste manual), Observação
- Paginação
- Estado vazio: "Nenhuma movimentação encontrada"

---

### Frontend — Navegação e Rotas

#### [MODIFY] [AppRotas.tsx](file:///c:/projetos/uniqprint/frontend/src/rotas/AppRotas.tsx)

Adicionar rota `/estoque` apontando para `TelaEstoque`.

#### [MODIFY] [LayoutPrincipal.tsx](file:///c:/projetos/uniqprint/frontend/src/layouts/LayoutPrincipal.tsx)

Adicionar item de menu "Estoque" na navegação (usando ícone `Warehouse` do lucide-react), posicionado entre "Compras" e "Produtos".

---

### Frontend — Estilos

#### [MODIFY] [global.css](file:///c:/projetos/uniqprint/frontend/src/estilos/global.css)

Adicionar estilos específicos para:
- Cards indicadores de estoque
- Badge de status do estoque (Normal = azul, Baixo = amarelo/alerta, Sem estoque = vermelho/erro)
- Modal de ajuste (maior que o modal de confirmação, usa `max-width: 560px`)
- Tabs/segmented control para tipo de ajuste
- Prévia do novo estoque (destacado visualmente)

---

### Frontend — Testes

#### [NEW] [estoque.test.tsx](file:///c:/projetos/uniqprint/frontend/src/testes/estoque.test.tsx)

Testes com Vitest + React Testing Library (padrão do `vendas.test.tsx`):
- Renderização da página
- Carregamento do estoque
- Busca por produto
- Filtro por status
- Exibição de estoque baixo (badge amarelo)
- Exibição de sem estoque (badge vermelho)
- Abertura do modal de ajuste
- Exibição do estoque atual no modal
- Seleção do tipo (entrada/saída)
- Cálculo do novo estoque em tempo real
- Validação de estoque negativo no front
- Submissão bem-sucedida
- Tratamento de erro
- Estado de loading
- Abertura do histórico
- Filtros do histórico

---

## Resumo de Arquivos

| Ação | Caminho |
|------|---------|
| NEW | `backend/src/modulos/estoque/dtos/estoque_dto.ts` |
| NEW | `backend/src/modulos/estoque/repositorios/repositorio_estoque.ts` |
| NEW | `backend/src/modulos/estoque/servicos/servico_estoque.ts` |
| NEW | `backend/src/modulos/estoque/servicos/servico_estoque.test.ts` |
| NEW | `backend/src/modulos/estoque/controladores/controlador_estoque.ts` |
| NEW | `backend/src/modulos/estoque/rotas/rotas_estoque.ts` |
| NEW | `backend/src/modulos/estoque/rotas/rotas_estoque.test.ts` |
| MODIFY | `backend/src/aplicativo.ts` |
| MODIFY | `backend/prisma/schema.prisma` |
| NEW | `frontend/src/tipos/estoque.ts` |
| NEW | `frontend/src/servicos/estoque.ts` |
| NEW | `frontend/src/paginas/estoque/TelaEstoque.tsx` |
| NEW | `frontend/src/paginas/estoque/ModalAjusteEstoque.tsx` |
| NEW | `frontend/src/paginas/estoque/ModalHistoricoMovimentacoes.tsx` |
| MODIFY | `frontend/src/rotas/AppRotas.tsx` |
| MODIFY | `frontend/src/layouts/LayoutPrincipal.tsx` |
| MODIFY | `frontend/src/estilos/global.css` |
| NEW | `frontend/src/testes/estoque.test.tsx` |

---

## Decisões Técnicas

| Decisão | Justificativa |
|---------|---------------|
| `quantidade` sempre positiva na movimentação | Mantém consistência com Features 5 e 6 que já armazenam quantidade positiva |
| `tipo_referencia` = `AJUSTE_ENTRADA` / `AJUSTE_SAIDA` | Permite diferenciar a direção sem alterar o contrato existente de `quantidade` |
| Lock otimista via `updateMany` + WHERE para saída | Reutiliza o padrão já validado da Feature 6 (vendas) |
| `increment` direto para entrada de ajuste | Reutiliza o padrão da Feature 5 (compras) |
| Limiar de estoque baixo = 5 | Valor razoável; centralizado numa constante para fácil alteração |
| Ajustes restritos a ADMINISTRADOR | Operação sensível; usa `verificarPapel(["ADMINISTRADOR"])` já existente |
| Sem migration para `observacao` | Campo já existe no schema |
| Migration apenas para índices | Otimiza consultas de histórico |

---

## Verification Plan

### Automated Tests

```bash
# Backend — testes unitários e de integração
cd backend && npx vitest run

# Frontend — testes de componentes
cd frontend && npx vitest run
```

### Manual Verification

- Build do backend e frontend sem erros
- Iniciar servidor de dev
- Verificar endpoints via navegador/curl
- Fluxo manual completo conforme seção 73 da feature spec
