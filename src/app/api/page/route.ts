import { documentSchema } from "@/builder/model";
import { isAdminRequest } from "@/lib/admin-auth";
import { getDraftPage, getPublishedPage, hasAdminDatabase, hasPublicDatabase, saveDraft } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const draft = new URL(request.url).searchParams.get("draft") === "1";
  if (draft && !isAdminRequest(request)) return Response.json({ error: "Mã quản trị không hợp lệ." }, { status: 401 });
  if (draft && !hasAdminDatabase()) return Response.json({ error: "Chưa cấu hình quyền ghi Supabase." }, { status: 503 });
  if (!draft && !hasPublicDatabase()) return Response.json({ error: "Chưa cấu hình Supabase." }, { status: 503 });
  try {
    const document = draft ? await getDraftPage() : await getPublishedPage();
    return document ? Response.json({ document }) : Response.json({ error: "Chưa có trang trong Supabase." }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Không thể đọc dữ liệu." }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Mã quản trị không hợp lệ." }, { status: 401 });
  if (!hasAdminDatabase()) return Response.json({ error: "Chưa cấu hình quyền ghi Supabase." }, { status: 503 });
  let input: unknown;
  try { input = await request.json(); } catch { return Response.json({ error: "JSON không hợp lệ." }, { status: 400 }); }
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: "Bố cục không hợp lệ.", details: parsed.error.flatten() }, { status: 400 });
  try {
    await saveDraft(parsed.data);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Không thể lưu bản nháp." }, { status: 502 });
  }
}
