import type { CashScenario } from '@/entities/finance/cash-scenario/types';
import type { DemandChannel } from '@/entities/agro/demand-channel/types';

const safe = (value: number | undefined): number => Math.max(0, Math.round(Number.isFinite(value) ? (value as number) : 0));

const demandValue = (channel: DemandChannel, mode: 'base' | 'cenario'): number => {
  if (mode === 'base') {
    return safe(channel.baselineDemand);
  }
  return safe(channel.scenarioDemand);
};

export const sortChannelsByPriority = (channels: DemandChannel[]): DemandChannel[] => {
  return channels.slice().sort((a, b) => a.priority - b.priority);
};

export const applyScenarioDemand = (channels: DemandChannel[], scenario: CashScenario): DemandChannel[] => {
  return channels.map((channel) => {
    const factor =
      channel.type === 'kitchen'
        ? scenario.kitchenDemandFactor
        : channel.type === 'box'
          ? scenario.boxDemandFactor
          : channel.type === 'event'
            ? scenario.eventDemandFactor
            : scenario.externalDemandFactor;

    return {
      ...channel,
      scenarioDemand: Math.round(demandValue(channel, 'base') * Math.max(0, factor))
    };
  });
};

export const calculateChannelRevenue = (channels: DemandChannel[]): {
  internalRevenueCents: number;
  externalRevenueCents: number;
} => {
  return channels.reduce(
    (acc, channel) => {
      if (!channel.enabled) return acc;
      let unitPrice = safe(channel.acceptedPriceCents ?? channel.transferPriceCents);
      
      if (channel.items && channel.items.length > 0) {
        unitPrice = channel.items.reduce((sum, item) => sum + safe(item.acceptedPriceCents), 0);
      }

      const revenueCents = Math.round(demandValue(channel, 'cenario') * unitPrice);
      if (channel.type === 'kitchen') {
        acc.internalRevenueCents += revenueCents;
      } else {
        acc.externalRevenueCents += revenueCents;
      }
      return acc;
    },
    { internalRevenueCents: 0, externalRevenueCents: 0 }
  );
};

export const kitchenSensitivity = (channels: DemandChannel[]) => {
  const kitchen = channels.find((channel) => channel.type === 'kitchen');
  if (!kitchen) {
    return {
      acceptedVsIdealPct: 0,
      risk: 'high' as const
    };
  }

  let ideal = safe(kitchen.transferPriceCents);
  let accepted = safe(kitchen.acceptedPriceCents ?? kitchen.transferPriceCents);
  
  if (kitchen.items && kitchen.items.length > 0) {
    accepted = kitchen.items.reduce((sum, item) => sum + safe(item.acceptedPriceCents), 0);
  }

  if (ideal <= 0) return { acceptedVsIdealPct: 0, risk: 'high' as const };

  const acceptedVsIdealPct = (accepted / ideal) * 100;
  const risk = acceptedVsIdealPct >= 90 ? 'low' : acceptedVsIdealPct >= 70 ? 'medium' : 'high';
  return { acceptedVsIdealPct, risk };
};
