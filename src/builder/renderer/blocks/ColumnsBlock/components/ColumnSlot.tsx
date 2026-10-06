/** Hiển thị vùng thả và danh sách khối trong một cột. */
"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {Plus } from "lucide-react";
import { blockCatalog, blockKinds, BuilderBlock } from "@/builder/domain/model";
import { useBuilderStore } from "@/builder/editor/store";
import { slotId } from "../helps/slotId";
import SlotItem from "./SlotItem";
import type { BlockData } from "../../../../builderApi";

/** Hiển thị vùng thả và danh sách khối trong một cột. */

interface ColumnSlotProps {
  parentId: string;
  colIdx: number;
  blocks: BuilderBlock[];
  isOver: boolean;
  slotKey: string;
  dataByBlock?: Record<string, BlockData>;
}

const ColumnSlot = ({
  parentId,
  colIdx,
  blocks,
  isOver,
  slotKey,
  dataByBlock,
}: ColumnSlotProps) => {
  const addToSlot = useBuilderStore((s) => s.addToSlot);
  const { setNodeRef } = useDroppable({ id: slotId(parentId, colIdx), data: { parentId, colIdx, type: "slot" } });
  const [showPicker, setShowPicker] = useState(false);

  // Block kinds that can go into a slot (exclude columns to avoid deep nesting)
  const allowedKinds = blockKinds.filter((k) => k !== "columns");

  return (
    <div
      ref={setNodeRef}
      data-builder-slot-id={slotKey}
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
            dataByBlock={dataByBlock}
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
};

export default ColumnSlot
