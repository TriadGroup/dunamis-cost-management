import Link from "next/link";

import { Badge, Card, DefinitionList, SectionHeading, SubtleCard } from "@/components/ui";
import { getAuthors } from "@/lib/demo/repository";

export default function AuthorsPage() {
  const authors = getAuthors();
  const traditionMap = authors.reduce<Record<string, number>>((acc, author) => {
    const key = author.tradition?.name ?? "Sem tradição";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-6 p-7 sm:p-8 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Explorar autores"
              title="Descoberta por século, tradição e densidade de cobertura"
              description="A navegação por autores precisa parecer biblioteca de pesquisa, não catálogo raso. Cada voz histórica mostra sua época, tradição, obras e alcance no corpus atual."
            />
            <DefinitionList
              items={[
                { label: "Autores", value: authors.length, helper: "entradas biográficas já conectadas ao corpus" },
                {
                  label: "Tradições",
                  value: Object.keys(traditionMap).length,
                  helper: "famílias teológicas presentes no seed"
                },
                {
                  label: "Séculos",
                  value: new Set(authors.map((author) => author.centuryLabel)).size,
                  helper: "amplitude cronológica atual"
                },
                {
                  label: "Destaques",
                  value: authors.filter((author) => author.featured).length,
                  helper: "vozes priorizadas para descoberta"
                }
              ]}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(traditionMap).map(([tradition, count]) => (
              <SubtleCard key={tradition} className="space-y-2">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
                  Tradição
                </p>
                <p className="font-serif text-[1.8rem] tracking-[-0.04em] text-[hsl(var(--foreground))]">{tradition}</p>
                <p className="text-sm text-[hsl(var(--muted))]">{count} autores neste seed</p>
              </SubtleCard>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {authors.map((author) => (
          <Link key={author.slug} href={`/autores/${author.slug}`}>
            <Card className="h-full space-y-5 transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-serif text-[2.2rem] tracking-[-0.04em] text-[hsl(var(--foreground))]">
                    {author.displayName}
                  </p>
                  <p className="mt-2 text-sm text-[hsl(var(--muted))]">
                    {author.centuryLabel} · {author.tradition?.name}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[hsl(var(--foreground))] text-lg font-semibold text-[hsl(var(--surface))]">
                  {author.imageSeed}
                </div>
              </div>
              <p className="text-sm leading-7 text-[hsl(var(--muted))]">{author.biography}</p>
              <div className="flex flex-wrap gap-2">
                <Badge tone="muted">{author.workCount} obras</Badge>
                <Badge tone="accent">{author.coverageCount} entradas</Badge>
                <Badge tone="muted">{author.eraLabel}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
