import AdmZip from "adm-zip";
import { dirname, posix } from "node:path";

import { XMLParser } from "fast-xml-parser";

import type { EpubDocument, EpubManifestItem, EpubMetadata, EpubNavPoint, EpubSpineItem } from "@/lib/ingestion/types";
import { normalizeForSearch } from "@/lib/utils";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
  trimValues: false,
  parseTagValue: false
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function stringifyXmlValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (value && typeof value === "object" && "#text" in value) {
    const text = (value as { "#text"?: string })["#text"];
    return typeof text === "string" ? text.trim() : undefined;
  }

  return undefined;
}

function parseMetadata(metadataNode: Record<string, unknown> | undefined): EpubMetadata {
  const node = metadataNode ?? {};
  const identifiers = asArray(node.identifier).map(stringifyXmlValue).filter(Boolean) as string[];
  const contributors = asArray(node.contributor).map(stringifyXmlValue).filter(Boolean) as string[];

  return {
    title: stringifyXmlValue(node.title),
    language: stringifyXmlValue(node.language),
    creator: stringifyXmlValue(node.creator),
    publisher: stringifyXmlValue(node.publisher),
    description: stringifyXmlValue(node.description),
    rights: stringifyXmlValue(node.rights),
    date: stringifyXmlValue(node.date),
    identifiers,
    contributors,
    raw: node
  };
}

function parseManifestItems(manifestNode: Record<string, unknown> | undefined): EpubManifestItem[] {
  return asArray(manifestNode?.item).map((item) => {
    const typed = item as Record<string, string | undefined>;
    return {
      id: typed.id ?? "",
      href: typed.href ?? "",
      mediaType: typed["media-type"] ?? "",
      properties: typed.properties
    };
  });
}

function parseSpineItems(
  spineNode: Record<string, unknown> | undefined,
  manifest: Map<string, EpubManifestItem>
): EpubSpineItem[] {
  return asArray(spineNode?.itemref)
    .map((item) => {
      const typed = item as Record<string, string | undefined>;
      const manifestItem = manifest.get(typed.idref ?? "");
      if (!manifestItem) {
        return null;
      }

      return {
        idref: typed.idref ?? "",
        href: manifestItem.href,
        mediaType: manifestItem.mediaType
      };
    })
    .filter(Boolean) as EpubSpineItem[];
}

function resolvePath(baseDir: string, href: string) {
  return posix.normalize(baseDir ? posix.join(baseDir, href) : href);
}

function flattenTextSample(html: string) {
  return html
    .replace(/<[^>]+>/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 400);
}

function parseNavPoints(node: Record<string, unknown> | undefined): EpubNavPoint[] {
  return asArray(node?.navPoint).map((item) => {
    const typed = item as Record<string, unknown>;
    const navLabel = typed.navLabel as Record<string, unknown> | undefined;
    const content = typed.content as Record<string, string | undefined> | undefined;

    return {
      id: String(typed.id ?? ""),
      playOrder: typed.playOrder ? Number(typed.playOrder) : undefined,
      label: stringifyXmlValue(navLabel?.text) ?? "",
      src: content?.src ?? "",
      children: parseNavPoints(typed)
    };
  });
}

export class EpubArchive {
  readonly zip: any;
  readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.zip = new AdmZip(filePath);
  }

  listEntries() {
    return this.zip.getEntries().map((entry: { entryName: string }) => entry.entryName);
  }

  readText(entryName: string) {
    const entry = this.zip.getEntry(entryName);
    if (!entry) {
      throw new Error(`EPUB entry not found: ${entryName}`);
    }

    return this.zip.readAsText(entry, "utf8");
  }

  tryReadText(entryName: string) {
    const entry = this.zip.getEntry(entryName);
    return entry ? this.zip.readAsText(entry, "utf8") : null;
  }

  readContainerPath() {
    const containerXml = this.readText("META-INF/container.xml");
    const parsed = xmlParser.parse(containerXml) as {
      container?: { rootfiles?: { rootfile?: { "full-path"?: string } | Array<{ "full-path"?: string }> } };
    };
    const rootfiles = asArray(parsed.container?.rootfiles?.rootfile);
    const fullPath = rootfiles[0]?.["full-path"];
    if (!fullPath) {
      throw new Error(`Unable to resolve OPF path from ${this.filePath}`);
    }

    return fullPath;
  }

  loadPackage() {
    const opfPath = this.readContainerPath();
    const opfXml = this.readText(opfPath);
    const parsed = xmlParser.parse(opfXml) as {
      package?: {
        metadata?: Record<string, unknown>;
        manifest?: Record<string, unknown>;
        spine?: Record<string, unknown>;
        guide?: Record<string, unknown>;
      };
    };

    const pkg = parsed.package ?? {};
    const baseDir = dirname(opfPath) === "." ? "" : dirname(opfPath);
    const metadata = parseMetadata(pkg.metadata);
    const manifestItems = parseManifestItems(pkg.manifest).map((item) => ({
      ...item,
      href: resolvePath(baseDir, item.href)
    }));
    const manifestMap = new Map(manifestItems.map((item) => [item.id, item] as const));
    const spineItems = parseSpineItems(pkg.spine, manifestMap).map((item) => ({
      ...item,
      href: resolvePath(baseDir, item.href)
    }));
    const tocId = typeof pkg.spine?.toc === "string" ? pkg.spine.toc : "ncx";
    const tocItem = manifestMap.get(tocId) ?? manifestItems.find((item) => item.mediaType.includes("ncx"));
    const navPoints = tocItem ? this.loadNcx(resolvePath(baseDir, tocItem.href)) : [];

    return {
      opfPath,
      metadata,
      manifestItems,
      spineItems,
      navPoints
    };
  }

  loadNcx(ncxPath: string) {
    const ncxXml = this.tryReadText(ncxPath);
    if (!ncxXml) {
      return [];
    }

    const parsed = xmlParser.parse(ncxXml) as {
      ncx?: { navMap?: Record<string, unknown> };
    };

    return parseNavPoints(parsed.ncx?.navMap).map((point) => ({
      ...point,
      src: resolvePath(dirname(ncxPath) === "." ? "" : dirname(ncxPath), point.src),
      children: point.children.map((child) => ({
        ...child,
        src: resolvePath(dirname(ncxPath) === "." ? "" : dirname(ncxPath), child.src)
      }))
    }));
  }
}

export function collectHtmlDocuments(
  archive: EpubArchive,
  manifestItems: EpubManifestItem[],
  spineItems: EpubSpineItem[],
  navPoints: EpubNavPoint[]
): EpubDocument[] {
  const navByPath = new Map<string, string[]>();

  function visit(points: EpubNavPoint[]) {
    for (const point of points) {
      const normalizedSrc = point.src.split("#")[0] ?? point.src;
      const current = navByPath.get(normalizedSrc) ?? [];
      current.push(point.label);
      navByPath.set(normalizedSrc, current);
      visit(point.children);
    }
  }

  visit(navPoints);

  const spineIndexByHref = new Map(spineItems.map((item, index) => [item.href, index] as const));

  return manifestItems
    .filter((item) => item.mediaType.includes("html") || item.mediaType.includes("xhtml"))
    .map((item) => {
      const content = archive.readText(item.href);
      const normalizedSample = normalizeForSearch(flattenTextSample(content));
      const lowerHref = item.href.toLowerCase();
      const navLabels = navByPath.get(item.href) ?? [];
      let kind: EpubDocument["kind"] = "unknown";

      if (/cover|capa|titlepage/iu.test(lowerHref) || navLabels.some((label) => /capa|cover/iu.test(label))) {
        kind = "cover";
      } else if (
        /prefacio|prefácio|apresentacao|apresentação|como usar|introducao|introdução/iu.test(lowerHref) ||
        navLabels.some((label) => /prefacio|prefácio|apresentação|introdução|como usar/iu.test(label))
      ) {
        kind = "preface";
      } else if (/indice|index|toc|sumario|sumário/iu.test(lowerHref) || navLabels.some((label) => /indice|índice|sumário|toc|chapter/iu.test(label))) {
        kind = /notas|footnote/iu.test(lowerHref) ? "notes" : "table_of_contents";
      } else if (/notas|footnote/iu.test(lowerHref) || normalizedSample.includes("footnote-link")) {
        kind = "notes";
      } else if (
        /copyright|colofao|colofão|creditos|créditos|rights/iu.test(lowerHref) ||
        navLabels.some((label) => /creditos|créditos|copyright|colofão|colofao/iu.test(label))
      ) {
        kind = "copyright";
      } else if (
        navLabels.some((label) => /gênesis|exodo|êxodo|mateus|apocalipse|genesis|john|romanos/iu.test(label)) ||
        /(g[êe]nesis|jo[aã]o|romanos|apocalipse|genesis|john|revelation)/iu.test(flattenTextSample(content).slice(0, 140))
      ) {
        kind = "book_content";
      }

      return {
        path: item.href,
        href: item.href,
        mediaType: item.mediaType,
        spineIndex: spineIndexByHref.get(item.href) ?? null,
        navLabels,
        content,
        textSample: flattenTextSample(content),
        kind
      };
    });
}
