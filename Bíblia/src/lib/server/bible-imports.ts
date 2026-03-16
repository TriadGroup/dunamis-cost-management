import "server-only";

import Database from "better-sqlite3";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const databasePath = resolve(process.cwd(), process.env.BIBLE_IMPORT_DB_PATH ?? "data/imports/bible-ingestion.sqlite");

type DbTranslationRow = {
  id: string;
  short_code: string;
  name: string;
  publisher: string | null;
  copyright_holder: string | null;
  license_status: string;
  source_file_name: string;
  parser_profile: string;
  notes: string | null;
};

type DbVerseRow = {
  verse_number: number;
  verse_text: string;
  verse_text_raw: string;
  needs_review: number;
  notes: string | null;
  footnote_count: number;
};

type DbHeadingRow = {
  heading_text: string;
  heading_type: string;
  verse_start: number | null;
  verse_end: number | null;
};

type DbFootnoteRow = {
  verse_number: number;
  note_marker: string;
  note_text: string;
  note_type: string;
};

type DbIntroRow = {
  body_text: string;
};

type TranslationCounts = {
  books: number;
  chapters: number;
  verses: number;
};

export type ImportedTranslationRecord = {
  id: string;
  code: string;
  name: string;
  publisher?: string;
  copyrightHolder?: string;
  licenseStatus: string;
  sourceFileName: string;
  parserProfile: string;
  notes?: string;
  counts: TranslationCounts;
};

export type ImportedChapterData = {
  translation: ImportedTranslationRecord;
  verses: Array<{
    verseNumber: number;
    verseText: string;
    verseTextRaw: string;
    needsReview: boolean;
    notes?: string;
    footnoteCount: number;
  }>;
  sectionHeadings: Array<{
    text: string;
    type: string;
    verseStart?: number;
    verseEnd?: number;
  }>;
  bookIntroduction?: string;
  chapterIntroduction?: string;
  footnotesByVerse: Record<number, Array<{ marker: string; text: string; type: string }>>;
};

let db: Database.Database | null = null;

function getDatabase() {
  if (!existsSync(databasePath)) {
    return null;
  }

  if (!db) {
    db = new Database(databasePath, {
      readonly: true,
      fileMustExist: true
    });
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 2500");
  }

  return db;
}

function getCountsByTranslationId(translationId: string): TranslationCounts {
  const database = getDatabase();
  if (!database) {
    return { books: 0, chapters: 0, verses: 0 };
  }

  const row = database
    .prepare(
      `
        SELECT
          COUNT(DISTINCT book_id) AS books,
          COUNT(DISTINCT book_id || ':' || chapter_number) AS chapters,
          COUNT(*) AS verses
        FROM verses
        WHERE translation_id = ?
      `
    )
    .get(translationId) as { books: number; chapters: number; verses: number } | undefined;

  return row ?? { books: 0, chapters: 0, verses: 0 };
}

function mapTranslation(row: DbTranslationRow): ImportedTranslationRecord {
  return {
    id: row.id,
    code: row.short_code,
    name: row.name,
    publisher: row.publisher ?? undefined,
    copyrightHolder: row.copyright_holder ?? undefined,
    licenseStatus: row.license_status,
    sourceFileName: row.source_file_name,
    parserProfile: row.parser_profile,
    notes: row.notes ?? undefined,
    counts: getCountsByTranslationId(row.id)
  };
}

export function getImportedTranslations() {
  const database = getDatabase();
  if (!database) {
    return [];
  }

  const rows = database
    .prepare(
      `
        SELECT id, short_code, name, publisher, copyright_holder, license_status, source_file_name, parser_profile, notes
        FROM translations
        ORDER BY short_code
      `
    )
    .all() as DbTranslationRow[];

  return rows.map(mapTranslation);
}

export function getImportedTranslation(code: string) {
  const database = getDatabase();
  if (!database) {
    return null;
  }

  const row = database
    .prepare(
      `
        SELECT id, short_code, name, publisher, copyright_holder, license_status, source_file_name, parser_profile, notes
        FROM translations
        WHERE short_code = ?
        LIMIT 1
      `
    )
    .get(code) as DbTranslationRow | undefined;

  return row ? mapTranslation(row) : null;
}

export function getImportedChapterData(code: string, bookSlug: string, chapter: number): ImportedChapterData | null {
  const database = getDatabase();
  const translation = getImportedTranslation(code);
  if (!database || !translation) {
    return null;
  }

  const verses = database
    .prepare(
      `
        SELECT
          v.verse_number,
          v.verse_text,
          v.verse_text_raw,
          v.needs_review,
          v.notes,
          COUNT(f.id) AS footnote_count
        FROM verses v
        JOIN books b ON b.id = v.book_id
        LEFT JOIN footnotes f
          ON f.translation_id = v.translation_id
         AND f.book_id = v.book_id
         AND f.chapter_number = v.chapter_number
         AND f.verse_number = v.verse_number
        WHERE v.translation_id = ?
          AND b.slug = ?
          AND v.chapter_number = ?
        GROUP BY v.id
        ORDER BY v.verse_number
      `
    )
    .all(translation.id, bookSlug, chapter) as DbVerseRow[];

  if (verses.length === 0) {
    return null;
  }

  const headings = database
    .prepare(
      `
        SELECT sh.heading_text, sh.heading_type, sh.verse_start, sh.verse_end
        FROM section_headings sh
        JOIN books b ON b.id = sh.book_id
        WHERE sh.translation_id = ?
          AND b.slug = ?
          AND sh.chapter_number = ?
        ORDER BY COALESCE(sh.verse_start, 0), sh.heading_text
      `
    )
    .all(translation.id, bookSlug, chapter) as DbHeadingRow[];

  const footnotes = database
    .prepare(
      `
        SELECT f.verse_number, f.note_marker, f.note_text, f.note_type
        FROM footnotes f
        JOIN books b ON b.id = f.book_id
        WHERE f.translation_id = ?
          AND b.slug = ?
          AND f.chapter_number = ?
        ORDER BY f.verse_number, f.note_marker
      `
    )
    .all(translation.id, bookSlug, chapter) as DbFootnoteRow[];

  const bookIntroductionRow = database
    .prepare(
      `
        SELECT bi.body_text
        FROM book_introductions bi
        JOIN books b ON b.id = bi.book_id
        WHERE bi.translation_id = ?
          AND b.slug = ?
        LIMIT 1
      `
    )
    .get(translation.id, bookSlug) as DbIntroRow | undefined;

  const chapterIntroductionRow = database
    .prepare(
      `
        SELECT ci.body_text
        FROM chapter_introductions ci
        JOIN books b ON b.id = ci.book_id
        WHERE ci.translation_id = ?
          AND b.slug = ?
          AND ci.chapter_number = ?
        LIMIT 1
      `
    )
    .get(translation.id, bookSlug, chapter) as DbIntroRow | undefined;

  const footnotesByVerse: ImportedChapterData["footnotesByVerse"] = {};
  for (const footnote of footnotes) {
    const bucket = footnotesByVerse[footnote.verse_number] ?? [];
    bucket.push({
      marker: footnote.note_marker,
      text: footnote.note_text,
      type: footnote.note_type
    });
    footnotesByVerse[footnote.verse_number] = bucket;
  }

  return {
    translation,
    verses: verses.map((verse) => ({
      verseNumber: verse.verse_number,
      verseText: verse.verse_text,
      verseTextRaw: verse.verse_text_raw,
      needsReview: Boolean(verse.needs_review),
      notes: verse.notes ?? undefined,
      footnoteCount: verse.footnote_count
    })),
    sectionHeadings: headings.map((heading) => ({
      text: heading.heading_text,
      type: heading.heading_type,
      verseStart: heading.verse_start ?? undefined,
      verseEnd: heading.verse_end ?? undefined
    })),
    bookIntroduction: bookIntroductionRow?.body_text,
    chapterIntroduction: chapterIntroductionRow?.body_text,
    footnotesByVerse
  };
}

export function getImportedVerseData(code: string, bookSlug: string, chapter: number, verse: number) {
  const chapterData = getImportedChapterData(code, bookSlug, chapter);
  if (!chapterData) {
    return null;
  }

  const verseData = chapterData.verses.find((item) => item.verseNumber === verse);
  if (!verseData) {
    return null;
  }

  return {
    ...verseData,
    footnotes: chapterData.footnotesByVerse[verse] ?? [],
    sectionHeadings: chapterData.sectionHeadings.filter(
      (heading) => (heading.verseStart ?? verse) <= verse && (heading.verseEnd ?? verse) >= verse
    ),
    translation: chapterData.translation
  };
}
