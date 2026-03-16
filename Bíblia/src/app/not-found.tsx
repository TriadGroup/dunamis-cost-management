import Link from "next/link";

import { Card, SectionHeading } from "@/components/ui";

export default function NotFound() {
  return (
    <Card className="space-y-5">
      <SectionHeading
        eyebrow="404"
        title="Rota não encontrada"
        description="O catálogo não conseguiu resolver esta referência ou slug."
      />
      <Link href="/" className="rounded-full border border-stone-300 px-4 py-2 text-sm dark:border-stone-700">
        Voltar para a home
      </Link>
    </Card>
  );
}
