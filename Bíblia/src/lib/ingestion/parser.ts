import { createHash } from "node:crypto";
import { posix } from "node:path";

import { load } from "cheerio";

import { EpubArchive, collectHtmlDocuments } from "@/lib/ingestion/archive";
import {
  canonicalBooks,
  extractCrossReferenceCandidates,
  findCanonicalBook,
  normalizeBibleReference,
  normalizeCrossReferenceCandidate
} from "@/lib/ingestion/canon";
import { detectLicenseStatus } from "@/lib/ingestion/license";
import type {
  BookIntroductionRecord,
  ChapterIntroductionRecord,
  ChapterRecord,
  CrossReferenceRecord,
  EpubDocument,
  EpubMetadata,
  FootnoteRecord,
  HeadingType,
  ImportJobItemRecord,
  ImportStatus,
  ImportTotals,
  ImportWarningRecord,
  LicenseStatus,
  ParsedTranslationResult,
  RawFragmentRecord,
  ReviewQueueRecord,
  ReviewReason,
  SectionHeadingRecord,
  SourceDiscoveryItem,
  TranslationBook,
  TranslationDetection,
  VerseRecord
} from "@/lib/ingestion/types";
import { makeReviewItem } from "@/lib/ingestion/validation";
import { normalizeForSearch, titleCase } from "@/lib/utils";

type ParserProfile = "naa" | "nvi" | "ara" | "acf1969" | "bkj" | "generic";

interface ParsedNoteDefinition {
  marker: string;
  noteText: string;
  referenceLabel?: string;
  rawHtml: string;
  sourceDocument: string;
  noteType?: FootnoteRecord["noteType"];
}

interface ParseContext {
  translation: TranslationDetection;
  source: SourceDiscoveryItem;
  translationBooks: Map<string, TranslationBook>;
  chapters: Map<string, ChapterRecord>;
  verses: Map<string, VerseRecord>;
  sectionHeadings: Map<string, SectionHeadingRecord>;
  footnotes: Map<string, FootnoteRecord>;
  crossReferences: Map<string, CrossReferenceRecord>;
  bookIntroductions: Map<string, BookIntroductionRecord>;
  chapterIntroductions: Map<string, ChapterIntroductionRecord>;
  importWarnings: Map<string, ImportWarningRecord>;
  rawFragments: Map<string, RawFragmentRecord>;
  reviewQueue: Map<string, ReviewQueueRecord>;
  importJobItems: Map<string, ImportJobItemRecord>;
  noteTargetsSeen: Set<string>;
}

function hashString(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function resolveHref(basePath: string, href: string) {
  const [filePart] = href.split("#");
  if (!filePart) {
    return basePath;
  }

  const baseDir = posix.dirname(basePath) === "." ? "" : posix.dirname(basePath);
  return posix.normalize(baseDir ? posix.join(baseDir, filePart) : filePart);
}

function resolveHrefWithHash(basePath: string, href: string) {
  const [filePart, hash] = href.split("#");
  const resolvedFile = filePart ? resolveHref(basePath, filePart) : basePath;
  return hash ? `${resolvedFile}#${hash}` : resolvedFile;
}

function normalizeInlineText(input: string) {
  return input
    .replace(/\u00a0/gu, " ")
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n[ \t]+/gu, "\n")
    .replace(/[ \t]{2,}/gu, " ")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function normalizeVerseText(input: string) {
  return normalizeInlineText(input).replace(/\s+([,.;:!?])/gu, "$1").trim();
}

function appendRawInlineText(buffer: string, segment: string) {
  if (!segment) {
    return buffer;
  }

  return `${buffer}${segment}`;
}

function cleanMarkerText(input: string) {
  return normalizeInlineText(input).replace(/^\[?\s*/u, "").replace(/\s*\]?$/u, "").trim();
}

function createContext(source: SourceDiscoveryItem, translation: TranslationDetection): ParseContext {
  return {
    translation,
    source,
    translationBooks: new Map(),
    chapters: new Map(),
    verses: new Map(),
    sectionHeadings: new Map(),
    footnotes: new Map(),
    crossReferences: new Map(),
    bookIntroductions: new Map(),
    chapterIntroductions: new Map(),
    importWarnings: new Map(),
    rawFragments: new Map(),
    reviewQueue: new Map(),
    importJobItems: new Map(),
    noteTargetsSeen: new Set()
  };
}

function classifyFootnoteType(noteText: string, crossReferenceCount: number): FootnoteRecord["noteType"] {
  const normalized = normalizeForSearch(noteText);
  if (crossReferenceCount > 0) {
    return "cross_reference_note";
  }

  if (/hebraico|grego|aramaico|ou |lit /u.test(normalized)) {
    return "translation_note";
  }

  if (/variante|manuscrito|texto/u.test(normalized)) {
    return "textual_note";
  }

  return "unknown";
}

function inferShortCode(name: string, sourceFileName: string) {
  const normalized = normalizeForSearch(`${name} ${sourceFileName}`);

  if (normalized.includes("nova almeida atualizada") || /\bnaa\b/u.test(normalized)) {
    return { shortCode: "naa", name: "Nova Almeida Atualizada" };
  }

  if (normalized.includes("king james") || /\bbkj\b/u.test(normalized) || normalized.includes("kja")) {
    return { shortCode: "bkj", name: "Bíblia King James Atualizada" };
  }

  if (normalized.includes("nvi")) {
    return { shortCode: "nvi", name: "Nova Versão Internacional" };
  }

  if (normalized.includes("revista e atualizada")) {
    return { shortCode: "ara", name: "Almeida Revista e Atualizada" };
  }

  if (normalized.includes("corrigida fiel") || normalized.includes("corrigida 1969")) {
    return { shortCode: "acf1969", name: "Almeida Corrigida Fiel (1969)" };
  }

  return { shortCode: "unknown", name: titleCase(name || sourceFileName.replace(/\.epub$/iu, "")) };
}

export function inferParserProfile(fileName: string, metadata: EpubMetadata, documents: EpubDocument[]): ParserProfile {
  const normalized = normalizeForSearch(`${fileName} ${metadata.title ?? ""} ${metadata.publisher ?? ""}`);
  if (normalized.includes("nova almeida atualizada")) {
    return "naa";
  }
  if (normalized.includes("king james")) {
    return "bkj";
  }
  if (normalized.includes("nvi")) {
    return "nvi";
  }
  if (normalized.includes("revista e atualizada")) {
    return "ara";
  }
  if (normalized.includes("corrigida fiel") || normalized.includes("1969")) {
    return "acf1969";
  }

  const joined = documents.map((document) => document.textSample).join("\n");
  if (/Cap[ií]tulos de G[êe]nesis/iu.test(joined)) {
    return "naa";
  }
  if (documents.some((document) => document.content.includes("class_s1HSD") && document.content.includes("class_s1HSJ"))) {
    return "nvi";
  }
  if (documents.some((document) => document.path.includes("notas") && document.content.includes('class="footnote-anchor"'))) {
    return "ara";
  }
  if (documents.some((document) => document.content.includes('class="notax"') && /id="v\d+\.\d+"/u.test(document.content))) {
    return "acf1969";
  }
  if (documents.some((document) => document.content.includes('class="chapter2"') && document.content.includes('class="dcap"'))) {
    return "bkj";
  }

  return "generic";
}

function createTranslationDetection(
  source: SourceDiscoveryItem,
  metadata: EpubMetadata,
  documents: EpubDocument[],
  parserProfile: ParserProfile
): TranslationDetection {
  const inferred = inferShortCode(metadata.title ?? source.fileName, source.fileName);
  const license = detectLicenseStatus(metadata, documents);
  const publisher = metadata.publisher?.trim();
  const copyrightHolder = metadata.creator?.trim() || publisher;

  return {
    id: `translation:${inferred.shortCode}`,
    name: inferred.name,
    shortCode: inferred.shortCode,
    language: metadata.language?.trim() || "pt-BR",
    publisher,
    copyrightHolder,
    licenseStatus: license.status,
    licenseNotes: license.licenseNotes,
    sourceFileName: source.fileName,
    sourceHash: source.sourceHash,
    sourceFormat: "epub",
    importedAt: new Date().toISOString(),
    importVersion: 1,
    isActive: false,
    canDisplayPublicly: license.canDisplayPublicly,
    canUseForCompare: license.canUseForCompare,
    notes: `EPUB importado para uso interno/revisão. Perfil de parser: ${parserProfile}.`,
    parserProfile,
    metadata
  };
}

function addWarning(
  context: ParseContext,
  code: ReviewReason,
  message: string,
  parserConfidence: number,
  sourceDocument?: string,
  sourceReference?: string
) {
  const id = `${code}:${sourceDocument ?? "global"}:${sourceReference ?? "n/a"}:${message}`;
  if (context.importWarnings.has(id)) {
    return;
  }

  context.importWarnings.set(id, {
    id: `${context.translation.id}:warning:${hashString(id).slice(0, 12)}`,
    translationId: context.translation.id,
    code,
    message,
    sourceDocument,
    sourceReference,
    parserConfidence
  });
}

function addRawFragment(
  context: ParseContext,
  fragmentType: string,
  sourceDocument: string,
  rawHtml: string,
  rawText: string,
  sourceAnchor?: string,
  notes?: string
) {
  const fragmentHash = hashString(`${sourceDocument}:${sourceAnchor ?? "n/a"}:${fragmentType}:${rawHtml}`);
  const id = `${context.translation.id}:fragment:${fragmentHash.slice(0, 16)}`;
  if (!context.rawFragments.has(id)) {
    context.rawFragments.set(id, {
      id,
      translationId: context.translation.id,
      sourceDocument,
      sourceAnchor,
      fragmentType,
      rawHtml,
      rawText: normalizeInlineText(rawText),
      fragmentHash,
      notes
    });
  }

  return id;
}

function addReviewItem(
  context: ParseContext,
  reason: ReviewReason,
  sourceDocument: string,
  parserConfidence: number,
  options: {
    suspectedBookId?: string;
    suspectedChapter?: number;
    suspectedVerse?: number;
    suggestedMapping?: string;
    notes?: string;
    rawHtml?: string;
    rawText?: string;
    sourceAnchor?: string;
  } = {}
) {
  let rawFragmentId: string | undefined;
  if (options.rawHtml || options.rawText) {
    rawFragmentId = addRawFragment(
      context,
      `review:${reason}`,
      sourceDocument,
      options.rawHtml ?? "",
      options.rawText ?? "",
      options.sourceAnchor,
      options.notes
    );
  }

  const review = makeReviewItem({
    translationId: context.translation.id,
    sourceFile: context.source.fileName,
    sourceDocument,
    suspectedBookId: options.suspectedBookId,
    suspectedChapter: options.suspectedChapter,
    suspectedVerse: options.suspectedVerse,
    reason,
    parserConfidence,
    suggestedMapping: options.suggestedMapping,
    rawFragmentId,
    notes: options.notes
  });

  context.reviewQueue.set(review.id, review);
}

function ensureTranslationBook(context: ParseContext, bookId: string, sourceBookLabel: string, detectedOrder: number) {
  if (!context.translationBooks.has(bookId)) {
    context.translationBooks.set(bookId, {
      id: `${context.translation.id}:book:${bookId}`,
      translationId: context.translation.id,
      bookId,
      sourceBookLabel: sourceBookLabel || bookId,
      detectedOrder
    });
  }
}

function ensureChapter(
  context: ParseContext,
  bookId: string,
  chapterNumber: number,
  sourceDocument: string,
  sourceLabel?: string,
  importStatus: ImportStatus = "imported"
) {
  const key = `${bookId}:${chapterNumber}`;
  if (!context.chapters.has(key)) {
    context.chapters.set(key, {
      id: `${context.translation.id}:chapter:${bookId}:${chapterNumber}`,
      translationId: context.translation.id,
      bookId,
      chapterNumber,
      sourceLabel,
      importStatus,
      sourceDocument
    });
  }
}

function addBookIntroduction(context: ParseContext, bookId: string, sourceDocument: string, bodyText: string) {
  const normalized = normalizeInlineText(bodyText);
  if (!normalized) {
    return;
  }
  const key = `${bookId}:${sourceDocument}`;
  context.bookIntroductions.set(key, {
    id: `${context.translation.id}:book-intro:${bookId}:${hashString(sourceDocument).slice(0, 10)}`,
    translationId: context.translation.id,
    bookId,
    bodyText: normalized,
    sourceDocument
  });
}

function addChapterIntroduction(
  context: ParseContext,
  bookId: string,
  chapterNumber: number,
  sourceDocument: string,
  bodyText: string
) {
  const normalized = normalizeInlineText(bodyText);
  if (!normalized) {
    return;
  }
  const key = `${bookId}:${chapterNumber}:${sourceDocument}`;
  context.chapterIntroductions.set(key, {
    id: `${context.translation.id}:chapter-intro:${bookId}:${chapterNumber}:${hashString(sourceDocument).slice(0, 10)}`,
    translationId: context.translation.id,
    bookId,
    chapterNumber,
    bodyText: normalized,
    sourceDocument
  });
}

function addSectionHeading(
  context: ParseContext,
  bookId: string,
  chapterNumber: number,
  headingText: string,
  sourceDocument: string,
  headingType: HeadingType,
  verseStart?: number,
  verseEnd?: number
) {
  const normalized = normalizeInlineText(headingText);
  if (!normalized) {
    return;
  }

  const key = `${bookId}:${chapterNumber}:${verseStart ?? "n/a"}:${normalized}`;
  if (!context.sectionHeadings.has(key)) {
    context.sectionHeadings.set(key, {
      id: `${context.translation.id}:heading:${hashString(key).slice(0, 16)}`,
      translationId: context.translation.id,
      bookId,
      chapterNumber,
      verseStart,
      verseEnd,
      headingText: normalized,
      headingType,
      sourceDocument
    });
  }
}

function addCrossReferences(
  context: ParseContext,
  bookId: string,
  chapterNumber: number,
  verseNumber: number,
  noteText: string,
  sourceDocument: string
) {
  for (const candidate of extractCrossReferenceCandidates(noteText)) {
    const normalized = normalizeCrossReferenceCandidate(candidate);
    const key = `${bookId}:${chapterNumber}:${verseNumber}:${candidate}`;
    if (context.crossReferences.has(key)) {
      continue;
    }

    context.crossReferences.set(key, {
      id: `${context.translation.id}:xref:${hashString(key).slice(0, 16)}`,
      translationId: context.translation.id,
      sourceBookId: bookId,
      sourceChapter: chapterNumber,
      sourceVerse: verseNumber,
      targetReferenceRaw: candidate,
      targetReferenceNormalized: normalized ?? undefined,
      noteText: normalizeInlineText(noteText),
      sourceDocument
    });

    if (!normalized) {
      addReviewItem(context, "unresolved_cross_reference", sourceDocument, 0.56, {
        suspectedBookId: bookId,
        suspectedChapter: chapterNumber,
        suspectedVerse: verseNumber,
        suggestedMapping: candidate,
        notes: `Referência cruzada não normalizada automaticamente: ${candidate}.`,
        rawText: noteText
      });
    }
  }
}

function addFootnote(
  context: ParseContext,
  bookId: string,
  chapterNumber: number,
  verseNumber: number,
  marker: string,
  noteText: string,
  sourceDocument: string,
  rawHtml: string,
  sourceAnchor?: string
) {
  const normalizedMarker = cleanMarkerText(marker);
  const normalizedText = normalizeInlineText(noteText);
  if (!normalizedMarker || !normalizedText) {
    return;
  }

  const key = `${bookId}:${chapterNumber}:${verseNumber}:${normalizedMarker}:${hashString(normalizedText).slice(0, 8)}`;
  if (context.footnotes.has(key)) {
    return;
  }

  const crossReferenceCandidates = extractCrossReferenceCandidates(normalizedText);
  const noteType = classifyFootnoteType(normalizedText, crossReferenceCandidates.length);
  context.footnotes.set(key, {
    id: `${context.translation.id}:note:${hashString(key).slice(0, 16)}`,
    translationId: context.translation.id,
    bookId,
    chapterNumber,
    verseNumber,
    noteMarker: normalizedMarker,
    noteText: normalizedText,
    noteType,
    sourceDocument,
    sourceAnchor,
    rawHtml
  });

  addCrossReferences(context, bookId, chapterNumber, verseNumber, normalizedText, sourceDocument);
}

function recordVerse(
  context: ParseContext,
  bookId: string,
  chapterNumber: number,
  verseNumber: number,
  verseText: string,
  sourceDocument: string,
  options: {
    rawText?: string;
    sourceAnchor?: string;
    confidence?: number;
    append?: boolean;
    joinWithNewline?: boolean;
  } = {}
) {
  const cleaned = normalizeVerseText(verseText);
  if (!cleaned) {
    return;
  }

  ensureChapter(context, bookId, chapterNumber, sourceDocument);
  const canonicalBook = canonicalBooks.find((book) => book.id === bookId);
  if (!canonicalBook) {
    return;
  }

  const normalizedReference = normalizeBibleReference(canonicalBook, chapterNumber, verseNumber);
  const key = normalizedReference;
  const existing = context.verses.get(key);
  const confidence = options.confidence ?? 0.95;
  const rawText = normalizeInlineText(options.rawText ?? verseText);

  if (existing) {
    if (!options.append) {
      addReviewItem(context, "duplicate_verse", sourceDocument, confidence, {
        suspectedBookId: bookId,
        suspectedChapter: chapterNumber,
        suspectedVerse: verseNumber,
        suggestedMapping: normalizedReference,
        notes: `Verso duplicado detectado durante a ingestão de ${normalizedReference}.`,
        rawText,
        sourceAnchor: options.sourceAnchor
      });
      return;
    }

    const separator = options.joinWithNewline ? "\n" : " ";
    existing.verseText = normalizeVerseText(`${existing.verseText}${separator}${cleaned}`);
    existing.verseTextRaw = normalizeInlineText(`${existing.verseTextRaw}${separator}${rawText}`);
    existing.importConfidence = Math.min(existing.importConfidence, confidence);
    existing.needsReview = existing.needsReview || confidence < 0.75;
    if (!existing.sourceAnchor && options.sourceAnchor) {
      existing.sourceAnchor = options.sourceAnchor;
    }
    return;
  }

  const sourceFragmentHash = hashString(`${sourceDocument}:${options.sourceAnchor ?? "n/a"}:${rawText}`);
  context.verses.set(key, {
    id: `${context.translation.id}:verse:${bookId}:${chapterNumber}:${verseNumber}`,
    translationId: context.translation.id,
    bookId,
    chapterNumber,
    verseNumber,
    normalizedReference,
    verseText: cleaned,
    verseTextRaw: rawText,
    importConfidence: confidence,
    importStatus: confidence < 0.75 ? "needs_review" : "imported",
    needsReview: confidence < 0.75,
    sourceDocument,
    sourceAnchor: options.sourceAnchor,
    sourceFragmentHash
  });
}

function addImportJobItem(
  context: ParseContext,
  document: EpubDocument,
  confidence: number,
  status: ImportStatus,
  preview?: string
) {
  const key = document.path;
  context.importJobItems.set(key, {
    id: `${context.translation.id}:job-item:${hashString(key).slice(0, 16)}`,
    importJobId: "pending",
    sourceDocument: document.path,
    documentKind: document.kind,
    contentPreview: (preview ?? document.textSample).slice(0, 240),
    confidence,
    status
  });
}

function textFromNode($: ReturnType<typeof load>, node: any) {
  if (node.type === "text") {
    return node.data ?? "";
  }

  if (node.type === "tag") {
    const element = $(node);
    if (element.attr("id")?.startsWith("page_")) {
      return "";
    }
    return element.text();
  }

  return "";
}

function splitBookAndChapter(label: string) {
  const trimmed = normalizeInlineText(label);
  const match = trimmed.match(/^(.*?)(\d+)\s*$/u);
  if (!match) {
    const book = findCanonicalBook(trimmed);
    return { book, chapter: null };
  }

  const book = findCanonicalBook(match[1].trim());
  return {
    book,
    chapter: Number(match[2])
  };
}

function finalizeTotals(context: ParseContext): ImportTotals {
  return {
    booksDetected: context.translationBooks.size,
    chaptersDetected: context.chapters.size,
    versesDetected: context.verses.size,
    sectionHeadingsDetected: context.sectionHeadings.size,
    notesDetected: context.footnotes.size,
    crossReferencesDetected: context.crossReferences.size,
    introductionsDetected: context.bookIntroductions.size + context.chapterIntroductions.size,
    uncertainSegments: Array.from(context.verses.values()).filter((verse) => verse.needsReview).length + context.reviewQueue.size,
    reviewQueueItems: context.reviewQueue.size
  };
}

export function parseNviFootnoteDefinitionsHtml(html: string, sourceDocument: string) {
  const $ = load(html, { xmlMode: true });
  const definitions = new Map<string, ParsedNoteDefinition>();

  $("aside.class_s2HG-0, div.class_s2HG-0").each((_, element) => {
    const id = $(element).attr("id");
    if (!id) {
      return;
    }

    const clone = $(element).clone();
    clone.find("a.class_s1HSE").remove();
    const marker = cleanMarkerText($(element).find("a.class_s1HSE").first().text());
    const referenceLabel = normalizeInlineText($(element).find("span.class_s1HSG-0").first().text());
    clone.find("span.class_s1HSG-0").remove();
    const noteText = normalizeInlineText(clone.text());

    definitions.set(`${sourceDocument}#${id}`, {
      marker,
      referenceLabel: referenceLabel || undefined,
      noteText,
      rawHtml: $.html(element),
      sourceDocument
    });
  });

  return definitions;
}

export function parseAraNotesDocumentHtml(html: string, sourceDocument: string) {
  const $ = load(html, { xmlMode: true });
  const definitions = new Map<string, ParsedNoteDefinition>();

  $("p.x").each((_, element) => {
    const anchor = $(element).find("a.footnote-anchor").first();
    const id = anchor.attr("id");
    if (!id) {
      return;
    }

    const referenceLabel = normalizeInlineText($(element).find("span.xo").first().text());
    const noteText = normalizeInlineText($(element).find("span.xt").first().text() || $(element).text());
    definitions.set(`${sourceDocument}#${id}`, {
      marker: cleanMarkerText(anchor.text()) || "†",
      referenceLabel: referenceLabel || undefined,
      noteText,
      rawHtml: $.html(element),
      sourceDocument,
      noteType: "cross_reference_note"
    });
  });

  return definitions;
}

function parseNaaDocuments(context: ParseContext, documents: EpubDocument[]) {
  const chapterMap = new Map<string, { bookId: string; sourceBookLabel: string; chapterNumber: number }>();
  const navigationClasses = new Set(["class129", "class24827", "class225", "class223", "class227", "class296", "class267"]);

  for (const document of documents) {
    if (!/Cap[ií]tulos de /iu.test(document.textSample)) {
      continue;
    }

    const $ = load(document.content, { xmlMode: true });
    const label = normalizeInlineText($("div.class57817").first().text() || $("body").text());
    const bookLabel = label.replace(/^Cap[ií]tulos de /iu, "").trim();
    const canonicalBook = findCanonicalBook(bookLabel);
    if (!canonicalBook) {
      addReviewItem(context, "unknown_book", document.path, 0.42, {
        notes: `Livro não reconhecido no índice de capítulos: ${bookLabel}.`,
        rawText: label
      });
      continue;
    }

    ensureTranslationBook(context, canonicalBook.id, bookLabel, canonicalBook.canonicalOrder);
    $("a").each((_, anchor) => {
      const chapterNumber = Number(normalizeInlineText($(anchor).text()));
      const href = $(anchor).attr("href");
      if (!href || Number.isNaN(chapterNumber)) {
        return;
      }

      chapterMap.set(resolveHref(document.path, href), {
        bookId: canonicalBook.id,
        sourceBookLabel: bookLabel,
        chapterNumber
      });
    });
  }

  for (const document of documents.filter((entry) => chapterMap.has(entry.path)).sort((left, right) => left.path.localeCompare(right.path))) {
    const chapterInfo = chapterMap.get(document.path);
    if (!chapterInfo) {
      continue;
    }

    const $ = load(document.content, { xmlMode: true });
    ensureTranslationBook(context, chapterInfo.bookId, chapterInfo.sourceBookLabel, canonicalBooks.find((book) => book.id === chapterInfo.bookId)?.canonicalOrder ?? 999);
    ensureChapter(context, chapterInfo.bookId, chapterInfo.chapterNumber, document.path, `${chapterInfo.sourceBookLabel} ${chapterInfo.chapterNumber}`);

    const introParts: string[] = [];
    let currentVerse: number | null = null;
    let lastVerse: number | null = null;

    $("body")
      .children()
      .each((_, element) => {
        const className = ($(element).attr("class") ?? "").trim();
        const elementText = normalizeInlineText($(element).text());
        const hasNavigationLink = $(element).find("a.class69358").length > 0;
        const hasVerseAnchor = $(element).find('a[class*="class69218"]').length > 0;

        if (!elementText) {
          return;
        }

        if (className === "class219" || className === "class221") {
          introParts.push(elementText);
          return;
        }

        if (className === "class79") {
          addSectionHeading(
            context,
            chapterInfo.bookId,
            chapterInfo.chapterNumber,
            $(element).text(),
            document.path,
            "section",
            lastVerse ? lastVerse + 1 : 1
          );
          return;
        }

        if (hasNavigationLink || navigationClasses.has(className) || /índice dos capítulos/iu.test(elementText)) {
          return;
        }

        if (!hasVerseAnchor) {
          if (lastVerse !== null) {
            recordVerse(context, chapterInfo.bookId, chapterInfo.chapterNumber, lastVerse, elementText, document.path, {
              rawText: elementText,
              confidence: 0.9,
              append: true,
              joinWithNewline: true
            });
            return;
          }

          if (chapterInfo.chapterNumber === 1) {
            introParts.push(elementText);
            return;
          }

          addChapterIntroduction(context, chapterInfo.bookId, chapterInfo.chapterNumber, document.path, elementText);
          return;
        }

        let activeVerse = lastVerse;
        let explicitSeen = false;
        let buffer = "";

        const flush = (append = false) => {
          if (activeVerse === null || !normalizeInlineText(buffer)) {
            buffer = "";
            return;
          }

          recordVerse(context, chapterInfo.bookId, chapterInfo.chapterNumber, activeVerse, buffer, document.path, {
            rawText: buffer,
            confidence: append ? 0.9 : 0.96,
            append,
            joinWithNewline: append
          });
          lastVerse = activeVerse;
          buffer = "";
        };

        $(element)
          .contents()
          .each((__, node) => {
            const rawNodeText = textFromNode($, node);
            const nodeText = normalizeInlineText(rawNodeText);
            if (node.type === "tag" && node.name === "a") {
              const marker = Number(nodeText);
              if (!Number.isNaN(marker)) {
                flush(!explicitSeen && activeVerse !== null);
                activeVerse = marker;
                explicitSeen = true;
                currentVerse = marker;
                return;
              }
            }

            if (nodeText) {
              buffer = appendRawInlineText(buffer, rawNodeText);
            }
          });

        flush(!explicitSeen && lastVerse !== null);
      });

    if (chapterInfo.chapterNumber === 1 && introParts.length > 0) {
      addBookIntroduction(context, chapterInfo.bookId, document.path, introParts.join("\n"));
    }

    addImportJobItem(context, document, 0.95, "imported");
  }
}

function parseNviDocuments(context: ParseContext, documents: EpubDocument[]) {
  const noteDefinitions = new Map<string, ParsedNoteDefinition>();
  for (const document of documents) {
    for (const [key, value] of parseNviFootnoteDefinitionsHtml(document.content, document.path)) {
      noteDefinitions.set(key, value);
    }
  }

  const bookDocuments = documents.filter(
    (document) =>
      !document.path.includes("part0000") &&
      (document.kind === "book_content" || document.content.includes("heading_s1B5") || document.content.includes("class_s1HSD"))
  );

  for (const document of bookDocuments.sort((left, right) => (left.spineIndex ?? 9999) - (right.spineIndex ?? 9999))) {
    const $ = load(document.content, { xmlMode: true });
    const bookLabel =
      normalizeInlineText($("div.heading_s1B5").first().text()) ||
      normalizeInlineText(document.navLabels.find((label) => Boolean(findCanonicalBook(label))) ?? "");
    const canonicalBook = findCanonicalBook(bookLabel);
    if (!canonicalBook) {
      addReviewItem(context, "unknown_book", document.path, 0.38, {
        notes: `Livro não reconhecido no EPUB NVI: ${bookLabel}.`,
        rawText: bookLabel
      });
      addImportJobItem(context, document, 0.38, "needs_review");
      continue;
    }

    ensureTranslationBook(context, canonicalBook.id, bookLabel, canonicalBook.canonicalOrder);

    let currentChapter: number | null = null;
    let currentVerse: number | null = null;
    const bookIntroParts: string[] = [];

    const attachNote = (targetHref: string) => {
      if (currentChapter === null || currentVerse === null) {
        return;
      }
      const resolved = resolveHrefWithHash(document.path, targetHref);
      context.noteTargetsSeen.add(resolved);
      const definition = noteDefinitions.get(resolved);
      if (!definition) {
        addReviewItem(context, "unresolved_note_marker", document.path, 0.54, {
          suspectedBookId: canonicalBook.id,
          suspectedChapter: currentChapter,
          suspectedVerse: currentVerse,
          suggestedMapping: resolved,
          notes: `Nota não localizada para ${resolved}.`
        });
        return;
      }

      addFootnote(
        context,
        canonicalBook.id,
        currentChapter,
        currentVerse,
        definition.marker,
        definition.noteText,
        definition.sourceDocument,
        definition.rawHtml,
        resolved.split("#")[1]
      );
    };

    $("body")
      .children()
      .each((_, element) => {
        const className = ($(element).attr("class") ?? "").trim();
        if (className === "class_s1D8") {
          return;
        }

        if (className === "heading_s1B5") {
          bookIntroParts.push(bookLabel);
          return;
        }

        if (/class_s1DA|class_s1E2|class_s1G4/iu.test(className) && !$(element).find("span.class_s1HSD").length) {
          if (currentChapter !== null) {
            addSectionHeading(context, canonicalBook.id, currentChapter, $(element).text(), document.path, "section", currentVerse ? currentVerse + 1 : 1);
          } else {
            bookIntroParts.push(normalizeInlineText($(element).text()));
          }
          return;
        }

        if (/heading_/iu.test(className) && $(element).find('[class*="class_s1HT"]').length > 0) {
          const chapterDigits = $(element)
            .find('[class*="class_s1HT"]')
            .toArray()
            .map((node) => normalizeInlineText($(node).text()))
            .join("");
          const chapterNumber = Number(chapterDigits);
          if (Number.isNaN(chapterNumber)) {
            addReviewItem(context, "unknown_chapter", document.path, 0.41, {
              suspectedBookId: canonicalBook.id,
              notes: `Capítulo não identificado em ${document.path}.`,
              rawHtml: $.html(element),
              rawText: $(element).text()
            });
            return;
          }

          currentChapter = chapterNumber;
          currentVerse = 1;
          ensureChapter(context, canonicalBook.id, chapterNumber, document.path, `${bookLabel} ${chapterNumber}`);

          const clone = $(element).clone();
          clone.find('[class*="class_s1HT"]').remove();
          clone.find("a.class_s1HSJ").remove();
          const verseText = normalizeInlineText(clone.text());
          if (verseText) {
            recordVerse(context, canonicalBook.id, chapterNumber, 1, verseText, document.path, {
              rawText: verseText,
              confidence: 0.94,
              sourceAnchor: $(element).attr("id") ?? undefined
            });
          }

          $(element)
            .find("a.class_s1HSJ")
            .each((__, anchor) => {
              const href = $(anchor).attr("href");
              if (href) {
                attachNote(href);
              }
            });
          return;
        }

        if (!className.startsWith("class_s1") || className.includes("class_s2HG-0")) {
          return;
        }

        if (currentChapter === null) {
          if ($(element).find("span.class_s1HSD").length > 0) {
            currentChapter = 1;
            ensureChapter(context, canonicalBook.id, 1, document.path, `${bookLabel} 1`);
          } else {
            const possibleIntro = normalizeInlineText($(element).text());
            if (possibleIntro) {
              bookIntroParts.push(possibleIntro);
            }
            return;
          }
        }

        let activeVerse = currentVerse;
        let explicitSeen = false;
        let buffer = "";

        const flush = (append = false) => {
          if (activeVerse === null || !normalizeInlineText(buffer)) {
            buffer = "";
            return;
          }

          recordVerse(context, canonicalBook.id, currentChapter!, activeVerse, buffer, document.path, {
            rawText: buffer,
            confidence: append ? 0.88 : 0.94,
            append,
            joinWithNewline: append
          });
          currentVerse = activeVerse;
          buffer = "";
        };

        $(element)
          .contents()
          .each((__, node) => {
            if (node.type === "tag") {
              const child = $(node);
              if (child.is("span") && child.attr("class")?.includes("class_s1HSD")) {
                const marker = Number(normalizeInlineText(child.text()));
                if (!Number.isNaN(marker)) {
                  flush(!explicitSeen && activeVerse !== null);
                  activeVerse = marker;
                  explicitSeen = true;
                  return;
                }
              }

              if (child.is("a") && child.attr("class")?.includes("class_s1HSJ")) {
                const href = child.attr("href");
                if (href) {
                  attachNote(href);
                }
                return;
              }
            }

            const rawNodeText = textFromNode($, node);
            const nodeText = normalizeInlineText(rawNodeText);
            if (!nodeText) {
              return;
            }

            buffer = appendRawInlineText(buffer, rawNodeText);
          });

        flush(!explicitSeen && currentVerse !== null);
      });

    if (bookIntroParts.length > 0) {
      addBookIntroduction(context, canonicalBook.id, document.path, bookIntroParts.join("\n"));
    }

    addImportJobItem(context, document, 0.92, "imported");
  }
}

function parseAraDocuments(context: ParseContext, documents: EpubDocument[]) {
  const noteDefinitions = new Map<string, ParsedNoteDefinition>();
  for (const document of documents.filter((entry) => entry.path.toLowerCase().includes("notas"))) {
    for (const [key, value] of parseAraNotesDocumentHtml(document.content, document.path)) {
      noteDefinitions.set(key, value);
    }
  }

  const chapterDocuments = documents.filter((document) => /<h2 class="c">/u.test(document.content));
  for (const document of chapterDocuments.sort((left, right) => (left.spineIndex ?? 9999) - (right.spineIndex ?? 9999))) {
    const $ = load(document.content, { xmlMode: true });
    const chapterLabel = normalizeInlineText($("h2.c").first().text());
    const parsed = splitBookAndChapter(chapterLabel);
    if (!parsed.book || !parsed.chapter) {
      addReviewItem(context, "unknown_chapter", document.path, 0.43, {
        notes: `Não foi possível identificar livro/capítulo em: ${chapterLabel}.`,
        rawText: chapterLabel
      });
      addImportJobItem(context, document, 0.43, "needs_review");
      continue;
    }

    const book = parsed.book;
    const chapterNumber = parsed.chapter;
    ensureTranslationBook(context, book.id, book.standardNamePt, book.canonicalOrder);
    ensureChapter(context, book.id, chapterNumber, document.path, chapterLabel);

    let currentVerse: number | null = null;

    const attachNote = (href: string) => {
      if (currentVerse === null) {
        return;
      }

      const resolved = resolveHrefWithHash(document.path, href);
      context.noteTargetsSeen.add(resolved);
      const definition = noteDefinitions.get(resolved);
      if (!definition) {
        addReviewItem(context, "unresolved_note_marker", document.path, 0.53, {
          suspectedBookId: book.id,
          suspectedChapter: chapterNumber,
          suspectedVerse: currentVerse,
          suggestedMapping: resolved,
          notes: `Nota ARA sem destino correspondente: ${resolved}.`
        });
        return;
      }

      addFootnote(
        context,
        book.id,
        chapterNumber,
        currentVerse,
        definition.marker,
        definition.noteText,
        definition.sourceDocument,
        definition.rawHtml,
        resolved.split("#")[1]
      );
    };

    const container = $("body > div[id]").filter((_, element) => $(element).find("h2.c").length > 0).first();
    const root = container.length ? container : $("body");

    root
      .children()
      .each((_, element) => {
        if ($(element).is("h3.s1")) {
          addSectionHeading(context, book.id, chapterNumber, $(element).text(), document.path, "section", currentVerse ? currentVerse + 1 : 1);
          return;
        }

        if (!$(element).is("p")) {
          return;
        }

        if (!$(element).find("a.v").length) {
          return;
        }

        let activeVerse = currentVerse;
        let buffer = "";

        const flush = (append = false) => {
          if (activeVerse === null || !normalizeInlineText(buffer)) {
            buffer = "";
            return;
          }

          recordVerse(context, book.id, chapterNumber, activeVerse, buffer, document.path, {
            rawText: buffer,
            confidence: append ? 0.9 : 0.97,
            append,
            joinWithNewline: append
          });
          currentVerse = activeVerse;
          buffer = "";
        };

        $(element)
          .contents()
          .each((__, node) => {
            if (node.type === "tag") {
              const child = $(node);
              if (child.is("a.v")) {
                const marker = Number(normalizeInlineText(child.text()));
                if (!Number.isNaN(marker)) {
                  flush(activeVerse !== null);
                  activeVerse = marker;
                  return;
                }
              }

              if (child.is("span.chamada")) {
                child.find("a.footnote-link").each((___, anchor) => {
                  const href = $(anchor).attr("href");
                  if (href) {
                    attachNote(href);
                  }
                });
                return;
              }

              if (child.is("a.footnote-link")) {
                const href = child.attr("href");
                if (href) {
                  attachNote(href);
                }
                return;
              }
            }

            const rawNodeText = textFromNode($, node);
            const nodeText = normalizeInlineText(rawNodeText);
            if (!nodeText) {
              return;
            }

            buffer = appendRawInlineText(buffer, rawNodeText);
          });

        flush(currentVerse !== null);
      });

    addImportJobItem(context, document, 0.95, "imported");
  }
}

function parseAcfDocuments(context: ParseContext, documents: EpubDocument[]) {
  const chapterDocuments = documents.filter(
    (document) => /id="v\d+\.\d+"/u.test(document.content) && (/<h2 class="c"|<h3 class="c1"/u.test(document.content) || /<title>[^<]+\d+/u.test(document.content))
  );

  for (const document of chapterDocuments.sort((left, right) => (left.spineIndex ?? 9999) - (right.spineIndex ?? 9999))) {
    const $ = load(document.content, { xmlMode: true });
    const chapterLabel = normalizeInlineText($("h2.c, h3.c1").first().text() || $("title").first().text());
    const parsed = splitBookAndChapter(chapterLabel);
    if (!parsed.book || !parsed.chapter) {
      addReviewItem(context, "unknown_chapter", document.path, 0.42, {
        notes: `Livro/capítulo não reconhecido em ${chapterLabel}.`,
        rawText: chapterLabel
      });
      addImportJobItem(context, document, 0.42, "needs_review");
      continue;
    }

    const book = parsed.book;
    const chapterNumber = parsed.chapter;
    ensureTranslationBook(context, book.id, book.standardNamePt, book.canonicalOrder);
    ensureChapter(context, book.id, chapterNumber, document.path, chapterLabel);

    const pendingMarkers = new Map<string, Set<string>>();
    let currentVerse: number | null = null;

    const rememberMarker = (verseNumber: number, marker: string) => {
      const key = `${book.id}:${chapterNumber}:${verseNumber}`;
      const markers = pendingMarkers.get(key) ?? new Set<string>();
      markers.add(cleanMarkerText(marker));
      pendingMarkers.set(key, markers);
    };

    const resolveMarker = (verseNumber: number, marker: string) => {
      const key = `${book.id}:${chapterNumber}:${verseNumber}`;
      const markers = pendingMarkers.get(key);
      markers?.delete(cleanMarkerText(marker));
    };

    $("body")
      .children()
      .each((_, element) => {
        if ($(element).is("h3.s")) {
          addSectionHeading(context, book.id, chapterNumber, $(element).text(), document.path, "section", currentVerse ? currentVerse + 1 : 1);
          return;
        }

        if (!$(element).is("p")) {
          return;
        }

        if ($(element).hasClass("pnota")) {
          const marker = cleanMarkerText($(element).find("span.notax1").first().text());
          const referenceMatch = normalizeInlineText($(element).text()).match(/(\d+)\.(\d+)/u);
          const verseNumber = referenceMatch ? Number(referenceMatch[2]) : currentVerse;
          if (!marker || !verseNumber) {
            addReviewItem(context, "unresolved_note_marker", document.path, 0.45, {
              suspectedBookId: book.id,
              suspectedChapter: chapterNumber,
              suspectedVerse: verseNumber ?? undefined,
              rawHtml: $.html(element),
              rawText: $(element).text(),
              notes: "Nota ACF encontrada sem marcador ou verso identificável."
            });
            return;
          }

          const clone = $(element).clone();
          clone.find("span.notax1").first().remove();
          const noteText = normalizeInlineText(clone.text());
          addFootnote(context, book.id, chapterNumber, verseNumber, marker, noteText, document.path, $.html(element));
          resolveMarker(verseNumber, marker);
          return;
        }

        let activeVerse = currentVerse;
        let buffer = "";
        const contents = $(element).contents().toArray();

        const flush = (append = false) => {
          if (activeVerse === null || !normalizeInlineText(buffer)) {
            buffer = "";
            return;
          }

          recordVerse(context, book.id, chapterNumber, activeVerse, buffer, document.path, {
            rawText: buffer,
            confidence: append ? 0.87 : 0.95,
            append,
            joinWithNewline: append
          });
          currentVerse = activeVerse;
          buffer = "";
        };

        for (let index = 0; index < contents.length; index += 1) {
          const node = contents[index];
          if (node.type === "tag") {
            const child = $(node);
            const verseAnchorId = child.attr("id") ?? "";
            if (child.is("a") && /^v\d+\.\d+$/u.test(verseAnchorId)) {
              const marker = Number(verseAnchorId.split(".")[1]);
              if (!Number.isNaN(marker)) {
                flush(activeVerse !== null);
                activeVerse = marker;
                continue;
              }
            }

            if (child.is("span.notax")) {
              if (activeVerse !== null) {
                rememberMarker(activeVerse, child.text());
              }
              continue;
            }

            if (child.is("span.notax1")) {
              const marker = cleanMarkerText(child.text());
              const noteParts: string[] = [];
              index += 1;
              while (index < contents.length) {
                const next = contents[index];
                if (next.type === "tag") {
                  const nextChild = $(next);
                  if ((nextChild.is("a") && /^v\d+\.\d+$/u.test(nextChild.attr("id") ?? "")) || nextChild.is("span.notax1")) {
                    index -= 1;
                    break;
                  }
                }

                const nextText = normalizeInlineText(textFromNode($, next));
                if (nextText) {
                  noteParts.push(nextText);
                }
                index += 1;
              }

              if (activeVerse !== null && marker) {
                addFootnote(context, book.id, chapterNumber, activeVerse, marker, noteParts.join(" "), document.path, $.html(element));
                resolveMarker(activeVerse, marker);
              }
              continue;
            }
          }

          const rawNodeText = textFromNode($, node);
          const nodeText = normalizeInlineText(rawNodeText);
          if (!nodeText) {
            continue;
          }
          buffer = appendRawInlineText(buffer, rawNodeText);
        }

        flush(currentVerse !== null);
      });

    for (const [key, markers] of pendingMarkers) {
      for (const marker of markers) {
        const [, , verseValue] = key.split(":");
        addReviewItem(context, "unresolved_note_marker", document.path, 0.48, {
          suspectedBookId: book.id,
          suspectedChapter: chapterNumber,
          suspectedVerse: Number(verseValue),
          notes: `Marcador de nota sem conteúdo associado: ${marker}.`
        });
      }
    }

    addImportJobItem(context, document, 0.9, "partial");
  }
}

function parseBkjDocuments(context: ParseContext, documents: EpubDocument[]) {
  const bookDocuments = documents.filter((document) => /class="chapter2"/u.test(document.content));

  for (const document of bookDocuments.sort((left, right) => (left.spineIndex ?? 9999) - (right.spineIndex ?? 9999))) {
    const $ = load(document.content, { xmlMode: true });
    const bookLabel = normalizeInlineText($("h1.chapter2").first().text());
    const canonicalBook = findCanonicalBook(bookLabel);
    if (!canonicalBook) {
      addReviewItem(context, "unknown_book", document.path, 0.36, {
        notes: `Livro não reconhecido no EPUB BKJ: ${bookLabel}.`,
        rawText: bookLabel
      });
      addImportJobItem(context, document, 0.36, "needs_review");
      continue;
    }

    ensureTranslationBook(context, canonicalBook.id, canonicalBook.standardNamePt, canonicalBook.canonicalOrder);

    let currentChapter: number | null = null;
    let currentVerse: number | null = null;
    const bookIntroParts: string[] = [];

    const root = $("div.chapter").first();
    const scope = root.length ? root : $("body");

    scope
      .children()
      .each((_, element) => {
        if ($(element).is("p.center4") && currentChapter === null) {
          bookIntroParts.push(normalizeInlineText($(element).text()));
          return;
        }

        if ($(element).is("p.tx")) {
          const headingText = normalizeInlineText($(element).text());
          if (currentChapter !== null) {
            addSectionHeading(context, canonicalBook.id, currentChapter, headingText, document.path, "section", currentVerse ? currentVerse + 1 : 1);
          } else {
            bookIntroParts.push(headingText);
          }
          return;
        }

        if (!$(element).is("p.calibre26, p.calibre27")) {
          return;
        }

        const clone = $(element).clone();
        let paragraphText = normalizeInlineText(clone.text());
        if (!paragraphText) {
          return;
        }

        const chapterSpan = clone.find("span.dcap, span.dcap1").first();
        if (chapterSpan.length) {
          const chapterNumber = Number(normalizeInlineText(chapterSpan.text()));
          if (!Number.isNaN(chapterNumber)) {
            currentChapter = chapterNumber;
            currentVerse = 1;
            ensureChapter(context, canonicalBook.id, chapterNumber, document.path, `${canonicalBook.standardNamePt} ${chapterNumber}`);
            chapterSpan.remove();
            paragraphText = normalizeInlineText(clone.text());
            recordVerse(context, canonicalBook.id, chapterNumber, 1, paragraphText, document.path, {
              rawText: paragraphText,
              confidence: 0.93,
              sourceAnchor: $(element).attr("id") ?? undefined
            });
            return;
          }
        }

        if (currentChapter === null) {
          bookIntroParts.push(paragraphText);
          return;
        }

        const verseMatch = paragraphText.match(/^(\d+)\s+(.*)$/su);
        if (verseMatch) {
          currentVerse = Number(verseMatch[1]);
          recordVerse(context, canonicalBook.id, currentChapter, currentVerse, verseMatch[2], document.path, {
            rawText: paragraphText,
            confidence: 0.91,
            sourceAnchor: $(element).attr("id") ?? undefined
          });
          return;
        }

        if (currentVerse !== null) {
          recordVerse(context, canonicalBook.id, currentChapter, currentVerse, paragraphText, document.path, {
            rawText: paragraphText,
            confidence: 0.82,
            append: true,
            joinWithNewline: true,
            sourceAnchor: $(element).attr("id") ?? undefined
          });
          return;
        }

        addChapterIntroduction(context, canonicalBook.id, currentChapter, document.path, paragraphText);
      });

    if (bookIntroParts.length > 0) {
      addBookIntroduction(context, canonicalBook.id, document.path, bookIntroParts.join("\n"));
    }

    addImportJobItem(context, document, 0.9, "partial");
  }
}

function parseGenericDocuments(context: ParseContext, documents: EpubDocument[]) {
  for (const document of documents.filter((entry) => entry.kind === "book_content")) {
    const $ = load(document.content, { xmlMode: true });
    const chapterLabel = normalizeInlineText($("h1,h2").first().text());
    const parsed = splitBookAndChapter(chapterLabel);
    if (!parsed.book || !parsed.chapter) {
      addReviewItem(context, "suspicious_fragment", document.path, 0.3, {
        notes: "Documento não se encaixou em nenhum perfil conhecido de Bíblia.",
        rawText: chapterLabel || document.textSample,
        rawHtml: document.content.slice(0, 1000)
      });
      addImportJobItem(context, document, 0.3, "needs_review");
      continue;
    }

    ensureTranslationBook(context, parsed.book.id, parsed.book.standardNamePt, parsed.book.canonicalOrder);
    ensureChapter(context, parsed.book.id, parsed.chapter, document.path, chapterLabel);
    addImportJobItem(context, document, 0.35, "needs_review");
  }
}

function buildResult(context: ParseContext): ParsedTranslationResult {
  return {
    translation: context.translation,
    translationBooks: Array.from(context.translationBooks.values()).sort((left, right) => left.detectedOrder - right.detectedOrder),
    chapters: Array.from(context.chapters.values()).sort((left, right) =>
      left.bookId === right.bookId ? left.chapterNumber - right.chapterNumber : left.bookId.localeCompare(right.bookId)
    ),
    verses: Array.from(context.verses.values()).sort((left, right) =>
      left.bookId === right.bookId
        ? left.chapterNumber === right.chapterNumber
          ? left.verseNumber - right.verseNumber
          : left.chapterNumber - right.chapterNumber
        : left.bookId.localeCompare(right.bookId)
    ),
    sectionHeadings: Array.from(context.sectionHeadings.values()),
    footnotes: Array.from(context.footnotes.values()),
    crossReferences: Array.from(context.crossReferences.values()),
    bookIntroductions: Array.from(context.bookIntroductions.values()),
    chapterIntroductions: Array.from(context.chapterIntroductions.values()),
    importWarnings: Array.from(context.importWarnings.values()),
    rawFragments: Array.from(context.rawFragments.values()),
    reviewQueue: Array.from(context.reviewQueue.values()),
    importJobItems: Array.from(context.importJobItems.values()),
    totals: finalizeTotals(context)
  };
}

export function parseBibleEpub(source: SourceDiscoveryItem) {
  const archive = new EpubArchive(source.filePath);
  const pkg = archive.loadPackage();
  const documents = collectHtmlDocuments(archive, pkg.manifestItems, pkg.spineItems, pkg.navPoints);
  const parserProfile = inferParserProfile(source.fileName, pkg.metadata, documents);
  const translation = createTranslationDetection(source, pkg.metadata, documents, parserProfile);
  const context = createContext(source, translation);

  switch (parserProfile) {
    case "naa":
      parseNaaDocuments(context, documents);
      break;
    case "nvi":
      parseNviDocuments(context, documents);
      break;
    case "ara":
      parseAraDocuments(context, documents);
      break;
    case "acf1969":
      parseAcfDocuments(context, documents);
      break;
    case "bkj":
      parseBkjDocuments(context, documents);
      break;
    default:
      parseGenericDocuments(context, documents);
      break;
  }

  if (translation.licenseStatus !== "public_domain") {
    addReviewItem(context, "licensing_review", source.filePath, 0.6, {
      notes: `A tradução ${translation.name} foi importada em modo interno. Exibição pública permanece desativada.`,
      rawText: translation.licenseNotes
    });
  }

  return buildResult(context);
}

export function summarizeLicensingStatus(status: LicenseStatus) {
  switch (status) {
    case "public_domain":
      return "Domínio público";
    case "licensed":
      return "Licenciada";
    case "restricted":
      return "Restrita";
    case "internal_only":
      return "Uso interno";
    case "pending_review":
      return "Pendente de revisão";
    default:
      return "Desconhecida";
  }
}
