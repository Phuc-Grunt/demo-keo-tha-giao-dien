import { Image as ImageIcon } from "lucide-react";
import type { BlockViewProps } from "./types";
import { fallbackItems, gridColumnsStyle } from "./types";
import { BlockImage } from "./BlockImage";
import { SectionHeading } from "./SectionHeading";

export function GalleryBlock({ block, entries }: BlockViewProps) {
  const images = entries?.map((entry) => ({ id: entry.id, title: entry.title, src: entry.image_url }))
    ?? fallbackItems(block).map((title, index) => ({ id: String(index), title, src: null }));
  return <section id={block.id} className={`render-block content-section gallery-section accent-${block.accent}`}>
    <SectionHeading block={block} />
    <div className="gallery-grid" style={gridColumnsStyle(block)}>
      {images.map((item) => <figure className="gallery-card" key={item.id}>
        <div className="gallery-image"><BlockImage src={item.src} alt={item.title} fallback={<ImageIcon size={34} strokeWidth={1.4} />} /></div>
        <figcaption>{item.title}</figcaption>
      </figure>)}
      {entries?.length === 0 && <p className="news-empty">Chưa có ảnh trong thư viện.</p>}
    </div>
  </section>;
}
