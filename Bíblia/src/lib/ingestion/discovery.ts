import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import type { SourceDiscoveryItem } from "@/lib/ingestion/types";

function walk(directory: string, results: string[] = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, results);
      continue;
    }

    if (entry.isFile() && fullPath.toLowerCase().endsWith(".epub")) {
      results.push(fullPath);
    }
  }

  return results;
}

function sha256File(filePath: string) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

export function discoverEpubSources(inputDirectory: string) {
  const directory = resolve(inputDirectory);
  return walk(directory)
    .sort((left, right) => left.localeCompare(right))
    .map<SourceDiscoveryItem>((filePath) => {
      const stats = statSync(filePath);
      return {
        filePath,
        fileName: filePath.split("/").pop() ?? filePath,
        sourceHash: sha256File(filePath),
        sizeBytes: stats.size,
        modifiedAt: stats.mtime.toISOString()
      };
    });
}
