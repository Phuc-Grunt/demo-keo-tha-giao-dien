"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Check, Code2, Download, Upload, X } from "lucide-react";
import { z } from "zod";
import { documentToHtml, htmlToDocument, previewHtml, MAX_TEMPLATE_HTML_SIZE } from "../../../html/htmlCodec";
import { blockEditorSelectors, composeBlockEditorHtml, createBlockEditorSession, previewBlockEditor, type BlockEditorSession, type BlockEditorSources } from "../../blockHtmlEditor";
import type { BuilderDocument } from "../../../domain/model";
import BlockList from "./BlockList";
import BlockCodePane, { type BlockEditorTab } from "./BlockCodePane";
import BlockPreview from "./BlockPreview";

interface HtmlEditorProps { initialSession: BlockEditorSession; initialBlockId?: string | null; onApply: (document: BuilderDocument) => void; onClose: () => void }
interface CompiledEditor { html: string; document: BuilderDocument }

/** Biên tập HTML/CSS từng component, giữ tất cả bản sửa cho tới khi áp dụng vào builder. */
const HtmlEditor = ({ initialSession, initialBlockId, onApply, onClose }: HtmlEditorProps) => {
  const [session, setSession] = useState(initialSession);
  const [sources, setSources] = useState<BlockEditorSources>(initialSession.sources);
  const [selectedId, setSelectedId] = useState<string | null>(initialSession.entries.find((entry) => entry.id === initialBlockId)?.id ?? initialSession.entries[0]?.id ?? null);
  const [tab, setTab] = useState<BlockEditorTab>("html"); const [preview, setPreview] = useState(() => previewHtml(initialSession.template));
  const [live, setLive] = useState(true); const [error, setError] = useState(""); const [valid, setValid] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null); const compiled = useRef<CompiledEditor | null>(null);

  /** Mã đang sửa không tác động JSON trong store; mọi block phải hợp lệ mới được áp dụng. */
  const updateSource = (type: BlockEditorTab, value: string): void => {
    if (!selectedId) return; compiled.current = null; setValid(false);
    setSources((current) => ({ ...current, [selectedId]: { ...current[selectedId], [type]: value } }));
  };
  useEffect(() => {
    compiled.current = null; setValid(false);
    const timer = window.setTimeout(() => {
      try {
        const html = composeBlockEditorHtml(session, sources); const document = htmlToDocument(html);
        compiled.current = { html, document }; setValid(true); setError(""); if (live) setPreview(previewHtml(html));
      } catch (failure) {
        const issue = failure instanceof z.ZodError ? failure.issues[0] : undefined;
        setError(issue ? issue.path.join(".") + ": " + issue.message : failure instanceof Error ? failure.message : "Mã component không hợp lệ.");
        if (live) setPreview(previewBlockEditor(session, sources));
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [session, sources, live]);

  /** Chỉ nhập HTML template hợp lệ, sau đó tách lại các component và CSS riêng. */
  const importFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    if (file.size > MAX_TEMPLATE_HTML_SIZE) { setError("Tệp HTML vượt quá 10 MB."); return; }
    try {
      const next = createBlockEditorSession(await file.text()); compiled.current = null; setValid(false);
      setSession(next); setSources(next.sources); setSelectedId(next.entries[0]?.id ?? null); setError(""); setPreview(previewHtml(next.template));
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Không thể đọc HTML."); }
  };
  /** Tệp tải dùng style inline và cấu hình HTML thụ động, dùng được cho lần nhập tiếp theo. */
  const download = (): void => {
    if (!compiled.current) return;
    try {
      const html = documentToHtml(compiled.current.document);
      const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url; link.download = "bo-cuc-trang-chu.html"; link.click(); URL.revokeObjectURL(url);
      setError("");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Không thể xuất HTML các block."); }
  };
  const selected = session.entries.find((entry) => entry.id === selectedId);
  return <div className="html-editor-modal" role="dialog" aria-modal="true" aria-label="Chỉnh HTML và CSS theo component">
    <header className="html-editor-header">
      <div className="html-editor-title"><Code2 size={20} /><strong>Chỉnh HTML / CSS</strong><span>Chọn block · Chỉnh mã · Xem trực tiếp</span></div>
      <div className="html-editor-actions">
        <button className="outline-button" onClick={() => fileInput.current?.click()}><Upload size={15} /> Nhập HTML</button>
        <button className="outline-button" disabled={!valid} onClick={download} title="Tải tất cả block trong một tệp HTML để mở hoặc nhập lại"><Download size={15} /> Xuất HTML</button>
        <button className="primary-button" disabled={!valid} onClick={() => { if (compiled.current) onApply(compiled.current.document); }}><Check size={15} /> Áp dụng vào builder</button>
        <button className="outline-button" onClick={onClose}><X size={15} /> Đóng</button>
      </div>
    </header>
    <div className="html-editor-help">Nhấp vào block để chỉnh nội dung và giao diện. Xuất HTML lưu tất cả block trong một tệp; Nhập HTML mở lại để tiếp tục chỉnh.</div>
    <div className="html-editor-panes">
      <BlockList entries={session.entries} sources={sources} initialSources={session.sources} selectedId={selectedId} onSelect={setSelectedId} />
      <BlockCodePane title={selected?.label ?? ""} source={selectedId ? sources[selectedId] : undefined} tab={tab} selectors={selectedId ? blockEditorSelectors(session, selectedId) : []} onTabChange={setTab} onChange={updateSource} />
      <BlockPreview html={preview} selectedId={selectedId} live={live} onLiveChange={setLive} onRun={() => setPreview(compiled.current ? previewHtml(compiled.current.html) : previewBlockEditor(session, sources))} onSelect={(id) => { if (session.sources[id]) setSelectedId(id); }} />
    </div>
    <div id="builder-html-status" className={"html-editor-status " + (error ? "html-editor-status-error" : "")} role="status">{error || (valid ? "HTML/CSS hợp lệ. Áp dụng để cập nhật JSON của tất cả component đã sửa." : "Đang kiểm tra HTML/CSS…")}</div>
    <input ref={fileInput} type="file" accept=".html,.htm,text/html" hidden onChange={(event) => void importFile(event)} />
  </div>;
};
export default HtmlEditor;

