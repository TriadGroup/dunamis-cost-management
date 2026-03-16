# 03 — Data Truth

## Fonte de verdade por etapa

### Compra
- entidade: `PurchaseItem`
- representa:
  - negociação
  - valor
  - fornecedor
  - situação de pagamento

### Recebimento e estoque
- entidades:
  - `InventoryProduct`
  - `InventoryLot`
  - `StockMovement`
- representam:
  - o que entrou
  - quanto entrou
  - quanto sobrou
  - o que saiu

### Aplicação e uso
- entidade: `ApplicationEvent`
- representa:
  - o que foi usado
  - quanto foi usado
  - onde foi usado
  - em qual cultura/lote/fase

### Valor apropriado
- entidade: `CostAllocationLedgerEntry`
- representa:
  - o valor que entrou de verdade na conta da cultura/plano/lote/destino

### Colheita
- entidade: `Harvest`
- representa:
  - bruto
  - vendável
  - perda
  - destino

## Regra principal
Sem fato operacional, não existe custo real.
