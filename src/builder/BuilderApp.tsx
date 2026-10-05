"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  Blocks,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clapperboard,
  Columns2,
  Copy,
  Download,
  Eye,
  FileText,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  LayoutTemplate,
  Link2,
  Megaphone,
  Menu,
  Monitor,
  MoreHorizontal,
  Plus,
  Redo2,
  RotateCcw,
  Rss,
  Settings2,
  Smartphone,
  PanelTop,
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
  documentSchema,
  getBlockSource,
} from "./model";
import { useBuilderStore } from "./store";
import * as builderApi from "./builderApi";
import type { BlockData } from "./builderApi";
import type { Category } from "@/lib/supabase";

const paletteIcons = {
  hero:     ImageIcon,
  news:     LayoutGrid,
  notice:   Megaphone,
  stats:    Blocks,
  links:    Link2,
  text:     Type,
  gallery:  ImageIcon,
  ticker:   Rss,
  featured: LayoutTemplate,
  video:    Clapperboard,
  events:   CalendarDays,
  tabs:     PanelTop,
  columns:  Columns2,
};

/** Hiển thị một loại khối trong thư viện để thêm bằng nút hoặc kéo thả. */
function PaletteItem({ kind }: { kind: BlockKind }) {
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
}

/** Hiển thị một khối cùng các thao tác chọn, sắp xếp, nhân bản và xóa. */
function SortableBlock({
  block,
  selected,
  index,
  total,
  onSelect,
  data,
}: {
  block: BuilderBlock;
  selected: boolean;
  index: number;
  total: number;
  onSelect: () => void;
  data?: BlockData;
}) {
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
}

/** Ghép các khối theo thứ tự hiện tại và tạo vùng thả cho canvas. */
function EditorCanvas({
  onSelect,
  dataByBlock,
}: {
  onSelect: () => void;
  dataByBlock: Record<string, BlockData>;
}) {
  const blocks = useBuilderStore((state) => state.document.blocks);
  const add = useBuilderStore((state) => state.add);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  return (
    <div
      ref={setNodeRef}
      className={`editor-canvas ${isOver ? "canvas-over" : ""}`}
    >
      <PortalChrome>
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
}

/** Hiển thị thuộc tính trang hoặc khối đang chọn và cập nhật chúng trong store. */
function Inspector({
  mobileOpen,
  onClose,
  categories,
}: {
  mobileOpen: boolean;
  onClose: () => void;
  categories: Category[];
}) {
  const selectedId = useBuilderStore((state) => state.selectedId);
  const block = useBuilderStore((state) =>
    state.document.blocks.find((item) => item.id === selectedId),
  );
  const update = useBuilderStore((state) => state.update);
  const remove = useBuilderStore((state) => state.remove);
  const duplicate = useBuilderStore((state) => state.duplicate);
  const setSlotCount = useBuilderStore((state) => state.setSlotCount);
  const name = useBuilderStore((state) => state.document.name);
  const rename = useBuilderStore((state) => state.rename);
  const moveNode = useBuilderStore((state) => state.moveNode);

  if (!block)
    return (
      <aside className={`inspector ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="panel-header">
          <div>
            <span className="panel-kicker">THIẾT LẬP</span>
            <h2>Thuộc tính trang</h2>
          </div>
          <button
            className="mobile-close"
            onClick={onClose}
            aria-label="Đóng thuộc tính"
          >
            <X size={18} />
          </button>
          <MoreHorizontal className="inspector-settings-icon" size={19} />
        </div>
        <div className="inspector-body">
          <div className="selection-empty">
            <div>
              <Settings2 size={24} />
            </div>
            <strong>Chọn một khối nội dung</strong>
            <p>
              Nhấp vào một thành phần trên trang để chỉnh sửa nội dung và màu
              sắc.
            </p>
          </div>
          <label className="field-label" htmlFor="page-name">
            Tên trang
          </label>
          <input
            id="page-name"
            className="field-input"
            value={name}
            onChange={(event) => rename(event.target.value)}
            maxLength={100}
          />
          <div className="inspector-hint">
            <CircleHelp size={15} />
            <span>
              Bản nháp được lưu trên trình duyệt. Nhấn “Lưu vào DB” để đồng bộ
              Supabase.
            </span>
          </div>
        </div>
      </aside>
    );

  const hasItems =
    ["news", "notice", "stats", "links", "gallery"].includes(block.kind) &&
    !block.dataSource;
  // tabs block dùng items làm tên tab
  const hasTabItems = block.kind === "tabs";
  const isColumnsBlock = block.kind === "columns";
  const source = getBlockSource(block);
  const isArticleBlock = ["news", "notice", "ticker", "featured", "video", "events", "tabs"].includes(block.kind);
  const isRepeatBlock = [
    "news", "notice", "stats", "links", "gallery",
    "ticker", "featured", "video", "events", "tabs",
  ].includes(block.kind);
  // Variant & columns
  const blockVariant = block.variant ?? "";
  const variantOptions: Partial<Record<typeof block.kind, { value: string; label: string }[]>> = {
    featured: [
      { value: "classic", label: "Ảnh lớn + danh sách" },
      { value: "grid",    label: "Lưới nhiều cột" },
    ],
    video: [
      { value: "sidebar", label: "Video lớn + danh sách" },
      { value: "grid",    label: "Lưới thumbnail" },
    ],
    events: [
      { value: "timeline", label: "Dòng thời gian" },
      { value: "cards",    label: "Thẻ sự kiện" },
    ],
    tabs: [
      { value: "underline", label: "Gạch chân" },
      { value: "pills",     label: "Viên nật (pills)" },
    ],
  };
  const currentVariantOpts = variantOptions[block.kind as keyof typeof variantOptions];
  const hasVariant = !!currentVariantOpts;
  // Columns: chỉ hiện khi layout dùng grid/cards, hoặc block cũ
  const hasColumns =
    ["news", "stats", "links", "gallery"].includes(block.kind) ||
    (block.kind === "featured" && (blockVariant === "grid" || !blockVariant)) ||
    (block.kind === "video"    && (blockVariant === "grid" || !blockVariant)) ||
    (block.kind === "events"   && (blockVariant === "cards" || !blockVariant)) ||
    block.kind === "tabs";
  const isNewsArticleBlock = block.kind === "news" || block.kind === "notice";
  return (
    <aside className={`inspector ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="panel-header">
        <div>
          <span className="panel-kicker">THIẾT LẬP KHỐI</span>
          <h2>Thuộc tính</h2>
        </div>
        <button
          className="mobile-close"
          onClick={onClose}
          aria-label="Đóng thuộc tính"
        >
          <X size={18} />
        </button>
        <Settings2 className="inspector-settings-icon" size={18} />
      </div>
      <div className="inspector-body">
        <div className="selected-summary">
          <span className="summary-icon">
            {(() => {
              const Icon = paletteIcons[block.kind] || CircleHelp;
              return <Icon size={18} />;
            })()}
          </span>
          <span>
            <strong>{blockCatalog[block.kind]?.label || block.kind}</strong>
            <small>Đang chọn trên trang</small>
          </span>
          <Check size={16} />
        </div>
        <div className="inspector-section">
          <div className="inspector-section-heading">
            NỘI DUNG <ChevronDown size={14} />
          </div>
          <label className="field-label" htmlFor="eyebrow">
            Nhãn nhỏ
          </label>
          <input
            id="eyebrow"
            className="field-input"
            value={block.eyebrow}
            maxLength={100}
            onChange={(event) =>
              update(block.id, { eyebrow: event.target.value })
            }
          />
          <label className="field-label" htmlFor="title">
            Tiêu đề
          </label>
          <input
            id="title"
            className="field-input"
            value={block.title}
            maxLength={200}
            onChange={(event) =>
              update(block.id, { title: event.target.value })
            }
          />
          <label className="field-label" htmlFor="description">
            Mô tả
          </label>
          <textarea
            id="description"
            className="field-input field-textarea"
            value={block.description}
            maxLength={1000}
            onChange={(event) =>
              update(block.id, { description: event.target.value })
            }
            rows={4}
          />
          {hasItems && (
            <>
              <label className="field-label" htmlFor="items">
                Nội dung dự phòng <small>(mỗi dòng một mục)</small>
              </label>
              <textarea
                id="items"
                className="field-input field-textarea items-textarea"
                value={block.items.join("\n")}
                onChange={(event) =>
                  update(block.id, {
                    items: event.target.value.split("\n").slice(0, 8),
                  })
                }
                rows={5}
              />
            </>
          )}
        </div>
        {/* ── Columns block: cấu hình số cột ── */}
        {isColumnsBlock && (
          <div className="inspector-section">
            <div className="inspector-section-heading">
              BỐ CỤC LƯỚI CỘT <ChevronDown size={14} />
            </div>
            <label className="field-label" htmlFor="col-count">
              Số cột
            </label>
            <div className="col-count-btns">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  id={`col-count-${n}`}
                  className={`col-count-btn${(block.dataSource?.columns ?? 2) === n ? " active" : ""}`}
                  onClick={() => setSlotCount(block.id, n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <label className="field-label" htmlFor="col-gap">
              Khoảng cách cột (px)
            </label>
            <input
              id="col-gap"
              className="field-input"
              type="number"
              value={block.dataSource?.gap ?? 16}
              onChange={(e) => update(block.id, { dataSource: { ...source, gap: Number(e.target.value) } })}
            />
            
            <label className="field-label" htmlFor="col-ratio">
              Tỷ lệ cột (vd: 1fr 2fr 1fr)
            </label>
            <input
              id="col-ratio"
              className="field-input"
              type="text"
              placeholder="VD: 1fr 1fr"
              value={block.dataSource?.gridTemplate || ""}
              onChange={(e) => update(block.id, { dataSource: { ...source, gridTemplate: e.target.value } })}
            />

            <label className="field-label" htmlFor="col-padding">
              Padding (px)
            </label>
            <input
              id="col-padding"
              className="field-input"
              type="number"
              value={block.dataSource?.padding ?? 0}
              onChange={(e) => update(block.id, { dataSource: { ...source, padding: Number(e.target.value) } })}
            />

            <label className="field-label" htmlFor="col-bg">
              Màu nền
            </label>
            <input
              id="col-bg"
              className="field-input"
              type="text"
              placeholder="Ví dụ: #f8fafc"
              value={block.dataSource?.backgroundColor || ""}
              onChange={(e) => update(block.id, { dataSource: { ...source, backgroundColor: e.target.value } })}
            />
          </div>
        )}
        <div className="inspector-section">
          <div className="inspector-section-heading">
            NGUỒN DỮ LIỆU <ChevronDown size={14} />
          </div>
          <p className="field-help">
            {isArticleBlock
              ? "Bài viết từ bảng articles."
              : `Nội dung ${blockCatalog[block.kind]?.label?.toLowerCase() || block.kind} từ bảng content_entries.`}{" "}
            Nếu DB chưa sẵn sàng, khối dùng nội dung mẫu.
          </p>
          {isNewsArticleBlock && (
            <>
              <label className="field-label" htmlFor="source-category">
                Chuyên mục
              </label>
              <select
                id="source-category"
                className="field-input"
                value={source.categorySlug}
                onChange={(event) =>
                  update(block.id, {
                    dataSource: { ...source, categorySlug: event.target.value },
                  })
                }
              >
                <option value="">Tất cả chuyên mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <label className="field-label" htmlFor="source-mode">
                Cách lấy bài
              </label>
              <select
                id="source-mode"
                className="field-input"
                value={source.mode}
                onChange={(event) =>
                  update(block.id, {
                    dataSource: {
                      ...source,
                      mode: event.target.value as "latest" | "hot",
                    },
                  })
                }
              >
                <option value="latest">Mới nhất</option>
                <option value="hot">Nổi bật / đọc nhiều</option>
              </select>
            </>
          )}
          {hasTabItems && (
            <>
              <label className="field-label" htmlFor="tab-names">
                Tên các tab <small>(mỗi dòng một tab, tối đa 4)</small>
              </label>
              <textarea
                id="tab-names"
                className="field-input field-textarea"
                value={block.items.join("\n")}
                onChange={(event) =>
                  update(block.id, {
                    items: event.target.value.split("\n").slice(0, 4),
                  })
                }
                rows={4}
              />
            </>
          )}
          {isRepeatBlock && (
            <>
              <label className="field-label" htmlFor="source-limit">
                Số mục hiển thị
              </label>
              <input
                id="source-limit"
                className="field-input"
                type="number"
                min={1}
                max={12}
                value={source.limit}
                onChange={(event) =>
                  update(block.id, {
                    dataSource: {
                      ...source,
                      limit: Math.min(
                        12,
                        Math.max(1, Number(event.target.value) || 1),
                      ),
                    },
                  })
                }
              />
            </>
          )}
          {hasColumns && (
            <>
              <label className="field-label" htmlFor="source-columns">
                Số cột trên máy tính
              </label>
              <select
                id="source-columns"
                className="field-input"
                value={source.columns ?? 3}
                onChange={(event) =>
                  update(block.id, {
                    dataSource: {
                      ...source,
                      columns: Number(event.target.value),
                    },
                  })
                }
              >
                {[1, 2, 3, 4].map((number) => (
                  <option key={number} value={number}>
                    {number} cột
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className="inspector-section">
          <div className="inspector-section-heading">
            GIAO DIỆN <ChevronDown size={14} />
          </div>
          {hasVariant && currentVariantOpts && (
            <>
              <label className="field-label" htmlFor="block-variant">
                Kiểu layout
              </label>
              <div className="variant-options">
                {currentVariantOpts.map((opt) => (
                  <button
                    key={opt.value}
                    id={`variant-${opt.value}`}
                    className={`variant-btn${(blockVariant || currentVariantOpts[0].value) === opt.value ? " variant-btn-active" : ""}`}
                    onClick={() => update(block.id, { variant: opt.value })}
                    title={opt.label}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
          <span className="field-label">Màu nhấn</span>
          <div className="color-options">
            {(["blue", "red", "green"] as const).map((accent) => (
              <button
                key={accent}
                className={`color-option color-${accent} ${block.accent === accent ? "active" : ""}`}
                onClick={() => update(block.id, { accent })}
                title={
                  accent === "blue"
                    ? "Xanh dương"
                    : accent === "red"
                      ? "Đỏ"
                      : "Xanh lá"
                }
                aria-label={`Chọn màu ${accent}`}
              />
            ))}
          </div>
        </div>
        <div className="inspector-actions">
          <button onClick={() => duplicate(block.id)}>
            <Copy size={15} /> Nhân bản
          </button>
          <button onClick={() => remove(block.id)}>
            <Trash2 size={15} /> Xóa khối
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Điều phối trạng thái trình biên tập, dữ liệu API và các thao tác người dùng. */
export default function BuilderApp() {
  const document = useBuilderStore((state) => state.document);
  const pastLength = useBuilderStore((state) => state.past.length);
  const futureLength = useBuilderStore((state) => state.future.length);
  const add = useBuilderStore((state) => state.add);
  const move = useBuilderStore((state) => state.move);
  const undo = useBuilderStore((state) => state.undo);
  const redo = useBuilderStore((state) => state.redo);
  const reset = useBuilderStore((state) => state.reset);
  const load = useBuilderStore((state) => state.load);
  const [hydrated, setHydrated] = useState(false);
  const [preview, setPreview] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
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
            <span className="rail-active" title="Thành phần">
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
          <aside className="palette-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">THƯ VIỆN</span>
                <h2>Thành phần</h2>
              </div>
              <Menu size={18} />
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
                <span className="toolbar-dot" />
                <strong>Trình dựng trang</strong>
                <span className="draft-badge">BẢN NHÁP</span>
              </div>
              <div className="toolbar-actions">
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
              >
                <div className="canvas-frame-label">
                  <span>
                    <span className="frame-live-dot" /> Trang chủ
                  </span>
                  <span>
                    {device === "mobile" ? "375 px" : "Desktop"}{" "}
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
            <div className={`canvas-frame ${device === "mobile" ? "mobile-frame" : ""}`}>
              {previewPage}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
