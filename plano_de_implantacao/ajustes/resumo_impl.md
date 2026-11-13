Resumo das Entregas Realizadas
1. Camada Visual (Front-end UI & Rotas)


TelaEstoque.tsx
:
Cards Indicadores no Topo: Métricas consolidadas de Total de Produtos, Alerta de Estoque Baixo ($\le 5$) e Sem Estoque ($0$).
Filtros Dinâmicos: Busca textual em tempo real por descrição e filtro de status (Normal, Baixo, Sem Estoque).
Tabela Consolidada: Visualização do estoque por produto com badges coloridos e botões para Histórico e Ajustar.
Paginação: Navegação paginada com estados de carregamento e estado vazio estilizados.


ModalAjusteEstoque.tsx
:
Seletor de tipo de ajuste (Entrada + / Saída -).
Painel de prévia em tempo real calculando o novo saldo estimado.
Validação preventiva no front-end: Bloqueia submissão e alerta caso a quantidade de saída seja superior ao saldo disponível.
Justificativa obrigatória (mínimo de 3 caracteres) e feedback de progresso.


ModalHistoricoMovimentacoes.tsx
:
Listagem detalhada de movimentações com filtros por tipo (Entrada, Saída, Ajuste) e intervalo de datas.
Rastreabilidade de origem (Compra #X, Venda #X, Ajuste Manual).


global.css
:
Estilização completa para os cards de indicadores, badges de status (status-normal, status-baixo, status-sem_estoque), seletores de ajuste e painel de prévia.


AppRotas.tsx
 & 

LayoutPrincipal.tsx
:
Rota /estoque registrada na área protegida e link de navegação adicionado na barra superior com o ícone Warehouse.
2. Camada de Comunicação & API


api.ts
: Suporte aprimorado para normalização de caminhos e objeto de requisição unificado.


servicos/estoque.ts
: Exportação de métodos listarEstoque, listarMovimentacoes, registrarAjuste e objeto servicoEstoque.


controlador_estoque.ts
: Padronização do payload HTTP de resposta (dados e mensagem) com código 201 Created.
3. Testes Automatizados (Garantia de Qualidade)


servico_estoque.test.ts
:
Testes unitários cobrindo regras de negócio: ajuste positivo, ajuste negativo, redução para zero, rejeição de estoque negativo, quantidade inválida/negativa, justificativa vazia e produtos inativos/inexistentes.


rotas_estoque.test.ts
:
Testes de integração HTTP cobrindo autenticação (401), permissão exclusiva para ADMINISTRADOR (403), consultas paginadas e persistência atômica das transações no banco de dados.


estoque.test.tsx
:
Testes de componentes no front-end validando renderização de cards, badges, filtros, abertura e cálculo em tempo real do modal de ajuste, bloqueios por validação e histórico.
Resultados dos Testes e Builds
Testes do Back-end: 14/14 arquivos passaram (116 testes)
Testes do Front-end: 7/7 arquivos passaram (42 testes)
Build de Produção (Back-end): Compilação TypeScript validada com sucesso.
Build de Produção (Front-end): vite build gerado sem erros.