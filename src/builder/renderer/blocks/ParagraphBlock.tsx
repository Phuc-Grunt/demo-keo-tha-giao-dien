"use client";

import type { BlockViewProps } from "./types";
import { useBuilderStore } from "../../editor/store";

const ParagraphBlock = ({ block, isEditor }: BlockViewProps) => {
  const { description } = block.content;
  const updateContent = useBuilderStore((s) => s.updateContent);

  return (
    <div className={`render-block portal-paragraph-block`}>
      <p 
        className="portal-paragraph-text" 
        style={{ margin: 0, outline: 'none' }}
        contentEditable={isEditor}
        suppressContentEditableWarning={true}
        onBlur={(e) => {
          if (isEditor && e.currentTarget.textContent !== description) {
            updateContent(block.id, { description: e.currentTarget.textContent || "" });
          }
        }}
      >
        {description}
      </p>
    </div>
  );
};

export default ParagraphBlock;
