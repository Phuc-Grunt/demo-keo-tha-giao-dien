import { Rss } from "lucide-react";
import type { BlockViewProps } from "./types";
import { fallbackItems } from "./types";

export function TickerBlock({ block, articles }: BlockViewProps) {
  const items = articles?.map((a) => a.title) ?? fallbackItems(block);
  // Nhân đôi 3 lần để animation không bị gián đoạn
  const repeated = [...items, ...items, ...items];
  return (
    <div id={block.id} className={`render-block ticker-block accent-${block.accent}`}>
      <span className="ticker-label">
        <Rss size={11} strokeWidth={2} />
        <span>{block.eyebrow || "TIN NHANH"}</span>
      </span>
      <div className="ticker-mask">
        <div className="ticker-track">
          {repeated.map((title, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-dot" />
              {title}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
