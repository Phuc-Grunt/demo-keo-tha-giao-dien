import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Copy, GripVertical, Trash2 } from "lucide-react";
import { BlockRenderer } from "../BlockRenderer";
import type { BlockData } from "../builderApi";
import { blockCatalog } from "../model";
import type { BuilderBlock } from "../model";
import { useBuilderStore } from "../store";

interface SortableBlockProps {
  block: BuilderBlock;
  selected: boolean;
  index: number;
  total: number;
  onSelect: () => void;
  data?: BlockData;
}

/** Hiển thị một khối cùng các thao tác chọn, sắp xếp, nhân bản và xóa. */
const SortableBlock = ({
  block,
  selected,
  index,
  total,
  onSelect,
  data,
}: SortableBlockProps) => {
  const select = useBuilderStore((state) => state.select);
  const remove = useBuilderStore((state) => state.remove);
  const duplicate = useBuilderStore((state) => state.duplicate);
  const move = useBuilderStore((state) => state.move);
  const blocks = useBuilderStore((state) => state.document.blocks);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });
  return (
    <div
      ref={setNodeRef}
      className={`editor-block ${selected ? "selected" : ""} ${isDragging ? "is-dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={() => {
        select(block.id);
        onSelect();
      }}
    >
      <div
        className="block-controls"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="block-type-tag">{blockCatalog[block.kind]?.label || block.kind}</span>
        <button
          title="Di chuyển lên"
          aria-label="Di chuyển lên"
          disabled={index === 0}
          onClick={() => move(block.id, blocks[index - 1]?.id)}
        >
          <ArrowUp size={14} />
        </button>
        <button
          title="Di chuyển xuống"
          aria-label="Di chuyển xuống"
          disabled={index === total - 1}
          onClick={() => move(block.id, blocks[index + 2]?.id)}
        >
          <ArrowDown size={14} />
        </button>
        <button
          title="Nhân bản"
          aria-label="Nhân bản"
          onClick={() => duplicate(block.id)}
        >
          <Copy size={14} />
        </button>
        <button
          title="Xóa khối"
          aria-label="Xóa khối"
          onClick={() => remove(block.id)}
        >
          <Trash2 size={14} />
        </button>
        <button
          className="drag-handle"
          title="Kéo để sắp xếp"
          aria-label="Kéo để sắp xếp"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
      </div>
      <BlockRenderer block={block} {...data} isEditor={true} />
    </div>
  );
};

export default SortableBlock;
