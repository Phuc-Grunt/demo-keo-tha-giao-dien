import { Check, ChevronDown, CircleHelp, Copy, MoreHorizontal, Settings2, Trash2, X } from "lucide-react";
import type { Category } from "@/lib/supabase";
import { blockCatalog, getBlockSource, findBlock, getPageWidth, itemsFromStrings } from "../../../domain/model";
import type { TextStyle, TextStyleTarget, BuilderBlock } from "../../../domain/model";
import { itemStrings } from "../../../renderer/blocks/types";
import { useBuilderStore } from "../../store";
import { ColorPalette, PageWidthControl, TextStyleControls, defaultAccentColors, FontPicker } from "./InspectorControls";
import paletteIcons from "../paletteIcons";

interface InspectorProps {
  mobileOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

interface VariantOption {
  value: string;
  label: string;
}

/** Hiển thị thuộc tính trang hoặc khối đang chọn và cập nhật chúng trong store. */
const Inspector = ({
  mobileOpen,
  onClose,
  categories,
}: InspectorProps) => {
  const selectedId = useBuilderStore((state) => state.selectedId);
  const block = useBuilderStore((state) =>
    selectedId ? findBlock(state.document.blocks, selectedId) : undefined
  );
  const update = useBuilderStore((state) => state.update);
  const updateContent = useBuilderStore((state) => state.updateContent);
  const updateTheme = useBuilderStore((state) => state.updateTheme);
  const updateSource = useBuilderStore((state) => state.updateSource);
  const remove = useBuilderStore((state) => state.remove);
  const duplicate = useBuilderStore((state) => state.duplicate);
  const setSlotCount = useBuilderStore((state) => state.setSlotCount);
  const name = useBuilderStore((state) => state.document.meta.name);
  const rename = useBuilderStore((state) => state.rename);
  const pageWidth = useBuilderStore((state) => getPageWidth(state.document));
  const setPageWidth = useBuilderStore((state) => state.setPageWidth);
  const themeColor = useBuilderStore((state) => state.document.theme.primaryColor);
  const setThemeColor = useBuilderStore((state) => state.setThemeColor);
  const themeFont = useBuilderStore((state) => state.document.theme.fontFamily);
  const setThemeFont = useBuilderStore((state) => state.setThemeFont);

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
          <label className="field-label" htmlFor="page-width">
            Độ rộng trang <small>(px)</small>
          </label>
          <PageWidthControl value={pageWidth} onChange={setPageWidth} showPresets />
          <p className="field-help">
            Áp dụng cho trình dựng, bản xem trước và trang đã xuất bản.
          </p>

          <label className="field-label" htmlFor="page-theme">
            Màu giao diện chung
          </label>
          <ColorPalette id="page-theme" value={themeColor || ""} onChange={setThemeColor} />
          <p className="field-help">
            Màu chủ đạo cho trang web, có thể dùng làm nền hoặc màu nhấn.
          </p>

          <label className="field-label" htmlFor="page-theme-font">
            Font chữ giao diện chung
          </label>
          <FontPicker id="page-theme-font" value={themeFont} onChange={setThemeFont} />
          <p className="field-help">
            Font chữ mặc định cho toàn bộ trang web.
          </p>

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
    ["news", "notice", "stats", "links", "gallery", "featured", "ticker", "video", "events", "category_list"].includes(block.kind);
  // tabs block dùng items làm tên tab
  const hasTabItems = block.kind === "tabs";
  const isColumnsBlock = block.kind === "columns";
  const source = getBlockSource(block);
  const isArticleBlock = ["news", "notice", "ticker", "featured", "video", "events", "tabs"].includes(block.kind);
  const isRepeatBlock = [
    "news", "notice", "stats", "links", "gallery",
    "ticker", "featured", "video", "events", "tabs", "category_list"
  ].includes(block.kind);

  /** Cập nhật cỡ chữ/màu chữ của một phần nội dung; xóa khóa khi quay về mặc định. */
  function updateTextStyle(target: TextStyleTarget, style: TextStyle | undefined) {
    const next = { ...block!.textStyles };
    if (style) next[target] = style;
    else delete next[target];
    update(block!.id, { textStyles: Object.keys(next).length ? next : undefined });
  }

  /** Chọn màu nhấn; nếu trùng 3 màu mặc định thì quay lại màu nhấn có sẵn. */
  function selectAccentColor(color: string) {
    const preset = (Object.keys(defaultAccentColors) as BuilderBlock["theme"]["accent"][]).find(
      (key) => defaultAccentColors[key].toLowerCase() === color.toLowerCase(),
    );
    updateTheme(block!.id, preset ? { accent: preset, accentColor: undefined } : { accentColor: color });
  }

  // Variant & columns
  const blockVariant = block.variant ?? "";
  const variantOptions: Partial<Record<typeof block.kind, VariantOption[]>> = {
    hero: [
      { value: "classic", label: "Chia đôi" },
      { value: "full", label: "Toàn màn hình" },
    ],
    featured: [
      { value: "classic", label: "Ảnh lớn + danh sách" },
      { value: "grid", label: "Lưới nhiều cột" },
    ],
    video: [
      { value: "sidebar", label: "Video lớn + danh sách" },
      { value: "grid", label: "Lưới thumbnail" },
    ],
    events: [
      { value: "timeline", label: "Dòng thời gian" },
      { value: "cards", label: "Thẻ sự kiện" },
    ],
    tabs: [
      { value: "underline", label: "Gạch chân" },
      { value: "pills", label: "Viên nật (pills)" },
    ],
  };
  const currentVariantOpts = variantOptions[block.kind as keyof typeof variantOptions];
  const hasVariant = !!currentVariantOpts;
  // Columns: chỉ hiện khi layout dùng grid/cards, hoặc block cũ
  const hasColumns =
    ["news", "stats", "links", "gallery"].includes(block.kind) ||
    (block.kind === "featured" && (blockVariant === "grid" || !blockVariant)) ||
    (block.kind === "video" && (blockVariant === "grid" || !blockVariant)) ||
    (block.kind === "events" && (blockVariant === "cards" || !blockVariant)) ||
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
        {!isColumnsBlock && (
          <div className="inspector-section">
            <div className="inspector-section-heading">
              NỘI DUNG <ChevronDown size={14} />
            </div>
            {block.kind !== "image" && block.kind !== "heading" && block.kind !== "paragraph" && (
              <>
                <label className="field-label" htmlFor="eyebrow">
                  Nhãn nhỏ
                </label>
                <input
                  id="eyebrow"
                  className="field-input"
                  value={block.content.eyebrow}
                  maxLength={100}
                  onChange={(event) =>
                    updateContent(block.id, { eyebrow: event.target.value })
                  }
                />
                <TextStyleControls
                  idPrefix="eyebrow"
                  value={block.textStyles?.eyebrow}
                  onChange={(style) => updateTextStyle("eyebrow", style)}
                />
              </>
            )}
            {block.kind !== "image" && block.kind !== "paragraph" && (
              <>
                <label className="field-label" htmlFor="title">
                  Tiêu đề
                </label>
                <input
                  id="title"
                  className="field-input"
                  value={block.content.title}
                  maxLength={200}
                  onChange={(event) =>
                    updateContent(block.id, { title: event.target.value })
                  }
                />
                {block.kind !== "heading" && (
                  <TextStyleControls
                    idPrefix="title"
                    value={block.textStyles?.title}
                    onChange={(style) => updateTextStyle("title", style)}
                  />
                )}
              </>
            )}
            {block.kind !== "image" && block.kind !== "heading" && (
              <>
                <label className="field-label" htmlFor="description">
                  Mô tả
                </label>
                <textarea
                  id="description"
                  className="field-input field-textarea"
                  value={block.content.description}
                  maxLength={1000}
                  onChange={(event) =>
                    updateContent(block.id, { description: event.target.value })
                  }
                  rows={4}
                />
                {block.kind !== "paragraph" && (
                  <TextStyleControls
                    idPrefix="description"
                    value={block.textStyles?.description}
                    onChange={(style) => updateTextStyle("description", style)}
                  />
                )}
              </>
            )}
            {hasItems && (
              <>
                <label className="field-label" htmlFor="items">
                  Nội dung dự phòng <small>(mỗi dòng một mục)</small>
                </label>
                <textarea
                  id="items"
                  className="field-input field-textarea items-textarea"
                  value={itemStrings(block).join("\n")}
                  onChange={(event) =>
                    updateContent(block.id, {
                      items: itemsFromStrings(block.kind, block.id, event.target.value.split("\n").slice(0, 12), block.content.items),
                    })
                  }
                  rows={5}
                />
              </>
            )}
            {(block.kind === "hero" || block.kind === "image") && (
              <>
                <label className="field-label" htmlFor="imageUrl">
                  Hình ảnh (URL)
                </label>
                <input
                  id="imageUrl"
                  className="field-input"
                  type="text"
                  placeholder="https://..."
                  value={block.content.imageUrl || ""}
                  onChange={(event) => updateContent(block.id, { imageUrl: event.target.value })}
                />
                <label className="field-label" htmlFor="imageUpload">
                  Tải ảnh lên (Từ máy tính)
                </label>
                <input
                  id="imageUpload"
                  className="field-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          updateContent(block.id, { imageUrl: ev.target.result as string });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </>
            )}
          </div>
        )}
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
                  className={`col-count-btn${(source.columns ?? 2) === n ? " active" : ""}`}
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
              value={source.gap ?? 16}
              onChange={(e) => updateSource(block.id, { ...source, gap: Number(e.target.value) })}
            />

            <label className="field-label" htmlFor="col-ratio">
              Tỷ lệ cột (vd: 1fr 2fr 1fr)
            </label>
            <input
              id="col-ratio"
              className="field-input"
              type="text"
              placeholder="VD: 1fr 1fr"
              value={source.gridTemplate || ""}
              onChange={(e) => updateSource(block.id, { ...source, gridTemplate: e.target.value })}
            />

            <label className="field-label" htmlFor="col-padding">
              Padding (px)
            </label>
            <input
              id="col-padding"
              className="field-input"
              type="number"
              value={source.padding ?? 0}
              onChange={(e) => updateSource(block.id, { ...source, padding: Number(e.target.value) })}
            />

            <label className="field-label" htmlFor="col-bg">
              Màu nền
            </label>
            <ColorPalette
              id="col-bg"
              value={source.backgroundColor || ""}
              onChange={(color) => updateSource(block.id, { ...source, backgroundColor: color })}
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
                  updateSource(block.id, { ...source, categorySlug: event.target.value })
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
                  updateSource(block.id, {
                    ...source,
                    mode: event.target.value as "latest" | "hot",
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
                value={itemStrings(block).join("\n")}
                onChange={(event) =>
                  updateContent(block.id, {
                    items: itemsFromStrings(block.kind, block.id, event.target.value.split("\n").slice(0, 4), block.content.items),
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
                  updateSource(block.id, {
                    ...source,
                    limit: Math.min(
                      12,
                      Math.max(1, Number(event.target.value) || 1),
                    ),
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
                  updateSource(block.id, {
                    ...source,
                    columns: Number(event.target.value),
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
        {!isColumnsBlock && block.kind !== "image" && block.kind !== "heading" && block.kind !== "paragraph" && (
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
            {block.kind === "featured" && (
              <div style={{ marginBottom: 16 }}>
                <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: "normal" }}>
                  <input
                    type="checkbox"
                    checked={block.behavior?.slideshow?.autoplay ?? false}
                    onChange={(e) => update(block.id, { behavior: { ...block.behavior, slideshow: { autoplay: e.target.checked, intervalMs: block.behavior?.slideshow?.intervalMs ?? 3000 } } })}
                  />
                  Sử dụng chuyển tin (Slideshow)
                </label>
                {block.behavior?.slideshow?.autoplay && (
                  <div style={{ marginTop: 8 }}>
                    <label className="field-label" htmlFor="slide-interval">
                      Thời gian hiển thị (giây)
                    </label>
                    <input
                      id="slide-interval"
                      className="field-input"
                      type="number"
                      min={1}
                      max={30}
                      value={(block.behavior?.slideshow?.intervalMs ?? 3000) / 1000}
                      onChange={(e) => update(block.id, { behavior: { ...block.behavior, slideshow: { autoplay: block.behavior?.slideshow?.autoplay ?? false, intervalMs: Math.min(30000, Math.max(1000, Number(e.target.value) * 1000)) } } })}
                    />
                  </div>
                )}
              </div>
            )}
            <span className="field-label">Màu nhấn</span>
            <ColorPalette
              id="accent-color"
              value={block.theme.accentColor ?? defaultAccentColors[block.theme.accent]}
              onChange={selectAccentColor}
            />
            <label className="field-label" htmlFor="block-font">
              Font chữ riêng
            </label>
            <FontPicker
              id="block-font"
              value={block.theme.fontFamily}
              onChange={(font) => updateTheme(block.id, { fontFamily: font || undefined })}
            />
          </div>
        )}
        {block.kind === "image" && (
          <>
            <div className="inspector-section">
              <div className="inspector-section-heading">
                KÍCH THƯỚC (Dimensions) <ChevronDown size={14} />
              </div>

              <label className="field-label" htmlFor="aspect-ratio">
                TỶ LỆ (ASPECT RATIO)
              </label>
              <select
                id="aspect-ratio"
                className="field-input"
                value={block.layout?.aspectRatio || ""}
                onChange={(e) => update(block.id, { layout: { ...block.layout, aspectRatio: e.target.value || undefined } })}
              >
                <option value="">Original</option>
                <option value="16/9">16:9</option>
                <option value="4/3">4:3</option>
                <option value="1/1">1:1</option>
                <option value="3/4">3:4</option>
                <option value="9/16">9:16</option>
              </select>

              <label className="field-label" htmlFor="width">
                CHIỀU RỘNG (WIDTH)
              </label>
              <input
                id="width"
                className="field-input"
                type="text"
                placeholder="VD: 100%, 300px, auto..."
                value={block.layout?.width || ""}
                onChange={(e) => update(block.id, { layout: { ...block.layout, width: e.target.value || undefined } })}
              />

              <label className="field-label" htmlFor="height">
                CHIỀU CAO (HEIGHT)
              </label>
              <input
                id="height"
                className="field-input"
                type="text"
                placeholder="VD: 100%, 300px, auto..."
                value={block.layout?.height || ""}
                onChange={(e) => update(block.id, { layout: { ...block.layout, height: e.target.value || undefined } })}
              />

              <label className="field-label" htmlFor="margin">
                MARGIN (px)
              </label>
              <input
                id="margin"
                className="field-input"
                type="number"
                placeholder="0"
                value={block.style?.margin?.top ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  update(block.id, {
                    style: {
                      ...block.style,
                      margin: val !== undefined ? { top: val, right: val, bottom: val, left: val } : undefined
                    }
                  });
                }}
              />
            </div>

            <div className="inspector-section">
              <div className="inspector-section-heading">
                VIỀN (Borders) <ChevronDown size={14} />
              </div>

              <label className="field-label" htmlFor="border-width">
                ĐỘ DÀY VIỀN (BORDER) px
              </label>
              <input
                id="border-width"
                className="field-input"
                type="number"
                min="0"
                max="20"
                placeholder="0"
                value={block.style?.borderWidth ?? ""}
                onChange={(e) => update(block.id, { style: { ...block.style, borderWidth: e.target.value ? Number(e.target.value) : undefined, borderStyle: e.target.value ? 'solid' : undefined } })}
              />

              <label className="field-label" htmlFor="border-radius">
                BO GÓC (RADIUS) px
              </label>
              <input
                id="border-radius"
                className="field-input"
                type="number"
                min="0"
                max="512"
                placeholder="8"
                value={block.style?.borderRadius ?? ""}
                onChange={(e) => update(block.id, { style: { ...block.style, borderRadius: e.target.value ? Number(e.target.value) : undefined } })}
              />
            </div>
          </>
        )}
        {(block.kind === "heading" || block.kind === "paragraph") && (
          <>
            {block.kind === "heading" && (
              <div className="inspector-section" style={{ paddingBottom: 16 }}>
                <div className="inspector-section-heading">
                  Thẻ Tiêu đề <ChevronDown size={14} />
                </div>
                <div className="variant-options" style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  {["h1", "h2", "h3", "h4", "h5", "h6"].map((tag) => (
                    <button
                      key={tag}
                      className={`variant-btn${(blockVariant || "h2") === tag ? " variant-btn-active" : ""}`}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        border: 'none',
                        borderRight: tag !== "h6" ? '1px solid #e2e8f0' : 'none',
                        background: (blockVariant || "h2") === tag ? '#e0f2fe' : '#fff',
                        color: (blockVariant || "h2") === tag ? '#0369a1' : '#475569',
                        fontWeight: (blockVariant || "h2") === tag ? 600 : 400,
                        fontSize: 13
                      }}
                      onClick={() => update(block.id, { variant: tag })}
                    >
                      {tag.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="inspector-section">
              <div className="inspector-section-heading">
                Typography <ChevronDown size={14} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 16, background: '#f8fafc' }}>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>Color</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="color"
                    style={{ width: 24, height: 24, padding: 0, border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', background: '#fff' }}
                    value={block.textStyles?.[block.kind === "heading" ? "title" : "description"]?.color || "#000000"}
                    onChange={(e) => updateTextStyle(block.kind === "heading" ? "title" : "description", { ...block.textStyles?.[block.kind === "heading" ? "title" : "description"], color: e.target.value })}
                  />
                  <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                    {block.textStyles?.[block.kind === "heading" ? "title" : "description"]?.color || "#000000"}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="field-label" style={{ margin: 0 }}>FONT SIZE</label>
              </div>

              <div className="variant-options" style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                {[
                  { label: "S", value: 14 },
                  { label: "M", value: 16 },
                  { label: "L", value: 20 },
                  { label: "XL", value: 24 },
                  { label: "XXL", value: 32 }
                ].map((opt, i) => {
                  const currentSize = block.textStyles?.[block.kind === "heading" ? "title" : "description"]?.fontSize;
                  const isActive = currentSize === opt.value || (!currentSize && opt.label === "M");
                  return (
                    <button
                      key={opt.label}
                      className={`variant-btn${isActive ? " variant-btn-active" : ""}`}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        border: 'none',
                        borderRight: i < 4 ? '1px solid #e2e8f0' : 'none',
                        background: isActive ? '#e0f2fe' : '#fff',
                        color: isActive ? '#0369a1' : '#475569',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: 13
                      }}
                      onClick={() => updateTextStyle(block.kind === "heading" ? "title" : "description", { ...block.textStyles?.[block.kind === "heading" ? "title" : "description"], fontSize: opt.value })}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="inspector-section">
              <div className="inspector-section-heading">
                Background <ChevronDown size={14} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                {block.kind === "heading" && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }}>
                    <input type="radio" name="bg-type" checked={!!block.style?.backgroundImage} onChange={() => {
                      const url = prompt("Nhập URL hình ảnh nền:");
                      if (url !== null) update(block.id, { style: { ...block.style, backgroundImage: `url(${url})`, backgroundColor: undefined } });
                    }} />
                    <span style={{ fontSize: 13, color: '#334155' }}>Image URL</span>
                  </label>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', cursor: 'pointer' }}>
                  <input type="radio" name="bg-type" checked={!block.style?.backgroundImage} onChange={() => update(block.id, { style: { ...block.style, backgroundImage: undefined } })} />
                  <span style={{ fontSize: 13, color: '#334155' }}>Solid Color</span>
                </label>
              </div>
              {!block.style?.backgroundImage && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="color" style={{ width: 32, height: 32, padding: 0, border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }} value={block.style?.backgroundColor || "#ffffff"} onChange={(e) => update(block.id, { style: { ...block.style, backgroundColor: e.target.value } })} />
                  <input type="text" className="field-input" style={{ flex: 1 }} value={block.style?.backgroundColor || "#ffffff"} onChange={(e) => update(block.id, { style: { ...block.style, backgroundColor: e.target.value } })} />
                </div>
              )}
            </div>

            <div className="inspector-section">
              <div className="inspector-section-heading">
                Dimensions <ChevronDown size={14} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">PADDING (px)</label>
                  <input
                    className="field-input"
                    type="number"
                    placeholder="0"
                    value={block.style?.padding?.top ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      update(block.id, { style: { ...block.style, padding: val !== undefined ? { top: val, right: val, bottom: val, left: val } : undefined } });
                    }}
                  />
                </div>
                <div>
                  <label className="field-label">MARGIN (px)</label>
                  <input
                    className="field-input"
                    type="number"
                    placeholder="0"
                    value={block.style?.margin?.top ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      update(block.id, { style: { ...block.style, margin: val !== undefined ? { top: val, right: val, bottom: val, left: val } : undefined } });
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="inspector-section">
              <div className="inspector-section-heading">
                Borders <ChevronDown size={14} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">BORDER (px)</label>
                  <input
                    className="field-input"
                    type="number"
                    placeholder="0"
                    value={block.style?.borderWidth ?? ""}
                    onChange={(e) => update(block.id, { style: { ...block.style, borderWidth: e.target.value ? Number(e.target.value) : undefined, borderStyle: e.target.value ? 'solid' : undefined } })}
                  />
                </div>
                <div>
                  <label className="field-label">RADIUS (px)</label>
                  <input
                    className="field-input"
                    type="number"
                    placeholder="0"
                    value={block.style?.borderRadius ?? ""}
                    onChange={(e) => update(block.id, { style: { ...block.style, borderRadius: e.target.value ? Number(e.target.value) : undefined } })}
                  />
                </div>
              </div>

              {block.kind === "heading" && (
                <>
                  <label className="field-label" style={{ marginTop: 16 }}>SHADOW</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!block.style?.boxShadow} onChange={(e) => update(block.id, { style: { ...block.style, boxShadow: e.target.checked ? '0 4px 6px rgba(0,0,0,0.1)' : undefined } })} />
                    <span style={{ fontSize: 13, color: '#334155' }}>Drop shadow</span>
                  </label>
                </>
              )}
            </div>
          </>
        )}
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
};

export default Inspector;
