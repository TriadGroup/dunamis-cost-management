import type { AgronomicGuideline } from '@/entities/agro/agronomic-guideline/types';

export const guidelineForMonth = (
  guidelines: AgronomicGuideline[],
  month: number,
  environment: 'campo_aberto' | 'protegido'
): AgronomicGuideline[] => {
  return guidelines.filter(
    (entry) => entry.environment === environment && entry.recommendedMonths.includes(month)
  );
};

export const incompatibilityAlerts = (
  guidelines: AgronomicGuideline[],
  month: number,
  selectedCropNames: string[]
): string[] => {
  const selected = new Set(selectedCropNames.map((entry) => entry.toLowerCase()));
  return guidelines
    .filter((entry) => selected.has(entry.cropName.toLowerCase()) && entry.avoidMonths.includes(month))
    .map((entry) => `${entry.cropName}: evitar plantio neste mês para ${entry.environment.replace('_', ' ')}.`);
};
