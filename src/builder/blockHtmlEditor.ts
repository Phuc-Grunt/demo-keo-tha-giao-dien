"use client";

import { blockCatalog, flattenBlocks, sourceDefaults, type BuilderBlock, type BuilderDocument, type PartName, type TextStyleTarget } from "./model";
import { documentToEditorHtml, htmlToDocument, previewHtml } from "./htmlCodec";
import { cssAttribute, partDeclarations, templateSelectors, textDeclarations, type CssDeclarations } from "./appearance";
import { readPresentation } from "./htmlStyle";

export interface BlockEditorSource { html: string; css: string }
export type BlockEditorSources = Record<string, BlockEditorSource>;
export interface BlockEditorEntry { id: string; label: string; kindLabel: string; depth: number }
interface NodeContract {
  id: string; tagName: string; parentId: string | null; attributes: Record<string, string>;
  publicAttributes: Record<string, string>;
  appearance: boolean; baselineStyle: string; childBlockId?: string; childKind?: string;
}
interface StyleTarget {
  selector: string; aliases: string[]; nodeIds: string[]; typography: boolean; declarations: CssDeclarations;
}
interface BlockContract { nodes: Record<string, NodeContract>; targets: StyleTarget[] }
interface ProjectedBlock { source: BlockEditorSource; contract: BlockContract }
export interface BlockEditorSession {
  document: BuilderDocument; template: string; entries: BlockEditorEntry[];
  sources: BlockEditorSources; contracts: Record<string, BlockContract>;
}
interface CssRule { selectors: string[]; body: string }

/** Chọn wrapper theo ID bằng so sánh thuộc tính, không ghép selector từ dữ liệu nhập. */
function blockRoot(parsed: Document, id: string): HTMLElement | undefined {
  return Array.from(parsed.querySelectorAll<HTMLElement>("[data-builder-block-id]")).find((element) => element.getAttribute("data-builder-block-id") === id);
}
/** Dòng metadata nhỏ có ID thay cho các chữ ký và JSON dài trong mã người dùng sửa. */
function hiddenAttributes(element: HTMLElement): Record<string, string> {
  return Object.fromEntries(Array.from(element.attributes).filter((attribute) => attribute.name.startsWith("data-builder-")).map((attribute) => [attribute.name, attribute.value]));
}
/** Bỏ style cấu hình khỏi nền; template columns và CSS variable vẫn có mặc định renderer. */
function baselineStyle(element: HTMLElement, block: BuilderBlock): string {
  const base = document.createElement("div"); base.setAttribute("style", element.getAttribute("data-builder-base-style") ?? "");
  for (const property of (element.getAttribute("data-builder-configured-properties") ?? "").split(",")) if (property) base.style.removeProperty(property);
  if (base.style.getPropertyValue("--block-columns")) base.style.setProperty("--block-columns", String(sourceDefaults[block.kind].columns ?? 3));
  if (block.kind === "columns" && element.getAttribute("data-builder-part") === "root") {
    base.style.display = "grid"; base.style.gridTemplateColumns = `repeat(${block.slots?.length ?? 2}, minmax(0, 1fr))`;
    base.style.gap = "16px"; base.style.removeProperty("background-color");
  }
  return base.getAttribute("style") ?? "";
}
/** Xuống dòng cho markup nhưng không chèn khoảng trắng vào nội dung field hoặc SVG. */
function formatFragment(root: HTMLElement, nodes: Record<string, NodeContract>): string {
  let html = root.outerHTML; const fragments: string[] = [];
  for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
    const id = element.getAttribute("data-node"); const attributes = id ? nodes[id]?.attributes : undefined;
    if (element.tagName.toLowerCase() !== "svg" && !attributes?.["data-builder-field"] && !attributes?.["data-builder-item-field"]) continue;
    const fragment = element.outerHTML; if (!html.includes(fragment)) continue;
    html = html.replace(fragment, `__BLOCK_FRAGMENT_${fragments.length}__`); fragments.push(fragment);
  }
  html = html.replace(/></g, ">\n<");
  fragments.forEach((fragment, index) => { html = html.replace(`__BLOCK_FRAGMENT_${index}__`, () => fragment); });
  return html;
}
/** Tạo các selector CSS có ánh xạ vào JSON từ những part/field thực sự đang hiển thị. */
function styleTargets(block: BuilderBlock, nodes: Record<string, NodeContract>, root: HTMLElement): StyleTarget[] {
  const targets: StyleTarget[] = [];
  const add = (selector: string, nodeIds: string[], typography: boolean, declarations: CssDeclarations): void => {
    if (nodeIds.length) targets.push({ selector, aliases: selector.split(",").map((value) => value.trim()), nodeIds, typography, declarations });
  };
  for (const [name, selector] of Object.entries(templateSelectors[block.kind].parts)) {
    if (!selector) continue;
    const ids = Object.values(nodes).filter((node) => node.attributes["data-builder-part"] === name).map((node) => node.id);
    const publicSelector = name === "root" ? `.${root.classList[0]}` : selector;
    add(publicSelector, ids, false, partDeclarations(name === "root" ? block : block.parts?.[name as PartName]));
  }
  for (const [name, selector] of Object.entries(templateSelectors[block.kind].fields)) {
    if (!selector) continue;
    add(selector, Object.values(nodes).filter((node) => node.attributes["data-builder-field"] === name).map((node) => node.id), true, textDeclarations(block.textStyles?.[name as TextStyleTarget]));
  }
  for (const slot of block.slots ?? []) {
    const node = Object.values(nodes).find((candidate) => candidate.attributes["data-builder-slot-id"] === slot.id);
    if (node) add(`[data-node="${node.id}"]`, [node.id], false, partDeclarations(slot));
  }
  return targets;
}
/** Tách đúng một component; block con trong columns được biểu diễn bằng placeholder. */
function projectBlock(wrapper: HTMLElement, block: BuilderBlock): ProjectedBlock {
  const original = Array.from(wrapper.querySelectorAll<HTMLElement>('[data-builder-part="root"]')).find((element) => element.closest("[data-builder-block-id]") === wrapper);
  if (!original) throw new Error(`Khối ${block.id}: không tìm thấy component.`);
  const root = original.cloneNode(true); if (!(root instanceof HTMLElement)) throw new Error("Không thể tách component.");
  const nodes: Record<string, NodeContract> = {}; let count = 0;
  const visit = (element: HTMLElement, parentId: string | null): void => {
    const id = `n${count++}`; const attributes = hiddenAttributes(element);
    const childBlockId = element.getAttribute("data-builder-block-id") ?? undefined;
    const appearance = ["data-builder-part", "data-builder-field", "data-builder-slot-id", "data-builder-image"].some((name) => element.hasAttribute(name));
    const publicAttributes = Object.fromEntries(Array.from(element.attributes).filter((attribute) => !attribute.name.startsWith("data-builder-")).map((attribute) => [attribute.name, attribute.value]));
    const node: NodeContract = { id, tagName: element.tagName, parentId, attributes, publicAttributes, appearance, baselineStyle: appearance ? baselineStyle(element, block) : "", childBlockId, childKind: element.getAttribute("data-builder-block-kind") ?? undefined };
    nodes[id] = node;
    for (const attribute of Array.from(element.attributes)) if (attribute.name.startsWith("data-builder-")) element.removeAttribute(attribute.name);
    element.setAttribute("data-node", id);
    if (childBlockId) {
      element.replaceChildren(); element.removeAttribute("class"); element.removeAttribute("style"); element.setAttribute("data-component", node.childKind ?? "block"); return;
    }
    if (appearance) element.removeAttribute("style");
    for (const child of Array.from(element.children)) if (child instanceof HTMLElement) visit(child, id);
  };
  visit(root, null);
  const targets = styleTargets(block, nodes, root);
  const css = targets.filter((target) => Object.keys(target.declarations).length).map((target) => `${target.selector} {\n${Object.entries(target.declarations).map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`).join("\n\n");
  return { source: { html: formatFragment(root, nodes), css }, contract: { nodes, targets } };
}
/** Nhập HTML toàn trang một lần, giữ metadata/CSS nền ngoài các ô soạn thảo. */
export function createBlockEditorSession(html: string): BlockEditorSession {
  const normalized = htmlToDocument(html); const template = documentToEditorHtml(normalized);
  const parsed = new DOMParser().parseFromString(template, "text/html");
  const sources: BlockEditorSources = {}; const contracts: Record<string, BlockContract> = {}; const entries: BlockEditorEntry[] = [];
  const visit = (blocks: BuilderBlock[], depth: number): void => {
    for (const block of blocks) {
      const wrapper = blockRoot(parsed, block.id); if (!wrapper) throw new Error(`Thiếu khối ${block.id}.`);
      const projected = projectBlock(wrapper, block); sources[block.id] = projected.source; contracts[block.id] = projected.contract;
      entries.push({ id: block.id, label: block.content.title || blockCatalog[block.kind].label, kindLabel: blockCatalog[block.kind].label, depth });
      for (const slot of block.slots ?? []) visit(slot.blocks, depth + 1);
    }
  };
  visit(normalized.blocks, 0); return { document: normalized, template, sources, contracts, entries };
}
/** CSS component chỉ nhận rule đơn giản; at-rule/selector khác phải có ánh xạ mới. */
function cssRules(css: string): CssRule[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, ""); const pattern = /([^{}]+)\{([^{}]*)\}/g;
  const rules: CssRule[] = []; let end = 0;
  for (const match of text.matchAll(pattern)) {
    if (text.slice(end, match.index).trim()) throw new Error("CSS không đúng dạng selector { thuộc tính: giá trị; }.");
    const selectors = match[1].split(",").map((selector) => selector.trim());
    if (selectors.some((selector) => !selector || selector.startsWith("@"))) throw new Error("CSS component hiện hỗ trợ style cơ sở; chưa hỗ trợ at-rule.");
    rules.push({ selectors, body: match[2] }); end = (match.index ?? 0) + match[0].length;
  }
  if (text.slice(end).trim()) throw new Error("CSS thiếu dấu ngoặc hoặc chứa nội dung chưa được hỗ trợ.");
  return rules;
}
/** Hợp nhất cascade trước khi đọc CSS về kiểu dữ liệu layout/style/text chuẩn. */
function mergeDeclarations(target: CSSStyleDeclaration, source: CSSStyleDeclaration): void {
  for (const name of source) {
    if (target.getPropertyPriority(name) === "important" && source.getPropertyPriority(name) !== "important") continue;
    target.setProperty(name, source.getPropertyValue(name), source.getPropertyPriority(name));
  }
}
/** Kiểm tra selector và thuộc tính; kết quả luôn áp dụng vào đúng node của component. */
function applyComponentCss(root: HTMLElement, css: string, contract: BlockContract, inline: Map<string, string>): void {
  const cascade = new Map<StyleTarget, HTMLElement>();
  for (const rule of cssRules(css)) for (const selector of rule.selectors) {
    const targets = contract.targets.filter((target) => target.aliases.includes(selector));
    if (!targets.length) throw new Error(`Selector chưa có ánh xạ: ${selector}. Chọn một selector trong danh sách của block.`);
    for (const target of targets) {
      const declarations = document.createElement("div"); declarations.setAttribute("style", rule.body);
      const parsed = readPresentation(declarations, target.typography);
      if (target.typography && (parsed.layout || parsed.style)) throw new Error(`${selector} chỉ nhận kiểu chữ; đặt layout/style trên vùng chứa.`);
      const combined = cascade.get(target) ?? document.createElement("div"); mergeDeclarations(combined.style, declarations.style); cascade.set(target, combined);
    }
  }
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("[data-node]"))];
  for (const target of contract.targets) {
    const declarations = cascade.get(target);
    for (const id of target.nodeIds) {
      const element = elements.find((candidate) => candidate.getAttribute("data-node") === id); if (!element) continue;
      if (declarations) mergeDeclarations(element.style, declarations.style);
      const explicit = inline.get(id);
      if (explicit) { const inlineElement = document.createElement("div"); inlineElement.setAttribute("style", explicit); readPresentation(inlineElement, target.typography); mergeDeclarations(element.style, inlineElement.style); }
      element.setAttribute("data-builder-configured-properties", [...(declarations ? Array.from(declarations.style) : []), ...(explicit ? Array.from(element.style) : [])].join(","));
    }
  }
  // Các img có marker vẫn dùng part image làm nơi nhận style.
  for (const [id, style] of inline) if (!contract.targets.some((target) => target.nodeIds.includes(id))) {
    const element = elements.find((candidate) => candidate.getAttribute("data-node") === id);
    if (element) { const parsed = document.createElement("div"); parsed.setAttribute("style", style); mergeDeclarations(element.style, parsed.style); }
  }
}
/** Khôi phục contract ẩn theo data-node, không lấy metadata do người dùng tự chèn. */
function hydrateFragment(parsed: Document, block: BuilderBlock, source: BlockEditorSource, contract: BlockContract, strict: boolean): HTMLElement {
  if (source.html.length > 500_000 || source.css.length > 100_000) throw new Error("Mã của block quá lớn.");
  const fragment = new DOMParser().parseFromString(source.html, "text/html");
  if (strict && (fragment.head.children.length || Array.from(fragment.body.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()))) throw new Error("HTML chỉ chứa component. Viết style trong tab CSS.");
  const roots = Array.from(fragment.body.children);
  if (roots.length !== 1 || !(roots[0] instanceof HTMLElement)) throw new Error("HTML của block phải có đúng một phần tử gốc.");
  const root = roots[0]; const seen = new Set<string>(); const inline = new Map<string, string>();
  for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
    if (!(element instanceof HTMLElement)) continue;
    const id = element.getAttribute("data-node") ?? ""; const node = contract.nodes[id];
    if (!node || seen.has(id) || element.tagName !== node.tagName) {
      if (strict) throw new Error("Giữ data-node và cấu trúc component có sẵn. Thêm/bớt khối trong builder.");
      continue;
    }
    seen.add(id);
    if (strict && element.parentElement?.getAttribute("data-node") !== node.parentId && !(element === root && node.parentId === null)) throw new Error("Không chuyển phần tử sang vùng chứa khác của component.");
    if (node.childBlockId) {
      if (strict && (element.children.length || element.textContent?.trim() || Array.from(element.attributes).some((attribute) => !["data-node", "data-component"].includes(attribute.name)) || element.getAttribute("data-component") !== node.childKind)) throw new Error("Block con là component riêng. Chọn nó trong danh sách để sửa.");
      const child = blockRoot(parsed, node.childBlockId); if (child) element.replaceWith(child.cloneNode(true));
      continue;
    }
    if (strict) {
      const names = new Set([...Object.keys(node.publicAttributes), ...Array.from(element.attributes).map((attribute) => attribute.name)]);
      for (const name of names) {
        const mappedSource = name === "src" && (node.attributes["data-builder-image"] || node.attributes["data-builder-item-field"] === "imageUrl");
        const mappedHref = name === "href" && node.attributes["data-builder-item-field"] === "href";
        if (["data-node", "class", "style"].includes(name) || mappedSource || mappedHref) continue;
        if ((element.getAttribute(name) ?? undefined) !== node.publicAttributes[name]) throw new Error(`Thuộc tính ${name} chưa có ánh xạ để chỉnh ở component này.`);
      }
    }
    for (const attribute of Array.from(element.attributes)) if (attribute.name.startsWith("data-builder-")) element.removeAttribute(attribute.name);
    for (const [name, value] of Object.entries(node.attributes)) element.setAttribute(name, value);
    if (node.appearance) {
      inline.set(id, element.getAttribute("style") ?? ""); element.setAttribute("style", node.baselineStyle);
      element.setAttribute("data-builder-base-style", node.baselineStyle); element.setAttribute("data-builder-configured-properties", "");
    }
  }
  if (strict && seen.size !== Object.keys(contract.nodes).length) throw new Error("Component bị thiếu phần tử. Xóa nội dung chữ nếu cần để trống, giữ các thẻ và data-node.");
  if (strict) applyComponentCss(root, source.css, contract, inline);
  return root;
}
/** Sửa một bản hiển thị của cùng item thì đồng bộ các bản chưa sửa, giữ cấu trúc icon. */
function synchronizeItems(wrapper: HTMLElement): void {
  const groups = new Map<string, HTMLElement[]>();
  for (const element of Array.from(wrapper.querySelectorAll<HTMLElement>("[data-builder-item-id]"))) {
    if (element.closest("[data-builder-block-id]") !== wrapper) continue;
    const key = `${element.getAttribute("data-builder-item-id")}:${element.getAttribute("data-builder-item-field")}`;
    const group = groups.get(key) ?? []; group.push(element); groups.set(key, group);
  }
  for (const elements of groups.values()) {
    if (elements.length < 2) continue;
    const field = elements[0].getAttribute("data-builder-item-field");
    const read = (element: HTMLElement): string => field === "imageUrl" ? element.getAttribute("src") ?? "" : field === "href" ? element.getAttribute("href") ?? "" : element.textContent ?? "";
    const changes = new Set(elements.filter((element) => read(element) !== element.getAttribute("data-builder-base-value")).map(read));
    if (changes.size !== 1) continue;
    const value = Array.from(changes)[0];
    for (const element of elements) {
      if (field === "imageUrl" || field === "href") { element.setAttribute(field === "imageUrl" ? "src" : "href", value); continue; }
      const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT); let first = true;
      while (walker.nextNode()) { walker.currentNode.textContent = first ? value : ""; first = false; }
      if (first) element.append(element.ownerDocument.createTextNode(value));
    }
  }
}
/** Ghép component theo thứ tự cha trước/con sau, giữ nguồn dữ liệu và cấu hình không hiển thị. */
export function composeBlockEditorHtml(session: BlockEditorSession, sources: BlockEditorSources): string {
  const parsed = new DOMParser().parseFromString(session.template, "text/html");
  for (const block of flattenBlocks(session.document.blocks)) {
    const wrapper = blockRoot(parsed, block.id); const source = sources[block.id]; const contract = session.contracts[block.id];
    if (!wrapper || !source || !contract) throw new Error(`Thiếu mã khối ${block.id}.`);
    const current = Array.from(wrapper.querySelectorAll<HTMLElement>('[data-builder-part="root"]')).find((element) => element.closest("[data-builder-block-id]") === wrapper);
    if (!current) throw new Error(`Khối ${block.id}: thiếu phần tử gốc.`);
    try { current.replaceWith(hydrateFragment(parsed, block, source, contract, true)); }
    catch (failure) { throw new Error(`${block.content.title || blockCatalog[block.kind].label}: ${failure instanceof Error ? failure.message : "Mã không hợp lệ."}`); }
  }
  parsed.querySelectorAll<HTMLElement>("[data-builder-block-id]").forEach(synchronizeItems);
  parsed.querySelectorAll("[data-node]").forEach((element) => element.removeAttribute("data-node"));
  return `<!DOCTYPE html>\n${parsed.documentElement.outerHTML}`;
}
/** Preview mã chưa hợp lệ được giới hạn theo owner để CSS không tác động các block khác. */
export function previewBlockEditor(session: BlockEditorSession, sources: BlockEditorSources): string {
  const parsed = new DOMParser().parseFromString(session.template, "text/html"); const css: string[] = [];
  for (const block of flattenBlocks(session.document.blocks)) {
    const wrapper = blockRoot(parsed, block.id); const source = sources[block.id]; if (!wrapper || !source) continue;
    const current = Array.from(wrapper.querySelectorAll<HTMLElement>('[data-builder-part="root"]')).find((element) => element.closest("[data-builder-block-id]") === wrapper);
    if (!current) continue;
    try { current.replaceWith(hydrateFragment(parsed, block, source, session.contracts[block.id], false)); } catch { /* Giữ component trước đó trong lúc HTML chưa đủ thẻ. */ }
    for (const element of Array.from(wrapper.querySelectorAll("*"))) if (element.closest("[data-builder-block-id]") === wrapper) element.setAttribute("data-builder-owner", block.id);
    try { for (const rule of cssRules(source.css)) css.push(rule.selectors.map((selector) => `[data-builder-owner="${cssAttribute(block.id)}"]:is(${selector})`).join(",") + `{${rule.body}}`); } catch { /* CSS đang gõ dở chưa được áp dụng. */ }
  }
  const styles = parsed.createElement("style"); styles.textContent = css.join("\n"); parsed.body.append(styles);
  return previewHtml(`<!DOCTYPE html>\n${parsed.documentElement.outerHTML}`);
}
/** Selector hiện hữu giúp người dùng viết CSS mà không cần xem registry hoặc metadata. */
export function blockEditorSelectors(session: BlockEditorSession, id: string): string[] {
  return session.contracts[id]?.targets.map((target) => target.selector) ?? [];
}
