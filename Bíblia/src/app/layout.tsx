import type { ReactNode } from "react";
import type { Metadata } from "next";

import "@/app/globals.css";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppShell } from "@/components/site";

export const metadata: Metadata = {
  title: "Bíblia Comentada",
  description:
    "Plataforma bíblica em português com comentário histórico, exegese editorial, proveniência e arquitetura pronta para traduções licenciadas.",
  openGraph: {
    title: "Bíblia Comentada",
    description:
      "Leitor bíblico, comentário por escopo, autores históricos, busca e painel editorial com transparência de fontes.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
