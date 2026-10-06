"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";
import type { BlockEditorSource } from "../../blockHtmlEditor";

export type BlockEditorTab = "html" | "css";
interface BlockCodePaneProps {
  title: string; source?: BlockEditorSource; tab: BlockEditorTab; selectors: string[];
  onTabChange: (tab: BlockEditorTab) => void; onChange: (tab: BlockEditorTab, value: string) => void;
}
/** Hai tab mã của một block; selector gợi ý là các vùng CSS đã có ánh xạ về JSON. */
const BlockCodePane = ({ title, source, tab, selectors, onTabChange, onChange }: BlockCodePaneProps) => {
  const textarea = useRef<HTMLTextAreaElement>(null); const value = source?.[tab] ?? "";
  const handleTab = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key !== "Tab") return; event.preventDefault();
    const element = event.currentTarget; const start = element.selectionStart; const end = element.selectionEnd;
    onChange(tab, value.slice(0, start) + "  " + value.slice(end));
    window.requestAnimationFrame(() => element.setSelectionRange(start + 2, start + 2));
  };
  return <section className="html-editor-code-pane" aria-label="Mã component">
    <div className="html-editor-component-heading"><strong title={title}>{title || "Chọn component"}</strong><span>{value.length.toLocaleString("vi-VN")} ký tự</span></div>
    <div className="html-editor-code-tabs" role="tablist" aria-label="Loại mã">
      <button id="html-editor-tab-html" role="tab" aria-controls="builder-component-source" aria-selected={tab === "html"} onClick={() => onTabChange("html")}>HTML</button>
      <button id="html-editor-tab-css" role="tab" aria-controls="builder-component-source" aria-selected={tab === "css"} onClick={() => onTabChange("css")}>CSS <span>Style riêng</span></button>
    </div>
    <div className="html-editor-code-note">
      {tab === "html" ? "Sửa nội dung trong các thẻ có sẵn. Giữ data-node; component con được sửa riêng." : "CSS mặc định đã được nạp sẵn. Mã ở đây chỉ ghi đè style của component đang chọn."}
    </div>
    {tab === "css" && <details className="html-editor-selectors"><summary>Selector có thể chỉnh ({selectors.length})</summary><div>{selectors.map((selector) => <button key={selector} type="button" onClick={() => {
      onChange("css", `${value}${value.trim() ? "\n\n" : ""}${selector} {\n  \n}`); textarea.current?.focus();
    }}><code>{selector}</code></button>)}</div></details>}
    <textarea ref={textarea} id="builder-component-source" role="tabpanel" aria-labelledby={`html-editor-tab-${tab}`} aria-describedby="builder-html-status" className="html-editor-source" value={value} disabled={!source} spellCheck={false} autoCapitalize="off" autoCorrect="off" onKeyDown={handleTab} onChange={(event) => onChange(tab, event.target.value)} placeholder={tab === "css" ? ".news-grid {\n  gap: 24px;\n}" : "Chọn một component từ danh sách hoặc bản xem trước."} />
  </section>;
};
export default BlockCodePane;
