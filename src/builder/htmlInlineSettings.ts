import { z } from "zod";
import { normalizedDocumentSchema, textTargets, type BuilderDocument } from "./model";

const settingsSchema = z.json();
type SettingsValue = z.infer<typeof settingsSchema>;
interface SettingsObject { [key: string]: SettingsValue }
const itemFields = ["title", "value", "label", "href", "imageUrl"] as const;
const safeKey = /^[a-zA-Z][a-zA-Z0-9]*$/;

/** Giới hạn metadata ở các object JSON có tên trường hợp lệ của schema builder. */
function object(value: SettingsValue | undefined): SettingsObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("Cấu hình khôi phục không hợp lệ.");
  return value;
}
function keyAttribute(key: string): string { return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`); }
function attributeKey(key: string): string { return key.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()); }

/** Cấu hình được viết thành thuộc tính HTML có kiểu, không dùng script hoặc chuỗi JSON trong tệp. */
function writeValue(parsed: Document, value: SettingsValue): HTMLElement {
  const element = parsed.createElement("div");
  if (value === null || typeof value !== "object") {
    element.setAttribute("data-type", value === null ? "null" : typeof value);
    if (value !== null) element.setAttribute("data-value", String(value));
    return element;
  }
  element.setAttribute("data-type", Array.isArray(value) ? "array" : "object");
  for (const [key, entry] of Object.entries(value)) {
    if (Array.isArray(value) || (entry !== null && typeof entry === "object")) {
      const child = writeValue(parsed, entry); child.setAttribute(Array.isArray(value) ? "data-index" : "data-key", key); element.append(child);
    } else {
      const type = entry === null ? "null" : typeof entry;
      element.setAttribute(`data-${type}-${keyAttribute(key)}`, entry === null ? "" : String(entry));
    }
  }
  return element;
}

/** Đọc cây cấu hình thụ động, từ chối kiểu/khóa trùng, thẻ lạ và độ sâu quá lớn. */
function readValue(element: Element, depth = 0): SettingsValue {
  if (depth > 32 || element.tagName !== "DIV") throw new Error("Cấu hình khôi phục có cấu trúc không hợp lệ.");
  if (Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) throw new Error("Cấu hình khôi phục chỉ chứa thuộc tính HTML.");
  const type = element.getAttribute("data-type");
  const scalar = (kind: string, value: string): SettingsValue => {
    if (kind === "string") return value;
    if (kind === "number" && value.trim() && Number.isFinite(Number(value))) return Number(value);
    if (kind === "boolean" && (value === "true" || value === "false")) return value === "true";
    if (kind === "null" && !value) return null;
    throw new Error("Giá trị cấu hình khôi phục không hợp lệ.");
  };
  for (const attribute of Array.from(element.attributes)) if (!["data-type", "data-value", "data-key", "data-index"].includes(attribute.name) && !/^data-(string|number|boolean|null)-[a-z][a-z0-9-]*$/.test(attribute.name)) throw new Error(`Thuộc tính cấu hình không được hỗ trợ: ${attribute.name}.`);
  const properties = Array.from(element.attributes).filter((attribute) => /^data-(string|number|boolean|null)-/.test(attribute.name));
  if (type !== "object" && type !== "array") {
    if (element.children.length || properties.length) throw new Error("Giá trị đơn không được chứa cấu hình con.");
    return scalar(type ?? "", element.getAttribute("data-value") ?? "");
  }
  if (element.hasAttribute("data-value")) throw new Error("Cấu hình object/array không dùng data-value.");
  if (type === "array") {
    if (properties.length) throw new Error("Cấu hình array không chứa thuộc tính object.");
    return Array.from(element.children).map((child, index) => {
      if (child.hasAttribute("data-key") || child.getAttribute("data-index") !== String(index)) throw new Error("Thứ tự cấu hình bị thiếu hoặc trùng.");
      return readValue(child, depth + 1);
    });
  }
  const result: SettingsObject = {};
  const set = (key: string, value: SettingsValue): void => {
    if (!safeKey.test(key) || ["constructor", "prototype"].includes(key) || Object.hasOwn(result, key)) throw new Error("Khóa cấu hình không hợp lệ hoặc bị trùng.");
    result[key] = value;
  };
  for (const attribute of Array.from(element.attributes)) {
    const match = attribute.name.match(/^data-(string|number|boolean|null)-(.+)$/);
    if (match) set(attributeKey(match[2]), scalar(match[1], attribute.value));
  }
  for (const child of Array.from(element.children)) {
    if (child.hasAttribute("data-index")) throw new Error("Cấu hình object không dùng data-index.");
    set(child.getAttribute("data-key") ?? "", readValue(child, depth + 1));
  }
  return result;
}

/** Ghép cây metadata với DOM theo ID; chỉ bỏ giá trị đã hiện đúng, giữ fallback và nội dung ngoài limit. */
function contentMetadata(value: SettingsValue, page: HTMLElement, writing: boolean): void {
  const record = object(value); const blocks = record.blocks;
  if (!Array.isArray(blocks)) throw new Error("Thiếu cấu hình các block.");
  for (const entry of blocks) {
    const block = object(entry); const content = object(block.content);
    const root = Array.from(page.querySelectorAll<HTMLElement>("[data-builder-block-id]")).find((candidate) => candidate.getAttribute("data-builder-block-id") === block.id);
    if (!root) throw new Error(`Khối ${String(block.id)} bị thiếu trong HTML.`);
    const own = (selector: string): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((candidate) => candidate.closest("[data-builder-block-id]") === root);
    for (const field of textTargets) {
      const elements = own(`[data-builder-field="${field}"]`);
      if (elements.length > 1) throw new Error(`Field ${field} bị trùng.`);
      const current = elements[0]?.textContent;
      // Tiêu đề có thể được renderer dùng làm alt của ảnh; giữ giá trị gốc để đối chiếu cấu trúc.
      const derivedImageTitle = field === "title" && block.kind === "hero" && own("img").length > 0;
      if (writing && current !== undefined && content[field] === current && !derivedImageTitle) delete content[field];
      if (!writing && content[field] === undefined) {
        if (current === undefined) throw new Error(`Thiếu field ${field} của khối ${String(block.id)}.`);
        // Field vốn hiện trên DOM vẫn phải tồn tại trong baseline khi người dùng xóa hết chữ.
        content[field] = current || " ";
      }
    }
    if (!Array.isArray(content.items)) throw new Error("Thiếu cấu hình các mục nội dung.");
    for (const itemValue of content.items) {
      const item = object(itemValue);
      for (const field of itemFields) {
        const elements = own("[data-builder-item-id]").filter((candidate) => candidate.getAttribute("data-builder-item-id") === item.id && candidate.getAttribute("data-builder-item-field") === field);
        const values = elements.map((element) => field === "href" ? element.getAttribute("href") ?? "" : field === "imageUrl" ? element.getAttribute("src") ?? "" : element.textContent ?? "");
        const derivedImageTitle = field === "title" && own('[data-builder-item-field="imageUrl"]').some((image) => image.getAttribute("data-builder-item-id") === item.id);
        if (writing && values.length && field !== "imageUrl" && field !== "href" && !derivedImageTitle) {
          if (item[field] === undefined) item[field] = null;
          else if (values.every((current) => item[field] === current)) delete item[field];
        }
        if (!writing && item[field] === null) { delete item[field]; continue; }
        if (!writing && item[field] === undefined && values.length) {
          // Để readItems kiểm tra các bản lặp; không chọn âm thầm một giá trị khác nhau.
          if (values.some((current) => current !== values[0])) throw new Error(`Mục ${String(item.id)} có các bản ${field} khác nhau.`);
          item[field] = values[0];
        }
      }
    }
    if (Array.isArray(block.slots)) for (const slot of block.slots) contentMetadata(slot, page, writing);
  }
}

/** Giữ cấu hình gốc và các giá trị chưa hiển thị, không sao chép lại toàn bộ nội dung nhìn thấy. */
export function appendInlineSettings(parsed: Document, normalized: BuilderDocument): void {
  const page = parsed.querySelector<HTMLElement>("[data-builder-page]"); if (!page) throw new Error("Thiếu vùng trang.");
  const value = settingsSchema.parse(JSON.parse(JSON.stringify(normalized)));
  contentMetadata(value, page, true);
  const template = parsed.createElement("template"); template.setAttribute("data-builder-settings", "");
  template.content.append(writeValue(parsed, value)); parsed.body.append(template);
  parsed.querySelector("script[data-builder-document]")?.remove();
}

/** Khôi phục JSON chuẩn từ thuộc tính cấu hình và nội dung HTML hiện tại. */
export function readInlineSettings(parsed: Document): BuilderDocument {
  const templates = parsed.querySelectorAll<HTMLTemplateElement>("template[data-builder-settings]");
  if (templates.length !== 1 || templates[0].content.children.length !== 1) throw new Error("Thiếu hoặc trùng cấu hình khôi phục. Giữ vùng template ở cuối tệp.");
  const page = parsed.querySelector<HTMLElement>("[data-builder-page]"); if (!page) throw new Error("Thiếu vùng trang.");
  const value = readValue(templates[0].content.children[0]); contentMetadata(value, page, false);
  return normalizedDocumentSchema.parse(value);
}
