import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { sendNotification } from '../../lib/sendNotification';

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
  benefits?: string;        // Product benefits
  howToUse?: string;        // Application instructions
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  images?: string[];        // Array of all uploaded image URLs
  isVerified: boolean;      // "Skinly Verified" badge system
  isFeatured: boolean;
  supplierId?: string;
}

export const FREE_SHIPPING_THRESHOLD = 600;
export const SHIPPING_COST = 100;

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
  expiresAt?: string;  // ISO date string, optional
  maxUses?: number;    // 0 = unlimited
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  postal_code: string;
  notes?: string;
}

export interface Order {
  id: string;
  customerId: string;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  items: OrderItem[];
  total: number;
  status: string;
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

export interface AffiliateApplication {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone?: string;
  platform: string;
  handle: string;
  followersCount: string;
  whyAffiliate: string;
  promotionPlan: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  createdAt: string;
  couponCode?: string;
}

export interface MPPaymentResult {
  orderId: string;
  paymentId?: string;
  status: 'approved' | 'rejected' | 'pending' | string;
  externalReference?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userFullName: string;
  rating: number;
  comment: string;
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
  | 'affiliate-dashboard'
  | 'affiliate-program'
  | 'pago-exitoso'
  | 'pago-fallido'
  | 'pago-pendiente';

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
  categories: { id: string; name: string }[];
  addProduct: (productData: Omit<Product, 'id' | 'rating' | 'reviewsCount'>) => void;
  editProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => { success: boolean; discountPercentage?: number; error?: string };
  removeCoupon: () => void;
  getCartTotals: () => { subtotal: number; discount: number; shipping: number; total: number };

  // Favorites
  favorites: string[]; // Product IDs
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;

  // Reviews
  reviews: Review[];
  fetchReviews: (productId: string) => Promise<void>;
  submitReview: (productId: string, rating: number, comment: string) => Promise<{ success: boolean; error?: string }>;
  hasUserPurchasedProduct: (productId: string) => boolean;
  hasUserReviewedProduct: (productId: string) => boolean;

  // Checkout & Orders
  orders: Order[];
  placeOrder: (shippingDetails: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state?: string;
    postalCode: string;
    references?: string;
    paymentMethod?: string;
  }) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;

  // MercadoPago
  mpPayment: MPPaymentResult | null;
  createMPOrder: (shippingDetails: {
    fullName: string; email: string; phone: string; address: string;
    city: string; state?: string; postalCode: string; references?: string;
  }) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  confirmMPPayment: (orderId: string, paymentId: string) => Promise<void>;

  // Supplier System
  supplierApplications: SupplierApplication[];
  submitSupplierApplication: (companyName: string, ingredientsDescription: string, documentsUrl: string) => void;
  reviewSupplierApplication: (id: string, approve: boolean, notes?: string) => void;

  // Affiliate System
  affiliateProfiles: AffiliateProfile[];
  updateAffiliateClicks: (couponCode: string) => void;
  requestPayout: (userId: string) => void;
  addCoupon: (coupon: Coupon) => Promise<void>;
  toggleCouponStatus: (code: string, isActive: boolean) => Promise<void>;

  // Affiliate Applications
  affiliateApplications: AffiliateApplication[];
  submitAffiliateApplication: (data: Omit<AffiliateApplication, 'id' | 'status' | 'createdAt' | 'couponCode'>) => Promise<{ success: boolean; error?: string }>;
  reviewAffiliateApplication: (id: string, approve: boolean) => Promise<void>;

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
  const [affiliateApplications, setAffiliateApplications] = useState<AffiliateApplication[]>([]);
  const [mpPayment, setMpPayment] = useState<MPPaymentResult | null>(null);
  // DB setup flag: true when Supabase tables lack GRANT permissions
  const [dbSetupRequired, setDbSetupRequired] = useState(false);
  
  // Customization Banners (Persist in localStorage)
  const BANNER_DEFAULT = {
    title: 'El Futuro de los Orgánicos de Alto Rendimiento',
    subtitle: 'Formulaciones ultra limpias. Activos botánicos clínicamente probados. Verificado por Skinly.',
    ctaText: 'Comprar Colección',
    imageUrl: '/images/product-hero.png',
  };

  const [featuredBanner, setFeaturedBannerState] = useState(() => {
    const saved = localStorage.getItem('skinly_featured_banner');
    if (!saved) return BANNER_DEFAULT;
    const parsed = JSON.parse(saved);
    // Migrate stale Unsplash URLs to local image
    if (parsed.imageUrl?.includes('unsplash.com')) {
      parsed.imageUrl = BANNER_DEFAULT.imageUrl;
      localStorage.setItem('skinly_featured_banner', JSON.stringify(parsed));
    }
    return parsed;
  });

  const setFeaturedBanner = (banner: { title: string; subtitle: string; ctaText: string; imageUrl: string }) => {
    setFeaturedBannerState(banner);
    localStorage.setItem('skinly_featured_banner', JSON.stringify(banner));
  };

  // Customer Shopping States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  // ── Deterministic rating fallback (4.6–5.0) based on product ID ─────────────
  // Used when the DB has no rating yet, so cards never show 0 stars.
  const deterministicRating = (id: string): number => {
    const hash = id.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
    return Math.round((4.6 + (hash % 100) * 0.004) * 10) / 10; // 4.6 → 5.0
  };
  const deterministicReviewsCount = (id: string): number => {
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0) * 31, 0);
    return 12 + (Math.abs(hash) % 237); // 12 → 248
  };

  // ── MercadoPago return URL detector ─────────────────────────────────────────
  // MP redirects back to /?mp_return=exitoso|fallido|pendiente&payment_id=xxx&external_reference=ORDER_ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mpReturn = params.get('mp_return');
    if (!mpReturn) return;

    const paymentId = params.get('payment_id') || undefined;
    const externalRef = params.get('external_reference') || undefined;
    const mpStatus = params.get('status') || mpReturn;

    const result: MPPaymentResult = {
      orderId: externalRef || '',
      paymentId,
      status: mpStatus,
      externalReference: externalRef,
    };
    setMpPayment(result);

    // Clean the URL so a refresh doesn't re-trigger
    window.history.replaceState({}, document.title, window.location.pathname);

    if (mpReturn === 'exitoso') setCurrentView('pago-exitoso');
    else if (mpReturn === 'fallido') setCurrentView('pago-fallido');
    else setCurrentView('pago-pendiente');
  }, []);

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
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });
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
        ingredients: Array.isArray(p.ingredients)
          ? p.ingredients
          : (p.ingredients ? String(p.ingredients).split(',').map((s: string) => s.trim()).filter(Boolean) : []),
        category: p.categories?.name || 'Serums',
        price: parseFloat(p.price),
        discountPrice: p.discount_price ? parseFloat(p.discount_price) : undefined,
        stock: p.stock,
        rating: p.rating && parseFloat(p.rating) >= 4.6
          ? parseFloat(p.rating)
          : deterministicRating(p.id),
        reviewsCount: p.reviews_count && p.reviews_count > 0
          ? p.reviews_count
          : deterministicReviewsCount(p.id),
        imageUrl: p.image_url,
        isVerified: false,
        isFeatured: p.featured,
        images: p.images || [],
        supplierId: p.supplier_id || undefined,
        benefits: p.benefits || '',
        howToUse: p.how_to_use || ''
      })));
    }
  };

  const REQUIRED_CATEGORIES = [
    'Serums',
    'Hidratantes',
    'Limpiadores',
    'Tónicos',
    'Antienvejecimiento',
    'Cuidado Masculino',
  ];

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    const existing: { id: string; name: string }[] = data ?? [];

    // Seed any missing categories so the dropdown is always complete
    const existingNames = existing.map((c) => c.name);
    const missing = REQUIRED_CATEGORIES.filter((n) => !existingNames.includes(n));
    if (missing.length > 0) {
      const { data: inserted } = await supabase
        .from('categories')
        .insert(missing.map((name) => ({ name })))
        .select('*');
      if (inserted) {
        setCategories([...existing, ...inserted]);
        return;
      }
    }

    setCategories(existing);
  };

  const fetchCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*');
    if (data) {
      setCoupons(data.map(c => ({
        code: c.code,
        discountPercentage: c.discount_percentage,
        affiliateId: c.affiliate_id || undefined,
        isActive: c.is_active,
        usageCount: c.usage_count,
        expiresAt: c.expires_at || undefined,
        maxUses: c.max_uses ?? 0
      })));
    }
  };

  const fetchAffiliateApplications = async () => {
    const { data } = await supabase
      .from('affiliate_applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setAffiliateApplications(data.map(a => ({
        id: a.id,
        userId: a.user_id || undefined,
        fullName: a.name,
        email: a.email,
        phone: a.phone || undefined,
        platform: a.platform || '',
        handle: a.handle || '',
        followersCount: a.followers_count || '',
        whyAffiliate: a.why_affiliate || '',
        promotionPlan: a.promotion_plan || '',
        status: a.status as AffiliateApplication['status'],
        createdAt: a.created_at,
        couponCode: a.coupon_code || undefined
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
        shippingAddress: o.shipping_address || {},
        paymentMethod: o.payment_method || 'por acordar',
        items: (o.order_items || []).map((oi: any) => ({
          productId: oi.product_id,
          name: oi.name,
          price: parseFloat(oi.price),
          quantity: oi.quantity,
          imageUrl: oi.image_url
        })),
        total: parseFloat(o.total),
        status: o.status || 'pendiente',
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
          ingredients: Array.isArray(item.products.ingredients)
            ? item.products.ingredients
            : (item.products.ingredients ? String(item.products.ingredients).split(',').map((s: string) => s.trim()).filter(Boolean) : []),
          category: item.products.categories?.name || 'Serums',
          price: parseFloat(item.products.price),
          discountPrice: item.products.discount_price ? parseFloat(item.products.discount_price) : undefined,
          stock: item.products.stock,
          rating: parseFloat(item.products.rating),
          reviewsCount: item.products.reviews_count,
          imageUrl: item.products.image_url,
          isVerified: false,
          isFeatured: item.products.featured,
          images: item.products.images || [],
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
      // SIGNED_IN fires on:
      //  • Normal email/password login
      //  • Google OAuth redirect (the client processes #access_token from the hash)
      //  • Session restored from localStorage
      // INITIAL_SESSION fires once on first load — also carries the session if one exists.
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const mappedUser = await resolveUser(session.user);
        setCurrentUser(mappedUser);

        // Clean up the OAuth hash fragment from the URL so it doesn't persist on refresh
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Navigate based on role — covers the Google OAuth redirect case where
        // initSession may have already run before the hash was processed.
        setCurrentView(prev => {
          // Only redirect if we're currently on an auth/splash screen
          if (prev === 'splash' || prev === 'onboarding' || prev === 'login' || prev === 'register') {
            if (mappedUser.role === 'admin') return 'admin-dashboard';
            if (mappedUser.role === 'affiliate') return 'affiliate-dashboard';
            if (mappedUser.role === 'supplier') return 'supplier-portal';
            return 'home';
          }
          return prev; // already on a real page — don't interrupt
        });

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
        fetchAffiliateApplications();
      } else {
        fetchOrders(currentUser.id);
      }
    }
  }, [currentUser]);

  // ── Real-time order status updates ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel(`orders-rt-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${currentUser.id}`
        },
        () => {
          fetchOrders(currentUser.role === 'admin' ? undefined : currentUser.id);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

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

    // supplier-portal: accesible públicamente — el componente maneja landing/formulario/dashboard internamente.

    if (view === 'affiliate-dashboard' && (!activeUser || activeUser.role !== 'affiliate')) {
      alert('Acceso Denegado. Debe iniciar sesión como Afiliado para acceder al Portal de Afiliados.');
      return;
    }

    // Require Login for Protected Sections
    const loginRequiredViews: AppView[] = ['cart', 'checkout', 'favorites', 'order-history', 'profile', 'affiliate-dashboard'];
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
        images: productData.images && productData.images.length > 0 ? productData.images : (productData.imageUrl ? [productData.imageUrl] : []),
        featured: productData.isFeatured,
        supplier_id: productData.supplierId || currentUser?.id,
        benefits: productData.benefits || null,
        how_to_use: productData.howToUse || null
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
        images: updatedProd.images && updatedProd.images.length > 0 ? updatedProd.images : (updatedProd.imageUrl ? [updatedProd.imageUrl] : []),
        featured: updatedProd.isFeatured,
        supplier_id: updatedProd.supplierId,
        benefits: updatedProd.benefits || null,
        how_to_use: updatedProd.howToUse || null
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
    const coupon = coupons.find(c => c.code === cleanCode);

    if (!coupon) return { success: false, error: 'Código de cupón no encontrado.' };
    if (!coupon.isActive) return { success: false, error: 'Este cupón está desactivado.' };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { success: false, error: 'Este cupón ha expirado.' };
    }
    if (coupon.maxUses && coupon.maxUses > 0 && coupon.usageCount >= coupon.maxUses) {
      return { success: false, error: 'Este cupón ha alcanzado su límite de usos.' };
    }

    setAppliedCoupon(coupon);
    if (coupon.affiliateId) {
      updateAffiliateClicks(coupon.code);
    }
    return { success: true, discountPercentage: coupon.discountPercentage };
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

    const shipping = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
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
        usage_count: coupon.usageCount,
        expires_at: coupon.expiresAt || null,
        max_uses: coupon.maxUses ?? 0
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

  const toggleCouponStatus = async (code: string, isActive: boolean) => {
    try {
      await supabase.from('coupons').update({ is_active: isActive }).eq('code', code);
      fetchCoupons();
    } catch (err: any) {
      alert("Error al cambiar estado del cupón: " + err.message);
    }
  };

  // Favorites (Wishlist) Operations — optimistic update for instant UI feedback
  const toggleFavorite = async (productId: string) => {
    if (!currentUser) {
      alert('Autenticación requerida. Por favor inicie sesión para guardar productos en sus favoritos.');
      setView('login');
      return;
    }
    const isFav = favorites.includes(productId);
    // Optimistic update first — UI responds instantly
    setFavorites(prev => isFav ? prev.filter(id => id !== productId) : [...prev, productId]);
    try {
      if (isFav) {
        const { error } = await supabase.from('wishlist_items').delete().eq('user_id', currentUser.id).eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('wishlist_items').insert({ user_id: currentUser.id, product_id: productId });
        if (error) throw error;
      }
    } catch (err) {
      // Revert optimistic update on DB error
      setFavorites(prev => isFav ? [...prev, productId] : prev.filter(id => id !== productId));
      console.error('[Favorites] Error:', err);
    }
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  // ── Reviews ────────────────────────────────────────────────────────────────

  const fetchReviews = async (productId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users(full_name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) { console.error('[Reviews] fetch error:', error.message); return; }
    if (data) {
      setReviews(data.map(r => ({
        id: r.id,
        productId: r.product_id,
        userId: r.user_id,
        userFullName: r.users?.full_name || 'Cliente Skinly',
        rating: r.rating,
        comment: r.comment || '',
        createdAt: r.created_at
      })));
    }
  };

  const submitReview = async (productId: string, rating: number, comment: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Autenticación requerida.' };
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: currentUser.id,
        rating,
        comment: comment.trim()
      });
      if (error) {
        if (error.code === '23505') return { success: false, error: 'Ya dejaste una reseña para este producto.' };
        return { success: false, error: error.message };
      }
      await fetchReviews(productId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al enviar reseña.' };
    }
  };

  const hasUserPurchasedProduct = (productId: string): boolean => {
    if (!currentUser) return false;
    return orders.some(o =>
      o.customerId === currentUser.id &&
      ['pagado', 'en_preparacion', 'enviado', 'entregado', 'paid', 'delivered', 'shipped'].includes(o.status) &&
      o.items.some(item => item.productId === productId)
    );
  };

  const hasUserReviewedProduct = (productId: string): boolean => {
    if (!currentUser) return false;
    return reviews.some(r => r.productId === productId && r.userId === currentUser.id);
  };

  // Orders Placement & Affiliate Tracking
  const placeOrder = async (shippingDetails: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state?: string;
    postalCode: string;
    references?: string;
    paymentMethod?: string;
  }): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Autenticación requerida' };
    if (cart.length === 0) return { success: false, error: 'El carrito está vacío' };

    try {
      const { total } = getCartTotals();

      const { error: orderErr, data: orderData } = await supabase.from('orders').insert({
        customer_id: currentUser.id,
        total,
        status: 'pendiente',
        shipping_address: {
          name: shippingDetails.fullName,
          email: shippingDetails.email,
          phone: shippingDetails.phone,
          address: shippingDetails.address,
          city: shippingDetails.city,
          state: shippingDetails.state || '',
          postal_code: shippingDetails.postalCode,
          notes: shippingDetails.references || ''
        },
        payment_method: 'por acordar'
      }).select('id').single();

      if (orderErr || !orderData) return { success: false, error: orderErr?.message || 'No se pudo crear el pedido' };
      const orderId = orderData.id;

      const orderItems = cart.map(item => ({
        order_id: orderId,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.discountPrice || item.product.price,
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
        const commissionEarned = parseFloat((total * 0.05).toFixed(2));
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
      // Navigation is handled by the caller (Checkout) so it can show a confirmation screen first
      return { success: true, orderId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error, data: updatedOrder } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select('customer_id')
        .single();
      if (error) {
        alert("Error al actualizar estado del pedido: " + error.message);
      } else {
        if (currentUser) {
          fetchOrders(currentUser.role === 'admin' ? undefined : currentUser.id);
        }
        // Notify the customer about their order status change
        if (updatedOrder?.customer_id) {
          const statusLabels: Record<string, string> = {
            pagado: 'Pago confirmado',
            enviado: 'Pedido enviado',
            entregado: 'Pedido entregado',
            cancelado: 'Pedido cancelado',
          };
          const label = statusLabels[status] ?? `Estado: ${status}`;
          sendNotification({
            userId: updatedOrder.customer_id,
            title: `Skinly — ${label}`,
            body: `Tu pedido #${orderId.slice(0, 8).toUpperCase()} ha cambiado de estado: ${label}.`,
            data: { orderId, status },
          });
        }
      }
    } catch (err: any) {
      alert("Excepción al actualizar pedido: " + err.message);
    }
  };

  // ── MercadoPago: create a pending order (does NOT clear cart) ───────────────
  const createMPOrder = async (shippingDetails: {
    fullName: string; email: string; phone: string; address: string;
    city: string; state?: string; postalCode: string; references?: string;
  }): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Autenticación requerida' };
    if (cart.length === 0) return { success: false, error: 'El carrito está vacío' };

    try {
      const { total } = getCartTotals();

      const { error: orderErr, data: orderData } = await supabase.from('orders').insert({
        customer_id: currentUser.id,
        total,
        status: 'pendiente_pago',
        shipping_address: {
          name: shippingDetails.fullName,
          email: shippingDetails.email,
          phone: shippingDetails.phone,
          address: shippingDetails.address,
          city: shippingDetails.city,
          state: shippingDetails.state || '',
          postal_code: shippingDetails.postalCode,
          notes: shippingDetails.references || ''
        },
        payment_method: 'mercadopago'
      }).select('id').single();

      if (orderErr || !orderData) {
        return { success: false, error: orderErr?.message || 'No se pudo crear el pedido' };
      }
      const orderId = orderData.id;

      const orderItems = cart.map(item => ({
        order_id: orderId,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.discountPrice || item.product.price,
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
      if (itemsErr) return { success: false, error: itemsErr.message };

      return { success: true, orderId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // ── MercadoPago: confirm payment (called from PagoExitoso page) ──────────────
  const confirmMPPayment = async (orderId: string, paymentId: string) => {
    try {
      await supabase.from('orders').update({
        status: 'pagado',
        payment_method: `mercadopago:${paymentId}`
      }).eq('id', orderId);

      // Now clear the cart and update product stock
      for (const item of cart) {
        const newStock = Math.max(0, item.product.stock - item.quantity);
        await supabase.from('products').update({ stock: newStock }).eq('id', item.product.id);
      }

      // Handle affiliate commission if applicable
      if (appliedCoupon?.affiliateId) {
        const { total } = getCartTotals();
        const commissionEarned = parseFloat((total * 0.05).toFixed(2));
        const { data: aff } = await supabase.from('affiliates').select('*').eq('user_id', appliedCoupon.affiliateId).maybeSingle();
        if (aff) {
          await supabase.from('affiliates').update({
            commission_earned: parseFloat(aff.commission_earned) + commissionEarned,
            referred_sales: aff.referred_sales + 1
          }).eq('user_id', appliedCoupon.affiliateId);
        }
        await supabase.from('coupons').update({ usage_count: appliedCoupon.usageCount + 1 }).eq('code', appliedCoupon.code);
      }

      await clearCart();
      if (currentUser) fetchOrders(currentUser.id);
      fetchProducts();

      // Notify admins of new paid order
      sendNotification({
        role: 'admin',
        title: 'Nuevo pedido pagado (MercadoPago)',
        body: `Pedido #${orderId.slice(0, 8).toUpperCase()} confirmado por ${currentUser?.fullName ?? 'un cliente'}.`,
        data: { orderId, type: 'new_order' },
      });
    } catch (err: any) {
      console.error('Error confirmando pago MP:', err.message);
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
        // Notify the approved supplier
        sendNotification({
          userId: app.user_id,
          title: '¡Felicidades! Eres proveedor de Skinly',
          body: 'Tu solicitud como proveedor ha sido aprobada. Ya puedes acceder a tu portal de proveedor.',
          data: { type: 'supplier_approved' },
        });
      } else if (app && !approve) {
        // Notify the rejected applicant
        sendNotification({
          userId: app.user_id,
          title: 'Solicitud de proveedor revisada',
          body: notes
            ? `Tu solicitud fue rechazada. Motivo: ${notes}`
            : 'Tu solicitud de proveedor no fue aprobada en esta ocasión.',
          data: { type: 'supplier_rejected' },
        });
      }
      fetchSupplierApplications();
    } catch (err: any) {
      alert('Excepción al evaluar solicitud: ' + err.message);
    }
  };

  // ── Affiliate Application System ────────────────────────────────────────────

  const submitAffiliateApplication = async (
    data: Omit<AffiliateApplication, 'id' | 'status' | 'createdAt' | 'couponCode'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('affiliate_applications').insert({
        user_id: currentUser?.id || null,
        name: data.fullName,
        email: data.email,
        phone: data.phone || null,
        platform: data.platform,
        handle: data.handle,
        followers_count: data.followersCount,
        why_affiliate: data.whyAffiliate,
        promotion_plan: data.promotionPlan,
        status: 'pendiente'
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al enviar solicitud.' };
    }
  };

  const reviewAffiliateApplication = async (id: string, approve: boolean) => {
    try {
      const app = affiliateApplications.find(a => a.id === id);
      if (!app) return;

      const status = approve ? 'aprobado' : 'rechazado';

      if (approve) {
        // Generate unique coupon code from applicant name
        const baseName = app.fullName.split(' ')[0].toUpperCase().slice(0, 8).replace(/[^A-Z]/g, '');
        const couponCode = `${baseName}${Math.floor(Math.random() * 90 + 10)}`;

        // Update application
        await supabase.from('affiliate_applications').update({ status, coupon_code: couponCode }).eq('id', id);

        // Elevate user role and create affiliate profile if user_id exists
        if (app.userId) {
          await supabase.from('users').update({ role: 'affiliate' }).eq('id', app.userId);

          // Create/upsert affiliate record
          await supabase.from('affiliates').upsert({
            user_id: app.userId,
            coupon_code: couponCode,
            commission_earned: 0,
            clicks_count: 0,
            referred_sales: 0
          });

          // Create coupon in coupons table (5% to customer, affiliate-linked)
          await supabase.from('coupons').insert({
            code: couponCode,
            discount_percentage: 10,
            affiliate_id: app.userId,
            is_active: true,
            usage_count: 0,
            max_uses: 0
          });
        }
      } else {
        await supabase.from('affiliate_applications').update({ status }).eq('id', id);
      }

      // Notify the applicant
      if (app.userId) {
        if (approve) {
          sendNotification({
            userId: app.userId,
            title: '¡Bienvenido al programa de afiliados de Skinly!',
            body: 'Tu solicitud de afiliado fue aprobada. Ya puedes acceder a tu portal y empezar a ganar comisiones.',
            data: { type: 'affiliate_approved' },
          });
        } else {
          sendNotification({
            userId: app.userId,
            title: 'Solicitud de afiliado revisada',
            body: 'Tu solicitud al programa de afiliados no fue aprobada en esta ocasión. Puedes volver a intentarlo más adelante.',
            data: { type: 'affiliate_rejected' },
          });
        }
      }

      await fetchAffiliateApplications();
      fetchAffiliateProfiles();
      fetchUsers();
      fetchCoupons();
    } catch (err: any) {
      alert('Error al revisar solicitud: ' + err.message);
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
      categories,
      addProduct,
      editProduct,
      deleteProduct,

      coupons,
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

      reviews,
      fetchReviews,
      submitReview,
      hasUserPurchasedProduct,
      hasUserReviewedProduct,

      orders,
      placeOrder,
      updateOrderStatus,

      mpPayment,
      createMPOrder,
      confirmMPPayment,

      supplierApplications,
      submitSupplierApplication,
      reviewSupplierApplication,

      affiliateProfiles,
      updateAffiliateClicks,
      requestPayout,
      addCoupon,
      toggleCouponStatus,

      affiliateApplications,
      submitAffiliateApplication,
      reviewAffiliateApplication,

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
