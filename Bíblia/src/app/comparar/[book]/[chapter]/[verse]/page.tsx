import { notFound } from "next/navigation";

import { TranslationComparePanel } from "@/components/reader";
import { Card, SectionHeading, SubtleCard } from "@/components/ui";
import { getBookBySlug, getTranslationsForVerse } from "@/lib/demo/server-repository";

export default async function ComparePage({
  params
}: {
  params: Promise<{ book: string; chapter: string; verse: string }>;
}) {
  const resolvedParams = await params;
  const book = getBookBySlug(resolvedParams.book);
  const chapter = Number(resolvedParams.chapter);
  const verse = Number(resolvedParams.verse);

  if (!book || Number.isNaN(chapter) || Number.isNaN(verse)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="grain-overlay overflow-hidden p-0">
        <div className="grid gap-6 p-7 sm:p-8 xl:grid-cols-[1fr_0.9fr]">
          <SectionHeading
            eyebrow="Comparar traduções"
            title={`${book.name} ${chapter}:${verse}`}
            description="A interface de comparação já está pronta para side-by-side. O comportamento de cada tradução continua obedecendo o estado real do provider e do licenciamento."
          />
          <SubtleCard className="space-y-3">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
              Regra operacional
            </p>
            <p className="text-sm leading-7 text-[hsl(var(--foreground))]">
              Quando a tradução estiver pendente de licença, a tela continua útil: ela exibe o estado, a estratégia de
              integração e o motivo de indisponibilidade em vez de simular conteúdo não autorizado.
            </p>
          </SubtleCard>
        </div>
      </Card>

      <TranslationComparePanel
        items={getTranslationsForVerse(resolvedParams.book, chapter, verse).map((translation) => ({
          code: translation.code,
          name: translation.name,
          status: translation.translationState.status,
          headline: translation.translationState.headline,
          body: translation.translationState.body,
          verseText: translation.importedVerse?.verseText,
          sourceLabel: translation.attribution
        }))}
      />
    </div>
  );
}
