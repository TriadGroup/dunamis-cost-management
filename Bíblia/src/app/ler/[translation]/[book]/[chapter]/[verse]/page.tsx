import { notFound } from "next/navigation";

import { ReadingToolbar, StudyInspector, VerseBlock } from "@/components/reader";
import { Badge } from "@/components/ui";
import { getTranslationOptions, getVerseView } from "@/lib/demo/server-repository";

export default async function VersePage({
  params
}: {
  params: Promise<{ translation: string; book: string; chapter: string; verse: string }>;
}) {
  const resolvedParams = await params;
  const chapter = Number(resolvedParams.chapter);
  const verse = Number(resolvedParams.verse);
  const data = getVerseView(resolvedParams.translation, resolvedParams.book, chapter, verse);

  if (!data) {
    notFound();
  }

  const commentaryCount =
    data.groupedCommentary.verse.length +
    data.groupedCommentary.pericope.length +
    data.groupedCommentary.chapter.length +
    data.groupedCommentary.book.length;

  return (
    <div className="space-y-6">
      <ReadingToolbar
        mode="study"
        currentCode={resolvedParams.translation}
        options={getTranslationOptions()}
        bookSlug={data.book.slug}
        bookName={data.book.name}
        chapter={data.chapter}
        chapterCount={data.book.chapterCount}
        verse={data.verse}
        reference={`${data.book.name} ${data.chapter}:${data.verse}`}
      />

      <div className="reader-layout">
        <article className="reader-paper min-w-0">
          <div className="reader-column px-5 py-7 sm:px-8 sm:py-8">
            <header className="space-y-4 border-b border-[hsl(var(--border)/0.42)] pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="contrast" size="sm">
                  Estudo do verso
                </Badge>
                <Badge tone="scope" size="sm">
                  {data.reference}
                </Badge>
                {data.importedVerse?.sectionHeadings.slice(0, 2).map((heading) => (
                  <Badge key={`${heading.text}-${heading.verseStart ?? "na"}`} tone="source" size="sm">
                    {heading.text}
                  </Badge>
                ))}
              </div>

              <div className="space-y-4">
                <p className="font-serif text-[2.3rem] leading-[0.96] tracking-[-0.06em] text-[hsl(var(--foreground))] sm:text-[3.2rem]">
                  {data.book.name}
                </p>
                <p className="reader-shell-note max-w-3xl">
                  A leitura permanece inteira na tela. O versiculo selecionado ganha foco e o estudo abre numa camada
                  propria, sem tirar o texto do centro.
                </p>
              </div>

              {data.translationState.status !== "active" ? (
                <p className="max-w-3xl text-sm leading-7 text-[hsl(var(--muted))]">{data.translationState.body}</p>
              ) : null}
            </header>

            <div className="space-y-0.5 pt-5 sm:pt-6">
              {data.verses.map((entry) => {
                const importedVerse =
                  entry.verseNumber === data.verse
                    ? data.importedVerse
                    : data.importedChapter?.verses.find((item) => item.verseNumber === entry.verseNumber);

                return (
                  <VerseBlock
                    key={entry.reference}
                    href={`/ler/${resolvedParams.translation}/${data.book.slug}/${data.chapter}/${entry.verseNumber}`}
                    verseNumber={entry.verseNumber}
                    commentaryCount={entry.verseNumber === data.verse ? commentaryCount : entry.commentaryCount}
                    noteCount={
                      entry.verseNumber === data.verse
                        ? data.languageNotes.length + (data.importedVerse?.footnoteCount ?? 0)
                        : entry.noteCount
                    }
                    active={entry.verseNumber === data.verse}
                    displayText={
                      importedVerse?.verseText ??
                      "Texto indisponivel nesta camada de leitura. O versiculo continua acessivel para comparacao, comentario e revisao."
                    }
                    statusLabel={
                      entry.verseNumber === data.verse
                        ? commentaryCount > 0
                          ? `${commentaryCount} entrada(s) de comentario disponivel(is) neste foco.`
                          : data.importedVerse?.footnoteCount
                            ? `${data.importedVerse.footnoteCount} nota(s) de traducao vinculada(s) a este versiculo.`
                            : "Use o painel contextual para abrir comentario, notas e fontes."
                        : importedVerse?.footnoteCount
                          ? `${importedVerse.footnoteCount} nota(s) vinculada(s).`
                          : undefined
                    }
                    variant={entry.verseNumber === data.verse ? "focus" : "chapter"}
                  />
                );
              })}
            </div>
          </div>
        </article>

        <StudyInspector
          reference={data.reference}
          translationCode={resolvedParams.translation}
          bookSlug={data.book.slug}
          chapter={data.chapter}
          verse={data.verse}
          verseText={data.importedVerse?.verseText}
          outline={data.seed?.outline ?? []}
          groupedCommentary={data.groupedCommentary}
          exegesis={data.exegesis}
          hermeneutics={data.hermeneutics}
          historicalNotes={data.historicalNotes}
          languageNotes={data.languageNotes}
          crossReferences={data.crossReferences}
          bibliography={data.bibliography}
          translationHeadline={data.translationState.headline}
          translationBody={data.translationState.body}
          defaultTab="context"
        />
      </div>
    </div>
  );
}
