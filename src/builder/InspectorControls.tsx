"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  MAX_PAGE_WIDTH,
  MIN_PAGE_WIDTH,
  sanitizeColor,
  type BuilderBlock,
  type TextStyle,
} from "./model";

/** Màu hex tương ứng với 3 màu nhấn mặc định (blue/red/green) của khối. */
export const defaultAccentColors: Record<BuilderBlock["accent"], string> = {
  blue: "#1663b2",
  red: "#bb454b",
  green: "#218e73",
};

/** Bảng mã màu gợi ý hiển thị trong bộ chọn màu nhấn. */
const COLOR_SWATCHES: string[] = [
  "#1663b2", "#bb454b", "#218e73", "#0f4079",
  "#2563eb", "#0ea5e9", "#06b6d4", "#14b8a6",
  "#16a34a", "#84cc16", "#eab308", "#f59e0b",
  "#f97316", "#ef4444", "#db2777", "#a855f7",
  "#7c3aed", "#4f46e5", "#64748b", "#334155",
  "#0f172a", "#78350f", "#6b7280", "#000000",
];

/** Các mức độ rộng trang gợi ý (px). */
const PAGE_WIDTH_PRESETS: number[] = [960, 1140, 1280, 1440, 1600];

/** Chuẩn hóa mã màu về dạng #rrggbb để dùng cho input[type=color]. */
function toHex6(value: string | undefined): string {
  const color = sanitizeColor(value);
  if (!color) return "#000000";
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toLowerCase();
  }
  return color.toLowerCase();
}

interface HexInputProps {
  id: string;
  value: string;
  onChange: (color: string) => void;
}

/** Ô nhập mã hex; chỉ phát sinh thay đổi khi mã nhập vào hợp lệ. */
function HexInput({ id, value, onChange }: HexInputProps) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      id={id}
      className="field-input color-hex-input"
      value={draft}
      maxLength={7}
      spellCheck={false}
      onChange={(event) => {
        const next = event.target.value.startsWith("#") ? event.target.value : `#${event.target.value}`;
        setDraft(next);
        if (sanitizeColor(next)) onChange(next);
      }}
      onBlur={() => setDraft(value)}
    />
  );
}

interface ColorPaletteProps {
  id: string;
  value: string;
  onChange: (color: string) => void;
}

/**
 * Bảng mã màu đầy đủ: lưới màu gợi ý, bộ chọn màu hệ thống và ô nhập mã hex.
 */
export function ColorPalette({ id, value, onChange }: ColorPaletteProps) {
  const current = toHex6(value);
  return (
    <div className="color-palette" id={id}>
      <div className="color-swatch-grid">
        {COLOR_SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            className={`color-swatch ${swatch.toLowerCase() === current ? "active" : ""}`}
            style={{ background: swatch }}
            title={swatch}
            aria-label={`Chọn màu ${swatch}`}
            onClick={() => onChange(swatch)}
          />
        ))}
      </div>
      <div className="color-custom-row">
        <input
          type="color"
          className="color-native"
          value={current}
          aria-label="Chọn màu tùy ý"
          onChange={(event) => onChange(event.target.value)}
        />
        <HexInput id={`${id}-hex`} value={current} onChange={onChange} />
      </div>
    </div>
  );
}

interface SizeInputProps {
  id: string;
  value: number | undefined;
  onCommit: (size: number | undefined) => void;
}

/** Ô nhập cỡ chữ (px); xác nhận khi rời ô hoặc nhấn Enter, rỗng nghĩa là dùng mặc định. */
function SizeInput({ id, value, onCommit }: SizeInputProps) {
  const [draft, setDraft] = useState(value === undefined ? "" : String(value));
  useEffect(() => setDraft(value === undefined ? "" : String(value)), [value]);

  function commit() {
    const parsed = Number(draft);
    if (!draft.trim() || Number.isNaN(parsed)) {
      onCommit(undefined);
      return;
    }
    onCommit(Math.min(96, Math.max(8, Math.round(parsed))));
  }

  return (
    <input
      id={id}
      className="field-input text-style-size"
      type="number"
      min={8}
      max={96}
      placeholder="Cỡ"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}

interface TextStyleControlsProps {
  idPrefix: string;
  value: TextStyle | undefined;
  onChange: (style: TextStyle | undefined) => void;
}

/**
 * Tùy chỉnh kích thước (px) và màu chữ cho một phần nội dung (nhãn nhỏ/tiêu đề/mô tả).
 * Khi cả hai giá trị bị xóa, trả về undefined để quay lại giao diện mặc định.
 */
export function TextStyleControls({ idPrefix, value, onChange }: TextStyleControlsProps) {
  function emit(next: TextStyle) {
    onChange(next.size === undefined && next.color === undefined ? undefined : next);
  }
  return (
    <div className="text-style-row">
      <SizeInput
        id={`${idPrefix}-size`}
        value={value?.size}
        onCommit={(size) => emit({ ...value, size })}
      />
      <span className="text-style-unit">px</span>
      <input
        type="color"
        className="color-native"
        value={toHex6(value?.color)}
        aria-label="Màu chữ"
        title="Màu chữ"
        onChange={(event) => emit({ ...value, color: event.target.value })}
      />
      <HexInput
        id={`${idPrefix}-color`}
        value={value?.color ? toHex6(value.color) : "#"}
        onChange={(color) => emit({ ...value, color })}
      />
      <button
        type="button"
        className="text-style-reset"
        title="Đặt lại mặc định"
        aria-label="Đặt lại cỡ chữ và màu chữ"
        disabled={!value}
        onClick={() => onChange(undefined)}
      >
        <RotateCcw size={13} />
      </button>
    </div>
  );
}

interface PageWidthControlProps {
  value: number;
  onChange: (width: number) => void;
  disabled?: boolean;
  showPresets?: boolean;
}

/**
 * Cấu hình độ rộng trang (px). Giá trị chỉ áp dụng khi rời ô nhập hoặc nhấn Enter
 * để tránh ghi quá nhiều bước vào lịch sử hoàn tác.
 */
export function PageWidthControl({ value, onChange, disabled = false, showPresets = false }: PageWidthControlProps) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  function commit() {
    const parsed = Number(draft);
    if (Number.isNaN(parsed) || !draft.trim()) {
      setDraft(String(value));
      return;
    }
    const width = Math.min(MAX_PAGE_WIDTH, Math.max(MIN_PAGE_WIDTH, Math.round(parsed)));
    setDraft(String(width));
    onChange(width);
  }

  return (
    <div className="page-width-control">
      <div className="page-width-input">
        <input
          id="page-width"
          className="field-input"
          type="number"
          min={MIN_PAGE_WIDTH}
          max={MAX_PAGE_WIDTH}
          step={20}
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        <span>px</span>
      </div>
      {showPresets && (
        <div className="page-width-presets">
          {PAGE_WIDTH_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`page-width-preset ${preset === value ? "active" : ""}`}
              onClick={() => onChange(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
