-- SME AI Dashboard — run in Supabase SQL Editor
-- Enable pgvector: Database → Extensions → vector

create extension if not exists vector;

-- Shops
create table if not exists shops (
  id text primary key,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products / inventory
create table if not exists products (
  id text primary key,
  shop_id text not null references shops(id) on delete cascade,
  sku text not null,
  name text not null,
  name_bn text not null,
  category text not null default 'সাধারণ',
  stock_qty numeric not null default 0,
  unit_cost numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (shop_id, sku)
);

-- Sales history
create table if not exists sales (
  id text primary key,
  shop_id text not null references shops(id) on delete cascade,
  product_id text not null references products(id) on delete cascade,
  sku text not null,
  sale_date date not null,
  qty_sold numeric not null default 0,
  revenue numeric not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_sales_shop_date on sales(shop_id, sale_date);
create index if not exists idx_products_shop on products(shop_id);

-- RAG knowledge chunks (optional: populate via seed script)
create table if not exists knowledge_chunks (
  id text primary key,
  category text not null,
  content text not null,
  content_bn text not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- RLS (permissive for hackathon demo — tighten for production)
alter table shops enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table knowledge_chunks enable row level security;

create policy "anon_all_shops" on shops for all using (true) with check (true);
create policy "anon_all_products" on products for all using (true) with check (true);
create policy "anon_all_sales" on sales for all using (true) with check (true);
create policy "anon_read_kb" on knowledge_chunks for select using (true);

-- KPI event log (scalability story)
create table if not exists kpi_events (
  id uuid primary key default gen_random_uuid(),
  shop_id text references shops(id) on delete cascade,
  event_type text not null,
  payload jsonb,
  created_at timestamptz default now()
);

alter table kpi_events enable row level security;
create policy "anon_insert_kpi" on kpi_events for insert with check (true);
