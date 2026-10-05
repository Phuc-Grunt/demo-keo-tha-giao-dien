import { BlockRenderer } from "@/builder/BlockRenderer";
import { PortalChrome } from "@/builder/PortalChrome";
import Link from "next/link";
import { flattenBlocks, getPageWidth, getBlockSource, starterDocument } from "@/builder/model";
import { getArticles, getContentEntries, getPublishedPage, hasPublicDatabase } from "@/lib/supabase";
import type { BlockData } from "@/builder/builderApi";

export const dynamic = "force-dynamic";

/** Hiển thị tài liệu đã xuất bản và lấy dữ liệu cho cả các khối nằm trong slot. */
const PublishedSite = async () => {
  let document = starterDocument;
  let notice = "Chưa kết nối Supabase. Đây là bố cục mẫu để xem giao diện.";
  let dataByBlock: Record<string, BlockData> = {};

  if (hasPublicDatabase()) {
    try {
      const published = await getPublishedPage();
      if (published) {
        document = published;
        notice = "";
        const results = await Promise.all(flattenBlocks(document.blocks).map(async (block) => {
          const source = getBlockSource(block);
          try {
            if (!block.data || block.data.source.type === "static") return [block.id, {}] as const;
            if (block.data.source.type === "articles") {
              return [block.id, { articles: await getArticles({ categorySlug: source.categorySlug, mode: source.mode, limit: source.limit }) }] as const;
            }
            const kind = block.data.source.kind;
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
  const shellWidth = (getPageWidth(document)) + 40;
  return <div className="published-shell" style={{ maxWidth: shellWidth }}>
    <div className="published-toolbar"><strong>Trang đã xuất bản</strong><Link href="/">Mở trình biên tập</Link></div>
    {notice && <div className="published-notice" role="status">{notice}</div>}
    <PortalChrome document={document}>{document.blocks.map((block) => <BlockRenderer key={block.id} block={block} isEditor={false} dataByBlock={dataByBlock} {...dataByBlock[block.id]} />)}</PortalChrome>
  </div>;
};

export default PublishedSite;
