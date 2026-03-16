import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/ler", "/autores", "/obras", "/temas", "/busca", "/colecoes"],
        disallow: ["/admin"]
      }
    ],
    sitemap: "https://example.com/sitemap.xml"
  };
}
