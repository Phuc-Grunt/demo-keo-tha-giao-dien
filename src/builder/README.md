# Cấu trúc mã builder

Các thư mục được chia theo trách nhiệm để tìm nhanh phần dữ liệu, hiển thị, chuyển đổi HTML và biên tập.

```text
builder/
├── BuilderApp.tsx
├── builderApi.ts
├── domain/
│   ├── schema.ts
│   └── model.ts
├── renderer/
│   ├── BlockRenderer.tsx
│   ├── PortalChrome.tsx
│   ├── appearance.ts
│   └── blocks/
├── html/
│   ├── htmlCodec.tsx
│   ├── HtmlTemplate.tsx
│   ├── htmlStyle.ts
│   ├── htmlReadableFormat.ts
│   ├── htmlInlineSettings.ts
│   ├── htmlInlineStyles.ts
│   ├── htmlTemplateContract.ts
│   └── htmlTemplateStyles.ts
└── editor/
    ├── store.ts
    ├── blockHtmlEditor.ts
    └── components/
        ├── EditorCanvas.tsx
        ├── SortableBlock.tsx
        ├── PaletteItem.tsx
        ├── paletteIcons.ts
        ├── inspector/
        │   ├── Inspector.tsx
        │   ├── InspectorControls.tsx
        │   └── controls/
        └── htmlEditor/
            ├── HtmlEditor.tsx
            ├── BlockList.tsx
            ├── BlockCodePane.tsx
            └── BlockPreview.tsx
```

## Trách nhiệm của từng nhóm

| Nhóm | Trách nhiệm |
| --- | --- |
| `BuilderApp.tsx` | Điều phối màn builder, dữ liệu API, kéo thả và thao tác xuất/nhập. |
| `builderApi.ts` | Gọi các API trang, chuyên mục, bài viết và nội dung động. |
| `domain/` | Schema JSON, chuyển dữ liệu cũ, cấu hình mặc định, danh mục block và thao tác với cây dữ liệu. |
| `renderer/` | Hiển thị block và khung cổng; registry selector và chuyển appearance thành CSS. |
| `html/` | Xuất/nhập HTML, cấu hình HTML thụ động, CSS, contract và HTML xem trước. Các API dùng DOM chạy trong trình duyệt. |
| `editor/` | Zustand store, adapter biên tập component và giao diện canvas/palette/inspector/HTML editor. |

## Cách sử dụng và phụ thuộc

- Trang `/` dùng `BuilderApp.tsx`; trang `/site` dùng renderer và mô hình dữ liệu.
- API và Supabase đọc schema/model qua `@/builder/domain/model`.
- Component HTML Editor nằm cạnh danh sách block, vùng mã và preview trong `editor/components/htmlEditor/`.
- Inspector và các control nằm trong `editor/components/inspector/`; `InspectorControls.tsx` giữ các export dùng chung của nhóm này.
- `renderer/appearance.ts` là mô-đun CSS/registry không dùng React hoặc DOM. Schema hiện dùng registry này để kiểm tra các part được hỗ trợ; appearance chỉ import kiểu từ schema.
- Một số component của khối Columns có thao tác biên tập và dùng store; cấu trúc này giữ nguyên cách hoạt động hiện có của khối.
- Giữ import trực tiếp tới mô-đun cần dùng. Khi chuyển file, cập nhật cả các nơi dùng trong `src/app` và `src/lib`.

Chi tiết định dạng dữ liệu và HTML: [JSON chuẩn và trình biên tập HTML](../../docs/builder-html.md).
