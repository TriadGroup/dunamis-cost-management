export type TranslationActivationStatus =
  | "active"
  | "hidden"
  | "pending_license"
  | "demo_only"
  | "unavailable";

export type RightsStatus = "public_domain" | "licensed" | "restricted" | "unknown";
export type ScopeType = "verse" | "pericope" | "chapter" | "book";
export type DirectnessType = "direct" | "indirect" | "editorial";
export type CommentaryKind =
  | "primary_quote"
  | "translated_quote"
  | "editorial_summary"
  | "exegesis"
  | "hermeneutics"
  | "language_note"
  | "historical_note"
  | "cross_reference_note";

export interface TranslationRecord {
  code: string;
  name: string;
  publisher: string;
  rightsHolder: string;
  licenseStatus: RightsStatus;
  activationStatus: TranslationActivationStatus;
  providerKind: string;
  canBundle: boolean;
  summary: string;
  attribution: string;
  docsUrl?: string;
}

export interface SourceRegisterEntry {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  trustLevel: "primary_high" | "primary_standard" | "secondary_high" | "secondary_standard";
  primarySecondary: "primary" | "secondary" | "platform";
  rightsStatus: RightsStatus;
  canBundle: boolean;
  requiresAttribution: boolean;
  notes: string;
}

export interface SourceItemRecord {
  id: string;
  sourceId: string;
  title: string;
  language: string;
  publicationYear?: number;
  editionNotes?: string;
  url: string;
  rightsStatus: RightsStatus;
}

export interface TraditionRecord {
  slug: string;
  name: string;
  family: string;
}

export interface AuthorRecord {
  id: string;
  slug: string;
  displayName: string;
  sortName: string;
  birthYear?: number;
  deathYear?: number;
  eraLabel: string;
  centuryLabel: string;
  traditionSlug: string;
  biography: string;
  sourceStatus: RightsStatus;
  imageSeed: string;
  aliases: string[];
  featured?: boolean;
}

export interface WorkRecord {
  id: string;
  slug: string;
  authorId: string;
  title: string;
  workType: "commentary" | "sermon" | "homily" | "treatise" | "lexicon" | "study_note";
  publicationYear?: number;
  originalLanguage: string;
  sourceItemId?: string;
  rightsStatus: RightsStatus;
  editionNotes?: string;
  coverageSummary: string;
}

export interface BookRecord {
  testament: "old" | "new";
  order: number;
  osis: string;
  slug: string;
  name: string;
  englishName: string;
  abbr: string;
  aliases: string[];
  chapterCount: number;
}

export interface ChapterSeed {
  key: string;
  bookSlug: string;
  chapterNumber: number;
  verseCount: number;
  outline: string[];
  literaryContext: string;
  historicalContext: string;
}

export interface CommentaryRecord {
  id: string;
  authorId: string;
  workId: string;
  sourceItemId: string;
  contentKind: CommentaryKind;
  scopeType: ScopeType;
  directness: DirectnessType;
  startRef: string;
  endRef: string;
  scopeLabel: string;
  excerptOriginal?: string;
  excerptDisplay?: string;
  editorialSummary: string;
  qualityScore: number;
  confidenceScore: number;
  reviewState: "draft" | "needs_review" | "approved" | "published";
  locator: string;
  provenanceNotes: string;
  themeSlugs: string[];
  doctrineSlugs: string[];
}

export interface EditorialNoteRecord {
  id: string;
  noteType: "exegesis" | "hermeneutics" | "historical_note" | "language_note";
  startRef: string;
  endRef: string;
  title: string;
  summary: string;
  sourceItemIds: string[];
}

export interface LanguageNoteRecord {
  id: string;
  startRef: string;
  endRef: string;
  language: "Hebraico" | "Grego";
  lemma: string;
  transliteration: string;
  morphology: string;
  semanticDomain: string;
  note: string;
  sourceItemId: string;
}

export interface CrossReferenceRecord {
  id: string;
  fromRef: string;
  toRef: string;
  relationType: "allusion" | "quotation" | "thematic" | "fulfillment" | "parallel";
  relevanceScore: number;
  rationale: string;
  sourceItemId?: string;
}

export interface ThemeRecord {
  slug: string;
  name: string;
  description: string;
  doctrineFamily: string;
  featuredRefs: string[];
}

export interface CollectionRecord {
  slug: string;
  title: string;
  description: string;
  featuredRefs: string[];
  authorIds: string[];
}
