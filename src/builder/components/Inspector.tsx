import { Check, ChevronDown, CircleHelp, Copy, MoreHorizontal, Settings2, Trash2, X } from "lucide-react";
import type { Category } from "@/lib/supabase";
import { blockCatalog, getBlockSource, findBlock, getPageWidth, itemsFromStrings } from "../model";
import type { TextStyle, TextStyleTarget, BuilderBlock } from "../model";
import { itemStrings } from "../blocks/types";
import { useBuilderStore } from "../store";
import { ColorPalette, PageWidthControl, TextStyleControls, defaultAccentColors, FontPicker } from "../InspectorControls";
import paletteIcons from "./paletteIcons";

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
    ["news", "notice", "stats", "links", "gallery", "featured", "ticker", "video", "events"].includes(block.kind);
  // tabs block dùng items làm tên tab
  const hasTabItems = block.kind === "tabs";
  const isColumnsBlock = block.kind === "columns";
  const source = getBlockSource(block);
  const isArticleBlock = ["news", "notice", "ticker", "featured", "video", "events", "tabs"].includes(block.kind);
  const isRepeatBlock = [
    "news", "notice", "stats", "links", "gallery",
    "ticker", "featured", "video", "events", "tabs",
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
            <TextStyleControls
              idPrefix="title"
              value={block.textStyles?.title}
              onChange={(style) => updateTextStyle("title", style)}
            />
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
            <TextStyleControls
              idPrefix="description"
              value={block.textStyles?.description}
              onChange={(style) => updateTextStyle("description", style)}
            />
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
            {block.kind === "hero" && (
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
        {!isColumnsBlock && (
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
