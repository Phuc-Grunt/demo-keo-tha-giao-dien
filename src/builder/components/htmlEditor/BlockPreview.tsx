"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Monitor, Play, Smartphone } from "lucide-react";
import { cssAttribute } from "../../appearance";

interface BlockPreviewProps {
  html: string; selectedId: string | null; live: boolean; onLiveChange: (value: boolean) => void;
  onRun: () => void; onSelect: (id: string) => void;
}
interface PreviewScroll { x: number; y: number }
/** Kiểm tra target theo DOM API để dùng được với element thuộc realm của iframe. */
function isElement(target: EventTarget | null): target is Element {
  return target !== null && "nodeType" in target && target.nodeType === 1 && "closest" in target && typeof target.closest === "function";
}
/** Preview vùng block trong sandbox không chạy script; parent xử lý click chọn component. */
const BlockPreview = ({ html, selectedId, live, onLiveChange, onRun, onSelect }: BlockPreviewProps) => {
  const frame = useRef<HTMLIFrameElement>(null); const selection = useRef(selectedId); const onSelectRef = useRef(onSelect);
  const cleanup = useRef<(() => void) | null>(null); const scroll = useRef<PreviewScroll>({ x: 0, y: 0 });
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const highlight = useCallback((moveToBlock: boolean): void => {
    const parsed = frame.current?.contentDocument; if (!parsed) return;
    parsed.getElementById("builder-block-highlight")?.remove();
    if (!selection.current) return;
    const style = parsed.createElement("style"); style.id = "builder-block-highlight";
    style.textContent = `[data-builder-block-id="${cssAttribute(selection.current)}"] > [data-builder-part="root"]{outline:2px solid #2876db !important;outline-offset:-2px;}`;
    parsed.head.append(style);
    if (moveToBlock) {
      const root = Array.from(parsed.querySelectorAll<HTMLElement>("[data-builder-block-id]")).find((element) => element.getAttribute("data-builder-block-id") === selection.current);
      root?.querySelector<HTMLElement>('[data-builder-part="root"]')?.scrollIntoView({ block: "nearest" });
    }
  }, []);
  useEffect(() => { selection.current = selectedId; highlight(true); }, [selectedId, highlight]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => () => { cleanup.current?.(); }, []);
  const attachPreview = (): void => {
    cleanup.current?.(); const parsed = frame.current?.contentDocument; const viewport = parsed?.defaultView; if (!parsed || !viewport) return;
    viewport.scrollTo(scroll.current.x, scroll.current.y); highlight(false);
    const handleClick = (event: MouseEvent): void => {
      event.preventDefault(); if (!isElement(event.target)) return;
      const id = event.target.closest("[data-builder-block-id]")?.getAttribute("data-builder-block-id");
      if (id) onSelectRef.current(id);
    };
    const rememberScroll = (): void => { scroll.current = { x: viewport.scrollX, y: viewport.scrollY }; };
    parsed.addEventListener("click", handleClick, true); viewport.addEventListener("scroll", rememberScroll, { passive: true });
    cleanup.current = () => { parsed.removeEventListener("click", handleClick, true); viewport.removeEventListener("scroll", rememberScroll); };
  };
  return <section className="html-editor-preview-pane">
    <div className="html-editor-pane-heading"><strong>Xem trước các block</strong><div className="html-editor-preview-controls">
      <label><input type="checkbox" checked={live} onChange={(event) => onLiveChange(event.target.checked)} /> Trực tiếp</label>
      <button onClick={onRun} title="Cập nhật preview"><Play size={14} /> Chạy</button>
      <button aria-label="Xem trên máy tính" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><Monitor size={15} /></button>
      <button aria-label="Xem trên điện thoại" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}><Smartphone size={15} /></button>
    </div></div>
    <div className="html-editor-preview-caption">Nhấp vào một block để chọn và sửa mã của component đó.</div>
    <div className="html-editor-preview-scroll"><iframe ref={frame} title="Xem trước các block và chọn component" className={`html-editor-frame ${device === "mobile" ? "html-editor-frame-mobile" : ""}`} sandbox="allow-same-origin" referrerPolicy="no-referrer" srcDoc={html} onLoad={attachPreview} /></div>
  </section>;
};
export default BlockPreview;
