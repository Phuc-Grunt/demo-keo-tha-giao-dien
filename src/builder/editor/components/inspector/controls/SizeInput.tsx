"use client";

import { useEffect, useState } from "react";

interface SizeInputProps {
  id: string;
  value: number | undefined;
  onCommit: (size: number | undefined) => void;
}

/** Ô nhập cỡ chữ (px); xác nhận khi rời ô hoặc nhấn Enter, rỗng nghĩa là dùng mặc định. */
const SizeInput = ({ id, value, onCommit }: SizeInputProps) => {
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
};
export default SizeInput;
