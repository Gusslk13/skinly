import React from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { AppProvider, useApp } from './context/AppContext';
import { Header, MobileNavBar, Footer } from './components/Layout';
import { Truck, Plane, Package, Shield } from 'lucide-react';

// Onboarding Pages
import { SplashScreen } from './pages/onboarding/SplashScreen';
import { Onboarding } from './pages/onboarding/Onboarding';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Customer Pages
import { Home } from './pages/customer/Home';
import { Categories } from './pages/customer/Categories';
import { ProductDetails } from './pages/customer/ProductDetails';
import { Cart } from './pages/customer/Cart';
import { Checkout } from './pages/customer/Checkout';
import { Favorites } from './pages/customer/Favorites';
import { OrderHistory } from './pages/customer/OrderHistory';
import { Profile } from './pages/customer/Profile';

// Portals & Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SupplierPortal } from './pages/supplier/SupplierPortal';
import { AffiliateDashboard } from './pages/affiliate/AffiliateDashboard';
import { AffiliateProgram } from './pages/affiliate/AffiliateProgram';

// Payment Return Pages
import { PagoExitoso } from './pages/payment/PagoExitoso';
import { PagoFallido } from './pages/payment/PagoFallido';
import { PagoPendiente } from './pages/payment/PagoPendiente';

import { useFCM } from './hooks/useFCM';

// ── Shipping Ticker ───────────────────────────────────────────────────────────
const TICKER_STYLE = `
@keyframes ticker {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`;

const GREEN = '#4CAF50';

interface TickerItem { icon: React.ReactNode; text: string; }
const ITEMS: TickerItem[] = [
  { icon: <Truck  size={14} color={GREEN} />, text: 'Envío Gratis en compras mayores a $1,000 MXN' },
  { icon: <Plane  size={14} color={GREEN} />, text: 'Envíos Internacionales' },
  { icon: <Package size={14} color={GREEN} />, text: 'Entrega Segura Garantizada' },
  { icon: <Shield  size={14} color={GREEN} />, text: 'Protege tu pedido por solo $19 MXN' },
];

const TickerLap: React.FC = () => (
  <>
    {ITEMS.map((item, i) => (
      <React.Fragment key={i}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          {item.icon}
          {item.text}
        </span>
        <span style={{ margin: '0 22px', color: '#444', fontWeight: 300 }}>•</span>
      </React.Fragment>
    ))}
  </>
);

const ShippingTickerGlobal: React.FC = () => (
  <>
    <style>{TICKER_STYLE}</style>
    <div
      style={{
        background: '#111111',
        color: '#ffffff',
        height: 36,
        overflow: 'hidden',
        position: 'sticky',
        top: 64,
        zIndex: 39,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {/* Two identical laps → translateX(-50%) creates seamless loop */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          animation: 'ticker 32s linear infinite',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.02em',
          paddingLeft: 24,
        }}
      >
        <TickerLap />
        <TickerLap />
      </div>
    </div>
  </>
);
// ─────────────────────────────────────────────────────────────────────────────

const AppContent: React.FC = () => {
  const { currentView } = useApp();
  useFCM();

  // Full-bleed views (No layout headers/footers)
  if (currentView === 'splash') return <SplashScreen />;
  if (currentView === 'onboarding') return <Onboarding />;
  if (currentView === 'login') return <Login />;
  if (currentView === 'register') return <Register />;

  const renderView = () => {
    switch (currentView) {
      case 'home':             return <Home />;
      case 'categories':       return <Categories />;
      case 'product-details':  return <ProductDetails />;
      case 'cart':             return <Cart />;
      case 'checkout':         return <Checkout />;
      case 'favorites':        return <Favorites />;
      case 'order-history':    return <OrderHistory />;
      case 'profile':          return <Profile />;
      case 'admin-dashboard':  return <AdminDashboard />;
      case 'supplier-portal':  return <SupplierPortal />;
      case 'affiliate-dashboard': return <AffiliateDashboard />;
      case 'affiliate-program':   return <AffiliateProgram />;
      case 'pago-exitoso':     return <PagoExitoso />;
      case 'pago-fallido':     return <PagoFallido />;
      case 'pago-pendiente':   return <PagoPendiente />;
      default:                 return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-gray-soft flex flex-col relative pb-20 md:pb-0 select-none">

      {/* Sticky Premium Header */}
      <Header />

      {/* Shipping ticker — sticky below navbar, shown on all customer views */}
      <ShippingTickerGlobal />

      {/* Main content */}
      <main className="flex-1 w-full relative">
        <div key={currentView} className="animate-fade-in-up">
          {renderView()}
        </div>
      </main>

      {/* iOS Tab Bar (mobile only) */}
      <MobileNavBar />

      {/* Footer */}
      <Footer />

    </div>
  );
};

export default function App() {
  return (
    <PayPalScriptProvider options={{
      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID ?? '',
      currency: 'USD',
      intent: 'capture',
    }}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </PayPalScriptProvider>
  );
}
