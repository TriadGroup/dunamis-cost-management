import { books } from "@/lib/demo/canon";
import { normalizeForSearch } from "@/lib/utils";

export interface ParsedReference {
  bookSlug: string;
  chapter: number;
  verse?: number;
}

const aliasMap = new Map<string, string>();
for (const book of books) {
  aliasMap.set(normalizeForSearch(book.slug), book.slug);
  aliasMap.set(normalizeForSearch(book.name), book.slug);
  aliasMap.set(normalizeForSearch(book.englishName), book.slug);
  aliasMap.set(normalizeForSearch(book.abbr), book.slug);
  for (const alias of book.aliases) {
    aliasMap.set(normalizeForSearch(alias), book.slug);
  }
}

export function parseReference(input: string): ParsedReference | null {
  const compact = normalizeForSearch(input).replace(/:/g, " ").replace(/\s+/g, " ");
  const tokens = compact.split(" ").filter(Boolean);

  if (tokens.length < 2) {
    return null;
  }

  let bookTokens: string[] = [];
  let chapterToken = "";
  let verseToken = "";

  if (tokens.length >= 3 && /^\d+$/.test(tokens[tokens.length - 1] ?? "") && /^\d+$/.test(tokens[tokens.length - 2] ?? "")) {
    bookTokens = tokens.slice(0, -2);
    chapterToken = tokens[tokens.length - 2] ?? "";
    verseToken = tokens[tokens.length - 1] ?? "";
  } else if (/^\d+$/.test(tokens[tokens.length - 1] ?? "")) {
    bookTokens = tokens.slice(0, -1);
    chapterToken = tokens[tokens.length - 1] ?? "";
  }

  const bookPart = bookTokens.join(" ").trim();
  const chapter = Number(chapterToken);
  const verse = verseToken ? Number(verseToken) : undefined;
  const bookSlug = aliasMap.get(bookPart);

  if (!bookSlug || !chapterToken || Number.isNaN(chapter)) {
    return null;
  }

  return { bookSlug, chapter, verse };
}

export function normalizeReferenceLabel(input: string) {
  const parsed = parseReference(input);
  if (!parsed) {
    return null;
  }

  return `${parsed.bookSlug} ${parsed.chapter}${parsed.verse ? `:${parsed.verse}` : ""}`;
}

export function referenceToHref(input: string, translation = "naa") {
  const parsed = parseReference(input);
  if (!parsed) {
    return "/ler";
  }

  return `/ler/${translation}/${parsed.bookSlug}/${parsed.chapter}${parsed.verse ? `/${parsed.verse}` : ""}`;
}

export function splitReference(reference: string) {
  const parsed = parseReference(reference);
  if (!parsed) {
    throw new Error(`Referência inválida: ${reference}`);
  }

  return parsed;
}
