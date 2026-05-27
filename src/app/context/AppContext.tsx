import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabase';

// ============================================================================
// TYPES
// ============================================================================

export type UserRole = 'customer' | 'affiliate' | 'supplier' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  password?: string; // Kept for compatibility with dev presets
  avatar?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  isVerified: boolean; // "Skinly Verified" badge system
  isFeatured: boolean;
  supplierId?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Coupon {
  code: string;
  discountPercentage: number;
  affiliateId?: string; // Links to affiliate for commission
  isActive: boolean;
  usageCount: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  postalCode: string;
  references?: string;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'delivery_cash';
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shipping: number;
  total: number;
  status: 'pending' | 'shipped' | 'delivered' | 'refunded';
  createdAt: string;
}

export interface SupplierApplication {
  id: string;
  userId: string;
  companyName: string;
  ingredientsDescription: string;
  documentsUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
  createdAt: string;
}

export interface AffiliateProfile {
  userId: string;
  couponCode: string;
  commissionEarned: number;
  clicksCount: number;
  referredSales: number;
  payoutHistory: {
    id: string;
    amount: number;
    status: 'pending' | 'paid';
    date: string;
  }[];
}

export type AppView = 
  | 'splash' 
  | 'onboarding' 
  | 'login' 
  | 'register' 
  | 'home' 
  | 'categories' 
  | 'product-details' 
  | 'cart' 
  | 'checkout' 
  | 'favorites' 
  | 'order-history' 
  | 'profile' 
  | 'admin-dashboard' 
  | 'supplier-portal' 
  | 'affiliate-dashboard';

interface AppContextType {
  // DB setup
  dbSetupRequired: boolean;

  // Navigation
  currentView: AppView;
  selectedProductId: string | null;
  setView: (view: AppView, productId?: string, userOverride?: User | null) => void;
  goBack: () => void;
  navigationHistory: AppView[];

  // Authentication & Users
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  registeredUsers: User[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => User; // Dev switcher

  // Products
  products: Product[];
  addProduct: (productData: Omit<Product, 'id' | 'rating' | 'reviewsCount'>) => void;
  editProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => { success: boolean; discountPercentage?: number; error?: string };
  removeCoupon: () => void;
  getCartTotals: () => { subtotal: number; discount: number; shipping: number; total: number };

  // Favorites
  favorites: string[]; // Product IDs
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;

  // Checkout & Orders
  orders: Order[];
  placeOrder: (shippingDetails: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    references?: string;
    paymentMethod: 'credit_card' | 'bank_transfer' | 'delivery_cash';
  }) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;

  // Supplier System
  supplierApplications: SupplierApplication[];
  submitSupplierApplication: (companyName: string, ingredientsDescription: string, documentsUrl: string) => void;
  reviewSupplierApplication: (id: string, approve: boolean, notes?: string) => void;

  // Affiliate System
  affiliateProfiles: AffiliateProfile[];
  updateAffiliateClicks: (couponCode: string) => void;
  requestPayout: (userId: string) => void;
  addCoupon: (coupon: Coupon) => Promise<void>;

  // Customization & Banners
  featuredBanner: {
    title: string;
    subtitle: string;
    ctaText: string;
    imageUrl: string;
  };
  setFeaturedBanner: (banner: { title: string; subtitle: string; ctaText: string; imageUrl: string }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================================================
// CONTEXT PROVIDER
// ============================================================================

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Flow
  const [currentView, setCurrentView] = useState<AppView>('splash');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<AppView[]>(['splash']);

  // Core States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [supplierApplications, setSupplierApplications] = useState<SupplierApplication[]>([]);
  const [affiliateProfiles, setAffiliateProfiles] = useState<AffiliateProfile[]>([]);
  // DB setup flag: true when Supabase tables lack GRANT permissions
  const [dbSetupRequired, setDbSetupRequired] = useState(false);
  
  // Customization Banners (Persist in localStorage)
  const [featuredBanner, setFeaturedBannerState] = useState(() => {
    const saved = localStorage.getItem('skinly_featured_banner');
    return saved ? JSON.parse(saved) : {
      title: 'El Futuro de los Orgánicos de Alto Rendimiento',
      subtitle: 'Formulaciones ultra limpias. Activos botánicos clínicamente probados. Verificado por Skinly.',
      ctaText: 'Comprar Colección',
      imageUrl: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=1200'
    };
  });

  const setFeaturedBanner = (banner: { title: string; subtitle: string; ctaText: string; imageUrl: string }) => {
    setFeaturedBannerState(banner);
    localStorage.setItem('skinly_featured_banner', JSON.stringify(banner));
  };

  // Customer Shopping States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Splash Screen transition trigger
  useEffect(() => {
    if (currentView === 'splash') {
      const timer = setTimeout(() => {
        setCurrentView('onboarding');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  // Helper: Get or create Category ID from name
  const getOrCreateCategoryId = async (categoryName: string): Promise<string | null> => {
    const { data: existing } = await supabase.from('categories').select('id').eq('name', categoryName).maybeSingle();
    if (existing) return existing.id;
    const { data: inserted } = await supabase.from('categories').insert({ name: categoryName }).select('id').single();
    return inserted?.id || null;
  };

  // Fetching Functions
  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
    if (error) {
      // 42501 = permission denied: DB grants not yet configured
      if (error.code === '42501' || error.message.includes('permission denied')) {
        setDbSetupRequired(true);
      }
      return;
    }
    setDbSetupRequired(false);
    if (data) {
      setProducts(data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        ingredients: p.ingredients || [],
        category: p.categories?.name || 'Serums',
        price: parseFloat(p.price),
        discountPrice: p.discount_price ? parseFloat(p.discount_price) : undefined,
        stock: p.stock,
        rating: parseFloat(p.rating),
        reviewsCount: p.reviews_count,
        imageUrl: p.image_url,
        isVerified: false,
        isFeatured: p.featured,
        supplierId: p.supplier_id || undefined
      })));
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    if (data) {
      setCategories(data);
    }
  };

  const fetchCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*');
    if (data) {
      setCoupons(data.map(c => ({
        code: c.code,
        discountPercentage: c.discount_percentage,
        affiliateId: c.affiliate_id || undefined,
        isActive: c.is_active,
        usageCount: c.usage_count
      })));
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*');
    if (data) {
      setRegisteredUsers(data.map(u => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: u.role as UserRole,
        avatar: u.avatar || undefined,
        phone: u.phone || undefined,
        address: u.address || undefined,
        city: u.city || undefined,
        postalCode: u.postal_code || undefined
      })));
    }
  };

  const fetchOrders = async (userId?: string) => {
    let query = supabase.from('orders').select('*, order_items(*)');
    if (userId) {
      query = query.eq('customer_id', userId);
    }
    const { data } = await query.order('created_at', { ascending: false });
    if (data) {
      setOrders(data.map(o => ({
        id: o.id,
        customerId: o.customer_id,
        customerName: o.customer_name,
        customerPhone: o.customer_phone || '',
        address: o.address,
        city: o.city,
        postalCode: o.postal_code,
        references: o.references || undefined,
        paymentMethod: o.payment_method as any,
        items: (o.order_items || []).map((oi: any) => ({
          productId: oi.product_id,
          name: oi.name,
          price: parseFloat(oi.price),
          quantity: oi.quantity,
          imageUrl: oi.image_url
        })),
        subtotal: parseFloat(o.subtotal),
        discountAmount: parseFloat(o.discount_amount),
        couponCode: o.coupon_code || undefined,
        shipping: parseFloat(o.shipping),
        total: parseFloat(o.total),
        status: o.status as any,
        createdAt: o.created_at
      })));
    }
  };

  const fetchCart = async (userId: string) => {
    const { data } = await supabase.from('cart_items').select('*, products(*, categories(name))').eq('user_id', userId);
    if (data) {
      setCart(data.map(item => ({
        product: {
          id: item.products.id,
          name: item.products.name,
          description: item.products.description || '',
          ingredients: item.products.ingredients || [],
          category: item.products.categories?.name || 'Serums',
          price: parseFloat(item.products.price),
          discountPrice: item.products.discount_price ? parseFloat(item.products.discount_price) : undefined,
          stock: item.products.stock,
          rating: parseFloat(item.products.rating),
          reviewsCount: item.products.reviews_count,
          imageUrl: item.products.image_url,
          isVerified: false,
          isFeatured: item.products.featured,
          supplierId: item.products.supplier_id || undefined
        },
        quantity: item.quantity
      })));
    }
  };

  const fetchFavorites = async (userId: string) => {
    const { data } = await supabase.from('wishlist_items').select('product_id').eq('user_id', userId);
    if (data) {
      setFavorites(data.map(item => item.product_id));
    }
  };

  const fetchSupplierApplications = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
    if (data) {
      setSupplierApplications(data.map(app => ({
        id: app.id,
        userId: app.user_id,
        companyName: app.company_name,
        ingredientsDescription: app.ingredients_description,
        documentsUrl: app.documents_url || '',
        status: app.status as any,
        verificationNotes: app.verification_notes || undefined,
        createdAt: app.created_at.split('T')[0]
      })));
    }
  };

  const fetchAffiliateProfiles = async () => {
    const { data: affs } = await supabase.from('affiliates').select('*');
    const { data: txs } = await supabase.from('affiliate_transactions').select('*');
    if (affs) {
      setAffiliateProfiles(affs.map(aff => {
        const history = (txs || [])
          .filter(t => t.affiliate_id === aff.user_id)
          .map(t => ({
            id: t.id,
            amount: parseFloat(t.amount),
            status: t.status as any,
            date: t.date
          }));
        return {
          userId: aff.user_id,
          couponCode: aff.coupon_code,
          commissionEarned: parseFloat(aff.commission_earned),
          clicksCount: aff.clicks_count,
          referredSales: aff.referred_sales,
          payoutHistory: history
        };
      }));
    }
  };

  // ── helper: map a DB row OR auth user_metadata to a User object ───────────
  const mapProfile = (row: any): User => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name || row.fullName || row.email?.split('@')[0] || 'Usuario',
    role: (row.role as UserRole) || 'customer',
    avatar: row.avatar || undefined,
    phone: row.phone || undefined,
    address: row.address || undefined,
    city: row.city || undefined,
    postalCode: row.postal_code || row.postalCode || undefined
  });

  // ── helper: build a User from Supabase auth user_metadata (fallback) ──────
  const mapAuthMeta = (authUser: { id: string; email?: string; user_metadata?: any }): User => {
    const meta = authUser.user_metadata || {};
    return {
      id: authUser.id,
      email: authUser.email || '',
      fullName: meta.full_name || authUser.email?.split('@')[0] || 'Usuario',
      role: (meta.role as UserRole) || 'customer'
    };
  };

  // ── helper: fetch DB profile, fall back to auth metadata if inaccessible ──
  const resolveUser = async (authUser: { id: string; email?: string; user_metadata?: any }): Promise<User> => {
    const fallback = mapAuthMeta(authUser);
    try {
      const timeout = new Promise<{ data: null; error: null }>(resolve =>
        setTimeout(() => resolve({ data: null, error: null }), 5000)
      );
      const { data: profile } = await Promise.race([
        supabase.from('users').select('*').eq('id', authUser.id).maybeSingle(),
        timeout
      ]);
      if (profile) return mapProfile(profile);
      // Fire-and-forget: do NOT await — prevents login from hanging
      const meta = authUser.user_metadata || {};
      supabase.from('users').upsert({
        id: authUser.id,
        email: authUser.email!,
        full_name: meta.full_name || authUser.email?.split('@')[0] || 'Usuario',
        role: meta.role || 'customer'
      }).then(() => {}, () => {});
    } catch {
      // Network error — fall through to fallback
    }
    return fallback;
  };

  // Session recovery and Auth synchronization
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const mappedUser = await resolveUser(session.user);
        setCurrentUser(mappedUser);

        // Auto-route on mount if starting splash/login
        if (currentView === 'splash' || currentView === 'onboarding' || currentView === 'login') {
          if (mappedUser.role === 'admin') setView('admin-dashboard', undefined, mappedUser);
          else if (mappedUser.role === 'affiliate') setView('affiliate-dashboard', undefined, mappedUser);
          else if (mappedUser.role === 'supplier') setView('supplier-portal', undefined, mappedUser);
          else setView('home', undefined, mappedUser);
        }
      }
    };

    initSession();

    // Trigger initial generic fetches
    fetchProducts();
    fetchCategories();
    fetchCoupons();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const mappedUser = await resolveUser(session.user);
        setCurrentUser(mappedUser);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCart([]);
        setFavorites([]);
        setAppliedCoupon(null);
        setOrders([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user contextual states when user changes
  useEffect(() => {
    if (currentUser) {
      fetchCart(currentUser.id);
      fetchFavorites(currentUser.id);
      if (currentUser.role === 'admin') {
        fetchUsers();
        fetchOrders();
        fetchSupplierApplications();
        fetchAffiliateProfiles();
      } else {
        fetchOrders(currentUser.id);
      }
    }
  }, [currentUser]);

  // Navigate Utility with user override to solve state lag race condition
  const setView = (view: AppView, productId?: string, userOverride?: User | null) => {
    if (productId) {
      setSelectedProductId(productId);
    }
    
    const activeUser = userOverride !== undefined ? userOverride : currentUser;
    
    // Auth Role Guards
    if (view === 'admin-dashboard' && (!activeUser || activeUser.role !== 'admin')) {
      alert('Acceso Denegado. El Panel de Administración está protegido y solo es accesible para el rol de Administrador.');
      return;
    }

    if (view === 'supplier-portal' && (!activeUser || activeUser.role !== 'supplier')) {
      alert('Acceso Denegado. Debe iniciar sesión como Proveedor para acceder a este portal.');
      return;
    }

    if (view === 'affiliate-dashboard' && (!activeUser || activeUser.role !== 'affiliate')) {
      alert('Acceso Denegado. Debe iniciar sesión como Afiliado para acceder al Portal de Afiliados.');
      return;
    }

    // Require Login for Protected Sections
    const loginRequiredViews: AppView[] = ['cart', 'checkout', 'favorites', 'order-history', 'profile', 'supplier-portal', 'affiliate-dashboard'];
    if (loginRequiredViews.includes(view) && !activeUser) {
      alert('Autenticación requerida. Por favor inicie sesión o regístrese para acceder a esta sección.');
      setCurrentView('login');
      setNavigationHistory(prev => [...prev, 'login']);
      return;
    }

    setCurrentView(view);
    setNavigationHistory(prev => [...prev, view]);
  };

  const goBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current
      const prevView = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setCurrentView(prevView);
    } else {
      setCurrentView('home');
    }
  };

  // Auth Operations
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        // Supabase returns email_not_confirmed as a 400 error
        if (error.message?.includes('Email not confirmed') || (error as any).code === 'email_not_confirmed') {
          return { success: false, error: 'Correo no confirmado. Revisa tu bandeja de entrada o contacta al administrador.' };
        }
        return { success: false, error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' };
      }

      if (!data.user) return { success: false, error: 'Usuario no disponible.' };

      // Resolve profile — uses DB if accessible, falls back to auth metadata
      const mappedUser = await resolveUser(data.user);
      setCurrentUser(mappedUser);

      if (mappedUser.role === 'admin') setView('admin-dashboard', undefined, mappedUser);
      else if (mappedUser.role === 'affiliate') setView('affiliate-dashboard', undefined, mappedUser);
      else if (mappedUser.role === 'supplier') setView('supplier-portal', undefined, mappedUser);
      else setView('home', undefined, mappedUser);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de autenticación.' };
    }
  };

  const register = async (fullName: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName, role: 'customer' } }
      });

      if (error) return { success: false, error: 'Error al registrarse: ' + error.message };
      if (!data.user) return { success: false, error: 'Error al crear la cuenta.' };

      const mappedUser = await resolveUser(data.user);
      setCurrentUser(mappedUser);
      setView('home', undefined, mappedUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de registro.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCart([]);
    setFavorites([]);
    setAppliedCoupon(null);
    setView('login');
  };

  const switchRole = (role: UserRole): User => {
    let targetUser: User;
    if (currentUser) {
      targetUser = { ...currentUser, role };
      setCurrentUser(targetUser);
      supabase.from('users').update({ role }).eq('id', currentUser.id).then();
    } else {
      const defaultUser = registeredUsers.find(u => u.role === role);
      if (defaultUser) {
        targetUser = defaultUser;
      } else {
        targetUser = {
          id: `user-${role}`,
          email: `${role}@skinly.co`,
          fullName: `Dr. ${role.charAt(0).toUpperCase() + role.slice(1)} Prototype`,
          role: role
        };
      }
      setCurrentUser(targetUser);
    }
    return targetUser;
  };

  // Product Operations (Persisted to Supabase)
  const addProduct = async (productData: Omit<Product, 'id' | 'rating' | 'reviewsCount'>) => {
    try {
      const categoryId = await getOrCreateCategoryId(productData.category);
      const { error } = await supabase.from('products').insert({
        name: productData.name,
        description: productData.description,
        ingredients: productData.ingredients,
        category_id: categoryId,
        price: productData.price,
        stock: productData.stock,
        image_url: productData.imageUrl,
        featured: productData.isFeatured,
        supplier_id: productData.supplierId || currentUser?.id
      });

      if (error) {
        alert("Error al agregar producto: " + error.message);
      } else {
        fetchProducts();
      }
    } catch (err: any) {
      alert("Excepción al agregar producto: " + err.message);
    }
  };

  const editProduct = async (updatedProd: Product) => {
    try {
      const categoryId = await getOrCreateCategoryId(updatedProd.category);
      const { error } = await supabase.from('products').update({
        name: updatedProd.name,
        description: updatedProd.description,
        ingredients: updatedProd.ingredients,
        category_id: categoryId,
        price: updatedProd.price,
        stock: updatedProd.stock,
        image_url: updatedProd.imageUrl,
        featured: updatedProd.isFeatured,
        supplier_id: updatedProd.supplierId
      }).eq('id', updatedProd.id);

      if (error) {
        alert("Error al actualizar producto: " + error.message);
      } else {
        fetchProducts();
      }
    } catch (err: any) {
      alert("Excepción al actualizar producto: " + err.message);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        alert("Error al eliminar producto: " + error.message);
      } else {
        fetchProducts();
      }
    } catch (err: any) {
      alert("Excepción al eliminar producto: " + err.message);
    }
  };

  // Cart Operations (Persisted to Supabase)
  const addToCart = async (product: Product, qty: number = 1) => {
    if (!currentUser) {
      alert('Autenticación requerida. Por favor inicie sesión para agregar productos a su carrito.');
      setView('login');
      return;
    }
    try {
      const existing = cart.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        await supabase.from('cart_items').update({ quantity: newQty }).eq('user_id', currentUser.id).eq('product_id', product.id);
      } else {
        await supabase.from('cart_items').insert({
          user_id: currentUser.id,
          product_id: product.id,
          quantity: qty
        });
      }
      fetchCart(currentUser.id);
    } catch (err) {
      console.error(err);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!currentUser) return;
    try {
      await supabase.from('cart_items').delete().eq('user_id', currentUser.id).eq('product_id', productId);
      fetchCart(currentUser.id);
    } catch (err) {
      console.error(err);
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (!currentUser) return;
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    try {
      await supabase.from('cart_items').update({ quantity }).eq('user_id', currentUser.id).eq('product_id', productId);
      fetchCart(currentUser.id);
    } catch (err) {
      console.error(err);
    }
  };

  const clearCart = async () => {
    if (!currentUser) return;
    try {
      await supabase.from('cart_items').delete().eq('user_id', currentUser.id);
      setCart([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Coupon System (Persisted to Supabase)
  const applyCouponCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const coupon = coupons.find(c => c.code === cleanCode && c.isActive);
    
    if (coupon) {
      setAppliedCoupon(coupon);
      if (coupon.affiliateId) {
        updateAffiliateClicks(coupon.code);
      }
      return { success: true, discountPercentage: coupon.discountPercentage };
    }
    return { success: false, error: 'Código de cupón inválido o vencido.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const getCartTotals = () => {
    const subtotal = cart.reduce((sum, item) => {
      const price = item.product.discountPrice || item.product.price;
      return sum + price * item.quantity;
    }, 0);

    const discount = appliedCoupon 
      ? (subtotal * appliedCoupon.discountPercentage) / 100 
      : 0;

    const shipping = subtotal > 100 || subtotal === 0 ? 0 : 10.00;
    const total = subtotal - discount + shipping;

    return { subtotal, discount, shipping, total };
  };

  const addCoupon = async (coupon: Coupon) => {
    try {
      const { error } = await supabase.from('coupons').insert({
        code: coupon.code,
        discount_percentage: coupon.discountPercentage,
        affiliate_id: coupon.affiliateId || null,
        is_active: coupon.isActive,
        usage_count: coupon.usageCount
      });
      if (error) {
        alert("Error al registrar cupón: " + error.message);
      } else {
        fetchCoupons();
      }
    } catch (err: any) {
      alert("Excepción al crear cupón: " + err.message);
    }
  };

  // Favorites (Wishlist) Operations
  const toggleFavorite = async (productId: string) => {
    if (!currentUser) {
      alert('Autenticación requerida. Por favor inicie sesión para guardar productos en sus favoritos.');
      setView('login');
      return;
    }
    try {
      const isFav = favorites.includes(productId);
      if (isFav) {
        await supabase.from('wishlist_items').delete().eq('user_id', currentUser.id).eq('product_id', productId);
      } else {
        await supabase.from('wishlist_items').insert({ user_id: currentUser.id, product_id: productId });
      }
      fetchFavorites(currentUser.id);
    } catch (err) {
      console.error(err);
    }
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  // Orders Placement & Affiliate Tracking
  const placeOrder = async (shippingDetails: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    references?: string;
    paymentMethod: 'credit_card' | 'bank_transfer' | 'delivery_cash';
  }): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Autenticación requerida' };
    if (cart.length === 0) return { success: false, error: 'El carrito está vacío' };

    try {
      const { subtotal, discount, shipping, total } = getCartTotals();
      const orderId = `skn-${Math.floor(1000 + Math.random() * 9000)}`;

      const { error: orderErr } = await supabase.from('orders').insert({
        id: orderId,
        customer_id: currentUser.id,
        customer_name: shippingDetails.fullName,
        customer_phone: shippingDetails.phone,
        address: shippingDetails.address,
        city: shippingDetails.city,
        postal_code: shippingDetails.postalCode,
        references: shippingDetails.references || null,
        payment_method: shippingDetails.paymentMethod,
        subtotal,
        discount_amount: discount,
        coupon_code: appliedCoupon?.code || null,
        shipping,
        total,
        status: 'pending'
      });

      if (orderErr) return { success: false, error: orderErr.message };

      const orderItems = cart.map(item => ({
        order_id: orderId,
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.discountPrice || item.product.price,
        quantity: item.quantity,
        image_url: item.product.imageUrl
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
      if (itemsErr) return { success: false, error: itemsErr.message };

      // Update product stocks
      for (const item of cart) {
        const newStock = Math.max(0, item.product.stock - item.quantity);
        await supabase.from('products').update({ stock: newStock }).eq('id', item.product.id);
      }

      // Handle Affiliate commission
      if (appliedCoupon && appliedCoupon.affiliateId) {
        const commissionEarned = parseFloat((total * 0.15).toFixed(2));
        const { data: aff } = await supabase.from('affiliates').select('*').eq('user_id', appliedCoupon.affiliateId).maybeSingle();
        if (aff) {
          await supabase.from('affiliates').update({
            commission_earned: parseFloat(aff.commission_earned) + commissionEarned,
            referred_sales: aff.referred_sales + 1
          }).eq('user_id', appliedCoupon.affiliateId);
        }

        await supabase.from('coupons').update({
          usage_count: appliedCoupon.usageCount + 1
        }).eq('code', appliedCoupon.code);
      }

      await clearCart();
      fetchOrders(currentUser.id);
      fetchProducts();
      setView('order-history');
      return { success: true, orderId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) {
        alert("Error al actualizar estado del pedido: " + error.message);
      } else {
        if (currentUser) {
          fetchOrders(currentUser.role === 'admin' ? undefined : currentUser.id);
        }
      }
    } catch (err: any) {
      alert("Excepción al actualizar pedido: " + err.message);
    }
  };

  // Supplier applications (Persisted to Supabase)
  const submitSupplierApplication = async (companyName: string, ingredientsDescription: string, documentsUrl: string) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('suppliers').insert({
        user_id: currentUser.id,
        company_name: companyName,
        ingredients_description: ingredientsDescription,
        documents_url: documentsUrl,
        status: 'pending'
      }).select().single();

      if (error) {
        alert('Error al enviar la solicitud: ' + error.message);
      } else if (data) {
        // Document persistence
        await supabase.from('supplier_documents').insert({
          supplier_id: data.id,
          document_name: 'Certificación Orgánica de Ingredientes',
          document_url: documentsUrl
        });
        fetchSupplierApplications();
        alert('¡Solicitud de proveedor enviada con éxito! Está pendiente de revisión por el administrador de Skinly.');
      }
    } catch (err: any) {
      alert('Excepción al enviar solicitud: ' + err.message);
    }
  };

  const reviewSupplierApplication = async (id: string, approve: boolean, notes?: string) => {
    try {
      const status = approve ? 'approved' : 'rejected';
      const { data: app, error } = await supabase.from('suppliers').update({
        status,
        verification_notes: notes || null
      }).eq('id', id).select().single();

      if (error) {
        alert('Error al evaluar solicitud: ' + error.message);
        return;
      }

      if (app && approve) {
        // Elevate user role to supplier
        await supabase.from('users').update({ role: 'supplier' }).eq('id', app.user_id);
        fetchUsers();
      }
      fetchSupplierApplications();
    } catch (err: any) {
      alert('Excepción al evaluar solicitud: ' + err.message);
    }
  };

  // Affiliate click count tracking
  const updateAffiliateClicks = async (couponCode: string) => {
    try {
      const { data } = await supabase.from('affiliates').select('*').eq('coupon_code', couponCode).maybeSingle();
      if (data) {
        await supabase.from('affiliates').update({
          clicks_count: data.clicks_count + 1
        }).eq('coupon_code', couponCode);
        fetchAffiliateProfiles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const requestPayout = async (userId: string) => {
    try {
      const { data: aff } = await supabase.from('affiliates').select('*').eq('user_id', userId).maybeSingle();
      if (aff) {
        const commission = parseFloat(aff.commission_earned);
        if (commission <= 0) {
          alert('No tiene comisiones para retirar en este momento.');
          return;
        }

        const { error } = await supabase.from('affiliate_transactions').insert({
          affiliate_id: userId,
          amount: commission,
          status: 'pending'
        });

        if (error) {
          alert('Error al solicitar retiro: ' + error.message);
        } else {
          await supabase.from('affiliates').update({ commission_earned: 0 }).eq('user_id', userId);
          fetchAffiliateProfiles();
          alert(`¡Retiro de $${commission.toFixed(2)} solicitado con éxito! Será verificado por el administrador.`);
        }
      }
    } catch (err: any) {
      alert('Excepción al procesar retiro: ' + err.message);
    }
  };

  return (
    <AppContext.Provider value={{
      dbSetupRequired,

      currentView,
      selectedProductId,
      setView,
      goBack,
      navigationHistory,
      
      currentUser,
      setCurrentUser,
      registeredUsers,
      login,
      register,
      logout,
      switchRole,

      products,
      addProduct,
      editProduct,
      deleteProduct,

      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      appliedCoupon,
      applyCouponCode,
      removeCoupon,
      getCartTotals,

      favorites,
      toggleFavorite,
      isFavorite,

      orders,
      placeOrder,
      updateOrderStatus,

      supplierApplications,
      submitSupplierApplication,
      reviewSupplierApplication,

      affiliateProfiles,
      updateAffiliateClicks,
      requestPayout,
      addCoupon,

      featuredBanner,
      setFeaturedBanner
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
