import { ArrowRight } from "lucide-react";

import { SidebarBookNavigator } from "@/components/reader";
import { ActionLink, Badge, Card, MetaStrip, SectionHeading, SubtleCard } from "@/components/ui";
import { getLibrarySummary, getTranslationOptions } from "@/lib/demo/server-repository";
import { referenceToHref } from "@/lib/reference/normalize";

export default function ReadIndexPage() {
  const translations = getTranslationOptions();
  const summary = getLibrarySummary();

  return (
    <div className="space-y-6 lg:space-y-8">
      <Card variant="elevated" className="reader-paper overflow-hidden p-0">
        <div className="reader-column space-y-6 px-5 py-8 sm:px-8 sm:py-10">
          <SectionHeading
            size="section"
            eyebrow="Modo leitura"
            title="Abra o texto primeiro. Deixe o estudo aparecer no clique."
            description="A navegacao fica compacta, a traducao troca sem ruir a leitura e o aprofundamento so entra quando um versiculo e selecionado."
          />

          <div className="flex flex-wrap items-center gap-3">
            <ActionLink href="/ler/naa/joao/3" variant="primary" className="px-5 py-3">
              Abrir Joao 3
              <ArrowRight className="h-4 w-4" />
            </ActionLink>
            <ActionLink href="/ler/naa/joao/3/16" variant="secondary" className="px-5 py-3">
              Ir direto ao estudo
            </ActionLink>
          </div>

          <div className="flex flex-wrap gap-2">
            {translations.map((translation) => (
              <Badge key={translation.code} tone={translation.activationStatus === "active" ? "success" : "status"} size="sm">
                {translation.code.toUpperCase()}
              </Badge>
            ))}
          </div>

          <MetaStrip
            items={[
              "texto centrado",
              "navegacao sob demanda",
              `${summary.authors} autores rastreados`,
              `${summary.sources} fontes registradas`
            ]}
          />
        </div>
      </Card>

      <SidebarBookNavigator translationCode="naa" />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SubtleCard className="space-y-4">
          <SectionHeading
            size="compact"
            eyebrow="Fluxo"
            title="Ler, tocar, aprofundar"
            description="No capitulo, so a Biblia e a navegacao essencial ficam abertas. No versiculo, o estudo sobe num painel proprio."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Leitura limpa por padrao.",
              "Comentario, exegese e fontes em camadas separadas.",
              "Mobile com estudo em sheet, desktop com inspector lateral."
            ].map((item) => (
              <div
                key={item}
                className="rounded-[18px] border border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface)/0.74)] px-4 py-4 text-sm leading-7 text-[hsl(var(--foreground))]"
              >
                {item}
              </div>
            ))}
          </div>
        </SubtleCard>

        <SubtleCard className="space-y-4">
          <SectionHeading
            size="compact"
            eyebrow="Passagens de entrada"
            title="Atalhos para testar o reader"
            description="Pontos de entrada curtos para validar leitura, clique em versiculo e comparacao."
          />
          <div className="space-y-3">
            {summary.featuredReferences.slice(0, 4).map((reference) => (
              <a
                key={reference}
                href={referenceToHref(reference)}
                className="flex items-center justify-between rounded-[18px] border border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface)/0.74)] px-4 py-4 text-sm transition hover:border-[hsl(var(--accent)/0.18)]"
              >
                <span className="font-serif text-[1.1rem] tracking-[-0.03em]">{reference}</span>
                <ArrowRight className="h-4 w-4 text-[hsl(var(--muted))]" />
              </a>
            ))}
          </div>
        </SubtleCard>
      </div>
    </div>
  );
}
