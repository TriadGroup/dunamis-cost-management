"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
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
    <div className="content-frame py-16 sm:py-24">
      <div className="panel-surface panel-elevated mx-auto max-w-3xl p-8 sm:p-10">
        <p className="eyebrow-pill">Falha de execução</p>
        <h1 className="mt-5 font-serif text-[2.5rem] leading-[0.96] tracking-[-0.06em] text-[hsl(var(--foreground))] sm:text-[3.4rem]">
          O app encontrou um erro inesperado.
        </h1>
        <p className="section-copy mt-4 max-w-2xl">
          A interface foi interrompida antes de concluir esta rota. O estado pode ser recarregado sem perder o
          restante do site.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border border-transparent bg-[hsl(var(--foreground))] px-5 py-3 text-sm font-semibold text-[hsl(var(--surface))] transition hover:-translate-y-px hover:opacity-90"
          >
            Tentar novamente
          </button>
          <Link
            href="/ler"
            className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border)/0.58)] bg-[hsl(var(--surface-alt)/0.78)] px-5 py-3 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent)/0.18)] hover:bg-[hsl(var(--surface))]"
          >
            Ir para o leitor
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-transparent bg-transparent px-4 py-3 text-sm font-semibold text-[hsl(var(--muted))] transition hover:bg-[hsl(var(--surface-alt)/0.74)] hover:text-[hsl(var(--foreground))]"
          >
            Voltar ao início
          </Link>
        </div>

        {error.digest ? (
          <p className="mt-6 text-xs text-[hsl(var(--muted))]">Digest do erro: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
