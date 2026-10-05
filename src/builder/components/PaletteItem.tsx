import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Plus } from "lucide-react";
import { blockCatalog } from "../model";
import type { BlockKind } from "../model";
import { useBuilderStore } from "../store";
import paletteIcons from "./paletteIcons";

interface PaletteItemProps {
  kind: BlockKind;
}

/** Hiển thị một loại khối trong thư viện để thêm bằng nút hoặc kéo thả. */
const PaletteItem = ({ kind }: PaletteItemProps) => {
  const add = useBuilderStore((state) => state.add);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${kind}`,
  });
  const Icon = paletteIcons[kind];
  return (
    <div
      className={`palette-item ${isDragging ? "is-dragging" : ""}`}
      ref={setNodeRef}
    >
      <button
        className="palette-add"
        onClick={() => add(kind)}
        title={`Thêm ${blockCatalog[kind].label}`}
        aria-label={`Thêm ${blockCatalog[kind].label}`}
      >
        <Plus size={16} />
      </button>
      <div
        className="palette-grab"
        {...listeners}
        {...attributes}
        aria-label={`Kéo ${blockCatalog[kind].label} vào trang`}
      >
        <span className="palette-icon">
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <span className="palette-copy">
          <strong>{blockCatalog[kind].label}</strong>
          <small>{blockCatalog[kind].description}</small>
        </span>
        <GripVertical className="palette-grip" size={15} />
      </div>
    </div>
  );
};

export default PaletteItem;
