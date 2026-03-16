import { books } from "@/lib/demo/canon";
import { authors, commentaryEntries, themes, works } from "@/lib/demo/content";
import { parseReference, referenceToHref } from "@/lib/reference/normalize";
import { normalizeForSearch } from "@/lib/utils";

export type SearchResult =
  | { type: "reference"; title: string; href: string; summary: string }
  | { type: "author"; title: string; href: string; summary: string }
  | { type: "work"; title: string; href: string; summary: string }
  | { type: "theme"; title: string; href: string; summary: string }
  | { type: "commentary"; title: string; href: string; summary: string };

export function searchSite(query: string): SearchResult[] {
  const normalized = normalizeForSearch(query);
  if (!normalized) {
    return [];
  }

  const reference = parseReference(query);
  const results: SearchResult[] = [];

  if (reference) {
    const book = books.find((item) => item.slug === reference.bookSlug);
    if (book) {
      const label = `${book.name} ${reference.chapter}${reference.verse ? `:${reference.verse}` : ""}`;
      results.push({
        type: "reference",
        title: label,
        href: `/ler/naa/${book.slug}/${reference.chapter}${reference.verse ? `/${reference.verse}` : ""}`,
        summary: reference.verse
          ? "Abrir rota canônica do verso."
          : "Abrir rota canônica do capítulo."
      });
    }
  }

  for (const author of authors) {
    const haystack = normalizeForSearch(`${author.displayName} ${author.aliases.join(" ")} ${author.biography}`);
    if (haystack.includes(normalized)) {
      results.push({
        type: "author",
        title: author.displayName,
        href: `/autores/${author.slug}`,
        summary: `${author.centuryLabel} · ${author.eraLabel}`
      });
    }
  }

  for (const work of works) {
    const haystack = normalizeForSearch(`${work.title} ${work.coverageSummary}`);
    if (haystack.includes(normalized)) {
      results.push({
        type: "work",
        title: work.title,
        href: `/obras/${work.slug}`,
        summary: work.coverageSummary
      });
    }
  }

  for (const theme of themes) {
    const haystack = normalizeForSearch(`${theme.name} ${theme.description} ${theme.featuredRefs.join(" ")}`);
    if (haystack.includes(normalized)) {
      results.push({
        type: "theme",
        title: theme.name,
        href: `/temas/${theme.slug}`,
        summary: theme.description
      });
    }
  }

  for (const entry of commentaryEntries) {
    const author = authors.find((candidate) => candidate.id === entry.authorId);
    const work = works.find((candidate) => candidate.id === entry.workId);
    const haystack = normalizeForSearch(
      `${entry.scopeLabel} ${entry.editorialSummary} ${author?.displayName ?? ""} ${work?.title ?? ""}`
    );
    if (haystack.includes(normalized)) {
      results.push({
        type: "commentary",
        title: `${author?.displayName ?? "Autor"} · ${entry.scopeLabel}`,
        href: referenceToHref(entry.startRef),
        summary: entry.editorialSummary
      });
    }
  }

  return results.slice(0, 12);
}
