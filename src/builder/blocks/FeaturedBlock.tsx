"use client";

import { useState, useEffect } from "react";
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
    : fallbackItems(block).map((t, i) => ({ id: String(i), title: t, date: "Dữ liệu mẫu", cat: "Tin nổi bật", img: block.content.items[i]?.imageUrl ?? null }));

  const isAuto = block.behavior?.slideshow?.autoplay;
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    if (variant === "grid" || !isAuto || items.length === 0) return;
    const timer = setInterval(() => setActiveIndex((previous) => (previous + 1) % Math.min(items.length, 5)), block.behavior?.slideshow?.intervalMs ?? 3000);
    return () => clearInterval(timer);
  }, [variant, isAuto, block.behavior?.slideshow?.intervalMs, items.length]);

  /* ────── GRID variant ────── */
  if (variant === "grid") {
    return (
      <section id={block.id} className={`render-block content-section featured-section accent-${block.theme.accent}`}>
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
  const mainIndex = isAuto && items.length ? activeIndex % Math.min(items.length, 5) : 0;
  const main = items[mainIndex] ?? { id: "0", title: "Tiêu đề tin chính", date: "Dữ liệu mẫu", cat: "Tin nổi bật", img: null };
  const side = isAuto ? items.slice(0, 5) : items.slice(1, 6);

  return (
    <section id={block.id} className={`render-block content-section featured-section accent-${block.theme.accent}`}>
      <SectionHeading block={block} showViewAll />
      <div className="featured-classic">
        {/* Tin chính – ảnh phủ toàn */}
        <article className="featured-main">
          <div className="featured-main-img animate-in fade-in duration-500" key={main.id}>
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
            : side.map((item, i) => {
              const isActive = isAuto && i === activeIndex;
              const displayRank = isAuto ? i + 1 : i + 2;
              return (
                <article 
                  key={item.id} 
                  className={`featured-side-row ${isActive ? "active-slide" : ""}`}
                  style={{ 
                    cursor: isAuto ? "pointer" : "default",
                    backgroundColor: isActive ? "rgba(0,0,0,0.03)" : "transparent",
                    transition: "background-color 0.2s"
                  }}
                  onClick={isAuto ? () => setActiveIndex(i) : undefined}
                >
                  <span className={`featured-rank rank-${displayRank}`}>{String(displayRank).padStart(2, "0")}</span>
                  <div className="featured-side-body">
                    <strong style={{ color: isActive ? "var(--primary)" : "inherit" }}>{item.title}</strong>
                    <span className="card-meta">{item.date}</span>
                  </div>
                </article>
              );
            })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBlock;
