"use client";

import { useMemo, useState } from "react";

import { Badge, Card, SectionHeading, SubtleCard } from "@/components/ui";

export function AdminTable({
  title,
  description,
  rows,
  columns
}: {
  title: string;
  description: string;
  rows: Array<Record<string, string | number>>;
  columns: Array<{ key: string; label: string }>;
}) {
  const [draftRows, setDraftRows] = useState(rows);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = draftRows[selectedIndex];

  const inputs = useMemo(
    () => columns.filter((column) => column.key !== "id").slice(0, 3),
    [columns]
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-[hsl(var(--border)/0.55)] p-6">
          <SectionHeading title={title} description={description} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[hsl(var(--surface-alt)/0.82)]">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-5 py-4 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {draftRows.map((row, index) => (
                <tr
                  key={`${row.id}-${index}`}
                  className={[
                    "cursor-pointer border-t border-[hsl(var(--border)/0.48)] transition",
                    index === selectedIndex
                      ? "bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent))]"
                      : "hover:bg-[hsl(var(--surface-alt)/0.65)]"
                  ].join(" ")}
                  onClick={() => setSelectedIndex(index)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-5 py-4 text-[hsl(var(--foreground))]">
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-5">
        <SectionHeading
          eyebrow="Drawer editorial"
          title="Editor de sessão"
          description="Simulação de revisão guiada: seleção na mesa, edição à direita e persistência local de ergonomia."
        />
        {selected ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">selecionado</Badge>
              <Badge tone="muted">{String(selected.id)}</Badge>
            </div>
            {inputs.map((column) => (
              <label key={column.key} className="block space-y-2">
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">{column.label}</span>
                <input
                  value={String(selected[column.key] ?? "")}
                  onChange={(event) =>
                    setDraftRows((current) =>
                      current.map((row, index) =>
                        index === selectedIndex ? { ...row, [column.key]: event.target.value } : row
                      )
                    )
                  }
                  className="w-full rounded-[22px] border border-[hsl(var(--border)/0.58)] bg-[hsl(var(--surface-alt)/0.68)] px-4 py-3 text-sm text-[hsl(var(--foreground))] outline-none transition focus:border-[hsl(var(--accent)/0.18)]"
                />
              </label>
            ))}
            <SubtleCard className="space-y-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
                Próximos passos
              </p>
              <div className="space-y-2 text-sm leading-7 text-[hsl(var(--foreground))]">
                <p>1. Validar metadados e escopo.</p>
                <p>2. Confirmar revisão humana e proveniência.</p>
                <p>3. Persistir via Prisma + Supabase quando o backend real estiver ativo.</p>
              </div>
            </SubtleCard>
            <div className="flex items-center gap-2">
              <Badge tone="success">Salva localmente</Badge>
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted))]">
                Persistência real entra via Prisma + Supabase
              </p>
            </div>
          </>
        ) : null}
      </Card>
    </div>
  );
}

export function IngestionReviewQueue({
  items
}: {
  items: Array<{ id: string; label: string; status: string; confidence: number; source: string }>;
}) {
  return (
    <Card className="space-y-4">
      <SectionHeading
        eyebrow="Pipeline"
        title="Fila de ingestão e revisão"
        description="Jobs preparados para importação, normalização, mapeamento de escopo e aprovação humana."
      />
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-[24px] border border-[hsl(var(--border)/0.55)] bg-[hsl(var(--surface-alt)/0.72)] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={item.status === "approved" ? "success" : "warning"}>{item.status}</Badge>
              <Badge tone="muted">{item.source}</Badge>
              <Badge tone="accent">{Math.round(item.confidence * 100)}% confiança</Badge>
            </div>
            <p className="mt-3 font-medium text-[hsl(var(--foreground))]">{item.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
