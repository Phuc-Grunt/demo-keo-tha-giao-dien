import { isAdminRequest } from "@/lib/admin-auth";
import { hasAdminDatabase, publishDraft } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Mã quản trị không hợp lệ." }, { status: 401 });
  if (!hasAdminDatabase()) return Response.json({ error: "Chưa cấu hình quyền ghi Supabase." }, { status: 503 });
  try {
    await publishDraft();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Không thể xuất bản." }, { status: 502 });
  }
}
