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
  translations,
  works
} from "@/lib/demo/content";
import { type ScopeType } from "@/lib/demo/types";
import { getTranslationProviderState } from "@/lib/providers/translations";
import { referenceIncludes, scopePriority } from "@/lib/reference/ranges";
import { normalizeReferenceLabel } from "@/lib/reference/normalize";
import { searchSite } from "@/lib/search/search";

function sortCommentary(a: { scopeType: ScopeType }, b: { scopeType: ScopeType }) {
  return scopePriority(a.scopeType) - scopePriority(b.scopeType);
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

export function getTranslationOptions() {
  return translations;
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
  const verses = seed
    ? Array.from({ length: seed.verseCount }, (_, index) => {
        const verseNumber = index + 1;
        const ref = `${book.slug} ${chapter}:${verseNumber}`;
        return {
          reference: ref,
          verseNumber,
          commentaryCount: commentaryEntries.filter((entry) =>
            referenceIncludes(entry.startRef, entry.endRef, ref)
          ).length,
          noteCount: languageNotes.filter((entry) => referenceIncludes(entry.startRef, entry.endRef, ref)).length
        };
      })
    : [];

  return {
    book,
    chapter,
    translationState,
    seed,
    verses,
    previousChapter:
      chapter > 1 ? { bookSlug, chapter: chapter - 1 } : book.order > 1 ? null : null,
    nextChapter: chapter < book.chapterCount ? { bookSlug, chapter: chapter + 1 } : null
  };
}

export function getVerseView(translationCode: string, bookSlug: string, chapter: number, verse: number) {
  const chapterView = getChapterView(translationCode, bookSlug, chapter);
  if (!chapterView || !chapterView.seed || verse < 1 || verse > chapterView.seed.verseCount) {
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

  return {
    ...chapterView,
    verse,
    reference: ref,
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

export function getAuthors() {
  return authors.map((author) => ({
    ...author,
    tradition: traditions.find((tradition) => tradition.slug === author.traditionSlug),
    workCount: works.filter((work) => work.authorId === author.id).length,
    coverageCount: commentaryEntries.filter((entry) => entry.authorId === author.id).length
  }));
}

export function getAuthorBySlug(slug: string) {
  const author = authors.find((candidate) => candidate.slug === slug);
  if (!author) {
    return null;
  }

  const authorWorks = works.filter((work) => work.authorId === author.id);
  const authorEntries = commentaryEntries.filter((entry) => entry.authorId === author.id);
  const coverageMap = books
    .filter((book) => authorEntries.some((entry) => normalizeReferenceLabel(entry.startRef)?.startsWith(book.slug)))
    .map((book) => ({
      bookName: book.name,
      slug: book.slug,
      count: authorEntries.filter((entry) => normalizeReferenceLabel(entry.startRef)?.startsWith(book.slug)).length
    }));

  return {
    ...author,
    tradition: traditions.find((tradition) => tradition.slug === author.traditionSlug),
    works: authorWorks,
    entries: authorEntries,
    coverageMap
  };
}

export function getWorks() {
  return works.map((work) => ({
    ...work,
    author: authors.find((author) => author.id === work.authorId),
    sourceItem: sourceItems.find((item) => item.id === work.sourceItemId),
    commentaryCount: commentaryEntries.filter((entry) => entry.workId === work.id).length
  }));
}

export function getWorkBySlug(slug: string) {
  const work = works.find((candidate) => candidate.slug === slug);
  if (!work) {
    return null;
  }

  return {
    ...work,
    author: authors.find((author) => author.id === work.authorId),
    sourceItem: sourceItems.find((item) => item.id === work.sourceItemId),
    entries: commentaryEntries.filter((entry) => entry.workId === work.id)
  };
}

export function getThemeIndex() {
  return themes.map((theme) => ({
    ...theme,
    commentaryCount: commentaryEntries.filter((entry) => entry.themeSlugs.includes(theme.slug)).length
  }));
}

export function getThemeBySlug(slug: string) {
  const theme = themes.find((candidate) => candidate.slug === slug);
  if (!theme) {
    return null;
  }

  const entries = commentaryEntries.filter((entry) => entry.themeSlugs.includes(theme.slug));
  return {
    ...theme,
    entries,
    relatedAuthors: authors.filter((author) => entries.some((entry) => entry.authorId === author.id))
  };
}

export function getCollections() {
  return collections.map((collection) => ({
    ...collection,
    authors: authors.filter((author) => collection.authorIds.includes(author.id))
  }));
}

export function getCollectionBySlug(slug: string) {
  const collection = collections.find((candidate) => candidate.slug === slug);
  if (!collection) {
    return null;
  }

  return {
    ...collection,
    authors: authors.filter((author) => collection.authorIds.includes(author.id)),
    featuredEntries: commentaryEntries.filter((entry) =>
      collection.featuredRefs.some((reference) => referenceIncludes(entry.startRef, entry.endRef, reference))
    )
  };
}

export function getSourceRegister() {
  return sourceRegister;
}

export function getAdminDashboard() {
  return {
    translations,
    sources: sourceRegister,
    sourceItems,
    reviewQueue: commentaryEntries
      .map((entry) => ({
        id: entry.id,
        scopeLabel: entry.scopeLabel,
        reviewState: entry.reviewState,
        confidenceScore: entry.confidenceScore,
        author: authors.find((author) => author.id === entry.authorId)?.displayName ?? "Autor"
      }))
      .sort((a, b) => a.confidenceScore - b.confidenceScore),
    ingestionQueue: [
      {
        id: "job-001",
        label: "Import CCEL — comentários joaninos",
        status: "needs_review",
        confidence: 0.82,
        source: "CCEL"
      },
      {
        id: "job-002",
        label: "Mapeamento de aliases PT/EN para João 3",
        status: "approved",
        confidence: 0.97,
        source: "Parser interno"
      }
    ]
  };
}

export function querySearch(query: string) {
  return searchSite(query);
}
