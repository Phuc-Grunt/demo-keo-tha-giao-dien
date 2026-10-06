"use client";

import { RotateCcw } from "lucide-react";
import type { TextStyle } from "../../model";
import SizeInput from "./SizeInput";
import HexInput from "./HexInput";
import { toHex6 } from "./color";

interface TextStyleControlsProps {
  idPrefix: string;
  value: TextStyle | undefined;
  onChange: (style: TextStyle | undefined) => void;
}

/**
 * Tùy chỉnh kích thước (px) và màu chữ cho một phần nội dung (nhãn nhỏ/tiêu đề/mô tả).
 * Giữ các kiểu chữ được nhập từ HTML khi người dùng chỉ sửa kích thước hoặc màu.
 */
const TextStyleControls = ({ idPrefix, value, onChange }: TextStyleControlsProps) => {
  function emit(next: TextStyle) {
    onChange(Object.values(next).every((property) => property === undefined) ? undefined : next);
  }
  return (
    <div className="text-style-row">
      <SizeInput
        id={`${idPrefix}-size`}
        value={value?.fontSize}
        onCommit={(size) => emit({ ...value, fontSize: size })}
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
};
export default TextStyleControls;
