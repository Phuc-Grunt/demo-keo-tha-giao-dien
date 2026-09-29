import { ArrowRight } from "lucide-react";
import type { BuilderBlock } from "../model";

export function SectionHeading({ block, title, description, showViewAll = false }: { block: BuilderBlock; title?: string; description?: string; showViewAll?: boolean }) {
  return <div className="section-heading">
    <div>
      <span className="eyebrow">{block.eyebrow}</span>
      <h2>{title ?? block.title}</h2>
      {(description ?? block.description) && <p>{description ?? block.description}</p>}
    </div>
    {showViewAll && <span className="view-all">Xem tất cả <ArrowRight size={14} /></span>}
  </div>;
}
