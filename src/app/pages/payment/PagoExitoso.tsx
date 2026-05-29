import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Package, Home, ShieldCheck } from 'lucide-react';

export const PagoExitoso: React.FC = () => {
  const { mpPayment, confirmMPPayment, setView } = useApp();
  const confirmed = useRef(false);

  const orderId = mpPayment?.orderId || '';
  const paymentId = mpPayment?.paymentId || '';
  const shortOrder = orderId.slice(0, 8).toUpperCase();

  // Confirm payment in Supabase once, on mount
  useEffect(() => {
    if (confirmed.current || !orderId) return;
    confirmed.current = true;
    confirmMPPayment(orderId, paymentId);
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-8">

      {/* Success icon */}
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 rounded-full bg-brand-green-dark/10 animate-ping opacity-40" />
        <div className="relative w-24 h-24 rounded-full bg-brand-green-dark/10 border border-brand-green-dark/20 flex items-center justify-center">
          <CheckCircle2 size={44} className="text-brand-green-dark" strokeWidth={1.5} />
        </div>
      </div>

      {/* Headline */}
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold text-brand-black">¡Pago Exitoso!</h1>
        <p className="text-sm text-brand-black/50 font-medium leading-relaxed max-w-sm mx-auto">
          Tu pago fue procesado correctamente por MercadoPago. Ya estamos preparando tu pedido.
        </p>
      </div>

      {/* Order card */}
      <div className="bg-brand-white border border-brand-black/5 rounded-luxury p-6 text-left space-y-4 shadow-sm">

        <div className="flex items-center gap-2 text-brand-green-dark pb-3 border-b border-brand-black/5">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">Pago Verificado por MercadoPago</span>
        </div>

        {orderId && (
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-brand-black/50">Número de Pedido</span>
            <span className="font-mono font-black text-brand-green-dark text-base">#{shortOrder}</span>
          </div>
        )}

        {paymentId && (
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-brand-black/50">ID de Pago MP</span>
            <span className="font-mono text-brand-black font-bold">{paymentId}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-brand-black/50">Estado</span>
          <span className="px-2.5 py-1 bg-brand-green-dark/10 text-brand-green-dark text-[10px] font-extrabold uppercase tracking-wide rounded-full border border-brand-green-dark/15">
            Aprobado
          </span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-brand-black/50">Método</span>
          <span className="font-semibold text-brand-black">MercadoPago</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setView('order-history')}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-brand-black text-brand-white text-xs font-bold rounded-luxury hover:bg-brand-green-dark transition-colors cursor-pointer"
        >
          <Package size={14} />
          Ver Mis Pedidos
        </button>
        <button
          onClick={() => setView('home')}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-5 border border-brand-black/10 text-brand-black text-xs font-bold rounded-luxury hover:border-brand-black/20 hover:bg-brand-gray-soft transition-colors cursor-pointer"
        >
          <Home size={14} />
          Seguir Comprando
        </button>
      </div>

    </div>
  );
};
