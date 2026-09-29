import { hasAdminDatabase, publishDraft } from "@/lib/supabase";

export async function POST() {
  if (!hasAdminDatabase()) return Response.json({ error: "Chưa cấu hình quyền ghi Supabase." }, { status: 503 });
  try {
    await publishDraft();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Không thể xuất bản." }, { status: 502 });
  }
}
