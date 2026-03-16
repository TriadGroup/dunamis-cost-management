export type BedType = 'canteiro_solo' | 'tutorado' | 'pomar' | 'protegido';

export interface Bed {
  id: string;
  name: string;
  type: BedType;
  sizeSqm: number;
  environment: 'campo_aberto' | 'protegido';
  activeCropPlanId?: string;
}
