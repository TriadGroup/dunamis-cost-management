import { books } from "@/lib/demo/canon";
import { splitReference } from "@/lib/reference/normalize";

const bookOrder = new Map(books.map((book) => [book.slug, book.order]));

function toSortableValue(reference: string) {
  const parsed = splitReference(reference);
  const order = bookOrder.get(parsed.bookSlug);
  if (!order) {
    throw new Error(`Livro não encontrado: ${parsed.bookSlug}`);
  }

  return order * 1_000_000 + parsed.chapter * 1_000 + (parsed.verse ?? 0);
}

export function referenceIncludes(
  startRef: string,
  endRef: string,
  targetRef: string
) {
  const start = toSortableValue(startRef);
  const end = toSortableValue(endRef);
  const target = toSortableValue(targetRef);

  return start <= target && target <= end;
}

export function scopePriority(scopeType: "verse" | "pericope" | "chapter" | "book") {
  switch (scopeType) {
    case "verse":
      return 0;
    case "pericope":
      return 1;
    case "chapter":
      return 2;
    case "book":
      return 3;
  }
}
