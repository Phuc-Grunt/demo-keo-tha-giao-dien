import { BookOpen } from "lucide-react";
import type { BlockViewProps } from "./types";
import { fallbackItems, gridColumnsStyle } from "./types";
import BlockImage from "./BlockImage";
import SectionHeading from "./SectionHeading";
import type { Article } from "@/lib/supabase";

type SimpleItem = { id: string; title: string; date: string; cat: string; img: string | null };

function toSimple(articles: Article[]): SimpleItem[] {
  return articles.map((a) => ({
    id: a.id,
    title: a.title,
    date: a.published_at ? new Date(a.published_at).toLocaleDateString("vi-VN") : "Dữ liệu mẫu",
    cat: a.categories?.name ?? "Tin tức",
    img: a.image_url ?? null,
  }));
}

/** Hiển thị nhóm tin nổi bật theo bố cục đã chọn. */
const FeaturedBlock = ({ block, articles }: BlockViewProps) => {
  const variant = block.variant ?? "classic";
  const items: SimpleItem[] = articles && articles.length > 0
    ? toSimple(articles)
    : fallbackItems(block).map((t, i) => ({ id: String(i), title: t, date: "Dữ liệu mẫu", cat: "Tin nổi bật", img: null }));

  /* ────── GRID variant ────── */
  if (variant === "grid") {
    return (
      <section id={block.id} className={`render-block content-section featured-section accent-${block.accent}`}>
        <SectionHeading block={block} showViewAll />
        <div className="featured-grid" style={gridColumnsStyle(block)}>
          {items.map((item, i) => (
            <article key={item.id} className={`featured-card${i === 0 ? " featured-card-first" : ""}`}>
              <div className={`featured-card-img news-image-${(i % 3) + 1}`}>
                <BlockImage
                  src={item.img}
                  alt={item.title}
                  fallback={<><div className="news-image-pattern" /><BookOpen size={22} strokeWidth={1.4} /></>}
                />
                <span className="featured-card-cat">{item.cat.toUpperCase()}</span>
              </div>
              <div className="featured-card-body">
                <h3>{item.title}</h3>
                <span className="card-meta">{item.date}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  /* ────── CLASSIC variant (default) ────── */
  const main = items[0] ?? { id: "0", title: "Tiêu đề tin chính", date: "Dữ liệu mẫu", cat: "Tin nổi bật", img: null };
  const side = items.slice(1, 6);

  return (
    <section id={block.id} className={`render-block content-section featured-section accent-${block.accent}`}>
      <SectionHeading block={block} showViewAll />
      <div className="featured-classic">
        {/* Tin chính – ảnh phủ toàn */}
        <article className="featured-main">
          <div className="featured-main-img">
            <BlockImage
              src={main.img}
              alt={main.title}
              fallback={<div className="featured-img-placeholder" />}
            />
            <div className="featured-main-overlay">
              <span className="featured-cat-badge">{main.cat.toUpperCase()}</span>
              <h2 className="featured-main-title">{main.title}</h2>
              <span className="card-meta" style={{ color: "rgba(255,255,255,0.65)" }}>{main.date}</span>
            </div>
          </div>
        </article>
        {/* Danh sách tin bên phải */}
        <div className="featured-side">
          <div className="featured-side-header">Tin liên quan</div>
          {side.length === 0
            ? <p className="news-empty" style={{ padding: "16px" }}>Chưa có tin liên quan.</p>
            : side.map((item, i) => (
              <article key={item.id} className="featured-side-row">
                <span className={`featured-rank rank-${i + 1}`}>{String(i + 2).padStart(2, "0")}</span>
                <div className="featured-side-body">
                  <strong>{item.title}</strong>
                  <span className="card-meta">{item.date}</span>
                </div>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBlock;
