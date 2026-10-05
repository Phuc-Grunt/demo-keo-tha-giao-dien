import { FileText, MoveUpRight } from "lucide-react";
import type { BlockViewProps } from "./types";
import { fallbackItems, gridColumnsStyle, safeHref } from "./types";
import SectionHeading from "./SectionHeading";

/** Hiển thị các liên kết hữu ích của khối. */
const LinksBlock = ({ block, entries }: BlockViewProps) => {
  const links =
    entries?.map((entry) => ({
      id: entry.id,
      title: entry.title,
      href: safeHref(entry.href),
    })) ??
    fallbackItems(block).map((title, index) => ({
      id: String(index),
      title,
      href: undefined,
    }));
  return (
    <section
      id={block.id}
      className={`render-block content-section links-section accent-${block.accent}`}
    >
      <SectionHeading block={block} />
      <div className="links-grid" style={gridColumnsStyle(block)}>
        {links.map((link) => {
          const content = (
            <>
              <span className="link-icon">
                <FileText size={19} />
              </span>
              <strong>{link.title}</strong>
              <MoveUpRight size={16} />
            </>
          );
          return link.href ? (
            <a className="link-card" key={link.id} href={link.href}>
              {content}
            </a>
          ) : (
            <div className="link-card" key={link.id}>
              {content}
            </div>
          );
        })}
        {entries?.length === 0 && (
          <p className="news-empty">Chưa có liên kết.</p>
        )}
      </div>
    </section>
  );
};

export default LinksBlock;
