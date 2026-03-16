import { SearchBar } from "@/components/site";
import { Badge, Card, SectionHeading, SubtleCard } from "@/components/ui";
import { querySearch } from "@/lib/demo/repository";

const typeLabels: Record<string, string> = {
  reference: "Referências",
  author: "Autores",
  work: "Obras",
  theme: "Temas",
  commentary: "Comentários"
};

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q ?? "";
  const results = query ? querySearch(query) : [];
  const groupedResults = results.reduce<Record<string, typeof results>>((acc, result) => {
    acc[result.type] = [...(acc[result.type] ?? []), result];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card className="grain-overlay space-y-5">
        <SectionHeading
          eyebrow="Busca global"
          title="Entre por referência, autor, obra, tema ou frase"
          description="A busca prioriza resolução de referência bíblica e depois distribui resultados por tipo para reduzir ruído cognitivo."
        />
        <SearchBar defaultValue={query} />
        <div className="flex flex-wrap gap-2">
          {["João 3:16", "Calvino", "justificação", "Spurgeon Romanos 8"].map((item) => (
            <a
              key={item}
              href={`/busca?q=${encodeURIComponent(item)}`}
              className="rounded-full border border-[hsl(var(--border)/0.55)] bg-[hsl(var(--surface-alt)/0.72)] px-4 py-2 text-sm transition hover:border-[hsl(var(--accent)/0.18)]"
            >
              {item}
            </a>
          ))}
        </div>
      </Card>

      {query ? (
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading title={`Resultados para “${query}”`} description="A página mantém tipos de resultado separados para que referência, catálogo e comentário não disputem o mesmo nível visual." />
            <Badge tone="accent">{results.length} resultados</Badge>
          </div>

          {results.length === 0 ? (
            <SubtleCard>
              <p className="text-sm leading-7 text-[hsl(var(--muted))]">
                Nenhum resultado encontrado. O empty state continua honesto e não fabrica correspondências aproximadas.
              </p>
            </SubtleCard>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedResults).map(([type, group]) => (
                <div key={type} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-serif text-[1.8rem] tracking-[-0.04em] text-[hsl(var(--foreground))]">
                      {typeLabels[type] ?? type}
                    </p>
                    <Badge tone="muted">{group.length}</Badge>
                  </div>
                  <div className="grid gap-3">
                    {group.map((result, index) => (
                      <a
                        key={`${result.href}-${index}`}
                        href={result.href}
                        className="block rounded-[24px] border border-[hsl(var(--border)/0.55)] bg-[hsl(var(--surface-alt)/0.72)] p-4 transition hover:border-[hsl(var(--accent)/0.18)]"
                      >
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="muted">{result.type}</Badge>
                        </div>
                        <p className="mt-3 font-medium text-[hsl(var(--foreground))]">{result.title}</p>
                        <p className="mt-2 text-sm leading-7 text-[hsl(var(--muted))]">{result.summary}</p>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
