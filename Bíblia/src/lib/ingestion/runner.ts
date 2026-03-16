import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { BibleImportDatabase } from "@/lib/ingestion/database";
import { discoverEpubSources } from "@/lib/ingestion/discovery";
import { parseBibleEpub } from "@/lib/ingestion/parser";
import { buildImportReport, writeAuditSummary, writeImportReportFiles } from "@/lib/ingestion/report";
import type { ImportMode, ImportReport } from "@/lib/ingestion/types";
import { validateParsedTranslation } from "@/lib/ingestion/validation";

export interface RunBibleImportOptions {
  inputDirectory: string;
  reportDirectory: string;
  databasePath: string;
  auditOutputPath: string;
  mode: ImportMode;
}

export function runBibleImports(options: RunBibleImportOptions) {
  mkdirSync(resolve(options.reportDirectory), { recursive: true });
  mkdirSync(dirname(resolve(options.databasePath)), { recursive: true });

  const sources = discoverEpubSources(options.inputDirectory);
  const database = new BibleImportDatabase(options.databasePath);
  const reports: ImportReport[] = [];
  const results: Array<{
    translation: string;
    shortCode: string;
    importMode: ImportMode;
    skipped: boolean;
    importVersion: number;
    importJobId: string;
    reportJsonPath: string;
    reportMarkdownPath: string;
  }> = [];

  for (const source of sources) {
    const parsed = parseBibleEpub(source);
    const validatedWarnings = validateParsedTranslation(parsed);
    parsed.importWarnings = validatedWarnings;
    parsed.totals = {
      ...parsed.totals,
      uncertainSegments:
        validatedWarnings.length +
        parsed.reviewQueue.length +
        parsed.verses.filter((verse) => verse.needsReview).length,
      reviewQueueItems: parsed.reviewQueue.length
    };

    const report = buildImportReport(parsed);
    const reportPaths = writeImportReportFiles(options.reportDirectory, report);
    const writeResult = database.writeImport(parsed, options.mode, report, reportPaths);

    reports.push(report);
    results.push({
      translation: parsed.translation.name,
      shortCode: parsed.translation.shortCode,
      importMode: options.mode,
      skipped: writeResult.skipped,
      importVersion: writeResult.importVersion,
      importJobId: writeResult.importJobId,
      reportJsonPath: reportPaths.json,
      reportMarkdownPath: reportPaths.markdown
    });
  }

  writeAuditSummary(options.auditOutputPath, reports);

  return {
    sourceCount: sources.length,
    reports,
    results
  };
}
