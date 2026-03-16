"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpenText,
  ChevronRight,
  Copy,
  ExternalLink,
  Highlighter,
  Library,
  Menu,
  NotebookPen,
  PanelRightOpen,
  Quote,
  Share2,
  X
} from "lucide-react";

import { booksByTestament } from "@/lib/demo/canon";
import { type TranslationRecord } from "@/lib/demo/types";
import { referenceToHref } from "@/lib/reference/normalize";
import { useReaderStore } from "@/lib/stores/use-reader-store";
import { cn } from "@/lib/utils";
import { Badge, Card, MetaStrip, SectionHeading, SubtleCard } from "@/components/ui";

type CommentaryPanelEntry = {
  id: string;
  scopeLabel: string;
  directness: string;
  contentKind: string;
  editorialSummary: string;
  excerptDisplay?: string;
  author?: { displayName: string; slug: string; centuryLabel: string; traditionSlug: string };
  work?: { title: string; slug: string };
  sourceItem?: { title: string; url: string };
  provenanceNotes: string;
  scopeType: string;
};

type CommentaryGroups = {
  verse: CommentaryPanelEntry[];
  pericope: CommentaryPanelEntry[];
  chapter: CommentaryPanelEntry[];
  book: CommentaryPanelEntry[];
};

const allBooks = [...booksByTestament.old, ...booksByTestament.new];

type InspectorTab =
  | "commentary"
  | "context"
  | "exegesis"
  | "hermeneutics"
  | "language"
  | "cross"
  | "sources";

function buildReaderHref(translationCode: string, bookSlug: string, chapter: number, verse?: number) {
  return `/ler/${translationCode}/${bookSlug}/${chapter}${verse ? `/${verse}` : ""}`;
}

function ReaderMemoryTracker({ reference }: { reference: string }) {
  const rememberReference = useReaderStore((state) => state.rememberReference);

  useEffect(() => {
    rememberReference(reference);
  }, [reference, rememberReference]);

  return null;
}

function NavigatorSheet({
  currentBookSlug,
  currentChapter,
  currentVerse,
  translationCode,
  options
}: {
  currentBookSlug: string;
  currentChapter: number;
  currentVerse?: number;
  translationCode: string;
  options: TranslationRecord[];
}) {
  const [open, setOpen] = useState(false);
  const currentBook = allBooks.find((book) => book.slug === currentBookSlug) ?? allBooks[0];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--surface)/0.82)] px-4 text-sm font-medium text-[hsl(var(--foreground))] shadow-[0_14px_34px_rgba(8,10,18,0.08)] hover:border-[hsl(var(--accent)/0.18)]"
        >
          <Menu className="h-4 w-4" />
          Navegar
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(7,10,18,0.62)] backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-4 top-4 z-50 max-h-[calc(100vh-2rem)] overflow-hidden rounded-[30px] border border-[hsl(var(--border)/0.5)] bg-[linear-gradient(180deg,hsl(var(--background-strong)/0.98),hsl(var(--surface)/0.98))] shadow-[0_28px_120px_rgba(5,8,14,0.45)] md:inset-y-4 md:left-6 md:right-auto md:w-[32rem]">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border)/0.44)] px-5 py-4">
            <div>
              <Dialog.Title className="font-serif text-[1.6rem] tracking-[-0.04em] text-[hsl(var(--foreground))]">
                Navegação bíblica
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[hsl(var(--muted))]">
                Livro, capítulo e tradução sob demanda, sem ocupar a tela inteira o tempo todo.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--border)/0.48)] bg-[hsl(var(--surface-alt)/0.76)] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                aria-label="Fechar navegação"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-5 py-5">
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--muted))]">
                  Traduções
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => (
                    <Link
                      key={option.code}
                      href={buildReaderHref(option.code, currentBook.slug, currentChapter, currentVerse)}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "rounded-full border px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em]",
                        option.code === translationCode
                          ? "border-transparent bg-[hsl(var(--foreground))] text-[hsl(var(--surface))]"
                          : "border-[hsl(var(--border)/0.48)] bg-[hsl(var(--surface-alt)/0.72)] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                      )}
                      title={option.name}
                    >
                      {option.code}
                    </Link>
                  ))}
                </div>
              </div>

              {(["old", "new"] as const).map((testamentKey) => (
                <div key={testamentKey} className="space-y-3">
                  <p className="text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--muted))]">
                    {testamentKey === "old" ? "Antigo Testamento" : "Novo Testamento"}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {booksByTestament[testamentKey].map((book) => (
                      <Link
                        key={book.slug}
                        href={buildReaderHref(translationCode, book.slug, 1)}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "rounded-[18px] border px-3 py-3 transition",
                          currentBook.slug === book.slug
                            ? "border-[hsl(var(--accent)/0.2)] bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent))]"
                            : "border-[hsl(var(--border)/0.48)] bg-[hsl(var(--surface)/0.7)] hover:border-[hsl(var(--accent)/0.16)]"
                        )}
                      >
                        <span className="block text-sm font-semibold tracking-[-0.01em]">{book.name}</span>
                        <span className="mt-1 block text-xs text-[hsl(var(--muted))]">{book.chapterCount} caps</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-3 border-t border-[hsl(var(--border)/0.44)] pt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-serif text-[1.4rem] tracking-[-0.03em] text-[hsl(var(--foreground))]">
                    {currentBook.name}
                  </p>
                  <Badge tone="status" size="sm">
                    {currentBook.chapterCount} caps
                  </Badge>
                </div>
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                  {Array.from({ length: currentBook.chapterCount }, (_, index) => {
                    const chapter = index + 1;
                    return (
                      <Link
                        key={chapter}
                        href={buildReaderHref(translationCode, currentBook.slug, chapter)}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex h-10 items-center justify-center rounded-[14px] border text-sm font-medium transition",
                          chapter === currentChapter
                            ? "border-transparent bg-[hsl(var(--foreground))] text-[hsl(var(--surface))]"
                            : "border-[hsl(var(--border)/0.48)] bg-[hsl(var(--surface)/0.72)] hover:border-[hsl(var(--accent)/0.16)]"
                        )}
                      >
                        {chapter}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function SidebarBookNavigator({
  currentBookSlug,
  currentChapter,
  translationCode = "naa"
}: {
  currentBookSlug?: string;
  currentChapter?: number;
  translationCode?: string;
}) {
  const currentBook = allBooks.find((book) => book.slug === currentBookSlug);

  return (
    <Card variant="inset" className="space-y-6">
      <SectionHeading
        size="compact"
        eyebrow="Navegação bíblica"
        title="Escolha o livro e siga em leitura contínua."
        description="O acesso ao cânon fica disponível aqui como ponto de entrada, mas sai da frente quando a leitura começa."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {(["old", "new"] as const).map((testamentKey) => (
          <div key={testamentKey} className="space-y-3">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--muted))]">
              {testamentKey === "old" ? "Antigo Testamento" : "Novo Testamento"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {booksByTestament[testamentKey].map((book) => (
                <Link
                  key={book.slug}
                  href={buildReaderHref(translationCode, book.slug, 1)}
                  className={cn(
                    "rounded-[18px] border px-3 py-3 transition",
                    currentBookSlug === book.slug
                      ? "border-[hsl(var(--accent)/0.2)] bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent))]"
                      : "border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface)/0.72)] hover:border-[hsl(var(--accent)/0.16)]"
                  )}
                >
                  <span className="block font-medium tracking-[-0.01em]">{book.name}</span>
                  <span className="mt-1 block text-xs text-[hsl(var(--muted))]">{book.chapterCount} capítulos</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {currentBook ? (
        <div className="space-y-3 border-t border-[hsl(var(--border)/0.46)] pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-serif text-[1.45rem] tracking-[-0.03em] text-[hsl(var(--foreground))]">{currentBook.name}</p>
            <Badge tone="status" size="sm">
              {currentBook.chapterCount} capítulos
            </Badge>
          </div>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {Array.from({ length: currentBook.chapterCount }, (_, index) => {
              const chapter = index + 1;
              return (
                <Link
                  key={chapter}
                  href={buildReaderHref(translationCode, currentBook.slug, chapter)}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-[14px] border text-sm font-medium transition",
                    currentChapter === chapter
                      ? "border-transparent bg-[hsl(var(--foreground))] text-[hsl(var(--surface))]"
                      : "border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface-alt)/0.72)] hover:border-[hsl(var(--accent)/0.16)]"
                  )}
                >
                  {chapter}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export function ChapterNavigator({
  translationCode,
  bookSlug,
  chapter,
  chapterCount
}: {
  translationCode: string;
  bookSlug: string;
  chapter: number;
  chapterCount: number;
}) {
  const previousHref = buildReaderHref(translationCode, bookSlug, Math.max(1, chapter - 1));
  const nextHref = buildReaderHref(translationCode, bookSlug, Math.min(chapterCount, chapter + 1));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={previousHref}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition",
          chapter === 1
            ? "pointer-events-none border-[hsl(var(--border)/0.42)] bg-[hsl(var(--surface-alt)/0.46)] text-[hsl(var(--muted))] opacity-70"
            : "border-[hsl(var(--border)/0.55)] bg-[hsl(var(--surface)/0.8)] text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent)/0.16)]"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Capítulo anterior
      </Link>
      <Badge tone="status">{`capítulo ${chapter} / ${chapterCount}`}</Badge>
      <Link
        href={nextHref}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition",
          chapter === chapterCount
            ? "pointer-events-none border-[hsl(var(--border)/0.42)] bg-[hsl(var(--surface-alt)/0.46)] text-[hsl(var(--muted))] opacity-70"
            : "border-[hsl(var(--border)/0.55)] bg-[hsl(var(--surface)/0.8)] text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent)/0.16)]"
        )}
      >
        Próximo capítulo
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function TranslationSwitcher({
  currentCode,
  options,
  bookSlug,
  chapter,
  verse
}: {
  currentCode: string;
  options: TranslationRecord[];
  bookSlug: string;
  chapter: number;
  verse?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Link
          key={option.code}
          href={buildReaderHref(option.code, bookSlug, chapter, verse)}
          title={option.name}
          className={cn(
            "rounded-full border px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] transition",
            option.code === currentCode
              ? "border-transparent bg-[hsl(var(--foreground))] text-[hsl(var(--surface))]"
              : "border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface-alt)/0.72)] text-[hsl(var(--muted))] hover:border-[hsl(var(--accent)/0.16)] hover:text-[hsl(var(--foreground))]"
          )}
        >
          {option.code}
        </Link>
      ))}
    </div>
  );
}

function ReadingModeSwitch({
  mode,
  chapterHref,
  verseHref
}: {
  mode: "read" | "study";
  chapterHref: string;
  verseHref?: string;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface-alt)/0.74)] p-1">
      <Link
        href={chapterHref}
        className={cn(
          "rounded-full px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition",
          mode === "read" ? "bg-[hsl(var(--foreground))] text-[hsl(var(--surface))]" : "text-[hsl(var(--muted))]"
        )}
      >
        Leitura
      </Link>
      {verseHref ? (
        <Link
          href={verseHref}
          className={cn(
            "rounded-full px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition",
            mode === "study" ? "bg-[hsl(var(--foreground))] text-[hsl(var(--surface))]" : "text-[hsl(var(--muted))]"
          )}
        >
          Estudo
        </Link>
      ) : (
        <span className="rounded-full px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted))] opacity-55">
          Estudo
        </span>
      )}
    </div>
  );
}

export function ReadingToolbar({
  currentCode,
  options,
  bookSlug,
  bookName,
  chapter,
  chapterCount,
  verse,
  reference,
  mode
}: {
  currentCode: string;
  options: TranslationRecord[];
  bookSlug: string;
  bookName: string;
  chapter: number;
  chapterCount: number;
  verse?: number;
  reference: string;
  mode: "read" | "study";
}) {
  const chapterHref = buildReaderHref(currentCode, bookSlug, chapter);
  const verseHref = verse ? buildReaderHref(currentCode, bookSlug, chapter, verse) : undefined;

  return (
    <div className="space-y-4">
      <ReaderMemoryTracker reference={reference} />
      <div className="reader-toolbar-shell rounded-[26px] border border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface)/0.86)] px-4 py-4 shadow-[0_18px_50px_rgba(8,10,18,0.08)] backdrop-blur-xl sm:px-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <ReadingModeSwitch mode={mode} chapterHref={chapterHref} verseHref={verseHref} />
              <div className="space-y-2">
                <p className="font-serif text-[2rem] tracking-[-0.05em] text-[hsl(var(--foreground))] sm:text-[2.45rem]">
                  {reference}
                </p>
                <MetaStrip
                  items={[
                    mode === "study" ? "estudo contextual aberto" : "leitura limpa por padrao",
                    `${bookName} • ${chapter} de ${chapterCount}`,
                    "troca de traducao sob demanda"
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <NavigatorSheet
                currentBookSlug={bookSlug}
                currentChapter={chapter}
                currentVerse={verse}
                translationCode={currentCode}
                options={options}
              />
              {verse ? (
                <Link
                  href={`/comparar/${bookSlug}/${chapter}/${verse}`}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--surface)/0.82)] px-4 text-sm font-medium text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent)/0.18)]"
                >
                  <BookOpenText className="h-4 w-4" />
                  Comparar
                </Link>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <TranslationSwitcher currentCode={currentCode} options={options} bookSlug={bookSlug} chapter={chapter} verse={verse} />
            <ChapterNavigator
              translationCode={currentCode}
              bookSlug={bookSlug}
              chapter={chapter}
              chapterCount={chapterCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function VerseBlock({
  href,
  verseNumber,
  commentaryCount,
  noteCount,
  active,
  displayText = "Este verso esta pronto para leitura e vinculacao editorial.",
  statusLabel,
  variant = "chapter"
}: {
  href: string;
  verseNumber: number;
  commentaryCount: number;
  noteCount: number;
  active?: boolean;
  displayText?: string;
  statusLabel?: string;
  variant?: "chapter" | "focus";
}) {
  const hasSignals = commentaryCount > 0 || noteCount > 0;

  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-[22px] border px-3.5 py-3.5 transition sm:px-4 sm:py-3.5",
        active || variant === "focus"
          ? "border-[hsl(var(--accent)/0.18)] bg-[linear-gradient(180deg,hsl(var(--surface)),hsl(var(--accent-soft)/0.58))] shadow-[0_18px_48px_rgba(16,14,18,0.08)]"
          : "border-transparent bg-transparent hover:border-[hsl(var(--border)/0.5)] hover:bg-[hsl(var(--surface)/0.78)]"
      )}
    >
      <div className="space-y-2.5">
        <p
          className={cn(
            "reader-prose",
            variant === "focus"
              ? "text-[1.08rem] leading-[1.76] sm:text-[1.16rem]"
              : "text-[0.98rem] leading-[1.78] sm:text-[1.02rem]"
          )}
        >
          <span className="verse-number-inline">{verseNumber}</span>
          <span>{displayText}</span>
        </p>

        {(statusLabel || hasSignals) ? (
          <div className="flex flex-wrap items-center gap-2.5 pl-5 sm:pl-6">
            {statusLabel ? <p className="text-[0.72rem] leading-5 text-[hsl(var(--muted))]">{statusLabel}</p> : null}
            {commentaryCount > 0 ? (
              <Badge
                tone="scope"
                size="sm"
                className={cn(active || variant === "focus" ? "opacity-100" : "opacity-80 group-hover:opacity-100")}
              >
                {commentaryCount} coment.
              </Badge>
            ) : null}
            {noteCount > 0 ? (
              <Badge
                tone="source"
                size="sm"
                className={cn(active || variant === "focus" ? "opacity-100" : "opacity-80 group-hover:opacity-100")}
              >
                {noteCount} notas
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  active,
  helper
}: {
  icon: typeof Copy;
  label: string;
  onClick?: () => void;
  active?: boolean;
  helper?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
        active
          ? "border-[hsl(var(--accent)/0.2)] bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent))]"
          : "border-[hsl(var(--border)/0.48)] bg-[hsl(var(--surface)/0.74)] text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent)/0.16)]"
      )}
      title={helper}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function VerseQuickActions({
  reference,
  translationCode,
  verseText,
  compareHref
}: {
  reference: string;
  translationCode: string;
  verseText?: string;
  compareHref: string;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function copyVerse() {
    const payload = verseText ? `${reference} — ${verseText}` : reference;
    await navigator.clipboard.writeText(payload);
    setFeedback("Copiado");
    window.setTimeout(() => setFeedback(null), 1200);
  }

  async function shareVerse() {
    const url = `${window.location.origin}${window.location.pathname}`;
    const text = verseText ? `${reference} — ${verseText}` : reference;

    if (navigator.share) {
      await navigator.share({ title: reference, text, url });
      setFeedback("Compartilhado");
    } else {
      await navigator.clipboard.writeText(url);
      setFeedback("Link copiado");
    }

    window.setTimeout(() => setFeedback(null), 1200);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <QuickActionButton icon={Copy} label={feedback === "Copiado" ? "Copiado" : "Copiar"} onClick={copyVerse} />
        <QuickActionButton icon={Share2} label={feedback === "Compartilhado" || feedback === "Link copiado" ? feedback : "Compartilhar"} onClick={shareVerse} />
        <BookmarkButton reference={reference} translation={translationCode} />
        <Link
          href={compareHref}
          className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border)/0.48)] bg-[hsl(var(--surface)/0.74)] px-3 py-2 text-sm text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent)/0.16)]"
        >
          <Library className="h-4 w-4" />
          Comparar traducoes
        </Link>
      </div>
      <p className="text-xs leading-6 text-[hsl(var(--muted))]">
        Primeiro clique: acoes rapidas. Depois, comentario, exegese, notas e fontes em camadas separadas.
      </p>
    </div>
  );
}

export function CommentaryCard({
  title,
  subtitle,
  summary,
  provenance,
  meta,
  excerpt,
  hrefAuthor,
  hrefWork
}: {
  title: string;
  subtitle: string;
  summary: string;
  provenance: string;
  meta: string[];
  excerpt?: string;
  hrefAuthor: string;
  hrefWork: string;
}) {
  return (
    <SubtleCard className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-[1.45rem] tracking-[-0.03em] text-[hsl(var(--foreground))]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted))]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {meta.map((item) => (
            <Badge key={item} tone={item === "primario" ? "source" : "scope"} size="sm">
              {item}
            </Badge>
          ))}
        </div>
      </div>

      {excerpt ? (
        <blockquote className="rounded-[20px] border border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface)/0.84)] px-4 py-4 text-sm italic leading-7 text-[hsl(var(--foreground))]">
          <div className="mb-2 flex items-center gap-2 text-[hsl(var(--muted))]">
            <Quote className="h-4 w-4" />
            Trecho primario
          </div>
          {excerpt}
        </blockquote>
      ) : null}

      <p className="text-sm leading-7 text-[hsl(var(--foreground))]">{summary}</p>

      <div className="rounded-[18px] border border-[hsl(var(--border)/0.42)] bg-[hsl(var(--surface)/0.68)] px-4 py-3">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">Proveniencia</p>
        <p className="mt-2 text-sm leading-7 text-[hsl(var(--muted))]">{provenance}</p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-[hsl(var(--accent))]">
        <Link href={hrefAuthor} className="inline-flex items-center gap-1 hover:underline">
          Ver autor
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
        <Link href={hrefWork} className="inline-flex items-center gap-1 hover:underline">
          Ver obra
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </SubtleCard>
  );
}

export function VerseCommentaryPanel({ groups }: { groups: CommentaryGroups }) {
  const sections = [
    { key: "verse", label: "Direto no verso", helper: "endereca o versiculo de forma explicita", entries: groups.verse },
    { key: "pericope", label: "Pericope", helper: "passagens mais amplas que incluem o verso", entries: groups.pericope },
    { key: "chapter", label: "Capitulo", helper: "tratamento expositivo do capitulo inteiro", entries: groups.chapter },
    { key: "book", label: "Livro", helper: "introducoes e leituras panoramicas", entries: groups.book }
  ] as const;

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.key} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
                {section.helper}
              </p>
              <h3 className="mt-1 font-serif text-[1.65rem] tracking-[-0.04em] text-[hsl(var(--foreground))]">
                {section.label}
              </h3>
            </div>
            <Badge tone={section.entries.length > 0 ? "accent" : "muted"} size="sm">
              {section.entries.length} itens
            </Badge>
          </div>

          {section.entries.length === 0 ? (
            <SubtleCard className="p-4">
              <p className="text-sm leading-7 text-[hsl(var(--muted))]">
                Nenhum item neste escopo. A ausência continua visível, sem preencher lacunas com conteúdo inventado.
              </p>
            </SubtleCard>
          ) : (
            <div className="space-y-4">
              {section.entries.map((entry) => (
                <CommentaryCard
                  key={entry.id}
                  title={entry.author?.displayName ?? "Autor nao identificado"}
                  subtitle={`${entry.work?.title ?? "Obra"} · ${entry.scopeLabel}`}
                  summary={entry.editorialSummary}
                  provenance={entry.provenanceNotes}
                  excerpt={entry.excerptDisplay}
                  meta={[
                    entry.author?.centuryLabel ?? "data nao informada",
                    entry.directness === "direct" ? "direto" : "indireto",
                    entry.scopeType,
                    entry.contentKind === "primary_quote" || entry.contentKind === "translated_quote" ? "primario" : "editorial"
                  ]}
                  hrefAuthor={`/autores/${entry.author?.slug ?? ""}`}
                  hrefWork={`/obras/${entry.work?.slug ?? ""}`}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ExegesisPanel({
  title,
  items
}: {
  title: string;
  items: Array<{ id: string; title: string; summary: string }>;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <SubtleCard>
          <p className="text-sm leading-7 text-[hsl(var(--muted))]">Sem nota editorial publicada para este trecho.</p>
        </SubtleCard>
      ) : (
        items.map((item) => (
          <SubtleCard key={item.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge tone="accent">{title}</Badge>
            </div>
            <p className="font-serif text-[1.35rem] tracking-[-0.03em] text-[hsl(var(--foreground))]">{item.title}</p>
            <p className="text-sm leading-7 text-[hsl(var(--muted))]">{item.summary}</p>
          </SubtleCard>
        ))
      )}
    </div>
  );
}

export function OriginalLanguagePanel({
  items
}: {
  items: Array<{
    id: string;
    language: string;
    lemma: string;
    transliteration: string;
    morphology: string;
    semanticDomain: string;
    note: string;
  }>;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <SubtleCard>
          <p className="text-sm leading-7 text-[hsl(var(--muted))]">Nenhuma nota linguistica cadastrada para este verso.</p>
        </SubtleCard>
      ) : (
        items.map((item) => (
          <SubtleCard key={item.id} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">{item.language}</Badge>
              <Badge tone="muted">{item.lemma}</Badge>
              <Badge tone="muted">{item.transliteration}</Badge>
            </div>
            <p className="text-sm leading-7 text-[hsl(var(--foreground))]">{item.note}</p>
            <p className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
              {item.morphology} · {item.semanticDomain}
            </p>
          </SubtleCard>
        ))
      )}
    </div>
  );
}

export function CrossReferenceList({
  items
}: {
  items: Array<{ id: string; toRef: string; relationType: string; rationale: string; relevanceScore: number }>;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <SubtleCard>
          <p className="text-sm leading-7 text-[hsl(var(--muted))]">Nenhuma referencia cruzada catalogada para este verso.</p>
        </SubtleCard>
      ) : (
        items.map((item) => (
          <Link
            key={item.id}
            href={referenceToHref(item.toRef)}
            className="block rounded-[22px] border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--surface-alt)/0.68)] p-4 transition hover:border-[hsl(var(--accent)/0.16)]"
          >
            <div className="flex flex-wrap gap-2">
              <Badge tone="muted">{item.relationType}</Badge>
              <Badge tone="success">{Math.round(item.relevanceScore * 100)}% relevancia</Badge>
            </div>
            <p className="mt-3 font-serif text-[1.3rem] tracking-[-0.03em]">{item.toRef}</p>
            <p className="mt-2 text-sm leading-7 text-[hsl(var(--muted))]">{item.rationale}</p>
          </Link>
        ))
      )}
    </div>
  );
}

export function BibliographyBlock({
  items
}: {
  items: Array<{ id: string; title: string; editionNotes?: string; url: string; language: string }>;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <SubtleCard>
          <p className="text-sm leading-7 text-[hsl(var(--muted))]">Nenhuma fonte bibliografica publicada para este verso.</p>
        </SubtleCard>
      ) : (
        items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-[22px] border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--surface-alt)/0.68)] p-4 transition hover:border-[hsl(var(--accent)/0.16)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-[hsl(var(--foreground))]">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-[hsl(var(--muted))]">{item.editionNotes}</p>
              </div>
              <ExternalLink className="mt-1 h-4 w-4 text-[hsl(var(--muted))]" />
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[hsl(var(--muted))]">{item.language}</p>
          </a>
        ))
      )}
    </div>
  );
}

export function TranslationComparePanel({
  items
}: {
  items: Array<{
    code: string;
    name: string;
    headline: string;
    body: string;
    status: string;
    verseText?: string;
    sourceLabel?: string;
  }>;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.code} variant="inset" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-serif text-[1.65rem] tracking-[-0.04em]">{item.name}</p>
              <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">
                {item.code}
              </p>
            </div>
            <Badge tone={item.status === "active" ? "success" : "warning"} size="sm">
              {item.status}
            </Badge>
          </div>
          {item.verseText ? (
            <blockquote className="rounded-[18px] border border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface)/0.84)] px-4 py-4 font-serif text-[1.05rem] leading-8 text-[hsl(var(--foreground))]">
              {item.verseText}
            </blockquote>
          ) : null}
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{item.headline}</p>
          <p className="text-sm leading-7 text-[hsl(var(--muted))]">{item.body}</p>
          {item.sourceLabel ? <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted))]">{item.sourceLabel}</p> : null}
        </Card>
      ))}
    </div>
  );
}

export function CoverageMap({
  items
}: {
  items: Array<{ bookName: string; count: number; slug: string }>;
}) {
  return (
    <Card className="space-y-5">
      <SectionHeading title="Mapa de cobertura" description="Quanto deste corpus ja foi ligado a livros biblicos dentro do seed atual." />
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm leading-7 text-[hsl(var(--muted))]">Nenhum livro mapeado ainda para este autor.</p>
        ) : (
          items.map((item) => (
            <div key={item.slug} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{item.bookName}</span>
                <span className="text-[hsl(var(--muted))]">{item.count}</span>
              </div>
              <div className="h-3 rounded-full bg-[hsl(var(--surface-strong))]">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--accent-gold))]"
                  style={{ width: `${Math.min(100, item.count * 28)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function BookmarkButton({
  reference,
  translation
}: {
  reference: string;
  translation: string;
}) {
  const bookmarks = useReaderStore((state) => state.bookmarks);
  const addBookmark = useReaderStore((state) => state.addBookmark);
  const removeBookmark = useReaderStore((state) => state.removeBookmark);
  const active = bookmarks.some((item) => item.reference === reference);

  return (
    <button
      type="button"
      onClick={() =>
        active
          ? removeBookmark(reference)
          : addBookmark({
              reference,
              translation
            })
      }
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
        active
          ? "border-[hsl(var(--accent)/0.18)] bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent))]"
          : "border-[hsl(var(--border)/0.48)] bg-[hsl(var(--surface)/0.74)] text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent)/0.16)]"
      )}
    >
      <Highlighter className="h-4 w-4" />
      {active ? "Marcado" : "Marcar"}
    </button>
  );
}

export function NoteEditor({ reference }: { reference: string }) {
  const notes = useReaderStore((state) => state.notes);
  const saveNote = useReaderStore((state) => state.saveNote);
  const current = notes.find((item) => item.reference === reference)?.body ?? "";
  const [value, setValue] = useState(current);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(current);
  }, [current]);

  return (
    <div className="space-y-4 rounded-[22px] border border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface-alt)/0.66)] p-4">
      <div className="space-y-1">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted))]">Anotacao pessoal</p>
        <p className="text-sm leading-7 text-[hsl(var(--muted))]">
          Observacoes locais de leitura. Esta camada e pessoal e nao se mistura ao conteudo editorial publicado.
        </p>
      </div>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={5}
        className="w-full rounded-[18px] border border-[hsl(var(--border)/0.52)] bg-[hsl(var(--surface)/0.78)] p-4 text-sm leading-7 text-[hsl(var(--foreground))] outline-none transition focus:border-[hsl(var(--accent)/0.18)]"
        placeholder="Registre observacoes, perguntas e links de estudo."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--muted))]">Persistencia local no navegador</p>
        <button
          type="button"
          onClick={() => {
            saveNote({ reference, body: value });
            setSaved(true);
            window.setTimeout(() => setSaved(false), 1200);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border)/0.48)] bg-[hsl(var(--surface)/0.78)] px-4 py-2 text-sm transition hover:border-[hsl(var(--accent)/0.16)]"
        >
          <NotebookPen className="h-4 w-4" />
          {saved ? "Nota salva" : "Salvar nota"}
        </button>
      </div>
    </div>
  );
}

export function ThemeExplorer({
  items
}: {
  items: Array<{ slug: string; name: string; description: string; commentaryCount: number }>;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map((item) => (
        <Link key={item.slug} href={`/temas/${item.slug}`} className="block">
          <Card className="h-full space-y-4 transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <Badge tone="accent">{item.commentaryCount} entradas</Badge>
              <PanelRightOpen className="h-4 w-4 text-[hsl(var(--muted))]" />
            </div>
            <p className="font-serif text-[2rem] tracking-[-0.04em] text-[hsl(var(--foreground))]">{item.name}</p>
            <p className="text-sm leading-7 text-[hsl(var(--muted))]">{item.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function StudyInspectorBody({
  reference,
  translationCode,
  bookSlug,
  chapter,
  verse,
  verseText,
  outline,
  groupedCommentary,
  exegesis,
  hermeneutics,
  historicalNotes,
  languageNotes,
  crossReferences,
  bibliography,
  translationHeadline,
  translationBody,
  defaultTab = "context"
}: {
  reference: string;
  translationCode: string;
  bookSlug: string;
  chapter: number;
  verse: number;
  verseText?: string;
  outline: string[];
  groupedCommentary: CommentaryGroups;
  exegesis: Array<{ id: string; title: string; summary: string }>;
  hermeneutics: Array<{ id: string; title: string; summary: string }>;
  historicalNotes: Array<{ id: string; title: string; summary: string }>;
  languageNotes: Array<{
    id: string;
    language: string;
    lemma: string;
    transliteration: string;
    morphology: string;
    semanticDomain: string;
    note: string;
  }>;
  crossReferences: Array<{ id: string; toRef: string; relationType: string; rationale: string; relevanceScore: number }>;
  bibliography: Array<{ id: string; title: string; editionNotes?: string; url: string; language: string }>;
  translationHeadline: string;
  translationBody: string;
  defaultTab?: InspectorTab;
}) {
  const commentaryCount =
    groupedCommentary.verse.length +
    groupedCommentary.pericope.length +
    groupedCommentary.chapter.length +
    groupedCommentary.book.length;

  const tabMeta: Array<{ value: InspectorTab; label: string; count: number }> = [
    { value: "context", label: "Contexto", count: outline.length + historicalNotes.length },
    { value: "commentary", label: "Comentario", count: commentaryCount },
    { value: "exegesis", label: "Exegese", count: exegesis.length },
    { value: "hermeneutics", label: "Hermeneutica", count: hermeneutics.length },
    { value: "language", label: "Linguas", count: languageNotes.length },
    { value: "cross", label: "Cruzadas", count: crossReferences.length },
    { value: "sources", label: "Fontes", count: bibliography.length }
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-4 border-b border-[hsl(var(--border)/0.44)] pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="contrast" size="sm">
            Estudo
          </Badge>
          <Badge tone="status" size="sm">
            {commentaryCount} comentarios
          </Badge>
          <Badge tone="status" size="sm">
            {bibliography.length} fontes
          </Badge>
        </div>
        <div>
          <p className="font-serif text-[2rem] tracking-[-0.05em] text-[hsl(var(--foreground))]">{reference}</p>
          <p className="mt-2 text-sm leading-7 text-[hsl(var(--muted))]">
            O texto permanece visivel na coluna central; aqui entram apenas as camadas de estudo e acoes contextuais.
          </p>
        </div>
        {verseText ? (
          <blockquote className="rounded-[22px] border border-[hsl(var(--border)/0.44)] bg-[hsl(var(--surface)/0.82)] px-4 py-4 font-serif text-[1.06rem] leading-8 text-[hsl(var(--foreground))]">
            {verseText}
          </blockquote>
        ) : null}
        <VerseQuickActions
          reference={reference}
          translationCode={translationCode}
          verseText={verseText}
          compareHref={`/comparar/${bookSlug}/${chapter}/${verse}`}
        />
      </div>

      <Tabs.Root defaultValue={defaultTab} className="space-y-4">
        <Tabs.List className="flex gap-2 overflow-x-auto pb-1">
          {tabMeta.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="flex-none rounded-full border border-[hsl(var(--border)/0.46)] bg-[hsl(var(--surface-alt)/0.72)] px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted))] transition data-[state=active]:border-transparent data-[state=active]:bg-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--surface))]"
            >
              {tab.label}
              <span className="ml-2 opacity-70">{tab.count}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="context" className="space-y-4">
          <SubtleCard className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-serif text-[1.45rem] tracking-[-0.03em] text-[hsl(var(--foreground))]">Contexto imediato</p>
              <Badge tone="status" size="sm">
                {outline.length} blocos
              </Badge>
            </div>
            {outline.length === 0 ? (
              <p className="text-sm leading-7 text-[hsl(var(--muted))]">
                O verso ainda nao recebeu outline editorial publicado neste seed.
              </p>
            ) : (
              <div className="space-y-3">
                {outline.map((item) => (
                  <div
                    key={item}
                    className="rounded-[18px] border border-[hsl(var(--border)/0.42)] bg-[hsl(var(--surface)/0.82)] px-4 py-4 text-sm leading-7 text-[hsl(var(--foreground))]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </SubtleCard>

          <SubtleCard className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-serif text-[1.45rem] tracking-[-0.03em] text-[hsl(var(--foreground))]">Referencias chave</p>
              <Badge tone={crossReferences.length > 0 ? "success" : "muted"} size="sm">
                {crossReferences.length}
              </Badge>
            </div>
            <CrossReferenceList items={crossReferences.slice(0, 3)} />
          </SubtleCard>

          <NoteEditor reference={reference} />
        </Tabs.Content>

        <Tabs.Content value="commentary" className="space-y-4">
          <VerseCommentaryPanel groups={groupedCommentary} />
        </Tabs.Content>

        <Tabs.Content value="exegesis" className="space-y-4">
          <ExegesisPanel title="Exegese" items={exegesis} />
          <ExegesisPanel title="Historico" items={historicalNotes} />
        </Tabs.Content>

        <Tabs.Content value="hermeneutics" className="space-y-4">
          <ExegesisPanel title="Hermeneutica" items={hermeneutics} />
        </Tabs.Content>

        <Tabs.Content value="language" className="space-y-4">
          <OriginalLanguagePanel items={languageNotes} />
        </Tabs.Content>

        <Tabs.Content value="cross" className="space-y-4">
          <CrossReferenceList items={crossReferences} />
        </Tabs.Content>

        <Tabs.Content value="sources" className="space-y-4">
          <SubtleCard className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-serif text-[1.45rem] tracking-[-0.03em] text-[hsl(var(--foreground))]">Fonte da traducao</p>
              <Badge tone="warning" size="sm">
                proveniencia
              </Badge>
            </div>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{translationHeadline}</p>
            <p className="text-sm leading-7 text-[hsl(var(--muted))]">{translationBody}</p>
          </SubtleCard>
          <BibliographyBlock items={bibliography} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

export function StudyInspector({
  reference,
  translationCode,
  bookSlug,
  chapter,
  verse,
  verseText,
  outline,
  groupedCommentary,
  exegesis,
  hermeneutics,
  historicalNotes,
  languageNotes,
  crossReferences,
  bibliography,
  translationHeadline,
  translationBody,
  defaultTab = "context"
}: {
  reference: string;
  translationCode: string;
  bookSlug: string;
  chapter: number;
  verse: number;
  verseText?: string;
  outline: string[];
  groupedCommentary: CommentaryGroups;
  exegesis: Array<{ id: string; title: string; summary: string }>;
  hermeneutics: Array<{ id: string; title: string; summary: string }>;
  historicalNotes: Array<{ id: string; title: string; summary: string }>;
  languageNotes: Array<{
    id: string;
    language: string;
    lemma: string;
    transliteration: string;
    morphology: string;
    semanticDomain: string;
    note: string;
  }>;
  crossReferences: Array<{ id: string; toRef: string; relationType: string; rationale: string; relevanceScore: number }>;
  bibliography: Array<{ id: string; title: string; editionNotes?: string; url: string; language: string }>;
  translationHeadline: string;
  translationBody: string;
  defaultTab?: InspectorTab;
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div className="hidden xl:block">
        <div className="sticky top-24">
          <Card variant="default" className="max-h-[calc(100vh-7rem)] overflow-hidden p-0">
            <div className="max-h-[calc(100vh-7rem)] overflow-y-auto px-4 py-5">
              <StudyInspectorBody
                reference={reference}
                translationCode={translationCode}
                bookSlug={bookSlug}
                chapter={chapter}
                verse={verse}
                verseText={verseText}
                outline={outline}
                groupedCommentary={groupedCommentary}
                exegesis={exegesis}
                hermeneutics={hermeneutics}
                historicalNotes={historicalNotes}
                languageNotes={languageNotes}
                crossReferences={crossReferences}
                bibliography={bibliography}
                translationHeadline={translationHeadline}
                translationBody={translationBody}
                defaultTab={defaultTab}
              />
            </div>
          </Card>
        </div>
      </div>

      <div className="xl:hidden">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent)/0.2)] bg-[hsl(var(--accent-soft))] px-4 py-3 text-sm font-medium text-[hsl(var(--accent))] shadow-[0_20px_60px_rgba(8,10,18,0.28)]"
          >
            <PanelRightOpen className="h-4 w-4" />
            Abrir estudo
          </button>
        ) : null}

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(7,10,18,0.56)] backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-x-3 bottom-3 top-[18vh] z-50 overflow-hidden rounded-[30px] border border-[hsl(var(--border)/0.5)] bg-[linear-gradient(180deg,hsl(var(--background-strong)/0.98),hsl(var(--surface)/0.98))] shadow-[0_32px_120px_rgba(5,8,14,0.46)]">
              <div className="flex items-center justify-between border-b border-[hsl(var(--border)/0.44)] px-4 py-3">
                <div>
                  <Dialog.Title className="font-serif text-[1.35rem] tracking-[-0.04em] text-[hsl(var(--foreground))]">
                    Estudo do verso
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-[hsl(var(--muted))]">
                    Comentario, exegese, notas e fontes sem tirar o texto do centro.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--border)/0.48)] bg-[hsl(var(--surface-alt)/0.76)] text-[hsl(var(--muted))]"
                    aria-label="Fechar estudo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>
              <div className="max-h-[calc(82vh-4rem)] overflow-y-auto px-4 py-4">
                <StudyInspectorBody
                  reference={reference}
                  translationCode={translationCode}
                  bookSlug={bookSlug}
                  chapter={chapter}
                  verse={verse}
                  verseText={verseText}
                  outline={outline}
                  groupedCommentary={groupedCommentary}
                  exegesis={exegesis}
                  hermeneutics={hermeneutics}
                  historicalNotes={historicalNotes}
                  languageNotes={languageNotes}
                  crossReferences={crossReferences}
                  bibliography={bibliography}
                  translationHeadline={translationHeadline}
                  translationBody={translationBody}
                  defaultTab={defaultTab}
                />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}
