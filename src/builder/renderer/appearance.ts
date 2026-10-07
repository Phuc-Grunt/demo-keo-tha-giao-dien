import type { BlockKind, BuilderBlock, BuilderDocument, LayoutConfig, PartConfig, PartName, StyleConfig, TextStyle, TextStyleTarget } from "../domain/schema";

export type CssDeclarations = Record<string, string>;
export interface TemplateSelectors {
  parts: Partial<Record<PartName, string>>;
  fields: Partial<Record<TextStyleTarget, string>>;
  item: string; itemTitle?: string; itemValue?: string; itemLabel?: string;
}
const headingFields = { eyebrow: ".section-heading .eyebrow", title: ".section-heading h2", description: ".section-heading p" };
const commonParts = { root: ":scope > .render-block", heading: ".section-heading" };
/** Registry chung cho renderer và mapper HTML, tránh hai bảng ánh xạ khác nhau. */
export const templateSelectors: Record<BlockKind, TemplateSelectors> = {
  hero: { parts: { ...commonParts, copy: ".hero-copy", image: ".hero-art" }, fields: { eyebrow: ".hero-eyebrow", title: ".hero-copy h1", description: ".hero-copy p" }, item: "" },
  news: { parts: { ...commonParts, items: ".news-grid", item: ".news-card", image: ".news-image" }, fields: headingFields, item: ".news-card", itemTitle: "h3" },
  notice: { parts: { ...commonParts, items: ".notice-list", item: ".notice-row" }, fields: headingFields, item: ".notice-row", itemTitle: "strong" },
  stats: { parts: { ...commonParts, items: ".stats-grid", item: ".stat-card" }, fields: headingFields, item: ".stat-card", itemValue: "strong", itemLabel: "span" },
  links: { parts: { ...commonParts, items: ".links-grid", item: ".link-card" }, fields: headingFields, item: ".link-card", itemTitle: "strong" },
  text: { parts: commonParts, fields: headingFields, item: "" },
  gallery: { parts: { ...commonParts, items: ".gallery-grid", item: ".gallery-card", image: ".gallery-image" }, fields: headingFields, item: ".gallery-card", itemTitle: "figcaption" },
  ticker: { parts: { ...commonParts, items: ".ticker-track", item: ".ticker-item" }, fields: { eyebrow: ".ticker-label > span" }, item: ".ticker-item" },
  featured: { parts: { ...commonParts, items: ".featured-grid", item: ".featured-card", body: ".featured-classic", main: ".featured-main", side: ".featured-side", image: ".featured-main-img, .featured-card-img" }, fields: headingFields, item: ".featured-card", itemTitle: "h3" },
  video: { parts: { ...commonParts, items: ".video-grid", item: ".video-grid-card", body: ".video-sidebar-layout", main: ".video-main-wrap", side: ".video-side-list", image: ".video-thumb" }, fields: headingFields, item: ".video-grid-card", itemTitle: ".video-card-body strong" },
  events: { parts: { ...commonParts, items: ".event-cards, .events-timeline", item: ".event-card, .event-row" }, fields: headingFields, item: ".event-card, .event-row", itemTitle: ".event-card-title, .event-title" },
  tabs: { parts: { ...commonParts, items: ".tabs-body", item: ".tab-row", image: ".tab-thumb" }, fields: headingFields, item: ".tabs-btn" },
  columns: { parts: { root: ":scope > .portal-columns-grid, :scope > .columns-block > .columns-grid" }, fields: {}, item: "" },
  category_list: { parts: { root: ":scope > .portal-category-list-block" }, fields: { title: ".category-list-header span" }, item: ".category-list-item" },
  image: { parts: { ...commonParts, image: ".portal-image-wrapper img" }, fields: headingFields, item: "" },
  heading: { parts: commonParts, fields: { title: ".portal-heading-text" }, item: "" },
  paragraph: { parts: commonParts, fields: { description: ".portal-paragraph-text" }, item: "" },
};

/** Chuyển layout chuẩn thành các khai báo CSS với đơn vị nhất quán. */
export function layoutDeclarations(layout: LayoutConfig = {}): CssDeclarations {
  const result: CssDeclarations = {};
  for (const [key, value] of Object.entries(layout)) {
    if (value === undefined || key === "columns") continue;
    const cssKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    result[cssKey] = typeof value === "number" ? `${value}px` : value;
  }
  if (layout.columns !== undefined && !layout.gridTemplateColumns) result["grid-template-columns"] = `repeat(${layout.columns}, minmax(0, 1fr))`;
  return result;
}
/** Chuẩn hóa bốn cạnh để CSS và JSON không có nhiều cách viết cùng một giá trị. */
export function styleDeclarations(style: StyleConfig = {}): CssDeclarations {
  const result: CssDeclarations = {};
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined) continue;
    if (typeof value === "object") {
      for (const [side, amount] of Object.entries(value)) result[`${key}-${side}`] = `${amount}px`;
    } else {
      const cssKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      result[cssKey] = typeof value === "number" && key !== "opacity" ? `${value}px` : String(value);
    }
  }
  return result;
}
/** Chuyển typography sang CSS, giữ lineHeight là tỷ lệ. */
export function textDeclarations(style: TextStyle = {}): CssDeclarations {
  return Object.fromEntries(Object.entries(style).filter(([, value]) => value !== undefined).map(([key, value]) => [key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), key === "fontSize" ? `${value}px` : String(value)]));
}
export function partDeclarations(part: PartConfig = {}): CssDeclarations { return { ...layoutDeclarations(part.layout), ...styleDeclarations(part.style) }; }
/** Escape selector và nội dung style để ID/nội dung nhập không phá thẻ style. */
export function cssAttribute(value: string): string { return value.replace(/[^\w-]/g, (character) => `\\${character.codePointAt(0)?.toString(16)} `); }
export function declarationsText(declarations: CssDeclarations, important = false): string {
  return Object.entries(declarations).map(([key, value]) => `${key}:${value}${important ? " !important" : ""};`).join("");
}
/** Sinh CSS theo container; HTML đã có inline style nên có thể chỉ xuất phần responsive. */
export function blockAppearanceCss(block: BuilderBlock, includeBase = true): string {
  const prefix = `[data-builder-block-id="${cssAttribute(block.id)}"]`;
  const registry = templateSelectors[block.kind];
  const rules: string[] = [];
  const addRule = (selector: string | undefined, declarations: CssDeclarations, important = false): void => {
    if (!selector || !Object.keys(declarations).length) return;
    const targets = selector.split(", ").map((part) => part.startsWith(":scope") ? part.replace(":scope", prefix) : `${prefix} ${part}`).join(",");
    rules.push(`${targets}{${declarationsText(declarations, important)}}`);
  };
  const addAppearance = (appearance: PartConfig & { parts?: BuilderBlock["parts"]; textStyles?: BuilderBlock["textStyles"] }, important = false): void => {
    addRule(registry.parts.root, partDeclarations(appearance), important);
    for (const [name, part] of Object.entries(appearance.parts ?? {})) addRule(registry.parts[name as PartName], partDeclarations(part), important);
    // Giá trị người dùng đặt cho field ưu tiên hơn các màu preset của template.
    for (const [name, text] of Object.entries(appearance.textStyles ?? {})) addRule(registry.fields[name as TextStyleTarget], textDeclarations(text), true);
  };
  if (includeBase) addAppearance(block);
  for (const [name, width] of [["tablet", 992], ["mobile", 650]] as const) {
    const appearance = block.responsive?.[name]; if (!appearance) continue;
    const start = rules.length; addAppearance(appearance, true);
    const responsiveRules = rules.splice(start); rules.push(`@container (max-width:${width}px){${responsiveRules.join("")}}`);
  }
  if (includeBase) for (const slot of block.slots ?? []) rules.push(`[data-builder-slot-id="${cssAttribute(slot.id)}"]{${declarationsText(partDeclarations(slot))}}`);
  return rules.join("\n");
}
/** Cấu hình khung trang dùng chung ở cả editor và trang đã xuất bản. */
export function pageAppearanceCss(document: BuilderDocument): string { return `.portal-page{${declarationsText(partDeclarations(document.page))}}`; }
