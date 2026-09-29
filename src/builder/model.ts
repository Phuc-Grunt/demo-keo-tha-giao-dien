import { z } from "zod";

export const blockKinds = ["hero", "news", "notice", "stats", "links", "text", "gallery"] as const;
export type BlockKind = (typeof blockKinds)[number];

const dataSourceSchema = z.object({
  categorySlug: z.string().max(100),
  mode: z.enum(["latest", "hot"]),
  limit: z.number().int().min(1).max(12),
  columns: z.number().int().min(1).max(4).optional(),
});

export const blockSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(blockKinds),
  title: z.string().max(200),
  description: z.string().max(1000),
  eyebrow: z.string().max(100),
  accent: z.enum(["blue", "red", "green"]),
  items: z.array(z.string().max(200)).max(8),
  dataSource: dataSourceSchema.optional(),
});

export const documentSchema = z.object({
  version: z.literal(1),
  name: z.string().max(100),
  blocks: z.array(blockSchema).max(100),
}).refine((document) => new Set(document.blocks.map((block) => block.id)).size === document.blocks.length, {
  message: "ID của các khối phải khác nhau.",
});

export type BuilderBlock = z.infer<typeof blockSchema>;
export type BuilderDocument = z.infer<typeof documentSchema>;
export type BlockDataSource = z.infer<typeof dataSourceSchema>;

const sourceDefaults: Record<BlockKind, BlockDataSource> = {
  hero: { categorySlug: "", mode: "latest", limit: 1, columns: 1 },
  news: { categorySlug: "", mode: "latest", limit: 3, columns: 3 },
  notice: { categorySlug: "thong-bao", mode: "latest", limit: 3, columns: 1 },
  stats: { categorySlug: "", mode: "latest", limit: 3, columns: 3 },
  links: { categorySlug: "", mode: "latest", limit: 4, columns: 4 },
  text: { categorySlug: "", mode: "latest", limit: 1, columns: 1 },
  gallery: { categorySlug: "", mode: "latest", limit: 4, columns: 4 },
};

export function getBlockSource(block: BuilderBlock): BlockDataSource {
  return { ...sourceDefaults[block.kind], ...block.dataSource };
}

export const blockCatalog: Record<BlockKind, { label: string; description: string; category: string }> = {
  hero: { label: "Banner nổi bật", description: "Tiêu đề và lời giới thiệu", category: "Nội dung" },
  news: { label: "Tin tức", description: "Danh sách tin theo thẻ", category: "Nội dung" },
  notice: { label: "Thông báo", description: "Thông tin cần chú ý", category: "Nội dung" },
  stats: { label: "Số liệu", description: "Các chỉ số nổi bật", category: "Dữ liệu" },
  links: { label: "Liên kết nhanh", description: "Lối tắt đến chuyên mục", category: "Điều hướng" },
  text: { label: "Đoạn văn", description: "Nội dung văn bản đơn giản", category: "Cơ bản" },
  gallery: { label: "Thư viện ảnh", description: "Ảnh từ cơ sở dữ liệu", category: "Nội dung" },
};

const defaults: Record<BlockKind, Omit<BuilderBlock, "id" | "kind">> = {
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
};

export function makeBlock(kind: BlockKind): BuilderBlock {
  return { id: crypto.randomUUID(), kind, ...structuredClone(defaults[kind]) };
}

export const starterDocument: BuilderDocument = {
  version: 1,
  name: "Trang chủ Cổng thông tin",
  blocks: [
    { id: "demo-hero", kind: "hero", ...defaults.hero },
    { id: "demo-news", kind: "news", ...defaults.news },
    { id: "demo-stats", kind: "stats", ...defaults.stats },
    { id: "demo-links", kind: "links", ...defaults.links },
  ],
};
