import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  variant = "default"
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "preview" | "inset";
}) {
  const variants = {
    default: "panel-surface",
    elevated: "panel-surface panel-elevated",
    preview: "panel-preview",
    inset: "panel-inset"
  };

  return <div className={cn(variants[variant], "p-6 sm:p-7", className)}>{children}</div>;
}

export function SubtleCard({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("panel-subtle p-5", className)}>{children}</div>;
}

export function Badge({
  children,
  tone = "default",
  size = "md",
  className
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "success" | "warning" | "muted" | "contrast" | "scope" | "source" | "status";
  size?: "sm" | "md";
  className?: string;
}) {
  const tones = {
    default:
      "border-[hsl(var(--border)/0.55)] bg-[hsl(var(--surface-alt)/0.84)] text-[hsl(var(--foreground))]",
    accent:
      "border-[hsl(var(--accent)/0.16)] bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent))]",
    success:
      "border-[hsl(var(--success)/0.18)] bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]",
    warning:
      "border-[hsl(var(--warning)/0.22)] bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]",
    muted:
      "border-[hsl(var(--border)/0.55)] bg-transparent text-[hsl(var(--muted))]",
    contrast:
      "border-transparent bg-[hsl(var(--foreground))] text-[hsl(var(--surface))]",
    scope:
      "border-[hsl(var(--accent)/0.16)] bg-[linear-gradient(180deg,hsl(var(--accent-soft)),hsl(var(--surface-alt)/0.92))] text-[hsl(var(--accent))]",
    source:
      "border-[hsl(var(--border)/0.52)] bg-[hsl(var(--surface)/0.78)] text-[hsl(var(--foreground))]",
    status:
      "border-[hsl(var(--border)/0.55)] bg-[hsl(var(--surface-strong)/0.8)] text-[hsl(var(--foreground))]"
  };

  const sizes = {
    sm: "px-2.5 py-1 text-[0.64rem] tracking-[0.2em]",
    md: "px-3 py-1.5 text-[0.7rem] tracking-[0.22em]"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold uppercase",
        tones[tone],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  size = "section"
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  size?: "hero" | "section" | "compact";
}) {
  const titleClass = {
    hero: "mt-5 max-w-4xl text-[3rem] leading-[0.94] tracking-[-0.06em] sm:text-[4.4rem]",
    section: "mt-4 text-[2rem] leading-tight tracking-[-0.04em] sm:text-[2.7rem]",
    compact: "mt-3 text-[1.55rem] leading-tight tracking-[-0.035em] sm:text-[1.9rem]"
  };

  const descriptionClass = {
    hero: "mt-4 max-w-2xl text-base leading-8 sm:text-[1.02rem]",
    section: "mt-3 max-w-2xl",
    compact: "mt-2 max-w-xl text-sm leading-6"
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <span className="eyebrow-pill">{eyebrow}</span> : null}
        <h2 className={cn("font-serif text-[hsl(var(--foreground))]", titleClass[size])}>{title}</h2>
        {description ? <p className={cn("section-copy", descriptionClass[size])}>{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function ActionLink({
  href,
  children,
  className,
  variant = "secondary"
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const variants = {
    primary:
      "border-transparent bg-[hsl(var(--foreground))] text-[hsl(var(--surface))] hover:-translate-y-px hover:opacity-90",
    secondary:
      "border-[hsl(var(--border)/0.58)] bg-[hsl(var(--surface-alt)/0.78)] text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent)/0.18)] hover:bg-[hsl(var(--surface))]",
    ghost:
      "border-transparent bg-transparent text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-alt)/0.74)]"
  };

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition",
        variants[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}

export const ButtonLink = ActionLink;

export function MetaStrip({
  items,
  className
}: {
  items: Array<ReactNode>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[hsl(var(--muted))]", className)}>
      {items.map((item, index) => (
        <span key={index} className="inline-flex items-center gap-3">
          {index > 0 ? <span className="h-1 w-1 rounded-full bg-[hsl(var(--border))]" /> : null}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}

export function DefinitionList({
  items
}: {
  items: Array<{ label: string; value: ReactNode; helper?: string }>;
}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[26px] border border-[hsl(var(--border)/0.55)] bg-[hsl(var(--surface-alt)/0.7)] px-5 py-4"
        >
          <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
            {item.label}
          </dt>
          <dd className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[hsl(var(--foreground))]">
            {item.value}
          </dd>
          {item.helper ? <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted))]">{item.helper}</p> : null}
        </div>
      ))}
    </dl>
  );
}
