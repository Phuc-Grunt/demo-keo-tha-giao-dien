import { Image as ImageIcon } from "lucide-react";
import type { BlockViewProps } from "./types";
import { fallbackItems, gridColumnsStyle } from "./types";
import SectionHeading from "./SectionHeading";
import BlockImage from "./BlockImage";

/** Hiển thị thư viện ảnh của khối. */
const GalleryBlock = ({ block, entries }: BlockViewProps) => {
  const images =
    entries?.map((entry) => ({
      id: entry.id,
      title: entry.title,
      src: entry.image_url,
    })) ??
    fallbackItems(block).map((title, index) => ({
      id: String(index),
      title,
      src: block.content.items[index]?.imageUrl ?? null,
    }));

  return (
    <section
      id={block.id}
      className={`render-block content-section gallery-section accent-${block.theme.accent}`}
    >
      <SectionHeading block={block} />

      <div className="gallery-grid" style={gridColumnsStyle(block)}>
        {images.map((item) => (
          <figure className="gallery-card" key={item.id}>
            <div className="gallery-image">
              <BlockImage
                src={item.src}
                alt={item.title}
                fallback={<ImageIcon size={34} strokeWidth={1.4} />}
              />
            </div>

            <figcaption>{item.title}</figcaption>
          </figure>
        ))}

        {entries?.length === 0 && (
          <p className="news-empty">Chưa có ảnh trong thư viện.</p>
        )}
      </div>
    </section>
  );
};

export default GalleryBlock;
