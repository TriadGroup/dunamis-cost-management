import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { findCanonicalBook, normalizeCrossReferenceCandidate } from "@/lib/ingestion/canon";
import { BibleImportDatabase } from "@/lib/ingestion/database";
import { detectLicenseStatus } from "@/lib/ingestion/license";
import { inferParserProfile, parseAraNotesDocumentHtml, parseNviFootnoteDefinitionsHtml } from "@/lib/ingestion/parser";
import type { EpubDocument, ImportReport, ParsedTranslationResult } from "@/lib/ingestion/types";
import { validateParsedTranslation } from "@/lib/ingestion/validation";

function makeDocument(overrides: Partial<EpubDocument>): EpubDocument {
  return {
    path: "OEBPS/sample.xhtml",
    href: "OEBPS/sample.xhtml",
    mediaType: "application/xhtml+xml",
    spineIndex: 0,
    navLabels: [],
    content: "<html><body></body></html>",
    textSample: "",
    kind: "book_content",
    ...overrides
  };
}

function makeParsedTranslation(): ParsedTranslationResult {
  return {
    translation: {
      id: "translation:test",
      name: "Teste",
      shortCode: "tst",
      language: "pt-BR",
      publisher: "Teste",
      copyrightHolder: "Teste",
      licenseStatus: "restricted",
      licenseNotes: "internal only",
      sourceFileName: "test.epub",
      sourceHash: "abc123",
      sourceFormat: "epub",
      importedAt: "2026-03-08T00:00:00.000Z",
      importVersion: 1,
      isActive: false,
      canDisplayPublicly: false,
      canUseForCompare: false,
      parserProfile: "test",
      metadata: {
        identifiers: [],
        contributors: [],
        raw: {}
      }
    },
    translationBooks: [
      {
        id: "translation:test:book:gen",
        translationId: "translation:test",
        bookId: "book:Gen",
        sourceBookLabel: "Gênesis",
        detectedOrder: 1
      }
    ],
    chapters: [
      {
        id: "translation:test:chapter:gen:1",
        translationId: "translation:test",
        bookId: "book:Gen",
        chapterNumber: 1,
        sourceDocument: "OEBPS/genesis.xhtml",
        importStatus: "imported"
      }
    ],
    verses: [
      {
        id: "translation:test:verse:gen:1:1",
        translationId: "translation:test",
        bookId: "book:Gen",
        chapterNumber: 1,
        verseNumber: 1,
        normalizedReference: "genesis 1:1",
        verseText: "No princípio.",
        verseTextRaw: "No princípio.",
        importConfidence: 0.99,
        importStatus: "imported",
        needsReview: false,
        sourceDocument: "OEBPS/genesis.xhtml",
        sourceFragmentHash: "hash-1"
      }
    ],
    sectionHeadings: [],
    footnotes: [],
    crossReferences: [],
    bookIntroductions: [],
    chapterIntroductions: [],
    importWarnings: [],
    rawFragments: [],
    reviewQueue: [],
    importJobItems: [],
    totals: {
      booksDetected: 1,
      chaptersDetected: 1,
      versesDetected: 1,
      sectionHeadingsDetected: 0,
      notesDetected: 0,
      crossReferencesDetected: 0,
      introductionsDetected: 0,
      uncertainSegments: 0,
      reviewQueueItems: 0
    }
  };
}

function makeReport(): ImportReport {
  return {
    translationId: "translation:test",
    translationName: "Teste",
    shortCode: "tst",
    sourceFileName: "test.epub",
    sourceHash: "abc123",
    parserProfile: "test",
    metadata: {},
    licensing: {
      status: "restricted",
      notes: "internal only",
      canDisplayPublicly: false,
      canUseForCompare: false
    },
    totals: {
      booksDetected: 1,
      chaptersDetected: 1,
      versesDetected: 1,
      sectionHeadingsDetected: 0,
      notesDetected: 0,
      crossReferencesDetected: 0,
      introductionsDetected: 0,
      uncertainSegments: 0,
      reviewQueueItems: 0
    },
    warnings: [],
    overview: "Teste"
  };
}

describe("ingestion canon", () => {
  it("preserves the Jo/Jó distinction before accent folding", () => {
    expect(findCanonicalBook("Jo")?.slug).toBe("joao");
    expect(findCanonicalBook("Jó")?.slug).toBe("jo");
  });

  it("normalizes Portuguese cross references", () => {
    expect(normalizeCrossReferenceCandidate("Jo 3.16")).toBe("joao 3:16");
    expect(normalizeCrossReferenceCandidate("1 Sm 17:45")).toBe("1-samuel 17:45");
  });
});

describe("ingestion parser helpers", () => {
  it("infers the NVI parser profile from structural markers", () => {
    const profile = inferParserProfile(
      "Bíblia Sagrada – NVI.epub",
      { identifiers: [], contributors: [], raw: {} },
      [makeDocument({ content: '<div class="heading_s1B5">FILEMOM</div><span class="class_s1HSD">1</span>', textSample: "FILEMOM" })]
    );

    expect(profile).toBe("nvi");
  });

  it("extracts NVI footnote definitions without polluting verse text", () => {
    const definitions = parseNviFootnoteDefinitionsHtml(
      '<aside id="a1K6C" class="class_s2HG-0"><a href="part.xhtml#a1" class="class_s1HSE">[ a ]</a><span class="class_s1HSG-0">1:1</span> Ou <span class="class_s1HSS-0">Quando Deus começou</span></aside>',
      "OEBPS/part.xhtml"
    );

    expect(definitions.get("OEBPS/part.xhtml#a1K6C")).toMatchObject({
      marker: "a",
      referenceLabel: "1:1",
      noteText: "Ou Quando Deus começou"
    });
  });

  it("extracts ARA note documents and keeps cross-reference text", () => {
    const definitions = parseAraNotesDocumentHtml(
      '<p class="x"><a class="footnote-anchor" href="12.xhtml#footnote-1-backlink" id="footnote-1">†</a><span class="xo">1.4 </span><span class="xt"><a class="linkref" href="180.xhtml#v14">Êx 3.14</a></span></p>',
      "OEBPS/Text/notas.xhtml"
    );

    expect(definitions.get("OEBPS/Text/notas.xhtml#footnote-1")).toMatchObject({
      marker: "†",
      referenceLabel: "1.4",
      noteText: "Êx 3.14"
    });
  });
});

describe("ingestion safety", () => {
  it("marks visible copyright signals as restricted", () => {
    const license = detectLicenseStatus(
      {
        title: "NAA",
        publisher: "Sociedade Bíblica do Brasil",
        rights: "© Sociedade Bíblica do Brasil",
        identifiers: [],
        contributors: [],
        raw: {}
      },
      [makeDocument({ kind: "copyright", textSample: "Todos os direitos reservados." })]
    );

    expect(license.status).toBe("restricted");
    expect(license.canDisplayPublicly).toBe(false);
  });
});

describe("ingestion persistence and validation", () => {
  it("skips duplicate imports when the same source hash is already imported", () => {
    const directory = mkdtempSync(join(tmpdir(), "biblia-import-"));
    const databasePath = join(directory, "import.sqlite");
    const database = new BibleImportDatabase(databasePath);
    const parsed = makeParsedTranslation();
    const report = makeReport();

    const first = database.writeImport(parsed, "skip", report);
    const second = database.writeImport(parsed, "skip", report);

    expect(first.skipped).toBe(false);
    expect(second.skipped).toBe(true);

    rmSync(directory, { recursive: true, force: true });
  });

  it("emits warnings for incomplete book coverage and duplicate verses", () => {
    const parsed = makeParsedTranslation();
    parsed.verses.push({
      ...parsed.verses[0],
      id: "translation:test:verse:gen:1:1:duplicate",
      sourceFragmentHash: "hash-2"
    });

    const warnings = validateParsedTranslation(parsed);
    expect(warnings.some((warning) => warning.code === "unknown_book")).toBe(true);
    expect(warnings.some((warning) => warning.code === "duplicate_verse")).toBe(true);
  });
});
