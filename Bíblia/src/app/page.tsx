import Link from "next/link";
import { ArrowRight, BookOpenText, LibraryBig, ScrollText } from "lucide-react";

import { SearchBar } from "@/components/site";
import {
  ActionLink,
  Badge,
  Card,
  MetaStrip,
  SectionHeading,
  SubtleCard
} from "@/components/ui";
import {
  getAuthors,
  getCollections,
  getLibrarySummary,
  getSourceRegister,
  getThemeIndex,
  getTranslationOptions
} from "@/lib/demo/server-repository";
import { referenceToHref } from "@/lib/reference/normalize";

const featuredPaths = [
  {
    title: "Abrir leitor",
    description: "Entre direto na leitura canônica com troca de tradução e navegação por livro.",
    href: "/ler",
    icon: BookOpenText
  },
  {
    title: "Começar por João 3:16",
    description: "Abra um verso já ligado a comentário, exegese, notas e proveniência.",
    href: "/ler/naa/joao/3/16",
    icon: ScrollText
  },
  {
    title: "Explorar autores",
    description: "Percorra vozes históricas, eras, tradições e cobertura editorial.",
    href: "/autores",
    icon: LibraryBig
  }
];

function ReaderPreview() {
  return (
    <div className="product-window mx-auto max-w-[72rem]">
      <div className="surface-chrome overflow-hidden p-2.5">
        <div className="grid gap-2.5 xl:grid-cols-[8.5rem_minmax(0,1.48fr)_17.5rem] 2xl:grid-cols-[9rem_minmax(0,1.56fr)_18.5rem]">
          <div className="rounded-[20px] border border-[hsl(var(--border)/0.38)] bg-[hsl(var(--background-strong)/0.76)] p-3">
            <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--border)/0.4)] pb-3">
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--muted))]">
                  Cânon
                </p>
                <p className="mt-1 font-serif text-[1.2rem] tracking-[-0.04em] text-[hsl(var(--foreground))]">
                  Ler
                </p>
              </div>
              <Badge tone="status" size="sm">
                66 livros
              </Badge>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {["João", "Romanos", "Efésios", "Salmos"].map((book, index) => (
                <div
                  key={book}
                  className={
                    index === 0
                      ? "rounded-[16px] border border-[hsl(var(--accent)/0.18)] bg-[hsl(var(--accent-soft))] px-3 py-2.5 text-[hsl(var(--accent))]"
                      : "rounded-[16px] border border-transparent bg-[hsl(var(--surface)/0.54)] px-3 py-2.5 text-[hsl(var(--muted))]"
                  }
                >
                  {book}
                </div>
              ))}
            </div>
          </div>

          <div className="surface-reading p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="scope" size="sm">
                João 3:16
              </Badge>
              <Badge tone="status" size="sm">
                modo estudo
              </Badge>
              <Badge tone="source" size="sm">
                tradução via provider
              </Badge>
            </div>
            <div className="mt-4 rounded-[22px] border border-[hsl(var(--accent)/0.14)] bg-[linear-gradient(180deg,hsl(var(--surface)),hsl(var(--accent-soft)/0.55))] px-4 py-5 sm:px-5">
              <p className="verse-number">verso em foco</p>
              <p className="mt-2.5 font-serif text-[1.75rem] leading-[1.04] tracking-[-0.05em] text-[hsl(var(--foreground))] sm:text-[2.15rem]">
                O verso fica solto no centro. O estudo surge ao lado.
              </p>
              <p className="mt-3 max-w-[34rem] text-sm leading-6 text-[hsl(var(--muted))]">
                Comentário por escopo, exegese, línguas originais e bibliografia entram em camadas separadas, sem se
                misturar ao fluxo bíblico.
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="accent" size="sm">
                comentário direto
              </Badge>
              <Badge tone="scope" size="sm">
                perícope
              </Badge>
              <Badge tone="source" size="sm">
                proveniência explícita
              </Badge>
            </div>
          </div>

          <div className="surface-inspector p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--muted))]">
                  Inspector
                </p>
                <p className="mt-1 font-serif text-[1.35rem] tracking-[-0.04em] text-[hsl(var(--foreground))]">
                  Comentário
                </p>
              </div>
              <Badge tone="accent" size="sm">
                direto
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {["Coment.", "Exeg.", "Fontes"].map((item, index) => (
                <div
                  key={item}
                  className={
                    index === 0
                      ? "rounded-[14px] border border-[hsl(var(--foreground))] bg-[hsl(var(--foreground))] px-3 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--surface))]"
                      : "rounded-[14px] border border-[hsl(var(--border)/0.48)] bg-[hsl(var(--surface)/0.52)] px-3 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted))]"
                  }
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-[20px] border border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface)/0.58)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="status" size="sm">
                  Agostinho
                </Badge>
                <Badge tone="source" size="sm">
                  fonte primária
                </Badge>
              </div>
              <p className="mt-3 font-medium leading-6 text-[hsl(var(--foreground))]">
                O card deixa explícitos autor, escopo, natureza do conteúdo e proveniência.
              </p>
              <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted))]">
                A síntese editorial vem separada do trecho primário, com links para obra, fonte e limites de uso.
              </p>
              <MetaStrip
                items={["obra vinculada", "século IV", "licença registrada"]}
                className="mt-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const summary = getLibrarySummary();
  const translations = getTranslationOptions();
  const authors = getAuthors().filter((author) => author.featured).slice(0, 3);
  const themes = getThemeIndex().slice(0, 3);
  const collections = getCollections().slice(0, 2);
  const sources = getSourceRegister().slice(0, 3);

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.22fr)_20rem] 2xl:grid-cols-[minmax(0,1.26fr)_21rem]">
        <div className="space-y-6">
          <Card variant="elevated" className="grain-overlay overflow-hidden p-0">
            <div className="space-y-6 p-7 sm:p-9">
              <SectionHeading
                size="hero"
                eyebrow="Biblioteca teológica digital"
                title="Leia com foco. Estude com contexto. Entre pelo leitor."
                description="Bíblia em português com comentário por escopo, exegese editorial separada, notas linguísticas e proveniência visível em cada camada."
              />

              <div className="max-w-3xl">
                <SearchBar variant="hero" hint="Use referências, autores, obras, doutrinas e termos originais." />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ActionLink href="/ler" variant="primary" className="px-5 py-3">
                  Abrir leitor
                  <ArrowRight className="h-4 w-4" />
                </ActionLink>
                <ActionLink href="/ler/naa/joao/3/16" variant="secondary" className="px-5 py-3">
                  Começar por João 3:16
                </ActionLink>
                <ActionLink href="/autores" variant="ghost" className="px-4 py-3">
                  Explorar autores
                </ActionLink>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  "Comentário por escopo em camadas separadas.",
                  "Proveniência e bibliografia explícitas.",
                  "Traduções ativadas por provider licenciado."
                ].map((item) => (
                  <SubtleCard key={item} className="p-4">
                    <p className="text-sm leading-7 text-[hsl(var(--foreground))]">{item}</p>
                  </SubtleCard>
                ))}
              </div>

              <ReaderPreview />
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card variant="inset" className="space-y-4">
              <SectionHeading
                size="compact"
                eyebrow="Autores"
                title="Vozes históricas"
                description="Entre por tradição, século e cobertura sem sair do contexto bíblico."
              />
              <div className="space-y-3">
                {authors.map((author) => (
                  <Link key={author.slug} href={`/autores/${author.slug}`}>
                    <SubtleCard className="p-4 hover:border-[hsl(var(--accent)/0.18)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-serif text-[1.35rem] tracking-[-0.03em] text-[hsl(var(--foreground))]">
                            {author.displayName}
                          </p>
                          <p className="mt-1 text-sm text-[hsl(var(--muted))]">
                            {author.centuryLabel} · {author.tradition?.name}
                          </p>
                        </div>
                        <Badge tone="accent" size="sm">
                          {author.coverageCount}
                        </Badge>
                      </div>
                    </SubtleCard>
                  </Link>
                ))}
              </div>
            </Card>

            <Card variant="inset" className="space-y-4">
              <SectionHeading
                size="compact"
                eyebrow="Temas"
                title="Percursos de estudo"
                description="Use temas e doutrinas para sair da leitura simples e entrar na pesquisa."
              />
              <div className="space-y-3">
                {themes.map((theme) => (
                  <Link key={theme.slug} href={`/temas/${theme.slug}`}>
                    <SubtleCard className="p-4 hover:border-[hsl(var(--accent)/0.18)]">
                      <p className="font-medium text-[hsl(var(--foreground))]">{theme.name}</p>
                      <p className="mt-2 text-sm leading-7 text-[hsl(var(--muted))]">{theme.description}</p>
                    </SubtleCard>
                  </Link>
                ))}
              </div>
            </Card>

            <Card variant="inset" className="space-y-4">
              <SectionHeading
                size="compact"
                eyebrow="Coleções"
                title="Portas editoriais"
                description="Agrupamentos guiados para estudos curtos, séries e percursos teológicos."
              />
              <div className="space-y-3">
                {collections.map((collection) => (
                  <Link key={collection.slug} href={`/colecoes/${collection.slug}`}>
                    <SubtleCard className="p-4 hover:border-[hsl(var(--accent)/0.18)]">
                      <p className="font-serif text-[1.35rem] tracking-[-0.03em] text-[hsl(var(--foreground))]">
                        {collection.title}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[hsl(var(--muted))]">{collection.description}</p>
                    </SubtleCard>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-5">
          <Card variant="inset" className="space-y-4">
            <SectionHeading
              size="compact"
              eyebrow="Comece aqui"
              title="Próximos passos claros"
              description="A home não pede muitas decisões. Ela encaminha para leitura, estudo ou descoberta."
            />
            <div className="space-y-3">
              {featuredPaths.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.title} href={item.href}>
                    <SubtleCard className="p-4 hover:border-[hsl(var(--accent)/0.18)]">
                      <div className="flex items-start gap-3">
                        <div className="rounded-[16px] bg-[hsl(var(--accent-soft))] p-2.5 text-[hsl(var(--accent))]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[hsl(var(--foreground))]">{item.title}</p>
                          <p className="mt-2 text-sm leading-7 text-[hsl(var(--muted))]">{item.description}</p>
                        </div>
                      </div>
                    </SubtleCard>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card variant="inset" className="space-y-4">
            <SectionHeading
              size="compact"
              eyebrow="Camadas de confiança"
              title="Transparência como padrão"
              description="Cada bloco deixa explícito o tipo de conteúdo, a fonte e o que ainda depende de ativação."
            />
            <div className="space-y-3">
              {[
                "Fonte primária, síntese editorial e notas da plataforma nunca compartilham o mesmo rótulo.",
                "Cobertura ausente aparece como ausência, não como preenchimento artificial.",
                "Licenciamento de NVI, NAA e BKJ permanece honesto no estado do provider."
              ].map((item) => (
                <SubtleCard key={item} className="p-4">
                  <p className="text-sm leading-7 text-[hsl(var(--foreground))]">{item}</p>
                </SubtleCard>
              ))}
            </div>
          </Card>

          <Card variant="inset" className="space-y-4">
            <SectionHeading
              size="compact"
              eyebrow="Catálogo inicial"
              title="Sinais do corpus"
              description="Prova editorial curta, sem cara de painel administrativo."
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <SubtleCard className="p-4">
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
                  Cobertura
                </p>
                <MetaStrip
                  items={[
                    `${summary.authors} autores`,
                    `${summary.works} obras`,
                    `${summary.commentaries} entradas`,
                    `${summary.sources} fontes`
                  ]}
                  className="mt-3"
                />
              </SubtleCard>
              <SubtleCard className="p-4">
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
                  Traduções
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {translations.map((translation) => (
                    <Badge
                      key={translation.code}
                      tone={translation.activationStatus === "active" ? "success" : "warning"}
                      size="sm"
                    >
                      {translation.code}
                    </Badge>
                  ))}
                </div>
              </SubtleCard>
              <SubtleCard className="p-4">
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
                  Fontes rastreadas
                </p>
                <div className="mt-3 space-y-2">
                  {sources.map((source) => (
                    <div key={source.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-[hsl(var(--foreground))]">{source.name}</span>
                      <Badge tone="source" size="sm">
                        {source.primarySecondary}
                      </Badge>
                    </div>
                  ))}
                </div>
              </SubtleCard>
            </div>
          </Card>

          <Card variant="inset" className="space-y-4">
            <SectionHeading
              size="compact"
              eyebrow="Entradas rápidas"
              title="Passagens de entrada"
              description="Atalhos curtos para cair em versos já interessantes para leitura e estudo."
            />
            <div className="grid gap-3">
              {summary.featuredReferences.slice(0, 4).map((reference) => (
                <a
                  key={reference}
                  href={referenceToHref(reference)}
                  className="flex items-center justify-between rounded-[18px] border border-[hsl(var(--border)/0.48)] bg-[hsl(var(--surface)/0.72)] px-4 py-4 transition hover:border-[hsl(var(--accent)/0.18)]"
                >
                  <span className="font-serif text-[1.25rem] tracking-[-0.03em] text-[hsl(var(--foreground))]">
                    {reference}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--muted))]" />
                </a>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
