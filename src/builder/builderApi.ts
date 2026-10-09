import { documentSchema, getBlockSource, type BuilderBlock, type BuilderDocument } from "./domain/model";
import type { Article, Category, ContentEntry, ContentKind, PageTemplateSummary } from "@/lib/supabase";

export type BlockData = { articles?: Article[]; entries?: ContentEntry[] };

/** Đọc JSON và chuyển lỗi HTTP thành Error để giao diện hiển thị thông báo. */
async function responseData<T>(response: Response): Promise<T> {
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
      ? body.error
      : "Yêu cầu không thành công.";
    throw new Error(error);
  }
  return body as T;
}

/** Kiểm tra bố cục từ API trước khi đưa vào store của trình biên tập. */
function parseDocument(value: unknown, errorMessage: string): BuilderDocument {
  const parsed = documentSchema.safeParse(value);
  if (!parsed.success) throw new Error(errorMessage);
  return parsed.data;
}

/** Đổi loại khối trên giao diện thành loại nội dung mà API chấp nhận. */
function contentKindFor(block: BuilderBlock): ContentKind {
  if (block.data?.source.type === "content_entries") return block.data.source.kind;
  if (block.kind === "stats") return "stat";
  if (block.kind === "links") return "link";
  return block.kind as ContentKind;
}

/** Lấy trang đã xuất bản để khởi tạo trình biên tập khi chưa có bản cục bộ. */
export async function getPublishedPage(signal?: AbortSignal): Promise<BuilderDocument> {
  const body = await responseData<{ document: unknown }>(await fetch("/api/page", { cache: "no-store", signal }));
  return parseDocument(body.document, "Trang đã xuất bản không hợp lệ.");
}

/** Lấy bản nháp từ DB để tiếp tục chỉnh sửa. */
export async function getDraftPage(): Promise<BuilderDocument> {
  const body = await responseData<{ document: unknown }>(await fetch("/api/page?draft=1", {
    cache: "no-store",
  }));
  return parseDocument(body.document, "Bản nháp trong Supabase không hợp lệ.");
}

/** Lấy danh sách chuyên mục cho bộ chọn nguồn tin và thông báo. */
export async function getCategories(): Promise<Category[]> {
  const body = await responseData<{ categories: Category[] }>(await fetch("/api/categories", { cache: "no-store" }));
  return body.categories;
}

/** Lấy bài viết theo chuyên mục, cách sắp xếp và số lượng của một khối. */
async function getArticles(block: BuilderBlock, signal: AbortSignal): Promise<Article[]> {
  const source = getBlockSource(block);
  const query = new URLSearchParams({ category: source.categorySlug, mode: source.mode, limit: String(source.limit) });
  const body = await responseData<{ articles: Article[] }>(await fetch(`/api/articles?${query}`, { signal, cache: "no-store" }));
  return body.articles;
}

/** Lấy nội dung từ bảng content_entries cho một khối không phải tin bài. */
async function getContentEntries(block: BuilderBlock, signal: AbortSignal): Promise<ContentEntry[]> {
  const source = getBlockSource(block);
  const query = new URLSearchParams({ kind: contentKindFor(block), limit: String(source.limit) });
  const body = await responseData<{ entries: ContentEntry[] }>(await fetch(`/api/content?${query}`, { signal, cache: "no-store" }));
  return body.entries;
}

/** Chọn API dữ liệu phù hợp với loại khối và trả dữ liệu cho BlockRenderer. */
export async function getBlockData(block: BuilderBlock, signal: AbortSignal): Promise<BlockData> {
  if (!block.data || block.data.source.type === "static") return {};
  // Các block lấy từ bảng articles
  if (block.data.source.type === "articles")
    return { articles: await getArticles(block, signal) };
  // Các block lấy từ bảng content_entries
  return { entries: await getContentEntries(block, signal) };
}

/** Lưu bố cục hiện tại thành bản nháp trong DB. */
export async function saveDraft(document: BuilderDocument): Promise<void> {
  await responseData(await fetch("/api/page", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(document),
  }));
}

/** Đưa bản nháp đã lưu lên trang công khai. */
export async function publishDraft(): Promise<void> {
  await responseData(await fetch("/api/page/publish", {
    method: "POST",
  }));
}

/** Đọc danh sách mẫu mà không tải JSON của từng bố cục. */
export async function getPageTemplates(): Promise<PageTemplateSummary[]> {
  const body = await responseData<{ templates: PageTemplateSummary[] }>(await fetch("/api/templates", { cache: "no-store" }));
  return body.templates;
}

/** Lưu bản sao của bố cục hiện tại vào kho mẫu. */
export async function createPageTemplate(name: string, document: BuilderDocument): Promise<PageTemplateSummary> {
  const body = await responseData<{ template: PageTemplateSummary }>(await fetch("/api/templates", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, document }),
  }));
  return body.template;
}

/** Chỉ tải JSON khi người dùng chọn áp dụng mẫu. */
export async function getPageTemplate(id: string): Promise<BuilderDocument> {
  const body = await responseData<{ document: unknown }>(await fetch(`/api/templates?id=${encodeURIComponent(id)}`, { cache: "no-store" }));
  return parseDocument(body.document, "Mẫu trong Supabase không hợp lệ.");
}

/** Xóa một mẫu đã lưu khỏi kho. */
export async function deletePageTemplate(id: string): Promise<void> {
  await responseData(await fetch(`/api/templates?id=${encodeURIComponent(id)}`, { method: "DELETE" }));
}
