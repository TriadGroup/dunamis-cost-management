import { useState } from 'react';
import { useUiPreferencesStore } from '@/app/store/useUiPreferencesStore';
import { BrandLogo } from '@/shared/ui';

export const PinGate = () => {
  const pinHash = useUiPreferencesStore((state) => state.pinHash);
  const authError = useUiPreferencesStore((state) => state.authError);
  const setPin = useUiPreferencesStore((state) => state.setPin);
  const unlockWithPin = useUiPreferencesStore((state) => state.unlockWithPin);
  const [pin, setPinValue] = useState('');

  const needsSetup = !pinHash;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (needsSetup) {
      setPin(pin);
      return;
    }

    unlockWithPin(pin);
    setPinValue('');
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute left-1/2 top-[-22rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(137,207,122,0.35),transparent_60%)]" />

      <section className="frost-card relative w-full max-w-md rounded-[30px] p-8">
        <BrandLogo variant="hero" />
        <h1 className="mt-4 text-3xl font-semibold text-[#2f4e2f]">Dunamis Farm</h1>
        <p className="mt-2 text-sm text-[#5c7c66]">
          {needsSetup
            ? 'Defina a senha de acesso inicial da operação.'
            : 'Digite a senha para abrir o painel da fazenda.'}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="ml-4 text-[10px] font-bold uppercase tracking-wider text-[#5c7c66]">
              {needsSetup ? 'Nova senha' : 'Senha de acesso'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              placeholder={needsSetup ? 'Crie uma senha numerica' : 'Use a senha 1234'}
              value={pin}
              onChange={(event) => setPinValue(event.target.value)}
              className="input-dark w-full"
              required
            />
          </div>

          {!needsSetup && (
            <p className="text-xs text-[#5c7c66]">
              Senha padrao da fazenda: <strong>1234</strong>
            </p>
          )}

          {authError && <p className="text-sm text-[#d45e6e]">{authError}</p>}

          <button type="submit" className="cta-btn w-full">
            {needsSetup ? 'Salvar senha' : 'Entrar no painel'}
          </button>
        </form>
      </section>
    </main>
  );
};
