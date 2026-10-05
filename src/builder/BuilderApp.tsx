"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  Blocks,
  Check,
  ChevronDown,
  CircleHelp,
  Download,
  Eye,
  FileText,
  LayoutGrid,
  LayoutTemplate,
  Link2,
  Megaphone,
  Monitor,
  MoreHorizontal,
  Redo2,
  RotateCcw,
  Settings2,
  Smartphone,
  PanelTop,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Type,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { BlockRenderer } from "./BlockRenderer";
import { Button } from "@/components/ui/button";
import { PortalChrome } from "./PortalChrome";
import {
  blockCatalog,
  blockKinds,
  BlockKind,
  BuilderBlock,
  DEFAULT_PAGE_WIDTH,
  documentSchema,
  findBlock,
  getBlockSource,
  type TextStyle,
  type TextStyleTarget,
} from "./model";
import {
  ColorPalette,
  defaultAccentColors,
  PageWidthControl,
  TextStyleControls,
  FontPicker,
} from "./InspectorControls";
import { useBuilderStore } from "./store";
import * as builderApi from "./builderApi";
import type { BlockData } from "./builderApi";
import type { Category } from "@/lib/supabase";
import EditorCanvas from "./components/EditorCanvas";
import Inspector from "./components/Inspector";
import PaletteItem from "./components/PaletteItem";
import paletteIcons from "./components/paletteIcons";

/** Điều phối trạng thái trình biên tập, dữ liệu API và các thao tác người dùng. */
const BuilderApp = () => {
  const document = useBuilderStore((state) => state.document);
  const pastLength = useBuilderStore((state) => state.past.length);
  const futureLength = useBuilderStore((state) => state.future.length);
  const undo = useBuilderStore((state) => state.undo);
  const redo = useBuilderStore((state) => state.redo);
  const reset = useBuilderStore((state) => state.reset);
  const load = useBuilderStore((state) => state.load);
  const [hydrated, setHydrated] = useState(false);
  const [preview, setPreview] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  // Trạng thái đóng/mở của thư viện thành phần để nhường chỗ cho vùng chỉnh sửa.
  const [paletteOpen, setPaletteOpen] = useState(true);
  const pageWidth = useBuilderStore((state) => state.document.pageWidth ?? DEFAULT_PAGE_WIDTH);
  const setPageWidth = useBuilderStore((state) => state.setPageWidth);
  const themeFont = useBuilderStore((state) => state.document.themeFont);
  const setThemeFont = useBuilderStore((state) => state.setThemeFont);
  const [draggingKind, setDraggingKind] = useState<BlockKind | null>(null);
  const [message, setMessage] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dataByBlock, setDataByBlock] = useState<Record<string, BlockData>>({});
  const fileInput = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Khôi phục bản nháp cục bộ; chỉ tải trang công khai khi trình duyệt chưa có bản nháp.
  useEffect(() => {
    const existingLocalDraft = Boolean(
      localStorage.getItem("moet-visual-builder-demo-v1"),
    );
    void Promise.resolve(useBuilderStore.persist.rehydrate()).then(() => {
      setHydrated(true);
      if (!existingLocalDraft) {
        const initialDocument = useBuilderStore.getState().document;
        void builderApi
          .getPublishedPage(AbortSignal.timeout(6000))
          .then((page) => {
            if (useBuilderStore.getState().document === initialDocument)
              useBuilderStore.getState().load(page);
          })
          .catch(() => {
            /* Giữ bố cục cục bộ khi Supabase chưa sẵn sàng. */
          });
      }
    });
  }, []);

  // Tải chuyên mục sau khi store đã khôi phục để Inspector hiển thị lựa chọn nguồn tin.
  useEffect(() => {
    if (!hydrated) return;
    void builderApi
      .getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [hydrated]);

  // Theo dõi cấu hình nguồn thay vì toàn bộ nội dung để tránh gọi API khi chỉ sửa tiêu đề.
  const blockSourceKey = JSON.stringify(
    document.blocks.map((block) => [
      block.id,
      block.kind,
      getBlockSource(block),
    ]),
  );
  // Tải lại dữ liệu từng khối khi loại khối hoặc cấu hình nguồn dữ liệu thay đổi.
  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    const blocks = useBuilderStore.getState().document.blocks;
    void Promise.all(
      blocks.map(async (block) => {
        try {
          return [
            block.id,
            await builderApi.getBlockData(block, controller.signal),
          ] as const;
        } catch {
          return [block.id, {}] as const;
        }
      }),
    ).then((entries) => {
      if (!controller.signal.aborted)
        setDataByBlock(Object.fromEntries(entries));
    });
    return () => controller.abort();
  }, [hydrated, blockSourceKey]);

  /** Tải bản nháp DB và cập nhật tài liệu đang sửa. */
  async function loadFromDatabase() {
    setActionBusy(true);
    try {
      load(await builderApi.getDraftPage());
      setMessage("Đã tải bản nháp từ Supabase.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không thể tải bản nháp.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  /** Lưu bản nháp, rồi xuất bản nếu người dùng chọn thao tác xuất bản. */
  async function saveToDatabase(publish = false) {
    setActionBusy(true);
    try {
      await builderApi.saveDraft(document);
      if (publish) await builderApi.publishDraft();
      setMessage(
        publish
          ? "Đã xuất bản. Mở /site để xem."
          : "Đã lưu bản nháp vào Supabase.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không thể lưu Supabase.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  /** Hiển thị bản xem trước của loại khối đang được kéo từ thư viện. */
  function onDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    setDraggingKind(
      id.startsWith("palette:") ? (id.slice(8) as BlockKind) : null,
    );
  }

  /** Thêm khối mới hoặc chuyển vị trí khối đã có sau khi thả. */
  function onDragEnd(event: DragEndEvent) {
    setDraggingKind(null);
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || overId.startsWith("palette:")) return;

    useBuilderStore.getState().moveNode(activeId, overId);
  }

  /** Tải bố cục hiện tại xuống máy dưới dạng JSON. */
  function exportJson() {
    const blob = new Blob([JSON.stringify(document, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = "bo-cuc-trang-chu.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Đã tải xuống bố cục JSON.");
  }

  /** Đọc tệp JSON, kiểm tra cấu trúc rồi nạp bố cục hợp lệ vào store. */
  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = documentSchema.safeParse(JSON.parse(await file.text()));
      if (!parsed.success)
        throw new Error("Tệp JSON không đúng cấu trúc của demo.");
      load(parsed.data);
      setMessage("Đã nhập bố cục thành công.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không thể đọc tệp JSON.",
      );
    }
  }

  const previewPage = (
    <PortalChrome>
      {document.blocks.map((block) => (
        <BlockRenderer
          block={block}
          {...dataByBlock[block.id]}
          isEditor={false}
          key={block.id}
        />
      ))}
    </PortalChrome>
  );

  if (!hydrated)
    return (
      <div className="app-loading">
        <span className="app-logo-mark">
          <Blocks size={21} />
        </span>
        <strong>MOET Builder</strong>
        <small>Đang tải bản nháp...</small>
      </div>
    );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-logo">
          <span className="app-logo-mark">
            <Blocks size={21} strokeWidth={2.2} />
          </span>
          <span>
            MOET <b>Builder</b>
          </span>
        </div>
        <div className="header-divider" />
        <div className="document-location">
          <span>Giao diện trang</span>
          <span className="breadcrumb-chevron">/</span>
          <strong>{document.name}</strong>
          <ChevronDown size={14} />
        </div>
        <div className="header-spacer" />
        <span className="save-status">
          <span />
          {hydrated ? "Đã lưu trên trình duyệt" : "Đang tải bản nháp"}
        </span>
        <button
          className="header-icon"
          onClick={undo}
          disabled={!pastLength}
          title="Hoàn tác"
          aria-label="Hoàn tác"
        >
          <Undo2 size={18} />
        </button>
        <button
          className="header-icon"
          onClick={redo}
          disabled={!futureLength}
          title="Làm lại"
          aria-label="Làm lại"
        >
          <Redo2 size={18} />
        </button>
        <div className="header-divider" />
        <button className="outline-button" onClick={() => setPreview(true)}>
          <Eye size={16} /> Xem trước
        </button>
        <Link className="outline-button published-link" href="/site">
          <Eye size={16} /> Trang đã xuất bản
        </Link>
        {/* <button className="outline-button" onClick={() => void saveToDatabase(false)} disabled={actionBusy}>Lưu vào DB</button> */}
        <Button
          className="primary-button"
          onClick={() => void saveToDatabase(true)}
          disabled={actionBusy}
        >
          Xuất bản
        </Button>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={(args) => {
          const hits = pointerWithin(args);
          const blocks = hits.filter(
            (hit) =>
              hit.id !== "canvas" && !String(hit.id).startsWith("palette:"),
          );
          return blocks.length
            ? blocks
            : hits.length
              ? hits
              : rectIntersection(args);
        }}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDraggingKind(null)}
      >
        <div className="workspace">
          <nav className="icon-rail" aria-label="Điều hướng trình dựng trang">
            <span
              className={paletteOpen ? "rail-active" : ""}
              role="button"
              tabIndex={0}
              title={paletteOpen ? "Đóng thư viện thành phần" : "Mở thư viện thành phần"}
              onClick={() => setPaletteOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") setPaletteOpen((open) => !open);
              }}
            >
              <LayoutGrid size={19} />
            </span>
            <span title="Trang">
              <FileText size={19} />
            </span>
            <span title="Thiết lập">
              <Settings2 size={19} />
            </span>
            <div className="rail-spacer" />
            <span title="Trợ giúp">
              <CircleHelp size={19} />
            </span>
          </nav>
          <aside className={`palette-panel ${paletteOpen ? "" : "collapsed"}`} aria-hidden={!paletteOpen}>
            <div className="panel-header">
              <div>
                <span className="panel-kicker">THƯ VIỆN</span>
                <h2>Thành phần</h2>
              </div>
              <button
                className="palette-collapse"
                title="Đóng thư viện thành phần"
                aria-label="Đóng thư viện thành phần"
                onClick={() => setPaletteOpen(false)}
              >
                <PanelLeftClose size={18} />
              </button>
            </div>
            <div className="palette-body">
              <p className="palette-intro">
                Kéo thả hoặc nhấn <strong>+</strong> để thêm vào trang.
              </p>
              {/* Nhóm theo danh mục giống WordPress Gutenberg */}
              {(["Trang chủ", "Tin tức", "Đa phương tiện", "Tiện ích", "Điều hướng", "Cơ bản"] as const).map((cat) => {
                const kinds = blockKinds.filter((k) => blockCatalog[k].category === cat);
                if (!kinds.length) return null;
                return (
                  <div key={cat} className="palette-category">
                    <div className="palette-group-title">
                      {cat.toUpperCase()} <span>{kinds.length}</span>
                    </div>
                    <div className="palette-list">
                      {kinds.map((kind) => (
                        <PaletteItem key={kind} kind={kind} />
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="palette-tip">
                <span>✦</span>
                <strong>Mẹo nhỏ</strong>
                <p>
                  Kéo trực tiếp vào vị trí bất kỳ trên canvas để chèn khối vào đúng chỗ.
                </p>
              </div>
            </div>
          </aside>


          <section className="main-workspace" aria-label="Vùng chỉnh sửa trang">
            <div className="workspace-toolbar">
              <div className="toolbar-title">
                <button
                  className="toolbar-more"
                  title={paletteOpen ? "Đóng thư viện thành phần" : "Mở thư viện thành phần"}
                  aria-label={paletteOpen ? "Đóng thư viện thành phần" : "Mở thư viện thành phần"}
                  aria-expanded={paletteOpen}
                  onClick={() => setPaletteOpen((open) => !open)}
                >
                  {paletteOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                </button>
                <span className="toolbar-dot" />
                <strong>Trình dựng trang</strong>
                <span className="draft-badge">BẢN NHÁP</span>
              </div>
              <div className="toolbar-actions">
                <span className="toolbar-label">Độ rộng trang</span>
                <PageWidthControl
                  value={pageWidth}
                  onChange={setPageWidth}
                  disabled={device === "mobile"}
                />
                <span className="toolbar-label">Font chung</span>
                <div style={{ width: 140 }}>
                  <FontPicker id="toolbar-theme-font" value={themeFont} onChange={setThemeFont} />
                </div>
                <span className="toolbar-label">Thiết bị</span>
                <div className="device-switch">
                  <button
                    className={device === "desktop" ? "active" : ""}
                    title="Màn hình máy tính"
                    aria-label="Màn hình máy tính"
                    onClick={() => setDevice("desktop")}
                  >
                    <Monitor size={17} />
                  </button>
                  <button
                    className={device === "mobile" ? "active" : ""}
                    title="Điện thoại"
                    aria-label="Điện thoại"
                    onClick={() => setDevice("mobile")}
                  >
                    <Smartphone size={17} />
                  </button>
                </div>
                <span className="zoom-label">100%</span>
                <button
                  className="toolbar-more"
                  title="Thêm tùy chọn"
                  aria-label="Thêm tùy chọn"
                  onClick={() => {
                    reset();
                    setMessage("Đã khôi phục bố cục mẫu. Có thể hoàn tác.");
                  }}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
            <div className="canvas-scroll">
              <div
                className={`canvas-frame ${device === "mobile" ? "mobile-frame" : ""}`}
                style={device === "mobile" ? undefined : { width: `min(100%, ${pageWidth}px)` }}
              >
                <div className="canvas-frame-label">
                  <span>
                    <span className="frame-live-dot" /> Trang chủ
                  </span>
                  <span>
                    {device === "mobile" ? "375 px" : `${pageWidth} px`}{" "}
                    <MoreHorizontal size={16} />
                  </span>
                </div>
                <EditorCanvas
                  onSelect={() => setMobileInspectorOpen(true)}
                  dataByBlock={dataByBlock}
                />
              </div>
              <div className="canvas-help">
                Kéo thả để thay đổi thứ tự · Nhấp vào khối để chỉnh sửa
              </div>
            </div>
          </section>
          <Inspector
            mobileOpen={mobileInspectorOpen}
            onClose={() => setMobileInspectorOpen(false)}
            categories={categories}
          />
        </div>
        <DragOverlay dropAnimation={null}>
          {draggingKind && (
            <div className="drag-overlay">
              <span className="palette-icon">
                {(() => {
                  const Icon = paletteIcons[draggingKind] || CircleHelp;
                  return <Icon size={18} />;
                })()}
              </span>
              <strong>{blockCatalog[draggingKind]?.label || draggingKind}</strong>
            </div>
          )}
        </DragOverlay>
      </DndContext>
      <button
        className="mobile-inspector-toggle"
        onClick={() => setMobileInspectorOpen(true)}
      >
        <Settings2 size={16} /> Thuộc tính
      </button>

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={importJson}
      />
      <div className="bottom-tools">
        <button onClick={() => fileInput.current?.click()}>
          <Upload size={15} /> Nhập JSON
        </button>
        <span />{" "}
        <button onClick={exportJson}>
          <Download size={15} /> Xuất JSON
        </button>
        <span />
        <button onClick={reset}>
          <RotateCcw size={15} /> Khôi phục mẫu
        </button>
        <div className="bottom-spacer" />
        <button onClick={() => void loadFromDatabase()} disabled={actionBusy}>
          Tải bản nháp từ DB
        </button>
      </div>
      {message && (
        <div role="status" className="toast">
          <Check size={16} />
          {message}
          <button onClick={() => setMessage("")} aria-label="Đóng thông báo">
            <X size={15} />
          </button>
        </div>
      )}

      {preview && (
        <div
          className="preview-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Xem trước trang"
        >
          <div className="preview-header">
            <div>
              <span className="preview-mark">
                <Eye size={18} />
              </span>
              <strong>Xem trước trang</strong>
              <span className="preview-badge">BẢN NHÁP</span>
            </div>
            <div className="toolbar-actions" style={{ marginLeft: "auto", marginRight: "16px" }}>
              <span className="toolbar-label">Thiết bị</span>
              <div className="device-switch">
                <button
                  className={device === "desktop" ? "active" : ""}
                  title="Màn hình máy tính"
                  aria-label="Màn hình máy tính"
                  onClick={() => setDevice("desktop")}
                >
                  <Monitor size={17} />
                </button>
                <button
                  className={device === "mobile" ? "active" : ""}
                  title="Điện thoại"
                  aria-label="Điện thoại"
                  onClick={() => setDevice("mobile")}
                >
                  <Smartphone size={17} />
                </button>
              </div>
            </div>
            <button
              className="outline-button"
              onClick={() => setPreview(false)}
            >
              <X size={16} /> Đóng xem trước
            </button>
          </div>
          <div className="preview-scroll">
            <div
              className={`canvas-frame ${device === "mobile" ? "mobile-frame" : ""}`}
              style={device === "mobile" ? undefined : { width: `min(100%, ${pageWidth}px)` }}
            >
              {previewPage}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuilderApp;
