# Demo kéo thả giao diện + Supabase

Next.js, TypeScript và React. Trang biên tập ở `/`; trang đã xuất bản ở `/site`.

## Giao diện Tailwind CSS và shadcn/ui

- Tailwind CSS 4 được nạp từ `src/app/globals.css` qua PostCSS. CSS hiện có trong `portal.css` và `workspace.css` vẫn áp dụng cho giao diện cũ.
- shadcn/ui dùng cấu hình `components.json`; các component được thêm vào `src/components/ui/`. Nút **Xuất bản** hiện dùng component `Button` làm ví dụ tích hợp.
- Để thêm component khác, chạy `npx shadcn@latest add card` từ thư mục dự án, sau đó import từ `@/components/ui/card`.

## Thiết lập lần đầu

1. Trong Supabase project `emgahpzaacjxpzvodvnh`, mở **SQL Editor** và chạy toàn bộ file [`supabase/migrations/202609290001_demo.sql`](supabase/migrations/202609290001_demo.sql). Script tạo `pages`, `categories`, `articles` và dữ liệu giả lập. Chạy lại không chèn trùng bản ghi mẫu.
   Sau đó chạy [`supabase/migrations/202609290002_dynamic_content.sql`](supabase/migrations/202609290002_dynamic_content.sql) để thêm URL ảnh và bảng `content_entries` cho Banner, Số liệu, Liên kết, Đoạn văn và Thư viện ảnh.
2. Mở **Project Settings → API Keys**, lấy **secret key** (`sb_secret_...`). Thêm dòng `SUPABASE_SECRET_KEY=...` vào `.env.local` trên máy này. Giữ key này trong file local; không đưa vào mã client hoặc commit Git. URL và publishable key đã được cấu hình trong `.env.local`.
3. Chạy `yarn install` rồi `yarn dev`. Nếu server đang chạy khi sửa `.env.local`, khởi động lại server.
4. Mở `http://localhost:3000/`. Nhấn **Tải bản nháp từ DB** để lấy bố cục từ Supabase.
5. Kéo thả một trong bảy loại khối. Với Tin tức/Thông báo, chọn **Chuyên mục** và **Cách lấy bài**. Với các khối danh sách, chỉnh **Số mục hiển thị** và **Số cột trên máy tính**. Nhấn **Xuất bản** để lưu bản nháp và cập nhật trang công khai. Mở `http://localhost:3000/site` để xem kết quả.

## Dữ liệu và API

- `pages.draft_content` là bản đang sửa; `pages.published_content` là bản công khai. Lưu bản nháp không đổi trang `/site` cho tới khi xuất bản.
- `GET /api/page` đọc bản đã xuất bản. `GET /api/page?draft=1`, `PUT /api/page` và `POST /api/page/publish` tải, lưu và xuất bản mà không cần mã trong bản demo.
- `GET /api/categories` và `GET /api/articles?category=tin-tuc&mode=latest&limit=3` trả dữ liệu từ Supabase. `mode=hot` lấy các bài đánh dấu nổi bật, sắp xếp theo lượt xem.
- `GET /api/content?kind=gallery&limit=4` trả nội dung cho Banner (`hero`), Số liệu (`stat`), Liên kết (`link`), Đoạn văn (`text`) và Thư viện ảnh (`gallery`). URL ảnh nằm trong `articles.image_url` hoặc `content_entries.image_url`; demo trỏ tới các SVG trong `public/demo-images`. Có thể thay bằng URL công khai của Supabase Storage.
- Mỗi loại khối có component React riêng trong `src/builder/blocks/`. `BlockRenderer` chỉ chọn component theo `kind`. Bố cục và lựa chọn nguồn dữ liệu lưu trong JSON của bảng `pages`; nội dung được truy vấn từ các bảng dữ liệu khi hiển thị.
- Trình biên tập còn lưu bản nháp cục bộ trong trình duyệt để tránh mất công khi DB chưa sẵn sàng. Nếu đã có bản cục bộ, trang sẽ giữ bản đó cho tới khi bạn chủ động nhấn **Tải bản nháp từ DB**.

Ai truy cập được trình biên tập của bản demo cũng có thể sửa và xuất bản trang. Chỉ chạy cấu hình này trong môi trường tin cậy; khi làm sản phẩm thật, thêm xác thực và phân quyền theo người dùng.
