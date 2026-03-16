export type ImportMode = "skip" | "replace" | "new_revision";

export type DocumentKind =
  | "cover"
  | "front_matter"
  | "copyright"
  | "preface"
  | "table_of_contents"
  | "book_content"
  | "chapter_index"
  | "notes"
  | "appendix"
  | "unknown";

export type ImportStatus = "imported" | "partial" | "skipped" | "needs_review" | "blocked";

export type ReviewReason =
  | "unknown_book"
  | "unknown_chapter"
  | "unclear_verse_split"
  | "duplicate_verse"
  | "missing_verse_gap"
  | "out_of_order_verse"
  | "unresolved_note_marker"
  | "unresolved_cross_reference"
  | "suspicious_fragment"
  | "suspicious_length"
  | "licensing_review"
  | "content_conflict";

export type NoteType = "textual_note" | "translation_note" | "cross_reference_note" | "study_note" | "unknown";

export type HeadingType = "book" | "chapter" | "section" | "superscription" | "editorial";

export type LicenseStatus = "public_domain" | "licensed" | "restricted" | "unknown" | "internal_only" | "pending_review";

export interface CanonicalBook {
  id: string;
  canonicalOrder: number;
  testament: "old" | "new";
  standardNamePt: string;
  standardNameEn: string;
  slug: string;
  osisCode: string;
  chapterCount: number;
  aliases: string[];
}

export interface EpubMetadata {
  title?: string;
  language?: string;
  creator?: string;
  publisher?: string;
  description?: string;
  rights?: string;
  date?: string;
  identifiers: string[];
  contributors: string[];
  raw: Record<string, unknown>;
}

export interface EpubManifestItem {
  id: string;
  href: string;
  mediaType: string;
  properties?: string;
}

export interface EpubSpineItem {
  idref: string;
  href: string;
  mediaType: string;
}

export interface EpubNavPoint {
  id: string;
  playOrder?: number;
  label: string;
  src: string;
  children: EpubNavPoint[];
}

export interface EpubDocument {
  path: string;
  href: string;
  mediaType: string;
  spineIndex: number | null;
  navLabels: string[];
  content: string;
  textSample: string;
  kind: DocumentKind;
}

export interface SourceDiscoveryItem {
  filePath: string;
  fileName: string;
  sourceHash: string;
  sizeBytes: number;
  modifiedAt: string;
}

export interface TranslationDetection {
  id: string;
  name: string;
  shortCode: string;
  language: string;
  publisher?: string;
  copyrightHolder?: string;
  licenseStatus: LicenseStatus;
  licenseNotes: string;
  sourceFileName: string;
  sourceHash: string;
  sourceFormat: "epub";
  importedAt: string;
  importVersion: number;
  isActive: boolean;
  canDisplayPublicly: boolean;
  canUseForCompare: boolean;
  notes?: string;
  parserProfile: string;
  metadata: EpubMetadata;
}

export interface TranslationBook {
  id: string;
  translationId: string;
  bookId: string;
  sourceBookLabel: string;
  detectedOrder: number;
  notes?: string;
}

export interface ChapterRecord {
  id: string;
  translationId: string;
  bookId: string;
  chapterNumber: number;
  sourceLabel?: string;
  importStatus: ImportStatus;
  sourceDocument: string;
  notes?: string;
}

export interface VerseRecord {
  id: string;
  translationId: string;
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
  normalizedReference: string;
  verseText: string;
  verseTextRaw: string;
  importConfidence: number;
  importStatus: ImportStatus;
  needsReview: boolean;
  sourceDocument: string;
  sourceAnchor?: string;
  sourceFragmentHash: string;
  notes?: string;
}

export interface SectionHeadingRecord {
  id: string;
  translationId: string;
  bookId: string;
  chapterNumber: number;
  verseStart?: number;
  verseEnd?: number;
  headingText: string;
  headingType: HeadingType;
  sourceDocument: string;
}

export interface FootnoteRecord {
  id: string;
  translationId: string;
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
  noteMarker: string;
  noteText: string;
  noteType: NoteType;
  sourceDocument: string;
  sourceAnchor?: string;
  rawHtml?: string;
}

export interface CrossReferenceRecord {
  id: string;
  translationId: string;
  sourceBookId: string;
  sourceChapter: number;
  sourceVerse: number;
  targetReferenceRaw: string;
  targetReferenceNormalized?: string;
  noteText?: string;
  sourceDocument: string;
}

export interface BookIntroductionRecord {
  id: string;
  translationId: string;
  bookId: string;
  bodyText: string;
  sourceDocument: string;
}

export interface ChapterIntroductionRecord {
  id: string;
  translationId: string;
  bookId: string;
  chapterNumber: number;
  bodyText: string;
  sourceDocument: string;
}

export interface ImportWarningRecord {
  id: string;
  translationId: string;
  code: ReviewReason;
  message: string;
  sourceDocument?: string;
  sourceReference?: string;
  parserConfidence: number;
}

export interface RawFragmentRecord {
  id: string;
  translationId: string;
  sourceDocument: string;
  sourceAnchor?: string;
  fragmentType: string;
  rawHtml: string;
  rawText: string;
  fragmentHash: string;
  notes?: string;
}

export interface ReviewQueueRecord {
  id: string;
  translationId: string;
  sourceFile: string;
  sourceDocument: string;
  suspectedBookId?: string;
  suspectedChapter?: number;
  suspectedVerse?: number;
  reason: ReviewReason;
  parserConfidence: number;
  suggestedMapping?: string;
  rawFragmentId?: string;
  notes?: string;
}

export interface ImportJobRecord {
  id: string;
  translationId: string;
  sourceFileName: string;
  sourceHash: string;
  importMode: ImportMode;
  importVersion: number;
  startedAt: string;
  completedAt?: string;
  status: ImportStatus;
  reportPathJson?: string;
  reportPathMarkdown?: string;
}

export interface ImportJobItemRecord {
  id: string;
  importJobId: string;
  sourceDocument: string;
  documentKind: DocumentKind;
  contentPreview: string;
  confidence: number;
  status: ImportStatus;
}

export interface ImportTotals {
  booksDetected: number;
  chaptersDetected: number;
  versesDetected: number;
  sectionHeadingsDetected: number;
  notesDetected: number;
  crossReferencesDetected: number;
  introductionsDetected: number;
  uncertainSegments: number;
  reviewQueueItems: number;
}

export interface ParsedTranslationResult {
  translation: TranslationDetection;
  translationBooks: TranslationBook[];
  chapters: ChapterRecord[];
  verses: VerseRecord[];
  sectionHeadings: SectionHeadingRecord[];
  footnotes: FootnoteRecord[];
  crossReferences: CrossReferenceRecord[];
  bookIntroductions: BookIntroductionRecord[];
  chapterIntroductions: ChapterIntroductionRecord[];
  importWarnings: ImportWarningRecord[];
  rawFragments: RawFragmentRecord[];
  reviewQueue: ReviewQueueRecord[];
  importJobItems: ImportJobItemRecord[];
  totals: ImportTotals;
}

export interface ImportReport {
  translationId: string;
  translationName: string;
  shortCode: string;
  sourceFileName: string;
  sourceHash: string;
  parserProfile: string;
  metadata: {
    title?: string;
    publisher?: string;
    creator?: string;
    language?: string;
    rights?: string;
    date?: string;
  };
  licensing: {
    status: LicenseStatus;
    notes: string;
    canDisplayPublicly: boolean;
    canUseForCompare: boolean;
  };
  totals: ImportTotals;
  warnings: Array<{
    code: ReviewReason;
    message: string;
    sourceDocument?: string;
    sourceReference?: string;
    parserConfidence: number;
  }>;
  overview: string;
}
