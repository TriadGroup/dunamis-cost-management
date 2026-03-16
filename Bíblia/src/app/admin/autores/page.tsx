import { AdminTable } from "@/components/admin";
import { getAuthors } from "@/lib/demo/repository";

export default function AdminAuthorsPage() {
  const authors = getAuthors().map((author) => ({
    id: author.id,
    nome: author.displayName,
    tradicao: author.tradition?.name ?? "",
    cobertura: author.coverageCount
  }));

  return (
    <AdminTable
      title="Autores"
      description="Cadastro editorial de autores, tradição, aliases e cobertura."
      rows={authors}
      columns={[
        { key: "nome", label: "Nome" },
        { key: "tradicao", label: "Tradição" },
        { key: "cobertura", label: "Entradas" }
      ]}
    />
  );
}
