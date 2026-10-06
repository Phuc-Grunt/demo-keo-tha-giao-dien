"use client";

import { useEffect, useState } from "react";
import { sanitizeColor } from "../../../../domain/model";

interface HexInputProps {
  id: string;
  value: string;
  onChange: (color: string) => void;
}

/** Ô nhập mã hex; chỉ phát sinh thay đổi khi mã nhập vào hợp lệ. */
const HexInput = ({ id, value, onChange }: HexInputProps) => {
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
};
export default HexInput;
