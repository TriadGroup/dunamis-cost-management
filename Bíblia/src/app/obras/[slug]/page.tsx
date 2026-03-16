import { notFound } from "next/navigation";

import { Badge, Card, SectionHeading } from "@/components/ui";
import { getWorkBySlug } from "@/lib/demo/repository";
import { referenceToHref } from "@/lib/reference/normalize";

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = getWorkBySlug(slug);

  if (!work) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <SectionHeading eyebrow="Obra" title={work.title} description={work.coverageSummary} />
        <div className="flex flex-wrap gap-2">
          <Badge tone="muted">{work.author?.displayName}</Badge>
          <Badge tone="accent">{work.originalLanguage}</Badge>
          <Badge tone="muted">{work.rightsStatus}</Badge>
        </div>
        <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">{work.editionNotes}</p>
      </Card>

      <Card className="space-y-4">
        <SectionHeading title="Fonte e edição usada" />
        {work.sourceItem ? (
          <a href={work.sourceItem.url} target="_blank" rel="noreferrer" className="block rounded-3xl border border-stone-200/80 p-4 dark:border-stone-800">
            <p className="font-medium text-stone-900 dark:text-stone-100">{work.sourceItem.title}</p>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{work.sourceItem.editionNotes}</p>
          </a>
        ) : null}
      </Card>

      <Card className="space-y-4">
        <SectionHeading title="Entradas ligadas" />
        <div className="space-y-3">
          {work.entries.map((entry) => (
            <a key={entry.id} href={referenceToHref(entry.startRef)} className="block rounded-3xl border border-stone-200/80 p-4 dark:border-stone-800">
              <p className="font-medium text-stone-900 dark:text-stone-100">{entry.scopeLabel}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{entry.editorialSummary}</p>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
