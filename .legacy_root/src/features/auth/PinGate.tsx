import { useState } from 'react';
import { useAppStore } from '@/app/store/useAppStore';

export const PinGate = () => {
  const pinHash = useAppStore((state) => state.data.pinHash);
  const auth = useAppStore((state) => state.auth);
  const actions = useAppStore((state) => state.actions);
  const [pin, setPin] = useState('');

  const isSetup = !pinHash;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSetup) actions.setPin(pin);
    else actions.unlockWithPin(pin);
    setPin('');
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-3xl border border-fern-900/10 bg-white/85 p-8 shadow-glow backdrop-blur-md">
        <h1 className="font-display text-3xl text-fern-900">Dunamis Farm</h1>
        <p className="mt-2 text-sm text-fern-800/80">
          {isSetup ? 'Crie seu PIN local para proteger o painel financeiro.' : 'Informe seu PIN para desbloquear o painel.'}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            className="w-full rounded-xl border border-fern-900/20 bg-fern-50/50 px-4 py-3 text-fern-900 outline-none ring-0 transition focus:border-fern-700"
          />
          {auth.authError && <p className="text-sm text-red-700">{auth.authError}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-fern-800 px-4 py-3 font-semibold text-fern-50 transition hover:bg-fern-700"
          >
            {isSetup ? 'Salvar PIN e entrar' : 'Desbloquear'}
          </button>
        </form>
      </section>
    </main>
  );
};
