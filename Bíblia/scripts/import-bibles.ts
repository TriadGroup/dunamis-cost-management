import { resolve } from "node:path";

import { runBibleImports } from "../src/lib/ingestion/runner";

function parseMode(argv: string[]) {
  const argument = argv.find((value) => value.startsWith("--mode="));
  const value = argument?.split("=")[1];
  if (value === "replace" || value === "new_revision" || value === "skip") {
    return value;
  }
  return "skip";
}

const cwd = process.cwd();
const mode = parseMode(process.argv.slice(2));

const result = runBibleImports({
  inputDirectory: resolve(cwd, process.env.BIBLE_EPUB_DIR ?? "data/epub"),
  reportDirectory: resolve(cwd, process.env.BIBLE_IMPORT_REPORT_DIR ?? "data/import-reports"),
  databasePath: resolve(cwd, process.env.BIBLE_IMPORT_DB_PATH ?? "data/imports/bible-ingestion.sqlite"),
  auditOutputPath: resolve(cwd, process.env.BIBLE_IMPORT_AUDIT_PATH ?? "docs/epub-source-audit.md"),
  mode
});

console.log(
  JSON.stringify(
    {
      sourceCount: result.sourceCount,
      results: result.results
    },
    null,
    2
  )
);
