-- Demo content for the visual page builder. Safe to run again: seed rows use stable slugs.
create extension if not exists pgcrypto;

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  draft_content jsonb not null,
  published_content jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_hot boolean not null default false,
  view_count integer not null default 0 check (view_count >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists articles_category_published_idx on public.articles (category_id, published_at desc);
create index if not exists articles_hot_idx on public.articles (is_hot, view_count desc);

alter table public.pages enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;

-- Only published page columns are readable with the publishable key. Draft JSON stays private.
grant usage on schema public to anon, authenticated, service_role;
revoke all on public.pages, public.categories, public.articles from anon, authenticated;
grant select (slug, name, published_content, published_at, updated_at) on public.pages to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.articles to anon, authenticated;
grant all on public.pages, public.categories, public.articles to service_role;

drop policy if exists pages_read_published on public.pages;
create policy pages_read_published on public.pages for select to anon, authenticated
  using (published_content is not null);
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select to anon, authenticated
  using (true);
drop policy if exists articles_read_published on public.articles;
create policy articles_read_published on public.articles for select to anon, authenticated
  using (status = 'published' and published_at <= now());

insert into public.categories (slug, name) values
  ('tin-tuc', 'Tin tức giáo dục'),
  ('thong-bao', 'Thông báo'),
  ('tuyen-sinh', 'Tuyển sinh')
on conflict (slug) do nothing;

insert into public.articles (category_id, slug, title, summary, status, is_hot, view_count, published_at)
select c.id, a.slug, a.title, a.summary, 'published', a.is_hot, a.view_count, now() - a.age
from (values
  ('tin-tuc', 'demo-doi-moi-day-hoc', 'Demo: Đổi mới phương pháp dạy học trong năm học mới', 'Bài viết giả lập phục vụ thử nghiệm giao diện.', true, 1240, interval '1 day'),
  ('tin-tuc', 'demo-chuyen-doi-so', 'Demo: Chuyển đổi số trong quản lý giáo dục', 'Bài viết giả lập phục vụ thử nghiệm giao diện.', true, 980, interval '2 days'),
  ('tin-tuc', 'demo-hop-tac-giao-duc', 'Demo: Hợp tác nâng cao chất lượng giáo dục', 'Bài viết giả lập phục vụ thử nghiệm giao diện.', false, 210, interval '3 days'),
  ('tin-tuc', 'demo-giao-vien-sang-tao', 'Demo: Giáo viên chia sẻ sáng kiến trong lớp học', 'Bài viết giả lập phục vụ thử nghiệm giao diện.', true, 760, interval '4 days'),
  ('thong-bao', 'demo-lich-lam-viec', 'Demo: Lịch làm việc của tuần', 'Thông báo giả lập phục vụ thử nghiệm giao diện.', false, 95, interval '1 day'),
  ('thong-bao', 'demo-huong-dan-nam-hoc', 'Demo: Hướng dẫn nhiệm vụ năm học', 'Thông báo giả lập phục vụ thử nghiệm giao diện.', true, 530, interval '5 days'),
  ('tuyen-sinh', 'demo-thong-tin-tuyen-sinh', 'Demo: Thông tin tuyển sinh cập nhật', 'Bài viết giả lập phục vụ thử nghiệm giao diện.', true, 880, interval '2 days'),
  ('tuyen-sinh', 'demo-hoi-dap-tuyen-sinh', 'Demo: Hỏi đáp về tuyển sinh', 'Bài viết giả lập phục vụ thử nghiệm giao diện.', false, 180, interval '6 days')
) as a(category_slug, slug, title, summary, is_hot, view_count, age)
join public.categories c on c.slug = a.category_slug
on conflict (slug) do nothing;

insert into public.pages (slug, name, draft_content, published_content, published_at)
values (
  'home',
  'Trang chủ Cổng thông tin',
  '{"version":1,"name":"Trang chủ Cổng thông tin","blocks":[{"id":"demo-hero","kind":"hero","eyebrow":"CỔNG THÔNG TIN ĐIỆN TỬ","title":"Kết nối tri thức, kiến tạo tương lai","description":"Cập nhật thông tin, chính sách và hoạt động giáo dục một cách nhanh chóng, minh bạch.","accent":"blue","items":[]},{"id":"demo-news","kind":"news","eyebrow":"TIN MỚI NHẤT","title":"Tin tức và sự kiện","description":"Những thông tin nổi bật từ ngành giáo dục.","accent":"blue","items":["Đổi mới giáo dục trong giai đoạn mới","Tăng cường ứng dụng công nghệ trong dạy học","Hoạt động hợp tác và phát triển giáo dục"],"dataSource":{"categorySlug":"","mode":"latest","limit":3}},{"id":"demo-stats","kind":"stats","eyebrow":"TỔNG QUAN","title":"Giáo dục qua những con số","description":"Một vài chỉ số minh họa cho bố cục demo.","accent":"green","items":["63|Tỉnh, thành phố","24K+|Cơ sở giáo dục","1.8M+|Nhà giáo"]},{"id":"demo-links","kind":"links","eyebrow":"TRUY CẬP NHANH","title":"Dịch vụ và tiện ích","description":"Truy cập nhanh các chuyên mục thường dùng.","accent":"blue","items":["Văn bản chỉ đạo","Thủ tục hành chính","Hỏi đáp","Dữ liệu mở"]}]}'::jsonb,
  '{"version":1,"name":"Trang chủ Cổng thông tin","blocks":[{"id":"demo-hero","kind":"hero","eyebrow":"CỔNG THÔNG TIN ĐIỆN TỬ","title":"Kết nối tri thức, kiến tạo tương lai","description":"Cập nhật thông tin, chính sách và hoạt động giáo dục một cách nhanh chóng, minh bạch.","accent":"blue","items":[]},{"id":"demo-news","kind":"news","eyebrow":"TIN MỚI NHẤT","title":"Tin tức và sự kiện","description":"Những thông tin nổi bật từ ngành giáo dục.","accent":"blue","items":[],"dataSource":{"categorySlug":"","mode":"latest","limit":3}},{"id":"demo-stats","kind":"stats","eyebrow":"TỔNG QUAN","title":"Giáo dục qua những con số","description":"Một vài chỉ số minh họa cho bố cục demo.","accent":"green","items":["63|Tỉnh, thành phố","24K+|Cơ sở giáo dục","1.8M+|Nhà giáo"]},{"id":"demo-links","kind":"links","eyebrow":"TRUY CẬP NHANH","title":"Dịch vụ và tiện ích","description":"Truy cập nhanh các chuyên mục thường dùng.","accent":"blue","items":["Văn bản chỉ đạo","Thủ tục hành chính","Hỏi đáp","Dữ liệu mở"]}]}'::jsonb,
  now()
)
on conflict (slug) do nothing;
