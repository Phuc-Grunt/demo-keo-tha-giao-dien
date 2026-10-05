<!-- BEGIN:nextjs-agent-rules -->

# Quy tắc dành cho tác nhân Next.js

## Phiên bản Next.js

**Đây có thể KHÔNG PHẢI phiên bản Next.js mà bạn đã biết.**

Dự án này có thể dùng phiên bản Next.js có thay đổi không tương thích về API, quy ước, cấu hình và cấu trúc tệp.

Trước khi viết hoặc sửa mã liên quan đến Next.js:

- Đọc tài liệu liên quan trong `node_modules/next/dist/docs/`.
- Xác định đường dẫn tài liệu tương đối với dự án này.
- Trong monorepo, gói `next` có thể không nằm ở thư mục gốc của kho mã; hãy tìm đúng vị trí gói trước.
- Tuân theo các thông báo về tính năng không còn được khuyến nghị và tài liệu đi kèm phiên bản Next.js đã cài đặt, thay vì chỉ dựa vào những quy ước Next.js đã biết trước đây.

Khối nội dung này được tạo tự động và có thể được `next dev` thêm lại.

Vị trí mã triển khai tham chiếu:

`node_modules/next/dist/server/lib/generate-agent-files.js`

Không xóa khối này chỉ để làm gọn Git diff. Nếu bị xóa, `next dev` có thể tạo lại và khiến kho mã xuất hiện thay đổi chưa được commit.

---

# Hướng dẫn của kho mã - phucnh

## 1. Yêu cầu chung đối với mã nguồn

### Chú thích

Khi tạo hoặc sửa mã nguồn:

- Mỗi component phải có chú thích ngắn giải thích mục đích của nó.
- Các hàm và phương thức quan trọng phải có chú thích giải thích chức năng của chúng.
- Chú thích nên tập trung vào mục đích, nghiệp vụ hoặc ý định, thay vì chỉ diễn đạt lại cú pháp mã.
- Logic phức tạp, quy tắc nghiệp vụ và điều kiện đặc biệt cần có chú thích giải thích lý do tồn tại.

Ví dụ TypeScript:

```ts
/**
 * Hiển thị danh sách bài viết và cho phép chọn bài viết để chỉnh sửa.
 */
const ArticleList = () => {
    // ...
};

export default ArticleList;

/**
 * Lấy thông tin bài viết theo mã định danh.
 */
async function getArticleById(id: string): Promise<ArticleDto> {
    // ...
}
```

Ví dụ C#:

```csharp
/// <summary>
/// Lấy thông tin bài viết theo mã định danh.
/// </summary>
public async Task<ArticleDto> GetArticleAsync(Guid id)
{
    // ...
}
```

### Quy ước component trong tệp TSX

- Khai báo React component bằng `const ComponentName = (props: ComponentNameProps) => { ... };`. Có thể dùng named export hoặc default export tùy cách các nơi khác đang import; không khai báo component bằng `function ComponentName`.
- Nếu một tệp `.tsx` chứa nhiều phần giao diện độc lập hoặc nhiều hàm chuyên trả về JSX, hãy tách chúng thành các component riêng, mỗi component ở một tệp phù hợp với thư mục của tính năng. Component cha giữ trách nhiệm ghép bố cục và điều phối dữ liệu.
- Hàm xử lý sự kiện, chuyển đổi dữ liệu hoặc tính toán không phải component. Chỉ chuyển chúng thành component khi chúng thực sự chịu trách nhiệm hiển thị giao diện.

---

## 2. Biên dịch, kiểm thử và xác minh

Sau khi sửa mã, **không tự động chạy lệnh build, test, lint hoặc kiểm tra kiểu** trừ khi người dùng yêu cầu rõ ràng.

Quy định này bao gồm nhưng không giới hạn ở:

- `dotnet build`
- `dotnet test`
- `npm run build`
- `npm test`
- `npm run lint`
- `yarn build`
- `yarn lint`
- `pnpm build`
- `pnpm lint`
- `ng build`
- `tsc`
- `tsc --noEmit`
- Mọi lệnh khác có thể kích hoạt biên dịch, build, lint, kiểm thử hoặc kiểm tra kiểu

Việc biên dịch và xác minh bản build do người dùng thực hiện.

Sau khi hoàn tất thay đổi mã, phần tóm tắt cuối cùng phải nêu rõ:

> Không chạy các lệnh build/test/lint/kiểm tra kiểu theo hướng dẫn của kho mã.

Không chạy build chỉ để kiểm tra mã vừa sửa có biên dịch được hay không, trừ khi người dùng yêu cầu rõ ràng.

---

## 3. Backend C#

Khi sửa mã backend C#:

- Không chạy `dotnet build`.
- Không chạy `dotnet test`.
- Không chạy lệnh có thể kích hoạt build backend.
- Để người dùng tự biên dịch và xác minh bản build.
- Ưu tiên tiêm phụ thuộc qua interface khi đã có interface phù hợp.
- Không tiêm lớp triển khai cụ thể khi đã có interface hoặc hợp đồng phù hợp.

Nên dùng:

```csharp
private readonly IArticleRepository _articleRepository;

public ArticleAppService(IArticleRepository articleRepository)
{
    _articleRepository = articleRepository;
}
```

Tránh dùng:

```csharp
private readonly ArticleRepository _articleRepository;
```

Trừ khi framework hoặc kiến trúc dự án yêu cầu rõ ràng phải dùng lớp triển khai cụ thể.

DTO, entity, value object và lớp triển khai vẫn có thể là class khi phù hợp.

---

## 4. Kiểu dữ liệu chặt chẽ trong TypeScript

Toàn bộ mã TypeScript mới hoặc được sửa phải giữ kiểu dữ liệu chặt chẽ.

### Không sử dụng

- `any`
- `unknown` để né tránh việc khai báo kiểu phù hợp
- `as any`
- `as unknown`
- Các phép ép kiểu nối tiếp không an toàn
- `@ts-ignore`
- Các cách tương tự nhằm bỏ qua kiểm tra kiểu

### Định nghĩa và sử dụng interface hoặc type có tên cho

- Props của component
- State của component
- Yêu cầu API
- Phản hồi API
- Payload
- Callback
- Kết quả của service
- Cấu trúc object
- Dữ liệu biểu mẫu
- State của store
- Action của store

Ưu tiên dùng DTO được tạo sẵn, interface của proxy hoặc kiểu dữ liệu hiện có trong dự án trước khi tạo kiểu mới.

Ví dụ:

```ts
interface ArticleListProps {
    categoryId: string;
    onSelect: (articleId: string) => void;
}

interface ArticleResponse {
    id: string;
    title: string;
    content: string;
}
```

Không viết:

```ts
function handleArticle(data: any) {
    // ...
}
```

---

## 5. Ngôn ngữ tài liệu

Khi tạo hoặc cập nhật:

- Tệp Markdown
- Tệp README
- Tài liệu kỹ thuật
- Hướng dẫn sử dụng
- Tài liệu nghiệp vụ
- Chú thích dài về logic nghiệp vụ
- Hướng dẫn hoặc quy định của kho mã

hãy dùng **tiếng Việt có dấu đầy đủ**, trừ khi người dùng yêu cầu rõ ràng ngôn ngữ khác.

Các mục sau vẫn phải tuân theo quy ước đặt tên hiện có của mã nguồn:

- Class
- Hàm
- Biến
- Interface
- Type
- API
- Trường dữ liệu trong cơ sở dữ liệu

---

## 6. Quy tắc khi sửa mã

Khi xử lý yêu cầu sửa mã:

1. Đọc mã hiện có và cấu trúc dự án liên quan trước khi thay đổi.
2. Với thay đổi liên quan đến Next.js, kiểm tra tài liệu phù hợp trong `node_modules/next/dist/docs/` nếu công việc đụng đến API, quy ước, định tuyến, kết xuất, bộ nhớ đệm, cấu hình hoặc cấu trúc dự án của Next.js.
3. Tái sử dụng component, hook, service, DTO, interface và utility hiện có khi phù hợp.
4. Không tạo thêm lớp trừu tượng không cần thiết.
5. Không sửa logic không liên quan ngoài phạm vi yêu cầu, trừ khi cần thiết để hoàn thành thay đổi.
6. Giữ nguyên quy ước viết mã và phong cách kiến trúc hiện có của dự án.
7. Thêm chú thích cho component và các hàm hoặc phương thức quan trọng.
8. Giữ kiểu dữ liệu chặt chẽ.
9. Không tự động chạy lệnh build, test, lint hoặc kiểm tra kiểu.
10. Sau khi hoàn thành, cung cấp phần tóm tắt ngắn gọn gồm:
    - Nội dung đã thay đổi.
    - Những tệp đã sửa.
    - Cách logic chính thay đổi.
    - Xác nhận không chạy lệnh build/test/lint/kiểm tra kiểu.

---

## 7. Thứ tự ưu tiên

Nếu có mâu thuẫn giữa:

- kiến thức Next.js đã biết trước đây,
- các quy ước Next.js phổ biến,
- và tài liệu đi kèm phiên bản Next.js đã cài đặt,

thì ưu tiên tài liệu trong `node_modules/next/dist/docs/` của dự án hiện tại.

Nếu có mâu thuẫn giữa cách triển khai thông thường và hướng dẫn của kho mã này, hãy ưu tiên hướng dẫn của kho mã.

<!-- END:nextjs-agent-rules -->
