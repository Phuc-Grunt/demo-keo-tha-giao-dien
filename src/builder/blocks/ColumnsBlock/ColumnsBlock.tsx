"use client";

import { Columns2 } from "lucide-react";
import type { CSSProperties } from "react";
import type { BlockViewProps } from "../types";
import { BlockRenderer } from "../../BlockRenderer";
import ColumnSlot from "./components/ColumnSlot";

// ── Main ColumnsBlock ─────────────────────────────────────────────
/** Hiển thị nhóm cột trong trình chỉnh sửa và trang xem trước. */
const ColumnsBlock = ({ block, isEditor, dataByBlock }: BlockViewProps) => {
  const slots = block.slots ?? [];
  const numCols = slots.length;
  const gridTemplate = block.layout?.gridTemplateColumns || `repeat(${numCols}, minmax(0, 1fr))`;
  const gap = block.layout?.gap ?? 16;

  const gridStyle: CSSProperties = {
    display: block.layout?.display ?? "grid",
    gridTemplateColumns: gridTemplate,
    gap: `${gap}px`,
    backgroundColor: block.style?.backgroundColor,
  };

  if (isEditor === false) {
    return (
      <div id={block.id} className="portal-columns-grid" style={gridStyle}>
        {slots.map((slot) => (
          <div key={slot.id} className="portal-column-slot" data-builder-slot-id={slot.id}>
            {slot.blocks.map((b) => (
              <BlockRenderer key={b.id} block={b} isEditor={false} dataByBlock={dataByBlock} {...dataByBlock?.[b.id]} />
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
        <span>{block.content.title || "Khu vực nhiều cột"}</span>
        <span className="columns-badge">{numCols} cột</span>
      </div>
      <div className="columns-grid" style={gridStyle}>
        {slots.map((slot, i) => (
          <ColumnSlot
            key={slot.id}
            parentId={block.id}
            colIdx={i}
            blocks={slot.blocks}
            slotKey={slot.id}
            dataByBlock={dataByBlock}
            isOver={false}
          />
        ))}
      </div>
    </div>
  );
};

export default ColumnsBlock;
