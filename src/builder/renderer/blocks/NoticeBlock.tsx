import { ChevronRight, Megaphone } from "lucide-react";
import type { BlockViewProps } from "./types";
import { fallbackItems } from "./types";
import SectionHeading from "./SectionHeading";

/** Hiển thị các thông báo trong chuyên mục. */
const NoticeBlock = ({ block, articles }: BlockViewProps) => {
  const titles =
    articles?.map((article) => article.title) ?? fallbackItems(block);
  return (
    <section
      id={block.id}
      className={`render-block content-section notice-section accent-${block.theme.accent}`}
    >
      <SectionHeading block={block} showViewAll />
      <div className="notice-list">
        {titles.map((title, index) => {
          const article = articles?.[index];
          return (
            <div
              className="notice-row"
              key={article?.id ?? `${index}-${title}`}
            >
              <span className="notice-icon">
                <Megaphone size={18} />
              </span>
              <span>
                <small>
                  THÔNG BÁO ·{" "}
                  {article
                    ? new Date(article.published_at).toLocaleDateString("vi-VN")
                    : "Dữ liệu mẫu"}
                </small>
                <strong>{title}</strong>
              </span>
              <ChevronRight size={17} />
            </div>
          );
        })}
        {articles?.length === 0 && (
          <p className="news-empty">Chưa có thông báo trong chuyên mục này.</p>
        )}
      </div>
    </section>
  );
};

export default NoticeBlock;
