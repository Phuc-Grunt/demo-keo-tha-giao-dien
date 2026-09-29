import { getCategories, hasPublicDatabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasPublicDatabase()) return Response.json({ error: "Chưa cấu hình Supabase." }, { status: 503 });
  try { return Response.json({ categories: await getCategories() }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Không thể đọc chuyên mục." }, { status: 502 }); }
}
