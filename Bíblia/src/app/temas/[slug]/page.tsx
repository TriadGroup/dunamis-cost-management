import { notFound } from "next/navigation";

import { Badge, Card, SectionHeading } from "@/components/ui";
import { getThemeBySlug } from "@/lib/demo/repository";
import { referenceToHref } from "@/lib/reference/normalize";

export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const theme = getThemeBySlug(slug);

  if (!theme) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <SectionHeading eyebrow="Tema" title={theme.name} description={theme.description} />
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">{theme.doctrineFamily}</Badge>
          {theme.featuredRefs.map((reference) => (
            <a key={reference} href={referenceToHref(reference)} className="rounded-full border border-stone-300 px-3 py-1 text-xs dark:border-stone-700">
              {reference}
            </a>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <SectionHeading title="Entradas relacionadas" />
          <div className="space-y-3">
            {theme.entries.map((entry) => (
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

        <Card className="space-y-4">
          <SectionHeading title="Autores ligados" />
          <div className="space-y-3">
            {theme.relatedAuthors.map((author) => (
              <a key={author.slug} href={`/autores/${author.slug}`} className="block rounded-3xl border border-stone-200/80 p-4 dark:border-stone-800">
                <p className="font-medium text-stone-900 dark:text-stone-100">{author.displayName}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{author.biography}</p>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
