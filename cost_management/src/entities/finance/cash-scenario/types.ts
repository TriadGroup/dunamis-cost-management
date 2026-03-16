export type ScenarioKind = 'baseline' | 'extraordinario' | 'stress_test';

export interface CashScenario {
  id: string;
  name: string;
  kind: ScenarioKind;
  monthRef: string;
  kitchenDemandFactor: number;
  boxDemandFactor: number;
  eventDemandFactor: number;
  externalDemandFactor: number;
  notes: string;
}
