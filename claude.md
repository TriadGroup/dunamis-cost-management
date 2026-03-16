# Claude Project Constitution

## 1. Papel deste arquivo
Este arquivo é a Constituição do projeto.

Ele define:
- mapa do projeto
- regras de comportamento
- invariantes da arquitetura
- fronteiras do que pode ou não pode ser alterado sem migração planejada

Se uma regra estrutural mudar, este arquivo precisa ser atualizado antes ou junto do código.

## 2. Projeto ativo
- Produto principal: `Dunamis Farm Agro`
- App ativo: `cost_management/`
- Objetivo atual:
  - substituir planilhas da horta
  - fechar custo real com rastreio operacional
  - manter o produto navegável, visual e didático

## 3. Mapa do repositório
- `cost_management/`
  - app principal do produto agro-financeiro-operacional
- `architecture/`
  - SOPs técnicos e regras operacionais
- `tools/`
  - reservado para scripts determinísticos futuros
- `.tmp/`
  - arquivos temporários e intermediários
- `task_plan.md`
  - fases e checklist
- `findings.md`
  - descobertas e restrições
- `progress.md`
  - histórico do que foi feito
- `gemini.md`
  - schemas canônicos e maintenance log

## 4. Invariantes da arquitetura
1. O app principal continua dentro de `cost_management/`.
2. A stack do app principal não muda:
   - React
   - TypeScript
   - Vite
   - Zustand
3. A arquitetura interna do app principal continua:
   - `app/`
   - `entities/`
   - `features/`
   - `shared/`
4. Regra de negócio não deve ficar espalhada em componentes.
5. Cálculos centrais devem viver em serviços de domínio.
6. Estado global deve continuar segmentado por store.
7. O sistema deve separar sempre:
   - comprado
   - recebido
   - em estoque
   - usado
   - aplicado
   - valor apropriado
   - colhido
   - vendável
   - vendido
8. Compra não é proxy de custo da cultura.
9. Para item estocável:
   - sem entrada
   - sem baixa
   - sem uso/aplicação
   - sem custo real
10. A interface deve usar linguagem do campo.

## 5. Regras de comportamento do produto
1. Mostrar `Previsto` e `Real` separadamente.
2. Não usar inglês desnecessário na interface.
3. Usar `R$` em valores monetários.
4. Usar `%` em margem, perda e acréscimo.
5. Todo termo ambíguo precisa poder receber ajuda `!`.
6. O sistema deve priorizar clareza operacional antes de densidade analítica.

## 6. Regras de evolução
1. Se lógica operacional mudar, atualizar primeiro `architecture/`.
2. Se schema mudar, atualizar `gemini.md`.
3. Registrar mudanças importantes em `progress.md`.
4. Descobertas e limites novos vão para `findings.md`.
5. `tools/` permanece sem scripts até que:
   - discovery seja respondido
   - blueprint seja aprovado
   - schema esteja fechado

## 7. Linguagem padrão
- `markup` → `acréscimo`
- `allocation` → `rateio` ou `valor lançado`
- `appropriated` → `valor apropriado`
- `inventory lot` → `lote do estoque`
- `marketable` → `vendável`
- `usage` → `uso`
- `application` → `aplicação`

## 8. Fonte de verdade
- Estado atual do produto: auditoria consolidada + implementação corrente do `cost_management`
- Fonte de schema: `gemini.md`
- Fonte de SOP: `architecture/`
