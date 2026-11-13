# Uniqprint — Controle de Compras e Vendas

Sistema web MVP para controle operacional e financeiro da empresa **Uniqprint**.

---

## Objetivo

Centralizar e automatizar o ciclo comercial completo da Uniqprint, cobrindo:

- **Cadastros:** produtos, fornecedores e clientes
- **Compras:** registro de compras com entrada automática de estoque e lançamento financeiro (saída de caixa)
- **Vendas:** registro de vendas com baixa atômica de estoque e lançamento financeiro (entrada de caixa)
- **Estoque:** controle de saldo em tempo real com suporte a ajustes manuais e histórico de movimentações
- **Financeiro:** fluxo de caixa consolidado com categorização de lançamentos e resumo por período
- **Relatórios gerenciais:** compras, vendas, estoque e financeiro com filtros e paginação
- **Dashboard:** visão executiva consolidada com totais do mês e alertas de estoque crítico
- **Auditoria:** registro centralizado e imutável de operações críticas (login, compras, vendas, ajustes de estoque, lançamentos financeiros)
- **Autenticação segura:** login com JWT em cookie HTTP-Only, controle de sessão e proteção de rotas

---

## Tecnologias

### Back-end

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js |
| Linguagem | TypeScript |
| Framework | Fastify v5 |
| ORM | Prisma v6 |
| Banco de dados | MySQL 8.0 |
| Autenticação | JWT (`@fastify/jwt`) + Cookie HTTP-Only (`@fastify/cookie`) |
| Hash de senha | Argon2id |
| Validação | Zod |
| Segurança | `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/cors` |
| Testes | Vitest v3 |

### Front-end

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript |
| Biblioteca UI | React 18 |
| Roteamento | React Router v6 |
| Build | Vite v6 |
| Cliente HTTP | Axios |
| Ícones | Lucide React |
| Testes | Vitest v3 + Testing Library + jsdom |

### Infraestrutura

| Item | Detalhe |
|---|---|
| Containerização | Docker + Docker Compose |
| Banco (container) | `uniqprint-mysql` — porta `3307` |
| Back-end | porta `3001` |
| Front-end (dev) | porta `5173` |

---

## Arquitetura

Desenvolvimento vertical por feature: cada funcionalidade é implementada de ponta a ponta — **Banco → Back-end → Front-end → Testes** — antes de iniciar a próxima.

```
Feature
  ├── Migração Prisma (banco)
  ├── Back-end
  │     ├── Repositório
  │     ├── Serviço
  │     ├── Controlador
  │     └── Rota (plugin Fastify)
  ├── Front-end
  │     ├── Página / Formulário
  │     └── Tabela / Componentes
  └── Testes
        ├── Unitários / integração (Vitest)
        └── E2E — fluxo completo ponta a ponta
```

---

## Features implementadas

| # | Feature |
|---|---|
| 0 | Setup inicial (Docker, Prisma, Fastify, React) |
| 1 | Autenticação (login, JWT, cookie HTTP-Only) |
| 2 | Produtos (CRUD com validação) |
| 3 | Fornecedores (CRUD) |
| 4 | Clientes (CRUD) |
| 5 | Compras (registro + estoque automático + lançamento financeiro) |
| 6 | Vendas (registro + baixa atômica de estoque + lançamento financeiro) |
| 7 | Estoque (saldo em tempo real + ajustes manuais + histórico) |
| 8 | Financeiro (fluxo de caixa + resumo por período) |
| 9 | Relatórios gerenciais (compras, vendas, estoque, financeiro) |
| 10 | Dashboard (visão executiva consolidada) |
| 11 | Auditoria + Teste E2E de fluxo completo |

---

## Estrutura de Pastas

```
uniqprint/
├── docker-compose.yml          # MySQL 8.0 via Docker
├── README.md
│
├── backend/
│   ├── .env                    # Variáveis de ambiente (DB, JWT, etc.)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma       # Modelos do banco de dados
│   │   └── migrations/         # Histórico de migrações (9 aplicadas)
│   │
│   └── src/
│       ├── aplicativo.ts       # Configuração do Fastify (plugins, rotas)
│       ├── servidor.ts         # Entry point
│       │
│       ├── banco_de_dados/
│       │   └── prisma.ts       # Singleton do PrismaClient
│       │
│       ├── configuracao/
│       │   └── ambiente.ts     # Leitura e validação de variáveis de ambiente
│       │
│       ├── compartilhado/
│       │   ├── erros/
│       │   │   ├── erro_aplicacao.ts   # Classe base de erro de negócio
│       │   │   └── tratador_erros.ts   # Handler global de erros do Fastify
│       │   └── utilitarios/
│       │       └── criptografia.ts     # Argon2id (hash / verificar senha)
│       │
│       ├── middlewares/
│       │   └── autenticacao_middleware.ts  # Verificação de JWT / cookie
│       │
│       ├── modulos/            # Um subdiretório por feature (padrão vertical)
│       │   ├── autenticacao/
│       │   │   ├── controladores/
│       │   │   ├── dtos/
│       │   │   ├── repositorios/
│       │   │   ├── rotas/
│       │   │   └── servicos/
│       │   ├── produtos/       # (mesma estrutura interna)
│       │   ├── fornecedores/
│       │   ├── clientes/
│       │   ├── compras/
│       │   ├── vendas/
│       │   ├── estoque/
│       │   ├── financeiro/
│       │   ├── relatorios/
│       │   ├── dashboard/
│       │   └── auditoria/
│       │
│       └── testes/
│           ├── autenticacao.test.ts
│           ├── produtos.test.ts
│           ├── fornecedores.test.ts
│           ├── clientes.test.ts
│           ├── compras.test.ts
│           ├── vendas.test.ts
│           ├── estoque.test.ts
│           ├── financeiro.test.ts
│           ├── relatorios.test.ts
│           ├── dashboard.test.ts
│           ├── auditoria.test.ts
│           └── fluxo_completo_e2e.test.ts   # Teste E2E ponta a ponta
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    │
    └── src/
        ├── App.tsx             # Componente raiz + providers
        ├── principal.tsx       # Entry point (ReactDOM.createRoot)
        │
        ├── componentes/
        │   └── ModalConfirmacao.tsx
        │
        ├── contextos/
        │   └── ContextoAutenticacao.tsx   # AuthContext + hook useAuth
        │
        ├── estilos/
        │   └── global.css
        │
        ├── layouts/
        │   └── LayoutPrincipal.tsx        # Shell com sidebar e header
        │
        ├── rotas/
        │   ├── AppRotas.tsx               # Declaração de todas as rotas
        │   └── RotaProtegida.tsx          # HOC de autenticação
        │
        ├── servicos/           # Funções Axios por domínio (api.ts = instância base)
        │   ├── api.ts
        │   ├── autenticacao.ts
        │   ├── produtos.ts
        │   ├── fornecedores.ts
        │   ├── clientes.ts
        │   ├── compras.ts
        │   ├── vendas.ts
        │   ├── estoque.ts
        │   ├── financeiro.ts
        │   ├── relatorios.ts
        │   ├── dashboard.ts
        │   └── auditoria.ts
        │
        ├── tipos/              # Interfaces TypeScript por domínio
        │   └── (autenticacao | produtos | fornecedores | …).ts
        │
        ├── paginas/            # Uma pasta por feature
        │   ├── autenticacao/   TelaLogin.tsx
        │   ├── produtos/       TelaProdutos.tsx + ModalFormularioProduto.tsx
        │   ├── fornecedores/   TelaFornecedores.tsx + Modal…
        │   ├── clientes/       TelaClientes.tsx + Modal…
        │   ├── compras/        TelaCompras.tsx + ModalRegistroCompra.tsx
        │   ├── vendas/         TelaVendas.tsx + ModalRegistroVenda.tsx
        │   ├── estoque/        TelaEstoque.tsx + ModalAjuste… + ModalHistorico…
        │   ├── financeiro/     TelaFinanceiro.tsx + ModalLancamento…
        │   ├── relatorios/     TelaRelatorios.tsx
        │   ├── dashboard/      TelaDashboard.tsx
        │   └── auditoria/      TelaAuditoria.tsx
        │
        └── testes/
            ├── setup.ts
            ├── autenticacao.test.tsx
            ├── produtos.test.tsx
            ├── fornecedores.test.tsx
            ├── clientes.test.tsx
            ├── compras.test.tsx
            ├── vendas.test.tsx
            ├── estoque.test.tsx
            ├── financeiro.test.tsx
            ├── relatorios.test.tsx
            ├── dashboard.test.tsx
            └── auditoria.test.tsx
```

---

## Como executar

### Pré-requisitos

- Node.js 20+
- Docker Desktop

### 1. Banco de dados

```bash
docker compose up -d
```

### 2. Back-end

```bash
cd backend
npm install
npx prisma migrate deploy
npm run dev
```

### 3. Front-end

```bash
cd frontend
npm install
npm run dev
```

### 4. Testes

```bash
# Back-end
cd backend && npm test

# Front-end
cd frontend && npm test
```

