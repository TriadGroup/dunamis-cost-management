import type { MetadataRoute } from "next";

import { books } from "@/lib/demo/canon";
import { authors, collections, featuredReferences, themes, works } from "@/lib/demo/content";
import { referenceToHref } from "@/lib/reference/normalize";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "/",
    "/ler",
    "/autores",
    "/obras",
    "/temas",
    "/busca",
    "/admin"
  ];

  const chapterRoutes = books.flatMap((book) =>
    Array.from({ length: Math.min(book.chapterCount, 3) }, (_, index) => ({
      url: `https://example.com/ler/naa/${book.slug}/${index + 1}`,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  );

  const verseRoutes = featuredReferences.map((reference) => ({
    url: `https://example.com${referenceToHref(reference)}`,
    changeFrequency: "weekly" as const,
    priority: 0.8
  }));

  return [
    ...staticRoutes.map((route) => ({
      url: `https://example.com${route}`,
      changeFrequency: "weekly" as const,
      priority: route === "/" ? 1 : 0.7
    })),
    ...authors.map((author) => ({
      url: `https://example.com/autores/${author.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7
    })),
    ...works.map((work) => ({
      url: `https://example.com/obras/${work.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6
    })),
    ...themes.map((theme) => ({
      url: `https://example.com/temas/${theme.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7
    })),
    ...collections.map((collection) => ({
      url: `https://example.com/colecoes/${collection.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6
    })),
    ...chapterRoutes,
    ...verseRoutes
  ];
}
