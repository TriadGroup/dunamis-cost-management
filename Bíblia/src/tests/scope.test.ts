import { describe, expect, it } from "vitest";

import { referenceIncludes, scopePriority } from "@/lib/reference/ranges";

describe("scope overlap", () => {
  it("detecta verso dentro de perícope", () => {
    expect(referenceIncludes("joao 3:13", "joao 3:18", "joao 3:16")).toBe(true);
  });

  it("rejeita verso fora do escopo", () => {
    expect(referenceIncludes("joao 3:13", "joao 3:18", "joao 3:21")).toBe(false);
  });

  it("prioriza verso antes de capítulo", () => {
    expect(scopePriority("verse")).toBeLessThan(scopePriority("chapter"));
  });
});
