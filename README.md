# Demo kéo thả giao diện + Supabase

Next.js, TypeScript và React. Trang biên tập ở `/`; kho mẫu ở `/templates`; trang đã xuất bản ở `/site`.

## Cấu trúc builder

Mã trong `src/builder/` được chia theo trách nhiệm: `domain/` chứa schema và mô hình dữ liệu, `renderer/` chứa các block hiển thị, `html/` chứa bộ xuất/nhập HTML, `editor/` chứa store và giao diện chỉnh sửa. `BuilderApp.tsx` điều phối màn builder; `builderApi.ts` xử lý gọi API. Xem [hướng dẫn cấu trúc builder](src/builder/README.md).

## JSON v2 và HTML Editor

Tài liệu builder được chuẩn hóa sang JSON v2, tách nội dung, nguồn dữ liệu, bố cục, style, theme và hành vi. JSON v1 được chuyển tự động khi nhập, đọc DB hoặc khôi phục bản nháp cục bộ.

Nút **HTML Editor** mở màn sửa theo từng component: chọn block, chỉnh tab HTML/CSS riêng và xem vùng block ở bên cạnh. **Xuất HTML block** chỉ tải markup của các block và style riêng ngay trên thẻ, không kèm `DOCTYPE`, `html/head/body`, khung trang, stylesheet, JavaScript, JSON hoặc template cấu hình. Marker `data-id`/`data-block`/`data-field`/`data-part` giúp nhập lại theo ID vào bố cục đang mở; nguồn dữ liệu, theme chung, responsive và các mục chưa hiển thị được giữ từ bố cục này. CSS mặc định được ứng dụng nạp khi preview. Dùng **Xuất JSON** để sao lưu đầy đủ hoặc chuyển sang nơi khác. Nhập HTML mở màn preview để kiểm tra trước khi nhấn **Áp dụng vào builder**; tệp HTML cũ có cấu hình vẫn nhập được. Xem [hướng dẫn sử dụng HTML block](docs/huong-dan-html-block.md) hoặc [tài liệu kỹ thuật HTML Builder](docs/builder-html.md).

## Giao diện Tailwind CSS và shadcn/ui

- Tailwind CSS 4 được nạp từ `src/app/globals.css` qua PostCSS. CSS hiện có trong `portal.css` và `workspace.css` vẫn áp dụng cho giao diện cũ.
- shadcn/ui dùng cấu hình `components.json`; các component được thêm vào `src/components/ui/`. Nút **Xuất bản** hiện dùng component `Button` làm ví dụ tích hợp.
- Để thêm component khác, chạy `npx shadcn@latest add card` từ thư mục dự án, sau đó import từ `@/components/ui/card`.

## Thiết lập lần đầu

1. Trong Supabase project `emgahpzaacjxpzvodvnh`, mở **SQL Editor** và chạy toàn bộ file [`supabase/migrations/202609290001_demo.sql`](supabase/migrations/202609290001_demo.sql). Script tạo `pages`, `categories`, `articles` và dữ liệu giả lập. Chạy lại không chèn trùng bản ghi mẫu.
   Sau đó chạy [`supabase/migrations/202609290002_dynamic_content.sql`](supabase/migrations/202609290002_dynamic_content.sql) để thêm URL ảnh và bảng `content_entries` cho Banner, Số liệu, Liên kết, Đoạn văn và Thư viện ảnh.
   Chạy tiếp [`supabase/migrations/202610070001_page_templates.sql`](supabase/migrations/202610070001_page_templates.sql) để tạo bảng kho mẫu `page_templates`.
2. Mở **Project Settings → API Keys**, lấy **secret key** (`sb_secret_...`). Thêm dòng `SUPABASE_SECRET_KEY=...` vào `.env.local` trên máy này. Giữ key này trong file local; không đưa vào mã client hoặc commit Git. URL và publishable key đã được cấu hình trong `.env.local`.
3. Chạy `yarn install` rồi `yarn dev`. Nếu server đang chạy khi sửa `.env.local`, khởi động lại server.
4. Mở `http://localhost:3000/`. Nhấn **Tải bản nháp từ DB** để lấy bố cục từ Supabase.
5. Kéo thả một trong bảy loại khối. Với Tin tức/Thông báo, chọn **Chuyên mục** và **Cách lấy bài**. Với các khối danh sách, chỉnh **Số mục hiển thị** và **Số cột trên máy tính**. Nhấn **Xuất bản** để lưu bản nháp và cập nhật trang công khai. Mở `http://localhost:3000/site` để xem kết quả.

## Dữ liệu và API

- `pages.draft_content` là bản đang sửa; `pages.published_content` là bản công khai. Lưu bản nháp không đổi trang `/site` cho tới khi xuất bản.
- Ở `/templates`, **Tạo mẫu mới** mở builder tại `/templates/new` với bố cục trống và bản nháp riêng. Chỉnh sửa, đặt tên rồi nhấn **Lưu mẫu** để thêm một bản ghi `page_templates`; quay về kho trước khi lưu vẫn giữ bản nháp mẫu để tiếp tục. **Sử dụng mẫu** nạp một bản sao vào bản nháp trang chủ và giữ nguyên mẫu gốc; trang `/site` chỉ đổi khi bạn xuất bản.
- `GET /api/templates` liệt kê mẫu; `GET /api/templates?id=...` tải một mẫu; `POST /api/templates` tạo mẫu mới; `DELETE /api/templates?id=...` xóa mẫu.
- `GET /api/page` đọc bản đã xuất bản. `GET /api/page?draft=1`, `PUT /api/page` và `POST /api/page/publish` tải, lưu và xuất bản mà không cần mã trong bản demo.
- `GET /api/categories` và `GET /api/articles?category=tin-tuc&mode=latest&limit=3` trả dữ liệu từ Supabase. `mode=hot` lấy các bài đánh dấu nổi bật, sắp xếp theo lượt xem.
- `GET /api/content?kind=gallery&limit=4` trả nội dung cho Banner (`hero`), Số liệu (`stat`), Liên kết (`link`), Đoạn văn (`text`) và Thư viện ảnh (`gallery`). URL ảnh nằm trong `articles.image_url` hoặc `content_entries.image_url`; demo trỏ tới các SVG trong `public/demo-images`. Có thể thay bằng URL công khai của Supabase Storage.
- Mỗi loại khối có component React riêng trong `src/builder/renderer/blocks/`. `BlockRenderer` chỉ chọn component theo `kind`. Bố cục và lựa chọn nguồn dữ liệu lưu trong JSON của bảng `pages`; nội dung được truy vấn từ các bảng dữ liệu khi hiển thị.
- Trình biên tập còn lưu bản nháp cục bộ trong trình duyệt để tránh mất công khi DB chưa sẵn sàng. Nếu đã có bản cục bộ, trang sẽ giữ bản đó cho tới khi bạn chủ động nhấn **Tải bản nháp từ DB**.

Ai truy cập được trình biên tập của bản demo cũng có thể sửa và xuất bản trang. Chỉ chạy cấu hình này trong môi trường tin cậy; khi làm sản phẩm thật, thêm xác thực và phân quyền theo người dùng.
