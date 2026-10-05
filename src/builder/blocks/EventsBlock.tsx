import { Calendar, MapPin } from "lucide-react";
import type { BlockViewProps } from "./types";
import { fallbackItems, gridColumnsStyle } from "./types";
import SectionHeading from "./SectionHeading";

const MONTHS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];

type EItem = { id: string; title: string; date: Date; cat: string };

/** Hiển thị sự kiện dưới dạng thẻ hoặc dòng thời gian. */
const EventsBlock = ({ block, articles }: BlockViewProps) => {
  const variant = block.variant ?? "timeline";
  const items: EItem[] = articles && articles.length > 0
    ? articles.map((a, i) => ({
        id: a.id ?? String(i),
        title: a.title,
        date: new Date(a.published_at),
        cat: a.categories?.name ?? "Sự kiện",
      }))
    : fallbackItems(block).map((t, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i * 3 + 2);
        return { id: String(i), title: t, date: d, cat: "Sự kiện" };
      });

  /* ────── CARDS variant ────── */
  if (variant === "cards") {
    return (
      <section id={block.id} className={`render-block content-section events-section accent-${block.accent}`}>
        <SectionHeading block={block} showViewAll />
        <div className="event-cards" style={gridColumnsStyle(block)}>
          {items.map((item) => (
            <div key={item.id} className="event-card">
              <div className="event-card-date">
                <strong>{item.date.getDate()}</strong>
                <span>{MONTHS[item.date.getMonth()]}</span>
              </div>
              <div className="event-card-body">
                <strong className="event-card-title">{item.title}</strong>
                <span className="event-meta">
                  <MapPin size={10} />
                  {item.cat}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* ────── TIMELINE variant (default) ────── */
  return (
    <section id={block.id} className={`render-block content-section events-section accent-${block.accent}`}>
      <SectionHeading block={block} showViewAll />
      <div className="events-timeline">
        {items.map((item) => (
          <div key={item.id} className="event-row">
            <div className="event-badge">
              <strong>{item.date.getDate()}</strong>
              <span>{MONTHS[item.date.getMonth()]}</span>
            </div>
            <div className="event-body">
              <strong className="event-title">{item.title}</strong>
              <span className="event-meta">
                <Calendar size={10} />
                {item.date.toLocaleDateString("vi-VN")}
                <MapPin size={10} />
                {item.cat}
              </span>
            </div>
          </div>
        ))}
        {articles?.length === 0 && <p className="news-empty">Chưa có sự kiện nào.</p>}
      </div>
    </section>
  );
};

export default EventsBlock;
