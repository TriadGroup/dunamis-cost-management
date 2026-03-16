import { useMemo, useState } from 'react';
import { formatNumber } from '@/shared/lib/format';
import { CenterModal, SmartEmptyState, StatusChip } from '@/shared/ui';
import { useFarmWeather, weatherCodeLabel, weekdayLabel } from '@/features/dashboard/model/useFarmWeather';

const formatCalendarDay = (date: string): string =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${date}T12:00:00`));

type WeatherPanelProps = {
  variant?: 'default' | 'topbar';
};

export const WeatherPanel = ({ variant = 'default' }: WeatherPanelProps) => {
  const weather = useFarmWeather();
  const [modalOpen, setModalOpen] = useState(false);

  const today = weather.days[0] ?? null;
  const headlineTemp = weather.currentTemp ?? today?.maxTemp ?? null;
  const headlineLabel = weatherCodeLabel(weather.currentWeatherCode ?? today?.weatherCode ?? null);

  const widgetCopy = useMemo(() => {
    if (weather.status === 'idle') {
      return {
        temp: '--',
        label: 'Sem clima',
        meta: 'Defina o lugar'
      };
    }

    if (weather.status === 'loading') {
      return {
        temp: '...',
        label: 'Carregando',
        meta: 'Buscando previsao'
      };
    }

    if (weather.status === 'error') {
      return {
        temp: '--',
        label: 'Sem previsao',
        meta: 'Tente novamente'
      };
    }

    return {
      temp: headlineTemp !== null ? `${formatNumber(headlineTemp, 0)}°` : '--',
      label: headlineLabel,
      meta: today ? `${formatNumber(today.rainChance, 0)}% chuva hoje` : 'Toque para ver'
    };
  }, [headlineLabel, headlineTemp, today, weather.status]);

  return (
    <>
      <button
        type="button"
        className={variant === 'topbar' ? 'weather-mini-widget is-topbar' : 'weather-mini-widget'}
        onClick={() => setModalOpen(true)}
        aria-label="Abrir detalhes do clima"
        title="Abrir detalhes do clima"
      >
        <span className="weather-mini-kicker">Clima</span>
        <div className="weather-mini-main">
          <strong>{widgetCopy.temp}</strong>
          <span>{widgetCopy.label}</span>
        </div>
        <small>{widgetCopy.meta}</small>
      </button>

      <CenterModal
        open={modalOpen}
        title="Clima na fazenda"
        subtitle="Hoje e próximos dias"
        onClose={() => setModalOpen(false)}
      >
        {weather.status === 'idle' ? (
          <SmartEmptyState title="Sem lugar definido" description={weather.reason || 'Defina o lugar da fazenda para ver a previsao.'} />
        ) : null}

        {weather.status === 'loading' ? (
          <div className="weather-modal-loading">
            <div className="weather-modal-skeleton is-lg" />
            <div className="weather-modal-skeleton-grid">
              <div className="weather-modal-skeleton" />
              <div className="weather-modal-skeleton" />
              <div className="weather-modal-skeleton" />
            </div>
          </div>
        ) : null}

        {weather.status === 'error' ? (
          <SmartEmptyState title="Nao deu para puxar o clima" description={weather.reason || 'Tente de novo em instantes.'} />
        ) : null}

        {weather.status === 'ready' ? (
          <div className="weather-modal-stack">
            <section className="weather-modal-hero">
              <div className="weather-modal-copy">
                <span className="weather-modal-kicker">Agora</span>
                <h4>{weather.locationLabel}</h4>
                <p>{headlineLabel}</p>
              </div>
              <div className="weather-modal-temp">
                <strong>{headlineTemp !== null ? `${formatNumber(headlineTemp, 0)}°` : '--'}</strong>
                <StatusChip label="Previsao leve" tone="low" />
              </div>
            </section>

            {today ? (
              <section className="weather-modal-today">
                <div className="weather-modal-stat">
                  <span>Hoje</span>
                  <strong>{`${formatNumber(today.maxTemp, 0)}° / ${formatNumber(today.minTemp, 0)}°`}</strong>
                </div>
                <div className="weather-modal-stat">
                  <span>Chuva</span>
                  <strong>{`${formatNumber(today.rainChance, 0)}%`}</strong>
                </div>
                <div className="weather-modal-stat">
                  <span>Data</span>
                  <strong>{formatCalendarDay(today.date)}</strong>
                </div>
              </section>
            ) : null}

            <section className="weather-modal-forecast-grid">
              {weather.days.map((day) => (
                <article key={day.date} className="weather-modal-day">
                  <span className="weather-modal-day-label">{weekdayLabel(day.date)}</span>
                  <strong>{`${formatNumber(day.maxTemp, 0)}°`}</strong>
                  <small>{`${formatNumber(day.minTemp, 0)}°`}</small>
                  <p>{weatherCodeLabel(day.weatherCode)}</p>
                  <span className="weather-modal-rain">{`${formatNumber(day.rainChance, 0)}% chuva`}</span>
                </article>
              ))}
            </section>
          </div>
        ) : null}
      </CenterModal>
    </>
  );
};
