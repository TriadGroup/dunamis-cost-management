import { useState } from 'react';
import { useUiPreferencesStore } from '@/app/store';
import { BrandLogo } from '@/shared/ui';

export const PinGate = () => {
  const pinHash = useUiPreferencesStore((state) => state.pinHash);
  const authError = useUiPreferencesStore((state) => state.authError);
  const setPinAction = useUiPreferencesStore((state) => state.setPin);
  const unlockWithPin = useUiPreferencesStore((state) => state.unlockWithPin);
  const [pin, setPinValue] = useState('');

  const isSetup = !pinHash;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSetup) setPinAction(pin);
    else unlockWithPin(pin);
    setPinValue('');
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute left-1/2 top-[-22rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(137,207,122,0.35),transparent_60%)]" />

      <section className="frost-card relative w-full max-w-md rounded-[30px] p-8">
        <BrandLogo variant="hero" />
        <h1 className="mt-4 text-3xl font-semibold text-[#2f4e2f]">Dunamis Farm Agro</h1>
        <p className="mt-2 text-sm text-[#5c7c66]">
          {isSetup ? 'Crie seu PIN local para proteger o painel agro-financeiro.' : 'Informe seu PIN para desbloquear o painel.'}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            value={pin}
            onChange={(event) => setPinValue(event.target.value)}
            className="input-dark w-full"
          />
          {authError && <p className="text-sm text-[#d45e6e]">{authError}</p>}
          <button type="submit" className="cta-btn w-full">
            {isSetup ? 'Salvar PIN e entrar' : 'Desbloquear'}
          </button>
        </form>
      </section>
    </main>
  );
};
