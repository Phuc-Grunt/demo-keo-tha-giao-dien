import { z } from "zod";
import { documentSchema } from "@/builder/domain/model";
import {
  createPageTemplate,
  deletePageTemplate,
  getPageTemplate,
  getPageTemplates,
  hasAdminDatabase,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

const templateInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  document: documentSchema,
}).strict();
const templateIdSchema = z.string().uuid();

/** Trả danh sách mẫu hoặc JSON của một mẫu được chọn. */
export async function GET(request: Request) {
  if (!hasAdminDatabase()) return Response.json({ error: "Chưa cấu hình quyền ghi Supabase." }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (id !== null && !templateIdSchema.safeParse(id).success)
    return Response.json({ error: "ID mẫu không hợp lệ." }, { status: 400 });
  try {
    if (id === null) return Response.json({ templates: await getPageTemplates() });
    const document = await getPageTemplate(id);
    return document ? Response.json({ document }) : Response.json({ error: "Không tìm thấy mẫu." }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Không thể tải kho mẫu." }, { status: 502 });
  }
}

/** Lưu bố cục hiện tại thành một mẫu mới trong kho. */
export async function POST(request: Request) {
  if (!hasAdminDatabase()) return Response.json({ error: "Chưa cấu hình quyền ghi Supabase." }, { status: 503 });
  let input: unknown;
  try { input = await request.json(); }
  catch { return Response.json({ error: "JSON không hợp lệ." }, { status: 400 }); }
  const parsed = templateInputSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: "Tên hoặc bố cục mẫu không hợp lệ.", details: parsed.error.flatten() }, { status: 400 });
  try {
    const template = await createPageTemplate(parsed.data.name, parsed.data.document);
    return Response.json({ template }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Không thể lưu mẫu." }, { status: 502 });
  }
}

/** Xóa mẫu khỏi kho theo ID. */
export async function DELETE(request: Request) {
  if (!hasAdminDatabase()) return Response.json({ error: "Chưa cấu hình quyền ghi Supabase." }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !templateIdSchema.safeParse(id).success)
    return Response.json({ error: "ID mẫu không hợp lệ." }, { status: 400 });
  try {
    const deleted = await deletePageTemplate(id);
    return deleted ? Response.json({ ok: true }) : Response.json({ error: "Không tìm thấy mẫu." }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Không thể xóa mẫu." }, { status: 502 });
  }
}
