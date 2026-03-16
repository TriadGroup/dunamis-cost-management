import { notFound } from "next/navigation";

import { ReadingToolbar, VerseBlock } from "@/components/reader";
import { Badge, SubtleCard } from "@/components/ui";
import { getChapterView, getTranslationOptions } from "@/lib/demo/server-repository";

export default async function ChapterPage({
  params
}: {
  params: Promise<{ translation: string; book: string; chapter: string }>;
}) {
  const resolvedParams = await params;
  const chapterNumber = Number(resolvedParams.chapter);
  const data = getChapterView(resolvedParams.translation, resolvedParams.book, chapterNumber);

  if (!data) {
    notFound();
  }

  const chapterSummary =
    data.seed?.literaryContext ??
    "Leitura continua do capitulo atual, com navegacao leve e abertura de estudo apenas no clique do versiculo.";

  return (
    <div className="space-y-6">
      <ReadingToolbar
        mode="read"
        currentCode={resolvedParams.translation}
        options={getTranslationOptions()}
        bookSlug={data.book.slug}
        bookName={data.book.name}
        chapter={data.chapter}
        chapterCount={data.book.chapterCount}
        reference={`${data.book.name} ${data.chapter}`}
      />

      <article className="reader-paper">
        <div className="reader-column px-5 py-7 sm:px-8 sm:py-8">
          <header className="space-y-4 border-b border-[hsl(var(--border)/0.42)] pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="contrast" size="sm">
                Leitura
              </Badge>
              {data.seed?.outline?.[0] ? (
                <Badge tone="scope" size="sm">
                  {data.seed.outline[0]}
                </Badge>
              ) : null}
            </div>

            <div className="space-y-4">
              <p className="font-serif text-[2.45rem] leading-[0.96] tracking-[-0.06em] text-[hsl(var(--foreground))] sm:text-[3.7rem]">
                {data.book.name}
              </p>
              <p className="font-serif text-[1.4rem] tracking-[-0.04em] text-[hsl(var(--muted))] sm:text-[1.7rem]">
                Capitulo {data.chapter}
              </p>
              <p className="reader-shell-note max-w-3xl">{chapterSummary}</p>
            </div>

            {data.translationState.status !== "active" ? (
              <p className="max-w-3xl text-sm leading-7 text-[hsl(var(--muted))]">{data.translationState.body}</p>
            ) : null}
          </header>

          {data.verses.length > 0 ? (
            <div className="space-y-0.5 pt-5 sm:pt-6">
              {data.verses.map((verse) => (
                <VerseBlock
                  key={verse.reference}
                  href={`/ler/${resolvedParams.translation}/${data.book.slug}/${data.chapter}/${verse.verseNumber}`}
                  verseNumber={verse.verseNumber}
                  commentaryCount={verse.commentaryCount}
                  noteCount={verse.noteCount}
                  displayText={
                    verse.verseText ??
                    "Texto indisponivel nesta camada de leitura. O versiculo continua navegavel para estudo, comparacao e revisao."
                  }
                  statusLabel={
                    verse.verseText
                      ? verse.needsReview
                        ? "Importado com baixa confianca; revisao editorial recomendada."
                        : verse.noteCount > 0
                          ? `${verse.noteCount} nota(s) vinculada(s) a este versiculo.`
                          : undefined
                      : "Abra o versiculo para ver comentario, notas, comparacao e estado da traducao."
                  }
                  variant="chapter"
                />
              ))}
            </div>
          ) : (
            <div className="pt-8">
              <SubtleCard className="border-dashed p-5">
                <p className="text-sm leading-7 text-[hsl(var(--muted))]">
                  Este capitulo ainda nao recebeu versificacao detalhada na camada atual.
                </p>
              </SubtleCard>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
