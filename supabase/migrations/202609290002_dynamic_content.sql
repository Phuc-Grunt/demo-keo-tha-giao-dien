-- Dynamic content and image URLs for all visual builder blocks.
-- Safe to run again; demo content is inserted by stable slug.
alter table public.articles add column if not exists image_url text;

update public.articles
set image_url = case slug
  when 'demo-doi-moi-day-hoc' then '/demo-images/classroom.svg'
  when 'demo-chuyen-doi-so' then '/demo-images/digital.svg'
  when 'demo-hop-tac-giao-duc' then '/demo-images/campus.svg'
  when 'demo-giao-vien-sang-tao' then '/demo-images/library.svg'
  when 'demo-lich-lam-viec' then '/demo-images/library.svg'
  when 'demo-huong-dan-nam-hoc' then '/demo-images/classroom.svg'
  when 'demo-thong-tin-tuyen-sinh' then '/demo-images/campus.svg'
  when 'demo-hoi-dap-tuyen-sinh' then '/demo-images/digital.svg'
end
where image_url is null and slug like 'demo-%';

create table if not exists public.content_entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null check (kind in ('hero', 'stat', 'link', 'text', 'gallery')),
  title text not null,
  description text not null default '',
  image_url text,
  href text,
  metric_value text,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create index if not exists content_entries_kind_order_idx on public.content_entries (kind, sort_order, created_at);
alter table public.content_entries enable row level security;
revoke all on public.content_entries from anon, authenticated;
grant select on public.content_entries to anon, authenticated;
grant all on public.content_entries to service_role;
drop policy if exists content_entries_read_published on public.content_entries;
create policy content_entries_read_published on public.content_entries for select to anon, authenticated
  using (status = 'published');

insert into public.content_entries (slug, kind, title, description, image_url, href, metric_value, sort_order, status) values
  ('demo-hero', 'hero', 'Kết nối tri thức, kiến tạo tương lai', 'Cập nhật thông tin, chính sách và hoạt động giáo dục một cách nhanh chóng, minh bạch.', '/demo-images/campus.svg', '/site#demo-news', null, 1, 'published'),
  ('demo-stat-provinces', 'stat', 'Tỉnh, thành phố', 'Dữ liệu minh họa', null, null, '63', 1, 'published'),
  ('demo-stat-schools', 'stat', 'Cơ sở giáo dục', 'Dữ liệu minh họa', null, null, '24K+', 2, 'published'),
  ('demo-stat-teachers', 'stat', 'Nhà giáo', 'Dữ liệu minh họa', null, null, '1.8M+', 3, 'published'),
  ('demo-link-documents', 'link', 'Văn bản chỉ đạo', '', null, '/site#demo-news', null, 1, 'published'),
  ('demo-link-services', 'link', 'Thủ tục hành chính', '', null, '/site#demo-stats', null, 2, 'published'),
  ('demo-link-questions', 'link', 'Hỏi đáp', '', null, '/site#demo-news', null, 3, 'published'),
  ('demo-link-data', 'link', 'Dữ liệu mở', '', null, '/site#demo-stats', null, 4, 'published'),
  ('demo-text-about', 'text', 'Về cổng thông tin', 'Nội dung giới thiệu minh họa được lấy từ bảng content_entries. Người quản trị có thể thay nội dung này trong Supabase Table Editor.', null, null, null, 1, 'published'),
  ('demo-gallery-classroom', 'gallery', 'Lớp học sáng tạo', 'Hoạt động dạy và học', '/demo-images/classroom.svg', null, null, 1, 'published'),
  ('demo-gallery-library', 'gallery', 'Thư viện tri thức', 'Không gian đọc và học tập', '/demo-images/library.svg', null, null, 2, 'published'),
  ('demo-gallery-digital', 'gallery', 'Chuyển đổi số', 'Công nghệ trong giáo dục', '/demo-images/digital.svg', null, null, 3, 'published'),
  ('demo-gallery-campus', 'gallery', 'Môi trường giáo dục', 'Không gian học tập', '/demo-images/campus.svg', null, null, 4, 'published')
on conflict (slug) do nothing;
