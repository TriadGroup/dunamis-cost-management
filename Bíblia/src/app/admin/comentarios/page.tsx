import { AdminTable } from "@/components/admin";
import { getAdminDashboard } from "@/lib/demo/repository";

export default function AdminCommentaryPage() {
  const rows = getAdminDashboard().reviewQueue.map((item) => ({
    id: item.id,
    escopo: item.scopeLabel,
    autor: item.author,
    revisao: item.reviewState
  }));

  return (
    <AdminTable
      title="Comentários"
      description="Curadoria de escopo, confiança, revisão e publicação."
      rows={rows}
      columns={[
        { key: "escopo", label: "Escopo" },
        { key: "autor", label: "Autor" },
        { key: "revisao", label: "Revisão" }
      ]}
    />
  );
}
