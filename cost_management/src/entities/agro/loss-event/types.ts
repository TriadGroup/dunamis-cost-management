export type LossCause =
  | 'vencimento'
  | 'evaporacao'
  | 'quebra'
  | 'descarte'
  | 'falha_germinacao'
  | 'falha_pegamento'
  | 'campo'
  | 'pos_colheita'
  | 'transporte'
  | 'outro';

export interface LossEvent {
  id: string;
  date: string;
  cause: LossCause;
  sourceType: 'estoque' | 'lote' | 'colheita' | 'canal';
  sourceId: string;
  quantity: number;
  unit: string;
  estimatedCostCents: number;
  notes: string;
}
