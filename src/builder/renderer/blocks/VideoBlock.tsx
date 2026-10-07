import { Clock } from "lucide-react";
import type { BlockViewProps } from "./types";
import { fallbackItems, gridColumnsStyle } from "./types";
import BlockImage from "./BlockImage";
import SectionHeading from "./SectionHeading";
import PlayBtn from "./PlayBtn";
import type { Article } from "@/lib/supabase";

type VItem = { id: string; title: string; img: string | null };

function toVItem(a: Article, i: number): VItem {
  return { id: a.id ?? String(i), title: a.title, img: a.image_url ?? null };
}

/** Hiển thị video theo bố cục lưới hoặc thanh bên. */
const VideoBlock = ({ block, articles }: BlockViewProps) => {
  const variant = block.variant ?? "sidebar";
  const items: VItem[] =
    articles && articles.length > 0
      ? articles.map(toVItem)
      : fallbackItems(block).map((t, i) => ({
          id: String(i),
          title: t,
          img: block.content.items[i]?.imageUrl ?? null,
        }));

  /* ────── GRID variant ────── */
  if (variant === "grid") {
    return (
      <section
        id={block.id}
        className={`render-block content-section video-section accent-${block.theme.accent}`}
      >
        <SectionHeading block={block} showViewAll />
        <div className="video-grid" style={gridColumnsStyle(block)}>
          {items.map((item, i) => (
            <div key={item.id} className="video-grid-card">
              <div className={`video-thumb video-bg-${(i % 4) + 1}`}>
                <BlockImage
                  src={item.img}
                  alt={item.title}
                  fallback={<div />}
                />
                <div className="video-thumb-overlay">
                  <PlayBtn size={20} />
                </div>
                <span className="video-dur">
                  <Clock size={9} />
                  3:45
                </span>
              </div>
              <div className="video-card-body">
                <strong>{item.title}</strong>
                <span className="card-meta">5 ngày trước</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* ────── SIDEBAR variant (default) ────── */
  const main = items[0] ?? { id: "0", title: "Video nổi bật", img: null };
  const sideItems = items.slice(1, 5);

  return (
    <section
      id={block.id}
      className={`render-block content-section video-section accent-${block.theme.accent}`}
    >
      <SectionHeading block={block} showViewAll />
      <div className="video-sidebar-layout">
        {/* Video lớn */}
        <div className={`video-main-wrap video-bg-1`}>
          <BlockImage src={main.img} alt={main.title} fallback={<div />} />
          <div className="video-thumb-overlay">
            <PlayBtn size={36} />
          </div>
          <div className="video-main-label">
            <strong>{main.title}</strong>
          </div>
        </div>
        {/* Danh sách video nhỏ */}
        <div className="video-side-list">
          {sideItems.length === 0 ? (
            <p className="news-empty">Chưa có video.</p>
          ) : (
            sideItems.map((item, i) => (
              <div key={item.id} className="video-side-item">
                <div
                  className={`video-thumb video-thumb-sm video-bg-${(i % 4) + 2}`}
                >
                  <BlockImage
                    src={item.img}
                    alt={item.title}
                    fallback={<div />}
                  />
                  <div className="video-thumb-overlay">
                    <PlayBtn size={13} />
                  </div>
                </div>
                <div className="video-side-body">
                  <strong>{item.title}</strong>
                  <span className="card-meta">
                    <Clock size={9} />5 ngày trước
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default VideoBlock;
