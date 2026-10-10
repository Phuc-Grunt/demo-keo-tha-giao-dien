import type { BuilderBlock } from "../../domain/model";
import BlockIcon from "./BlockIcon";

interface SectionHeadingProps {
  block: BuilderBlock;
  title?: string;
  description?: string;
  showViewAll?: boolean;
}

/** Hiển thị tiêu đề và mô tả chung cho các khối nội dung. */
const SectionHeading = ({
  block,
  title,
  description,
  showViewAll = false,
}: SectionHeadingProps) => {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{block.content.eyebrow}</span>
        <h2>{title ?? block.content.title}</h2>
        {(description ?? block.content.description) && (
          <p>{description ?? block.content.description}</p>
        )}
      </div>
      {showViewAll && (
        <span className="view-all">
          Xem tất cả <BlockIcon block={block} iconKey="view-all" defaultName="arrow-right" />
        </span>
      )}
    </div>
  );
};

export default SectionHeading;
