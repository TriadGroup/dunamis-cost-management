export type AreaNodeType =
  | 'fazenda'
  | 'unidade'
  | 'setor'
  | 'ambiente'
  | 'talhao'
  | 'canteiro'
  | 'estufa'
  | 'pomar'
  | 'pivo'
  | 'bloco';

export interface AreaNode {
  id: string;
  parentId: string | null;
  type: AreaNodeType;
  name: string;
  areaSqm: number;
  active: boolean;
  notes: string;
}
