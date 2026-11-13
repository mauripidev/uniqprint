# Uniqprint — Front-end

Interface web moderna (SPA) para o sistema de gestão comercial e controle de estoque/financeiro da **Uniqprint**, desenvolvida em React, TypeScript e Vite.

A aplicação conta com um design moderno com **Dark Theme**, tipografia apurada, feedback visual em tempo real e total integração com o back-end através de cookies de sessão seguros.

---

## 🏛️ Arquitetura e Decisões de Design

A interface foi estruturada para proporcionar agilidade operacional, feedback claro e usabilidade intuitiva:

```text
src/
├── componentes/       # Componentes reutilizáveis (modais, badges, caixas de diálogo)
├── contextos/         # Gerenciamento de estado global com React Context (ex: autenticação)
├── estilos/           # Design System Vanilla CSS com variáveis para tema escuro premium
├── layouts/           # Estruturas de layout (LayoutPrincipal com Sidebar e Header)
├── paginas/           # Telas de cada módulo funcional (Dashboard, Vendas, Compras, etc.)
├── rotas/             # Definição de rotas do React Router e guardião RotaProtegida
├── servicos/          # Camada de comunicação HTTP com a API REST
├── testes/            # Testes de integração de interface com Vitest e Testing Library
└── tipos/             # Interfaces e tipagens TypeScript compartilhadas
```

### Destaques de UX/UI

- **Dark Theme Elegante**: Paleta de cores escura com alto contraste, tons refinados e elementos com acabamento em glassmorphism.
- **Validação Antecipada**: Validação no cliente antes do envio das requisições, com tratamento amigável de erros da API.
- **Feedback Visual Claro**: Notificações e banners de alerta para ações de sucesso, estados vazios (*empty states*) estilizados e indicadores de carregamento.
- **Segurança de Sessão**: Comunicação baseada em cookies `HTTP-Only`. O front-end não manipula tokens em memória nem no `localStorage`, evitando riscos de ataques XSS.

---

## 🛠️ Tecnologias Utilizadas

- **Core**: [React](https://react.dev/) (v18) com [TypeScript](https://www.typescriptlang.org/)
- **Ferramenta de Build & Dev Server**: [Vite](https://vitejs.dev/)
- **Roteamento**: [React Router DOM](https://reactrouter.com/) (v6)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Validação de Tipos**: [Zod](https://zod.dev/)
- **Estilização**: CSS Vanilla com sistema de variáveis e classes utilitárias modulares (`global.css`)
- **Testes**:
  - [Vitest](https://vitest.dev/)
  - [Testing Library](https://testing-library.com/) (`@testing-library/react`, `@testing-library/jest-dom`)
  - [jsdom](https://github.com/jsdom/jsdom)

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [npm](https://www.npmjs.com/)
- Back-end do sistema em execução na porta `3001` (para consumo da API)

---

## 🚀 Instalação e Execução

### 1. Instalar as Dependências

Acesse o diretório `frontend` e instale os pacotes:

```bash
cd frontend
npm install
```

### 2. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em:
👉 **`http://localhost:5173`**

### 3. Configuração de Proxy (Vite)

Durante o desenvolvimento, o Vite atua como proxy reverso para todas as chamadas iniciadas em `/api`, encaminhando-as de forma transparente para `http://localhost:3001`:

```typescript
// vite.config.ts
server: {
  port: 5173,
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      changeOrigin: true
    }
  }
}
```

Isso garante o compartilhamento correto de cookies de sessão e elimina bloqueios de CORS no ambiente local.

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento com Hot Module Replacement (HMR) |
| `npm run build` | Valida a tipagem TypeScript e gera o bundle de produção na pasta `dist` |
| `npm run preview` | Executa um servidor local para visualizar a build de produção |
| `npm test` | Executa toda a suíte de testes de componentes com Vitest |
| `npm run test:watch` | Executa o Vitest em modo interativo de monitoramento |

---

## 🖥️ Módulos e Funcionalidades

### 🔐 Autenticação (`/login`)
- Tela de login com validação de formato de e-mail e senha.
- Proteção automática de rotas via `RotaProtegida`: usuários não autenticados são redirecionados para a tela de login.
- Logout seguro com encerramento de sessão no servidor e limpeza do estado local.

### 📊 Dashboard (`/`)
- Painel principal com indicadores de desempenho e atalhos rápidos para as rotas do sistema.
- Resumo visual das principais operações comerciais.

### 💰 Vendas (`/vendas`)
- Consulta e listagem paginada de vendas efetuadas.
- Modal de nova venda com seleção dinâmica de cliente e produto disponível.
- Cálculo automático de totais em tempo real e validação de quantidade disponível em estoque.
- Tratamento explícito de erros operacionais (ex: estoque insuficiente).

### 🛒 Compras (`/compras`)
- Listagem e busca de compras registradas.
- Modal para lançamento de nova compra com fornecedor, produto, quantidade e valor unitário.
- Incremento automático no estoque do produto cadastrado.

### 📦 Gestão de Estoque (`/estoque`)
- Visão consolidada de todos os produtos com indicadores por status:
  - **Normal**: estoque acima do limiar mínimo.
  - **Baixo**: produtos com estoque reduzido (alerta amarelo).
  - **Sem Estoque**: itens esgotados (alerta vermelho).
- Filtros por nome do produto e nível de criticidade de estoque.
- Histórico completo de movimentações (`ENTRADA`, `SAIDA`, `AJUSTE`).
- Modal para realização de **Ajustes Manuais de Estoque** (Entrada ou Saída com justificativa obrigatória).

### 🏷️ Produtos (`/produtos`)
- Catálogo de produtos com busca textual por descrição.
- Cadastro e edição de produtos via modal.
- Inativação lógica com diálogo de confirmação seguro.

### 🏢 Fornecedores (`/fornecedores`)
- Cadastro e gestão de fornecedores parceiros.
- Edição de informações e inativação com proteção de integridade.

### 👥 Clientes (`/clientes`)
- Cadastro e controle de clientes com telefone e anotações.
- Busca rápida por nome e histórico de vínculos.

### 💳 Controle Financeiro (`/financeiro`)
- Extrato de lançamentos com filtros por período e tipo (`ENTRADA`, `SAIDA`).
- Indicadores consolidados de Total de Entradas, Total de Saídas e Saldo Líquido.
- Lançamento manual de receitas e despesas com categoria e observações.

### 📈 Relatórios Gerenciais (`/relatorios`)
- Painel com navegação dinâmica em abas: **Relatório de Vendas**, **Relatório de Compras** e **Relatório Financeiro**.
- Filtros por período (*Esta Semana*, *Este Mês*, *Período Personalizado* com validação de datas).
- Filtros por entidades relacionadas (produtos, clientes, fornecedores, tipos e categorias).
- Cards de resumo com totais consolidados, ticket médio, médias de compra/entrada/saída e volume de itens.
- Tabelas analíticas detalhadas com paginação e estados vazios explicativos.
- Suporte nativo a impressão e exportação via `window.print()` com folha de estilo dedicada para visual limpo em papel/PDF.

---

## 🧪 Testes de Front-end

Os testes de interface utilizam o **Vitest** em conjunto com a **React Testing Library** e ambiente simulado **jsdom**.

Eles cobrem:
- Renderização inicial de tabelas, formulários e listas.
- Interação com modais de criação, edição e exclusão.
- Preenchimento e validação de campos.
- Simulação de respostas da API (sucesso e erros controlados).

Para executar os testes:

```bash
npm test
```

---

## 📁 Estrutura do Diretório

```text
frontend/
├── src/
│   ├── App.tsx                    # Componente raiz da aplicação
│   ├── principal.tsx              # Ponto de entrada (ReactDOM.createRoot)
│   ├── componentes/               # Componentes compartilhados (ModalConfirmacao, etc.)
│   ├── contextos/                 # Provedor e hook useAutenticacao
│   ├── estilos/                   # Folha de estilo global e variáveis de tema (global.css)
│   ├── layouts/                   # LayoutPrincipal com barra lateral e cabeçalho
│   ├── paginas/                   # Telas por módulo de negócio
│   │   ├── autenticacao/          # TelaLogin
│   │   ├── clientes/              # TelaClientes
│   │   ├── compras/               # TelaCompras
│   │   ├── dashboard/             # TelaDashboard
│   │   ├── estoque/               # TelaEstoque
│   │   ├── financeiro/            # TelaFinanceiro
│   │   ├── fornecedores/          # TelaFornecedores
│   │   ├── produtos/              # TelaProdutos
│   │   └── vendas/                # TelaVendas
│   ├── rotas/                     # AppRotas e componente RotaProtegida
│   ├── servicos/                  # Módulos de integração com a API via fetch
│   ├── testes/                    # Suíte de testes com Vitest e Testing Library
│   └── tipos/                     # Interfaces TypeScript (DTOs, entidades, respostas da API)
├── index.html                     # HTML principal com fonte Inter e viewport responsivo
├── package.json                   # Dependências e scripts
├── tsconfig.json                  # Configurações do TypeScript
└── vite.config.ts                 # Configuração do Vite (proxy de API e testes Vitest)
```
