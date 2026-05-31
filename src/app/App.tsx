import React from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { AppProvider, useApp } from './context/AppContext';
import { Header, MobileNavBar, Footer } from './components/Layout';

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

const AppContent: React.FC = () => {
  const { currentView } = useApp();
  useFCM();

  // Full-bleed views (No layout headers/footers)
  if (currentView === 'splash') return <SplashScreen />;
  if (currentView === 'onboarding') return <Onboarding />;
  if (currentView === 'login') return <Login />;
  if (currentView === 'register') return <Register />;

  // Render view template
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home />;
      case 'categories':
        return <Categories />;
      case 'product-details':
        return <ProductDetails />;
      case 'cart':
        return <Cart />;
      case 'checkout':
        return <Checkout />;
      case 'favorites':
        return <Favorites />;
      case 'order-history':
        return <OrderHistory />;
      case 'profile':
        return <Profile />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'supplier-portal':
        return <SupplierPortal />;
      case 'affiliate-dashboard':
        return <AffiliateDashboard />;
      case 'affiliate-program':
        return <AffiliateProgram />;
      case 'pago-exitoso':
        return <PagoExitoso />;
      case 'pago-fallido':
        return <PagoFallido />;
      case 'pago-pendiente':
        return <PagoPendiente />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-gray-soft flex flex-col relative pb-20 md:pb-0 select-none">
      
      {/* Sticky Premium Header */}
      <Header />

      {/* Main Responsive content scroll container */}
      <main className="flex-1 w-full relative">
        <div key={currentView} className="animate-fade-in-up">
          {renderView()}
        </div>
      </main>

      {/* iOS App Navigation Tab Bar (Shown only on mobile) */}
      <MobileNavBar />

      {/* Clean Premium Footer */}
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
