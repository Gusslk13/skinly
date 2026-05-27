-- ============================================================================
-- SKINLY — SUPABASE SETUP SCRIPT (Ejecutar UNA VEZ en SQL Editor)
-- Dashboard: https://supabase.com/dashboard/project/bavarmytvyntpohimkqt/sql/new
-- ============================================================================

-- 1. SCHEMA USAGE
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. TABLE GRANTS
-- Products & categories: lectura pública, escritura autenticada
GRANT SELECT ON public.products   TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.coupons    TO anon;

GRANT ALL ON public.users                  TO authenticated;
GRANT ALL ON public.products               TO authenticated;
GRANT ALL ON public.categories             TO authenticated;
GRANT ALL ON public.orders                 TO authenticated;
GRANT ALL ON public.order_items            TO authenticated;
GRANT ALL ON public.cart_items             TO authenticated;
GRANT ALL ON public.wishlist_items         TO authenticated;
GRANT ALL ON public.coupons                TO authenticated;
GRANT ALL ON public.suppliers              TO authenticated;
GRANT ALL ON public.affiliates             TO authenticated;
GRANT ALL ON public.affiliate_transactions TO authenticated;

-- Sequencias
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. ROW LEVEL SECURITY -------------------------------------------------------

-- users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "skinly_users_select"  ON public.users;
DROP POLICY IF EXISTS "skinly_users_insert"  ON public.users;
DROP POLICY IF EXISTS "skinly_users_update"  ON public.users;
CREATE POLICY "skinly_users_select" ON public.users FOR SELECT TO authenticated
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "skinly_users_insert" ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "skinly_users_update" ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "skinly_products_read"   ON public.products;
DROP POLICY IF EXISTS "skinly_products_write"  ON public.products;
CREATE POLICY "skinly_products_read"  ON public.products FOR SELECT USING (true);
CREATE POLICY "skinly_products_write" ON public.products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','supplier')));

-- categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "skinly_categories_read"  ON public.categories;
DROP POLICY IF EXISTS "skinly_categories_write" ON public.categories;
CREATE POLICY "skinly_categories_read"  ON public.categories FOR SELECT USING (true);
CREATE POLICY "skinly_categories_write" ON public.categories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "skinly_cart_own" ON public.cart_items;
CREATE POLICY "skinly_cart_own" ON public.cart_items FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- wishlist_items
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "skinly_wishlist_own" ON public.wishlist_items;
CREATE POLICY "skinly_wishlist_own" ON public.wishlist_items FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "skinly_orders_own_or_admin" ON public.orders;
CREATE POLICY "skinly_orders_own_or_admin" ON public.orders FOR ALL TO authenticated
  USING (customer_id = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "skinly_order_items_via_orders" ON public.order_items;
CREATE POLICY "skinly_order_items_via_orders" ON public.order_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_id
      AND (customer_id = auth.uid()::text
        OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'))
  ));

-- coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "skinly_coupons_read"  ON public.coupons;
DROP POLICY IF EXISTS "skinly_coupons_write" ON public.coupons;
CREATE POLICY "skinly_coupons_read"  ON public.coupons FOR SELECT USING (true);
CREATE POLICY "skinly_coupons_write" ON public.coupons FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "skinly_suppliers_own_or_admin" ON public.suppliers;
CREATE POLICY "skinly_suppliers_own_or_admin" ON public.suppliers FOR ALL TO authenticated
  USING (user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- affiliates
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "skinly_affiliates_own_or_admin" ON public.affiliates;
CREATE POLICY "skinly_affiliates_own_or_admin" ON public.affiliates FOR ALL TO authenticated
  USING (user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- affiliate_transactions
ALTER TABLE public.affiliate_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "skinly_affiliate_tx" ON public.affiliate_transactions;
CREATE POLICY "skinly_affiliate_tx" ON public.affiliate_transactions FOR ALL TO authenticated
  USING (affiliate_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 4. ADMIN USER PROFILE -------------------------------------------------------
INSERT INTO public.users (id, email, full_name, role)
SELECT id, email, 'Gustavo Admin', 'admin'
FROM auth.users
WHERE email = 'gustavo.tg130808@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Gustavo Admin';

-- 5. STORAGE BUCKET -----------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies
DROP POLICY IF EXISTS "skinly_storage_read"   ON storage.objects;
DROP POLICY IF EXISTS "skinly_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "skinly_storage_delete" ON storage.objects;

CREATE POLICY "skinly_storage_read"   ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
CREATE POLICY "skinly_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "skinly_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');

-- ============================================================================
-- VERIFICAR que todo quedó bien:
-- SELECT id, email, role FROM public.users WHERE email = 'gustavo.tg130808@gmail.com';
-- SELECT id, name, public FROM storage.buckets WHERE id = 'product-images';
-- ============================================================================
