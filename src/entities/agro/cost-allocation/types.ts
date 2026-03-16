export type CostOriginType =
  | 'estoque'
  | 'aplicacao'
  | 'mao_de_obra'
  | 'maquina'
  | 'energia'
  | 'agua'
  | 'manual'
  | 'implantacao_rateada';

export type CostTargetType = 'cultura' | 'plano' | 'lote' | 'canal' | 'area';

export type AllocationDriver =
  | 'por_area'
  | 'por_canteiro'
  | 'por_unidade'
  | 'por_lote'
  | 'por_hora'
  | 'por_quantidade_aplicada'
  | 'manual';

export interface CostAllocationLedgerEntry {
  id: string;
  originType: CostOriginType;
  originId: string;
  targetType: CostTargetType;
  targetId: string;
  cropId: string | null;
  cropPlanId: string | null;
  productionLotId: string | null;
  areaNodeId: string | null;
  channelId: string | null;
  driver: AllocationDriver;
  amountCents: number;
  occurredAt: string;
  notes: string;
}
