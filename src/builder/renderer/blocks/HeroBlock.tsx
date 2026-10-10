import type { BlockViewProps } from "./types";
import { safeHref } from "./types";
import BlockImage from "./BlockImage";
import BlockIcon from "./BlockIcon";

/** Hiển thị khu vực giới thiệu nổi bật của trang. */
const HeroBlock = ({ block, entries }: BlockViewProps) => {
  const hero = entries?.[0];
  const href = safeHref(hero?.href);
  const cta = <>Khám phá ngay <BlockIcon block={block} iconKey="cta" defaultName="arrow-right" /></>;
  const variantClass = block.variant === "full" ? " hero-full" : "";
  return <section id={block.id} className={`render-block hero-block accent-${block.theme.accent}${variantClass}`}>
    <div className="hero-copy">
      {block.content.eyebrow && <span className="hero-eyebrow"><span className="hero-dot" />{block.content.eyebrow}</span>}
      {(hero?.title || block.content.title) && <h1>{hero?.title || block.content.title}</h1>}
      {(hero?.description || block.content.description) && <p>{hero?.description || block.content.description}</p>}
      {href ? <a className="hero-cta" href={href}>{cta}</a> : <span className="hero-cta">{cta}</span>}
    </div>
    <div className="hero-art">
      <BlockImage src={block.content.imageUrl || hero?.image_url} alt={hero?.title || block.content.title} eager fallback={<>
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <div className="hero-illustration"><BlockIcon block={block} iconKey="hero" defaultName="mortarboard" /></div>
        <div className="hero-art-label">GIÁO DỤC<br />& ĐÀO TẠO</div>
      </>} />
    </div>
  </section>;
};

export default HeroBlock;
