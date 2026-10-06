"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import type { BlockViewProps } from "./types";
import { fallbackItems, itemStrings } from "./types";
import BlockImage from "./BlockImage";
import SectionHeading from "./SectionHeading";
import type { Article } from "@/lib/supabase";

/** Hiển thị bài viết theo từng tab nội dung. */
const TabsBlock = ({ block, articles }: BlockViewProps) => {
  const variant = block.variant ?? "underline";
  const tabLabels =
    block.content.items.length > 0
      ? itemStrings(block).slice(0, 5)
      : ["Mới nhất", "Nổi bật", "Giáo dục", "Xã hội"];
  const [activeTab, setActiveTab] = useState(0);

  const getTabArticles = (i: number): Article[] => {
    if (!articles || articles.length === 0) return [];
    const perTab = Math.max(1, Math.ceil(articles.length / tabLabels.length));
    return articles.slice(i * perTab, i * perTab + perTab);
  };

  const tabArticles = getTabArticles(activeTab);
  const fallback = fallbackItems(block);
  const navClass = variant === "pills" ? "tabs-nav tabs-nav-pills" : "tabs-nav";

  return (
    <section
      id={block.id}
      className={`render-block content-section tabs-section accent-${block.theme.accent}`}
    >
      <SectionHeading block={block} />
      {/* Tab bar */}
      <div className={navClass}>
        {tabLabels.map((label, i) => (
          <button
            key={i}
            className={`tabs-btn${i === activeTab ? " tabs-btn-active" : ""}`}
            onClick={() => setActiveTab(i)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      {/* Nội dung tab */}
      <div className="tabs-body">
        {tabArticles.length > 0
          ? tabArticles.map((article) => (
              <article key={article.id} className="tab-row">
                <div className="tab-thumb">
                  <BlockImage
                    src={article.image_url}
                    alt={article.title}
                    fallback={<BookOpen size={16} strokeWidth={1.4} />}
                  />
                </div>
                <div className="tab-row-body">
                  <strong>{article.title}</strong>
                  <span className="card-meta">
                    {article.categories?.name?.toUpperCase() ?? "TIN TỨC"}
                    <span>·</span>
                    {new Date(article.published_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </article>
            ))
          : fallback.map((title, i) => (
              <article key={i} className="tab-row">
                <div className="tab-thumb tab-thumb-fallback">
                  <BookOpen size={15} strokeWidth={1.4} />
                </div>
                <div className="tab-row-body">
                  <strong>{title}</strong>
                  <span className="card-meta">
                    TIN TỨC <span>·</span> Dữ liệu mẫu
                  </span>
                </div>
              </article>
            ))}
      </div>
    </section>
  );
};

export default TabsBlock;
