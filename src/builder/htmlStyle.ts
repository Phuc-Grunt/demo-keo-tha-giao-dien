import { layoutSchema, styleSchema, textStyleSchema, type LayoutConfig, type StyleConfig, type TextStyle } from "./schema";
import type { CssDeclarations } from "./appearance";

export interface ParsedPresentation { layout?: LayoutConfig; style?: StyleConfig; text?: TextStyle }
const layoutKeys = ["display", "flexDirection", "flexWrap", "gap", "rowGap", "columnGap", "alignItems", "justifyContent", "width", "maxWidth", "minHeight", "gridTemplateColumns"] as const;
const visualKeys = ["backgroundColor", "color", "borderRadius", "borderWidth", "borderColor", "borderStyle", "opacity"] as const;
const textKeys = ["fontSize", "fontWeight", "fontFamily", "lineHeight", "textAlign", "fontStyle", "color"] as const;
const cssName = (key: string): string => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
const numericKeys = new Set(["gap", "rowGap", "columnGap", "borderRadius", "borderWidth", "fontSize", "fontWeight", "lineHeight", "opacity"]);
const allowedProperties = new Set([...layoutKeys, ...visualKeys, ...textKeys].map(cssName).concat(["padding", "margin", "border", "background", ...["padding", "margin"].flatMap((name) => ["top", "right", "bottom", "left"].map((side) => `${name}-${side}`))]));
const shorthandProperties: Record<string, string[]> = {
  background: ["background-color", "background-image", "background-position", "background-size", "background-repeat", "background-origin", "background-clip", "background-attachment"],
  border: ["border-width", "border-color", "border-style"],
  padding: ["padding-top", "padding-right", "padding-bottom", "padding-left"],
  margin: ["margin-top", "margin-right", "margin-bottom", "margin-left"],
  font: ["font-size", "font-weight", "font-family", "line-height", "font-style", "font-variant", "font-stretch"],
};
const utilityDeclarations: Record<string, CssDeclarations> = {
  flex: { display: "flex" }, grid: { display: "grid" }, block: { display: "block" },
  "flex-row": { "flex-direction": "row" }, "flex-col": { "flex-direction": "column" }, "flex-wrap": { "flex-wrap": "wrap" },
  "items-start": { "align-items": "flex-start" }, "items-center": { "align-items": "center" }, "items-end": { "align-items": "flex-end" }, "items-stretch": { "align-items": "stretch" },
  "justify-start": { "justify-content": "flex-start" }, "justify-center": { "justify-content": "center" }, "justify-end": { "justify-content": "flex-end" }, "justify-between": { "justify-content": "space-between" },
  "bg-white": { "background-color": "#ffffff" }, "bg-black": { "background-color": "#000000" }, "bg-gray-100": { "background-color": "#f3f4f6" },
  "text-left": { "text-align": "left" }, "text-center": { "text-align": "center" }, "text-right": { "text-align": "right" },
  "font-normal": { "font-weight": "400" }, "font-medium": { "font-weight": "500" }, "font-semibold": { "font-weight": "600" }, "font-bold": { "font-weight": "700" },
};
/** Nhóm utility được định nghĩa bởi định dạng template, khoảng cách dùng thang 4px. */
export function utilityStyle(className: string): CssDeclarations | undefined {
  if (utilityDeclarations[className]) return utilityDeclarations[className];
  const grid = className.match(/^grid-cols-([1-6])$/); if (grid) return { "grid-template-columns": `repeat(${grid[1]}, minmax(0, 1fr))` };
  const spacing = className.match(/^(gap|gap-x|gap-y|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml)-(\d+(?:\.\d+)?)$/);
  if (spacing) {
    const token = spacing[1], amount = `${Number(spacing[2]) * 4}px`;
    if (token.startsWith("gap")) return { [token === "gap" ? "gap" : token === "gap-x" ? "column-gap" : "row-gap"]: amount };
    const name = token[0] === "p" ? "padding" : "margin";
    const sides = token.length === 1 ? ["top", "right", "bottom", "left"] : token[1] === "x" ? ["right", "left"] : token[1] === "y" ? ["top", "bottom"] : [{ t: "top", r: "right", b: "bottom", l: "left" }[token[1] as "t" | "r" | "b" | "l"]];
    return Object.fromEntries(sides.map((side) => [`${name}-${side}`, amount]));
  }
  const arbitrary = className.match(/^(gap|bg|text|rounded)-\[([#\w.]+)\]$/);
  if (arbitrary) {
    const color = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(arbitrary[2]);
    if (color && (arbitrary[1] === "bg" || arbitrary[1] === "text")) return { [arbitrary[1] === "bg" ? "background-color" : "color"]: arbitrary[2] };
    if (/^\d+(?:\.\d+)?px$/.test(arbitrary[2]) && arbitrary[1] !== "bg") return { [arbitrary[1] === "rounded" ? "border-radius" : arbitrary[1] === "text" ? "font-size" : "gap"]: arbitrary[2] };
  }
  return undefined;
}
/** Thêm utility vào bản xem trước để các class được hỗ trợ hoạt động cả khi chưa build Tailwind. */
export function utilityCss(root: ParentNode): string {
  const classes = new Set(Array.from(root.querySelectorAll("[class]")).flatMap((element) => Array.from(element.classList)));
  return Array.from(classes).flatMap((token) => { const declarations = utilityStyle(token); return declarations ? [`.${CSS.escape(token)}{${Object.entries(declarations).map(([key, value]) => `${key}:${value};`).join("")}}`] : []; }).join("\n");
}
/** Báo CSS sai trước khi chuẩn hóa DOM, tránh browser loại bỏ âm thầm khai báo người dùng vừa sửa. */
export function validateStyleDeclarations(element: HTMLElement | SVGElement): void {
  for (const declaration of (element.getAttribute("style") ?? "").replace(/\/\*[\s\S]*?\*\//g, "").split(";")) {
    if (!declaration.trim()) continue;
    const key = declaration.match(/^\s*([\w-]+)\s*:/)?.[1]?.toLowerCase();
    if (!key || !element.style.getPropertyValue(key)) throw new Error(`Khai báo CSS không hợp lệ: ${declaration.trim()}.`);
  }
}
/** Đọc CSS vào nhóm chuẩn; không chấp nhận thuộc tính có thể bị mất khi render lại. */
export function readPresentation(element: HTMLElement, typography = false): ParsedPresentation {
  const combined = document.createElement("div");
  const baseClasses = new Set((element.getAttribute("data-builder-base-class") ?? "").split(/\s+/).filter(Boolean));
  for (const token of baseClasses) if (!element.classList.contains(token)) throw new Error(`Không được xóa class cấu trúc "${token}". Sửa layout/style trên phần tử này.`);
  for (const token of element.classList) {
    if (baseClasses.has(token)) continue;
    const declarations = utilityStyle(token); if (!declarations) throw new Error(`Class chưa được hỗ trợ: ${token}. Dùng style CSS trên phần tử có marker.`);
    for (const [key, value] of Object.entries(declarations)) combined.style.setProperty(key, value);
  }
  const baseline = document.createElement("div"); baseline.setAttribute("style", element.getAttribute("data-builder-base-style") ?? "");
  const configured = new Set((element.getAttribute("data-builder-configured-properties") ?? "").split(","));
  validateStyleDeclarations(element);
  if (element.closest('[data-builder-format="blocks-v3"]')) {
    const defaults = new Set(Array.from(baseline.style).flatMap((key) => shorthandProperties[key] ?? [key]));
    for (const key of defaults) if (baseline.style.getPropertyValue(key) && !element.style.getPropertyValue(key)) {
      throw new Error(`Không xóa CSS nền ${key}. Đổi giá trị trên thẻ để có thể nhập lại đúng giao diện.`);
    }
  }
  // CSS nền v3 nằm inline; so sánh từng longhand để đổi màu không vô tình nhập lại gradient mặc định.
  const properties = new Set(Array.from(element.style).flatMap((key) => shorthandProperties[key] ?? [key]));
  for (const key of properties) {
    const value = element.style.getPropertyValue(key);
    if (!value) continue;
    if (value === baseline.style.getPropertyValue(key) && !configured.has(key)) continue;
    if (!allowedProperties.has(key)) {
      if (value === baseline.style.getPropertyValue(key)) continue;
      throw new Error(`CSS chưa được hỗ trợ: ${key}.`);
    }
    combined.style.setProperty(key, value, element.style.getPropertyPriority(key));
  }
  if (combined.style.backgroundImage && combined.style.backgroundImage !== "none") throw new Error("Background image/gradient chưa có ánh xạ. Dùng background-color trên part.");
  if (!typography) for (const key of textKeys) if (key !== "color" && combined.style.getPropertyValue(cssName(key))) throw new Error(`${cssName(key)} phải đặt trên field chữ có marker data-builder-field.`);
  const values: Record<string, string | number> = {};
  const read = (key: string): void => {
    let value = combined.style.getPropertyValue(cssName(key)).trim(); if (!value) return;
    if (key === "fontWeight") value = value === "bold" ? "700" : value === "normal" ? "400" : value;
    if (numericKeys.has(key)) {
      const unitless = ["fontWeight", "lineHeight", "opacity"].includes(key);
      if (!(unitless ? /^-?\d+(?:\.\d+)?$/ : /^-?\d+(?:\.\d+)?(?:px)?$/).test(value)) throw new Error(`${cssName(key)} phải dùng số${unitless ? "" : " hoặc px"}.`);
      values[key] = Number.parseFloat(value);
    } else if (["width", "maxWidth", "minHeight"].includes(key) && /^\d+(?:\.\d+)?px$/.test(value)) values[key] = Number.parseFloat(value);
    else values[key] = value;
  };
  for (const key of [...layoutKeys, ...visualKeys, ...(typography ? textKeys : [])]) read(key);
  const gridValue = values.gridTemplateColumns;
  const columns = typeof gridValue === "string" ? gridValue.match(/^repeat\(\s*([1-6])\s*,\s*minmax\(\s*0(?:px)?\s*,\s*1fr\s*\)\s*\)$/) : null;
  const layoutValues = Object.fromEntries(layoutKeys.filter((key) => values[key] !== undefined && !(columns && key === "gridTemplateColumns")).map((key) => [key, values[key]]));
  if (columns) layoutValues.columns = Number(columns[1]);
  const visualValues: Record<string, string | number | Record<string, number>> = Object.fromEntries(visualKeys.filter((key) => values[key] !== undefined && !(typography && key === "color")).map((key) => [key, values[key]]));
  for (const name of ["padding", "margin"] as const) {
    const sides: Record<string, number> = {}; let present = false;
    for (const side of ["top", "right", "bottom", "left"]) {
      const value = combined.style.getPropertyValue(`${name}-${side}`); if (value) present = true;
      if (value && !/^-?\d+(?:\.\d+)?px$/.test(value)) throw new Error(`${name}-${side} phải dùng px.`);
      sides[side] = value ? Number.parseFloat(value) : 0;
    }
    if (present) visualValues[name] = sides;
  }
  const textValues = Object.fromEntries(textKeys.filter((key) => values[key] !== undefined).map((key) => [key, values[key]]));
  return {
    layout: Object.keys(layoutValues).length ? layoutSchema.parse(layoutValues) : undefined,
    style: Object.keys(visualValues).length ? styleSchema.parse(visualValues) : undefined,
    text: typography && Object.keys(textValues).length ? textStyleSchema.parse(textValues) : undefined,
  };
}
