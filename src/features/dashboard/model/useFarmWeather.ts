import { useEffect, useMemo, useState } from 'react';
import { useSetupStore } from '@/app/store/useSetupStore';

interface WeatherDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  rainChance: number;
  weatherCode: number;
}

interface WeatherSnapshot {
  status: 'idle' | 'loading' | 'ready' | 'error';
  locationLabel: string;
  currentTemp: number | null;
  currentWeatherCode: number | null;
  days: WeatherDay[];
  reason?: string;
}

const weatherCodeLabel = (weatherCode: number | null): string => {
  switch (weatherCode) {
    case 0:
      return 'Ceu limpo';
    case 1:
    case 2:
    case 3:
      return 'Poucas nuvens';
    case 45:
    case 48:
      return 'Neblina';
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return 'Chuva';
    case 71:
    case 73:
    case 75:
      return 'Granizo ou neve';
    case 95:
    case 96:
    case 99:
      return 'Temporal';
    default:
      return 'Tempo variavel';
  }
};

const weekdayLabel = (date: string): string =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
    .format(new Date(`${date}T12:00:00`))
    .replace('.', '');

const resolveCoordinates = async (location: string, signal: AbortSignal) => {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=pt&format=json`,
    { signal }
  );
  if (!response.ok) {
    throw new Error('Nao foi possivel localizar a fazenda para mostrar o tempo.');
  }

  const payload = await response.json();
  const firstResult = payload.results?.[0];
  if (!firstResult) {
    throw new Error('Nao achei esse lugar para puxar a previsao.');
  }

  return {
    latitude: firstResult.latitude as number,
    longitude: firstResult.longitude as number,
    locationLabel: [firstResult.name, firstResult.admin1].filter(Boolean).join(', ')
  };
};

const fetchForecast = async (latitude: number, longitude: number, signal: AbortSignal) => {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=5&timezone=auto`,
    { signal }
  );
  if (!response.ok) {
    throw new Error('Nao foi possivel carregar a previsao do tempo.');
  }

  return response.json();
};

export const useFarmWeather = (): WeatherSnapshot => {
  const identity = useSetupStore((state) => state.identity);
  const [snapshot, setSnapshot] = useState<WeatherSnapshot>({
    status: 'idle',
    locationLabel: '',
    currentTemp: null,
    currentWeatherCode: null,
    days: []
  });

  useEffect(() => {
    const controller = new AbortController();

    const loadWeather = async () => {
      if (!identity.location.trim() && (!identity.latitude || !identity.longitude)) {
        setSnapshot({
          status: 'idle',
          locationLabel: '',
          currentTemp: null,
          currentWeatherCode: null,
          days: [],
          reason: 'Defina o lugar da fazenda para ver a previsao.'
        });
        return;
      }

      setSnapshot((state) => ({
        ...state,
        status: 'loading',
        reason: undefined
      }));

      try {
        const coords =
          identity.latitude && identity.longitude
            ? {
                latitude: identity.latitude,
                longitude: identity.longitude,
                locationLabel: identity.locationAddress || identity.location
              }
            : await resolveCoordinates(identity.location, controller.signal);

        const forecast = await fetchForecast(coords.latitude, coords.longitude, controller.signal);
        const days: WeatherDay[] = (forecast.daily?.time ?? []).map((date: string, index: number) => ({
          date,
          maxTemp: forecast.daily.temperature_2m_max?.[index] ?? 0,
          minTemp: forecast.daily.temperature_2m_min?.[index] ?? 0,
          rainChance: forecast.daily.precipitation_probability_max?.[index] ?? 0,
          weatherCode: forecast.daily.weather_code?.[index] ?? 0
        }));

        setSnapshot({
          status: 'ready',
          locationLabel: coords.locationLabel,
          currentTemp: forecast.current?.temperature_2m ?? null,
          currentWeatherCode: forecast.current?.weather_code ?? null,
          days
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setSnapshot({
          status: 'error',
          locationLabel: identity.locationAddress || identity.location,
          currentTemp: null,
          currentWeatherCode: null,
          days: [],
          reason: error instanceof Error ? error.message : 'Nao foi possivel carregar a previsao.'
        });
      }
    };

    loadWeather();

    return () => controller.abort();
  }, [identity.latitude, identity.location, identity.locationAddress, identity.longitude]);

  return useMemo(() => snapshot, [snapshot]);
};

export { weatherCodeLabel, weekdayLabel };
