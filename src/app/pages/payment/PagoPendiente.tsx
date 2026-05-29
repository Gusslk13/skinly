import React from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, Package, Home, RefreshCw } from 'lucide-react';

export const PagoPendiente: React.FC = () => {
  const { mpPayment, setView } = useApp();

  const orderId = mpPayment?.orderId || '';
  const paymentId = mpPayment?.paymentId || '';
  const shortOrder = orderId.slice(0, 8).toUpperCase();

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-8">

      {/* Pending icon */}
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 rounded-full bg-amber-100 animate-pulse opacity-60" />
        <div className="relative w-24 h-24 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
          <Clock size={44} className="text-amber-600" strokeWidth={1.5} />
        </div>
      </div>

      {/* Headline */}
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold text-brand-black">Pago en Proceso</h1>
        <p className="text-sm text-brand-black/50 font-medium leading-relaxed max-w-sm mx-auto">
          Tu pago está siendo procesado por MercadoPago. Esto puede tardar algunos minutos.
          Recibirás una confirmación cuando se complete.
        </p>
      </div>

      {/* Status card */}
      <div className="bg-amber-50 border border-amber-200 rounded-luxury p-5 text-left space-y-3">
        <div className="flex items-center gap-2 text-amber-700 pb-2 border-b border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">Verificando con MercadoPago</span>
        </div>

        {orderId && (
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-brand-black/60">Número de Pedido</span>
            <span className="font-mono font-black text-brand-black text-base">#{shortOrder}</span>
          </div>
        )}

        {paymentId && (
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-brand-black/60">ID de Pago MP</span>
            <span className="font-mono text-brand-black font-bold">{paymentId}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-brand-black/60">Estado</span>
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wide rounded-full border border-amber-200">
            Pendiente
          </span>
        </div>

        <div className="pt-2 space-y-2 text-[11px] text-amber-800 font-semibold">
          <p className="leading-relaxed">
            Métodos como transferencias bancarias o pagos en efectivo (OXXO) pueden tardar hasta 72 horas en confirmarse.
          </p>
          <p className="leading-relaxed">
            Tu pedido quedará en estado <strong>Pendiente de Pago</strong> hasta recibir confirmación de MercadoPago.
          </p>
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
          Ir al Inicio
        </button>
      </div>

      {/* Refresh hint */}
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-1.5 text-[11px] text-brand-black/40 hover:text-brand-black transition-colors cursor-pointer"
      >
        <RefreshCw size={12} />
        Verificar estado actualizado
      </button>

    </div>
  );
};
