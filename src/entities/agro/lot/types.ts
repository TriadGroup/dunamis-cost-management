import type { CropStage } from '@/entities/agro/application-event/types';
import type { ApplicationLog } from '@/entities/agro/application-log/types';
import type { ApplicationEvent } from '@/entities/agro/application-event/types';
import type { Harvest } from '@/entities/agro/harvest/types';

export interface Lot {
  id: string;
  code: string;
  cropId: string;
  cropPlanId: string | null;
  variety: string;
  receivedAt: string;
  quantityReceived: number;
  quantityPlanted: number;
  origin: string;
  location: string;
  areaNodeIds: string[];
  stage: CropStage;
  applicationLogs: ApplicationLog[];
  applicationEvents?: ApplicationEvent[];
  harvests: Harvest[];
  appropriatedCostCents: number;
  marketableQuantity: number;
  discardedQuantity: number;
  traceabilityStatus: 'incompleta' | 'parcial' | 'completa';
  notes: string;
}

export interface TraceabilitySummary {
  score: number;
  missingFields: string[];
  status: 'incompleta' | 'parcial' | 'completa';
}
