import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExegesisPanel, VerseCommentaryPanel } from "@/components/reader";

describe("empty states", () => {
  it("mostra ausência honesta de comentário por escopo", () => {
    render(
      <VerseCommentaryPanel
        groups={{
          verse: [],
          pericope: [],
          chapter: [],
          book: []
        }}
      />
    );

    expect(screen.getAllByText(/Nenhum item neste escopo/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/sem preencher lacunas com conteúdo inventado/i).length).toBeGreaterThan(0);
  });

  it("mostra ausência honesta de nota editorial", () => {
    render(<ExegesisPanel title="Exegese editorial" items={[]} />);
    expect(screen.getByText(/Sem nota editorial publicada/i)).toBeInTheDocument();
  });
});
