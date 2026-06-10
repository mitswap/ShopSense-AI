alter table if exists products
add column if not exists unit_price numeric not null default 0;
