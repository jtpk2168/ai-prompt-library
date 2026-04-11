import { createAdminClient } from "@/lib/supabase/admin";
import { AdminFeedbackList } from "@/components/admin-feedback-list";

export default async function AdminFeedbackPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  return <AdminFeedbackList feedback={data ?? []} />;
}
