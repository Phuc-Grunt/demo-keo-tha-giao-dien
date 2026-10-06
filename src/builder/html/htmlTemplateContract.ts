/** Contract chi tiết chỉ dùng trong editor; tệp trao đổi giữ các marker có ý nghĩa. */
export const hiddenTemplateAttributes = new Set<string>([
  "data-builder-base-class", "data-builder-base-style", "data-builder-configured-properties",
  "data-builder-base-value", "data-builder-required-fields", "data-builder-visible-item-ids",
  "data-builder-inline-shape", "data-builder-static-signature", "data-builder-internal",
]);

const pageSettings = new Set(["data-builder-name", "data-builder-primary-color", "data-builder-font-family"]);
const blockSettings = new Set([
  "data-builder-variant", "data-builder-accent", "data-builder-accent-color", "data-builder-font-family",
  "data-builder-source-type", "data-builder-limit", "data-builder-category", "data-builder-mode",
  "data-builder-content-kind", "data-builder-autoplay", "data-builder-interval-ms",
]);

/** Khôi phục nền theo component chuẩn, đồng thời từ chối thay đổi chưa thể biểu diễn trong JSON. */
function restoreNode(element: Element, original: Element): void {
  if (element.tagName !== original.tagName) throw new Error("Cấu trúc thẻ đã thay đổi. Dùng builder để thêm hoặc đổi loại khối.");
  const presentation = ["data-builder-part", "data-builder-field", "data-builder-slot-id", "data-builder-image", "data-builder-page"].some((name) => original.hasAttribute(name));
  const itemField = original.getAttribute("data-builder-item-field");
  const names = new Set([...Array.from(element.attributes), ...Array.from(original.attributes)].map((attribute) => attribute.name));
  for (const name of names) {
    if (hiddenTemplateAttributes.has(name)) continue;
    if (presentation && ["class", "style"].includes(name)) continue;
    if (name === "src" && (original.hasAttribute("data-builder-image") || itemField === "imageUrl")) continue;
    if (name === "href" && itemField === "href") continue;
    if (original.hasAttribute("data-builder-page") && pageSettings.has(name)) continue;
    if (original.hasAttribute("data-builder-block-id") && blockSettings.has(name)) continue;
    if (element.getAttribute(name) !== original.getAttribute(name)) throw new Error(`Thuộc tính ${name} đã thay đổi hoặc bị thiếu. Giữ marker và cấu trúc component.`);
  }
  for (const name of hiddenTemplateAttributes) {
    const value = original.getAttribute(name);
    if (value === null) element.removeAttribute(name); else element.setAttribute(name, value);
  }
  // Cấu hình không có trong fragment được giữ từ bố cục hiện tại hoặc metadata tệp cũ.
  const settings = original.hasAttribute("data-builder-page") ? pageSettings : original.hasAttribute("data-builder-block-id") ? blockSettings : [];
  for (const name of settings) if (!element.hasAttribute(name) && original.hasAttribute(name)) element.setAttribute(name, original.getAttribute(name) ?? "");
  // Block được đối chiếu riêng theo ID; thứ tự block và vị trí trong slot có thể thay đổi.
  const children = Array.from(element.children).filter((child) => !child.hasAttribute("data-builder-block-id"));
  const originals = Array.from(original.children).filter((child) => !child.hasAttribute("data-builder-block-id"));
  if (children.length !== originals.length) throw new Error("Component bị thêm hoặc thiếu thẻ. Giữ cấu trúc có sẵn khi sửa HTML.");
  children.forEach((child, index) => restoreNode(child, originals[index]));
}

/** Marker trong tệp ngắn gọn được ghép với contract sinh từ JSON, không phải đoán từ class CSS. */
export function restoreTemplateContract(page: HTMLElement, originalPage: HTMLElement): void {
  restoreNode(page, originalPage);
  const originals = new Map(Array.from(originalPage.querySelectorAll<HTMLElement>("[data-builder-block-id]")).map((block) => [block.getAttribute("data-builder-block-id"), block]));
  const seen = new Set<string>();
  for (const block of Array.from(page.querySelectorAll<HTMLElement>("[data-builder-block-id]"))) {
    const id = block.getAttribute("data-builder-block-id") ?? "";
    const original = originals.get(id);
    if (!original || seen.has(id)) throw new Error(`Khối ${id}: ID bị trùng hoặc thiếu cấu hình. Tạo thêm khối trong builder.`);
    seen.add(id);
    const label = original.querySelector('[data-builder-field="title"]')?.textContent || original.getAttribute("data-builder-block-kind") || id;
    try { restoreNode(block, original); }
    catch (failure) { throw new Error(`Khối “${label}”: ${failure instanceof Error ? failure.message : "HTML không hợp lệ."}`); }
  }
}
