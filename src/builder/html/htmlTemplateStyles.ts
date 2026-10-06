/** Các reset cần cho component khi mở tệp HTML bên ngoài ứng dụng. */
const templateReset = `
*,::before,::after{box-sizing:border-box;border:0 solid;margin:0;padding:0;}
html,body{margin:0;min-height:100%;background:#fff;}
body{font-family:Arial,Helvetica,sans-serif;line-height:1.5;}
h1,h2,h3{font-size:inherit;font-weight:700;}
a{color:inherit;text-decoration:inherit;}
button,input,textarea{font:inherit;color:inherit;}
button{background:transparent;cursor:pointer;}
img,svg,video{display:block;vertical-align:middle;}
img,video{max-width:100%;height:auto;}
body>.portal-page{margin:0 auto;}
`;

/** Bỏ trạng thái tương tác để vẫn lấy CSS hover và pseudo-element của component. */
function componentSelector(selector: string): string {
  return selector.replace(/::[\w-]+(?:\([^)]*\))?/g, "").replace(/:(hover|active|focus-visible|focus-within|focus|visited|link)\b/g, "");
}

/** Chỉ giữ rule có class đang dùng và selector khớp vùng block, kể cả ở kích thước khác. */
function matchesComponent(selector: string, page: HTMLElement, classes: Set<string>): boolean {
  const usesClass = Array.from(selector.matchAll(/\.([a-zA-Z_-][\w-]*)/g)).some((match) => classes.has(match[1]));
  if (!usesClass) return false;
  try { const target = componentSelector(selector); return page.matches(target) || page.querySelector(target) !== null; }
  catch { return false; }
}

/** Giữ các biến màu/animation toàn cục mà CSS và inline style của block thực sự tham chiếu. */
function inheritedVariables(page: HTMLElement, css: string): string {
  const source = [css, ...[page, ...Array.from(page.querySelectorAll("[style]"))].map((element) => element.getAttribute("style") ?? "")].join("\n");
  const names = new Set(Array.from(source.matchAll(/var\(\s*(--[\w-]+)/g)).map((match) => match[1]));
  const computed = window.getComputedStyle(document.body);
  const declarations = document.createElement("div").style;
  for (const name of names) {
    const value = computed.getPropertyValue(name).trim(); if (!value) continue;
    declarations.setProperty(name, value);
    for (const match of value.matchAll(/var\(\s*(--[\w-]+)/g)) names.add(match[1]);
  }
  return declarations.length ? `.portal-page{${declarations.cssText}}` : "";
}

/** Lấy CSS của các block đang xuất; không sao chép stylesheet quản trị hoặc toàn bộ Tailwind. */
export function templateStyles(page: HTMLElement): string {
  const classes = new Set([page, ...Array.from(page.querySelectorAll("[class]"))].flatMap((element) => Array.from(element.classList)));
  const keyframes = new Map<string, string>();
  const collect = (rules: CSSRuleList): string => Array.from(rules).flatMap((rule): string[] => {
    if (rule instanceof CSSKeyframesRule) { keyframes.set(rule.name, rule.cssText); return []; }
    if (rule instanceof CSSStyleRule) return matchesComponent(rule.selectorText, page, classes) ? [rule.cssText] : [];
    if (rule instanceof CSSGroupingRule) {
      const content = collect(rule.cssRules); if (!content) return [];
      const heading = rule.cssText.slice(0, rule.cssText.indexOf("{"));
      // CSS nền xuất độc lập; giữ media/container/supports và bỏ lớp layer của ứng dụng.
      return [heading.trim().startsWith("@layer") ? content : `${heading}{${content}}`];
    }
    return [];
  }).join("\n");
  const sheets: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.ownerNode instanceof Element && sheet.ownerNode.hasAttribute("data-builder-managed-style")) continue;
    try { sheets.push(collect(sheet.cssRules)); } catch { /* Font từ origin khác tiếp tục được tải bằng link. */ }
  }
  const rules = sheets.filter(Boolean).join("\n");
  const references = rules + inheritedVariables(page, rules);
  const animations = Array.from(keyframes).filter(([name]) => references.includes(name)).map(([, css]) => css);
  const variables = inheritedVariables(page, [rules, ...animations].join("\n"));
  return [templateReset, variables, rules, ...animations].join("\n").replace(/<\/style/gi, "<\\/style");
}
