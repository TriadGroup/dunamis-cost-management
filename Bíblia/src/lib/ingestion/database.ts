import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { canonicalBooks } from "@/lib/ingestion/canon";
import type { ImportMode, ImportReport, ImportStatus, ParsedTranslationResult, TranslationDetection } from "@/lib/ingestion/types";

function asJson(value: unknown) {
  return JSON.stringify(value);
}

function inferImportStatus(parsed: ParsedTranslationResult): ImportStatus {
  return parsed.reviewQueue.length > 0 || parsed.importWarnings.length > 0 ? "partial" : "imported";
}

export class BibleImportDatabase {
  private readonly db: Database.Database;

  constructor(private readonly filePath: string) {
    mkdirSync(dirname(filePath), { recursive: true });
    this.db = new Database(filePath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.ensureSchema();
    this.seedCanonicalBooks();
  }

  private ensureSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS translations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        short_code TEXT NOT NULL UNIQUE,
        language TEXT NOT NULL,
        publisher TEXT,
        copyright_holder TEXT,
        license_status TEXT NOT NULL,
        license_notes TEXT,
        source_file_name TEXT NOT NULL,
        source_hash TEXT NOT NULL,
        source_format TEXT NOT NULL,
        imported_at TEXT NOT NULL,
        import_version INTEGER NOT NULL,
        is_active INTEGER NOT NULL,
        can_display_publicly INTEGER NOT NULL,
        can_use_for_compare INTEGER NOT NULL,
        notes TEXT,
        parser_profile TEXT NOT NULL,
        metadata_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        canonical_order INTEGER NOT NULL,
        testament TEXT NOT NULL,
        standard_name_pt TEXT NOT NULL,
        standard_name_en TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        osis_code TEXT NOT NULL UNIQUE,
        chapter_count INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS translation_books (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        source_book_label TEXT NOT NULL,
        detected_order INTEGER NOT NULL,
        notes TEXT,
        FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        source_label TEXT,
        import_status TEXT NOT NULL,
        source_document TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS verses (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        verse_number INTEGER NOT NULL,
        normalized_reference TEXT NOT NULL,
        verse_text TEXT NOT NULL,
        verse_text_raw TEXT NOT NULL,
        import_confidence REAL NOT NULL,
        import_status TEXT NOT NULL,
        needs_review INTEGER NOT NULL,
        source_document TEXT NOT NULL,
        source_anchor TEXT,
        source_fragment_hash TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        UNIQUE (translation_id, normalized_reference)
      );

      CREATE TABLE IF NOT EXISTS section_headings (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        verse_start INTEGER,
        verse_end INTEGER,
        heading_text TEXT NOT NULL,
        heading_type TEXT NOT NULL,
        source_document TEXT NOT NULL,
        FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS footnotes (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        verse_number INTEGER NOT NULL,
        note_marker TEXT NOT NULL,
        note_text TEXT NOT NULL,
        note_type TEXT NOT NULL,
        source_document TEXT NOT NULL,
        source_anchor TEXT,
        raw_html TEXT,
        FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS cross_references (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        source_book_id TEXT NOT NULL,
        source_chapter INTEGER NOT NULL,
        source_verse INTEGER NOT NULL,
        target_reference_raw TEXT NOT NULL,
        target_reference_normalized TEXT,
        note_text TEXT,
        source_document TEXT NOT NULL,
        FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE,
        FOREIGN KEY (source_book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS book_introductions (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        body_text TEXT NOT NULL,
        source_document TEXT NOT NULL,
        FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS chapter_introductions (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        body_text TEXT NOT NULL,
        source_document TEXT NOT NULL,
        FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS import_jobs (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        source_file_name TEXT NOT NULL,
        source_hash TEXT NOT NULL,
        import_mode TEXT NOT NULL,
        import_version INTEGER NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        status TEXT NOT NULL,
        report_path_json TEXT,
        report_path_markdown TEXT,
        report_json TEXT,
        FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS import_job_items (
        id TEXT PRIMARY KEY,
        import_job_id TEXT NOT NULL,
        source_document TEXT NOT NULL,
        document_kind TEXT NOT NULL,
        content_preview TEXT NOT NULL,
        confidence REAL NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (import_job_id) REFERENCES import_jobs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS import_warnings (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        code TEXT NOT NULL,
        message TEXT NOT NULL,
        source_document TEXT,
        source_reference TEXT,
        parser_confidence REAL NOT NULL,
        FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS raw_fragments (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        source_document TEXT NOT NULL,
        source_anchor TEXT,
        fragment_type TEXT NOT NULL,
        raw_html TEXT NOT NULL,
        raw_text TEXT NOT NULL,
        fragment_hash TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS review_queue (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        source_file TEXT NOT NULL,
        source_document TEXT NOT NULL,
        suspected_book_id TEXT,
        suspected_chapter INTEGER,
        suspected_verse INTEGER,
        reason TEXT NOT NULL,
        parser_confidence REAL NOT NULL,
        suggested_mapping TEXT,
        raw_fragment_id TEXT,
        notes TEXT,
        FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE
      );
    `);
  }

  private seedCanonicalBooks() {
    const statement = this.db.prepare(`
      INSERT INTO books (
        id, canonical_order, testament, standard_name_pt, standard_name_en, slug, osis_code, chapter_count
      ) VALUES (
        @id, @canonicalOrder, @testament, @standardNamePt, @standardNameEn, @slug, @osisCode, @chapterCount
      )
      ON CONFLICT(id) DO UPDATE SET
        canonical_order = excluded.canonical_order,
        testament = excluded.testament,
        standard_name_pt = excluded.standard_name_pt,
        standard_name_en = excluded.standard_name_en,
        slug = excluded.slug,
        osis_code = excluded.osis_code,
        chapter_count = excluded.chapter_count
    `);

    const transaction = this.db.transaction(() => {
      for (const book of canonicalBooks) {
        statement.run(book);
      }
    });

    transaction();
  }

  private getCurrentTranslation(shortCode: string) {
    return this.db.prepare("SELECT * FROM translations WHERE short_code = ?").get(shortCode) as
      | { id: string; import_version: number; source_hash: string }
      | undefined;
  }

  private hasImportedHash(sourceHash: string) {
    const row = this.db
      .prepare("SELECT id FROM import_jobs WHERE source_hash = ? AND status IN ('imported', 'partial') LIMIT 1")
      .get(sourceHash) as { id: string } | undefined;

    return Boolean(row);
  }

  private deleteTranslationContent(translationId: string) {
    const tables = [
      "translation_books",
      "chapters",
      "verses",
      "section_headings",
      "footnotes",
      "cross_references",
      "book_introductions",
      "chapter_introductions",
      "import_warnings",
      "raw_fragments",
      "review_queue"
    ];

    const transaction = this.db.transaction(() => {
      for (const table of tables) {
        this.db.prepare(`DELETE FROM ${table} WHERE translation_id = ?`).run(translationId);
      }
    });

    transaction();
  }

  private upsertTranslation(translation: TranslationDetection) {
    this.db
      .prepare(`
        INSERT INTO translations (
          id, name, short_code, language, publisher, copyright_holder, license_status, license_notes,
          source_file_name, source_hash, source_format, imported_at, import_version, is_active,
          can_display_publicly, can_use_for_compare, notes, parser_profile, metadata_json
        ) VALUES (
          @id, @name, @shortCode, @language, @publisher, @copyrightHolder, @licenseStatus, @licenseNotes,
          @sourceFileName, @sourceHash, @sourceFormat, @importedAt, @importVersion, @isActive,
          @canDisplayPublicly, @canUseForCompare, @notes, @parserProfile, @metadataJson
        )
        ON CONFLICT(short_code) DO UPDATE SET
          id = excluded.id,
          name = excluded.name,
          language = excluded.language,
          publisher = excluded.publisher,
          copyright_holder = excluded.copyright_holder,
          license_status = excluded.license_status,
          license_notes = excluded.license_notes,
          source_file_name = excluded.source_file_name,
          source_hash = excluded.source_hash,
          source_format = excluded.source_format,
          imported_at = excluded.imported_at,
          import_version = excluded.import_version,
          is_active = excluded.is_active,
          can_display_publicly = excluded.can_display_publicly,
          can_use_for_compare = excluded.can_use_for_compare,
          notes = excluded.notes,
          parser_profile = excluded.parser_profile,
          metadata_json = excluded.metadata_json
      `)
      .run({
        id: translation.id,
        name: translation.name,
        shortCode: translation.shortCode,
        language: translation.language,
        publisher: translation.publisher,
        copyrightHolder: translation.copyrightHolder,
        licenseStatus: translation.licenseStatus,
        licenseNotes: translation.licenseNotes,
        sourceFileName: translation.sourceFileName,
        sourceHash: translation.sourceHash,
        sourceFormat: translation.sourceFormat,
        importedAt: translation.importedAt,
        importVersion: translation.importVersion,
        isActive: translation.isActive ? 1 : 0,
        canDisplayPublicly: translation.canDisplayPublicly ? 1 : 0,
        canUseForCompare: translation.canUseForCompare ? 1 : 0,
        notes: translation.notes ?? null,
        parserProfile: translation.parserProfile,
        metadataJson: asJson(translation.metadata)
      });
  }

  private createImportJob(
    translationId: string,
    sourceFileName: string,
    sourceHash: string,
    importMode: ImportMode,
    importVersion: number,
    status: ImportStatus,
    report: ImportReport,
    reportPathJson?: string,
    reportPathMarkdown?: string
  ) {
    const id = `job:${translationId}:${sourceHash.slice(0, 12)}:${Date.now()}`;
    this.db
      .prepare(`
        INSERT INTO import_jobs (
          id, translation_id, source_file_name, source_hash, import_mode, import_version,
          started_at, completed_at, status, report_path_json, report_path_markdown, report_json
        ) VALUES (
          @id, @translationId, @sourceFileName, @sourceHash, @importMode, @importVersion,
          @startedAt, @completedAt, @status, @reportPathJson, @reportPathMarkdown, @reportJson
        )
      `)
      .run({
        id,
        translationId,
        sourceFileName,
        sourceHash,
        importMode,
        importVersion,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status,
        reportPathJson: reportPathJson ?? null,
        reportPathMarkdown: reportPathMarkdown ?? null,
        reportJson: asJson(report)
      });

    return id;
  }

  private insertRows(table: string, rows: Array<Record<string, unknown>>) {
    if (rows.length === 0) {
      return;
    }

    const columns = Object.keys(rows[0] ?? {});
    const placeholders = columns.map((column) => `@${column}`).join(", ");
    const statement = this.db.prepare(`INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`);

    for (const row of rows) {
      statement.run(row);
    }
  }

  writeImport(
    parsed: ParsedTranslationResult,
    mode: ImportMode,
    report: ImportReport,
    reportPaths?: { json?: string; markdown?: string }
  ) {
    if (mode === "skip" && this.hasImportedHash(parsed.translation.sourceHash)) {
      const skippedJobId = `job:${parsed.translation.id}:${parsed.translation.sourceHash.slice(0, 12)}:skipped`;
      this.db
        .prepare(`
          INSERT OR REPLACE INTO import_jobs (
            id, translation_id, source_file_name, source_hash, import_mode, import_version,
            started_at, completed_at, status, report_path_json, report_path_markdown, report_json
          ) VALUES (
            @id, @translationId, @sourceFileName, @sourceHash, @importMode, @importVersion,
            @startedAt, @completedAt, 'skipped', @reportPathJson, @reportPathMarkdown, @reportJson
          )
        `)
        .run({
          id: skippedJobId,
          translationId: parsed.translation.id,
          sourceFileName: parsed.translation.sourceFileName,
          sourceHash: parsed.translation.sourceHash,
          importMode: mode,
          importVersion: parsed.translation.importVersion,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          reportPathJson: reportPaths?.json ?? null,
          reportPathMarkdown: reportPaths?.markdown ?? null,
          reportJson: asJson(report)
        });

      return { skipped: true, importJobId: skippedJobId, importVersion: parsed.translation.importVersion };
    }

    const current = this.getCurrentTranslation(parsed.translation.shortCode);
    const nextVersion =
      current && mode === "new_revision" ? current.import_version + 1 : current?.import_version ?? parsed.translation.importVersion;

    parsed.translation.importVersion = nextVersion;
    parsed.translation.importedAt = new Date().toISOString();

    const status = inferImportStatus(parsed);

    const transaction = this.db.transaction(() => {
      if (current) {
        this.deleteTranslationContent(current.id);
      }

      this.upsertTranslation(parsed.translation);
      const importJobId = this.createImportJob(
        parsed.translation.id,
        parsed.translation.sourceFileName,
        parsed.translation.sourceHash,
        mode,
        nextVersion,
        status,
        report,
        reportPaths?.json,
        reportPaths?.markdown
      );

      this.insertRows(
        "translation_books",
        parsed.translationBooks.map((book) => ({
          id: book.id,
          translation_id: book.translationId,
          book_id: book.bookId,
          source_book_label: book.sourceBookLabel,
          detected_order: book.detectedOrder,
          notes: book.notes ?? null
        }))
      );
      this.insertRows(
        "chapters",
        parsed.chapters.map((chapter) => ({
          id: chapter.id,
          translation_id: chapter.translationId,
          book_id: chapter.bookId,
          chapter_number: chapter.chapterNumber,
          source_label: chapter.sourceLabel ?? null,
          import_status: chapter.importStatus,
          source_document: chapter.sourceDocument,
          notes: chapter.notes ?? null
        }))
      );
      this.insertRows(
        "verses",
        parsed.verses.map((verse) => ({
          id: verse.id,
          translation_id: verse.translationId,
          book_id: verse.bookId,
          chapter_number: verse.chapterNumber,
          verse_number: verse.verseNumber,
          normalized_reference: verse.normalizedReference,
          verse_text: verse.verseText,
          verse_text_raw: verse.verseTextRaw,
          import_confidence: verse.importConfidence,
          import_status: verse.importStatus,
          needs_review: verse.needsReview ? 1 : 0,
          source_document: verse.sourceDocument,
          source_anchor: verse.sourceAnchor ?? null,
          source_fragment_hash: verse.sourceFragmentHash,
          notes: verse.notes ?? null
        }))
      );
      this.insertRows(
        "section_headings",
        parsed.sectionHeadings.map((heading) => ({
          id: heading.id,
          translation_id: heading.translationId,
          book_id: heading.bookId,
          chapter_number: heading.chapterNumber,
          verse_start: heading.verseStart ?? null,
          verse_end: heading.verseEnd ?? null,
          heading_text: heading.headingText,
          heading_type: heading.headingType,
          source_document: heading.sourceDocument
        }))
      );
      this.insertRows(
        "footnotes",
        parsed.footnotes.map((note) => ({
          id: note.id,
          translation_id: note.translationId,
          book_id: note.bookId,
          chapter_number: note.chapterNumber,
          verse_number: note.verseNumber,
          note_marker: note.noteMarker,
          note_text: note.noteText,
          note_type: note.noteType,
          source_document: note.sourceDocument,
          source_anchor: note.sourceAnchor ?? null,
          raw_html: note.rawHtml ?? null
        }))
      );
      this.insertRows(
        "cross_references",
        parsed.crossReferences.map((reference) => ({
          id: reference.id,
          translation_id: reference.translationId,
          source_book_id: reference.sourceBookId,
          source_chapter: reference.sourceChapter,
          source_verse: reference.sourceVerse,
          target_reference_raw: reference.targetReferenceRaw,
          target_reference_normalized: reference.targetReferenceNormalized ?? null,
          note_text: reference.noteText ?? null,
          source_document: reference.sourceDocument
        }))
      );
      this.insertRows(
        "book_introductions",
        parsed.bookIntroductions.map((introduction) => ({
          id: introduction.id,
          translation_id: introduction.translationId,
          book_id: introduction.bookId,
          body_text: introduction.bodyText,
          source_document: introduction.sourceDocument
        }))
      );
      this.insertRows(
        "chapter_introductions",
        parsed.chapterIntroductions.map((introduction) => ({
          id: introduction.id,
          translation_id: introduction.translationId,
          book_id: introduction.bookId,
          chapter_number: introduction.chapterNumber,
          body_text: introduction.bodyText,
          source_document: introduction.sourceDocument
        }))
      );
      this.insertRows(
        "import_warnings",
        parsed.importWarnings.map((warning) => ({
          id: warning.id,
          translation_id: warning.translationId,
          code: warning.code,
          message: warning.message,
          source_document: warning.sourceDocument ?? null,
          source_reference: warning.sourceReference ?? null,
          parser_confidence: warning.parserConfidence
        }))
      );
      this.insertRows(
        "raw_fragments",
        parsed.rawFragments.map((fragment) => ({
          id: fragment.id,
          translation_id: fragment.translationId,
          source_document: fragment.sourceDocument,
          source_anchor: fragment.sourceAnchor ?? null,
          fragment_type: fragment.fragmentType,
          raw_html: fragment.rawHtml,
          raw_text: fragment.rawText,
          fragment_hash: fragment.fragmentHash,
          notes: fragment.notes ?? null
        }))
      );
      this.insertRows(
        "review_queue",
        parsed.reviewQueue.map((item) => ({
          id: item.id,
          translation_id: item.translationId,
          source_file: item.sourceFile,
          source_document: item.sourceDocument,
          suspected_book_id: item.suspectedBookId ?? null,
          suspected_chapter: item.suspectedChapter ?? null,
          suspected_verse: item.suspectedVerse ?? null,
          reason: item.reason,
          parser_confidence: item.parserConfidence,
          suggested_mapping: item.suggestedMapping ?? null,
          raw_fragment_id: item.rawFragmentId ?? null,
          notes: item.notes ?? null
        }))
      );
      this.insertRows(
        "import_job_items",
        parsed.importJobItems.map((item) => ({
          id: item.id,
          import_job_id: importJobId,
          source_document: item.sourceDocument,
          document_kind: item.documentKind,
          content_preview: item.contentPreview,
          confidence: item.confidence,
          status: item.status
        }))
      );

      return {
        skipped: false,
        importJobId,
        importVersion: nextVersion
      };
    });

    return transaction();
  }
}
