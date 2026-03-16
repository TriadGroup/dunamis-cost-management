# Gemini Data Schema & Maintenance Log

## 1. Papel deste arquivo
Este arquivo guarda os schemas canônicos e o maintenance log do projeto.

Quando um schema mudar, este arquivo deve ser atualizado.

## 2. Schema canônico do fluxo real da fazenda

### 2.1 Compra
```json
{
  "id": "purchase-1",
  "name": "Herbicida",
  "supplier": "Agro Verde",
  "eventValueCents": 100000,
  "monthlyEquivalentCents": 0,
  "isStockable": true,
  "receivedAt": "2026-03-01",
  "receivedQuantity": 50,
  "receivedUnit": "L",
  "inventoryProductId": "product-1",
  "linkedCropId": "crop-1",
  "linkedCostCenter": "Campo aberto",
  "paymentStatus": "pago",
  "status": "ativo"
}
```

### 2.2 Produto do estoque
```json
{
  "id": "product-1",
  "name": "Herbicida",
  "commercialName": "Herbicida Campo",
  "category": "defensivo",
  "defaultUnit": "L",
  "notes": "",
  "active": true
}
```

### 2.3 Lote do estoque
```json
{
  "id": "lot-stock-1",
  "productId": "product-1",
  "purchaseId": "purchase-1",
  "code": "EST-20260301-001",
  "receivedAt": "2026-03-01",
  "quantityReceived": 50,
  "quantityAvailable": 40,
  "unit": "L",
  "unitCostCents": 2000,
  "expirationDate": "2026-12-31",
  "locationName": "Galpão principal",
  "status": "parcial",
  "notes": ""
}
```

### 2.4 Movimento do estoque
```json
{
  "id": "movement-1",
  "inventoryLotId": "lot-stock-1",
  "movementType": "aplicacao",
  "quantity": 10,
  "unit": "L",
  "occurredAt": "2026-03-05",
  "targetType": "lote",
  "targetId": "lot-prod-1",
  "reason": "Aplicação no alface",
  "notes": ""
}
```

### 2.5 Aplicação
```json
{
  "id": "application-1",
  "inventoryLotId": "lot-stock-1",
  "stockMovementId": "movement-1",
  "productId": "product-1",
  "cropId": "crop-1",
  "cropPlanId": "plan-1",
  "productionLotId": "lot-prod-1",
  "areaNodeIds": ["bed-01"],
  "cropStage": "vegetativo",
  "quantityApplied": 10,
  "unit": "L",
  "appliedAreaSqm": 250,
  "doseDescription": "10 L no bloco",
  "appliedAt": "2026-03-05",
  "responsible": "Equipe campo",
  "equipmentName": "Pulverizador costal",
  "weatherNotes": "",
  "notes": ""
}
```

### 2.6 Valor apropriado
```json
{
  "id": "allocation-1",
  "originType": "aplicacao",
  "originId": "application-1",
  "targetType": "lote",
  "targetId": "lot-prod-1",
  "cropId": "crop-1",
  "cropPlanId": "plan-1",
  "productionLotId": "lot-prod-1",
  "areaNodeId": "bed-01",
  "channelId": null,
  "driver": "por_quantidade_aplicada",
  "amountCents": 20000,
  "occurredAt": "2026-03-05",
  "notes": "10 L no bloco"
}
```

### 2.7 Colheita
```json
{
  "id": "harvest-1",
  "lotId": "lot-prod-1",
  "harvestedAt": "2026-04-15",
  "grossQuantity": 1000,
  "marketableQuantity": 900,
  "lossQuantity": 100,
  "unit": "unidade",
  "destinationBreakdown": [
    {
      "channelId": "channel-box",
      "quantity": 900,
      "unit": "unidade",
      "valueCents": 54000
    }
  ]
}
```

### 2.8 Linha de custo e preço
```json
{
  "cropId": "crop-1",
  "cropName": "Alface",
  "cropVariety": "Americana",
  "unitLabel": "unidade",
  "purchasedCostCents": 0,
  "stockUsedCostCents": 0,
  "appliedCostCents": 20000,
  "appropriatedCostCents": 30000,
  "laborCostCents": 10000,
  "machineryCostCents": 0,
  "utilityCostCents": 0,
  "marketableUnits": 900,
  "costPerUnitCents": 33,
  "minimumSalePricePerUnitCents": 33,
  "suggestedSalePricePerUnitCents": 45,
  "suggestedSalePricePerBoxCents": 540,
  "marginPct": 44.4,
  "plannedOnly": false
}
```

## 3. Regras de schema
1. Compra não entra direto no custo real.
2. Item estocável sem entrada não gera lote.
3. Lote do estoque sem saída não entra no valor apropriado.
4. Aplicação deve carregar cultura, área e quantidade.
5. Colheita deve carregar vendável e destinos.
6. Valor apropriado é a fonte de verdade do custo real.

## 4. Maintenance Log

### 2026-03-11
- Formalizado o schema canônico do fluxo real da fazenda.
- Mantida compatibilidade temporária com estruturas legadas em:
  - `Harvest`
  - `DemandChannel`
- Regra travada:
  - o `cost_management` permanece no mesmo lugar
  - a nova organização B.L.A.S.T. envolve o app, não move o app
