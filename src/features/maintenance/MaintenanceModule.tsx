import { useMemo } from 'react';
import { useMaintenanceStore } from '@/app/store/useMaintenanceStore';
import { useOptionCatalogStore } from '@/app/store/useOptionCatalogStore';
import { calculateMaintenanceInefficiency } from '@/entities';
import { formatCurrency } from '@/shared/lib/format';
import { CreatableSelect, DetailCard, ExecutiveCard, MoneyField, NumberField, SmartEmptyState, StatusChip } from '@/shared/ui';

export const MaintenanceModule = () => {
  const events = useMaintenanceStore((state) => state.events);
  const addEvent = useMaintenanceStore((state) => state.addEvent);
  const updateEvent = useMaintenanceStore((state) => state.updateEvent);
  const removeEvent = useMaintenanceStore((state) => state.removeEvent);
  const categoryOptions = useOptionCatalogStore((state) => state.getOptions('maintenance-category'));
  const impactOptions = useOptionCatalogStore((state) => state.getOptions('maintenance-impact'));
  const addCatalogOption = useOptionCatalogStore((state) => state.addOption);

  const snapshot = useMemo(() => calculateMaintenanceInefficiency(events), [events]);
  const monthlyReserve = events.reduce((acc, entry) => acc + entry.monthlyReserveCents, 0);

  return (
    <div className="page-stack">
      <DetailCard
        title="Manutenção e ativos"
        subtitle="Paradas e reserva"
        action={events.length > 0 ? <button className="cta-btn" onClick={() => addEvent()}>Novo</button> : undefined}
      >
        <div className="executive-grid">
          <ExecutiveCard title="Reserva mensal" value={formatCurrency(monthlyReserve)} helper="Provisionamento de manutenção" tone="warning" />
          <ExecutiveCard title="Downtime anual" value={`${snapshot.downtimeDaysYear.toFixed(1)} dias`} helper="Ineficiência operacional" tone={snapshot.downtimeDaysYear > 20 ? 'danger' : 'info'} />
          <ExecutiveCard title="Custo de ineficiência" value={formatCurrency(snapshot.inefficiencyCostCents)} helper="Paradas e perda de produtividade" tone="danger" />
        </div>
      </DetailCard>

      <DetailCard title="Eventos" subtitle="Manter ou trocar">
        {events.length === 0 ? (
          <SmartEmptyState
            title="Nenhuma manutenção cadastrada"
            description="Adicione o primeiro evento para acompanhar reserva, parada e decisão de troca."
            action={<button type="button" className="cta-btn" onClick={() => addEvent()}>Adicionar primeiro evento</button>}
          />
        ) : (
          <div className="page-stack">
            {events.map((event) => (
              <article key={event.id} className="detail-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem' }}>{event.assetName}</h4>
                    <p style={{ marginTop: 4, color: '#5f6f64', fontSize: '0.84rem' }}>
                      {event.category} · {event.maintenanceType} · {event.interval}
                    </p>
                  </div>
                  <StatusChip label={event.recommendation} tone={event.recommendation === 'trocar' ? 'high' : event.recommendation === 'avaliar' ? 'medium' : 'low'} />
                </div>

                <div className="section-grid-4" style={{ marginTop: 12 }}>
                  <label>
                    Custo por evento
                    <MoneyField valueCents={event.costPerEventCents} onChange={(nextValueCents) => updateEvent(event.id, { costPerEventCents: nextValueCents })} />
                  </label>
                  <label>
                    Reserva mensal
                    <MoneyField valueCents={event.monthlyReserveCents} onChange={(nextValueCents) => updateEvent(event.id, { monthlyReserveCents: nextValueCents })} />
                  </label>
                  <label>
                    Dias de parada
                    <NumberField value={event.downtimeDays} onChange={(e) => updateEvent(event.id, { downtimeDays: Number(e.target.value || 0) })} suffix="dias" />
                  </label>
                  <label>
                    Próxima data
                    <input type="date" className="input-dark" value={event.nextDate} onChange={(e) => updateEvent(event.id, { nextDate: e.target.value })} />
                  </label>
                </div>

                <div className="section-grid-2" style={{ marginTop: 10 }}>
                  <label>
                    Categoria do ativo
                    <CreatableSelect
                      value={event.category}
                      options={categoryOptions}
                      placeholder="Escolha a categoria"
                      onChange={(value) => updateEvent(event.id, { category: value })}
                      onCreate={(label) => addCatalogOption('maintenance-category', label, label)}
                      createLabel="Criar categoria"
                    />
                  </label>
                  <label>
                    Impacto operacional
                    <CreatableSelect
                      value={event.impact}
                      options={impactOptions}
                      placeholder="Escolha o impacto"
                      onChange={(value) => updateEvent(event.id, { impact: value })}
                      onCreate={(label) => addCatalogOption('maintenance-impact', label, label)}
                      createLabel="Criar impacto"
                    />
                  </label>
                </div>

                <div style={{ marginTop: 10 }}>
                  <button className="ghost-btn" onClick={() => removeEvent(event.id)}>Remover evento</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </DetailCard>
    </div>
  );
};
