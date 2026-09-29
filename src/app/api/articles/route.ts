import { getArticles, hasPublicDatabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasPublicDatabase()) return Response.json({ error: "Chưa cấu hình Supabase." }, { status: 503 });
  const params = new URL(request.url).searchParams;
  const mode = params.get("mode") === "hot" ? "hot" : "latest";
  const limit = Math.min(12, Math.max(1, Number(params.get("limit")) || 3));
  const categorySlug = params.get("category") || undefined;
  try { return Response.json({ articles: await getArticles({ categorySlug, mode, limit }) }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Không thể đọc tin tức." }, { status: 502 }); }
}
