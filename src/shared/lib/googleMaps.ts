const GOOGLE_SCRIPT_ID = 'dunamis-google-maps-script';

let loaderPromise: Promise<any | null> | null = null;

export const isGoogleMapsEnabled = (): boolean => Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

export const loadGoogleMapsPlaces = async (): Promise<any | null> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  if (window.google?.maps?.places) {
    return window.google;
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google ?? null), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Nao foi possivel carregar o Google Maps.')), { once: true });
      return;
    }

    const callbackName = '__dunamisGoogleMapsInit__';
    window[callbackName] = () => resolve(window.google ?? null);

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR&region=BR&callback=${callbackName}`;
    script.onerror = () => reject(new Error('Nao foi possivel carregar o Google Maps.'));
    document.head.appendChild(script);
  }).finally(() => {
    delete window.__dunamisGoogleMapsInit__;
  });

  return loaderPromise;
};
