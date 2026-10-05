import { sourceDefaults, normalizeLegacyBlock, type LegacyBuilderBlock, type BlockSourceConfig, type BuilderBlock, type BuilderDocument, type BlockKind } from "./schema";
export * from "./schema";
export type BlockDataSource = BlockSourceConfig;

export const DEFAULT_PAGE_WIDTH = 1140;
export const MIN_PAGE_WIDTH = 640;
export const MAX_PAGE_WIDTH = 1920;

/** Độ rộng số cho khung biên tập; CSS vẫn hỗ trợ đơn vị trên các layout con. */
export function getPageWidth(document: BuilderDocument): number {
  const width = document.page.layout?.maxWidth;
  return typeof width === "number" ? width : DEFAULT_PAGE_WIDTH;
}

/** Chấp nhận màu hex cho bộ chọn màu của trình dựng. */
export function sanitizeColor(value: string | undefined): string | undefined {
  return value && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? value : undefined;
}

/** Tìm khối trong toàn bộ cây tài liệu. */
export function findBlock(blocks: BuilderBlock[], id: string): BuilderBlock | undefined {
  for (const block of blocks) {
    if (block.id === id) return block;
    for (const slot of block.slots ?? []) {
      const found = findBlock(slot.blocks, id);
      if (found) return found;
    }
  }
  return undefined;
}

/** Danh sách phẳng để resolver lấy dữ liệu cho cả khối nằm trong các cột. */
export function flattenBlocks(blocks: BuilderBlock[]): BuilderBlock[] {
  return blocks.flatMap((block) => [block, ...flattenBlocks((block.slots ?? []).flatMap((slot) => slot.blocks))]);
}

/** View cấu hình cho các control cũ; dữ liệu lưu vẫn tách data/layout/style. */
export function getBlockSource(block: BuilderBlock): BlockSourceConfig {
  const defaults = sourceDefaults[block.kind];
  return {
    categorySlug: block.data?.source.type === "articles" ? block.data.source.categorySlug : "",
    mode: block.data?.query.mode ?? defaults.mode,
    limit: block.data?.query.limit ?? defaults.limit,
    columns: block.kind === "columns" ? block.slots?.length ?? 2 : block.parts?.items?.layout?.columns ?? defaults.columns,
    gridTemplate: block.layout?.gridTemplateColumns,
    gap: block.layout?.gap,
    padding: block.style?.padding?.top,
    backgroundColor: block.style?.backgroundColor,
  };
}
export const blockCatalog: Record<BlockKind, { label: string; description: string; category: string }> = {
  hero: { label: "Banner nổi bật", description: "Tiêu đề và lời giới thiệu", category: "Trang chủ" },
  news: { label: "Tin tức", description: "Danh sách tin theo thẻ", category: "Tin tức" },
  notice: { label: "Thông báo", description: "Thông tin cần chú ý", category: "Tin tức" },
  featured: { label: "Tin nổi bật", description: "Tin lớn + danh sách tin nhỏ", category: "Tin tức" },
  tabs: { label: "Tab chuyên mục", description: "Tin tức theo nhiều tab", category: "Tin tức" },
  ticker: { label: "Dải tin nhanh", description: "Tin tức chạy ngang", category: "Tin tức" },
  video: { label: "Video nổi bật", description: "Khối video và danh sách", category: "Đa phương tiện" },
  gallery: { label: "Thư viện ảnh", description: "Ảnh từ cơ sở dữ liệu", category: "Đa phương tiện" },
  events: { label: "Lịch sự kiện", description: "Danh sách sự kiện sắp tới", category: "Tiện ích" },
  stats: { label: "Số liệu", description: "Các chỉ số nổi bật", category: "Tiện ích" },
  links: { label: "Liên kết nhanh", description: "Lối tắt đến chuyên mục", category: "Điều hướng" },
  text: { label: "Đoạn văn", description: "Nội dung văn bản đơn giản", category: "Cơ bản" },
  columns: { label: "Lưới cột", description: "Chia thành nhiều cột kéo thả", category: "Cơ bản" },
};

type BlockDefaults = Omit<LegacyBuilderBlock, "id" | "kind">;

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
    items: [
      "IECEE 2026: Kiến tạo giải pháp cho những yêu cầu mới của giáo dục và nguồn nhân lực",
      "Hướng dẫn thực hiện chính sách học bổng theo Nghị định số 179/2026/NĐ-CP",
      "Lấy ý kiến về quy định Hội giảng nhà giáo giáo dục nghề nghiệp",
      "Bộ GDĐT công bố 14 thủ tục hành chính mới, thay thế 34 thủ tục",
      "Rà soát, đánh giá nhiệm vụ trọng tâm đầu năm học đối với giáo dục mầm non, phổ thông",
      "Ngoại ngữ chuyên ngành và khảo thí quốc tế tại Triển lãm Giáo dục và Công nghệ giáo dục",
      "Tổ chức hoàn thiện sách giáo khoa, bảo đảm tính kế thừa, không gây xáo trộn",
    ],
    dataSource: sourceDefaults.news,
  },
  notice: {
    eyebrow: "CẦN BIẾT",
    title: "Thông báo từ Bộ",
    description: "Các thông tin điều hành và hướng dẫn mới được cập nhật.",
    accent: "red",
    items: [
      "Hướng dẫn thực hiện chính sách học bổng theo Nghị định số 179/2026/NĐ-CP",
      "Lấy ý kiến về quy định Hội giảng nhà giáo giáo dục nghề nghiệp",
      "Bộ GDĐT công bố 14 thủ tục hành chính mới, thay thế 34 thủ tục"
    ],
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
    items: [
      "IECEE 2026: Kiến tạo giải pháp cho những yêu cầu mới của giáo dục và nguồn nhân lực",
      "Hướng dẫn thực hiện chính sách học bổng theo Nghị định số 179/2026/NĐ-CP",
      "Lấy ý kiến về quy định Hội giảng nhà giáo giáo dục nghề nghiệp",
      "Bộ GDĐT công bố 14 thủ tục hành chính mới, thay thế 34 thủ tục",
      "Rà soát, đánh giá nhiệm vụ trọng tâm đầu năm học đối với giáo dục mầm non, phổ thông",
      "Ngoại ngữ chuyên ngành và khảo thí quốc tế tại Triển lãm Giáo dục và Công nghệ giáo dục"
    ],
    dataSource: sourceDefaults.ticker,
  },
  featured: {
    eyebrow: "TIN NỔI BẬT",
    title: "Tin tức nổi bật trong tuần",
    description: "Những thông tin quan trọng được chọn lọc.",
    accent: "blue",
    items: [
      "IECEE 2026: Kiến tạo giải pháp cho những yêu cầu mới của giáo dục và nguồn nhân lực",
      "Hướng dẫn thực hiện chính sách học bổng theo Nghị định số 179/2026/NĐ-CP",
      "Lấy ý kiến về quy định Hội giảng nhà giáo giáo dục nghề nghiệp",
      "Bộ GDĐT công bố 14 thủ tục hành chính mới, thay thế 34 thủ tục",
      "Rà soát, đánh giá nhiệm vụ trọng tâm đầu năm học đối với giáo dục mầm non, phổ thông",
      "Ngoại ngữ chuyên ngành và khảo thí quốc tế tại Triển lãm Giáo dục và Công nghệ giáo dục",
      "Tổ chức hoàn thiện sách giáo khoa, bảo đảm tính kế thừa, không gây xáo trộn",
    ],
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

/** Tạo khối mới trực tiếp theo cấu trúc chuẩn v2. */
export function makeBlock(kind: BlockKind): BuilderBlock {
  return normalizeLegacyBlock({ id: crypto.randomUUID(), kind, ...structuredClone(defaults[kind]) });
}

export const starterDocument: BuilderDocument = {
  version: 2,
  meta: { name: "Trang chủ Cổng thông tin" },
  theme: {},
  page: {},
  blocks: (["hero", "news", "stats", "links"] as const).map((kind) =>
    normalizeLegacyBlock({ id: `demo-${kind}`, kind, ...structuredClone(defaults[kind]) }),
  ),
};
