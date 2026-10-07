"use client";

import { JSX } from "react/jsx-runtime";
import type { BlockViewProps } from "./types";
import { useBuilderStore } from "../../editor/store";

const HeadingBlock = ({ block, isEditor }: BlockViewProps) => {
  const { title } = block.content;
  const Tag = (block.variant || "h2") as keyof JSX.IntrinsicElements;
  const updateContent = useBuilderStore((s) => s.updateContent);

  return (
    <div className={`render-block portal-heading-block`}>
      <Tag 
        className="portal-heading-text" 
        style={{ margin: 0, outline: 'none' }}
        contentEditable={isEditor}
        suppressContentEditableWarning={true}
        onBlur={(e) => {
          if (isEditor && e.currentTarget.textContent !== title) {
            updateContent(block.id, { title: e.currentTarget.textContent || "" });
          }
        }}
      >
        {title}
      </Tag>
    </div>
  );
};

export default HeadingBlock;
