export interface DemandForecast {
  id: string;
  channelId: string;
  monthRef: string;
  demandKg: number;
  demandUnits: number;
  isExtraordinary: boolean;
}
