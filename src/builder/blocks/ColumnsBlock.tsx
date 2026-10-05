"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Columns2 } from "lucide-react";
import type { BlockViewProps } from "./types";
import { BlockRenderer } from "../BlockRenderer";
import { useBuilderStore } from "../store";
import { blockCatalog, blockKinds, BlockKind, BuilderBlock } from "../model";

// ── ID helpers ────────────────────────────────────────────────────
const slotId = (parentId: string, colIdx: number) => `slot:${parentId}:${colIdx}`;

// ── Sortable item inside a column slot ───────────────────────────
function SlotItem({
  block,
  parentId,
  colIdx,
  isOverlay = false,
}: {
  block: BuilderBlock;
  parentId: string;
  colIdx: number;
  isOverlay?: boolean;
}) {
  const removeFromSlot = useBuilderStore((s) => s.removeFromSlot);
  const select = useBuilderStore((s) => s.select);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, data: { parentId, colIdx, type: "slot-item" } });

  const style = isOverlay
    ? {}
    : { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`slot-item${isDragging ? " is-dragging" : ""}${selectedId === block.id ? " selected" : ""}`}
      onClick={(e) => { e.stopPropagation(); select(block.id); }}
    >
      <div className="slot-item-bar">
        <span
          className="slot-grip"
          {...listeners}
          {...attributes}
          title="Kéo để sắp xếp"
        >
          <GripVertical size={13} />
        </span>
        <span className="slot-item-label">{blockCatalog[block.kind]?.label ?? block.kind}</span>
        <button
          className="slot-remove-btn"
          onClick={(e) => { e.stopPropagation(); removeFromSlot(parentId, colIdx, block.id); }}
          title="Xóa khỏi cột"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div className="slot-item-preview">
        <BlockRenderer block={block} />
      </div>
    </div>
  );
}

function ColumnSlot({
  parentId,
  colIdx,
  blocks,
  isOver,
}: {
  parentId: string;
  colIdx: number;
  blocks: BuilderBlock[];
  isOver: boolean;
}) {
  const addToSlot = useBuilderStore((s) => s.addToSlot);
  const { setNodeRef } = useDroppable({ id: slotId(parentId, colIdx), data: { parentId, colIdx, type: "slot" } });
  const [showPicker, setShowPicker] = useState(false);

  // Block kinds that can go into a slot (exclude columns to avoid deep nesting)
  const allowedKinds = blockKinds.filter((k) => k !== "columns");

  return (
    <div
      ref={setNodeRef}
      className={`column-slot${isOver ? " slot-over" : ""}${blocks.length === 0 ? " slot-empty" : ""}`}
    >
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        {blocks.map((block) => (
          <SlotItem
            key={block.id}
            block={block}
            parentId={parentId}
            colIdx={colIdx}
          />
        ))}
      </SortableContext>

      {blocks.length === 0 && (
        <div className="slot-placeholder">
          <span>Kéo thả hoặc nhấn + để thêm khối</span>
        </div>
      )}

      {/* Nút thêm block vào slot */}
      <div className="slot-add-area">
        {showPicker ? (
          <div className="slot-picker">
            <div className="slot-picker-header">
              <span>Chọn loại khối</span>
              <button onClick={() => setShowPicker(false)}>✕</button>
            </div>
            <div className="slot-picker-grid">
              {allowedKinds.map((kind) => (
                <button
                  key={kind}
                  className="slot-picker-btn"
                  onClick={() => { addToSlot(parentId, colIdx, kind); setShowPicker(false); }}
                  title={blockCatalog[kind].description}
                >
                  {blockCatalog[kind].label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            className="slot-add-btn"
            onClick={() => setShowPicker(true)}
            title="Thêm khối vào cột này"
          >
            <Plus size={14} /> Thêm khối
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main ColumnsBlock ─────────────────────────────────────────────
export function ColumnsBlock({ block, isEditor }: BlockViewProps) {
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
}
