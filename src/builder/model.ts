import { z } from "zod";

export const blockKinds = ["hero", "news", "notice", "stats", "links", "text", "gallery", "ticker", "featured", "video", "events", "tabs", "columns"] as const;
export type BlockKind = (typeof blockKinds)[number];

const dataSourceSchema = z.object({
  categorySlug: z.string().max(100),
  mode: z.enum(["latest", "hot"]),
  limit: z.number().int().min(1).max(12),
  columns: z.number().int().min(1).max(6).optional(),
  gridTemplate: z.string().max(100).optional(),
  gap: z.number().optional(),
  padding: z.number().optional(),
  backgroundColor: z.string().max(50).optional(),
});

/** Độ rộng trang mặc định (px), khớp với phần hiển thị trang đã xuất bản. */
export const DEFAULT_PAGE_WIDTH = 1140;
export const MIN_PAGE_WIDTH = 640;
export const MAX_PAGE_WIDTH = 1920;

/**
 * Chỉ chấp nhận mã màu hex (#rgb hoặc #rrggbb) để giá trị đưa vào CSS luôn an toàn.
 * Trả về undefined nếu giá trị không hợp lệ.
 */
export function sanitizeColor(value: string | undefined): string | undefined {
  return value && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? value : undefined;
}

/** Kích thước chữ (px) và màu chữ tùy chỉnh cho một phần nội dung của khối. */
export type TextStyle = { size?: number; color?: string };

/** Tùy chỉnh chữ cho nhãn nhỏ, tiêu đề và mô tả của khối. */
export type BlockTextStyles = {
  eyebrow?: TextStyle;
  title?: TextStyle;
  description?: TextStyle;
};

export type TextStyleTarget = keyof BlockTextStyles;

const textStyleSchema = z.object({
  size: z.number().min(8).max(96).optional(),
  color: z.string().max(30).optional(),
});

const textStylesSchema = z.object({
  eyebrow: textStyleSchema.optional(),
  title: textStyleSchema.optional(),
  description: textStyleSchema.optional(),
});

// ── Kiểu có slots (dùng recursion thủ công vì Zod z.lazy mất type inference) ──
export type BuilderBlock = {
  id: string;
  kind: BlockKind;
  title: string;
  description: string;
  eyebrow: string;
  accent: "blue" | "red" | "green";
  /** Màu nhấn tùy ý (mã hex), ưu tiên hơn `accent` khi có giá trị. */
  accentColor?: string;
  /** Kích thước và màu chữ của nhãn nhỏ, tiêu đề, mô tả. */
  textStyles?: BlockTextStyles;
  items: string[];
  variant?: string;
  imageUrl?: string;
  dataSource?: { 
    categorySlug: string; mode: "latest" | "hot"; limit: number; 
    columns?: number; 
    gridTemplate?: string; 
    gap?: number; 
    padding?: number; 
    backgroundColor?: string;
  };
  /** Chỉ dùng cho kind="columns": mảng các cột, mỗi cột là mảng block con */
  slots?: BuilderBlock[][];
};

// Zod schema cho validation – không cần recursive vì slots được parse thủ công
export const blockSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(blockKinds),
  title: z.string().max(200),
  description: z.string().max(1000),
  eyebrow: z.string().max(100),
  accent: z.enum(["blue", "red", "green"]),
  accentColor: z.string().max(30).optional(),
  textStyles: textStylesSchema.optional(),
  items: z.array(z.string().max(200)).max(8),
  variant: z.string().max(50).optional(),
  imageUrl: z.string().max(1000).optional(),
  dataSource: dataSourceSchema.optional(),
  slots: z.array(z.array(z.any())).optional(),
}) satisfies z.ZodType<Omit<BuilderBlock, "slots"> & { slots?: unknown[][] | undefined }>;

export const documentSchema = z.object({
  version: z.literal(1),
  name: z.string().max(100),
  pageWidth: z.number().int().min(MIN_PAGE_WIDTH).max(MAX_PAGE_WIDTH).optional(),
  themeColor: z.string().max(30).optional(),
  blocks: z.array(blockSchema).max(100),
}).refine((document) => new Set(document.blocks.map((block) => block.id)).size === document.blocks.length, {
  message: "ID của các khối phải khác nhau.",
});

export type BuilderDocument = { version: 1; name: string; pageWidth?: number; themeColor?: string; blocks: BuilderBlock[] };
export type BlockDataSource = z.infer<typeof dataSourceSchema>;

export function findBlock(blocks: BuilderBlock[], id: string): BuilderBlock | undefined {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.slots) {
      for (const col of block.slots) {
        const found = findBlock(col, id);
        if (found) return found;
      }
    }
  }
  return undefined;
}

const sourceDefaults: Record<BlockKind, BlockDataSource> = {
  hero:     { categorySlug: "", mode: "latest", limit: 1, columns: 1 },
  news:     { categorySlug: "", mode: "latest", limit: 3, columns: 3 },
  notice:   { categorySlug: "thong-bao", mode: "latest", limit: 3, columns: 1 },
  stats:    { categorySlug: "", mode: "latest", limit: 3, columns: 3 },
  links:    { categorySlug: "", mode: "latest", limit: 4, columns: 4 },
  text:     { categorySlug: "", mode: "latest", limit: 1, columns: 1 },
  gallery:  { categorySlug: "", mode: "latest", limit: 4, columns: 4 },
  ticker:   { categorySlug: "", mode: "latest", limit: 6, columns: 1 },
  featured: { categorySlug: "", mode: "latest", limit: 5, columns: 3 },
  video:    { categorySlug: "", mode: "latest", limit: 4, columns: 3 },
  events:   { categorySlug: "", mode: "latest", limit: 5, columns: 2 },
  tabs:     { categorySlug: "", mode: "latest", limit: 6, columns: 3 },
  columns:  { categorySlug: "", mode: "latest", limit: 1, columns: 2 },
};

export function getBlockSource(block: BuilderBlock): BlockDataSource {
  return { ...sourceDefaults[block.kind], ...block.dataSource };
}

export const blockCatalog: Record<BlockKind, { label: string; description: string; category: string }> = {
  hero:     { label: "Banner nổi bật",    description: "Tiêu đề và lời giới thiệu",       category: "Trang chủ" },
  news:     { label: "Tin tức",           description: "Danh sách tin theo thẻ",           category: "Tin tức" },
  notice:   { label: "Thông báo",         description: "Thông tin cần chú ý",              category: "Tin tức" },
  featured: { label: "Tin nổi bật",       description: "Tin lớn + danh sách tin nhỏ",      category: "Tin tức" },
  tabs:     { label: "Tab chuyên mục",    description: "Tin tức theo nhiều tab",            category: "Tin tức" },
  ticker:   { label: "Dải tin nhanh",     description: "Tin tức chạy ngang",               category: "Tin tức" },
  video:    { label: "Video nổi bật",     description: "Khối video và danh sách",          category: "Đa phương tiện" },
  gallery:  { label: "Thư viện ảnh",      description: "Ảnh từ cơ sở dữ liệu",            category: "Đa phương tiện" },
  events:   { label: "Lịch sự kiện",      description: "Danh sách sự kiện sắp tới",        category: "Tiện ích" },
  stats:    { label: "Số liệu",           description: "Các chỉ số nổi bật",               category: "Tiện ích" },
  links:    { label: "Liên kết nhanh",    description: "Lối tắt đến chuyên mục",           category: "Điều hướng" },
  text:     { label: "Đoạn văn",          description: "Nội dung văn bản đơn giản",        category: "Cơ bản" },
  columns:  { label: "Lưới cột",          description: "Chia thành nhiều cột kéo thả",     category: "Cơ bản" },
};

type BlockDefaults = Omit<BuilderBlock, "id" | "kind">;

const defaults: Record<BlockKind, BlockDefaults> = {
  hero: {
    eyebrow: "CỔNG THÔNG TIN ĐIỆN TỬ",
    title: "Kết nối tri thức, kiến tạo tương lai",
    description: "Cập nhật thông tin, chính sách và hoạt động giáo dục một cách nhanh chóng, minh bạch.",
    accent: "blue",
    items: [],
    dataSource: sourceDefaults.hero,
  },
  news: {
    eyebrow: "TIN MỚI NHẤT",
    title: "Tin tức và sự kiện",
    description: "Những thông tin nổi bật từ ngành giáo dục.",
    accent: "blue",
    items: ["Đổi mới giáo dục trong giai đoạn mới", "Tăng cường ứng dụng công nghệ trong dạy học", "Hoạt động hợp tác và phát triển giáo dục"],
    dataSource: sourceDefaults.news,
  },
  notice: {
    eyebrow: "CẦN BIẾT",
    title: "Thông báo từ Bộ",
    description: "Các thông tin điều hành và hướng dẫn mới được cập nhật.",
    accent: "red",
    items: ["Lịch làm việc tuần này", "Hướng dẫn triển khai nhiệm vụ năm học", "Thông tin tuyển sinh mới nhất"],
    dataSource: sourceDefaults.notice,
  },
  stats: {
    eyebrow: "TỔNG QUAN",
    title: "Giáo dục qua những con số",
    description: "Một vài chỉ số minh họa cho bố cục demo.",
    accent: "green",
    items: ["63|Tỉnh, thành phố", "24K+|Cơ sở giáo dục", "1.8M+|Nhà giáo"],
    dataSource: sourceDefaults.stats,
  },
  links: {
    eyebrow: "TRUY CẬP NHANH",
    title: "Dịch vụ và tiện ích",
    description: "Truy cập nhanh các chuyên mục thường dùng.",
    accent: "blue",
    items: ["Văn bản chỉ đạo", "Thủ tục hành chính", "Hỏi đáp", "Dữ liệu mở"],
    dataSource: sourceDefaults.links,
  },
  text: {
    eyebrow: "GIỚI THIỆU",
    title: "Về cổng thông tin",
    description: "Thêm nội dung giới thiệu hoặc một đoạn văn bản vào trang. Chọn khối này để chỉnh sửa thông tin ở bảng bên phải.",
    accent: "blue",
    items: [],
    dataSource: sourceDefaults.text,
  },
  gallery: {
    eyebrow: "HÌNH ẢNH",
    title: "Hoạt động qua hình ảnh",
    description: "Hình ảnh minh họa từ cơ sở dữ liệu.",
    accent: "blue",
    items: ["Lớp học sáng tạo", "Thư viện tri thức", "Chuyển đổi số", "Hoạt động giáo dục"],
    dataSource: sourceDefaults.gallery,
  },
  ticker: {
    eyebrow: "TIN NHANH",
    title: "Dải tin tức nhanh",
    description: "Tin tức mới nhất chạy ngang trang.",
    accent: "red",
    items: ["Bộ GD&ĐT công bố lịch thi THPT 2026", "Hội nghị đổi mới giáo dục toàn quốc", "Triển khai sách giáo khoa mới từ năm học 2026-2027", "Khai giảng năm học mới tại 63 tỉnh thành", "Thi học sinh giỏi quốc gia kết quả xuất sắc", "Chương trình học bổng sinh viên ưu tú 2026"],
    dataSource: sourceDefaults.ticker,
  },
  featured: {
    eyebrow: "TIN NỔI BẬT",
    title: "Tin tức nổi bật trong tuần",
    description: "Những thông tin quan trọng được chọn lọc.",
    accent: "blue",
    items: ["Đổi mới chương trình giáo dục phổ thông", "Hội nghị tổng kết năm học 2025-2026", "Kết quả kỳ thi tốt nghiệp THPT", "Triển khai dạy học trực tuyến toàn quốc", "Chính sách hỗ trợ học sinh vùng khó khăn"],
    dataSource: sourceDefaults.featured,
  },
  video: {
    eyebrow: "VIDEO",
    title: "Video hoạt động",
    description: "Các video ghi lại hoạt động giáo dục tiêu biểu.",
    accent: "blue",
    items: ["Lễ khai giảng năm học mới 2026", "Hội thảo chuyển đổi số trong giáo dục", "Cuộc thi học sinh giỏi toán quốc gia", "Giao lưu văn hóa các trường học", "Hoạt động thể thao học đường"],
    dataSource: sourceDefaults.video,
  },
  events: {
    eyebrow: "SỰ KIỆN",
    title: "Lịch sự kiện sắp tới",
    description: "Các sự kiện và hội thảo trong thời gian tới.",
    accent: "green",
    items: ["Hội nghị tổng kết năm học 2025-2026", "Lễ trao học bổng tài năng", "Tập huấn giáo viên toàn quốc", "Triển lãm giáo dục quốc tế", "Hội thảo ứng dụng AI trong giáo dục"],
    dataSource: sourceDefaults.events,
  },
  tabs: {
    eyebrow: "CHUYÊN MỤC",
    title: "Tin theo chuyên mục",
    description: "Xem tin theo từng chuyên mục riêng biệt.",
    accent: "blue",
    items: ["Mới nhất", "Nổi bật", "Giáo dục", "Xã hội"],
    dataSource: sourceDefaults.tabs,
  },
  columns: {
    eyebrow: "BỐ CỤC",
    title: "Khu vực nhiều cột",
    description: "Kéo thả các khối vào từng cột để tạo bố cục đa dạng.",
    accent: "blue",
    items: [],
    dataSource: sourceDefaults.columns,
    slots: [[], []], // 2 cột mặc định
  },
};

export function makeBlock(kind: BlockKind): BuilderBlock {
  return { id: crypto.randomUUID(), kind, ...structuredClone(defaults[kind]) };
}

export const starterDocument: BuilderDocument = {
  version: 1,
  name: "Trang chủ Cổng thông tin",
  blocks: [
    { id: "demo-hero",  kind: "hero",  ...defaults.hero },
    { id: "demo-news",  kind: "news",  ...defaults.news },
    { id: "demo-stats", kind: "stats", ...defaults.stats },
    { id: "demo-links", kind: "links", ...defaults.links },
  ],
};
