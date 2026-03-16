import { canonicalBooks, getCanonicalBookById } from "@/lib/ingestion/canon";
import type { ImportWarningRecord, ParsedTranslationResult, ReviewQueueRecord, ReviewReason, VerseRecord } from "@/lib/ingestion/types";

function makeWarning(
  translationId: string,
  code: ReviewReason,
  message: string,
  parserConfidence: number,
  sourceDocument?: string,
  sourceReference?: string
): ImportWarningRecord {
  return {
    id: `${translationId}:warning:${code}:${sourceDocument ?? "global"}:${sourceReference ?? "n/a"}:${message.slice(0, 36)}`,
    translationId,
    code,
    message,
    sourceDocument,
    sourceReference,
    parserConfidence
  };
}

function analyzeChapterVerses(translationId: string, verses: VerseRecord[]) {
  const warnings: ImportWarningRecord[] = [];
  const sorted = [...verses].sort((left, right) => left.verseNumber - right.verseNumber);
  let previousVerse: VerseRecord | undefined;

  for (const verse of sorted) {
    if (previousVerse && verse.verseNumber === previousVerse.verseNumber) {
      warnings.push(
        makeWarning(
          translationId,
          "duplicate_verse",
          `Verso duplicado detectado em ${verse.normalizedReference}.`,
          Math.min(previousVerse.importConfidence, verse.importConfidence),
          verse.sourceDocument,
          verse.normalizedReference
        )
      );
    }

    if (previousVerse && verse.verseNumber > previousVerse.verseNumber + 1) {
      warnings.push(
        makeWarning(
          translationId,
          "missing_verse_gap",
          `Lacuna de versificação entre ${previousVerse.normalizedReference} e ${verse.normalizedReference}.`,
          Math.min(previousVerse.importConfidence, verse.importConfidence),
          verse.sourceDocument,
          verse.normalizedReference
        )
      );
    }

    if (previousVerse && verse.verseNumber < previousVerse.verseNumber) {
      warnings.push(
        makeWarning(
          translationId,
          "out_of_order_verse",
          `Ordem de versos suspeita em ${verse.normalizedReference}.`,
          verse.importConfidence,
          verse.sourceDocument,
          verse.normalizedReference
        )
      );
    }

    if (verse.verseText.length < 2 || verse.verseText.length > 900) {
      warnings.push(
        makeWarning(
          translationId,
          "suspicious_length",
          `Comprimento suspeito em ${verse.normalizedReference}: ${verse.verseText.length} caracteres.`,
          verse.importConfidence,
          verse.sourceDocument,
          verse.normalizedReference
        )
      );
    }

    previousVerse = verse;
  }

  return warnings;
}

export function validateParsedTranslation(parsed: ParsedTranslationResult) {
  const warnings = [...parsed.importWarnings];
  const translationId = parsed.translation.id;

  if (parsed.translationBooks.length !== canonicalBooks.length) {
    warnings.push(
      makeWarning(
        translationId,
        "unknown_book",
        `Quantidade de livros detectados (${parsed.translationBooks.length}) difere do cânon esperado (${canonicalBooks.length}).`,
        0.45
      )
    );
  }

  for (const translationBook of parsed.translationBooks) {
    const canonicalBook = getCanonicalBookById(translationBook.bookId);
    const chapterCount = parsed.chapters.filter((chapter) => chapter.bookId === translationBook.bookId).length;
    if (canonicalBook && chapterCount !== canonicalBook.chapterCount) {
      warnings.push(
        makeWarning(
          translationId,
          "unknown_chapter",
          `Livro ${translationBook.sourceBookLabel} importado com ${chapterCount} capítulos; esperado ${canonicalBook.chapterCount}.`,
          0.62
        )
      );
    }
  }

  const chapterGroups = new Map<string, VerseRecord[]>();
  for (const verse of parsed.verses) {
    const key = `${verse.bookId}:${verse.chapterNumber}`;
    const current = chapterGroups.get(key) ?? [];
    current.push(verse);
    chapterGroups.set(key, current);
  }

  for (const verses of chapterGroups.values()) {
    warnings.push(...analyzeChapterVerses(translationId, verses));
  }

  const unresolvedNoteWarnings = parsed.reviewQueue
    .filter((item) => item.reason === "unresolved_note_marker" || item.reason === "unresolved_cross_reference")
    .map((item) =>
      makeWarning(
        translationId,
        item.reason,
        item.notes ?? `Item pendente de revisão: ${item.reason}.`,
        item.parserConfidence,
        item.sourceDocument,
        item.suggestedMapping
      )
    );

  warnings.push(...unresolvedNoteWarnings);

  return warnings;
}

export function makeReviewItem(
  item: Omit<ReviewQueueRecord, "id">
): ReviewQueueRecord {
  const safeParts = [
    item.translationId,
    item.reason,
    item.sourceDocument,
    item.suspectedBookId ?? "none",
    item.suspectedChapter ?? "none",
    item.suspectedVerse ?? "none"
  ];

  return {
    id: safeParts.join(":"),
    ...item
  };
}
