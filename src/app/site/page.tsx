import { BlockRenderer } from "@/builder/BlockRenderer";
import { PortalChrome } from "@/builder/PortalChrome";
import Link from "next/link";
import { DEFAULT_PAGE_WIDTH, getBlockSource, starterDocument } from "@/builder/model";
import { getArticles, getContentEntries, getPublishedPage, hasPublicDatabase } from "@/lib/supabase";
import type { Article, ContentEntry, ContentKind } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function PublishedSite() {
  let document = starterDocument;
  let notice = "Chưa kết nối Supabase. Đây là bố cục mẫu để xem giao diện.";
  let dataByBlock: Record<string, { articles?: Article[]; entries?: ContentEntry[] }> = {};

  if (hasPublicDatabase()) {
    try {
      const published = await getPublishedPage();
      if (published) {
        document = published;
        notice = "";
        const results = await Promise.all(document.blocks.map(async (block) => {
          const source = getBlockSource(block);
          try {
            if (block.kind === "news" || block.kind === "notice") {
              return [block.id, { articles: await getArticles({ categorySlug: source.categorySlug, mode: source.mode, limit: source.limit }) }] as const;
            }
            const kind = (block.kind === "stats" ? "stat" : block.kind === "links" ? "link" : block.kind) as ContentKind;
            return [block.id, { entries: await getContentEntries(kind, source.limit) }] as const;
          } catch { return [block.id, {}] as const; }
        }));
        dataByBlock = Object.fromEntries(results);
      } else notice = "Chưa có trang được xuất bản trong Supabase.";
    } catch (error) {
      notice = `Không thể đọc Supabase: ${error instanceof Error ? error.message : "Lỗi kết nối."}`;
    }
  }

  // Khung ngoài có padding 20px mỗi bên nên cộng thêm 40px để nội dung đúng bằng độ rộng đã cấu hình.
  const shellWidth = (document.pageWidth ?? DEFAULT_PAGE_WIDTH) + 40;
  return <div className="published-shell" style={{ maxWidth: shellWidth }}>
    <div className="published-toolbar"><strong>Trang đã xuất bản</strong><Link href="/">Mở trình biên tập</Link></div>
    {notice && <div className="published-notice" role="status">{notice}</div>}
    <PortalChrome themeColor={document.themeColor} themeFont={document.themeFont}>{document.blocks.map((block) => <BlockRenderer key={block.id} block={block} isEditor={false} {...dataByBlock[block.id]} />)}</PortalChrome>
  </div>;
}
