import { useState } from 'react';
import { useAuthStore } from '@/app/store/useAuthStore';
import { BrandLogo } from '@/shared/ui';

export const PinGate = () => {
  const { signIn, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    await signIn(email);
    setSent(true);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute left-1/2 top-[-22rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(137,207,122,0.35),transparent_60%)]" />

      <section className="frost-card relative w-full max-w-md rounded-[30px] p-8">
        <BrandLogo variant="hero" />
        <h1 className="mt-4 text-3xl font-semibold text-[#2f4e2f]">Dunamis Farm</h1>
        <p className="mt-2 text-sm text-[#5c7c66]">
          Acesse o painel agro-financeiro com segurança via e-mail.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4 text-center">
            <div className="text-sm font-medium text-[#2f4e2f]">Link de acesso enviado!</div>
            <p className="text-xs text-[#5c7c66]">Verifique sua caixa de entrada em {email}.</p>
            <button 
              onClick={() => setSent(false)}
              className="text-xs font-semibold text-[#2f4e2f] hover:underline"
            >
              Tentar outro e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#5c7c66] ml-4">
                E-mail Profissional
              </label>
              <input
                type="email"
                placeholder="nome@fazenda.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-dark w-full"
                required
              />
            </div>
            {error && <p className="text-sm text-[#d45e6e]">{error}</p>}
            <button 
              type="submit" 
              disabled={isLoading}
              className="cta-btn w-full disabled:opacity-50"
            >
              {isLoading ? 'Enviando...' : 'Receber link de acesso'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};
