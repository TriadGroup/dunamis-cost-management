import type { EpubDocument, EpubMetadata, LicenseStatus } from "@/lib/ingestion/types";

function uniqueLines(lines: string[]) {
  return Array.from(new Set(lines.filter(Boolean)));
}

export function detectLicenseStatus(metadata: EpubMetadata, documents: EpubDocument[]) {
  const evidence: string[] = [];
  const searchable = [
    metadata.rights ?? "",
    metadata.publisher ?? "",
    metadata.description ?? "",
    ...documents
      .filter((document) => document.kind === "copyright" || document.kind === "front_matter" || document.kind === "preface")
      .map((document) => document.textSample)
  ]
    .join("\n")
    .toLowerCase();

  if (/dom[ií]nio p[uú]blico|public domain/iu.test(searchable)) {
    evidence.push("Indicadores textuais de domínio público detectados.");
    return {
      status: "public_domain" as LicenseStatus,
      canDisplayPublicly: true,
      canUseForCompare: true,
      licenseNotes: evidence.join(" ")
    };
  }

  if (
    /©|\bcopyright\b|todos os direitos reservados|all rights reserved|sociedade b[ií]blica do brasil|thomas nelson|abba press/iu.test(
      searchable
    )
  ) {
    evidence.push("Sinais explícitos de proteção autoral e/ou editora contemporânea detectados.");
    return {
      status: "restricted" as LicenseStatus,
      canDisplayPublicly: false,
      canUseForCompare: false,
      licenseNotes: evidence.join(" ")
    };
  }

  if (metadata.publisher) {
    evidence.push(`Editora detectada nos metadados: ${metadata.publisher}.`);
  }

  evidence.push("Sem declaração pública suficiente para liberar exibição pública automática.");

  return {
    status: "pending_review" as LicenseStatus,
    canDisplayPublicly: false,
    canUseForCompare: false,
    licenseNotes: uniqueLines(evidence).join(" ")
  };
}
