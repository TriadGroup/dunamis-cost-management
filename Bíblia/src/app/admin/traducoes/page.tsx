import { AdminTable } from "@/components/admin";
import { getTranslationOptions } from "@/lib/demo/server-repository";

export default function AdminTranslationsPage() {
  const rows = getTranslationOptions().map((translation) => ({
    id: translation.code,
    codigo: translation.code.toUpperCase(),
    nome: translation.name,
    status: translation.activationStatus
  }));

  return (
    <AdminTable
      title="Traduções"
      description="Governança de licença, provider e status de ativação."
      rows={rows}
      columns={[
        { key: "codigo", label: "Código" },
        { key: "nome", label: "Nome" },
        { key: "status", label: "Status" }
      ]}
    />
  );
}
