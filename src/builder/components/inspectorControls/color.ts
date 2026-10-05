import { sanitizeColor } from "../../model";

/** Chuyển màu CSS về hex RGB cho input màu; không thay đổi giá trị lưu trong JSON. */
export function toHex6(value: string | undefined): string {
  const hex = sanitizeColor(value);
  if (hex?.length === 4) return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase();
  if (hex) return hex.toLowerCase();
  const rgb = value?.match(/^rgba?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)/i);
  if (rgb) return "#" + rgb.slice(1, 4).map((component) => Math.round(Math.min(255, Math.max(0, Number.parseFloat(component) * (component.endsWith("%") ? 2.55 : 1)))).toString(16).padStart(2, "0")).join("");
  return "#000000";
}
