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

## Một tệp HTML cho xuất và nhập

**Xuất HTML** tải tất cả block đang sửa trong một tệp `.html`, bao gồm block con và thứ tự của chúng. Tệp có khung HTML tối thiểu để mở bằng trình duyệt, nhưng vùng nội dung chỉ chứa các block; không kèm header/menu/footer của cổng hoặc giao diện quản trị.

- `data-builder-format="blocks-v3"` xác định định dạng xuất mới; JSON trong ứng dụng vẫn là schema v2. Các định dạng HTML toàn trang cũ, `blocks-v1` và `blocks-v2` tiếp tục được nhập.
- HTML có indent theo cây, đầu/cuối mỗi block có chú thích tên và số thứ tự. Thuộc tính xuống dòng; `style` có mỗi khai báo CSS một dòng như template component.
- CSS cơ sở khớp các component được gộp vào style của phần tử theo độ ưu tiên selector và thứ tự khai báo. Giữ các biến CSS để màu/font vẫn kế thừa đúng. Không lặp các rule reset trên mọi thẻ hoặc từng đường nét SVG.
- Hai stylesheet cuối tệp chỉ giữ reset dùng chung, media/container, hover/pseudo-element, animation và responsive của cấu hình. Rule responsive/trạng thái của component dùng `!important` để tiếp tục ghi đè style cơ sở inline. Không sao chép toàn bộ Tailwind hoặc CSS màn quản trị.
- **Không có JavaScript hay khối JSON trong tệp xuất.** Có đúng một `<template data-builder-settings>` chứa cấu hình bằng các thẻ/thuộc tính HTML có kiểu. Template không hiển thị khi mở bằng trình duyệt. Nội dung đã hiển thị đúng trên DOM được bỏ khỏi cấu hình, giữ các giá trị fallback, field vắng mặt, các mục ngoài limit, nguồn dữ liệu, behavior, appearance và responsive. Giá trị dùng tạo cấu trúc/alt của ảnh và URL gốc cũng được giữ để việc sửa chữ/src/href không làm sai baseline.
- Tệp dùng marker ngắn: `data-page`, `data-blocks`, `data-id`, `data-block`, `data-part`, `data-field`, `data-item`, `data-item-field`, `data-slot`, `data-image`. Các thuộc tính `data-name`, `data-theme-color`, `data-font-family`, `data-accent`, `data-variant`, `data-source`, `data-limit`, `data-mode`, `data-category-slug`, `data-content-kind`, `data-autoplay`, `data-interval-ms` thể hiện cấu hình ngay tại page/block. Class/style nền, danh sách field bắt buộc, nội dung dự phòng và chữ ký kiểm tra chỉ được tái tạo nội bộ khi nhập.

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

Phần cấu hình khôi phục và CSS dùng chung có nhãn riêng ở cuối tệp. Sửa nội dung và style ở vùng block phía trên; phạm vi CSS có ánh xạ vẫn áp dụng như trong editor. Các giá trị CSS mặc định nằm inline để đọc dễ hơn, được so với baseline và không tự trở thành cấu hình mới. Sửa shorthand như `background` hoặc `padding` được xét theo longhand, tránh nhầm gradient mặc định thành thay đổi khi chỉ sửa màu. Thụt lề giữ nguyên nội dung của field và vùng có chữ xen icon để không đổi dữ liệu sau khi nhập.

Giữ `<template data-builder-settings>` và các stylesheet cuối tệp để nhập lại đầy đủ. Không thêm JavaScript. Tệp mở độc lập hiển thị bản tĩnh: slideshow/tab chưa chạy tương tác, dữ liệu nguồn tin vẫn là nội dung dự phòng; cấu hình được khôi phục khi nhập vào ứng dụng. Responsive tiếp tục được chỉnh trong builder. [Tệp mẫu trình bày](examples/trang-chu-inline-style.sample.html) trước đây chỉ minh họa cách viết mã, không có cấu hình đầy đủ để nhập; hãy xuất lại từ ứng dụng để lấy tệp v3 hợp lệ.

Với tệp v3, đổi giá trị CSS nền thay vì xóa khai báo: ví dụ đổi `padding` thành `0px`. Xóa CSS nền có thể khiến tệp độc lập và template trong ứng dụng hiển thị khác nhau; importer báo rõ thuộc tính đó, không âm thầm bỏ thay đổi. Trong tab CSS của editor nội bộ vẫn có thể xóa override để trở về mặc định của component.

**Nhập HTML** nhận chính định dạng này: đọc cấu hình HTML thụ động, ghép nội dung nhìn thấy theo ID, kiểm tra schema, tạo lại CSS baseline và contract của component, đọc các sửa đổi rồi mở danh sách component. Newline trong style được chuẩn hóa trước khi đối chiếu; nội dung field vẫn được giữ nguyên. Chỉ nhấn **Áp dụng vào builder** mới cập nhật JSON trong store. Có thể đổi thứ tự các block đã có hoặc chuyển block giữa các slot có sẵn trong tệp; marker và cấu trúc bên trong component phải được giữ. ID mới cần được tạo trong builder để có cấu hình tương ứng.

Tệp HTML toàn trang xuất bằng phiên bản cũ vẫn được nhận qua bộ đọc cũ. Sau khi mở, editor dùng định dạng block mới và lần xuất tiếp theo sẽ tạo tệp mới gọn hơn. HTML của website khác hoặc CSS ngoài phạm vi có ánh xạ tiếp tục được báo lỗi, không tự suy đoán thành cấu hình.

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

- `documentToHtml`: kết xuất tất cả block, gộp CSS component vào style inline, viết cấu hình còn lại thành HTML trong template và loại contract nội bộ khỏi tệp tải xuống.
- `htmlToDocument`: nhận định dạng block mới hoặc template cũ, lấy nội dung/style được ánh xạ, ghép các cấu hình không hiển thị và kiểm tra schema trước khi trả JSON v2. Lỗi trong block có tên block để người dùng biết chỗ cần sửa.
- `documentToEditorHtml`: tạo template nội bộ với contract đầy đủ cho màn sửa component, cũng chỉ dùng một metadata chung.
- `previewHtml`: tạo HTML xem trước trong iframe sandbox, loại bỏ script và nội dung chủ động.

`blockHtmlEditor.ts` quản lý lớp biên tập component: tách markup và CSS, khôi phục contract ẩn theo `data-node`, ghép các bản sửa vào template rồi dùng lại `htmlToDocument`. Không lưu chuỗi CSS tùy ý vào JSON.

`HtmlTemplate.tsx` chỉ kết xuất vùng block. `htmlTemplateStyles.ts` lấy CSS cần dùng từ CSSOM. `htmlTemplateContract.ts` khôi phục nền class/style và kiểm tra cấu trúc khi nhập tệp gọn; các phần không có ánh xạ vẫn được phát hiện trước khi áp dụng.

`htmlReadableFormat.ts` rút ngắn marker, định dạng HTML/CSS và thêm nhãn block cho tệp xuất. Import mở rộng alias và lấy cấu hình wrapper còn thiếu từ metadata chung; các chữ ký CSS được tính lại sau khi định dạng và đổi selector.

`htmlInlineStyles.ts` xử lý cascade CSS của template, giữ reset ngắn và các rule không thể inline, đồng thời tạo baseline giống bản xuất để importer phân biệt CSS mặc định với thay đổi. `htmlInlineSettings.ts` viết/đọc cây cấu hình HTML có kiểu và ghép lại nội dung DOM theo ID. Metadata thụ động được kiểm tra cấu trúc, khóa, kiểu giá trị và độ sâu rồi kiểm tra lại bằng schema tài liệu.

Template xuất dùng nội dung cấu hình/dự phòng, để việc nhập lại không ghi bài viết lấy từ DB vào cấu hình trang. Nguồn DB, truy vấn, các mục ngoài giới hạn hiển thị, cấu hình chưa có phần tử hiển thị và responsive được giữ trong metadata.

## Contract của HTML

| Marker | Ý nghĩa |
| --- | --- |
| `data-builder-page`, `data-builder-version` | Khung trang và phiên bản. |
| `data-builder-format="blocks-v3"` | Định dạng xuất mới, style tại thẻ và cấu hình HTML thụ động. |
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

Các tên part được đăng ký theo loại block trong `appearance.ts`. Nội dung/style trên DOM có marker được ưu tiên khi nhập; metadata giữ những cấu hình không xuất hiện trên DOM. Giữ các marker nền, cấu trúc template và hai stylesheet được sinh sẵn.

Bảng trên gồm marker nội bộ và cấu hình tệp. Trong `blocks-v2`/`blocks-v3`, các marker nội dung tương ứng là `data-page`, `data-blocks`, `data-id`/`data-block`, `data-field`, `data-part`, `data-item`/`data-item-field`, `data-slot`. Bộ đọc mở rộng marker ngắn trước khi khôi phục contract. V2 dùng script `data-builder-document`; v3 dùng template `data-builder-settings` và không xuất script.

Ví dụ chỉnh gap và nền vùng danh sách:

```html
<div class="news-grid" data-builder-part="items" style="gap: 24px; background-color: #f3f4f6;">
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
5. **Xuất HTML** tải tất cả block cùng các bản sửa hợp lệ trong một tệp. **Nhập HTML** mở lại tệp đó để tiếp tục chỉnh. **Xuất JSON** trong builder tải tài liệu đã áp dụng. Dùng thao tác lưu/xuất bản hiện có khi muốn ghi vào DB.

Preview iframe hiển thị HTML/CSS; không chạy slideshow, tab tương tác hoặc truy vấn DB. Sandbox không cho chạy script; trang cha xử lý nhấp chọn block, giữ vị trí cuộn và viền đánh dấu. Các hành vi và dữ liệu động chạy trong builder/trang công khai sau khi áp dụng.

## Trạng thái xác minh

Đã bổ sung schema, adapter, renderer, codec, màn biên tập theo component và định dạng xuất/nhập chỉ gồm vùng block. Đã rà soát mã nguồn; chưa xác minh chạy thực tế việc chuyển đổi hai chiều, giao diện trình duyệt hoặc đo dung lượng tệp xuất.

Không chạy các lệnh build/test/lint/kiểm tra kiểu theo hướng dẫn của kho mã.

Khi được yêu cầu xác minh, cần kiểm tra JSON mẫu v1 với 5 block/20 mục, vòng v2 → HTML → v2, sửa nội dung/CSS nhiều component, chuyển lựa chọn, click chọn trên preview, cách ly CSS giữa các block cùng loại, block con trong slot, cấu hình responsive, nguồn DB và mã không hợp lệ. Với v3 cần kiểm tra không có script/khối JSON, template cấu hình chỉ xuất một lần, mục ngoài limit/fallback được giữ, sửa/xóa chữ và sửa src/href, đổi màu qua shorthand, không kèm khung cổng/CSS quản trị, CSS container/hover/animation được giữ, đổi thứ tự block, chuyển block giữa slot và nhập lại template cũ. Việc chuyển CSS qua DOM có thể chuẩn hóa cách viết màu/đơn vị; đánh giá tương đương theo nội dung, cấu hình và hiển thị thay vì chuỗi JSON giống từng ký tự.
