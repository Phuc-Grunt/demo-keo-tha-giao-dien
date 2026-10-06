"use client";

import { useEffect, useState } from "react";
import { MAX_PAGE_WIDTH, MIN_PAGE_WIDTH } from "../../../../domain/model";
import { PAGE_WIDTH_PRESETS } from "./constants";

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
const PageWidthControl = ({ value, onChange, disabled = false, showPresets = false }: PageWidthControlProps) => {
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
};
export default PageWidthControl;
