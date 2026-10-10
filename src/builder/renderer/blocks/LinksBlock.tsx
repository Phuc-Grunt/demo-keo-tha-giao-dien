import type { BlockViewProps } from "./types";
import { fallbackItems, gridColumnsStyle, safeHref } from "./types";
import SectionHeading from "./SectionHeading";
import BlockIcon from "./BlockIcon";

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
      href: safeHref(block.content.items[index]?.href),
    }));
  return (
    <section
      id={block.id}
      className={`render-block content-section links-section accent-${block.theme.accent}`}
    >
      <SectionHeading block={block} />
      <div className="links-grid" style={gridColumnsStyle(block)}>
        {links.map((link, index) => {
          const content = (
            <>
              <span className="link-icon">
                <BlockIcon block={block} iconKey={`item-${index}-file`} defaultName="file-earmark-text" />
              </span>
              <strong>{link.title}</strong>
              <BlockIcon block={block} iconKey={`item-${index}-arrow`} defaultName="arrow-up-right" />
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
