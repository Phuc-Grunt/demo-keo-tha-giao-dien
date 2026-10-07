"use client";

import HexInput from "./HexInput";
import { toHex6 } from "./color";
import { COLOR_SWATCHES } from "./constants";

interface ColorPaletteProps {
  id: string;
  value: string;
  onChange: (color: string) => void;
}

/**
 * Bảng mã màu đầy đủ: lưới màu gợi ý, bộ chọn màu hệ thống và ô nhập mã hex.
 */
const ColorPalette = ({ id, value, onChange }: ColorPaletteProps) => {
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
};
export default ColorPalette;
