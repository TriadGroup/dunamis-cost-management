export interface PhotoperiodEntry {
  month: number;
  daylightHours: number;
}

export interface AgronomicGuideline {
  id: string;
  cropName: string;
  environment: 'campo_aberto' | 'protegido';
  recommendedMonths: number[];
  avoidMonths: number[];
  notes: string;
}
