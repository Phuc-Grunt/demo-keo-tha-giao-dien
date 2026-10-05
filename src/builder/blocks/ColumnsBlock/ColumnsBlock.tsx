"use client";

import {  Columns2 } from "lucide-react";
import type { BlockViewProps } from "../types";
import { BlockRenderer } from "../../BlockRenderer";
import {  } from "../../store";
import { BuilderBlock } from "../../model";
import ColumnSlot from "./components/ColumnSlot";

// ── Main ColumnsBlock ─────────────────────────────────────────────
/** Hiển thị nhóm cột trong trình chỉnh sửa và trang xem trước. */
const ColumnsBlock = ({ block, isEditor }: BlockViewProps) => {
  const numCols = block.dataSource?.columns ?? 2;
  const gridTemplate = block.dataSource?.gridTemplate || `repeat(${numCols}, minmax(0, 1fr))`;
  const gap = block.dataSource?.gap ?? 16;
  const padding = block.dataSource?.padding ?? 0;
  const backgroundColor = block.dataSource?.backgroundColor || "";

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: gridTemplate,
    gap: `${gap}px`,
    padding: padding ? `${padding}px` : undefined,
    backgroundColor: backgroundColor || undefined,
  };
  const slots: BuilderBlock[][] = block.slots
    ? block.slots.slice(0, numCols).concat(
        Array.from({ length: Math.max(0, numCols - block.slots.length) }, () => []),
      )
    : Array.from({ length: numCols }, () => []);

  if (isEditor === false) {
    return (
      <div id={block.id} className="portal-columns-grid" style={gridStyle}>
        {slots.map((slotBlocks, i) => (
          <div key={i} className="portal-column-slot">
            {slotBlocks.map((b) => (
              <BlockRenderer key={b.id} block={b} isEditor={false} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div id={block.id} className="columns-block">
      <div className="columns-header">
        <Columns2 size={14} />
        <span>{block.title || "Khu vực nhiều cột"}</span>
        <span className="columns-badge">{numCols} cột</span>
      </div>
      <div className="columns-grid" style={gridStyle}>
        {slots.map((slotBlocks, i) => (
          <ColumnSlot
            key={i}
            parentId={block.id}
            colIdx={i}
            blocks={slotBlocks}
            isOver={false}
          />
        ))}
      </div>
    </div>
  );
};

export default ColumnsBlock;
