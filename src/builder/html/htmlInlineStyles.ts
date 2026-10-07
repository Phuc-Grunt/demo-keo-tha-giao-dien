import { validateStyleDeclarations } from "./htmlStyle";

interface MatchedRule { style: CSSStyleDeclaration; specificity: number; order: number }
interface StyledElement extends Element { style: CSSStyleDeclaration }

/** Tách selector theo dấu phẩy ngoài hàm, chuỗi và thuộc tính CSS. */
function selectors(source: string): string[] {
  const result: string[] = []; let start = 0, depth = 0, quote = "";
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    if (quote) { if (character === quote && source[index - 1] !== "\\") quote = ""; continue; }
    if (character === '"' || character === "'") quote = character;
    else if (character === "(" || character === "[") depth++;
    else if (character === ")" || character === "]") depth--;
    else if (character === "," && !depth) { result.push(source.slice(start, index).trim()); start = index + 1; }
  }
  result.push(source.slice(start).trim()); return result;
}

/** Các selector template chỉ dùng ID, class, thuộc tính, :not và tên thẻ. */
function specificity(selector: string): number {
  const source = selector.replace(/:where\([^)]*\)/g, "").replace(/:not\(([^)]*)\)/g, "$1");
  const ids = source.match(/#[\w-]+/g)?.length ?? 0;
  const classes = source.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?/g)?.length ?? 0;
  const tags = source.replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|::?[\w-]+(?:\([^)]*\))?/g, "").match(/\b[a-z][\w-]*\b/gi)?.length ?? 0;
  return ids * 1_000_000 + classes * 1_000 + tags;
}

/** Rule trạng thái và responsive phải thắng style cơ sở đã đưa vào thẻ. */
function retainedRule(rule: CSSRule): string {
  if (rule instanceof CSSKeyframesRule) return rule.cssText;
  if (rule instanceof CSSStyleRule) {
    const declarations = Array.from(rule.style).map((key) => `${key}:${rule.style.getPropertyValue(key)} !important;`).join("");
    return `${rule.selectorText}{${declarations}}`;
  }
  if (rule instanceof CSSGroupingRule) {
    const heading = rule.cssText.slice(0, rule.cssText.indexOf("{"));
    return `${heading}{${Array.from(rule.cssRules).map(retainedRule).join("\n")}}`;
  }
  return rule.cssText;
}

/** Gộp CSS của component vào style thật; giữ reset ngắn, responsive, trạng thái và animation. */
export function inlineTemplateStyles(parsed: Document): void {
  const stylesheet = parsed.querySelector<HTMLStyleElement>("style[data-builder-template-css]");
  if (!stylesheet) throw new Error("Thiếu CSS nền để xuất HTML.");
  const sheet = new CSSStyleSheet(); sheet.replaceSync(stylesheet.textContent ?? "");
  const elements = [parsed.documentElement, parsed.body, ...Array.from(parsed.body.querySelectorAll("*"))]
    .filter((element): element is HTMLElement | SVGElement => (element instanceof HTMLElement || element instanceof SVGElement) && !["SCRIPT", "STYLE"].includes(element.tagName));
  const matches = new Map<StyledElement, MatchedRule[]>(); const remaining: string[] = []; let order = 0;
  for (const rule of Array.from(sheet.cssRules)) {
    if (!(rule instanceof CSSStyleRule)) { remaining.push(retainedRule(rule)); continue; }
    // Reset dùng chung không cần lặp lại trên mọi thẻ và từng đường nét SVG.
    if (!/[.#\[]/.test(rule.selectorText)) { remaining.push(rule.cssText); continue; }
    const ordinary: string[] = [], interactive: string[] = [];
    for (const selector of selectors(rule.selectorText)) {
      if (/::|:(hover|active|focus|focus-visible|focus-within|visited|link|checked|disabled|enabled|target)\b/.test(selector)) interactive.push(selector);
      else ordinary.push(selector);
    }
    if (interactive.length) {
      const declarations = Array.from(rule.style).map((key) => `${key}:${rule.style.getPropertyValue(key)} !important;`).join("");
      remaining.push(`${interactive.join(",")}{${declarations}}`);
    }
    for (const element of elements) {
      const applicable = ordinary.filter((selector) => element.matches(selector)); if (!applicable.length) continue;
      const list = matches.get(element) ?? [];
      list.push({ style: rule.style, specificity: Math.max(...applicable.map(specificity)), order }); matches.set(element, list);
    }
    order++;
  }
  for (const element of elements) {
    const rules = (matches.get(element) ?? []).sort((left, right) => left.specificity - right.specificity || left.order - right.order);
    const merge = (inline: string): string => {
      const source = document.createElement("div").style; source.cssText = inline;
      const result = document.createElement("div").style;
      const apply = (style: CSSStyleDeclaration, important: boolean): void => {
        for (const key of style) if ((style.getPropertyPriority(key) === "important") === important) result.setProperty(key, style.getPropertyValue(key));
      };
      for (const rule of rules) apply(rule.style, false); apply(source, false);
      for (const rule of rules) apply(rule.style, true); apply(source, true);
      // Độ ưu tiên cơ sở đã được giải quyết; responsive tiếp tục ghi đè bằng !important.
      return result.cssText;
    };
    if (element.hasAttribute("data-builder-base-style")) element.setAttribute("data-builder-base-style", merge(element.getAttribute("data-builder-base-style") ?? ""));
    const merged = merge(element.getAttribute("style") ?? "");
    if (merged) element.setAttribute("style", merged);
  }
  stylesheet.textContent = remaining.join("\n");
}

/** DOMParser giữ newline trong thuộc tính; chuẩn hóa trước khi so với contract CSS. */
export function normalizeInlineStyles(parsed: Document): void {
  for (const element of Array.from(parsed.querySelectorAll("[style]"))) {
    if (element instanceof HTMLElement || element instanceof SVGElement) {
      validateStyleDeclarations(element); element.setAttribute("style", element.style.cssText);
    }
  }
}
