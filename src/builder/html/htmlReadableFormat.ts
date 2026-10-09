/** Tệp xuất dùng tên marker ngắn; editor và codec tiếp tục dùng marker nội bộ hiện có. */
export const READABLE_HTML_FORMAT = "blocks-v2";
export const INLINE_HTML_FORMAT = "blocks-v3";
const markerAliases: Record<string, string> = {
  "data-builder-page": "data-page",
  "data-builder-page-blocks": "data-blocks",
  "data-builder-block-id": "data-id",
  "data-builder-block-kind": "data-block",
  "data-builder-part": "data-part",
  "data-builder-field": "data-field",
  "data-builder-item-id": "data-item",
  "data-builder-item-field": "data-item-field",
  "data-builder-slot-id": "data-slot",
  "data-builder-image": "data-image",
  "data-builder-icon": "data-icon",
  "data-builder-version": "data-version",
  "data-builder-name": "data-name",
  "data-builder-primary-color": "data-theme-color",
  "data-builder-font-family": "data-font-family",
  "data-builder-variant": "data-variant",
  "data-builder-accent": "data-accent",
  "data-builder-accent-color": "data-accent-color",
  "data-builder-source-type": "data-source",
  "data-builder-limit": "data-limit",
  "data-builder-category": "data-category-slug",
  "data-builder-mode": "data-mode",
  "data-builder-content-kind": "data-content-kind",
  "data-builder-autoplay": "data-autoplay",
  "data-builder-interval-ms": "data-interval-ms",
};
const flagMarkers = new Set(["data-builder-page", "data-builder-page-blocks"]);
const metadataSettings = new Set([
  "data-builder-version", "data-builder-name", "data-builder-primary-color", "data-builder-font-family",
  "data-builder-variant", "data-builder-accent", "data-builder-accent-color", "data-builder-source-type",
  "data-builder-limit", "data-builder-category", "data-builder-mode", "data-builder-content-kind",
  "data-builder-autoplay", "data-builder-interval-ms",
]);

/** Marker ngắn được mở rộng trước khi đọc schema, không làm thay đổi mô hình JSON. */
export function expandReadableMarkers(parsed: Document): void {
  for (const element of Array.from(parsed.querySelectorAll("*"))) for (const [internal, alias] of Object.entries(markerAliases)) {
    if (!element.hasAttribute(alias)) continue;
    const value = flagMarkers.has(internal) ? "true" : element.getAttribute(alias) ?? "";
    if (element.hasAttribute(internal) && element.getAttribute(internal) !== value) throw new Error(`Marker ${alias} bị trùng với ${internal}.`);
    element.setAttribute(internal, value); element.removeAttribute(alias);
  }
}

/** Xuống dòng CSS theo khai báo, giữ nguyên chuỗi, comment và giá trị bên trong hàm CSS. */
function readableCss(source: string): string {
  const lines: string[] = []; let buffer = "", depth = 0, parentheses = 0;
  let quote = "", escaped = false, comment = false;
  const flush = (): void => { if (buffer.trim()) lines.push("  ".repeat(depth) + buffer.trim()); buffer = ""; };
  for (let index = 0; index < source.length; index++) {
    const character = source[index], next = source[index + 1];
    if (comment) {
      buffer += character;
      if (character === "*" && next === "/") { buffer += next; index++; comment = false; }
      continue;
    }
    if (quote) {
      buffer += character;
      if (escaped) escaped = false; else if (character === "\\") escaped = true; else if (character === quote) quote = "";
      continue;
    }
    if (character === "/" && next === "*") { buffer += "/*"; index++; comment = true; continue; }
    if (character === '"' || character === "'") { quote = character; buffer += character; continue; }
    if (character === "(") parentheses++;
    if (character === ")") parentheses--;
    if (!parentheses && character === "{") { buffer += " {"; flush(); depth++; }
    else if (!parentheses && character === "}") { flush(); depth = Math.max(0, depth - 1); buffer = "}"; flush(); }
    else if (!parentheses && character === ";") { buffer += character; flush(); }
    else buffer += character;
  }
  flush(); return lines.join("\n");
}

/** Rút gọn marker và đặt nhãn block; fragment bỏ hướng dẫn/cấu hình ngoài component. */
export function prepareReadableHtml(parsed: Document, inline = false, blocksOnly = false): void {
  const blocks = Array.from(parsed.querySelectorAll<HTMLElement>("[data-builder-block-id]"));
  blocks.forEach((block, index) => {
    const title = Array.from(block.querySelectorAll('[data-builder-field="title"]')).find((field) => field.closest("[data-builder-block-id]") === block)?.textContent;
    const label = `${index + 1}. ${block.getAttribute("data-builder-block-kind")} — ${title || "Khối nội dung"}`.replace(/--/g, "—");
    block.before(parsed.createComment(` BLOCK ${label} `));
    block.after(parsed.createComment(` HẾT BLOCK ${index + 1} `));
  });
  if (!blocksOnly) parsed.body.prepend(parsed.createComment("\nCÁCH CHỈNH SỬA\n- Nội dung: sửa chữ trong các thẻ data-field hoặc data-item-field.\n- Giao diện: thêm/sửa style trên vùng data-part hoặc thẻ data-field.\n- Giữ data-id, data-block và các marker để nhập lại vào builder.\n" + (inline ? "- Nguồn tin và slideshow: chỉnh data-source, data-limit, data-autoplay trên block.\n- Giữ vùng template cấu hình và CSS responsive/trạng thái ở cuối tệp.\n" : "- Nguồn dữ liệu và slideshow được chỉnh trong builder.\n")));
  parsed.querySelector("script[data-builder-document]")?.before(parsed.createComment(" CẤU HÌNH KHÔI PHỤC — hệ thống quản lý khi xuất/nhập "));
  parsed.querySelector("template[data-builder-settings]")?.before(parsed.createComment(" CẤU HÌNH KHÔNG HIỂN THỊ — giữ các giá trị cần khôi phục khi nhập lại "));
  parsed.querySelector("style[data-builder-template-css]")?.before(parsed.createComment(inline ? " CSS DÙNG CHUNG: RESET, RESPONSIVE, HOVER VÀ ANIMATION — style component nằm ngay tại các thẻ bên trên " : " CSS NỀN TỰ SINH — sửa style của block ở vùng HTML bên trên "));
  parsed.querySelector("style[data-builder-responsive-css]")?.before(parsed.createComment(" CSS RESPONSIVE TỰ SINH "));
  for (const element of Array.from(parsed.querySelectorAll("*"))) {
    if (!inline) for (const name of metadataSettings) element.removeAttribute(name);
    for (const [internal, alias] of Object.entries(markerAliases)) if (element.hasAttribute(internal)) {
      element.setAttribute(alias, flagMarkers.has(internal) ? "" : element.getAttribute(internal) ?? ""); element.removeAttribute(internal);
    }
  }
  for (const style of Array.from(parsed.querySelectorAll("style"))) {
    let css = style.textContent ?? "";
    // Tên dài được đổi trước để page-blocks không bị thay một phần bởi alias của page.
    for (const [internal, alias] of Object.entries(markerAliases).sort(([left], [right]) => right.length - left.length)) css = css.replaceAll(internal, alias);
    style.textContent = "\n" + readableCss(css).split("\n").map((line) => "      " + line).join("\n") + "\n    ";
  }
}

/** Escape giá trị thuộc tính mà không thay đổi nội dung sau khi DOMParser đọc lại. */
function attributeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Chú thích hướng dẫn và nhãn block có cùng indent với vùng HTML chứa chúng. */
function readableComment(text: string, depth: number): string {
  const indent = "  ".repeat(depth);
  if (!text.includes("\n")) return `${indent}<!--${text}-->`;
  return `${indent}<!--\n${text.trim().split("\n").map((line) => indent + "  " + line).join("\n")}\n${indent}-->`;
}

/** Định dạng thẻ theo cây; giữ nguyên innerHTML của field và vùng có văn bản xen với icon. */
function readableElement(element: Element, depth: number, inline: boolean): string {
  const indent = "  ".repeat(depth), tag = element.localName;
  const attributes = Array.from(element.attributes).map((attribute) => `${attribute.name}="${attributeText(attribute.value)}"`);
  let opening = `<${tag}${attributes.length ? " " + attributes.join(" ") : ""}>`;
  if (inline && element.hasAttribute("style") && (element instanceof HTMLElement || element instanceof SVGElement) && element.style.length) {
    const formatted = Array.from(element.attributes).map((attribute) => {
      if (attribute.name !== "style") return `${indent}  ${attribute.name}="${attributeText(attribute.value)}"`;
      const declarations = Array.from(element.style).map((key) => `${indent}    ${key}: ${attributeText(element.style.getPropertyValue(key))}${element.style.getPropertyPriority(key) ? " !important" : ""};`);
      return `${indent}  style="\n${declarations.join("\n")}\n${indent}  "`;
    });
    opening = `<${tag}\n${formatted.join("\n")}\n${indent}>`;
  } else if (indent.length + opening.length > 120 && attributes.length > 1) opening = `<${tag}\n${attributes.map((attribute) => `${indent}  ${attribute}`).join("\n")}\n${indent}>`;
  const empty = element.cloneNode(false); if (!(empty instanceof Element)) return indent + element.outerHTML;
  const closing = `</${tag}>`; const voidElement = !empty.outerHTML.endsWith(closing);
  if (voidElement) return indent + opening;
  if (["script", "style"].includes(tag)) return indent + opening + (element.textContent ?? "") + closing;
  const nodes = element instanceof HTMLTemplateElement ? element.content.childNodes : element.childNodes;
  const mixedText = Array.from(nodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
  if (element.hasAttribute("data-field") || element.hasAttribute("data-item-field") || mixedText) return indent + opening + element.innerHTML + closing;
  const children = Array.from(nodes).flatMap((node): string[] => {
    if (node instanceof Element) return [readableElement(node, depth + 1, inline)];
    if (node.nodeType === Node.COMMENT_NODE) return [readableComment(node.textContent ?? "", depth + 1)];
    return [];
  });
  if (!children.length) return indent + opening + closing;
  return `${indent}${opening}\n${children.join("\n")}\n${indent}${closing}`;
}

/** HTML dành cho người sửa trực tiếp: mỗi block có nhãn, thẻ có indent và thuộc tính dài xuống dòng. */
export function formatReadableHtml(parsed: Document, inline = false): string {
  return `<!DOCTYPE html>\n${readableElement(parsed.documentElement, 0, inline)}\n`;
}

/** Chỉ ghi các component và nhãn của chúng, không thêm khung tài liệu HTML. */
export function formatReadableBlocks(parsed: Document): string {
  return Array.from(parsed.body.childNodes).flatMap((node): string[] => {
    if (node instanceof Element) return [readableElement(node, 0, true)];
    if (node.nodeType === Node.COMMENT_NODE) return [readableComment(node.textContent ?? "", 0)];
    return [];
  }).join("\n\n") + "\n";
}
