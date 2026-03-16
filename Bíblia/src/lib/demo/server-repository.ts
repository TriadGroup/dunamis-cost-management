import "server-only";

import { books, booksByTestament } from "@/lib/demo/canon";
import {
  authors,
  chapterSeeds,
  collections,
  commentaryEntries,
  crossReferences,
  editorialNotes,
  featuredReferences,
  languageNotes,
  sourceItems,
  sourceRegister,
  themes,
  traditions,
  translations as configuredTranslations,
  works
} from "@/lib/demo/content";
import { type ScopeType, type TranslationRecord } from "@/lib/demo/types";
import {
  getImportedChapterData,
  getImportedTranslation,
  getImportedTranslations,
  getImportedVerseData
} from "@/lib/server/bible-imports";
import { referenceIncludes, scopePriority } from "@/lib/reference/ranges";
import { normalizeReferenceLabel } from "@/lib/reference/normalize";

function sortCommentary(a: { scopeType: ScopeType }, b: { scopeType: ScopeType }) {
  return scopePriority(a.scopeType) - scopePriority(b.scopeType);
}

function buildTranslationSummary(sourceFileName: string, counts: { books: number; chapters: number; verses: number }) {
  return `Importação local ativa a partir de ${sourceFileName}. Cobertura atual: ${counts.books} livros, ${counts.chapters} capítulos e ${counts.verses} versículos no banco local.`;
}

export function getTranslationOptions() {
  const importedTranslations = getImportedTranslations();
  const configuredMap = new Map(configuredTranslations.map((translation) => [translation.code, translation]));
  const merged: TranslationRecord[] = [];

  for (const configured of configuredTranslations) {
    const imported = importedTranslations.find((item) => item.code === configured.code);
    if (imported) {
      merged.push({
        ...configured,
        publisher: imported.publisher ?? configured.publisher,
        rightsHolder: imported.copyrightHolder ?? configured.rightsHolder,
        licenseStatus: "licensed",
        activationStatus: "active",
        providerKind: "local_epub_import",
        summary: buildTranslationSummary(imported.sourceFileName, imported.counts),
        attribution: `Origem local: ${imported.sourceFileName}`
      });
      continue;
    }

    merged.push(configured);
  }

  for (const imported of importedTranslations) {
    if (configuredMap.has(imported.code)) {
      continue;
    }

    merged.push({
      code: imported.code,
      name: imported.name,
      publisher: imported.publisher ?? "Importação local",
      rightsHolder: imported.copyrightHolder ?? imported.publisher ?? "Arquivo EPUB fornecido pelo usuário",
      licenseStatus: "licensed",
      activationStatus: "active",
      providerKind: "local_epub_import",
      canBundle: false,
      summary: buildTranslationSummary(imported.sourceFileName, imported.counts),
      attribution: `Origem local: ${imported.sourceFileName}`
    });
  }

  const order = ["naa", "nvi", "bkj", "ara", "acf1969"];
  return merged.sort((left, right) => order.indexOf(left.code) - order.indexOf(right.code));
}

export function getTranslationProviderState(code: string) {
  const imported = getImportedTranslation(code);
  if (imported && imported.counts.verses > 0) {
    const partial = imported.counts.books < 66 ? "A cobertura desta importação ainda é parcial em alguns livros." : "";
    return {
      code,
      status: "active",
      headline: `${imported.name} via importação local`,
      body: `${buildTranslationSummary(imported.sourceFileName, imported.counts)} ${partial}`.trim()
    };
  }

  const fallback = configuredTranslations.find((translation) => translation.code === code);
  if (!fallback) {
    return {
      code,
      status: "unavailable",
      headline: "Tradução não cadastrada",
      body: "Esta rota referencia uma tradução ausente na configuração atual."
    };
  }

  return {
    code,
    status: fallback.activationStatus,
    headline:
      fallback.activationStatus === "pending_license"
        ? `${fallback.name} pendente de licença`
        : `${fallback.name} disponível`,
    body: fallback.summary
  };
}

export function getLibrarySummary() {
  return {
    authors: authors.length,
    works: works.length,
    commentaries: commentaryEntries.length,
    sources: sourceRegister.length,
    featuredReferences
  };
}

export function getBooksByTestament() {
  return booksByTestament;
}

export function getBookBySlug(bookSlug: string) {
  return books.find((book) => book.slug === bookSlug);
}

export function getBookCoverage(bookSlug: string) {
  const references = commentaryEntries.filter(
    (entry) => normalizeReferenceLabel(entry.startRef)?.startsWith(bookSlug)
  );
  return references.length;
}

export function getChapterSeed(bookSlug: string, chapter: number) {
  return chapterSeeds.find((seed) => seed.bookSlug === bookSlug && seed.chapterNumber === chapter);
}

export function getChapterView(translationCode: string, bookSlug: string, chapter: number) {
  const book = getBookBySlug(bookSlug);
  if (!book || chapter < 1 || chapter > book.chapterCount) {
    return null;
  }

  const seed = getChapterSeed(bookSlug, chapter);
  const translationState = getTranslationProviderState(translationCode);
  const importedChapter = getImportedChapterData(translationCode, bookSlug, chapter);
  const importedVerses = new Map(importedChapter?.verses.map((item) => [item.verseNumber, item]) ?? []);
  const expectedVerseCount = Math.max(
    seed?.verseCount ?? 0,
    importedChapter?.verses.at(-1)?.verseNumber ?? 0
  );

  const verses =
    expectedVerseCount > 0
      ? Array.from({ length: expectedVerseCount }, (_, index) => {
          const verseNumber = index + 1;
          const ref = `${book.slug} ${chapter}:${verseNumber}`;
          const importedVerse = importedVerses.get(verseNumber);
          const editorialNoteCount = languageNotes.filter((entry) => referenceIncludes(entry.startRef, entry.endRef, ref)).length;
          return {
            reference: ref,
            verseNumber,
            commentaryCount: commentaryEntries.filter((entry) =>
              referenceIncludes(entry.startRef, entry.endRef, ref)
            ).length,
            noteCount: editorialNoteCount + (importedVerse?.footnoteCount ?? 0),
            verseText: importedVerse?.verseText,
            hasImportedText: Boolean(importedVerse?.verseText),
            needsReview: importedVerse?.needsReview ?? false,
            footnoteCount: importedVerse?.footnoteCount ?? 0
          };
        })
      : [];

  return {
    book,
    chapter,
    translationState,
    seed,
    importedChapter,
    verses,
    previousChapter:
      chapter > 1 ? { bookSlug, chapter: chapter - 1 } : book.order > 1 ? null : null,
    nextChapter: chapter < book.chapterCount ? { bookSlug, chapter: chapter + 1 } : null
  };
}

export function getVerseView(translationCode: string, bookSlug: string, chapter: number, verse: number) {
  const chapterView = getChapterView(translationCode, bookSlug, chapter);
  if (!chapterView) {
    return null;
  }

  const expectedVerseCount = chapterView.verses.length || chapterView.seed?.verseCount || 0;
  if (verse < 1 || (expectedVerseCount > 0 && verse > expectedVerseCount)) {
    return null;
  }

  const book = chapterView.book;
  const ref = `${book.slug} ${chapter}:${verse}`;
  const verseCommentary = commentaryEntries
    .filter((entry) => referenceIncludes(entry.startRef, entry.endRef, ref))
    .map((entry) => ({
      ...entry,
      author: authors.find((author) => author.id === entry.authorId),
      work: works.find((work) => work.id === entry.workId),
      sourceItem: sourceItems.find((item) => item.id === entry.sourceItemId)
    }))
    .sort(sortCommentary);

  const groupedCommentary = {
    verse: verseCommentary.filter((entry) => entry.scopeType === "verse"),
    pericope: verseCommentary.filter((entry) => entry.scopeType === "pericope"),
    chapter: verseCommentary.filter((entry) => entry.scopeType === "chapter"),
    book: verseCommentary.filter((entry) => entry.scopeType === "book")
  };

  const importedVerse = getImportedVerseData(translationCode, bookSlug, chapter, verse);

  return {
    ...chapterView,
    verse,
    reference: ref,
    importedVerse,
    translationState: getTranslationProviderState(translationCode),
    groupedCommentary,
    exegesis: editorialNotes.filter((note) => note.noteType === "exegesis" && referenceIncludes(note.startRef, note.endRef, ref)),
    hermeneutics: editorialNotes.filter((note) => note.noteType === "hermeneutics" && referenceIncludes(note.startRef, note.endRef, ref)),
    historicalNotes: editorialNotes.filter((note) => note.noteType === "historical_note" && referenceIncludes(note.startRef, note.endRef, ref)),
    languageNotes: languageNotes.filter((note) => referenceIncludes(note.startRef, note.endRef, ref)),
    crossReferences: crossReferences.filter((entry) => entry.fromRef === ref),
    bibliography: sourceItems.filter((item) =>
      verseCommentary.some((entry) => entry.sourceItemId === item.id) ||
      editorialNotes.some((note) => note.sourceItemIds.includes(item.id) && referenceIncludes(note.startRef, note.endRef, ref))
    )
  };
}

export function getTranslationsForVerse(bookSlug: string, chapter: number, verse: number) {
  return getTranslationOptions().map((translation) => ({
    ...translation,
    importedVerse: getImportedVerseData(translation.code, bookSlug, chapter, verse),
    translationState: getTranslationProviderState(translation.code)
  }));
}

export function getAuthors() {
  return authors.map((author) => ({
    ...author,
    tradition: traditions.find((tradition) => tradition.slug === author.traditionSlug),
    workCount: works.filter((work) => work.authorId === author.id).length,
    coverageCount: commentaryEntries.filter((entry) => entry.authorId === author.id).length
  }));
}

export function getCollections() {
  return collections.map((collection) => ({
    ...collection,
    authors: authors.filter((author) => collection.authorIds.includes(author.id))
  }));
}

export function getThemeIndex() {
  return themes.map((theme) => ({
    ...theme,
    commentaryCount: commentaryEntries.filter((entry) => entry.themeSlugs.includes(theme.slug)).length
  }));
}

export function getSourceRegister() {
  return sourceRegister;
}
