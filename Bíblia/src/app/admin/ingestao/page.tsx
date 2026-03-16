import { IngestionReviewQueue } from "@/components/admin";
import { getAdminDashboard } from "@/lib/demo/repository";

export default function AdminIngestionPage() {
  return <IngestionReviewQueue items={getAdminDashboard().ingestionQueue} />;
}
