# Findings

## Estado atual do repositório
- Repositório raiz contém múltiplos projetos.
- App principal agro está em `cost_management/`.
- Existe um app raiz legado em `src/`, mas o produto ativo desta frente é o `cost_management`.
- O `cost_management` já está funcional, com build e testes passando.

## Estrutura funcional atual do app
- Stack:
  - React
  - TypeScript
  - Vite
  - Zustand
- Arquitetura:
  - `app/`
  - `entities/`
  - `features/`
  - `shared/`
- Módulos relevantes já existentes:
  - dashboard
  - setup
  - production-planning
  - purchases
  - costs
  - implantation
  - traceability
  - demand-channels
  - investments
  - maintenance
  - agronomic-calendar
  - unit-economics
  - inventory
  - field-operations
  - harvest
  - real-costs

## Descobertas técnicas importantes
- O app já possui base de domínio para:
  - estoque
  - aplicação
  - perda
  - mão de obra
  - uso de máquina
  - valor apropriado
- A navegação nova do fluxo real já foi ligada no `cost_management`.
- O build atual do `cost_management` está verde.
- A suíte atual do `cost_management` também está verde.
- A principal dor de UX não era só visual; era de maturidade:
  - o app parecia “pronto” antes da hora
  - mostrava números cedo demais
  - exigia entendimento implícito da lógica interna
- A direção correta é tratar o usuário como:
  - alguém que sabe a fazenda
  - mas não sabe software
- Isso exige:
  - home por estágio
  - zero-state honesto
  - linguagem da fazenda
  - formulários mais próximos de entrevista guiada

## Restrições confirmadas
- Não mover o `cost_management/` de lugar.
- Não reestruturar o repositório de forma que quebre imports, Vite, testes ou assets já estáveis.
- Não introduzir `tools/` com scripts enquanto o blueprint não estiver formalmente aprovado pelo usuário dentro do protocolo.

## Lacunas ainda abertas
- As 5 perguntas de discovery do protocolo ainda não foram respondidas formalmente.
- Ainda não existe backend nem integração externa obrigatória nesta fase.
- A camada `tools/` está intencionalmente vazia.

## Conclusão operacional
- A melhor forma de “organizar os arquivos” sem quebrar o webapp é:
  - manter o `cost_management/` onde está
  - adicionar a camada B.L.A.S.T. na raiz
  - usar essa camada como governo do projeto
  - só considerar mover algo do app principal com plano de migração explícito
