import { BookOpen } from "lucide-react";
import type { BlockViewProps } from "./types";
import { fallbackItems, gridColumnsStyle } from "./types";
import SectionHeading from "./SectionHeading";
import BlockImage from "./BlockImage";

/** Hiển thị danh sách tin tức theo dạng lưới. */
const NewsBlock = ({ block, articles }: BlockViewProps) => {
  const titles =
    articles?.map((article) => article.title) ?? fallbackItems(block);
  return (
    <section
      id={block.id}
      className={`render-block content-section news-section accent-${block.theme.accent}`}
    >
      <SectionHeading block={block} showViewAll />
      <div className="news-grid" style={gridColumnsStyle(block)}>
        {titles.map((title, index) => {
          const article = articles?.[index];
          return (
            <article
              className="news-card"
              key={article?.id ?? `${index}-${title}`}
            >
              <div className={`news-image news-image-${(index % 3) + 1}`}>
                <BlockImage
                  src={article ? article.image_url : block.content.items[index]?.imageUrl}
                  alt={title}
                  fallback={
                    <>
                      <div className="news-image-pattern" />
                      <BookOpen size={30} strokeWidth={1.4} />
                    </>
                  }
                />
              </div>
              <div className="news-card-body">
                <span className="card-category">
                  {article?.categories?.name.toUpperCase() ??
                    "HOẠT ĐỘNG GIÁO DỤC"}
                </span>
                <h3>{title}</h3>
                <span className="card-meta">
                  Tin tức <span>·</span>{" "}
                  {article
                    ? new Date(article.published_at).toLocaleDateString("vi-VN")
                    : "Dữ liệu mẫu"}
                </span>
              </div>
            </article>
          );
        })}
        {articles?.length === 0 && (
          <p className="news-empty">Chưa có bài viết trong chuyên mục này.</p>
        )}
      </div>
    </section>
  );
};

export default NewsBlock;
