import { useEffect, useMemo, useRef, useState } from 'react';
import type { OperationIdentity } from '@/app/store/useSetupStore';
import { isGoogleMapsEnabled, loadGoogleMapsPlaces } from '@/shared/lib/googleMaps';
import { StatusChip, UiIcon } from '@/shared/ui';

interface LocationPrediction {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  description: string;
}

interface FarmLocationFieldProps {
  identity: OperationIdentity;
  onChange: (patch: Partial<OperationIdentity>) => void;
}

const buildLocationLabel = (place: any, fallback: string): string => {
  if (place?.name && typeof place.name === 'string') return place.name;
  return fallback;
};

export const FarmLocationField = ({ identity, onChange }: FarmLocationFieldProps) => {
  const [query, setQuery] = useState(identity.location);
  const [predictions, setPredictions] = useState<LocationPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [focused, setFocused] = useState(false);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);

  const googleEnabled = isGoogleMapsEnabled();
  const showPredictions = focused && predictions.length > 0;

  useEffect(() => {
    setQuery(identity.location);
  }, [identity.location]);

  useEffect(() => {
    if (!googleEnabled) return;

    let active = true;
    loadGoogleMapsPlaces()
      .then((google) => {
        if (!active || !google?.maps?.places) return;
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        placesServiceRef.current = new google.maps.places.PlacesService(document.createElement('div'));
        setGoogleReady(true);
      })
      .catch(() => {
        if (!active) return;
        setGoogleReady(false);
      });

    return () => {
      active = false;
    };
  }, [googleEnabled]);

  useEffect(() => {
    if (!googleEnabled || !googleReady || query.trim().length < 3) {
      setPredictions([]);
      return;
    }

    const handle = window.setTimeout(() => {
      setLoading(true);
      autocompleteServiceRef.current?.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'br' }
        },
        (results: any[] | null) => {
          setLoading(false);
          const nextPredictions = (results ?? []).slice(0, 5).map((prediction) => ({
            placeId: prediction.place_id,
            primaryText: prediction.structured_formatting?.main_text ?? prediction.description,
            secondaryText: prediction.structured_formatting?.secondary_text ?? '',
            description: prediction.description
          }));
          setPredictions(nextPredictions);
        }
      );
    }, 250);

    return () => window.clearTimeout(handle);
  }, [googleEnabled, googleReady, query]);

  const helperText = useMemo(() => {
    if (identity.locationAddress && identity.locationAddress !== identity.location) {
      return identity.locationAddress;
    }
    if (!googleEnabled) {
      return 'Digite manualmente ou conecte uma chave do Google para reconhecer o nome oficial do lugar.';
    }
    if (loading) {
      return 'Buscando o lugar no Google Maps...';
    }
    return 'Digite o endereco ou nome do lugar. O sistema tenta reconhecer pelo Google Maps.';
  }, [googleEnabled, identity.location, identity.locationAddress, loading]);

  const handleManualChange = (value: string) => {
    setQuery(value);
    onChange({
      location: value,
      locationAddress: '',
      locationPlaceId: '',
      latitude: null,
      longitude: null
    });
  };

  const selectPrediction = (prediction: LocationPrediction) => {
    setQuery(prediction.description);
    setPredictions([]);
    setFocused(false);

    const service = placesServiceRef.current;
    if (!service) {
      onChange({
        location: prediction.primaryText,
        locationAddress: prediction.description,
        locationPlaceId: prediction.placeId
      });
      return;
    }

    setLoading(true);
    service.getDetails(
      {
        placeId: prediction.placeId,
        fields: ['name', 'formatted_address', 'geometry']
      },
      (place: any, status: string) => {
        setLoading(false);
        if (status !== 'OK' || !place) {
          onChange({
            location: prediction.primaryText,
            locationAddress: prediction.description,
            locationPlaceId: prediction.placeId
          });
          return;
        }

        const latitude = place.geometry?.location?.lat?.();
        const longitude = place.geometry?.location?.lng?.();
        onChange({
          location: buildLocationLabel(place, prediction.primaryText),
          locationAddress: place.formatted_address || prediction.description,
          locationPlaceId: prediction.placeId,
          latitude: Number.isFinite(latitude) ? latitude : null,
          longitude: Number.isFinite(longitude) ? longitude : null
        });
      }
    );
  };

  return (
    <div className="location-field span-2">
      <div className="location-field-head">
        <span>Endereço da fazenda</span>
        <StatusChip label={googleEnabled ? 'Google Maps' : 'Manual'} tone={googleEnabled ? 'low' : 'medium'} />
      </div>
      <div className="location-field-box">
        <UiIcon name="home" className="location-field-icon" />
        <input
          className="input-dark"
          value={query}
          onChange={(event) => handleManualChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder="Rua, bairro, cidade ou nome do lugar"
        />
        {showPredictions ? (
          <div className="location-prediction-list">
            {predictions.map((prediction) => (
              <button key={prediction.placeId} type="button" className="location-prediction-item" onMouseDown={() => selectPrediction(prediction)}>
                <strong>{prediction.primaryText}</strong>
                <span>{prediction.secondaryText || prediction.description}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <p className="location-field-helper">{helperText}</p>
      {identity.latitude && identity.longitude ? (
        <div className="location-confirmed-chip">
          <StatusChip label="Lugar reconhecido" tone="positive" />
          <span>{`${identity.latitude.toFixed(4)}, ${identity.longitude.toFixed(4)}`}</span>
        </div>
      ) : null}
    </div>
  );
};
