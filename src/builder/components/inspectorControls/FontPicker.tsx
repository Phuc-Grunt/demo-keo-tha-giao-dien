"use client";
import { FONT_OPTIONS } from "./constants";
interface FontPickerProps { id: string; value?: string; onChange: (value: string) => void }
/** Chọn font cho trang hoặc một block, kế thừa mặc định khi để trống. */
const FontPicker = ({ id, value, onChange }: FontPickerProps) => <select id={id} className="field-input" value={value || ""} onChange={(event) => onChange(event.target.value)} style={{ fontFamily: value || "inherit" }}>
  {FONT_OPTIONS.map((option) => <option key={option.value} value={option.value} style={{ fontFamily: option.value || "inherit" }}>{option.label}</option>)}
</select>;
export default FontPicker;
