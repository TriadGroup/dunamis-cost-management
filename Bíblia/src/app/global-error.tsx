"use client";

import Link from "next/link";
import { useEffect } from "react";

import "@/app/globals.css";

export default function GlobalErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[hsl(228_28%_7%)] text-[hsl(42_20%_92%)]">
        <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16">
          <div className="w-full rounded-[32px] border border-[hsl(228_14%_24%/0.8)] bg-[linear-gradient(180deg,rgba(18,22,32,0.98),rgba(10,14,22,0.98))] p-8 shadow-[0_40px_140px_rgba(0,0,0,0.38)] sm:p-10">
            <p className="inline-flex rounded-full border border-[hsl(42_48%_34%/0.6)] bg-[hsl(42_48%_24%/0.28)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[hsl(42_68%_66%)]">
              Falha crítica
            </p>
            <h1 className="mt-5 font-serif text-[2.7rem] leading-[0.94] tracking-[-0.06em] sm:text-[3.8rem]">
              O shell principal do app falhou.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[hsl(42_12%_72%)]">
              A falha aconteceu acima da árvore normal da aplicação. Reinicie esta rota ou volte ao início para
              reconstruir o estado.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full border border-transparent bg-[hsl(42_20%_92%)] px-5 py-3 text-sm font-semibold text-[hsl(228_28%_7%)] transition hover:-translate-y-px hover:opacity-90"
              >
                Tentar novamente
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[hsl(228_14%_24%/0.8)] bg-[rgba(255,255,255,0.04)] px-5 py-3 text-sm font-semibold text-[hsl(42_20%_92%)] transition hover:border-[hsl(42_48%_34%/0.6)]"
              >
                Voltar ao início
              </Link>
            </div>

            {error.digest ? (
              <p className="mt-6 text-xs text-[hsl(42_10%_58%)]">Digest do erro: {error.digest}</p>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}
