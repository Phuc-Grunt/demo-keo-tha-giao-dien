import { z } from "zod";
import { templateSelectors } from "./appearance";

export const blockKinds = ["hero", "news", "notice", "stats", "links", "text", "gallery", "ticker", "featured", "video", "events", "tabs", "columns"] as const;
export type BlockKind = (typeof blockKinds)[number];
export const partNames = ["root", "heading", "items", "item", "image", "copy", "main", "side", "body"] as const;
export type PartName = (typeof partNames)[number];
export const textTargets = ["eyebrow", "title", "description"] as const;
export type TextStyleTarget = (typeof textTargets)[number];

const colorSchema = z.string().regex(/^(#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})|transparent|inherit|currentColor|(?:rgb|rgba)\([\d.,%\s]+\))$/i, "Màu phải là mã hex, rgb hoặc rgba.");
const hrefSchema = z.string().max(1000).refine((value) => !value || (value.startsWith("/") && !value.startsWith("//")) || value.startsWith("#") || /^https:\/\//i.test(value), "URL liên kết phải dùng https, đường dẫn nội bộ hoặc #.");
const imageSchema = z.string().max(2_000_000).refine((value) => !value || (value.startsWith("/") && !value.startsWith("//")) || /^https:\/\//i.test(value) || /^data:image\/(png|jpeg|gif|webp|avif);base64,[\da-z+/=\s]+$/i.test(value), "URL ảnh phải dùng https, đường dẫn nội bộ hoặc ảnh raster base64.");
const lengthSchema = z.union([z.number().min(0).max(4096), z.string().regex(/^(auto|100%|\d+(?:\.\d+)?(?:px|rem|em|%|vw|vh))$/)]);
const spacingSchema = z.object({ top: z.number().min(-512).max(512), right: z.number().min(-512).max(512), bottom: z.number().min(-512).max(512), left: z.number().min(-512).max(512) }).strict();
export const layoutSchema = z.object({
  display: z.enum(["block", "flex", "grid"]).optional(),
  flexDirection: z.enum(["row", "column", "row-reverse", "column-reverse"]).optional(),
  flexWrap: z.enum(["nowrap", "wrap"]).optional(),
  columns: z.number().int().min(1).max(6).optional(),
  gridTemplateColumns: z.string().max(200).regex(/^[\w\s.,()%/+-]+$/).optional(),
  gap: z.number().min(0).max(512).optional(),
  rowGap: z.number().min(0).max(512).optional(),
  columnGap: z.number().min(0).max(512).optional(),
  alignItems: z.enum(["start", "end", "flex-start", "flex-end", "center", "stretch", "baseline"]).optional(),
  justifyContent: z.enum(["start", "end", "flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"]).optional(),
  width: lengthSchema.optional(), maxWidth: lengthSchema.optional(), minHeight: lengthSchema.optional(),
}).strict();
export const styleSchema = z.object({
  backgroundColor: colorSchema.optional(), color: colorSchema.optional(),
  padding: spacingSchema.refine((spacing) => Object.values(spacing).every((value) => value >= 0), "Padding không được âm.").optional(), margin: spacingSchema.optional(),
  borderRadius: z.number().min(0).max(512).optional(),
  borderWidth: z.number().min(0).max(20).optional(),
  borderColor: colorSchema.optional(), borderStyle: z.enum(["solid", "dashed", "dotted", "none"]).optional(),
  opacity: z.number().min(0).max(1).optional(),
}).strict();
export const textStyleSchema = z.object({
  fontSize: z.number().min(8).max(96).optional(), color: colorSchema.optional(),
  fontWeight: z.number().int().min(100).max(900).multipleOf(100).optional(),
  fontFamily: z.string().max(100).regex(/^[\w\s,'"-]+$/).optional(),
  lineHeight: z.number().min(0.5).max(3).optional(),
  textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  fontStyle: z.enum(["normal", "italic"]).optional(),
}).strict();
export type LayoutConfig = z.infer<typeof layoutSchema>;
export type StyleConfig = z.infer<typeof styleSchema>;
export type TextStyle = z.infer<typeof textStyleSchema>;
export type BlockTextStyles = Partial<Record<TextStyleTarget, TextStyle>>;
const textStylesSchema = z.object({ eyebrow: textStyleSchema.optional(), title: textStyleSchema.optional(), description: textStyleSchema.optional() }).strict();
export const partSchema = z.object({ layout: layoutSchema.optional(), style: styleSchema.optional() }).strict();
export type PartConfig = z.infer<typeof partSchema>;
export type BlockParts = Partial<Record<PartName, PartConfig>>;
const partsSchema = z.partialRecord(z.enum(partNames), partSchema);
const appearanceSchema = z.object({ layout: layoutSchema.optional(), style: styleSchema.optional(), textStyles: textStylesSchema.optional(), parts: partsSchema.optional() }).strict();
export type AppearanceConfig = z.infer<typeof appearanceSchema>;
export type ResponsiveConfig = { tablet?: AppearanceConfig; mobile?: AppearanceConfig };

const itemSchema = z.object({
  id: z.string().min(1).max(160), title: z.string().max(200).optional(),
  value: z.string().max(100).optional(), label: z.string().max(200).optional(),
  href: hrefSchema.optional(), imageUrl: imageSchema.optional(),
}).strict().refine((item) => item.title !== undefined || (item.value !== undefined && item.label !== undefined), "Một mục phải có title hoặc value và label.");
export type BuilderItem = z.infer<typeof itemSchema>;
const contentSchema = z.object({
  eyebrow: z.string().max(100), title: z.string().max(200), description: z.string().max(1000),
  imageUrl: imageSchema.optional(), items: z.array(itemSchema).max(12),
}).strict();
export type BuilderContent = z.infer<typeof contentSchema>;
const dataSchema = z.object({
  source: z.discriminatedUnion("type", [
    z.object({ type: z.literal("articles"), categorySlug: z.string().max(100) }).strict(),
    z.object({ type: z.literal("content_entries"), kind: z.enum(["hero", "stat", "link", "text", "gallery"]) }).strict(),
    z.object({ type: z.literal("static") }).strict(),
  ]),
  query: z.object({ mode: z.enum(["latest", "hot"]).optional(), limit: z.number().int().min(1).max(12) }).strict(),
}).strict();
export type BlockDataConfig = z.infer<typeof dataSchema>;
const blockThemeSchema = z.object({ accent: z.enum(["blue", "red", "green"]), accentColor: colorSchema.optional(), fontFamily: z.string().max(100).regex(/^[\w\s,'"-]+$/).optional() }).strict();
export type BlockTheme = z.infer<typeof blockThemeSchema>;
const behaviorSchema = z.object({ slideshow: z.object({ autoplay: z.boolean(), intervalMs: z.number().int().min(1000).max(30000) }).strict().optional() }).strict();
export type BlockBehavior = z.infer<typeof behaviorSchema>;
export interface BuilderSlot extends PartConfig { id: string; blocks: BuilderBlock[] }
export interface BuilderBlock extends AppearanceConfig {
  id: string; kind: BlockKind; content: BuilderContent; theme: BlockTheme;
  data?: BlockDataConfig; variant?: string; behavior?: BlockBehavior;
  responsive?: ResponsiveConfig; slots?: BuilderSlot[];
}
const variants: Partial<Record<BlockKind, readonly string[]>> = { hero: ["classic", "full"], featured: ["classic", "grid"], video: ["sidebar", "grid"], events: ["timeline", "cards"], tabs: ["underline", "pills"] };

/** Kiểm tra block con và những cấu hình được renderer của loại block hỗ trợ. */
export const blockSchema: z.ZodType<BuilderBlock, BuilderBlock> = z.lazy(() => z.object({
  id: z.string().min(1).max(160), kind: z.enum(blockKinds), content: contentSchema,
  theme: blockThemeSchema, data: dataSchema.optional(), variant: z.string().max(50).optional(),
  layout: layoutSchema.optional(), style: styleSchema.optional(), textStyles: textStylesSchema.optional(), parts: partsSchema.optional(),
  behavior: behaviorSchema.optional(), responsive: z.object({ tablet: appearanceSchema.optional(), mobile: appearanceSchema.optional() }).strict().optional(),
  slots: z.array(z.object({ id: z.string().min(1).max(160), layout: layoutSchema.optional(), style: styleSchema.optional(), blocks: z.array(blockSchema).max(100) }).strict()).max(6).optional(),
}).strict().superRefine((block, context) => {
  if (block.kind === "columns" && !block.slots?.length) context.addIssue({ code: "custom", path: ["slots"], message: "Khối nhiều cột phải có ít nhất một slot." });
  if (block.kind !== "columns" && block.slots) context.addIssue({ code: "custom", path: ["slots"], message: "Chỉ khối columns được chứa slot." });
  if (block.kind === "columns" && block.layout?.columns !== undefined) context.addIssue({ code: "custom", path: ["layout", "columns"], message: "Khối columns lấy số cột từ slots; dùng gridTemplateColumns để đặt tỷ lệ." });
  if (block.variant && !variants[block.kind]?.includes(block.variant)) context.addIssue({ code: "custom", path: ["variant"], message: "Biến thể không được hỗ trợ cho loại khối này." });
  if (block.behavior?.slideshow && block.kind !== "featured") context.addIssue({ code: "custom", path: ["behavior"], message: "Slideshow hiện chỉ hỗ trợ khối featured." });
  if (block.data?.source.type === "articles" && !articleKinds.includes(block.kind)) context.addIssue({ code: "custom", path: ["data"], message: "Loại khối này không hỗ trợ nguồn articles." });
  if (block.data?.source.type === "static" && block.data.query.mode !== undefined) context.addIssue({ code: "custom", path: ["data", "query", "mode"], message: "Nguồn static không sử dụng mode." });
  if (block.data?.source.type === "content_entries") {
    const expected = block.kind === "stats" ? "stat" : block.kind === "links" ? "link" : block.kind;
    if (block.data.source.kind !== expected || block.data.query.mode !== undefined) context.addIssue({ code: "custom", path: ["data"], message: "Nguồn content_entries không khớp loại khối hoặc có mode không được hỗ trợ." });
  }
  for (const appearance of [block, block.responsive?.tablet, block.responsive?.mobile]) {
    for (const name of Object.keys(appearance?.parts ?? {})) if (name === "root" || !templateSelectors[block.kind].parts[name as PartName]) context.addIssue({ code: "custom", path: ["parts", name], message: "Part không được hỗ trợ; phần tử gốc dùng layout/style của block." });
  }
  block.content.items.forEach((item, index) => {
    if (block.kind === "stats" ? item.value === undefined || item.label === undefined : item.title === undefined) context.addIssue({ code: "custom", path: ["content", "items", index], message: "Nội dung mục không đúng loại khối." });
  });
  if (new Set(block.content.items.map((item) => item.id)).size !== block.content.items.length) context.addIssue({ code: "custom", path: ["content", "items"], message: "ID các mục phải khác nhau trong cùng khối." });
}));

export interface BuilderDocument {
  version: 2; meta: { name: string }; theme: { primaryColor?: string; fontFamily?: string };
  page: { layout?: LayoutConfig; style?: StyleConfig }; blocks: BuilderBlock[];
}
/** Schema nguồn chuẩn; khai báo cả input/output để nối pipeline v1 → v2 đúng kiểu. */
export const normalizedDocumentSchema: z.ZodType<BuilderDocument, BuilderDocument> = z.object({
  version: z.literal(2), meta: z.object({ name: z.string().max(100) }).strict(),
  theme: z.object({ primaryColor: colorSchema.optional(), fontFamily: z.string().max(100).regex(/^[\w\s,'"-]+$/).optional() }).strict(),
  page: partSchema, blocks: z.array(blockSchema).max(100),
}).strict().superRefine((document, context) => {
  const ids = new Set<string>(); let count = 0;
  const visit = (blocks: BuilderBlock[], depth: number): void => {
    if (depth > 6) { context.addIssue({ code: "custom", message: "Tối đa 6 tầng khối lồng nhau." }); return; }
    for (const block of blocks) {
      count += 1;
      if (ids.has(block.id)) context.addIssue({ code: "custom", message: `ID bị trùng: ${block.id}` });
      ids.add(block.id);
      for (const slot of block.slots ?? []) {
        if (ids.has(slot.id)) context.addIssue({ code: "custom", message: `ID slot bị trùng: ${slot.id}` });
        ids.add(slot.id); visit(slot.blocks, depth + 1);
      }
    }
  };
  visit(document.blocks, 0);
  if (count > 100) context.addIssue({ code: "custom", message: "Tối đa 100 khối trong toàn tài liệu." });
});

/** Dạng nguồn cũ chỉ tồn tại ở biên chuyển đổi, không được lưu trong store v2. */
export interface BlockSourceConfig { categorySlug: string; mode: "latest" | "hot"; limit: number; columns?: number; gridTemplate?: string; gap?: number; padding?: number; backgroundColor?: string }
export interface LegacyBuilderBlock {
  id: string; kind: BlockKind; title: string; description: string; eyebrow: string; items: string[];
  accent: BlockTheme["accent"]; accentColor?: string; fontFamily?: string; variant?: string;
  textStyles?: Partial<Record<TextStyleTarget, { size?: number; color?: string }>>;
  imageUrl?: string; autoSlide?: boolean; slideInterval?: number; dataSource?: BlockSourceConfig; slots?: LegacyBuilderBlock[][];
}
const legacySourceSchema = z.object({ categorySlug: z.string().max(100), mode: z.enum(["latest", "hot"]), limit: z.number().int().min(1).max(12), columns: z.number().int().min(1).max(6).optional(), gridTemplate: z.string().max(100).optional(), gap: z.number().min(0).max(512).optional(), padding: z.number().min(0).max(512).optional(), backgroundColor: z.string().max(50).optional() });
const legacyTextSchema = z.object({ size: z.number().min(8).max(96).optional(), color: z.string().max(30).optional() });
const legacyBlockSchema: z.ZodType<LegacyBuilderBlock, LegacyBuilderBlock> = z.lazy(() => z.object({
  id: z.string().min(1), kind: z.enum(blockKinds), title: z.string().max(200), description: z.string().max(1000), eyebrow: z.string().max(100), items: z.array(z.string().max(200)).max(12),
  accent: z.enum(["blue", "red", "green"]), accentColor: z.string().max(30).optional(), fontFamily: z.string().max(100).optional(), variant: z.string().max(50).optional(),
  textStyles: z.object({ eyebrow: legacyTextSchema.optional(), title: legacyTextSchema.optional(), description: legacyTextSchema.optional() }).optional(),
  imageUrl: z.string().max(2_000_000).optional(), autoSlide: z.boolean().optional(), slideInterval: z.number().int().min(1).max(30).optional(), dataSource: legacySourceSchema.optional(), slots: z.array(z.array(legacyBlockSchema)).max(6).optional(),
}));
const legacyDocumentSchema = z.object({ version: z.literal(1), name: z.string().max(100), pageWidth: z.number().int().min(640).max(1920).optional(), themeColor: z.string().max(30).optional(), themeFont: z.string().max(100).optional(), blocks: z.array(legacyBlockSchema).max(100) });

export const sourceDefaults: Record<BlockKind, BlockSourceConfig> = {
  hero: { categorySlug: "", mode: "latest", limit: 1, columns: 1 }, news: { categorySlug: "", mode: "latest", limit: 3, columns: 3 },
  notice: { categorySlug: "thong-bao", mode: "latest", limit: 3, columns: 1 }, stats: { categorySlug: "", mode: "latest", limit: 3, columns: 3 },
  links: { categorySlug: "", mode: "latest", limit: 4, columns: 4 }, text: { categorySlug: "", mode: "latest", limit: 1, columns: 1 },
  gallery: { categorySlug: "", mode: "latest", limit: 4, columns: 4 }, ticker: { categorySlug: "", mode: "latest", limit: 6, columns: 1 },
  featured: { categorySlug: "", mode: "latest", limit: 5, columns: 3 }, video: { categorySlug: "", mode: "latest", limit: 4, columns: 3 },
  events: { categorySlug: "", mode: "latest", limit: 5, columns: 2 }, tabs: { categorySlug: "", mode: "latest", limit: 6, columns: 3 }, columns: { categorySlug: "", mode: "latest", limit: 1, columns: 2 },
};
export const articleKinds: readonly BlockKind[] = ["news", "notice", "ticker", "featured", "video", "events", "tabs"];

/** Tạo ID ổn định cho nội dung; không cắt các mục dự phòng theo giới hạn hiển thị. */
export function itemsFromStrings(kind: BlockKind, blockId: string, values: string[], previous: BuilderItem[] = []): BuilderItem[] {
  return values.map((value, index) => {
    const id = previous[index]?.id ?? `${blockId}-item-${index + 1}`;
    if (kind !== "stats") return { ...previous[index], id, title: value };
    const separator = value.indexOf("|");
    return { id, value: separator < 0 ? value : value.slice(0, separator), label: separator < 0 ? "Chỉ số" : value.slice(separator + 1) };
  });
}
/** Adapter đọc tài liệu cũ và chuyển đúng nhóm, đơn vị và cây slot. */
export function normalizeLegacyBlock(block: LegacyBuilderBlock): BuilderBlock {
  const source = { ...sourceDefaults[block.kind], ...block.dataSource };
  const data: BlockDataConfig = articleKinds.includes(block.kind)
    ? { source: { type: "articles", categorySlug: source.categorySlug }, query: { mode: source.mode, limit: source.limit } }
    : block.kind === "columns" ? { source: { type: "static" }, query: { limit: 1 } }
      : { source: { type: "content_entries", kind: block.kind === "stats" ? "stat" : block.kind === "links" ? "link" : block.kind === "hero" ? "hero" : block.kind === "gallery" ? "gallery" : "text" }, query: { limit: source.limit } };
  const textStyles: BlockTextStyles = {};
  for (const target of textTargets) {
    const old = block.textStyles?.[target];
    if (old) textStyles[target] = { fontSize: old.size, color: old.color };
  }
  const count = source.columns ?? 2;
  return {
    id: block.id, kind: block.kind,
    content: { eyebrow: block.eyebrow, title: block.title, description: block.description, items: itemsFromStrings(block.kind, block.id, block.items), imageUrl: block.imageUrl },
    theme: { accent: block.accent, accentColor: block.accentColor || undefined, fontFamily: block.fontFamily || undefined }, data,
    variant: block.variant || undefined,
    textStyles: Object.keys(textStyles).length ? textStyles : undefined,
    behavior: block.autoSlide !== undefined || block.slideInterval !== undefined ? { slideshow: { autoplay: block.autoSlide ?? false, intervalMs: (block.slideInterval ?? 3) * 1000 } } : undefined,
    layout: block.kind === "columns" ? { display: "grid", gridTemplateColumns: source.gridTemplate || undefined, gap: source.gap } : undefined,
    style: block.kind === "columns" ? { backgroundColor: source.backgroundColor || undefined, padding: source.padding === undefined ? undefined : { top: source.padding, right: source.padding, bottom: source.padding, left: source.padding } } : undefined,
    parts: templateSelectors[block.kind].parts.items ? { items: { layout: { columns: source.columns } } } : undefined,
    slots: block.kind === "columns" ? Array.from({ length: Math.max(count, block.slots?.length ?? 0) }, (_, index) => ({ id: `${block.id}-column-${index + 1}`, blocks: (block.slots?.[index] ?? []).map(normalizeLegacyBlock) })) : undefined,
  };
}

/** Một cổng đọc cho JSON v1/v2; mọi giá trị trả về đều là tài liệu chuẩn v2. */
export const documentSchema = z.union([normalizedDocumentSchema, legacyDocumentSchema.transform((document): BuilderDocument => ({
  version: 2, meta: { name: document.name }, theme: { primaryColor: document.themeColor || undefined, fontFamily: document.themeFont || undefined },
  page: { layout: document.pageWidth === undefined ? undefined : { maxWidth: document.pageWidth } }, blocks: document.blocks.map(normalizeLegacyBlock),
}))]).pipe(normalizedDocumentSchema);
