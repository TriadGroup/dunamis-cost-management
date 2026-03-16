import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, DatabaseZap, Files, ShieldCheck, UserRoundCog } from "lucide-react";

import { Card, DefinitionList, SectionHeading, SubtleCard } from "@/components/ui";
import { getAdminDashboard } from "@/lib/demo/repository";

const adminLinks: Array<{
  href: Route;
  label: string;
  summary: string;
  icon: typeof UserRoundCog;
}> = [
  {
    href: "/admin/autores",
    label: "Autores",
    summary: "Cadastro editorial com tradição, aliases, biografia e cobertura por livro.",
    icon: UserRoundCog
  },
  {
    href: "/admin/obras",
    label: "Obras",
    summary: "Volumes, sermões e comentários com edição, ano, idioma e vínculo de fonte.",
    icon: Files
  },
  {
    href: "/admin/comentarios",
    label: "Comentários",
    summary: "Escopo, confiança, revisão e publicação por entrada comentada.",
    icon: ShieldCheck
  },
  {
    href: "/admin/traducoes",
    label: "Traduções",
    summary: "Estado do provider, licenciamento, ativação e estratégia de exibição.",
    icon: DatabaseZap
  },
  {
    href: "/admin/fontes",
    label: "Fontes",
    summary: "Source register, direitos, itens bibliográficos e trilha de uso ético.",
    icon: Files
  },
  {
    href: "/admin/ingestao",
    label: "Ingestão",
    summary: "Fila de normalização, sugestão de mapeamento, revisão e aprovação humana.",
    icon: DatabaseZap
  }
];

export default function AdminPage() {
  const dashboard = getAdminDashboard();
  const pendingReview = dashboard.reviewQueue.filter((item) => item.reviewState !== "published").length;
  const approvedJobs = dashboard.ingestionQueue.filter((item) => item.status === "approved").length;

  return (
    <div className="space-y-6">
      <Card className="grain-overlay overflow-hidden p-0">
        <div className="grid gap-6 p-7 sm:p-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Mesa editorial"
              title="Curadoria, ingestão e governança do corpus"
              description="O admin não replica o front público. Ele organiza operações editoriais, proveniência, revisão e licenciamento em uma superfície de trabalho mais objetiva."
            />
            <DefinitionList
              items={[
                { label: "Fontes", value: dashboard.sources.length, helper: "registradas com status de direitos" },
                { label: "Itens", value: dashboard.sourceItems.length, helper: "edições e links bibliográficos" },
                { label: "Revisão", value: pendingReview, helper: "entradas fora do estado publicado" },
                { label: "Jobs ok", value: approvedJobs, helper: "itens de ingestão já aprovados" }
              ]}
            />
          </div>

          <div className="space-y-4">
            <SubtleCard className="space-y-4 bg-[linear-gradient(180deg,hsl(var(--foreground)),hsl(var(--surface-strong)))] p-5 text-[hsl(var(--surface))]">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--accent-gold))]">
                Fluxo editorial
              </p>
              <div className="space-y-3">
                {[
                  "Registrar fonte e direitos",
                  "Normalizar artefato bruto",
                  "Sugerir escopo e ligação bíblica",
                  "Revisar, aprovar e publicar"
                ].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                      {index + 1}
                    </div>
                    <p className="text-sm text-white/84">{step}</p>
                  </div>
                ))}
              </div>
            </SubtleCard>

            <Card className="space-y-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
                Revisão prioritária
              </p>
              <div className="space-y-3">
                {dashboard.reviewQueue.slice(0, 3).map((item) => (
                  <SubtleCard key={item.id} className="space-y-2">
                    <p className="font-medium text-[hsl(var(--foreground))]">{item.scopeLabel}</p>
                    <p className="text-sm text-[hsl(var(--muted))]">
                      {item.author} · {item.reviewState}
                    </p>
                  </SubtleCard>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {adminLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full space-y-5 transition hover:-translate-y-0.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-[20px] bg-[hsl(var(--accent-soft))] p-3 text-[hsl(var(--accent))]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--muted))]" />
                </div>
                <div>
                  <p className="font-serif text-[1.8rem] tracking-[-0.04em] text-[hsl(var(--foreground))]">{item.label}</p>
                  <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted))]">{item.summary}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
