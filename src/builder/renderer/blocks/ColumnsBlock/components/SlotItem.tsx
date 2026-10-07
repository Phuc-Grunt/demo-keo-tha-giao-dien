"use client";

import { BlockRenderer } from "@/builder/renderer/BlockRenderer";
import { blockCatalog, BuilderBlock } from "@/builder/domain/model";
import { useBuilderStore } from "@/builder/editor/store";
import type { BlockData } from "../../../../builderApi";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
/** Hiển thị một khối có thể kéo và chọn trong cột. */

interface SlotItemProps {
  block: BuilderBlock;
  parentId: string;
  colIdx: number;
  isOverlay?: boolean;
  dataByBlock?: Record<string, BlockData>;
}

/** Hiển thị một khối có thể kéo và chọn trong cột. */
const SlotItem = ({
  block,
  parentId,
  colIdx,
  isOverlay = false,
  dataByBlock,
}: SlotItemProps) => {
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
        <BlockRenderer block={block} dataByBlock={dataByBlock} {...dataByBlock?.[block.id]} isEditor={true} />
      </div>
    </div>
  );
};

export default SlotItem
