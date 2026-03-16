# Task Plan

## Projeto ativo
- Nome operacional: `Dunamis Farm Agro`
- App principal: `cost_management/`
- Objetivo atual: fechar o fluxo real da fazenda sem quebrar o webapp já funcional

## Blueprint atual
- Fonte de verdade do estado atual: auditoria operacional consolidada pelo usuário
- Arquétipo prioritário: `horta`
- Regra central: `compra > recebimento > estoque > uso/aplicação > apropriação > colheita > destino > margem real`
- Restrições:
  - não mover o `cost_management/`
  - não quebrar navegação, build ou testes já existentes
  - linguagem simples de fazenda
  - termos ambíguos sempre com ajuda `!`

## Descobertas pendentes do protocolo B.L.A.S.T.
Estas respostas ainda não foram formalmente fechadas pelo usuário. Enquanto isso, valem as premissas atuais do app.

1. North Star
   - Premissa atual: substituir as planilhas da horta com custo real rastreável
2. Integrations
   - Premissa atual: nenhuma integração externa obrigatória nesta fase
3. Source of Truth
   - Premissa atual: stores locais + seeds + registros operacionais no próprio app
4. Delivery Payload
   - Premissa atual: cockpit web local-first dentro do `cost_management`
5. Behavioral Rules
   - Premissa atual:
     - não usar compra como proxy de custo apropriado
     - separar previsto e real
     - usar linguagem do campo

## Fases

### Fase 0 — Memória e Constituição
- [x] Criar `task_plan.md`
- [x] Criar `findings.md`
- [x] Criar `progress.md`
- [x] Criar `claude.md`
- [x] Criar `gemini.md`
- [x] Criar `architecture/`
- [x] Criar `tools/` sem scripts
- [x] Criar `.tmp/`

### Fase 1 — Blueprint
- [x] Consolidar a auditoria como estado atual oficial
- [x] Formalizar invariantes da arquitetura
- [x] Definir schema base em `gemini.md`
- [ ] Fechar respostas pendentes de descoberta com o usuário

### Fase 2 — Link
- [ ] Validar integrações externas, se existirem
- [ ] Validar `.env` para integrações futuras, se necessário
- [ ] Só depois disso liberar scripts em `tools/`

### Fase 3 — Architect
- [x] Manter `cost_management` como app principal intacto
- [x] Documentar a arquitetura atual
- [x] Documentar o fluxo real da fazenda
- [ ] Evoluir SOPs antes de mudanças grandes de lógica

### Fase 4 — Stylize
- [ ] Revisar consistência visual e textual global
- [ ] Revisar empty states e ajuda `!` por módulo

### Fase 5 — Trigger
- [ ] Definir deploy/trigger/automação quando houver backend ou integrações
- [ ] Fechar maintenance log em `gemini.md`

## Checklist operacional prioritário
- [ ] Estoque vivo na UI
- [ ] Aplicação real viva na UI
- [ ] Colheita real viva na UI
- [ ] Custo real vivo na UI
- [ ] Home separando previsto x real
- [ ] Rastreabilidade por lote fechando com custo real

## Regra de execução
- Antes de qualquer mudança estrutural grande:
  - atualizar SOP em `architecture/`
  - refletir regra em `claude.md`
  - registrar impacto em `progress.md`
