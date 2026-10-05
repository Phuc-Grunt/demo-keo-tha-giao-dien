"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Check, Code2, Download, Monitor, Play, Smartphone, Upload, X } from "lucide-react";
import { htmlToDocument, previewHtml, MAX_TEMPLATE_HTML_SIZE } from "../htmlCodec";
import { z } from "zod";
import type { BuilderDocument } from "../model";

interface HtmlEditorProps {
  initialHtml: string;
  onApply: (document: BuilderDocument) => void;
  onClose: () => void;
}
/** Tryit editor: bản HTML đang gõ độc lập với JSON đã áp dụng, preview trong sandbox. */
const HtmlEditor = ({ initialHtml, onApply, onClose }: HtmlEditorProps) => {
  const [source, setSource] = useState(initialHtml);
  const [preview, setPreview] = useState("");
  const [live, setLive] = useState(true);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [error, setError] = useState("");
  const [valid, setValid] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const parsedDocument = useRef<BuilderDocument | null>(null);

  /** Mỗi thay đổi mã vô hiệu hóa kết quả parse cũ trước khi cho phép áp dụng. */
  const updateSource = (next: string): void => {
    parsedDocument.current = null; setValid(false); setSource(next);
  };

  /** Parse sau một khoảng ngắn để preview cập nhật mượt khi người dùng đang gõ. */
  useEffect(() => {
    parsedDocument.current = null; setValid(false);
    const timer = window.setTimeout(() => {
      try { parsedDocument.current = htmlToDocument(source); setError(""); setValid(true); }
      catch (failure) {
        const issue = failure instanceof z.ZodError ? failure.issues[0] : undefined;
        setError(issue ? `${issue.path.join(".") || "Tài liệu"}: ${issue.message}` : failure instanceof Error ? failure.message : "HTML không hợp lệ.");
      }
      if (live) setPreview(previewHtml(source));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [source, live]);

  /** Đọc HTML từ máy tính vào cùng màn biên tập, chưa ghi vào store. */
  const importFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    if (file.size > MAX_TEMPLATE_HTML_SIZE) { setError("Tệp HTML vượt quá 10 MB."); return; }
    try { updateSource(await file.text()); } catch { setError("Không thể đọc tệp HTML."); }
  };
  /** Tải bản nguồn đang sửa, bao gồm những thay đổi chưa áp dụng vào builder. */
  const download = (): void => {
    const url = URL.createObjectURL(new Blob([source], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "bo-cuc-trang-chu.html"; link.click(); URL.revokeObjectURL(url);
  };
  /** Tab chèn khoảng trắng trong ô code thay vì chuyển focus khỏi vùng soạn thảo. */
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key !== "Tab") return; event.preventDefault();
    const element = event.currentTarget; const start = element.selectionStart; const end = element.selectionEnd;
    updateSource(source.slice(0, start) + "  " + source.slice(end));
    window.requestAnimationFrame(() => element.setSelectionRange(start + 2, start + 2));
  };

  return <div className="html-editor-modal" role="dialog" aria-modal="true" aria-label="Chỉnh sửa HTML và xem trước">
    <header className="html-editor-header">
      <div className="html-editor-title"><Code2 size={20} /><strong>HTML Editor</strong><span>Sửa mã và xem kết quả trực tiếp</span></div>
      <div className="html-editor-actions">
        <button className="outline-button" onClick={() => fileInput.current?.click()}><Upload size={15} /> Nhập HTML</button>
        <button className="outline-button" onClick={download}><Download size={15} /> Tải HTML</button>
        <button className="primary-button" disabled={!valid} onClick={() => { if (parsedDocument.current) onApply(parsedDocument.current); }}><Check size={15} /> Áp dụng vào builder</button>
        <button className="outline-button" onClick={onClose}><X size={15} /> Đóng</button>
      </div>
    </header>
    <div className="html-editor-help">Sửa nội dung ở field; sửa <code>style</code>/class tại <code>data-builder-part</code> hoặc kiểu chữ tại <code>data-builder-field</code>. Giữ marker và CSS nền. Preview hiển thị HTML/CSS; slideshow và dữ liệu động chạy trong builder sau khi áp dụng.</div>
    <div className="html-editor-panes">
      <section className="html-editor-code-pane">
        <div className="html-editor-pane-heading"><label htmlFor="builder-html-source">Mã HTML</label><span>{source.length.toLocaleString("vi-VN")} ký tự</span></div>
        <textarea ref={textarea} id="builder-html-source" aria-describedby="builder-html-status" className="html-editor-source" value={source} spellCheck={false} autoCapitalize="off" autoCorrect="off" onKeyDown={handleKeyDown} onChange={(event) => updateSource(event.target.value)} />
      </section>
      <section className="html-editor-preview-pane">
        <div className="html-editor-pane-heading">
          <strong>Kết quả</strong>
          <div className="html-editor-preview-controls">
            <label><input type="checkbox" checked={live} onChange={(event) => setLive(event.target.checked)} /> Trực tiếp</label>
            <button onClick={() => setPreview(previewHtml(source))} title="Chạy bản xem trước"><Play size={14} /> Chạy</button>
            <button aria-label="Xem trên máy tính" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><Monitor size={15} /></button>
            <button aria-label="Xem trên điện thoại" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}><Smartphone size={15} /></button>
          </div>
        </div>
        <div className="html-editor-preview-scroll"><iframe title="Kết quả HTML đang chỉnh sửa" className={`html-editor-frame ${device === "mobile" ? "html-editor-frame-mobile" : ""}`} sandbox="" referrerPolicy="no-referrer" srcDoc={preview} /></div>
      </section>
    </div>
    <div id="builder-html-status" className={`html-editor-status ${error ? "html-editor-status-error" : ""}`} role="status">{error || (valid ? "HTML hợp lệ. Áp dụng để cập nhật JSON và trình dựng; nội dung DB được tải lại theo nguồn đã chọn." : "Đang kiểm tra HTML…")}</div>
    <input ref={fileInput} type="file" accept=".html,.htm,text/html" hidden onChange={(event) => void importFile(event)} />
  </div>;
};
export default HtmlEditor;
