import { describe, expect, it } from "vitest";

import { normalizeReferenceLabel, parseReference, referenceToHref } from "@/lib/reference/normalize";

describe("reference parser", () => {
  it("resolve João 3:16 em PT-BR", () => {
    expect(parseReference("João 3:16")).toEqual({
      bookSlug: "joao",
      chapter: 3,
      verse: 16
    });
  });

  it("resolve abreviações e formato sem dois pontos", () => {
    expect(parseReference("Jo 3 16")).toEqual({
      bookSlug: "joao",
      chapter: 3,
      verse: 16
    });
  });

  it("resolve livros numerados", () => {
    expect(normalizeReferenceLabel("1 João 4:9")).toBe("1-joao 4:9");
  });

  it("gera href canônica", () => {
    expect(referenceToHref("Efésios 2:8")).toBe("/ler/naa/efesios/2/8");
  });
});
