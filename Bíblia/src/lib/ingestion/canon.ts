import { books as demoBooks } from "@/lib/demo/canon";
import { normalizeForSearch } from "@/lib/utils";
import type { CanonicalBook } from "@/lib/ingestion/types";

const romanNumeralMap: Record<string, string> = {
  i: "1",
  ii: "2",
  iii: "3"
};

function normalizeBookAlias(alias: string) {
  return normalizeForSearch(alias).replace(/\s+/g, " ").trim();
}

function normalizeBookAliasExact(alias: string) {
  return alias.toLowerCase().replace(/\s+/g, " ").trim();
}

function collapseSpaces(alias: string) {
  return alias.replace(/\s+/g, "");
}

function addAliasVariant(target: Set<string>, alias: string) {
  const normalized = normalizeBookAlias(alias);
  if (!normalized) {
    return;
  }

  target.add(normalized);
  target.add(collapseSpaces(normalized));

  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length > 1 && romanNumeralMap[parts[0]]) {
    const withArabic = [romanNumeralMap[parts[0]], ...parts.slice(1)].join(" ");
    target.add(withArabic);
    target.add(collapseSpaces(withArabic));
  }

  if (parts.length > 1 && /^\d+$/.test(parts[0] ?? "")) {
    const numeral = Object.entries(romanNumeralMap).find(([, value]) => value === parts[0])?.[0];
    if (numeral) {
      const withRoman = [numeral, ...parts.slice(1)].join(" ");
      target.add(withRoman);
      target.add(collapseSpaces(withRoman));
    }
  }
}

function specialAliases(bookSlug: string) {
  switch (bookSlug) {
    case "canticos":
      return ["cantico dos canticos", "cântico dos cânticos", "cantares de salomao", "song of solomon"];
    case "jo":
      return ["job", "jó"];
    case "1-samuel":
      return ["1samuel", "primeiro samuel", "i samuel"];
    case "2-samuel":
      return ["2samuel", "segundo samuel", "ii samuel"];
    case "1-reis":
      return ["1reis", "primeiro reis", "i reis"];
    case "2-reis":
      return ["2reis", "segundo reis", "ii reis"];
    case "1-cronicas":
      return ["1cronicas", "1crônicas", "primeiro cronicas", "primeiro crônicas"];
    case "2-cronicas":
      return ["2cronicas", "2crônicas", "segundo cronicas", "segundo crônicas"];
    case "1-corintios":
      return ["1corintios", "1coríntios", "primeiro corintios", "primeiro coríntios"];
    case "2-corintios":
      return ["2corintios", "2coríntios", "segundo corintios", "segundo coríntios"];
    case "1-tessalonicenses":
      return ["1tessalonicenses", "primeiro tessalonicenses"];
    case "2-tessalonicenses":
      return ["2tessalonicenses", "segundo tessalonicenses"];
    case "1-timoteo":
      return ["1timoteo", "1timóteo", "primeiro timoteo", "primeiro timóteo"];
    case "2-timoteo":
      return ["2timoteo", "2timóteo", "segundo timoteo", "segundo timóteo"];
    case "1-pedro":
      return ["1pedro", "primeiro pedro"];
    case "2-pedro":
      return ["2pedro", "segundo pedro"];
    case "1-joao":
      return ["1joao", "1joão", "primeira joao", "primeira joão"];
    case "2-joao":
      return ["2joao", "2joão", "segunda joao", "segunda joão"];
    case "3-joao":
      return ["3joao", "3joão", "terceira joao", "terceira joão"];
    default:
      return [];
  }
}

export const canonicalBooks: CanonicalBook[] = demoBooks.map((book) => {
  const aliases = new Set<string>();
  addAliasVariant(aliases, book.slug);
  addAliasVariant(aliases, book.name);
  addAliasVariant(aliases, book.englishName);
  addAliasVariant(aliases, book.abbr);
  for (const alias of book.aliases) {
    addAliasVariant(aliases, alias);
  }
  for (const alias of specialAliases(book.slug)) {
    addAliasVariant(aliases, alias);
  }

  return {
    id: `book:${book.osis}`,
    canonicalOrder: book.order,
    testament: book.testament,
    standardNamePt: book.name,
    standardNameEn: book.englishName,
    slug: book.slug,
    osisCode: book.osis,
    chapterCount: book.chapterCount,
    aliases: Array.from(aliases)
  };
});

const aliasToBook = new Map<string, CanonicalBook>();
const exactAliasToBook = new Map<string, CanonicalBook>();
for (const book of canonicalBooks) {
  for (const alias of book.aliases) {
    exactAliasToBook.set(normalizeBookAliasExact(alias), book);
    aliasToBook.set(alias, book);
  }

  exactAliasToBook.set(normalizeBookAliasExact(book.standardNamePt), book);
  exactAliasToBook.set(normalizeBookAliasExact(book.standardNameEn), book);
  exactAliasToBook.set(normalizeBookAliasExact(book.slug), book);
}

export function getCanonicalBookBySlug(slug: string) {
  return canonicalBooks.find((book) => book.slug === slug) ?? null;
}

export function getCanonicalBookById(id: string) {
  return canonicalBooks.find((book) => book.id === id) ?? null;
}

export function findCanonicalBook(label: string) {
  const exact = exactAliasToBook.get(normalizeBookAliasExact(label));
  if (exact) {
    return exact;
  }

  const normalized = normalizeBookAlias(label);
  return aliasToBook.get(normalized) ?? aliasToBook.get(collapseSpaces(normalized)) ?? null;
}

export function normalizeChapterLabel(input: string) {
  const cleaned = normalizeForSearch(input)
    .replace(/\bcapitulo\b/gu, "")
    .replace(/\bchapter\b/gu, "")
    .trim();
  const match = cleaned.match(/(\d+)/u);
  return match ? Number(match[1]) : null;
}

export function normalizeBibleReference(book: CanonicalBook, chapter: number, verse?: number, verseEnd?: number) {
  if (verse === undefined) {
    return `${book.slug} ${chapter}`;
  }

  if (verseEnd && verseEnd > verse) {
    return `${book.slug} ${chapter}:${verse}-${verseEnd}`;
  }

  return `${book.slug} ${chapter}:${verse}`;
}

export function tryExtractBookAndChapter(label: string) {
  const normalized = normalizeBookAlias(label);
  const chapterMatch = normalized.match(/(\d+)/u);

  if (!chapterMatch) {
    const book = findCanonicalBook(normalized);
    return book ? { book, chapter: null } : null;
  }

  const chapter = Number(chapterMatch[1]);
  const bookPart = normalized.slice(0, chapterMatch.index).trim() || normalized.replace(/\d+/gu, "").trim();
  const book = findCanonicalBook(bookPart);
  if (!book) {
    return null;
  }

  return { book, chapter };
}

export function normalizeCrossReferenceCandidate(raw: string) {
  const normalized = raw
    .replace(/[–—]/gu, "-")
    .replace(/[,:]/gu, ":")
    .replace(/\.(?=\d)/gu, ":")
    .replace(/\s+/gu, " ")
    .trim();

  const match = normalized.match(
    /^(?<book>[\p{L}\p{N}\s.]+?)\s+(?<chapter>\d+)(?::(?<verseStart>\d+))?(?:\s*-\s*(?:(?<chapterEnd>\d+):)?(?<verseEnd>\d+))?$/u
  );

  if (!match?.groups) {
    return null;
  }

  const book = findCanonicalBook(match.groups.book);
  if (!book) {
    return null;
  }

  const chapter = Number(match.groups.chapter);
  const verseStart = match.groups.verseStart ? Number(match.groups.verseStart) : undefined;
  const chapterEnd = match.groups.chapterEnd ? Number(match.groups.chapterEnd) : undefined;
  const verseEnd = match.groups.verseEnd ? Number(match.groups.verseEnd) : undefined;

  if (Number.isNaN(chapter)) {
    return null;
  }

  if (verseStart === undefined) {
    return `${book.slug} ${chapter}`;
  }

  if (chapterEnd && chapterEnd !== chapter && verseEnd) {
    return `${book.slug} ${chapter}:${verseStart}-${chapterEnd}:${verseEnd}`;
  }

  return normalizeBibleReference(book, chapter, verseStart, verseEnd);
}

const crossReferencePattern =
  /\b(?:[1-3]\s*)?[\p{L}.À-ÿ-]{2,}(?:\s+[\p{L}.À-ÿ-]{2,})*\s+\d+(?::|\.\d+|,\d+|\s+\d+)?(?:\s*-\s*(?:\d+:)?\d+)?/gu;

export function extractCrossReferenceCandidates(input: string) {
  const matches = input.match(crossReferencePattern) ?? [];
  const unique = new Set<string>();
  for (const match of matches) {
    const trimmed = match.trim();
    if (trimmed) {
      unique.add(trimmed);
    }
  }
  return Array.from(unique);
}
