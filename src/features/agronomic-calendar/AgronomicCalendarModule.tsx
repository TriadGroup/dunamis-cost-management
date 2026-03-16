import { useMemo, useState } from 'react';
import { useAgronomicCalendarStore } from '@/app/store/useAgronomicCalendarStore';
import { guidelineForMonth, incompatibilityAlerts } from '@/entities';
import { DetailCard, ExecutiveCard, FilterPills, SmartEmptyState, StatusChip } from '@/shared/ui';

const months = [
  { id: '1', label: 'Jan' },
  { id: '2', label: 'Fev' },
  { id: '3', label: 'Mar' },
  { id: '4', label: 'Abr' },
  { id: '5', label: 'Mai' },
  { id: '6', label: 'Jun' },
  { id: '7', label: 'Jul' },
  { id: '8', label: 'Ago' },
  { id: '9', label: 'Set' },
  { id: '10', label: 'Out' },
  { id: '11', label: 'Nov' },
  { id: '12', label: 'Dez' }
];

export const AgronomicCalendarModule = () => {
  const guidelines = useAgronomicCalendarStore((state) => state.guidelines);
  const photoperiod = useAgronomicCalendarStore((state) => state.photoperiod);
  const currentMonth = String(new Date().getMonth() + 1);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [environment, setEnvironment] = useState<'campo_aberto' | 'protegido'>('campo_aberto');

  const monthNumber = Number(month);
  const recommended = useMemo(() => guidelineForMonth(guidelines, monthNumber, environment), [environment, guidelines, monthNumber]);
  const alerts = useMemo(() => incompatibilityAlerts(guidelines, monthNumber, recommended.map((entry) => entry.cropName)), [guidelines, monthNumber, recommended]);
  const daylight = photoperiod.find((entry) => entry.month === monthNumber)?.daylightHours ?? 0;

  return (
    <div className="page-stack">
      <DetailCard
        title="Calendário agronômico"
        subtitle="Janelas do ano"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={environment === 'campo_aberto' ? 'cta-btn' : 'ghost-btn'} onClick={() => setEnvironment('campo_aberto')}>Campo aberto</button>
            <button className={environment === 'protegido' ? 'cta-btn' : 'ghost-btn'} onClick={() => setEnvironment('protegido')}>Protegido</button>
          </div>
        }
      >
        <div className="executive-grid">
          <ExecutiveCard title="Fotoperíodo" value={`${daylight.toFixed(1)} h`} helper="Média diária do mês" tone="info" />
          <ExecutiveCard title="Culturas recomendadas" value={String(recommended.length)} helper={`Para ${environment.replace('_', ' ')}`} tone="positive" />
          <ExecutiveCard title="Alertas" value={String(alerts.length)} helper="Incompatibilidades detectadas" tone={alerts.length > 0 ? 'warning' : 'positive'} />
        </div>
      </DetailCard>

      <DetailCard title="Janela" subtitle="Mes e ambiente">
        <FilterPills options={months} activeId={month} onChange={setMonth} />
      </DetailCard>

      <DetailCard title="Recomendacoes" subtitle="Leitura rapida">
        {recommended.length === 0 ? (
          <SmartEmptyState
            title="Sem recomendação para esse filtro"
            description="Tente outro mês ou volte para a janela atual."
            action={
              <button
                type="button"
                className="cta-btn"
                onClick={() => {
                  setMonth(currentMonth);
                  setEnvironment('campo_aberto');
                }}
              >
                Voltar para o mês atual
              </button>
            }
          />
        ) : (
          <div className="page-stack">
            {recommended.map((entry) => (
              <article key={entry.id} className="detail-card tone-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '1rem' }}>{entry.cropName}</h4>
                  <StatusChip label={entry.environment.replace('_', ' ')} tone="neutral" />
                </div>
                <p style={{ marginTop: 8, color: '#5c6d62', fontSize: '0.86rem' }}>{entry.notes}</p>
              </article>
            ))}
          </div>
        )}

        {alerts.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {alerts.map((alert) => (
              <StatusChip key={alert} label={alert} tone="medium" className="!mr-2 !mb-2" />
            ))}
          </div>
        )}
      </DetailCard>
    </div>
  );
};
