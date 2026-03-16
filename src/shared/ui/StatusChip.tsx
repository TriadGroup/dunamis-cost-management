import clsx from 'clsx';

interface StatusChipProps {
  label: string;
  tone?: 'high' | 'medium' | 'low' | 'neutral' | 'positive' | 'danger' | 'warning' | 'info';
  className?: string;
}

export const StatusChip = ({ label, tone = 'neutral', className }: StatusChipProps) => {
  const normalizedTone =
    tone === 'positive' ? 'low' : tone === 'danger' ? 'high' : tone === 'warning' ? 'medium' : tone === 'info' ? 'neutral' : tone;
  return <span className={clsx('status-chip', `status-chip-${normalizedTone}`, className)}>{label}</span>;
};
