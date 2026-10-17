# Uniqprint — Back-end

Serviço de back-end em Node.js e TypeScript para o sistema de gestão comercial da **Uniqprint**, responsável pelo controle de autenticação, produtos, fornecedores, clientes, compras, vendas, movimentação de estoque, lançamentos financeiros e relatórios gerenciais consolidados.

---

## 🏛️ Arquitetura

O projeto adota a **Arquitetura Vertical (*Vertical Slice Architecture*)**, onde cada módulo de negócio é organizado como uma fatia vertical independente contendo suas próprias camadas:

```text
src/modulos/<modulo>/
├── controladores/     # Manipulação de requisições e respostas HTTP (Fastify)
├── dtos/              # Validação de esquemas de entrada/saída com Zod
├── repositorios/      # Camada de persistência e queries no banco (Prisma)
├── rotas/             # Declaração das rotas HTTP e middlewares de proteção
└── servicos/          # Regras de negócio, cálculos e transações atômicas
```

### Princípios Arquiteturais

1. **Separação de Responsabilidades**: Rotas delegam aos controladores, que validam payloads através de DTOs (Zod) e invocam a camada de serviços. Acesso a dados é isolado em repositórios tipados.
2. **Consistência Transacional e Integridade**:
   - Vendas e compras atualizam estoque e registram lançamentos de forma atômica com transações do Prisma (`$transaction`).
   - Baixa de estoque utiliza controle de concorrência com travas otimistas (`updateMany` com filtro de saldo positivo).
3. **Segurança por Padrão**:
   - Autenticação baseada em tokens JWT armazenados em cookies `HTTP-Only` seguros.
   - Hash de senhas seguro utilizando o algoritmo **Argon2id**.
   - Controle de acesso granular baseado em papéis (`ADMINISTRADOR`, `USUARIO`).
   - Rate limiting ativado contra força bruta e DoS.
   - Headers de segurança via Helmet.

---

## 🛠️ Tecnologias Utilizadas

- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Framework Web**: [Fastify](https://fastify.dev/)
  - `@fastify/cookie`: Manipulação de cookies seguros
  - `@fastify/cors`: Controle de acesso de origem cruzada
  - `@fastify/helmet`: Segurança de cabeçalhos HTTP
  - `@fastify/jwt`: Assinatura e verificação de tokens JWT
  - `@fastify/rate-limit`: Limitação de taxa de requisições
- **ORM & Banco de Dados**: [Prisma ORM](https://www.prisma.io/) com [MySQL 8.0](https://www.mysql.com/)
- **Validação de Dados**: [Zod](https://zod.dev/)
- **Criptografia & Hash**: [Argon2](https://github.com/ranisalt/node-argon2) (variante `argon2id`)
- **Testes**: [Vitest](https://vitest.dev/) (testes unitários e testes de integração com `supertest`/Fastify `inject`)
- **Execução em Desenvolvimento**: [tsx](https://github.com/privatenumber/tsx)

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) (para executar o MySQL facilmente)

---

## ⚙️ Variáveis de Ambiente

Crie o arquivo `.env` na raiz do diretório `backend` a partir do modelo existente:

```bash
cp .env.exemplo .env
```

| Variável | Descrição | Exemplo Padrão |
| :--- | :--- | :--- |
| `PORTA` | Porta HTTP do servidor Fastify | `3001` |
| `HOST` | Interface de rede para binding | `0.0.0.0` |
| `AMBIENTE` | Ambiente de execução (`development`, `production`, `test`) | `development` |
| `BANCO_DE_DADOS_URL` | String de conexão JDBC/MySQL do Prisma | `mysql://uniqprint_user:uniqprint_password@localhost:3307/uniqprint_db` |
| `JWT_SEGREDO` | Chave secreta para assinatura dos tokens JWT | `seu_segredo_jwt_aqui` |
| `COOKIE_SEGREDO` | Chave secreta para assinatura de cookies | `seu_segredo_cookie_aqui` |
| `ORIGEM_FRONTEND` | URL de origem do front-end permitida no CORS | `http://localhost:5173` |

---

## 🚀 Instalação e Execução

### 1. Inicializar o Banco de Dados (Docker)

Na raiz do projeto (`/`), suba o contêiner do MySQL configurado no `docker-compose.yml`:

```bash
docker compose up -d
```

O banco de dados estará acessível em `localhost:3307`.

### 2. Instalar Dependências

Acesse a pasta `backend` e instale os pacotes:

```bash
cd backend
npm install
```

### 3. Executar as Migrações do Prisma

Aplique o esquema no banco de dados e gere o cliente Prisma:

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 4. Executar os Seeds (Carga Inicial)

Popule o banco com os usuários padrão do sistema:

```bash
npm run prisma:seed
```

#### Credenciais Padrão Criadas:

| Papel | E-mail | Senha |
| :--- | :--- | :--- |
| **Administrador** | `admin@uniqprint.com.br` | `admin123` |
| **Operador (Usuário)** | `usuario@uniqprint.com.br` | `user123` |

### 5. Iniciar o Servidor em Desenvolvimento

```bash
npm run dev
```

O servidor iniciará em `http://localhost:3001`.

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor em modo watch com compilação sob demanda via `tsx` |
| `npm run build` | Compila o projeto TypeScript para a pasta `dist` |
| `npm start` | Executa o build compilado em produção com Node.js |
| `npm run prisma:generate` | Gera o cliente do Prisma com base no arquivo `schema.prisma` |
| `npm run prisma:migrate` | Executa migrações pendentes em ambiente de desenvolvimento |
| `npm run prisma:seed` | Executa o script de seed inicial (`prisma/seed.ts`) |
| `npm test` | Executa a suíte de testes unitários e de integração uma única vez |
| `npm run test:watch` | Executa o Vitest em modo interativo de monitoramento |

---

## 🔌 Referência da API REST

Todas as rotas da API possuem o prefixo `/api`. As rotas protegidas exigem o cookie `token_sessao` emitido no login.

### 🩺 Status & Health Check
- `GET /api/status` — Verifica a disponibilidade e integridade do back-end.

### 🔐 Autenticação & Usuários
- `POST /api/autenticacao/login` — Autentica o usuário e grava o cookie `HTTP-Only`. *(Rate limit: 5 req/min)*
- `POST /api/autenticacao/logout` — Revoga a sessão e limpa o cookie de autenticação.
- `GET /api/autenticacao/eu` — Retorna dados do usuário atualmente autenticado.
- `POST /api/usuarios` — Cadastro de novo usuário.
- `GET /api/usuarios` — Lista usuários cadastrados *(exclusivo para `ADMINISTRADOR`)*.

### 📦 Produtos
- `GET /api/produtos` — Lista produtos com suporte a busca (`busca`) e paginação (`pagina`, `limite`).
- `GET /api/produtos/:id` — Retorna os detalhes de um produto específico.
- `POST /api/produtos` — Cadastra um novo produto (descrição obrigatória).
- `PUT /api/produtos/:id` — Atualiza os dados de um produto.
- `DELETE /api/produtos/:id` ou `PATCH /api/produtos/:id/inativar` — Inativação lógica do produto.

### 🏢 Fornecedores
- `GET /api/fornecedores` — Lista fornecedores com suporte a paginação e busca textual.
- `GET /api/fornecedores/:id` — Consulta detalhes de um fornecedor.
- `POST /api/fornecedores` — Cadastra um novo fornecedor.
- `PUT /api/fornecedores/:id` — Atualiza o cadastro de um fornecedor.
- `DELETE /api/fornecedores/:id` ou `PATCH /api/fornecedores/:id/inativar` — Inativação lógica.

### 👥 Clientes
- `GET /api/clientes` — Lista clientes com paginação e busca por nome/telefone.
- `GET /api/clientes/:id` — Consulta dados de um cliente.
- `POST /api/clientes` — Cadastra um novo cliente.
- `PUT /api/clientes/:id` — Atualiza o cadastro do cliente.
- `DELETE /api/clientes/:id` ou `PATCH /api/clientes/:id/inativar` — Inativação lógica.

### 🛒 Compras (Entradas)
- `GET /api/compras` — Lista compras realizadas com filtros por período, fornecedor ou produto.
- `GET /api/compras/:id` — Detalhes de uma compra específica.
- `POST /api/compras` — Registra nova compra, incrementa o estoque do produto e gera movimentação de entrada automaticamente em transação.

### 💰 Vendas (Saídas)
- `GET /api/vendas` — Lista vendas realizadas com paginação e filtros.
- `GET /api/vendas/:id` — Consulta uma venda específica.
- `POST /api/vendas` — Registra nova venda, valida saldo suficiente, decrementa estoque com controle de concorrência e gera movimentação de saída.

### 📊 Estoque & Movimentações
- `GET /api/estoque` — Visão consolidada do estoque com status (`normal`, `baixo`, `sem_estoque`) e contadores sumarizados.
- `GET /api/estoque/movimentacoes` — Histórico completo de movimentações com filtros por tipo (`ENTRADA`, `SAIDA`, `AJUSTE`) e produto.
- `POST /api/estoque/ajustes` — Registro de ajuste manual de estoque com justificativa obrigatória *(exclusivo para `ADMINISTRADOR`)*.

### 💳 Financeiro
- `GET /api/lancamentos-financeiros` — Lista lançamentos financeiros com filtro por período, tipo (`ENTRADA`, `SAIDA`) e categoria *(exclusivo para `ADMINISTRADOR`)*.
- `GET /api/lancamentos-financeiros/:id` — Consulta um lançamento financeiro.
- `POST /api/lancamentos-financeiros` — Cria um lançamento financeiro manual.
- `PUT /api/lancamentos-financeiros/:id` — Atualiza lançamento financeiro existente.
- `DELETE /api/lancamentos-financeiros/:id` — Exclui um lançamento financeiro.

### 📈 Relatórios Gerenciais
- `GET /api/relatorios/vendas` — Relatório agregado de vendas (total vendido, ticket médio, quantidade) com filtros por período (`semana`, `mes`, `personalizado`), produto e cliente.
- `GET /api/relatorios/compras` — Relatório agregado de compras (total comprado, média por compra, volume de itens) com filtros por período, produto e fornecedor.
- `GET /api/relatorios/financeiro` — Relatório consolidado com total de entradas, total de saídas, saldo líquido e médias financeiras.

---

## 🧪 Testes

A suíte de testes utiliza o [Vitest](https://vitest.dev/) com testes unitários focados nas regras dos serviços e testes de integração executados contra as instâncias da API Fastify.

Para rodar toda a suíte de testes:

```bash
npm test
```

Para rodar em modo contínuo durante o desenvolvimento:

```bash
npm run test:watch
```

---

## 📁 Estrutura do Diretório

```text
backend/
├── prisma/
│   ├── schema.prisma              # Definição dos modelos e conexões do Prisma
│   └── seed.ts                    # Script de população de dados iniciais
├── src/
│   ├── aplicativo.ts              # Configuração da instância Fastify, plugins e rotas
│   ├── servidor.ts                # Inicialização e escuta da porta HTTP
│   ├── banco_de_dados/            # Instância singleton do Prisma Client
│   ├── compartilhado/             # Utilitários compartilhados, erros customizados
│   ├── configuracao/              # Validação e carregamento de variáveis de ambiente
│   ├── middlewares/               # Interceptadores (autenticação JWT, autorização por papel)
│   ├── modulos/                   # Módulos funcionais da aplicação
│   │   ├── autenticacao/
│   │   ├── clientes/
│   │   ├── compras/
│   │   ├── estoque/
│   │   ├── financeiro/
│   │   ├── fornecedores/
│   │   ├── produtos/
│   │   ├── relatorios/
│   │   └── vendas/
│   └── testes/                    # Utilitários globais de teste e validações
├── .env.exemplo                   # Arquivo de exemplo das variáveis de ambiente
├── package.json                   # Dependências e scripts
├── tsconfig.json                  # Configurações do compilador TypeScript
└── vitest.config.ts               # Configuração do executor de testes Vitest
```
