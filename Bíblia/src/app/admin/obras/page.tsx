import { AdminTable } from "@/components/admin";
import { getWorks } from "@/lib/demo/repository";

export default function AdminWorksPage() {
  const works = getWorks().map((work) => ({
    id: work.id,
    titulo: work.title,
    autor: work.author?.displayName ?? "",
    entradas: work.commentaryCount
  }));

  return (
    <AdminTable
      title="Obras"
      description="Cadastro de obras, edição usada e cobertura por trecho."
      rows={works}
      columns={[
        { key: "titulo", label: "Título" },
        { key: "autor", label: "Autor" },
        { key: "entradas", label: "Entradas" }
      ]}
    />
  );
}
