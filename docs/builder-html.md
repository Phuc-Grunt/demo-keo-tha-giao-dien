# JSON chuẩn và trình biên tập HTML

## Biên tập theo component

HTML Editor có danh sách component, hai tab **HTML / CSS** của block đang chọn và **preview toàn bộ vùng block**. Có thể chọn block trong danh sách hoặc nhấp trực tiếp vào preview; block được chọn có viền xanh. Bản sửa của các block được giữ khi chuyển lựa chọn và chỉ cập nhật store khi nhấn **Áp dụng vào builder**.

- Tab HTML chỉ chứa markup của component. JSON metadata, chữ ký kiểm tra và các thuộc tính contract dài được quản lý phía sau. Header/menu/footer của cổng thông tin được ứng dụng ghép khi hiển thị trang công khai hoặc preview trong builder.
- `data-node="n0"`, `data-node="n1"`... là mã ánh xạ ngắn; giữ các mã này và cấu trúc thẻ hiện có khi sửa nội dung.
- Tab CSS chỉ hiển thị style ghi đè của block. CSS mặc định được nạp sẵn; không đưa toàn bộ stylesheet vào vùng soạn thảo.
- Danh sách **Selector có thể chỉnh** cho biết các vùng đã có ánh xạ. Nhấp selector để thêm rule vào ô CSS. Rule được áp dụng trong component đang chọn, kể cả khi các block khác dùng cùng class.
- Với block nhiều cột, block con xuất hiện dưới dạng placeholder `data-component`. Chọn component con trong danh sách hoặc preview để sửa riêng.
- Các nội dung hiển thị lặp của cùng một item được đồng bộ khi chỉ một bản thay đổi; sửa nhiều bản thành các giá trị khác nhau sẽ báo lỗi.

Ví dụ style riêng của một component tin tức:

```css
.news-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.news-card {
  border-radius: 12px;
}
```

Xóa một thuộc tính khỏi tab CSS để trở về mặc định của template. Các cấu hình chưa xuất hiện trên DOM, nguồn DB, behavior và responsive vẫn được giữ. Tab CSS hiện chỉnh style cơ sở qua những selector/thuộc tính có ánh xạ; chưa nhận at-rule như `@media` hay selector tùy ý. Cấu hình responsive được bảo toàn phía sau.

Thêm/bớt component hoặc thay đổi cây thẻ dùng các thao tác của builder. Màn sửa mã hiện giữ cấu trúc component đã đăng ký để bảo đảm chuyển lại JSON.

## Xuất HTML chỉ gồm các block

**Xuất HTML block** tải tất cả block đang sửa trong một tệp `.html`, bao gồm block con. Tệp là các đoạn HTML component nối tiếp nhau, không có khung tài liệu hay cấu hình cuối tệp.

- Không xuất `DOCTYPE`, `html`, `head`, `body`, wrapper trang, header/menu/footer, stylesheet, JavaScript, JSON hoặc `<template>` cấu hình.
- HTML có indent theo cây, đầu/cuối mỗi block có chú thích tên và số thứ tự. Thuộc tính xuống dòng; `style` có mỗi khai báo CSS một dòng như template component.
- Style inline chỉ chứa style đã có trên component và các cấu hình riêng của block/part/field. CSS mặc định, reset, responsive và trạng thái được ứng dụng nạp khi preview; không trải toàn bộ CSS chung lên từng thẻ.
- Tệp giữ marker ngắn `data-id`, `data-block`, `data-part`, `data-field`, `data-item`, `data-item-field`, `data-slot`, `data-image` để ánh xạ nội dung/style. Cấu hình nguồn tin, slideshow, theme và contract nội bộ không đưa vào tệp.
- **Nhập lại vào bố cục gốc đang mở.** Ứng dụng lấy cấu hình không hiển thị từ bố cục này và ghép HTML theo ID. Muốn chuyển sang máy/bố cục khác, xuất thêm JSON rồi nhập JSON đó trước khi nhập các block HTML.

Ví dụ sửa chữ và kiểu chữ trực tiếp trong tệp xuất:

```html
<h2
  data-field="title"
  style="
    font-size: 28px;
    color: #2563eb;
  "
>Tin tức và sự kiện</h2>
```

Ví dụ sửa bố cục trên vùng danh sách đã có trong component:

```html
<div class="news-grid" data-part="items" style="gap: 24px; grid-template-columns: repeat(2, minmax(0, 1fr));">
  <!-- Các thẻ tin có sẵn -->
</div>
```

Sửa nội dung và style ngay trong block; phạm vi CSS có ánh xạ vẫn áp dụng như trong editor. Xóa style ghi đè để trở về mặc định của component. Thụt lề giữ nguyên nội dung của field và vùng có chữ xen icon để không đổi dữ liệu sau khi nhập.

Tệp fragment không phải trang web độc lập có giao diện đầy đủ. Xem kết quả bằng **Nhập HTML** và preview trong ứng dụng; slideshow/tab và dữ liệu động chạy sau khi áp dụng vào builder/trang công khai. Responsive và nguồn dữ liệu tiếp tục chỉnh trong Inspector. [Tệp mẫu trình bày](examples/trang-chu-inline-style.sample.html) trước đây chỉ minh họa mã và không dùng để nhập; hãy xuất từ bố cục đang mở.

Có thể nhập tệp chỉ chứa một hoặc vài block đã có, kể cả một block con: các block không có trong tệp giữ nguyên. Tệp chứa đủ block cấp trang sẽ áp dụng thứ tự cấp trang trong tệp; nhập một phần giữ vị trí của các block hiện tại. Giữ ID, các block con và cấu trúc bên trong component; thêm/xóa block bằng builder. ID không thuộc bố cục đang mở hoặc bị trùng được báo lỗi.

**Nhập HTML** tái tạo contract từ JSON của bố cục hiện tại, ghép các block theo ID, đọc nội dung/style và kiểm tra schema rồi mở danh sách component cùng preview. Newline trong style được chuẩn hóa trước khi đối chiếu. Chỉ nhấn **Áp dụng vào builder** mới cập nhật JSON trong store; có thể hoàn tác bằng Undo.

Tệp HTML toàn trang cũ, `blocks-v1`, `blocks-v2` và `blocks-v3` có metadata riêng vẫn được nhập mà không cần bố cục gốc. Lần xuất tiếp theo chỉ tạo các fragment block. HTML của website khác hoặc CSS ngoài phạm vi có ánh xạ tiếp tục được báo lỗi.

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

Các hàm trong `src/builder/html/htmlCodec.tsx` chạy trong trình duyệt, dùng DOM và renderer React hiện có:

```ts
const normalized = documentSchema.parse(input);
const html = documentToHtml(normalized);
const editedDocument = htmlToDocument(editedHtml, normalized);
```

- `documentToHtml`: lấy các block cấp trang cùng cây block con, giữ style riêng, rút gọn marker và định dạng fragment; không ghi khung trang/CSS chung/cấu hình vào tệp.
- `htmlToDocument(html, currentDocument?)`: fragment dùng bố cục hiện tại làm nguồn cấu hình, cập nhật các block theo ID và giữ các block không có trong tệp. Template cũ dùng metadata trong tệp. Cả hai luồng đều kiểm tra contract/schema trước khi trả JSON v2.
- `documentToEditorHtml`: tạo template nội bộ với contract đầy đủ cho màn sửa component, cũng chỉ dùng một metadata chung.
- `previewHtml`: tạo HTML xem trước trong iframe sandbox, loại bỏ script và nội dung chủ động.

`src/builder/editor/blockHtmlEditor.ts` quản lý lớp biên tập component: tách markup và CSS, khôi phục contract ẩn theo `data-node`, ghép các bản sửa vào template rồi dùng lại `htmlToDocument`. Không lưu chuỗi CSS tùy ý vào JSON.

Các tệp `HtmlTemplate.tsx`, `htmlTemplateStyles.ts`, `htmlTemplateContract.ts`, `htmlReadableFormat.ts`, `htmlInlineStyles.ts`, `htmlInlineSettings.ts` và `htmlStyle.ts` nằm trong `src/builder/html/`. `HtmlTemplate.tsx` chỉ kết xuất vùng block. `htmlTemplateStyles.ts` lấy CSS cần dùng từ CSSOM. `htmlTemplateContract.ts` khôi phục nền class/style và kiểm tra cấu trúc khi nhập tệp gọn; các phần không có ánh xạ vẫn được phát hiện trước khi áp dụng.

`htmlReadableFormat.ts` rút ngắn marker, định dạng fragment và thêm nhãn block. Import mở rộng alias và khôi phục cấu hình wrapper còn thiếu từ bố cục hiện tại hoặc metadata của tệp cũ.

`htmlInlineStyles.ts` và `htmlInlineSettings.ts` được giữ để đọc tệp v3 đã xuất trước đây. Luồng nhập fragment chỉ dùng phần chuẩn hóa style; không flatten CSS hoặc ghi cấu hình HTML ra tệp mới.

Template xuất dùng nội dung cấu hình/dự phòng, để việc nhập lại không ghi bài viết lấy từ DB vào cấu hình trang. Nguồn DB, truy vấn, các mục ngoài giới hạn hiển thị, cấu hình chưa có phần tử hiển thị và responsive được giữ từ bố cục đang mở. JSON là định dạng sao lưu đầy đủ.

## Contract của HTML

| Marker | Ý nghĩa |
| --- | --- |
| `data-builder-page`, `data-builder-version` | Khung trang và phiên bản. |
| `data-builder-format="blocks-v3"` | Định dạng cũ dùng style inline và cấu hình HTML thụ động. |
| `data-builder-page-blocks` | Vùng chứa block cấp trang. |
| `data-builder-block-id`, `data-builder-block-kind` | Định danh block. |
| `data-builder-field` | Nội dung và kiểu chữ của một field. |
| `data-builder-part` | Phần tử nhận layout/style; `root` ánh xạ vào layout/style của block. |
| `data-builder-item-id`, `data-builder-item-field` | Field của mục nội dung có ID. |
| `data-builder-slot-id` | Vùng chứa block con. |
| `data-builder-source-type`, `data-builder-limit`, `data-builder-category`, `data-builder-mode` | Nguồn dữ liệu và truy vấn. |
| `data-builder-settings` | Template cấu hình HTML thụ động của tệp v3. |
| `data-builder-document` | Metadata JSON của editor nội bộ và tệp v1/v2. |
| `data-builder-block-config` | Chỉ đọc để tương thích tệp HTML cũ. |

Các tên part được đăng ký theo loại block trong `src/builder/renderer/appearance.ts`. Fragment chỉ giữ các marker block/part/field/item/slot/image dạng ngắn. Nội dung/style trên DOM được đọc khi nhập; bố cục hiện tại giữ những cấu hình không có trong tệp. Giữ ID và cấu trúc component. Marker page, metadata và stylesheet chỉ thuộc template nội bộ hoặc định dạng cũ.

Bảng trên liệt kê marker nội bộ và cấu hình tương thích. Trong fragment, `data-id`/`data-block`, `data-field`, `data-part`, `data-item`/`data-item-field`, `data-slot` và `data-image` được mở rộng trước khi khôi phục contract. V2 dùng script `data-builder-document`; v3 dùng template `data-builder-settings`; tệp xuất mới không có hai vùng này.

Ví dụ chỉnh gap và nền vùng danh sách:

```html
<div class="news-grid" data-part="items" style="gap: 24px; background-color: #f3f4f6;">
  ...
</div>
```

Đặt `font-size`, `color`, `font-weight`, `font-family`, `line-height`, `text-align`, `font-style` trên field chữ. Đặt grid/flex, khoảng cách, kích thước, nền, màu, padding/margin, border và opacity trên part. Các phần tử lặp cùng một part dùng cùng cấu hình; các bản hiển thị cùng một item phải có nội dung thống nhất.

Một nhóm utility có ánh xạ được hỗ trợ: `grid`, `flex`, `grid-cols-1` đến `grid-cols-6`, `gap-*`, `p-*`, `m-*`, căn chỉnh, màu cơ bản và kiểu chữ. Khoảng cách utility dùng thang 4 px; một số giá trị như `gap-[24px]`, `bg-[#ffffff]`, `text-[20px]` được hỗ trợ. Inline style ghi đè utility. Xóa thuộc tính inline đang đặt nếu muốn chuyển sang utility cho thuộc tính đó.

HTML ngoài template, class/CSS chưa có ánh xạ, sửa phần tĩnh hoặc sửa CSS chung sẽ báo lỗi khi chuyển lại thành JSON. HTML Editor vẫn cho xem kết quả HTML/CSS đang gõ, nhưng nút áp dụng bị khóa khi chuyển đổi không hợp lệ. Metadata được quản lý phía sau trong chế độ component; tệp tải xuống giữ marker ngắn gọn và hệ thống khôi phục contract khi nhập lại.

## Cách sử dụng

1. Ở trang builder `/`, nhấn **Nhập JSON / HTML** để nạp JSON cũ hoặc mở HTML đã xuất.
2. Nhấn **HTML Editor** ở thanh dưới. Nếu đã chọn block trong builder, editor mở ngay component đó.
3. Chọn component từ danh sách hoặc nhấp vào preview. Sửa nội dung ở tab **HTML**, sửa style riêng ở tab **CSS**; preview cập nhật sau khoảng 350 ms. Có thể tắt **Trực tiếp** và dùng **Chạy**, hoặc đổi khung xem máy tính/điện thoại.
4. Khi tất cả component báo hợp lệ, nhấn **Áp dụng vào builder**. Store nhận JSON v2 và thao tác có thể hoàn tác bằng nút Undo.
5. **Xuất HTML block** tải các fragment cùng style riêng. Sửa tệp bên ngoài, rồi **Nhập HTML** vào bố cục này để xem và áp dụng. **Xuất JSON** trong builder sao lưu toàn bộ tài liệu đã áp dụng; nhập JSON gốc trước nếu chuyển bố cục sang nơi khác. Dùng thao tác lưu/xuất bản hiện có khi muốn ghi vào DB.

Preview iframe hiển thị HTML/CSS; không chạy slideshow, tab tương tác hoặc truy vấn DB. Sandbox không cho chạy script; trang cha xử lý nhấp chọn block, giữ vị trí cuộn và viền đánh dấu. Các hành vi và dữ liệu động chạy trong builder/trang công khai sau khi áp dụng.

## Trạng thái xác minh

Đã bổ sung schema, adapter, renderer, codec, màn biên tập theo component và định dạng xuất/nhập chỉ gồm vùng block. Đã rà soát mã nguồn; chưa xác minh chạy thực tế việc chuyển đổi hai chiều, giao diện trình duyệt hoặc đo dung lượng tệp xuất.

Không chạy các lệnh build/test/lint/kiểm tra kiểu theo hướng dẫn của kho mã.

Khi được yêu cầu xác minh, cần kiểm tra vòng v2 → fragment → v2 với bố cục gốc, không có khung tài liệu/CSS chung/cấu hình trong tệp, nhập một block và block con, giữ các block ngoài tệp, nguồn DB/responsive/mục ngoài limit, đổi thứ tự đủ block cấp trang, sửa/xóa override, nội dung/src/href và ID không thuộc bố cục/trùng ID. Kiểm tra thêm template cũ, mã không hợp lệ, preview, Undo và chọn component. Việc chuyển CSS qua DOM có thể chuẩn hóa cách viết màu/đơn vị; đánh giá tương đương theo nội dung, cấu hình và hiển thị thay vì chuỗi JSON giống từng ký tự.
