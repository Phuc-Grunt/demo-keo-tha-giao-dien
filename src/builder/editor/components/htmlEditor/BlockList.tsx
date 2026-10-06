"use client";

import { Layers } from "lucide-react";
import type { BlockEditorEntry, BlockEditorSources } from "../../blockHtmlEditor";

interface BlockListProps {
  entries: BlockEditorEntry[]; sources: BlockEditorSources; initialSources: BlockEditorSources;
  selectedId: string | null; onSelect: (id: string) => void;
}
/** Danh sách component theo cây slot, đánh dấu các block có mã đang sửa. */
const BlockList = ({ entries, sources, initialSources, selectedId, onSelect }: BlockListProps) => (
  <nav className="html-editor-block-list" aria-label="Chọn component để sửa">
    <div className="html-editor-list-heading"><Layers size={15} /><strong>Components</strong><span>{entries.length}</span></div>
    <div className="html-editor-list-scroll">
      {entries.map((entry) => {
        const changed = sources[entry.id]?.html !== initialSources[entry.id]?.html || sources[entry.id]?.css !== initialSources[entry.id]?.css;
        return <button key={entry.id} className={`html-editor-block-option ${selectedId === entry.id ? "is-selected" : ""}`} aria-current={selectedId === entry.id ? "true" : undefined} onClick={() => onSelect(entry.id)} style={{ paddingLeft: 14 + Math.min(entry.depth, 4) * 14 }}>
          <span><strong>{entry.label}</strong><small>{entry.kindLabel}</small></span>
          {changed && <i aria-label="Có thay đổi chưa áp dụng" title="Có thay đổi chưa áp dụng" />}
        </button>;
      })}
      {!entries.length && <p className="html-editor-empty">Trang chưa có block. Thêm component trong builder để chỉnh mã.</p>}
    </div>
  </nav>
);
export default BlockList;
