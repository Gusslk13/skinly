import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, Grid, Heart, ShoppingBag, User, 
  Leaf, LogOut, ShieldCheck, Award, Package, Menu, X
} from 'lucide-react';

// ============================================================================
// ENCABEZADO PRINCIPAL DE LUJO
// ============================================================================
export const Header: React.FC = () => {
  const { 
    currentView, setView, currentUser, cart, favorites, logout 
  } = useApp();

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-30 w-full bg-brand-white/80 backdrop-blur-md border-b border-brand-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo y nombre de la marca */}
        <div 
          onClick={() => setView('home')} 
          className="flex items-center gap-2 cursor-pointer group"
        >
          <Leaf className="text-brand-green-dark transition-transform duration-500 group-hover:rotate-12" size={22} />
          <span className="font-heading text-2xl font-bold tracking-widest text-brand-black">
            SKINLY
          </span>
        </div>

        {/* Navegación principal de escritorio */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-brand-black/60">
          <button 
            onClick={() => setView('home')} 
            className={`hover:text-brand-black cursor-pointer transition-colors ${currentView === 'home' ? 'text-brand-green-dark border-b border-brand-green-dark pb-0.5' : ''}`}
          >
            Inicio
          </button>
          <button 
            onClick={() => setView('categories')} 
            className={`hover:text-brand-black cursor-pointer transition-colors ${currentView === 'categories' ? 'text-brand-green-dark border-b border-brand-green-dark pb-0.5' : ''}`}
          >
            Tienda
          </button>
          {currentUser && currentUser.role === 'admin' && (
            <button 
              onClick={() => setView('admin-dashboard')} 
              className={`text-brand-green-dark font-extrabold hover:text-brand-black cursor-pointer transition-colors ${currentView === 'admin-dashboard' ? 'border-b border-brand-green-dark pb-0.5' : ''}`}
            >
              Panel Admin
            </button>
          )}
          {currentUser && currentUser.role === 'affiliate' && (
            <button 
              onClick={() => setView('affiliate-dashboard')} 
              className="text-indigo-600 font-bold hover:text-indigo-800 cursor-pointer transition-colors"
            >
              Portal Afiliado
            </button>
          )}
          {currentUser && currentUser.role === 'supplier' && (
            <button 
              onClick={() => setView('supplier-portal')} 
              className="text-amber-600 font-bold hover:text-amber-800 cursor-pointer transition-colors"
            >
              Portal Proveedor
            </button>
          )}
        </nav>

        {/* Botones de acción de navegación */}
        <div className="flex items-center gap-4">
          {/* Favoritos */}
          <button 
            onClick={() => setView('favorites')}
            className="p-2 relative text-brand-black/70 hover:text-brand-black hover:scale-105 transition-all cursor-pointer hidden sm:block"
            title="Favoritos"
          >
            <Heart size={19} className={favorites.length > 0 ? 'fill-red-500 text-red-500' : ''} />
            {favorites.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* Icono del carrito */}
          <button 
            onClick={() => setView('cart')}
            className="p-2 relative text-brand-black/70 hover:text-brand-black hover:scale-105 transition-all cursor-pointer"
            title="Ver Carrito"
          >
            <ShoppingBag size={19} />
            {cartItemsCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-brand-green-dark text-brand-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Icono de perfil */}
          <button 
            onClick={() => setView('profile')}
            className="p-2 text-brand-black/70 hover:text-brand-black hover:scale-105 transition-all cursor-pointer"
            title="Perfil"
          >
            <User size={19} />
          </button>

          {/* Cerrar sesión (Escritorio) */}
          {currentUser && (
            <button 
              onClick={logout}
              className="hidden md:flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-brand-black/40 hover:text-red-600 transition-colors ml-2 cursor-pointer"
            >
              <LogOut size={13} />
              Salir
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// BARRA DE NAVEGACIÓN MÓVIL (Estilo pestaña iOS)
// ============================================================================
export const MobileNavBar: React.FC = () => {
  const { currentView, setView, cart, favorites } = useApp();
  
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const tabs = [
    { view: 'home' as const, label: 'Inicio', icon: Home },
    { view: 'categories' as const, label: 'Categorías', icon: Grid },
    { view: 'favorites' as const, label: 'Guardados', icon: Heart, count: favorites.length },
    { view: 'cart' as const, label: 'Carrito', icon: ShoppingBag, count: cartCount },
    { view: 'profile' as const, label: 'Perfil', icon: User }
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-brand-white/90 backdrop-blur-md border-t border-brand-black/5 py-2 px-4 shadow-lg flex justify-between items-center safe-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.view;
        return (
          <button
            key={tab.view}
            onClick={() => setView(tab.view)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 relative py-1 cursor-pointer"
          >
            <Icon 
              size={18} 
              className={`transition-colors duration-300 ${
                isActive ? 'text-brand-green-dark' : 'text-brand-black/40'
              }`} 
            />
            <span 
              className={`text-[9px] font-bold tracking-wide transition-colors ${
                isActive ? 'text-brand-green-dark' : 'text-brand-black/40'
              }`}
            >
              {tab.label}
            </span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="absolute top-0 right-1/4 w-3.5 h-3.5 rounded-full bg-brand-green-dark text-brand-white text-[8px] font-extrabold flex items-center justify-center">
                {tab.count}
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
    <footer className="bg-brand-black text-brand-white/80 border-t border-brand-white/5 py-12 px-4 md:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Columna 1 - Info de la marca */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Leaf className="text-brand-green-light" size={20} />
            <span className="font-heading text-xl font-bold tracking-widest text-brand-white">
              SKINLY
            </span>
          </div>
          <p className="text-xs text-brand-white/50 leading-relaxed">
            Formulaciones botánicas ultra limpias. Complejos activos científicamente comprobados. Certificación eco-lux.
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
            <li><button onClick={() => setView('categories')} className="hover:text-brand-green-light cursor-pointer">Exfoliantes</button></li>
            <li><button onClick={() => setView('categories')} className="hover:text-brand-green-light cursor-pointer">Estándares de Toxicidad</button></li>
          </ul>
        </div>

        {/* Columna 3 - Portales de socios */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-white mb-4">Portales de Socios</h4>
          <ul className="space-y-2 text-xs text-brand-white/50">
            <li><button onClick={() => setView('affiliate-dashboard')} className="hover:text-brand-green-light text-left cursor-pointer">Panel de Afiliado</button></li>
            <li><button onClick={() => setView('supplier-portal')} className="hover:text-brand-green-light text-left cursor-pointer">Portal de Proveedor</button></li>
            <li><button onClick={() => setView('admin-dashboard')} className="hover:text-brand-green-light text-left cursor-pointer">Panel Administrativo</button></li>
            <li><button onClick={() => setView('profile')} className="hover:text-brand-green-light text-left cursor-pointer">Perfil del Cliente</button></li>
          </ul>
        </div>

        {/* Columna 4 - Newsletter */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-white mb-4">Newsletter Skinly</h4>
          <p className="text-xs text-brand-white/50 mb-3 leading-relaxed">
            Suscríbete para lanzamientos de lujo, investigación de skincare y novedades botánicas.
          </p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Tu correo electrónico" 
              className="flex-1 bg-brand-white/10 text-xs px-3.5 py-2 border border-brand-white/10 rounded-luxury focus:outline-none focus:border-brand-green-light text-brand-white"
            />
            <button className="px-4 py-2 bg-brand-green-dark text-brand-white hover:bg-brand-green-light hover:text-brand-black text-xs font-bold rounded-luxury transition-all cursor-pointer">
              Unirse
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
