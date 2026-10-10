# Hướng dẫn chỉnh HTML và CSS của block

Tài liệu này dành cho người chỉnh giao diện trang bằng **HTML Editor** hoặc bằng tệp **Xuất HTML block**. Mỗi block là một phần của bố cục đang mở, chẳng hạn `demo-news` là block tin tức trong bố cục mẫu.

## Cách nhanh nhất: sửa trong HTML Editor

1. Mở bố cục cần chỉnh và nhấn **HTML Editor**.
2. Chọn block trong danh sách hoặc nhấp vào block ở vùng xem trước.
3. Ở tab **HTML**, sửa chữ trong những thẻ có sẵn. Giữ nguyên `data-node` và cấu trúc thẻ.
4. Ở tab **CSS**, nhấn **Selector có thể chỉnh** để chọn vùng cần đổi kiểu, rồi viết các khai báo CSS. CSS mặc định đã được nạp sẵn; tab này chỉ chứa phần ghi đè của block đang chọn.
5. Kiểm tra vùng xem trước và thông báo hợp lệ, sau đó nhấn **Áp dụng vào builder**. Chỉ lúc này bố cục đang sửa mới được cập nhật.

Ví dụ trong tab CSS của block tin tức:

```css
.news-grid {
  gap: 24px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

Danh sách selector được hỗ trợ phụ thuộc loại block. Tab CSS không nhận mọi selector hoặc quy tắc như `@media`; nếu chưa thấy vùng cần sửa trong danh sách, hãy dùng các điều khiển của Builder hoặc Inspector.

## Sửa bằng tệp HTML xuất ra

1. Trong HTML Editor, nhấn **Xuất HTML block** để lấy tệp từ **chính bố cục đang mở**. Giữ một bản gốc để đối chiếu.
2. Mở tệp bằng trình soạn thảo văn bản. Tìm block theo `data-id`, ví dụ `data-id="demo-news"`.
3. Sửa nội dung trong những thẻ có `data-field` hoặc `data-item-field`. Muốn đổi giao diện, thêm hoặc sửa thuộc tính **`style`** trên phần tử có marker tương ứng. Tên thuộc tính là `style`, không phải `styles`.
4. Quay lại **đúng bố cục gốc**, nhấn **Nhập HTML**, chọn tệp và xem trước. Khi ứng dụng báo hợp lệ, nhấn **Áp dụng vào builder**.
5. Nếu cần lưu bản nháp hoặc đưa trang ra công khai, tiếp tục dùng thao tác lưu hoặc xuất bản của Builder. **Xuất JSON** là bản sao lưu đầy đủ; khi chuyển sang bố cục hoặc máy khác, nhập JSON gốc trước rồi mới nhập HTML block.

Ví dụ đổi nền block, kiểu chữ tiêu đề và khoảng cách các thẻ tin:

```html
<div class="block-wrap" data-id="demo-news" data-block="news">
  <section id="demo-news" class="render-block content-section news-section accent-blue"
           data-part="root" style="background-color: #f3f4f6; padding: 32px;">
    <div class="section-heading" data-part="heading">
      <h2 data-field="title" style="font-size: 28px; color: #2563eb;">Tin tức và sự kiện</h2>
    </div>
    <div class="news-grid" data-part="items" style="gap: 24px; grid-template-columns: repeat(3, minmax(0, 1fr));">
      <!-- Giữ các thẻ tin và marker khác từ tệp vừa xuất. -->
    </div>
  </section>
</div>
```

Đoạn trên **chỉ minh họa vị trí đặt `style`**. Khi sửa tệp thật, giữ nguyên toàn bộ các thẻ khác của block; không thay cả block bằng ví dụ rút gọn này.

## Những marker cần giữ

| Marker | Dùng để làm gì | Ví dụ |
| --- | --- | --- |
| `data-id` | Xác định block trong bố cục hiện tại | `demo-news` |
| `data-block` | Xác định loại block | `news` |
| `data-part` | Xác định vùng nhận kiểu dáng và bố cục | `root`, `heading`, `items`, `item`, `image` |
| `data-field` | Xác định chữ ở cấp block | `eyebrow`, `title`, `description` |
| `data-item` | Xác định một mục trong danh sách | `demo-news-item-1` |
| `data-item-field` | Xác định trường của mục đó | `title`, `value`, `label` |
| `data-slot` | Xác định ô chứa block con trong block cột | ID ô từ tệp xuất |
| `data-image`, `data-icon` | Xác định ảnh hoặc biểu tượng có ánh xạ | Giá trị từ tệp xuất |

Bạn không cần tự thêm đủ các marker này vào mọi block. **Giữ những marker có sẵn trong tệp đã xuất**. `data-id` phải khớp một block trong bố cục đang mở và không được trùng trong tệp. `demo-news` chỉ là ID của bố cục mẫu; block mới có ID khác. Giá trị `data-block` phải đúng loại block hiện có.

## Chỗ nào đặt CSS?

- Trên `data-part="root"`: nền, khoảng đệm, viền, kích thước của cả block.
- Trên `data-part="items"`: cách sắp xếp và khoảng cách của danh sách, ví dụ `gap`, `grid-template-columns`.
- Trên `data-field="title"` hoặc trường chữ khác: `font-size`, `color`, `font-weight`, `line-height`, `text-align`.
- Trên `data-part="item"`: kiểu của từng thẻ lặp. Các phần tử lặp dùng cùng một `data-part` nên đặt kiểu nhất quán vì chúng cùng ánh xạ về cấu hình block.

Các thuộc tính thường dùng gồm `background-color`, `color`, `padding`, `margin`, `gap`, `border-radius`, `border-color`, `width` và các thuộc tính chữ kể trên. Một số cú pháp CSS chỉ hợp lệ với giá trị cụ thể; ví dụ khoảng đệm dùng `px`. Nếu ứng dụng báo **CSS chưa được hỗ trợ**, bỏ khai báo đó hoặc chỉnh bằng Inspector. Vùng xem trước có thể hiện CSS đang gõ, nhưng **chỉ thông báo hợp lệ và nút Áp dụng khả dụng** mới xác nhận có thể lưu về cấu hình Builder.

## Những điều không sửa trong tệp HTML block

- Không thêm thẻ `<style>`, `<script>`, `html`, `head`, `body` hoặc stylesheet chung. Trong **tệp xuất**, CSS riêng được viết bằng `style="..."` ngay trên thẻ có marker. Tab CSS của **HTML Editor** là một cách sửa khác, không phải thẻ `<style>` trong tệp.
- Không xóa hoặc đổi `data-id`, `data-block`, `data-part`, `data-field`, `data-item` và những marker khác đã có.
- Không thêm hoặc xóa block hay đổi cấu trúc thẻ của component trong tệp. Hãy dùng Builder để thêm hoặc xóa block.
- Không xem tệp HTML block như một trang web hoàn chỉnh. Hãy **Nhập HTML** để xem trước với CSS nền của ứng dụng.

Có thể nhập tệp chỉ chứa một vài block đã có; những block không có trong tệp được giữ nguyên. Nguồn dữ liệu động, giao diện responsive và các cấu hình không hiện trong HTML tiếp tục được chỉnh trong Builder hoặc Inspector. Nếu gặp lỗi **ID không thuộc bố cục**, hãy mở đúng bố cục đã dùng để xuất tệp; nếu đã chuyển máy, nhập JSON gốc trước.

Chi tiết về định dạng, giới hạn ánh xạ và cấu trúc dữ liệu nằm trong [tài liệu kỹ thuật HTML Builder](builder-html.md).
