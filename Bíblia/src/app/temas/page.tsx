import { ThemeExplorer } from "@/components/reader";
import { Card, DefinitionList, SectionHeading } from "@/components/ui";
import { getThemeIndex } from "@/lib/demo/repository";

export default function ThemesPage() {
  const themes = getThemeIndex();

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-6 p-7 sm:p-8 xl:grid-cols-[1fr_0.95fr]">
          <SectionHeading
            eyebrow="Explorar temas"
            title="Doutrinas, tensões e percursos de estudo com linguagem humana"
            description="A descoberta temática complementa a leitura linear e a navegação por autor. Cada tema conecta comentário, referências e tensões interpretativas."
          />
          <DefinitionList
            items={[
              { label: "Temas", value: themes.length, helper: "páginas indexáveis de descoberta" },
              {
                label: "Entradas",
                value: themes.reduce((sum, theme) => sum + theme.commentaryCount, 0),
                helper: "comentários associados às facetas temáticas"
              }
            ]}
          />
        </div>
      </Card>

      <ThemeExplorer items={themes} />
    </div>
  );
}
