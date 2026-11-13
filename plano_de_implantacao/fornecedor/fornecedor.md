# PROMPT — IMPLEMENTAÇÃO DA FEATURE 2: PRODUTOS

Você é responsável pela implementação da próxima feature do sistema **Uniqprint — Controle de Compras e Vendas**.

## CONTEXTO

A primeira etapa do projeto, correspondente à **Autenticação e Gestão de Usuários**, já foi implementada e deve ser considerada a base existente do sistema.

**NÃO recrie, substitua ou reimplemente a autenticação existente.**

A próxima implementação deverá ser a:

> **Feature 2 — Cadastro e Gestão de Produtos**

A arquitetura do projeto utiliza desenvolvimento vertical por feature:

```text
Banco / Prisma
      ↓
Back-end
      ↓
Front-end
      ↓
Testes automatizados
```

Uma feature somente será considerada concluída quando todas essas camadas estiverem implementadas e funcionando.

A arquitetura exige que o back-end seja a autoridade final das regras de negócio, validações e permissões. O front-end não deve conter regras de negócio que substituam as validações do back-end.

---

# 1. OBJETIVO

Implementar completamente o módulo de **Produtos**, permitindo:

* cadastrar produtos;
* listar produtos;
* consultar produto individualmente;
* pesquisar produtos;
* editar produtos;
* inativar produtos;
* visualizar quantidade em estoque;
* diferenciar produtos ativos e inativos;
* preservar produtos que possuam histórico de movimentações;
* integrar o módulo à autenticação e autorização já existente.

A implementação deve preparar o sistema para as próximas features de:

```text
Fornecedores
Clientes
Compras
Vendas
Estoque
Financeiro
Relatórios
Dashboard
```

Não implementar essas próximas features agora.

---

# 2. REGRAS ARQUITETURAIS OBRIGATÓRIAS

Respeite rigorosamente as seguintes regras existentes no projeto.

## 2.1 Desenvolvimento vertical

Não implemente apenas a API.

A entrega deverá contemplar:

```text
Prisma / Banco
→ API / Back-end
→ Front-end
→ Testes
```

A feature só estará concluída quando o fluxo completo puder ser utilizado pelo usuário autenticado.

## 2.2 Camadas do back-end

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

Não colocar regras de negócio diretamente nas rotas.

## 2.3 Front-end

Respeitar:

```text
Página / Componente
    ↓
Hook / Estado
    ↓
Serviço de API
    ↓
Backend REST
```

O front-end não deve acessar Prisma ou banco de dados diretamente.

---

# 3. NOMENCLATURA

Existe uma regra explícita no projeto:

> Todo código relacionado ao domínio deve utilizar nomenclatura em PT-BR.

Portanto, utilize nomes como:

```text
produto
descricao
quantidade_estoque
ativo
criado_em
atualizado_em

criarProduto()
buscarProdutoPorId()
listarProdutos()
atualizarProduto()
inativarProduto()
```

Não utilizar:

```text
product
description
stock
createProduct()
findProduct()
updateProduct()
deleteProduct()
```

Tecnologias e APIs externas podem manter seus nomes originais.

---

# 4. BANCO DE DADOS

Criar ou ajustar o modelo Prisma correspondente à tabela:

```text
produtos
```

Campos obrigatórios:

```text
id
descricao
quantidade_estoque
ativo
criado_em
atualizado_em
```

Regras:

* `id` deve ser numérico e gerado automaticamente;
* `descricao` é obrigatória;
* `quantidade_estoque` deve iniciar em valor coerente com a regra definida pelo projeto;
* `ativo` deve permitir inativação lógica;
* `criado_em` deve ser preenchido automaticamente;
* `atualizado_em` deve ser atualizado nas alterações;
* não criar campo `identifier`;
* não realizar exclusão física de produto;
* manter compatibilidade com futuras movimentações de estoque.

A especificação do projeto determina que produtos podem ser inativados sem serem removidos fisicamente e que produtos com histórico devem permanecer preservados.

## 4.1 Migration

Criar a migration correspondente.

Antes de criar uma nova migration:

1. verificar o estado atual do Prisma;
2. verificar se a tabela `produtos` já existe;
3. verificar migrations existentes;
4. evitar duplicidade ou perda de dados;
5. não alterar tabelas existentes sem necessidade.

---

# 5. BACK-END

Criar o módulo:

```text
backend/src/modulos/produtos/
```

Organizar seguindo o padrão arquitetural existente no projeto.

Exemplo:

```text
produtos/
├── controladores/
├── servicos/
├── repositorios/
├── schemas/
├── tipos/
└── rotas/
```

Adapte a estrutura caso o padrão já existente no projeto seja diferente, mas preserve a separação de responsabilidades.

---

# 6. ENDPOINTS

Implementar:

```http
GET    /api/produtos
GET    /api/produtos/:id
POST   /api/produtos
PUT    /api/produtos/:id
DELETE /api/produtos/:id
```

O `DELETE` deve realizar **inativação lógica**, e não exclusão física.

Esses endpoints estão definidos na especificação da API do projeto.

---

# 7. LISTAGEM DE PRODUTOS

Implementar:

```http
GET /api/produtos
```

A listagem deve possuir paginação.

Utilizar padrão:

```text
?page=1&limite=20
```

ou, seguindo a nomenclatura definida no projeto:

```text
?pagina=1&limite=20
```

A resposta deverá seguir estrutura semelhante a:

```json
{
  "dados": [],
  "paginacao": {
    "pagina": 1,
    "limite": 20,
    "total": 0,
    "total_paginas": 0
  }
}
```

A paginação é requisito da arquitetura do sistema.

---

# 8. PESQUISA

A listagem deverá permitir pesquisar produtos pela descrição.

Exemplo:

```http
GET /api/produtos?pagina=1&limite=20&busca=martelo
```

A pesquisa deverá ser realizada no banco de dados.

Não carregar todos os produtos no back-end para filtrar em memória.

---

# 9. FILTRO POR STATUS

Permitir filtrar:

```text
ATIVOS
INATIVOS
TODOS
```

Exemplo:

```http
GET /api/produtos?ativo=true
```

A API deve ser responsável por interpretar e validar o filtro.

---

# 10. CADASTRO

Implementar:

```http
POST /api/produtos
```

Payload mínimo:

```json
{
  "descricao": "Martelo"
}
```

Se a implementação exigir outros campos, seguir exclusivamente o modelo definido pelo projeto.

Regras:

* descrição obrigatória;
* remover espaços desnecessários;
* não permitir descrição vazia;
* validar tamanho máximo de acordo com o modelo;
* produto novo deve ser criado como ativo;
* estoque inicial deve respeitar a regra definida para o sistema;
* validar todos os dados utilizando Zod.

A especificação determina explicitamente que a descrição é obrigatória.

---

# 11. VALIDAÇÃO COM ZOD

Criar schemas Zod para:

```text
criação
atualização
parâmetros de consulta
parâmetros de rota
```

Toda entrada recebida pela API deve ser validada.

Não confiar na validação realizada pelo React.

A validação do back-end é obrigatória.

---

# 12. CONSULTA POR ID

Implementar:

```http
GET /api/produtos/:id
```

Retornar o produto quando encontrado.

Quando não encontrado:

```text
HTTP 404
```

Retornar mensagem amigável e padronizada.

Não expor stack trace ou detalhes internos.

---

# 13. ATUALIZAÇÃO

Implementar:

```http
PUT /api/produtos/:id
```

Permitir alteração dos campos editáveis do produto.

Não permitir alteração indevida de:

```text
id
criado_em
```

Avaliar cuidadosamente qualquer alteração de:

```text
quantidade_estoque
```

O estoque não deve ser alterado arbitrariamente pelo CRUD de produtos.

A alteração de estoque deverá ser responsabilidade do futuro módulo de **Estoque**, compras ou vendas.

Portanto:

> NÃO implementar alteração de estoque dentro da edição normal do produto.

---

# 14. INATIVAÇÃO

Implementar:

```http
DELETE /api/produtos/:id
```

Porém, o endpoint deve realizar:

```text
ativo = false
```

e não:

```sql
DELETE FROM produtos
```

Produtos com histórico devem continuar existindo no banco.

Isso é necessário para preservar futuras relações com:

```text
compras
vendas
movimentacoes_estoque
```

---

# 15. PERMISSÕES

A feature deve utilizar a autenticação já implementada.

Todas as operações deverão exigir usuário autenticado.

Utilizar o mecanismo de autorização existente.

Não criar um segundo mecanismo de autenticação.

Respeitar os níveis:

```text
ADMINISTRADOR
USUARIO
```

As permissões devem ser verificadas no back-end.

Ocultar um botão no front-end não constitui controle de segurança.

A especificação determina que autorização deve ser validada no back-end.

Caso a implementação atual de permissões ainda não defina claramente quais operações cada perfil pode realizar:

1. verificar a implementação existente;
2. manter o comportamento já estabelecido;
3. não inventar novas regras;
4. documentar qualquer decisão necessária antes de alterar o comportamento.

---

# 16. TRATAMENTO DE ERROS

Utilizar o mecanismo centralizado de erros existente.

Não retornar:

```text
stack trace
SQL
detalhes internos
senhas
tokens
informações sensíveis
```

Exemplos de respostas:

```text
Produto não encontrado.
Descrição do produto é obrigatória.
Produto já está inativo.
Usuário não possui permissão para realizar esta operação.
```

As mensagens devem ser amigáveis.

---

# 17. AUDITORIA

Verificar se a infraestrutura de auditoria da autenticação já existente suporta operações de produtos.

Caso esteja implementada, registrar operações relevantes como:

```text
CRIAR_PRODUTO
ATUALIZAR_PRODUTO
INATIVAR_PRODUTO
```

Não criar uma arquitetura paralela de auditoria.

Nunca registrar dados sensíveis.

Se a auditoria ainda não tiver sido implementada, não antecipar a Feature 11 sem necessidade. Apenas deixar a feature preparada para integração futura.

---

# 18. FRONT-END

Implementar a página:

```text
Produtos
```

Seguindo a estrutura atual do projeto.

Criar/ajustar:

```text
tipos/produtos.ts
servicos/produtos.ts
paginas/Produtos.tsx
componentes/FormularioProduto.tsx
componentes/TabelaProdutos.tsx
```

Os nomes devem seguir o padrão real já utilizado pelo projeto.

---

# 19. SERVIÇO DE API

Criar:

```text
servicos/produtos.ts
```

Responsável exclusivamente pela comunicação com:

```text
/api/produtos
```

Disponibilizar métodos equivalentes a:

```text
listarProdutos()
buscarProdutoPorId()
criarProduto()
atualizarProduto()
inativarProduto()
```

Não colocar regra de negócio nesse serviço.

---

# 20. TELA DE PRODUTOS

Criar uma tela profissional e simples.

A página deverá conter:

### Cabeçalho

```text
Produtos

[ + Novo produto ]
```

### Pesquisa

Campo:

```text
Buscar produto...
```

### Filtros

```text
Status:
[ Todos | Ativos | Inativos ]
```

### Tabela

Colunas:

```text
ID
Descrição
Estoque
Status
Criado em
Ações
```

Ações:

```text
Editar
Inativar
```

Para produto inativo:

```text
Ativar
```

somente se essa funcionalidade estiver de acordo com as regras já existentes.

---

# 21. FORMULÁRIO

O cadastro/edição deve preferencialmente utilizar modal ou drawer, seguindo o padrão visual já existente.

Campos:

```text
Descrição
```

Não adicionar campos que não estejam previstos no modelo.

Apresentar:

```text
Cancelar
Salvar
```

Durante o envio:

```text
Salvando...
```

Evitar múltiplos submits.

---

# 22. UX

A interface deve:

* possuir feedback visual de carregamento;
* apresentar mensagens de sucesso;
* apresentar mensagens de erro;
* validar campos antes do envio;
* preservar dados digitados quando houver erro de API;
* confirmar ações destrutivas/inativação;
* ser responsiva;
* funcionar em desktop e tablet;
* possuir estados vazios;
* possuir estado de carregamento;
* possuir estado de erro;
* possuir paginação clara.

Não utilizar alertas nativos do navegador se o Design System já possuir componentes próprios.

---

# 23. ESTADOS DA TELA

Implementar pelo menos:

```text
Carregando
Dados carregados
Lista vazia
Erro
Salvando
Sucesso
Erro de validação
Erro de autorização
```

Exemplo de estado vazio:

```text
Nenhum produto encontrado.

[ Cadastrar primeiro produto ]
```

---

# 24. RESPONSIVIDADE

Validar a tela em:

```text
Desktop
Tablet
Mobile
```

A tabela não deve quebrar o layout.

Caso necessário, utilizar:

```text
scroll horizontal
```

ou adaptar a apresentação para telas pequenas.

---

# 25. TESTES BACK-END

Criar testes unitários e de integração.

Obrigatoriamente testar:

### Criação

* criar produto válido;
* rejeitar descrição vazia;
* rejeitar dados inválidos;
* criar produto ativo.

### Consulta

* listar produtos;
* paginação;
* pesquisa;
* filtro por ativo;
* buscar por ID;
* produto inexistente.

### Atualização

* atualizar produto;
* produto inexistente;
* dados inválidos;
* impedir alteração indevida do estoque.

### Inativação

* inativar produto;
* produto inexistente;
* confirmar que a exclusão é lógica;
* confirmar que o registro continua no banco.

### Segurança

* requisição sem autenticação;
* usuário sem permissão;
* usuário autenticado com permissão.

---

# 26. TESTES FRONT-END

Utilizar:

```text
Vitest
React Testing Library
```

Testar:

* renderização da página;
* carregamento;
* listagem;
* estado vazio;
* pesquisa;
* abertura do formulário;
* validação da descrição;
* criação;
* edição;
* inativação;
* tratamento de erro;
* feedback de sucesso;
* estado de carregamento;
* paginação;
* comportamento conforme permissões.

---

# 27. INTEGRAÇÃO

Depois de implementar a feature, validar o fluxo completo:

```text
Login
  ↓
Usuário autenticado
  ↓
Abrir Produtos
  ↓
Listar produtos
  ↓
Cadastrar produto
  ↓
Produto aparece na lista
  ↓
Editar produto
  ↓
Pesquisar produto
  ↓
Inativar produto
  ↓
Filtrar produtos inativos
```

Não implementar compras, vendas ou estoque nesta etapa.

---

# 28. COMPATIBILIDADE COM PRÓXIMAS FEATURES

A implementação deve deixar o modelo preparado para:

```text
Produto
   ↓
Compra
   ↓
Movimentação de estoque
```

e posteriormente:

```text
Produto
   ↓
Venda
   ↓
Movimentação de estoque
```

Não antecipar regras dessas features.

O produto deve ser uma entidade independente e reutilizável pela API.

---

# 29. RESTRIÇÕES IMPORTANTES

NÃO:

* reimplementar autenticação;
* alterar desnecessariamente o módulo de autenticação;
* criar arquitetura paralela;
* criar nomes em inglês para domínio;
* acessar banco pelo front-end;
* colocar regra de negócio na rota;
* alterar estoque pela tela de edição de produto;
* excluir produtos fisicamente;
* adicionar funcionalidades de compras;
* adicionar funcionalidades de vendas;
* adicionar funcionalidades financeiras;
* implementar dashboard;
* implementar relatórios;
* adicionar dependências sem necessidade;
* ignorar testes.

---

# 30. VERIFICAÇÃO FINAL

Antes de considerar a implementação concluída, executar:

```text
npm run test
```

no back-end e front-end, conforme os scripts existentes.

Verificar:

* TypeScript sem erros;
* Prisma sem erros;
* migrations funcionando;
* API funcionando;
* front-end funcionando;
* autenticação funcionando;
* autorização funcionando;
* testes passando;
* responsividade;
* tratamento de erros;
* nenhuma senha/token em logs;
* nenhuma exclusão física de produto.

---

# 31. CRITÉRIO DE CONCLUSÃO

A Feature 2 somente poderá ser considerada **CONCLUÍDA** quando:

```text
[✓] Banco/Prisma
[✓] Migration
[✓] Modelo Produto
[✓] Repositório
[✓] Serviços
[✓] Controladores
[✓] Rotas
[✓] Schemas Zod
[✓] Autenticação
[✓] Autorização
[✓] Paginação
[✓] Pesquisa
[✓] Filtro
[✓] Cadastro
[✓] Edição
[✓] Inativação lógica
[✓] Front-end
[✓] Formulário
[✓] Tabela
[✓] Feedbacks
[✓] Responsividade
[✓] Testes back-end
[✓] Testes front-end
[✓] Teste integrado
```

---

# 32. FORMA DE EXECUÇÃO

Antes de modificar qualquer arquivo:

1. analisar a estrutura atual do projeto;
2. identificar como a autenticação foi implementada;
3. identificar o padrão de módulos utilizado;
4. identificar o padrão de tratamento de erros;
5. identificar o padrão de autenticação/autorização;
6. identificar o padrão de serviços no front-end;
7. identificar o Design System existente;
8. identificar os scripts disponíveis no `package.json`;
9. verificar o estado atual do Prisma e das migrations.

Depois:

1. implementar Banco/Prisma;
2. implementar Back-end;
3. implementar Front-end;
4. implementar testes;
5. executar testes;
6. corrigir problemas;
7. validar o fluxo completo.

**Não faça mudanças fora do escopo da Feature 2 sem necessidade.**

Ao final, apresente um resumo contendo:

```text
1. Arquivos criados
2. Arquivos alterados
3. Endpoints implementados
4. Modelo de banco criado/alterado
5. Funcionalidades do front-end
6. Testes implementados
7. Resultado dos testes
8. Problemas encontrados
9. Decisões arquiteturais relevantes
10. Pendências, se houver
```

A implementação deve priorizar **simplicidade, segurança, manutenção, testabilidade e compatibilidade com as próximas features**, mantendo o back-end independente do React e preparado para futuros consumidores da API, incluindo Android.
