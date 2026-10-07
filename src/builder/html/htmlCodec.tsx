"use client";

import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { z } from "zod";
import HtmlTemplate from "./HtmlTemplate";
import { blockSchema, documentSchema, normalizedDocumentSchema, flattenBlocks, getPageWidth, getBlockSource, textTargets, type BuilderBlock, type BuilderDocument, type BuilderItem, type BlockDataConfig, type PartConfig, type PartName, type TextStyleTarget } from "../domain/model";
import { blockAppearanceCss, partDeclarations, textDeclarations, templateSelectors, type CssDeclarations } from "../renderer/appearance";
import { readPresentation, utilityCss } from "./htmlStyle";
import { templateStyles } from "./htmlTemplateStyles";
import { hiddenTemplateAttributes, restoreTemplateContract } from "./htmlTemplateContract";
import { expandReadableMarkers, formatReadableBlocks, prepareReadableHtml, INLINE_HTML_FORMAT, READABLE_HTML_FORMAT } from "./htmlReadableFormat";
import { inlineTemplateStyles, normalizeInlineStyles } from "./htmlInlineStyles";
import { readInlineSettings } from "./htmlInlineSettings";

export const MAX_TEMPLATE_HTML_SIZE = 10_000_000;
const fieldListSchema = z.array(z.enum(textTargets));
const stringListSchema = z.array(z.string());

/** JSON metadata không thực thi; escape dấu < để nội dung không đóng thẻ script. */
function metadataElement(name: string, value: BuilderDocument): HTMLScriptElement {
  const element = document.createElement("script"); element.type = "application/json";
  element.setAttribute(name, ""); element.textContent = JSON.stringify(value).replace(/</g, "\\u003c");
  return element;
}
/** Chỉ chọn phần tử thuộc khối hiện tại, không lấy nhầm field của khối trong slot. */
function ownElements(root: HTMLElement, selector: string): HTMLElement[] {
  if (!selector) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => element.closest("[data-builder-block-id]") === root);
}
/** Lưu class/style nền để importer phân biệt mặc định template với thay đổi của người dùng. */
function markPresentation(element: HTMLElement, declarations: CssDeclarations): void {
  element.setAttribute("data-builder-base-class", element.className);
  element.setAttribute("data-builder-base-style", element.getAttribute("style") ?? "");
  element.setAttribute("data-builder-configured-properties", Object.keys(declarations).join(","));
  for (const [key, value] of Object.entries(declarations)) element.style.setProperty(key, value);
}
/** Đánh dấu nội dung dự phòng đang hiển thị, vẫn giữ những mục ngoài limit trong metadata. */
function decorateItems(root: HTMLElement, block: BuilderBlock): void {
  const registry = templateSelectors[block.kind];
  const visible = new Set<string>();
  const mark = (element: HTMLElement | null | undefined, index: number, field: "title" | "value" | "label" | "imageUrl" | "href"): void => {
    const item = block.content.items[index]; if (!element || !item) return;
    element.setAttribute("data-builder-item-id", item.id); element.setAttribute("data-builder-item-field", field); visible.add(item.id);
    element.setAttribute("data-builder-base-value", field === "imageUrl" ? element.getAttribute("src") ?? "" : field === "href" ? element.getAttribute("href") ?? "" : element.textContent ?? "");
  };
  const rows = ownElements(root, registry.item);
  rows.forEach((row, index) => {
    if (block.kind === "tabs") mark(row, index, "title");
    else if (block.kind === "ticker") {
      const count = Math.min(getBlockSource(block).limit, block.content.items.length);
      if (count) mark(row, index % count, "title");
    } else {
      if (registry.itemTitle) mark(row.querySelector<HTMLElement>(registry.itemTitle), index, "title");
      if (registry.itemValue) mark(row.querySelector<HTMLElement>(registry.itemValue), index, "value");
      if (registry.itemLabel) mark(row.querySelector<HTMLElement>(registry.itemLabel), index, "label");
      mark(row.querySelector<HTMLImageElement>("img"), index, "imageUrl");
    }
  });
  if (block.kind === "links") rows.forEach((row, index) => { if (row.tagName === "A") mark(row, index, "href"); });
  if (block.kind === "featured" && block.variant !== "grid") {
    mark(ownElements(root, ".featured-main-title")[0], 0, "title");
    mark(ownElements(root, ".featured-main-img img")[0], 0, "imageUrl");
    ownElements(root, ".featured-side-body strong").forEach((element, index) => mark(element, block.behavior?.slideshow?.autoplay ? index : index + 1, "title"));
  }
  if (block.kind === "video" && block.variant !== "grid") {
    mark(ownElements(root, ".video-main-label strong")[0], 0, "title");
    mark(ownElements(root, ".video-main-wrap img")[0], 0, "imageUrl");
    ownElements(root, ".video-side-body strong").forEach((element, index) => mark(element, index + 1, "title"));
    ownElements(root, ".video-side-item img").forEach((element, index) => mark(element, index + 1, "imageUrl"));
  }
  if (block.kind === "tabs") ownElements(root, ".tab-row-body strong").forEach((element, index) => mark(element, index, "title"));
  root.setAttribute("data-builder-visible-item-ids", JSON.stringify(Array.from(visible)));
}
/** Gắn contract lên các phần tử thật; không dùng class CSS để đoán dữ liệu. */
function decorateBlock(root: HTMLElement, block: BuilderBlock): void {
  const registry = templateSelectors[block.kind];
  root.setAttribute("data-builder-variant", block.variant ?? "");
  root.setAttribute("data-builder-accent", block.theme.accent);
  root.setAttribute("data-builder-accent-color", block.theme.accentColor ?? "");
  root.setAttribute("data-builder-font-family", block.theme.fontFamily ?? "");
  if (block.data) {
    root.setAttribute("data-builder-source-type", block.data.source.type);
    root.setAttribute("data-builder-limit", String(block.data.query.limit));
    if (block.data.source.type === "articles") { root.setAttribute("data-builder-category", block.data.source.categorySlug); root.setAttribute("data-builder-mode", block.data.query.mode ?? "latest"); }
    if (block.data.source.type === "content_entries") root.setAttribute("data-builder-content-kind", block.data.source.kind);
  }
  if (block.behavior?.slideshow) {
    root.setAttribute("data-builder-autoplay", String(block.behavior.slideshow.autoplay));
    root.setAttribute("data-builder-interval-ms", String(block.behavior.slideshow.intervalMs));
  }
  // Kiểu chữ cơ sở nằm trực tiếp trên field để người dùng sửa trong HTML Editor.
  for (const [name, selector] of Object.entries(registry.parts)) {
    if (!selector) continue;
    for (const element of ownElements(root, selector)) {
      element.setAttribute("data-builder-part", name);
      markPresentation(element, partDeclarations(name === "root" ? block : block.parts?.[name as PartName]));
    }
  }
  const required: TextStyleTarget[] = [];
  for (const target of textTargets) {
    const selector = registry.fields[target]; const element = selector ? ownElements(root, selector)[0] : undefined;
    if (element) {
      required.push(target); element.setAttribute("data-builder-field", target); element.setAttribute("data-builder-base-value", element.textContent ?? "");
      markPresentation(element, textDeclarations(block.textStyles?.[target]));
    }
  }
  root.setAttribute("data-builder-required-fields", JSON.stringify(required));
  const heroImage = block.kind === "hero" ? ownElements(root, ".hero-art img")[0] : undefined;
  if (heroImage) { heroImage.setAttribute("data-builder-image", "imageUrl"); markPresentation(heroImage, {}); }
  for (const slot of block.slots ?? []) {
    const element = ownElements(root, "[data-builder-slot-id]").find((candidate) => candidate.getAttribute("data-builder-slot-id") === slot.id);
    if (element) markPresentation(element, partDeclarations(slot));
  }
  decorateItems(root, block);
  for (const slot of block.slots ?? []) for (const child of slot.blocks) {
    const element = Array.from(root.querySelectorAll<HTMLElement>("[data-builder-block-id]")).find((candidate) => candidate.getAttribute("data-builder-block-id") === child.id);
    if (element) decorateBlock(element, child);
  }
}
/** Dấu kiểm tra giúp báo rõ CSS chung chưa thể chuyển thành các nhóm style chuẩn. */
function stylesheetHash(text: string): string {
  let hash = 2166136261; for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16);
}

/** Các phần tĩnh không có mapper phải báo lỗi nếu bị sửa, tránh mất thay đổi khi áp dụng. */
function staticSignature(element: HTMLElement): string {
  const text = element.hasAttribute("data-builder-item-field") ? "" : Array.from(element.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent ?? "").join("").replace(/\s+/g, " ").trim();
  const field = element.getAttribute("data-builder-item-field");
  return stylesheetHash(JSON.stringify([element.tagName, element.className, element.getAttribute("style"), text,
    field === "href" ? null : element.getAttribute("href"), field === "imageUrl" ? null : element.getAttribute("src")]));
}
/** Field nội dung là văn bản; cấu trúc icon có sẵn được giữ riêng khỏi phần người dùng sửa. */
function inlineShape(element: HTMLElement): string {
  const clone = element.cloneNode(true); if (!(clone instanceof HTMLElement)) return "";
  for (const child of Array.from(clone.querySelectorAll("*"))) for (const attribute of Array.from(child.attributes)) if (attribute.name.startsWith("data-builder-")) child.removeAttribute(attribute.name);
  const removeText = (node: Node): void => { for (const child of Array.from(node.childNodes)) { if (child.nodeType === Node.TEXT_NODE) child.remove(); else removeText(child); } };
  removeText(clone); return stylesheetHash(clone.innerHTML);
}
function isPresentationElement(element: HTMLElement): boolean {
  return element.hasAttribute("data-builder-part") || element.hasAttribute("data-builder-slot-id") || element.hasAttribute("data-builder-page") || element.hasAttribute("data-builder-field") || element.hasAttribute("data-builder-image");
}
/** Đánh dấu phần nội dung/class/style có contract và phần template tĩnh. */
function markStaticContract(page: HTMLElement): void {
  for (const element of [page, ...Array.from(page.querySelectorAll("*"))]) {
    if (!(element instanceof HTMLElement) || ["SCRIPT", "STYLE"].includes(element.tagName)) continue;
    if (element.hasAttribute("data-builder-field") || element.hasAttribute("data-builder-item-field")) element.setAttribute("data-builder-inline-shape", inlineShape(element));
    if (!isPresentationElement(element) && !element.parentElement?.closest("[data-builder-field],[data-builder-item-field]")) element.setAttribute("data-builder-static-signature", staticSignature(element));
  }
}
/** Kiểm tra phần tĩnh trước khi chuyển đổi, kể cả style ngoài các part được đăng ký. */
function validateStaticContract(page: HTMLElement): void {
  for (const element of [page, ...Array.from(page.querySelectorAll("*"))]) {
    if (!(element instanceof HTMLElement) || ["SCRIPT", "STYLE"].includes(element.tagName)) continue;
    const shape = element.getAttribute("data-builder-inline-shape");
    if (shape && shape !== inlineShape(element)) throw new Error("Field nội dung chỉ hỗ trợ văn bản và cấu trúc icon có sẵn. Dùng style trên field để chỉnh kiểu chữ.");
    if (!isPresentationElement(element) && !element.parentElement?.closest("[data-builder-field],[data-builder-item-field]")) {
      const signature = element.getAttribute("data-builder-static-signature");
      if (!signature || signature !== staticSignature(element)) throw new Error(`Phần tử ${element.tagName.toLowerCase()} chưa có mapper cho thay đổi này. Sửa nội dung ở field hoặc style ở part có marker.`);
    }
  }
}
/** Template nội bộ có contract đầy đủ; một metadata chung giữ cấu hình của toàn bộ cây block. */
export function documentToEditorHtml(input: BuilderDocument): string {
  const normalized = documentSchema.parse(input);
  const mount = document.createElement("div"); mount.style.cssText = `position:fixed;left:-100000px;width:${getPageWidth(normalized)}px;`; document.body.append(mount);
  const reactRoot = createRoot(mount);
  try {
    flushSync(() => reactRoot.render(<HtmlTemplate document={normalized} />));
    const rendered = mount.querySelector<HTMLElement>("[data-builder-page]"); if (!rendered) throw new Error("Không thể tạo mẫu HTML.");
    const page = rendered.cloneNode(true); if (!(page instanceof HTMLElement)) throw new Error("Không thể sao chép mẫu HTML.");
    page.querySelectorAll("[data-builder-managed-style]").forEach((element) => element.remove());
    const css = templateStyles(page);
    page.setAttribute("data-builder-format", "blocks-v1"); page.setAttribute("data-builder-internal", "true");
    page.setAttribute("data-builder-version", "2"); page.setAttribute("data-builder-name", normalized.meta.name);
    page.setAttribute("data-builder-primary-color", normalized.theme.primaryColor ?? ""); page.setAttribute("data-builder-font-family", normalized.theme.fontFamily ?? "");
    markPresentation(page, partDeclarations(normalized.page));
    for (const block of normalized.blocks) {
      const root = Array.from(page.querySelectorAll<HTMLElement>("[data-builder-block-id]")).find((element) => element.getAttribute("data-builder-block-id") === block.id);
      if (root) decorateBlock(root, block);
    }
    markStaticContract(page);
    const output = document.implementation.createHTMLDocument(normalized.meta.name); output.documentElement.lang = "vi";
    const charset = output.createElement("meta"); charset.setAttribute("charset", "utf-8"); output.head.prepend(charset);
    const base = output.createElement("base"); base.href = `${window.location.origin}/`; output.head.append(base);
    const viewport = output.createElement("meta"); viewport.name = "viewport"; viewport.content = "width=device-width, initial-scale=1"; output.head.append(viewport);
    for (const link of Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))) if (link.href.startsWith("https://fonts.googleapis.com/")) output.head.append(link.cloneNode(true));
    output.body.append(page, metadataElement("data-builder-document", normalized));
    const stylesheet = output.createElement("style"); stylesheet.setAttribute("data-builder-template-css", stylesheetHash(css)); stylesheet.textContent = css; output.body.append(stylesheet);
    const responsive = output.createElement("style");
    // Style cơ sở nằm trên phần tử thật để xóa/sửa CSS trong editor có hiệu lực ngay.
    responsive.textContent = flattenBlocks(normalized.blocks).map((block) => blockAppearanceCss(block, false)).join("\n"); responsive.setAttribute("data-builder-responsive-css", stylesheetHash(responsive.textContent)); output.body.append(responsive);
    return formatTemplate(output);
  } finally { reactRoot.unmount(); mount.remove(); }
}

/** Chỉ xuất markup các block và style riêng; cấu hình đầy đủ tiếp tục nằm trong builder. */
export function documentToHtml(input: BuilderDocument): string {
  const normalized = documentSchema.parse(input);
  const parsed = new DOMParser().parseFromString(documentToEditorHtml(normalized), "text/html");
  const container = parsed.querySelector<HTMLElement>("[data-builder-page-blocks]");
  if (!container) throw new Error("Không thể lấy các block để xuất HTML.");
  const blocks = directBlocks(container);
  if (!blocks.length) throw new Error("Trang chưa có block để xuất HTML.");
  parsed.body.replaceChildren(...blocks);
  for (const element of Array.from(parsed.querySelectorAll("*"))) for (const name of hiddenTemplateAttributes) element.removeAttribute(name);
  prepareReadableHtml(parsed, false, true);
  return formatReadableBlocks(parsed);
}

/** Xuống dòng giữa các tag, bảo toàn tuyệt đối khoảng trắng trong field, SVG và metadata. */
function formatTemplate(output: Document): string {
  let html = output.documentElement.outerHTML; const protectedFragments: string[] = [];
  for (const element of Array.from(output.querySelectorAll("[data-builder-field],[data-builder-item-field],script,style,svg"))) {
    const fragment = element.outerHTML; if (!html.includes(fragment)) continue;
    const marker = `__BUILDER_FRAGMENT_${protectedFragments.length}__`; protectedFragments.push(fragment); html = html.replace(fragment, marker);
  }
  html = html.replace(/></g, ">\n<");
  protectedFragments.forEach((fragment, index) => { html = html.replace(`__BUILDER_FRAGMENT_${index}__`, () => fragment); });
  return `<!DOCTYPE html>\n${html}`;
}

/** Nhận diện các block trực tiếp trong vùng sở hữu, không làm phẳng slot. */
function directBlocks(container: HTMLElement): HTMLElement[] {
  return Array.from(container.children).filter((element): element is HTMLElement => element instanceof HTMLElement && element.hasAttribute("data-builder-block-id"));
}
/** Từ chối script thực thi và HTML chủ động trước khi ghi cấu hình vào builder. */
function validatePassiveHtml(parsed: Document): void {
  if (parsed.querySelector("iframe,object,embed,form")) throw new Error("Template không hỗ trợ iframe, object, embed hoặc form.");
  for (const element of Array.from(parsed.querySelectorAll("*"))) {
    if (element.tagName === "SCRIPT" && (element.getAttribute("type") !== "application/json" || (!element.hasAttribute("data-builder-document") && !element.hasAttribute("data-builder-block-config")))) throw new Error("Template chỉ hỗ trợ script metadata JSON, không hỗ trợ JavaScript thực thi.");
    for (const attribute of Array.from(element.attributes)) {
      if (/^on/i.test(attribute.name) || (["href", "src", "xlink:href"].includes(attribute.name) && /^\s*(javascript:|vbscript:|data:text\/html)/i.test(attribute.value))) throw new Error(`Thuộc tính không được hỗ trợ: ${attribute.name}.`);
    }
  }
}
/** Đọc cấu hình truy vấn từ marker; metadata cung cấp các giá trị không hiển thị. */
function readData(root: HTMLElement, seed: BuilderBlock): BlockDataConfig | undefined {
  const type = root.getAttribute("data-builder-source-type"); if (!type && !seed.data) return undefined;
  const limit = Number(root.getAttribute("data-builder-limit"));
  if (type === "articles") {
    const mode = root.getAttribute("data-builder-mode"); if (mode !== "latest" && mode !== "hot") throw new Error("data-builder-mode phải là latest hoặc hot.");
    return { source: { type, categorySlug: root.getAttribute("data-builder-category") ?? "" }, query: { limit, mode } };
  }
  if (type === "content_entries") {
    const kind = (["hero", "stat", "link", "text", "gallery", "category_list"] as const).find((candidate) => candidate === root.getAttribute("data-builder-content-kind"));
    if (!kind) throw new Error("Loại content_entries không hợp lệ."); return { source: { type, kind }, query: { limit } };
  }
  if (type === "static") return { source: { type }, query: { limit } };
  throw new Error("Thiếu marker nguồn dữ liệu của khối.");
}
/** Ghép các mục đang sửa với các mục chưa hiển thị, xử lý cả xóa và đổi thứ tự. */
function readItems(root: HTMLElement, seed: BuilderBlock): BuilderItem[] {
  const originalVisible = stringListSchema.parse(JSON.parse(root.getAttribute("data-builder-visible-item-ids") ?? "[]"));
  const changed = new Map<string, BuilderItem>(); const values = new Map<string, string>();
  for (const element of ownElements(root, "[data-builder-item-id]")) {
    const id = element.getAttribute("data-builder-item-id") ?? ""; const field = element.getAttribute("data-builder-item-field");
    if (field !== "title" && field !== "value" && field !== "label" && field !== "imageUrl" && field !== "href") throw new Error("Field nội dung mục không hợp lệ.");
    const value = field === "imageUrl" ? element.getAttribute("src") ?? "" : field === "href" ? element.getAttribute("href") ?? "" : element.textContent ?? "";
    const key = `${id}:${field}`;
    if (values.has(key) && values.get(key) !== value) throw new Error(`Mục ${id} xuất hiện nhiều lần với ${field} khác nhau. Sửa các bản hiển thị về cùng nội dung.`);
    values.set(key, value);
    const original = seed.content.items.find((candidate) => candidate.id === id);
    const item = changed.get(id) ?? original ?? { id };
    // Giữ chuỗi rỗng trong cấu hình khi renderer đang hiện nhãn thay thế như “Chỉ số”.
    changed.set(id, original && value === element.getAttribute("data-builder-base-value") ? item : { ...item, [field]: value });
  }
  return [...changed.values(), ...seed.content.items.filter((item) => !changed.has(item.id) && !originalVisible.includes(item.id))];
}
/** Parse một block và toàn bộ slot, giữ các field không có phần tử hiển thị trong metadata. */
function readBlock(root: HTMLElement, seeds?: ReadonlyMap<string, BuilderBlock>): BuilderBlock {
  const id = root.getAttribute("data-builder-block-id") ?? "";
  const config = ownElements(root, "script[data-builder-block-config]");
  if (!seeds && config.length !== 1) throw new Error("Khối thiếu cấu hình. Hãy nhập tệp HTML xuất từ builder.");
  const seed = seeds ? seeds.get(id) : blockSchema.parse(JSON.parse(config[0].textContent ?? ""));
  if (!seed) throw new Error(`Khối ${id}: thiếu cấu hình trong metadata chung.`);
  try {
    if (root.getAttribute("data-builder-block-kind") !== seed.kind) throw new Error(`Khối ${id}: kind không khớp metadata.`);
    const result = structuredClone(seed); result.id = id;
    if (!root.hasAttribute("data-builder-required-fields") || !root.hasAttribute("data-builder-visible-item-ids")) throw new Error(`Khối ${id}: thiếu marker danh sách field/mục.`);
    const accent = (["blue", "red", "green"] as const).find((candidate) => candidate === root.getAttribute("data-builder-accent"));
    if (!accent) throw new Error(`Khối ${id}: màu nhấn không hợp lệ.`);
    result.theme = { accent, accentColor: root.getAttribute("data-builder-accent-color") || undefined, fontFamily: root.getAttribute("data-builder-font-family") || undefined };
    result.variant = root.getAttribute("data-builder-variant") || undefined;
    result.data = readData(root, seed);
    if (root.hasAttribute("data-builder-autoplay")) {
      const autoplay = root.getAttribute("data-builder-autoplay"); if (autoplay !== "true" && autoplay !== "false") throw new Error("Autoplay phải là true hoặc false.");
      result.behavior = { ...seed.behavior, slideshow: { autoplay: autoplay === "true", intervalMs: Number(root.getAttribute("data-builder-interval-ms")) } };
    } else if (seed.behavior?.slideshow) throw new Error(`Khối ${id}: thiếu marker slideshow.`);
    const required = fieldListSchema.parse(JSON.parse(root.getAttribute("data-builder-required-fields") ?? "[]"));
    for (const target of textTargets) {
      const fields = ownElements(root, `[data-builder-field="${target}"]`);
      if (fields.length > 1 || (required.includes(target) && fields.length !== 1)) throw new Error(`Khối ${id}: field ${target} bị thiếu hoặc trùng.`);
      if (!fields[0]) continue;
      const value = fields[0].textContent ?? "";
      result.content[target] = value === fields[0].getAttribute("data-builder-base-value") ? seed.content[target] : value;
      const presentation = readPresentation(fields[0], true);
      if (presentation.layout || presentation.style) throw new Error(`Field ${target} chỉ hỗ trợ kiểu chữ; sửa layout/style tại part heading hoặc root.`);
      if (presentation.text) result.textStyles = { ...result.textStyles, [target]: presentation.text };
      else if (result.textStyles) delete result.textStyles[target];
    }
    const parts = new Map<PartName, PartConfig>();
    for (const element of ownElements(root, "[data-builder-part]")) {
      const name = element.getAttribute("data-builder-part") as PartName;
      if (!templateSelectors[result.kind].parts[name]) throw new Error(`Khối ${id}: part ${name} không được hỗ trợ.`);
      const presentation = readPresentation(element); const part = { layout: presentation.layout, style: presentation.style };
      if (parts.has(name) && JSON.stringify(parts.get(name)) !== JSON.stringify(part)) throw new Error(`Part ${name} có các style khác nhau. Cấu hình part áp dụng chung cho các phần tử lặp.`);
      parts.set(name, part);
    }
    if (!parts.has("root")) throw new Error(`Khối ${id}: thiếu part root.`);
    result.layout = parts.get("root")?.layout; result.style = parts.get("root")?.style;
    if (result.kind === "columns" && result.layout?.columns !== undefined) {
      const { columns, ...layout } = result.layout;
      result.layout = { ...layout, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
    }
    for (const [name, part] of parts) if (name !== "root") {
      if (part.layout || part.style) result.parts = { ...result.parts, [name]: part };
      else if (result.parts) delete result.parts[name];
    }
    if (result.textStyles && !Object.keys(result.textStyles).length) result.textStyles = undefined;
    if (result.parts && !Object.keys(result.parts).length) result.parts = undefined;
    result.content.items = readItems(root, seed);
    if (result.kind === "hero") {
      const image = ownElements(root, ".hero-art img")[0];
      if (image) {
        const presentation = readPresentation(image);
        if (presentation.layout || presentation.style) throw new Error("Đặt layout/style của ảnh tại part image, không đặt trên img.");
        result.content.imageUrl = image.getAttribute("src") ?? undefined;
      }
      else if (seed.content.imageUrl) result.content.imageUrl = undefined;
    }
    if (result.kind === "columns") result.slots = ownElements(root, "[data-builder-slot-id]").map((element) => {
      const slotId = element.getAttribute("data-builder-slot-id") ?? ""; const part = readPresentation(element);
      return { id: slotId, layout: part.layout, style: part.style, blocks: directBlocks(element).map((child) => readBlock(child, seeds)) };
    });
    return blockSchema.parse(result);
  } catch (failure) {
    const issue = failure instanceof z.ZodError ? failure.issues[0] : undefined;
    const message = issue ? `${issue.path.join(".")}: ${issue.message}` : failure instanceof Error ? failure.message : "HTML/CSS không hợp lệ.";
    throw new Error(`Khối “${seed.content.title || seed.kind}”: ${message}`);
  }
}

/** HTML mẫu đã chỉnh → JSON v2; chỉ trả về khi toàn bộ tài liệu hợp lệ. */
export function htmlToDocument(html: string, currentDocument?: BuilderDocument): BuilderDocument {
  if (html.length > MAX_TEMPLATE_HTML_SIZE) throw new Error("Tệp HTML vượt quá 10 MB.");
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const fragments = !parsed.querySelector("[data-builder-page],[data-page]") && !!parsed.querySelector("[data-id][data-block],[data-builder-block-id][data-builder-block-kind]");
  if (fragments || parsed.querySelector(`[data-builder-format="${READABLE_HTML_FORMAT}"],[data-builder-format="${INLINE_HTML_FORMAT}"]`)) expandReadableMarkers(parsed);
  validatePassiveHtml(parsed);
  if (fragments) return blockFragmentsToDocument(parsed, currentDocument);
  if (parsed.querySelector(`[data-builder-format="${INLINE_HTML_FORMAT}"]`)) return inlineHtmlToDocument(parsed);
  const metadata = parsed.querySelectorAll("script[data-builder-document]"); if (metadata.length !== 1) throw new Error("Thiếu hoặc trùng metadata tài liệu. Hãy dùng HTML xuất từ builder.");
  const seed = normalizedDocumentSchema.parse(JSON.parse(metadata[0].textContent ?? ""));
  const pages = parsed.querySelectorAll<HTMLElement>("[data-builder-page]"); if (pages.length !== 1) throw new Error("Template phải có đúng một vùng trang.");
  if (pages[0].getAttribute("data-builder-format") === READABLE_HTML_FORMAT && !pages[0].hasAttribute("data-builder-version")) pages[0].setAttribute("data-builder-version", String(seed.version));
  if (pages[0].getAttribute("data-builder-version") !== "2") throw new Error("Template phải dùng cấu hình JSON phiên bản 2.");
  const page = pages[0]; const containers = page.querySelectorAll<HTMLElement>("[data-builder-page-blocks]"); if (containers.length !== 1) throw new Error("Thiếu hoặc trùng vùng chứa block của trang.");
  const format = page.getAttribute("data-builder-format");
  if (format && format !== "blocks-v1" && format !== READABLE_HTML_FORMAT) throw new Error("Định dạng HTML chưa được hỗ trợ. Hãy dùng tệp xuất từ builder này.");
  const seeds = format ? new Map(flattenBlocks(seed.blocks).map((block) => [block.id, block])) : undefined;
  if (format) {
    if (parsed.querySelectorAll("script").length !== 1) throw new Error("Tệp HTML các block chỉ có một metadata chung.");
    if (Array.from(parsed.body.children).some((element) => element !== page && element !== metadata[0] && element.tagName !== "STYLE")) throw new Error("Tệp HTML chỉ chứa vùng block. Header/menu/footer được quản lý trong ứng dụng.");
    if (!page.hasAttribute("data-builder-internal")) {
      const baseline = new DOMParser().parseFromString(documentToEditorHtml(seed), "text/html").querySelector<HTMLElement>("[data-builder-page]");
      if (!baseline) throw new Error("Không thể khôi phục cấu trúc các block.");
      baseline.setAttribute("data-builder-format", format);
      restoreTemplateContract(page, baseline);
    }
  }
  validateStaticContract(page);
  const stylesheet = parsed.querySelector("style[data-builder-template-css]");
  if (!stylesheet || stylesheet.getAttribute("data-builder-template-css") !== stylesheetHash(stylesheet.textContent ?? "")) throw new Error("CSS nền đã thay đổi. Sửa style/class trên phần tử có marker để có thể chuyển về JSON.");
  const responsiveStyles = parsed.querySelector("style[data-builder-responsive-css]");
  if (!responsiveStyles || responsiveStyles.getAttribute("data-builder-responsive-css") !== stylesheetHash(responsiveStyles.textContent ?? "")) throw new Error("CSS được sinh từ cấu hình đã thay đổi. Sửa style trên part/field hoặc responsive trong metadata của block.");
  if (parsed.querySelectorAll("style").length !== 2) throw new Error("Template chỉ hỗ trợ hai stylesheet được sinh sẵn. Sửa inline style trên part/field.");
  return readDocumentPage(page, containers[0], seed, seeds);
}

/** Ghép fragment theo ID vào bố cục đang mở, giữ các cấu hình và block không có trong tệp. */
function blockFragmentsToDocument(parsed: Document, currentDocument?: BuilderDocument): BuilderDocument {
  if (!currentDocument) throw new Error("HTML block cần bố cục gốc để nhập lại. Mở bố cục hoặc nhập JSON gốc trước.");
  if (parsed.head.children.length || parsed.querySelector("script,style,template") || parsed.documentElement.attributes.length || parsed.body.attributes.length) throw new Error("Tệp HTML block chỉ chứa các block, không kèm khung trang, CSS chung hoặc cấu hình.");
  const fragments = directBlocks(parsed.body);
  if (!fragments.length || fragments.length !== parsed.body.children.length || Array.from(parsed.body.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) throw new Error("Giữ các block trực tiếp trong tệp, không thêm wrapper hoặc nội dung ngoài block.");
  const seed = documentSchema.parse(currentDocument);
  const baseline = new DOMParser().parseFromString(documentToEditorHtml(seed), "text/html");
  normalizeInlineStyles(parsed); normalizeInlineStyles(baseline);
  const originalPage = baseline.querySelector<HTMLElement>("[data-builder-page]");
  if (!originalPage) throw new Error("Không thể khôi phục cấu trúc block.");
  markStaticContract(originalPage);
  const page = originalPage.cloneNode(true);
  if (!(page instanceof HTMLElement)) throw new Error("Không thể sao chép bố cục hiện tại.");
  const originals = new Map(Array.from(originalPage.querySelectorAll<HTMLElement>("[data-builder-block-id]")).map((block) => [block.getAttribute("data-builder-block-id") ?? "", block]));
  const incoming = new Set<string>();
  for (const block of Array.from(parsed.querySelectorAll<HTMLElement>("[data-builder-block-id]"))) {
    const id = block.getAttribute("data-builder-block-id") ?? "";
    if (incoming.has(id)) throw new Error(`Khối ${id}: ID bị trùng trong tệp HTML.`);
    if (!originals.has(id)) throw new Error(`Khối ${id}: không có trong bố cục đang mở. Mở bố cục hoặc nhập JSON gốc trước.`);
    incoming.add(id);
  }
  for (const fragment of fragments) {
    const id = fragment.getAttribute("data-builder-block-id");
    const target = Array.from(page.querySelectorAll<HTMLElement>("[data-builder-block-id]")).find((block) => block.getAttribute("data-builder-block-id") === id);
    if (!target) throw new Error(`Khối ${id}: vị trí block không hợp lệ.`);
    target.replaceWith(fragment);
  }
  const container = page.querySelector<HTMLElement>("[data-builder-page-blocks]");
  if (!container) throw new Error("Không thể khôi phục vùng chứa block.");
  // Khi tệp chứa đủ các block cấp trang, thứ tự trong tệp là thứ tự mới của trang.
  const rootIds = new Set(seed.blocks.map((block) => block.id));
  if (fragments.length === rootIds.size && fragments.every((block) => rootIds.has(block.getAttribute("data-builder-block-id") ?? ""))) container.append(...fragments);
  const resultIds = Array.from(page.querySelectorAll("[data-builder-block-id]")).map((block) => block.getAttribute("data-builder-block-id") ?? "");
  if (resultIds.length !== originals.size || new Set(resultIds).size !== originals.size || resultIds.some((id) => !originals.has(id))) throw new Error("Giữ các block con và ID đã có. Thêm hoặc xóa block bằng builder.");
  restoreTemplateContract(page, originalPage); validateStaticContract(page);
  return readDocumentPage(page, container, seed, new Map(flattenBlocks(seed.blocks).map((block) => [block.id, block])));
}

/** Tệp v3 dùng cấu hình HTML thụ động; contract nền được tái tạo trước khi đọc phần người dùng sửa. */
function inlineHtmlToDocument(parsed: Document): BuilderDocument {
  if (parsed.querySelector("script")) throw new Error("HTML v3 không dùng script. Giữ cấu hình trong template cuối tệp.");
  const pages = parsed.querySelectorAll<HTMLElement>("[data-builder-page]");
  if (pages.length !== 1 || pages[0].getAttribute("data-builder-version") !== "2") throw new Error("Template phải có đúng một trang dùng JSON phiên bản 2.");
  const page = pages[0];
  const containers = page.querySelectorAll<HTMLElement>("[data-builder-page-blocks]");
  if (containers.length !== 1) throw new Error("Thiếu hoặc trùng vùng chứa block.");
  const settings = parsed.querySelector<HTMLTemplateElement>("template[data-builder-settings]");
  if (!settings || settings.parentElement !== parsed.body) throw new Error("Giữ cấu hình template ở cuối body, ngoài vùng block.");
  if (Array.from(parsed.body.children).some((element) => element !== page && element !== settings && element.tagName !== "STYLE")) throw new Error("Tệp HTML chỉ chứa vùng block và cấu hình khôi phục.");
  for (const marker of ["data-builder-template-css", "data-builder-responsive-css"]) {
    const styles = parsed.querySelectorAll<HTMLStyleElement>(`style[${marker}]`);
    if (styles.length !== 1 || styles[0].getAttribute(marker) !== stylesheetHash(styles[0].textContent ?? "")) throw new Error("CSS responsive/trạng thái đã thay đổi. Sửa style tại part/field; chỉnh responsive trong builder.");
  }
  if (parsed.querySelectorAll("style").length !== 2) throw new Error("Không thêm stylesheet riêng; chỉnh style trên vùng có marker.");
  const seed = readInlineSettings(parsed);
  const baseline = new DOMParser().parseFromString(documentToEditorHtml(seed), "text/html");
  inlineTemplateStyles(baseline);
  const originalPage = baseline.querySelector<HTMLElement>("[data-builder-page]");
  if (!originalPage) throw new Error("Không thể khôi phục cấu trúc block.");
  originalPage.setAttribute("data-builder-format", INLINE_HTML_FORMAT);
  // Newline trong style chỉ phục vụ đọc mã; chữ ký đối chiếu theo CSS đã được DOM chuẩn hóa.
  normalizeInlineStyles(parsed); normalizeInlineStyles(baseline); markStaticContract(originalPage);
  for (const element of [parsed.documentElement, parsed.body]) {
    const original = element === parsed.body ? baseline.body : baseline.documentElement;
    if (element.getAttribute("style") !== original.getAttribute("style")) throw new Error("Style của html/body chưa có ánh xạ. Sửa style tại data-page hoặc các part của block.");
  }
  restoreTemplateContract(page, originalPage); validateStaticContract(page);
  return readDocumentPage(page, containers[0], seed, new Map(flattenBlocks(seed.blocks).map((block) => [block.id, block])));
}

/** Đọc cây page/slot chung cho định dạng cũ và v3 sau khi contract đã hợp lệ. */
function readDocumentPage(page: HTMLElement, container: HTMLElement, seed: BuilderDocument, seeds?: ReadonlyMap<string, BuilderBlock>): BuilderDocument {
  const presentation = readPresentation(page);
  const blocks = directBlocks(container).map((block) => readBlock(block, seeds));
  if (page.querySelectorAll("[data-builder-block-id]").length !== blocks.reduce((count, block) => count + countBlocks(block), 0)) throw new Error("Có block nằm ngoài vùng page/slot hoặc trong wrapper không được hỗ trợ.");
  return normalizedDocumentSchema.parse({ ...seed, meta: { name: page.getAttribute("data-builder-name") ?? seed.meta.name },
    theme: { primaryColor: page.getAttribute("data-builder-primary-color") || undefined, fontFamily: page.getAttribute("data-builder-font-family") || undefined },
    page: { layout: presentation.layout, style: presentation.style }, blocks });
}
/** Đếm cây để phát hiện block bị đặt ngoài vùng page/slot sau khi sửa HTML. */
function countBlocks(block: BuilderBlock): number { return 1 + (block.slots ?? []).reduce((count, slot) => count + slot.blocks.reduce((total, child) => total + countBlocks(child), 0), 0); }

/** Bản xem trước sandbox: giữ HTML/CSS đang gõ, bỏ nội dung chủ động và thêm utility được hỗ trợ. */
export function previewHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed.querySelectorAll("script,iframe,object,embed,form,meta[http-equiv],base").forEach((element) => element.remove());
  for (const element of Array.from(parsed.querySelectorAll("*"))) for (const attribute of Array.from(element.attributes)) if (/^on/i.test(attribute.name) || (["href", "src", "xlink:href"].includes(attribute.name) && /^\s*(javascript:|vbscript:|data:text\/html)/i.test(attribute.value))) element.removeAttribute(attribute.name);
  const base = parsed.createElement("base"); base.href = `${window.location.origin}/`; parsed.head.prepend(base);
  const policy = parsed.createElement("meta"); policy.httpEquiv = "Content-Security-Policy";
  policy.content = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; img-src https: http: data: blob:; font-src https://fonts.gstatic.com data:; connect-src 'none'; form-action 'none';"; parsed.head.prepend(policy);
  const utilities = parsed.createElement("style"); utilities.textContent = utilityCss(parsed); parsed.head.append(utilities);
  return `<!DOCTYPE html>\n${parsed.documentElement.outerHTML}`;
}
