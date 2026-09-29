import { contentKinds, getContentEntries, hasPublicDatabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasPublicDatabase()) return Response.json({ error: "Chưa cấu hình Supabase." }, { status: 503 });
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind");
  if (!kind || !contentKinds.includes(kind as (typeof contentKinds)[number])) {
    return Response.json({ error: "Loại nội dung không hợp lệ." }, { status: 400 });
  }
  const limit = Math.min(12, Math.max(1, Number(params.get("limit")) || 4));
  try { return Response.json({ entries: await getContentEntries(kind as (typeof contentKinds)[number], limit) }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Không thể đọc nội dung." }, { status: 502 }); }
}
