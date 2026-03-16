import type { MaintenanceEvent } from '@/entities/finance/maintenance-event/types';

const money = (value: number): number => Math.max(0, Math.round(Number.isFinite(value) ? value : 0));

export const calculateMaintenanceInefficiency = (events: MaintenanceEvent[]): {
  downtimeDaysYear: number;
  inefficiencyCostCents: number;
} => {
  const active = events.filter((event) => event.status === 'ativo');
  const downtimeDaysYear = active.reduce((acc, event) => acc + Math.max(0, event.downtimeDays), 0);
  const inefficiencyCostCents = active.reduce(
    (acc, event) => acc + Math.round(money(event.monthlyReserveCents) * (Math.max(0, event.downtimeDays) / 30)),
    0
  );

  return { downtimeDaysYear, inefficiencyCostCents };
};

export const nextMaintenanceMilestones = (events: MaintenanceEvent[]): MaintenanceEvent[] => {
  return events
    .filter((entry) => entry.status === 'ativo' && entry.nextDate)
    .slice()
    .sort((a, b) => +new Date(a.nextDate) - +new Date(b.nextDate))
    .slice(0, 6);
};
