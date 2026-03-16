import { describe, expect, it } from "vitest";

import { searchSite } from "@/lib/search/search";

describe("search ranking", () => {
  it("prioriza resolução de referência", () => {
    const results = searchSite("João 3:16");
    expect(results[0]).toMatchObject({
      type: "reference",
      href: "/ler/naa/joao/3/16"
    });
  });

  it("encontra autores por alias", () => {
    const results = searchSite("Calvino");
    expect(results.some((result) => result.type === "author" && result.href === "/autores/joao-calvino")).toBe(true);
  });
});
