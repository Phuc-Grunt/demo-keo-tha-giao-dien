import { ArrowRight, GraduationCap } from "lucide-react";
import type { BlockViewProps } from "./types";
import { safeHref } from "./types";
import BlockImage from "./BlockImage";

/** Hiển thị khu vực giới thiệu nổi bật của trang. */
const HeroBlock = ({ block, entries }: BlockViewProps) => {
  const hero = entries?.[0];
  const href = safeHref(hero?.href);
  const cta = <>Khám phá ngay <ArrowRight size={15} /></>;
  return <section id={block.id} className={`render-block hero-block accent-${block.accent}`}>
    <div className="hero-copy">
      {block.eyebrow && <span className="hero-eyebrow"><span className="hero-dot" />{block.eyebrow}</span>}
      {(hero?.title || block.title) && <h1>{hero?.title || block.title}</h1>}
      {(hero?.description || block.description) && <p>{hero?.description || block.description}</p>}
      {href ? <a className="hero-cta" href={href}>{cta}</a> : <span className="hero-cta">{cta}</span>}
    </div>
    <div className="hero-art">
      <BlockImage src={block.imageUrl || hero?.image_url} alt={hero?.title || block.title} eager fallback={<>
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <div className="hero-illustration"><GraduationCap size={66} strokeWidth={1.2} /></div>
        <div className="hero-art-label">GIÁO DỤC<br />& ĐÀO TẠO</div>
      </>} />
    </div>
  </section>;
};

export default HeroBlock;
