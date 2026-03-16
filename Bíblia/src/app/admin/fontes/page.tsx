import { AdminTable } from "@/components/admin";
import { getSourceRegister } from "@/lib/demo/repository";

export default function AdminSourcesPage() {
  const rows = getSourceRegister().map((source) => ({
    id: source.id,
    fonte: source.name,
    tipo: source.sourceType,
    direitos: source.rightsStatus
  }));

  return (
    <AdminTable
      title="Fontes"
      description="Cadastro de proveniência, status legal e política de uso."
      rows={rows}
      columns={[
        { key: "fonte", label: "Fonte" },
        { key: "tipo", label: "Tipo" },
        { key: "direitos", label: "Direitos" }
      ]}
    />
  );
}
