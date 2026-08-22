---
trigger: always_on
---

Toda feature de negócio deve ser implementada verticalmente, incluindo back-end, front-end e testes.

Por exemplo:

Feature: Cadastro de Produtos

        ┌───────────────┐
        │   Produto     │
        └───────┬───────┘
                │
       ┌────────┴────────┐
       │                 │
   BACK-END          FRONT-END
       │                 │
   Banco             Página
   API               Formulário
   Serviço           Tabela
   Validação         Validação
       │                 │
       └────────┬────────┘
                │
             TESTES