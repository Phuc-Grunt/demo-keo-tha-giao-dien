# JSON chuẩn và trình biên tập HTML

## Mô hình dữ liệu

JSON phiên bản 2 là tài liệu chính của trình dựng. Store, Inspector, renderer, nhập JSON, localStorage và các API lưu/đọc trang sử dụng cùng schema. `documentSchema.parse(input)` nhận v1 hoặc v2 và trả về v2; không cần sửa JSON cũ bằng tay.

| Nhóm | Nội dung |
| --- | --- |
| `meta` | Tên tài liệu: `meta.name`. |
| `page` | `layout` và `style` của khung trang. |
| `theme` | Màu chủ đạo và font chung. |
| `blocks[].content` | Nhãn, tiêu đề, mô tả, ảnh và các mục nội dung có ID. |
| `blocks[].data` | `source` và `query` cho dữ liệu động hoặc nguồn `static`. |
| `blocks[].theme` | Preset màu nhấn và màu/font riêng của block. |
| `blocks[].layout`, `style` | Bố cục và hiển thị phần tử gốc. |
| `blocks[].parts` | Bố cục và hiển thị các phần bên trong template. |
| `blocks[].textStyles` | Kiểu chữ cho `eyebrow`, `title`, `description`. |
| `blocks[].variant`, `behavior`, `responsive` | Biến thể, slideshow và cấu hình theo kích thước container. |
| `blocks[].slots` | Slot có ID và mảng `blocks` con. |

Ví dụ một block tin tức:

```json
{
  "id": "news-1",
  "kind": "news",
  "content": {
    "eyebrow": "TIN MỚI NHẤT",
    "title": "Tin tức và sự kiện",
    "description": "Thông tin từ ngành giáo dục.",
    "items": [{ "id": "news-1-item-1", "title": "Tiêu đề dự phòng" }]
  },
  "theme": { "accent": "blue" },
  "data": {
    "source": { "type": "articles", "categorySlug": "tin-tuc" },
    "query": { "mode": "latest", "limit": 3 }
  },
  "parts": { "items": { "layout": { "columns": 3, "gap": 20 } } }
}
```

`columns` là bố cục; `limit` là số mục hiển thị. Chuyển đổi không cắt `content.items` theo `limit`. Stats dùng object `{ "id", "value", "label" }` thay cho chuỗi có dấu `|`. Kích thước số dùng px, `lineHeight` dùng tỷ lệ và `intervalMs` dùng mili giây.

Với block `columns`, số slot xác định số cột; `layout.gridTemplateColumns` có thể đặt tỷ lệ như `1fr 2fr`. Giảm số cột trong Inspector chuyển nội dung dư vào cột cuối còn lại. Schema kiểm tra toàn bộ cây, ID block/slot không trùng, tối đa 100 block và độ sâu 6; mỗi block tối đa 12 mục và mỗi block columns tối đa 6 slot.

## Hai hàm chuyển đổi

Các hàm trong `src/builder/htmlCodec.tsx` chạy trong trình duyệt, dùng DOM và renderer React hiện có:

```ts
const normalized = documentSchema.parse(input);
const html = documentToHtml(normalized);
const editedDocument = htmlToDocument(editedHtml);
```

- `documentToHtml`: kết xuất template bằng các component hiện có, rồi gắn marker và metadata JSON không thực thi.
- `htmlToDocument`: đọc HTML đã sửa, lấy nội dung/style được ánh xạ, ghép các cấu hình không hiển thị và kiểm tra schema trước khi trả JSON v2.
- `previewHtml`: tạo HTML xem trước trong iframe sandbox, loại bỏ script và nội dung chủ động.

Template xuất dùng nội dung cấu hình/dự phòng, để việc nhập lại không ghi bài viết lấy từ DB vào cấu hình trang. Nguồn DB, truy vấn, các mục ngoài giới hạn hiển thị, cấu hình chưa có phần tử hiển thị và responsive được giữ trong metadata.

## Contract của HTML

| Marker | Ý nghĩa |
| --- | --- |
| `data-builder-page`, `data-builder-version` | Khung trang và phiên bản. |
| `data-builder-page-blocks` | Vùng chứa block cấp trang. |
| `data-builder-block-id`, `data-builder-block-kind` | Định danh block. |
| `data-builder-field` | Nội dung và kiểu chữ của một field. |
| `data-builder-part` | Phần tử nhận layout/style; `root` ánh xạ vào layout/style của block. |
| `data-builder-item-id`, `data-builder-item-field` | Field của mục nội dung có ID. |
| `data-builder-slot-id` | Vùng chứa block con. |
| `data-builder-source-type`, `data-builder-limit`, `data-builder-category`, `data-builder-mode` | Nguồn dữ liệu và truy vấn. |
| `data-builder-block-config`, `data-builder-document` | Metadata JSON trong script `application/json`. |

Các tên part được đăng ký theo loại block trong `appearance.ts`. Nội dung/style trên DOM có marker được ưu tiên khi nhập; metadata giữ những cấu hình không xuất hiện trên DOM. Giữ các marker nền, cấu trúc template và hai stylesheet được sinh sẵn.

Ví dụ chỉnh gap và nền vùng danh sách:

```html
<div class="news-grid" data-builder-part="items" style="gap: 24px; background-color: #f3f4f6;">
  ...
</div>
```

Đặt `font-size`, `color`, `font-weight`, `font-family`, `line-height`, `text-align`, `font-style` trên field chữ. Đặt grid/flex, khoảng cách, kích thước, nền, màu, padding/margin, border và opacity trên part. Các phần tử lặp cùng một part dùng cùng cấu hình; các bản hiển thị cùng một item phải có nội dung thống nhất.

Một nhóm utility có ánh xạ được hỗ trợ: `grid`, `flex`, `grid-cols-1` đến `grid-cols-6`, `gap-*`, `p-*`, `m-*`, căn chỉnh, màu cơ bản và kiểu chữ. Khoảng cách utility dùng thang 4 px; một số giá trị như `gap-[24px]`, `bg-[#ffffff]`, `text-[20px]` được hỗ trợ. Inline style ghi đè utility. Xóa thuộc tính inline đang đặt nếu muốn chuyển sang utility cho thuộc tính đó.

HTML ngoài template, class/CSS chưa có ánh xạ, sửa phần tĩnh hoặc sửa CSS chung sẽ báo lỗi khi chuyển lại thành JSON. HTML Editor vẫn cho xem kết quả HTML/CSS đang gõ, nhưng nút áp dụng bị khóa khi chuyển đổi không hợp lệ. Cấu hình responsive sửa trong metadata; CSS responsive được sinh lại khi áp dụng vào builder.

## Cách sử dụng

1. Ở trang builder `/`, nhấn **Nhập JSON / HTML** để nạp JSON cũ hoặc mở HTML đã xuất.
2. Nhấn **HTML Editor** ở thanh dưới để chuyển tài liệu hiện tại sang HTML.
3. Sửa mã ở cột trái; cột phải cập nhật sau khoảng 350 ms. Có thể tắt **Trực tiếp** và dùng **Chạy**, hoặc đổi khung xem máy tính/điện thoại.
4. Khi trạng thái báo hợp lệ, nhấn **Áp dụng vào builder**. Store nhận JSON v2 và thao tác có thể hoàn tác bằng nút Undo.
5. **Tải HTML** lưu mã đang sửa; **Xuất JSON** trong builder tải tài liệu đã áp dụng. Dùng thao tác lưu/xuất bản hiện có khi muốn ghi vào DB.

Preview iframe hiển thị HTML/CSS; không chạy slideshow, tab tương tác hoặc truy vấn DB. Các hành vi này chạy trong builder/trang công khai sau khi áp dụng. Thay đổi marker nguồn, theme, variant hoặc metadata có hiệu lực trong renderer sau khi áp dụng; preview mã hiện tại chỉ phản ánh HTML/CSS đang hiển thị.

## Trạng thái xác minh

Đã bổ sung triển khai schema, adapter, renderer, codec và màn biên tập. Đã rà soát mã nguồn; chưa xác minh chạy thực tế việc chuyển đổi hai chiều hay giao diện trình duyệt.

Không chạy các lệnh build/test/lint/kiểm tra kiểu theo hướng dẫn của kho mã.

Khi được yêu cầu xác minh, cần kiểm tra JSON mẫu v1 với 5 block/20 mục, vòng v2 → HTML → v2, sửa nội dung và CSS từng part, block con trong slot, cấu hình responsive, nguồn DB và các trường hợp HTML không hợp lệ. Việc chuyển CSS qua DOM có thể chuẩn hóa cách viết màu/đơn vị; đánh giá tương đương theo nội dung, cấu hình và hiển thị thay vì chuỗi JSON giống từng ký tự.
