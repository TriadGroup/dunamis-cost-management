import { notFound } from "next/navigation";

import { CoverageMap } from "@/components/reader";
import { Badge, Card, SectionHeading } from "@/components/ui";
import { getAuthorBySlug } from "@/lib/demo/repository";
import { referenceToHref } from "@/lib/reference/normalize";

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <Card className="space-y-5">
          <SectionHeading eyebrow="Autor" title={author.displayName} description={author.biography} />
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{author.centuryLabel}</Badge>
            <Badge tone="muted">{author.tradition?.name}</Badge>
            <Badge tone="muted">{author.eraLabel}</Badge>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionHeading title="Obras usadas na plataforma" />
          <div className="space-y-3">
            {author.works.map((work) => (
              <a key={work.slug} href={`/obras/${work.slug}`} className="block rounded-3xl border border-stone-200/80 p-4 dark:border-stone-800">
                <p className="font-medium text-stone-900 dark:text-stone-100">{work.title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{work.coverageSummary}</p>
              </a>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionHeading title="Entradas publicadas" />
          <div className="space-y-3">
            {author.entries.map((entry) => (
              <a key={entry.id} href={referenceToHref(entry.startRef)} className="block rounded-3xl border border-stone-200/80 p-4 dark:border-stone-800">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="muted">{entry.scopeType}</Badge>
                  <Badge tone={entry.directness === "direct" ? "accent" : "muted"}>{entry.directness}</Badge>
                </div>
                <p className="mt-3 font-medium text-stone-900 dark:text-stone-100">{entry.scopeLabel}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{entry.editorialSummary}</p>
              </a>
            ))}
          </div>
        </Card>
      </div>

      <CoverageMap items={author.coverageMap} />
    </div>
  );
}
