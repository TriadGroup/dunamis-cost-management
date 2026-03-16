"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Blocks,
  BookOpenText,
  LibraryBig,
  MoonStar,
  Search,
  ShieldCheck,
  Sparkles,
  SunMedium
} from "lucide-react";
import { useTheme } from "next-themes";

import { ActionLink, Badge } from "@/components/ui";
import { getLibrarySummary } from "@/lib/demo/repository";
import { referenceToHref } from "@/lib/reference/normalize";
import { cn } from "@/lib/utils";

const navItems: Array<{
  href: Route;
  label: string;
  caption: string;
  icon: LucideIcon;
}> = [
  { href: "/ler", label: "Ler", caption: "canon, livros e capitulos", icon: BookOpenText },
  { href: "/autores", label: "Autores", caption: "eras, tradicoes e cobertura", icon: LibraryBig },
  { href: "/temas", label: "Temas", caption: "doutrina, tensoes e percursos", icon: Blocks },
  { href: "/busca", label: "Busca", caption: "atalho global para tudo", icon: Search },
  { href: "/admin", label: "Curadoria", caption: "fontes, revisao e ingestao", icon: ShieldCheck }
];

const modeMeta = {
  explore: {
    label: "Explorar",
    description: "descoberta por autor, obra, tema e tradicao",
    actionLabel: "Abrir leitor",
    actionHref: "/ler"
  },
  read: {
    label: "Ler",
    description: "texto em primeiro plano, estudo so quando o verso pede",
    actionLabel: "Joao 3:16",
    actionHref: "/ler/naa/joao/3/16"
  },
  study: {
    label: "Estudar",
    description: "painel contextual, comentario por escopo e fontes sob demanda",
    actionLabel: "Comparar",
    actionHref: "/comparar/joao/3/16"
  },
  admin: {
    label: "Curar",
    description: "operacoes editoriais, revisao e licenciamento",
    actionLabel: "Abrir leitor",
    actionHref: "/ler"
  }
} as const;

function resolveMode(pathname: string) {
  if (pathname.startsWith("/admin")) {
    return modeMeta.admin;
  }

  if (pathname.startsWith("/comparar") || /^\/ler\/[^/]+\/[^/]+\/\d+\/\d+$/.test(pathname)) {
    return modeMeta.study;
  }

  if (pathname.startsWith("/ler")) {
    return modeMeta.read;
  }

  return modeMeta.explore;
}

function isReaderRoute(pathname: string) {
  return pathname.startsWith("/ler") || pathname.startsWith("/comparar");
}

function RailLink({
  href,
  label,
  caption,
  icon: Icon
}: {
  href: Route;
  label: string;
  caption: string;
  icon: LucideIcon;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 rounded-[20px] border px-3 py-3 transition lg:justify-center xl:justify-start xl:px-4",
        active
          ? "border-[hsl(var(--accent)/0.18)] bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent))]"
          : "border-transparent text-[hsl(var(--muted))] hover:border-[hsl(var(--border)/0.58)] hover:bg-[hsl(var(--surface-alt)/0.72)] hover:text-[hsl(var(--foreground))]"
      )}
    >
      <div
        className={cn(
          "mt-0.5 rounded-2xl p-2.5 transition",
          active
            ? "bg-[hsl(var(--accent)/0.12)]"
            : "bg-[hsl(var(--surface-alt)/0.72)] group-hover:bg-[hsl(var(--surface))]"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 lg:hidden xl:block">
        <p className="text-sm font-semibold tracking-[-0.01em]">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[hsl(var(--muted))]">{caption}</p>
      </div>
    </Link>
  );
}

function ShellBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-3 rounded-[22px] border border-[hsl(var(--border)/0.44)] bg-[hsl(var(--surface)/0.8)] shadow-[0_12px_30px_rgba(17,16,20,0.12)]",
        compact ? "px-3 py-2.5" : "px-3 py-3 xl:px-4"
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[hsl(var(--foreground))] text-sm font-semibold text-[hsl(var(--surface))]">
        BC
      </div>
      <div>
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--muted))]">
          Biblia Comentada
        </p>
        <p className={cn("mt-1 tracking-[-0.04em] text-[hsl(var(--foreground))]", compact ? "font-serif text-lg" : "font-serif text-xl")}>
          Biblioteca
        </p>
      </div>
    </Link>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] border border-[hsl(var(--border)/0.58)] bg-[hsl(var(--surface)/0.92)] text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent)/0.22)] hover:text-[hsl(var(--accent))]"
      aria-label="Alternar tema"
    >
      {dark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </button>
  );
}

export function SearchBar({
  action = "/busca",
  defaultValue = "",
  compact = false,
  variant = "hero",
  hint
}: {
  action?: string;
  defaultValue?: string;
  compact?: boolean;
  variant?: "header" | "hero";
  hint?: string;
}) {
  return (
    <form
      action={action}
      className={cn(
        "command-shell grain-overlay relative",
        variant === "header"
          ? "bg-[hsl(var(--surface-alt)/0.76)] shadow-[0_18px_56px_rgba(8,10,18,0.14)]"
          : "panel-elevated"
      )}
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted))]" />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={
          variant === "header"
            ? "Busque referencia, autor, tema ou termo original"
            : "Busque por referencia, autor, tema ou termo original"
        }
        className={cn(
          "w-full rounded-[24px] border-0 bg-transparent text-[hsl(var(--foreground))] outline-none",
          compact ? "h-12 pl-11 pr-24 text-sm" : "h-16 pl-12 pr-28 text-[15px]"
        )}
      />
      <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        <span className="hidden rounded-full border border-[hsl(var(--border)/0.58)] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))] md:inline-flex">
          ↵ Buscar
        </span>
      </div>
      {hint ? (
        <p className="pointer-events-none absolute left-12 top-full mt-2 hidden text-xs text-[hsl(var(--muted))] lg:block">
          {hint}
        </p>
      ) : null}
    </form>
  );
}

function ReaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mode = resolveMode(pathname);

  return (
    <div className="min-h-screen">
      <header className="reader-topbar">
        <div className="reader-shell-frame flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center justify-between gap-3 lg:min-w-[15rem]">
            <ShellBrand compact />
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
            </div>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Badge tone={mode.label === "Ler" ? "contrast" : "accent"} size="sm">
              {mode.label}
            </Badge>
            <p className="text-sm text-[hsl(var(--muted))]">{mode.description}</p>
          </div>

          <div className="min-w-0 flex-1">
            <SearchBar compact variant="header" />
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <ActionLink href="/autores" variant="ghost" className="h-12 px-4">
              Autores
            </ActionLink>
            <ActionLink href={mode.actionHref} variant="secondary" className="h-12 px-4">
              {mode.actionLabel}
            </ActionLink>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="reader-shell-frame py-6 sm:py-8 lg:py-10">{children}</main>
    </div>
  );
}

function ProductShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mode = resolveMode(pathname);
  const summary = getLibrarySummary();

  return (
    <div className="app-shell-grid">
      <aside className="app-rail">
        <div className="sticky top-0 flex h-screen flex-col gap-5 px-3 py-4 xl:px-4 xl:py-5">
          <ShellBrand />

          <nav className="space-y-2">
            {navItems.map((item) => (
              <RailLink key={item.href} {...item} />
            ))}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="hidden rounded-[22px] border border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface-alt)/0.58)] p-3 xl:block">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[hsl(var(--accent))]" />
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
                  Entradas rapidas
                </p>
              </div>
              <div className="space-y-2">
                {summary.featuredReferences.slice(0, 3).map((reference) => (
                  <Link
                    key={reference}
                    href={referenceToHref(reference)}
                    className="flex items-center justify-between rounded-[16px] border border-transparent bg-[hsl(var(--surface)/0.75)] px-3 py-3 text-sm transition hover:border-[hsl(var(--border)/0.6)]"
                  >
                    <span>{reference}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[hsl(var(--muted))]" />
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href={referenceToHref(summary.featuredReferences[0])}
              className="flex items-center justify-center rounded-[20px] border border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface)/0.72)] px-3 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted))] transition hover:border-[hsl(var(--accent)/0.18)] hover:text-[hsl(var(--foreground))] xl:hidden"
            >
              Joao 3:16
            </Link>
          </div>
        </div>
      </aside>

      <div className="shell-content">
        <div className="top-utility-bar">
          <div className="content-frame flex flex-col gap-4 !py-4">
            <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
              <div className="flex items-center gap-3">
                <Badge tone="contrast">{mode.label}</Badge>
                <p className="hidden text-sm text-[hsl(var(--muted))] md:block">{mode.description}</p>
              </div>
              <div className="min-w-0 lg:px-2">
                <SearchBar compact variant="header" />
              </div>
              <div className="flex items-center justify-between gap-3 lg:justify-end">
                <ActionLink href={mode.actionHref} variant="secondary" className="h-12 px-4">
                  {mode.actionLabel}
                </ActionLink>
                <ThemeToggle />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full border border-[hsl(var(--border)/0.55)] bg-[hsl(var(--surface-alt)/0.76)] px-4 py-2 text-sm"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <main className="content-frame">{children}</main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isReaderRoute(pathname)) {
    return <ReaderShell>{children}</ReaderShell>;
  }

  return <ProductShell>{children}</ProductShell>;
}
