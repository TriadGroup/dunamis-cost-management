export type MaintenanceType = 'preventiva' | 'corretiva';
export type MaintenanceCadenceType = 'recorrente' | 'sob_demanda';
export type MaintenanceStatus = 'ativo' | 'pausado' | 'encerrado';

export interface MaintenanceEvent {
  id: string;
  assetName: string;
  category: string;
  maintenanceType: MaintenanceType;
  cadenceType: MaintenanceCadenceType;
  interval: string;
  costPerEventCents: number;
  downtimeDays: number;
  nextDate: string;
  annualEquivalentCents: number;
  monthlyReserveCents: number;
  impact: string;
  recommendation: 'manter' | 'trocar' | 'avaliar';
  notes: string;
  status: MaintenanceStatus;
}
