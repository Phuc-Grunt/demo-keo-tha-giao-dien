import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { BuilderDocument, documentSchema } from "@/builder/domain/model";
import { z } from "zod";

export type Category = { id: string; slug: string; name: string };
export type PageTemplateSummary = {
  id: string;
  name: string;
  block_count: number;
  created_at: string;
  updated_at: string;
};
const pageTemplateSummarySchema: z.ZodType<PageTemplateSummary> = z.object({
  id: z.string().uuid(),
  name: z.string(),
  block_count: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Article = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  image_url?: string | null;
  published_at: string;
  is_hot: boolean;
  view_count: number;
  categories: { name: string; slug: string } | null;
};
const articleResponseSchema: z.ZodType<Article> = z.object({
  id: z.string(), slug: z.string(), title: z.string(), summary: z.string(), image_url: z.string().nullable().optional(),
  published_at: z.string(), is_hot: z.boolean(), view_count: z.number(),
  categories: z.object({ name: z.string(), slug: z.string() }).nullable(),
});
interface ArticleQueryOptions { categorySlug?: string; mode?: "latest" | "hot"; limit?: number }
export const contentKinds = ["hero", "stat", "link", "text", "gallery", "category_list"] as const;
export type ContentKind = (typeof contentKinds)[number];
export type ContentEntry = {
  id: string;
  slug: string;
  kind: ContentKind;
  title: string;
  description: string;
  image_url: string | null;
  href: string | null;
  metric_value: string | null;
  sort_order: number;
};

function client(key: string | undefined): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function publicClient() {
  return client(process.env.SUPABASE_PUBLISHABLE_KEY);
}

function adminClient() {
  return client(process.env.SUPABASE_SECRET_KEY);
}

export function hasPublicDatabase() {
  return Boolean(publicClient());
}

export function hasAdminDatabase() {
  return Boolean(adminClient());
}

function validatedDocument(value: unknown): BuilderDocument {
  const result = documentSchema.safeParse(value);
  if (!result.success) throw new Error("Dữ liệu bố cục trong Supabase không hợp lệ.");
  return result.data;
}

export async function getPublishedPage(): Promise<BuilderDocument | null> {
  const db = publicClient();
  if (!db) return null;
  const { data, error } = await db.from("pages")
    .select("published_content")
    .eq("slug", "home")
    .maybeSingle();
  console.log("🚀 ~ getPublishedPage ~ data:", data)
  if (error) throw new Error(error.message);
  return data?.published_content ? validatedDocument(data.published_content) : null;
}

export async function getDraftPage(): Promise<BuilderDocument | null> {
  const db = adminClient();
  if (!db) return null;
  const { data, error } = await db.from("pages")
    .select("draft_content")
    .eq("slug", "home")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.draft_content ? validatedDocument(data.draft_content) : null;
}

export async function saveDraft(document: BuilderDocument): Promise<void> {
  const db = adminClient();
  if (!db) throw new Error("Chưa cấu hình SUPABASE_SECRET_KEY.");
  const { error } = await db.from("pages").upsert({
    slug: "home",
    name: document.meta.name,
    draft_content: document,
    updated_at: new Date().toISOString(),
  }, { onConflict: "slug" });
  if (error) throw new Error(error.message);
}

export async function publishDraft(): Promise<void> {
  const db = adminClient();
  if (!db) throw new Error("Chưa cấu hình SUPABASE_SECRET_KEY.");
  const draft = await getDraftPage();
  if (!draft) throw new Error("Chưa có bản nháp để xuất bản.");
  const { error } = await db.from("pages")
    .update({ published_content: draft, published_at: new Date().toISOString() })
    .eq("slug", "home");
  if (error) throw new Error(error.message);
}

/** Liệt kê thông tin gọn của các mẫu, không tải toàn bộ JSON bố cục. */
export async function getPageTemplates(): Promise<PageTemplateSummary[]> {
  const db = adminClient();
  if (!db) throw new Error("Chưa cấu hình SUPABASE_SECRET_KEY.");
  const { data, error } = await db.from("page_templates")
    .select("id,name,block_count,created_at,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return z.array(pageTemplateSummarySchema).parse(data ?? []);
}

/** Lấy một mẫu và kiểm tra JSON trước khi đưa vào trình dựng. */
export async function getPageTemplate(id: string): Promise<BuilderDocument | null> {
  const db = adminClient();
  if (!db) throw new Error("Chưa cấu hình SUPABASE_SECRET_KEY.");
  const { data, error } = await db.from("page_templates")
    .select("content")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? validatedDocument(data.content) : null;
}

/** Tạo bản sao mới, không cập nhật mẫu đã có hay trang đang xuất bản. */
export async function createPageTemplate(name: string, document: BuilderDocument): Promise<PageTemplateSummary> {
  const db = adminClient();
  if (!db) throw new Error("Chưa cấu hình SUPABASE_SECRET_KEY.");
  const { data, error } = await db.from("page_templates")
    .insert({ name, content: document, block_count: document.blocks.length })
    .select("id,name,block_count,created_at,updated_at")
    .single();
  if (error) throw new Error(error.message);
  return pageTemplateSummarySchema.parse(data);
}

/** Xóa đúng một mẫu theo ID; bố cục đang sửa và trang công khai không bị ảnh hưởng. */
export async function deletePageTemplate(id: string): Promise<boolean> {
  const db = adminClient();
  if (!db) throw new Error("Chưa cấu hình SUPABASE_SECRET_KEY.");
  const { data, error } = await db.from("page_templates")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function getCategories(): Promise<Category[]> {
  const db = publicClient();
  if (!db) return [];
  const { data, error } = await db.from("categories").select("id,slug,name").order("name");
  console.log("🚀 ~ getCategories ~ data:", data)
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

/** Đọc bài viết và kiểm tra DTO ở biên Supabase trước khi đưa vào renderer. */
export async function getArticles(options: ArticleQueryOptions = {}): Promise<Article[]> {
  const db = publicClient();
  if (!db) return [];
  let query = db.from("articles")
    .select("*,categories!inner(name,slug)")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .limit(options.limit ?? 3);
  if (options.categorySlug) query = query.eq("categories.slug", options.categorySlug);
  if (options.mode === "hot") query = query.eq("is_hot", true).order("view_count", { ascending: false });
  else query = query.order("published_at", { ascending: false });
  const { data, error } = await query;
  console.log("🚀 ~ getArticles ~ data:", data)
  if (error) throw new Error(error.message);
  return z.array(articleResponseSchema).parse(data ?? []);
}

export async function getContentEntries(kind: ContentKind, limit = 4): Promise<ContentEntry[]> {
  const db = publicClient();
  if (!db) return [];
  const { data, error } = await db.from("content_entries")
    .select("id,slug,kind,title,description,image_url,href,metric_value,sort_order")
    .eq("kind", kind)
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .limit(limit);
  console.log("🚀 ~ getContentEntries ~ data:", data)
  if (error) throw new Error(error.message);
  return (data ?? []) as ContentEntry[];
}
