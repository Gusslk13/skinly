import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Home, Grid, Heart, ShoppingBag, User,
  LogOut, ShieldCheck, Award, Package, Menu, X
} from 'lucide-react';

// Tipos globales para la API de Tawk.to inyectada vía script en index.html
declare global {
  interface Window {
    Tawk_API?: {
      hideWidget?: () => void;
      showWidget?: () => void;
      onLoad?: () => void;
    };
  }
}

// Vistas que corresponden al panel de administración
const ADMIN_VIEWS = ['admin-dashboard'];

// ============================================================================
// ENCABEZADO PRINCIPAL DE LUJO
// ============================================================================
export const Header: React.FC = () => {
  const {
    currentView, setView, currentUser, cart, favorites, logout
  } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Close menu when route changes
  useEffect(() => { setMobileOpen(false); }, [currentView]);

  // Ocultar/mostrar widget de Tawk.to según si estamos en el panel admin
  useEffect(() => {
    const isAdmin = ADMIN_VIEWS.includes(currentView);

    const apply = () => {
      if (isAdmin) {
        window.Tawk_API?.hideWidget?.();
      } else {
        window.Tawk_API?.showWidget?.();
      }
    };

    // Si el widget ya cargó, aplicar de inmediato
    apply();

    // Si todavía no cargó, registrar callback onLoad para cuando termine
    if (window.Tawk_API && !window.Tawk_API.hideWidget) {
      window.Tawk_API.onLoad = apply;
    }
  }, [currentView]);

  // Close menu on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  const nav = (view: Parameters<typeof setView>[0]) => {
    setView(view);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-brand-white/90 backdrop-blur-md border-b border-brand-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">

        {/* Logo */}
        <div
          onClick={() => nav('home')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <img
            src="/images/logo.png"
            alt="Skinly"
            className="w-8 h-8 object-contain transition-transform duration-500 group-hover:scale-110"
          />
          <span className="font-heading text-xl sm:text-2xl font-bold tracking-widest text-brand-black">
            SKINLY
          </span>
        </div>

        {/* Navegación principal — desktop */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-brand-black/60">
          <button
            onClick={() => nav('home')}
            className={`hover:text-brand-black cursor-pointer transition-colors ${currentView === 'home' ? 'text-brand-green-dark border-b border-brand-green-dark pb-0.5' : ''}`}
          >
            Inicio
          </button>
          <button
            onClick={() => nav('categories')}
            className={`hover:text-brand-black cursor-pointer transition-colors ${currentView === 'categories' ? 'text-brand-green-dark border-b border-brand-green-dark pb-0.5' : ''}`}
          >
            Tienda
          </button>
          <button
            onClick={() => nav('affiliate-program')}
            className={`hover:text-brand-black cursor-pointer transition-colors ${currentView === 'affiliate-program' ? 'text-brand-green-dark border-b border-brand-green-dark pb-0.5' : ''}`}
          >
            Afiliados
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => nav('admin-dashboard')}
              className={`text-brand-green-dark font-extrabold hover:text-brand-black cursor-pointer transition-colors ${currentView === 'admin-dashboard' ? 'border-b border-brand-green-dark pb-0.5' : ''}`}
            >
              Panel Admin
            </button>
          )}
          {currentUser?.role === 'affiliate' && (
            <button onClick={() => nav('affiliate-dashboard')} className="text-indigo-600 font-bold hover:text-indigo-800 cursor-pointer transition-colors">
              Portal Afiliado
            </button>
          )}
          {currentUser?.role === 'supplier' && (
            <button onClick={() => nav('supplier-portal')} className="text-amber-600 font-bold hover:text-amber-800 cursor-pointer transition-colors">
              Portal Proveedor
            </button>
          )}
        </nav>

        {/* Botones de acción */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Favoritos — oculto en mobile, visible desde sm */}
          <button
            onClick={() => nav('favorites')}
            className="p-2 relative text-brand-black/70 hover:text-brand-black transition-all cursor-pointer hidden sm:block"
            title="Favoritos"
          >
            <Heart size={19} className={favorites.length > 0 ? 'fill-red-500 text-red-500' : ''} />
            {favorites.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* Carrito */}
          <button
            onClick={() => nav('cart')}
            className="p-2 relative text-brand-black/70 hover:text-brand-black transition-all cursor-pointer"
            title="Ver Carrito"
          >
            <ShoppingBag size={19} />
            {cartItemsCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-brand-green-dark text-brand-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Perfil — desktop */}
          <button
            onClick={() => nav('profile')}
            className="p-2 text-brand-black/70 hover:text-brand-black transition-all cursor-pointer hidden md:block"
            title="Perfil"
          >
            <User size={19} />
          </button>

          {/* Logout — desktop */}
          {currentUser && (
            <button
              onClick={logout}
              className="hidden md:flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-brand-black/40 hover:text-red-600 transition-colors ml-1 cursor-pointer"
            >
              <LogOut size={13} />
              Salir
            </button>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2 text-brand-black/70 hover:text-brand-black transition-colors cursor-pointer"
            aria-label="Menú"
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div
          ref={menuRef}
          className="md:hidden absolute top-full inset-x-0 bg-brand-white border-b border-brand-black/5 shadow-xl animate-fade-in z-50"
        >
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            <MobileNavLink label="Inicio" active={currentView === 'home'} onClick={() => nav('home')} />
            <MobileNavLink label="Tienda" active={currentView === 'categories'} onClick={() => nav('categories')} />
            <MobileNavLink label="Programa de Afiliados" active={currentView === 'affiliate-program'} onClick={() => nav('affiliate-program')} />
            <MobileNavLink label="Mi Cuenta" active={currentView === 'profile'} onClick={() => nav('profile')} />
            <MobileNavLink label="Favoritos" active={currentView === 'favorites'} onClick={() => nav('favorites')} />
            <MobileNavLink label="Mis Pedidos" active={currentView === 'order-history'} onClick={() => nav('order-history')} />

            {currentUser?.role === 'admin' && (
              <MobileNavLink label="Panel Admin" active={currentView === 'admin-dashboard'} onClick={() => nav('admin-dashboard')} accent="green" />
            )}
            {currentUser?.role === 'affiliate' && (
              <MobileNavLink label="Portal Afiliado" active={currentView === 'affiliate-dashboard'} onClick={() => nav('affiliate-dashboard')} accent="indigo" />
            )}
            {currentUser?.role === 'supplier' && (
              <MobileNavLink label="Portal Proveedor" active={currentView === 'supplier-portal'} onClick={() => nav('supplier-portal')} accent="amber" />
            )}

            {currentUser ? (
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="mt-2 w-full flex items-center gap-2 px-4 py-3 rounded-luxury text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            ) : (
              <button
                onClick={() => nav('login')}
                className="mt-2 w-full px-4 py-3 bg-brand-black text-brand-white text-sm font-bold rounded-luxury cursor-pointer hover:bg-brand-green-dark transition-colors"
              >
                Iniciar Sesión
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

const MobileNavLink: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  accent?: 'green' | 'indigo' | 'amber';
}> = ({ label, active, onClick, accent }) => {
  const accentColor =
    accent === 'green' ? 'text-brand-green-dark' :
    accent === 'indigo' ? 'text-indigo-600' :
    accent === 'amber' ? 'text-amber-600' :
    'text-brand-black';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-luxury text-sm font-semibold transition-colors cursor-pointer ${
        active
          ? 'bg-brand-green-dark/8 text-brand-green-dark'
          : `hover:bg-brand-gray-soft ${accentColor}`
      }`}
    >
      {label}
    </button>
  );
};

// ============================================================================
// BARRA DE NAVEGACIÓN MÓVIL INFERIOR (Estilo pestaña iOS)
// ============================================================================
export const MobileNavBar: React.FC = () => {
  const { currentView, setView, cart, favorites } = useApp();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const tabs = [
    { view: 'home' as const, label: 'Inicio', icon: Home },
    { view: 'categories' as const, label: 'Tienda', icon: Grid },
    { view: 'favorites' as const, label: 'Guardados', icon: Heart, count: favorites.length },
    { view: 'cart' as const, label: 'Carrito', icon: ShoppingBag, count: cartCount },
    { view: 'profile' as const, label: 'Perfil', icon: User }
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-brand-white/95 backdrop-blur-md border-t border-brand-black/5 shadow-lg flex justify-between items-center safe-bottom px-2 pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.view;
        return (
          <button
            key={tab.view}
            onClick={() => setView(tab.view)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 relative py-2 cursor-pointer min-h-[52px]"
          >
            <Icon
              size={20}
              className={`transition-colors duration-200 ${isActive ? 'text-brand-green-dark' : 'text-brand-black/35'}`}
            />
            <span className={`text-[9px] font-bold tracking-wide transition-colors ${isActive ? 'text-brand-green-dark' : 'text-brand-black/35'}`}>
              {tab.label}
            </span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="absolute top-1 right-[calc(50%-14px)] w-4 h-4 rounded-full bg-brand-green-dark text-brand-white text-[8px] font-extrabold flex items-center justify-center">
                {tab.count > 9 ? '9+' : tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// PIE DE PÁGINA DE LUJO
// ============================================================================
export const Footer: React.FC = () => {
  const { setView } = useApp();

  return (
    <footer className="bg-brand-black text-brand-white/80 border-t border-brand-white/5 py-10 px-4 md:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">

        {/* Columna 1 - Info de la marca */}
        <div className="col-span-2 md:col-span-1 space-y-4">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Skinly" className="w-7 h-7 object-contain brightness-0 invert opacity-80" />
            <span className="font-heading text-xl font-bold tracking-widest text-brand-white">SKINLY</span>
          </div>
          <p className="text-xs text-brand-white/50 leading-relaxed">
            Formulaciones botánicas ultra limpias. Complejos activos científicamente comprobados.
          </p>
          <p className="text-[10px] text-brand-white/30 font-semibold tracking-wider">
            © 2026 Skinly, Inc. Todos los derechos reservados.
          </p>
        </div>

        {/* Columna 2 - Colección */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-white mb-4">Colección</h4>
          <ul className="space-y-2 text-xs text-brand-white/50">
            <li><button onClick={() => setView('categories')} className="hover:text-brand-green-light cursor-pointer">Serums</button></li>
            <li><button onClick={() => setView('categories')} className="hover:text-brand-green-light cursor-pointer">Hidratantes</button></li>
            <li><button onClick={() => setView('categories')} className="hover:text-brand-green-light cursor-pointer">Limpiadores</button></li>
            <li><button onClick={() => setView('categories')} className="hover:text-brand-green-light cursor-pointer">Tónicos</button></li>
          </ul>
        </div>

        {/* Columna 3 - Portales */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-white mb-4">Portales</h4>
          <ul className="space-y-2 text-xs text-brand-white/50">
            <li><button onClick={() => setView('affiliate-program')} className="hover:text-brand-green-light text-left cursor-pointer">Programa de Afiliados</button></li>
            <li><button onClick={() => setView('supplier-portal')} className="hover:text-brand-green-light text-left cursor-pointer">Proveedores</button></li>
            <li><button onClick={() => setView('admin-dashboard')} className="hover:text-brand-green-light text-left cursor-pointer">Admin</button></li>
            <li><button onClick={() => setView('profile')} className="hover:text-brand-green-light text-left cursor-pointer">Mi Cuenta</button></li>
          </ul>
        </div>

        {/* Columna 4 - Newsletter */}
        <div className="col-span-2 md:col-span-1">
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-white mb-4">Newsletter</h4>
          <p className="text-xs text-brand-white/50 mb-3 leading-relaxed">
            Suscríbete para lanzamientos y novedades botánicas.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="flex-1 min-w-0 bg-brand-white/10 text-xs px-3 py-2 border border-brand-white/10 rounded-luxury focus:outline-none focus:border-brand-green-light text-brand-white"
            />
            <button className="px-3 py-2 bg-brand-green-dark text-brand-white hover:bg-brand-green-light hover:text-brand-black text-xs font-bold rounded-luxury transition-all cursor-pointer whitespace-nowrap">
              Unirse
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
