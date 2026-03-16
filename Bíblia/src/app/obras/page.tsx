import Link from "next/link";

import { Badge, Card, DefinitionList, SectionHeading, SubtleCard } from "@/components/ui";
import { getWorks } from "@/lib/demo/repository";

export default function WorksPage() {
  const works = getWorks();
  const workTypes = new Set(works.map((work) => work.workType));

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-6 p-7 sm:p-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Explorar obras"
              title="Comentários, volumes e sermões com metadata útil de verdade"
              description="As obras não aparecem só como uma lista de títulos. Cada registro combina tipo, autor, escopo bíblico, estado da fonte e densidade de cobertura."
            />
            <DefinitionList
              items={[
                { label: "Obras", value: works.length, helper: "já ligadas ao corpus editorial" },
                { label: "Tipos", value: workTypes.size, helper: "comentário, sermão e outros formatos" },
                {
                  label: "Autores",
                  value: new Set(works.map((work) => work.author?.displayName)).size,
                  helper: "vozes representadas no catálogo"
                },
                {
                  label: "Cobertura",
                  value: works.reduce((sum, work) => sum + work.commentaryCount, 0),
                  helper: "entradas distribuídas por obra"
                }
              ]}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from(workTypes).map((type) => (
              <SubtleCard key={type} className="space-y-2">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
                  Tipo de obra
                </p>
                <p className="font-serif text-[1.7rem] tracking-[-0.04em] text-[hsl(var(--foreground))]">{type}</p>
                <p className="text-sm text-[hsl(var(--muted))]">
                  {works.filter((work) => work.workType === type).length} itens neste formato
                </p>
              </SubtleCard>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {works.map((work) => (
          <Link key={work.slug} href={`/obras/${work.slug}`}>
            <Card className="h-full space-y-4 transition hover:-translate-y-0.5">
              <div className="flex flex-wrap gap-2">
                <Badge tone="muted">{work.workType}</Badge>
                <Badge tone="accent">{work.commentaryCount} entradas</Badge>
                <Badge tone="muted">{work.sourceItem?.language ?? "idioma não informado"}</Badge>
              </div>
              <div>
                <p className="font-serif text-[2.05rem] tracking-[-0.04em] text-[hsl(var(--foreground))]">{work.title}</p>
                <p className="mt-2 text-sm text-[hsl(var(--muted))]">{work.author?.displayName}</p>
              </div>
              <p className="text-sm leading-7 text-[hsl(var(--muted))]">{work.coverageSummary}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
