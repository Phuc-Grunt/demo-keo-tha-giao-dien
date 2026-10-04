import { BlockRenderer } from "@/builder/BlockRenderer";
import { PortalChrome } from "@/builder/PortalChrome";
import Link from "next/link";
import { getBlockSource, starterDocument } from "@/builder/model";
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

  return <div className="published-shell">
    <div className="published-toolbar"><strong>Trang đã xuất bản</strong><Link href="/">Mở trình biên tập</Link></div>
    {notice && <div className="published-notice" role="status">{notice}</div>}
    <PortalChrome>{document.blocks.map((block) => <BlockRenderer key={block.id} block={block} isEditor={false} {...dataByBlock[block.id]} />)}</PortalChrome>
  </div>;
}
