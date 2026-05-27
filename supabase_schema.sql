-- ============================================================================
-- SKINLY - SUPABASE BACKEND DATABASE SCHEMA (IDEMPOTENT)
-- ============================================================================
-- Execute this SQL script in your Supabase SQL Editor to initialize all tables,
-- relationships, constraints, indexes, triggers, and security policies (RLS).
-- This script is safe to run multiple times.

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('customer', 'affiliate', 'supplier', 'admin')) default 'customer',
  avatar text,
  phone text,
  address text,
  city text,
  postal_code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 2. CATEGORIES TABLE
-- ============================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 3. PRODUCTS TABLE
-- ============================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  ingredients text[] not null default '{}',
  category_id uuid references public.categories(id) on delete set null,
  price numeric(10,2) not null check (price >= 0),
  discount_price numeric(10,2) check (discount_price >= 0),
  stock integer not null check (stock >= 0) default 0,
  rating numeric(3,2) not null default 5.0 check (rating >= 0 and rating <= 5.0),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  image_url text not null,
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  supplier_id uuid references public.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 4. CART_ITEMS TABLE
-- ============================================================================
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0) default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- ============================================================================
-- 5. WISHLIST_ITEMS (FAVORITES) TABLE
-- ============================================================================
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- ============================================================================
-- 6. ORDERS TABLE
-- ============================================================================
create table if not exists public.orders (
  id text primary key, -- Custom Order ID (e.g., 'skn-1234')
  customer_id uuid not null references public.users(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  address text not null,
  city text not null,
  postal_code text not null,
  "references" text,
  payment_method text not null check (payment_method in ('credit_card', 'bank_transfer', 'delivery_cash')),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  discount_amount numeric(10,2) not null default 0.0 check (discount_amount >= 0),
  coupon_code text,
  shipping numeric(10,2) not null default 0.0 check (shipping >= 0),
  total numeric(10,2) not null check (total >= 0),
  status text not null check (status in ('pending', 'shipped', 'delivered', 'refunded')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 7. ORDER_ITEMS TABLE
-- ============================================================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  quantity integer not null check (quantity > 0),
  image_url text not null
);

-- ============================================================================
-- 8. AFFILIATES TABLE
-- ============================================================================
create table if not exists public.affiliates (
  user_id uuid primary key references public.users(id) on delete cascade,
  coupon_code text not null unique,
  commission_earned numeric(10,2) not null default 0.0 check (commission_earned >= 0),
  clicks_count integer not null default 0 check (clicks_count >= 0),
  referred_sales integer not null default 0 check (referred_sales >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 9. AFFILIATE_TRANSACTIONS (PAYOUT HISTORY) TABLE
-- ============================================================================
create table if not exists public.affiliate_transactions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(user_id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  status text not null check (status in ('pending', 'paid')) default 'pending',
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 10. COUPONS TABLE
-- ============================================================================
create table if not exists public.coupons (
  code text primary key,
  discount_percentage integer not null check (discount_percentage > 0 and discount_percentage <= 100),
  affiliate_id uuid references public.affiliates(user_id) on delete set null,
  is_active boolean not null default true,
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 11. SUPPLIERS TABLE
-- ============================================================================
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company_name text not null,
  ingredients_description text not null,
  documents_url text,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  verification_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 12. SUPPLIER_DOCUMENTS TABLE
-- ============================================================================
create table if not exists public.supplier_documents (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  document_name text not null,
  document_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 13. RETURNS TABLE
-- ============================================================================
create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  customer_id uuid not null references public.users(id) on delete cascade,
  reason text not null,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- ============================================================================
-- DATABASE PERFORMANCE INDEXES (Idempotent)
-- ============================================================================
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_supplier on public.products(supplier_id);
create index if not exists idx_cart_items_user on public.cart_items(user_id);
create index if not exists idx_wishlist_items_user on public.wishlist_items(user_id);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_affiliate_transactions_affiliate on public.affiliate_transactions(affiliate_id);
create index if not exists idx_coupons_affiliate on public.coupons(affiliate_id);
create index if not exists idx_suppliers_user on public.suppliers(user_id);
create index if not exists idx_supplier_documents_supplier on public.supplier_documents(supplier_id);
create index if not exists idx_returns_order on public.returns(order_id);
create index if not exists idx_returns_customer on public.returns(customer_id);


-- ============================================================================
-- SECURITY DEFINER ACCESS CONTROLS (Avoid recursion)
-- ============================================================================
create or replace function public.is_admin()
returns boolean security definer set search_path = public as $$
begin
  return exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql;


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & CONTROLS (Idempotent)
-- ============================================================================

-- Users table policies
alter table public.users enable row level security;
drop policy if exists "Allow users to read their own profile" on public.users;
create policy "Allow users to read their own profile" on public.users for select using (auth.uid() = id);
drop policy if exists "Allow users to update their own profile" on public.users;
create policy "Allow users to update their own profile" on public.users for update using (auth.uid() = id);
drop policy if exists "Allow admins full access to users" on public.users;
create policy "Allow admins full access to users" on public.users for all using (public.is_admin());

-- Categories table policies
alter table public.categories enable row level security;
drop policy if exists "Allow public read access to categories" on public.categories;
create policy "Allow public read access to categories" on public.categories for select using (true);
drop policy if exists "Allow admins full access to categories" on public.categories;
create policy "Allow admins full access to categories" on public.categories for all using (public.is_admin());

-- Products table policies
alter table public.products enable row level security;
drop policy if exists "Allow public read access to products" on public.products;
create policy "Allow public read access to products" on public.products for select using (true);
drop policy if exists "Allow suppliers to insert their own products" on public.products;
create policy "Allow suppliers to insert their own products" on public.products for insert with check (
  supplier_id = auth.uid() and 
  exists (select 1 from public.users where id = auth.uid() and role = 'supplier')
);
drop policy if exists "Allow suppliers to update their own products" on public.products;
create policy "Allow suppliers to update their own products" on public.products for update using (
  supplier_id = auth.uid() and 
  exists (select 1 from public.users where id = auth.uid() and role = 'supplier')
);
drop policy if exists "Allow admins full access to products" on public.products;
create policy "Allow admins full access to products" on public.products for all using (public.is_admin());

-- Cart items table policies
alter table public.cart_items enable row level security;
drop policy if exists "Allow users to manage their own cart items" on public.cart_items;
create policy "Allow users to manage their own cart items" on public.cart_items for all using (auth.uid() = user_id);
drop policy if exists "Allow admins full access to cart items" on public.cart_items;
create policy "Allow admins full access to cart items" on public.cart_items for all using (public.is_admin());

-- Wishlist items table policies
alter table public.wishlist_items enable row level security;
drop policy if exists "Allow users to manage their own wishlist" on public.wishlist_items;
create policy "Allow users to manage their own wishlist" on public.wishlist_items for all using (auth.uid() = user_id);
drop policy if exists "Allow admins full access to wishlist" on public.wishlist_items;
create policy "Allow admins full access to wishlist" on public.wishlist_items for all using (public.is_admin());

-- Orders table policies
alter table public.orders enable row level security;
drop policy if exists "Allow users to access their own orders" on public.orders;
create policy "Allow users to access their own orders" on public.orders for all using (auth.uid() = customer_id);
drop policy if exists "Allow admins full access to orders" on public.orders;
create policy "Allow admins full access to orders" on public.orders for all using (public.is_admin());

-- Order items table policies
alter table public.order_items enable row level security;
drop policy if exists "Allow users to access their own order items" on public.order_items;
create policy "Allow users to access their own order items" on public.order_items for all using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id and orders.customer_id = auth.uid()
  )
);
drop policy if exists "Allow admins full access to order items" on public.order_items;
create policy "Allow admins full access to order items" on public.order_items for all using (public.is_admin());

-- Affiliates table policies
alter table public.affiliates enable row level security;
drop policy if exists "Allow affiliates to view their own stats" on public.affiliates;
create policy "Allow affiliates to view their own stats" on public.affiliates for select using (auth.uid() = user_id);
drop policy if exists "Allow affiliates to update their own stats" on public.affiliates;
create policy "Allow affiliates to update their own stats" on public.affiliates for update using (auth.uid() = user_id);
drop policy if exists "Allow admins to manage all affiliates" on public.affiliates;
create policy "Allow admins to manage all affiliates" on public.affiliates for all using (public.is_admin());

-- Affiliate transactions table policies
alter table public.affiliate_transactions enable row level security;
drop policy if exists "Allow affiliates to select their own transactions" on public.affiliate_transactions;
create policy "Allow affiliates to select their own transactions" on public.affiliate_transactions for select using (auth.uid() = affiliate_id);
drop policy if exists "Allow affiliates to request a payout" on public.affiliate_transactions;
create policy "Allow affiliates to request a payout" on public.affiliate_transactions for insert with check (auth.uid() = affiliate_id);
drop policy if exists "Allow admins to manage all affiliate transactions" on public.affiliate_transactions;
create policy "Allow admins to manage all affiliate transactions" on public.affiliate_transactions for all using (public.is_admin());

-- Coupons table policies
alter table public.coupons enable row level security;
drop policy if exists "Allow public to view coupons" on public.coupons;
create policy "Allow public to view coupons" on public.coupons for select using (true);
drop policy if exists "Allow affiliates to manage their own coupons" on public.coupons;
create policy "Allow affiliates to manage their own coupons" on public.coupons for all using (auth.uid() = affiliate_id);
drop policy if exists "Allow admins to manage all coupons" on public.coupons;
create policy "Allow admins to manage all coupons" on public.coupons for all using (public.is_admin());

-- Suppliers table policies
alter table public.suppliers enable row level security;
drop policy if exists "Allow suppliers to manage their own applications" on public.suppliers;
create policy "Allow suppliers to manage their own applications" on public.suppliers for all using (auth.uid() = user_id);
drop policy if exists "Allow admins to manage all suppliers applications" on public.suppliers;
create policy "Allow admins to manage all suppliers applications" on public.suppliers for all using (public.is_admin());

-- Supplier documents table policies
alter table public.supplier_documents enable row level security;
drop policy if exists "Allow suppliers to manage their own documents" on public.supplier_documents;
create policy "Allow suppliers to manage their own documents" on public.supplier_documents for all using (
  exists (
    select 1 from public.suppliers
    where suppliers.id = supplier_documents.supplier_id and suppliers.user_id = auth.uid()
  )
);
drop policy if exists "Allow admins to manage all supplier documents" on public.supplier_documents;
create policy "Allow admins to manage all supplier documents" on public.supplier_documents for all using (public.is_admin());

-- Returns table policies
alter table public.returns enable row level security;
drop policy if exists "Allow users to manage their own returns" on public.returns;
create policy "Allow users to manage their own returns" on public.returns for all using (auth.uid() = customer_id);
drop policy if exists "Allow admins to manage all returns" on public.returns;
create policy "Allow admins to manage all returns" on public.returns for all using (public.is_admin());


-- ============================================================================
-- AUTHENTICATION TRIGGERS (Auto profile creation)
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, role, avatar)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'avatar'
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================================
-- SEED DATA SYNC (Runs if matching users exist in auth.users)
-- ============================================================================
insert into public.users (id, email, full_name, role)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', 'Usuario'), 
  coalesce(raw_user_meta_data->>'role', 'customer')
from auth.users
on conflict (id) do nothing;

update public.users
set role = 'admin'
where email = 'gustavo.tg130808@gmail.com';
