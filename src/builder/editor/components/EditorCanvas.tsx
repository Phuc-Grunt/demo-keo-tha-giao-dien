import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Blocks, Plus } from "lucide-react";
import type { BlockData } from "../../builderApi";
import { PortalChrome } from "../../renderer/PortalChrome";
import { useBuilderStore } from "../store";
import SortableBlock from "./SortableBlock";

interface EditorCanvasProps {
  onSelect: () => void;
  dataByBlock: Record<string, BlockData>;
}

/** Ghép các khối theo thứ tự hiện tại và tạo vùng thả cho canvas. */
const EditorCanvas = ({
  onSelect,
  dataByBlock,
}: EditorCanvasProps) => {
  const blocks = useBuilderStore((state) => state.document.blocks);
  const document = useBuilderStore((state) => state.document);
  const add = useBuilderStore((state) => state.add);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const select = useBuilderStore((state) => state.select);
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  return (
    <div
      ref={setNodeRef}
      className={`editor-canvas ${isOver ? "canvas-over" : ""}`}
      onClick={() => select(null)}
    >
      <PortalChrome document={document}>
        <SortableContext
          items={blocks.map((block) => block.id)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.map((block, index) => (
            <SortableBlock
              key={block.id}
              block={block}
              index={index}
              total={blocks.length}
              selected={selectedId === block.id}
              onSelect={onSelect}
              data={dataByBlock[block.id]}
              dataByBlock={dataByBlock}
            />
          ))}
        </SortableContext>
        {blocks.length === 0 && (
          <div className="empty-canvas">
            <Blocks size={32} />
            <strong>Trang của bạn đang trống</strong>
            <span>
              Kéo một thành phần từ bên trái vào đây hoặc chọn để thêm.
            </span>
            <button onClick={() => add("hero")}>
              Thêm banner đầu tiên <Plus size={15} />
            </button>
          </div>
        )}
      </PortalChrome>
      <div className="canvas-add">
        <button onClick={() => add("text")}>
          <Plus size={16} /> Thêm khối nội dung
        </button>
      </div>
    </div>
  );
};

export default EditorCanvas;
