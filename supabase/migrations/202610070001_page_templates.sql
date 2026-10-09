-- Kho mẫu lưu bản sao độc lập của bố cục; chỉ API dùng service role được truy cập.
create table if not exists public.page_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  content jsonb not null,
  block_count integer not null default 0 check (block_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists page_templates_updated_at_idx on public.page_templates (updated_at desc);

alter table public.page_templates enable row level security;
revoke all on public.page_templates from anon, authenticated;
grant all on public.page_templates to service_role;
