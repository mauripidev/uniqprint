# Skill — Desenvolvimento de Features

## Regra principal

O desenvolvimento deve ocorrer por feature vertical.

Uma feature nunca deve ser considerada concluída apenas com a
implementação do back-end.

Sempre que uma feature possuir impacto no back-end e no front-end,
os dois lados deverão ser implementados na mesma tarefa.

## Fluxo obrigatório

Para cada feature:

1. Ler o plano.md.
2. Identificar os requisitos da feature.
3. Ler a skill de back-end.
4. Ler a skill de front-end.
5. Analisar a arquitetura existente.
6. Implementar o banco de dados quando necessário.
7. Implementar o back-end.
8. Implementar a API.
9. Implementar os tipos necessários.
10. Implementar o serviço da API no front-end.
11. Implementar a interface.
12. Implementar validações.
13. Implementar tratamento de erros.
14. Implementar testes de back-end.
15. Implementar testes de front-end.
16. Executar os testes.
17. Corrigir problemas.
18. Atualizar o plano.md quando necessário.
19. Considerar a feature concluída somente após back-end e front-end
    estarem funcionando.

## Regra de sincronização

Se uma alteração no back-end criar, alterar ou remover uma API
consumida pelo front-end, o front-end deverá ser atualizado na mesma
feature.

Não deixar APIs implementadas sem seu consumidor quando a feature
exigir interface.

## Exemplo

Ao implementar:

POST /api/produtos

também deverá ser implementado:

- serviço de produtos no front-end;
- tipos TypeScript;
- formulário de produto;
- validação;
- tratamento de erros;
- atualização da lista;
- testes relacionados.

## Proibição

Não executar:

"implemente primeiro todo o back-end e depois faremos o front-end".

O desenvolvimento deve ocorrer por feature.