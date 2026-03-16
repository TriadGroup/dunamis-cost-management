import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { summarizeLicensingStatus } from "@/lib/ingestion/parser";
import type { ImportReport, ParsedTranslationResult } from "@/lib/ingestion/types";

export function buildImportReport(parsed: ParsedTranslationResult): ImportReport {
  const warnings = parsed.importWarnings.map((warning) => ({
    code: warning.code,
    message: warning.message,
    sourceDocument: warning.sourceDocument,
    sourceReference: warning.sourceReference,
    parserConfidence: warning.parserConfidence
  }));

  const confidenceValues = parsed.verses.map((verse) => verse.importConfidence);
  const averageConfidence =
    confidenceValues.length === 0 ? 0 : confidenceValues.reduce((total, value) => total + value, 0) / confidenceValues.length;

  return {
    translationId: parsed.translation.id,
    translationName: parsed.translation.name,
    shortCode: parsed.translation.shortCode,
    sourceFileName: parsed.translation.sourceFileName,
    sourceHash: parsed.translation.sourceHash,
    parserProfile: parsed.translation.parserProfile,
    metadata: {
      title: parsed.translation.metadata.title,
      publisher: parsed.translation.publisher,
      creator: parsed.translation.metadata.creator,
      language: parsed.translation.language,
      rights: parsed.translation.metadata.rights,
      date: parsed.translation.metadata.date
    },
    licensing: {
      status: parsed.translation.licenseStatus,
      notes: parsed.translation.licenseNotes,
      canDisplayPublicly: parsed.translation.canDisplayPublicly,
      canUseForCompare: parsed.translation.canUseForCompare
    },
    totals: parsed.totals,
    warnings,
    overview: [
      `${parsed.translation.name} importada via perfil ${parsed.translation.parserProfile}.`,
      `${parsed.totals.booksDetected} livros, ${parsed.totals.chaptersDetected} capítulos, ${parsed.totals.versesDetected} versos.`,
      `${parsed.totals.notesDetected} notas, ${parsed.totals.crossReferencesDetected} referências cruzadas e ${parsed.totals.reviewQueueItems} itens em revisão.`,
      `Confiança média de versos: ${(averageConfidence * 100).toFixed(1)}%.`,
      `Licenciamento: ${summarizeLicensingStatus(parsed.translation.licenseStatus)}.`
    ].join(" ")
  };
}

function reportBaseName(report: ImportReport) {
  return `${report.shortCode}-${report.sourceHash.slice(0, 12)}`;
}

export function renderImportReportMarkdown(report: ImportReport) {
  const warningLines =
    report.warnings.length === 0
      ? ["- Nenhum aviso estrutural registrado."]
      : report.warnings.map((warning) => {
          const location = [warning.sourceDocument, warning.sourceReference].filter(Boolean).join(" | ");
          const suffix = location ? ` (${location})` : "";
          return `- [${warning.code}] ${warning.message}${suffix}`;
        });

  return [
    `# Import Report — ${report.translationName}`,
    "",
    "## Arquivo",
    `- Fonte: \`${report.sourceFileName}\``,
    `- Hash SHA-256: \`${report.sourceHash}\``,
    `- Perfil de parser: \`${report.parserProfile}\``,
    "",
    "## Metadados",
    `- Título: ${report.metadata.title ?? "Não identificado"}`,
    `- Idioma: ${report.metadata.language ?? "Não identificado"}`,
    `- Criador: ${report.metadata.creator ?? "Não identificado"}`,
    `- Editora: ${report.metadata.publisher ?? "Não identificado"}`,
    `- Direitos: ${report.metadata.rights ?? "Não identificado"}`,
    `- Data: ${report.metadata.date ?? "Não identificada"}`,
    "",
    "## Licenciamento",
    `- Status: ${summarizeLicensingStatus(report.licensing.status)}`,
    `- Exibição pública automática: ${report.licensing.canDisplayPublicly ? "sim" : "não"}`,
    `- Comparação pública automática: ${report.licensing.canUseForCompare ? "sim" : "não"}`,
    `- Notas: ${report.licensing.notes}`,
    "",
    "## Totais",
    `- Livros: ${report.totals.booksDetected}`,
    `- Capítulos: ${report.totals.chaptersDetected}`,
    `- Versos: ${report.totals.versesDetected}`,
    `- Cabeçalhos: ${report.totals.sectionHeadingsDetected}`,
    `- Notas: ${report.totals.notesDetected}`,
    `- Referências cruzadas: ${report.totals.crossReferencesDetected}`,
    `- Introduções: ${report.totals.introductionsDetected}`,
    `- Segmentos incertos: ${report.totals.uncertainSegments}`,
    `- Fila de revisão: ${report.totals.reviewQueueItems}`,
    "",
    "## Resumo",
    report.overview,
    "",
    "## Avisos",
    ...warningLines
  ].join("\n");
}

export function writeImportReportFiles(outputDirectory: string, report: ImportReport) {
  mkdirSync(outputDirectory, { recursive: true });
  const baseName = reportBaseName(report);
  const jsonPath = join(outputDirectory, `${baseName}.json`);
  const markdownPath = join(outputDirectory, `${baseName}.md`);

  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(markdownPath, renderImportReportMarkdown(report));

  return {
    json: jsonPath,
    markdown: markdownPath
  };
}

export function writeAuditSummary(outputFilePath: string, reports: ImportReport[]) {
  mkdirSync(dirname(outputFilePath), { recursive: true });

  const lines = [
    "# Auditoria de Fontes EPUB",
    "",
    "Resumo consolidado dos EPUBs bíblicos importados em modo interno/revisão.",
    "",
    "| Tradução | Arquivo | Perfil | Livros | Capítulos | Versos | Notas | Revisão | Licenciamento | Público |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |"
  ];

  for (const report of reports) {
    lines.push(
      `| ${report.translationName} | \`${report.sourceFileName}\` | \`${report.parserProfile}\` | ${report.totals.booksDetected} | ${report.totals.chaptersDetected} | ${report.totals.versesDetected} | ${report.totals.notesDetected} | ${report.totals.reviewQueueItems} | ${summarizeLicensingStatus(report.licensing.status)} | ${report.licensing.canDisplayPublicly ? "sim" : "não"} |`
    );
  }

  lines.push("");
  lines.push("## Observações");
  for (const report of reports) {
    lines.push(`- **${report.translationName}**: ${report.overview}`);
  }

  writeFileSync(outputFilePath, lines.join("\n"));
}
