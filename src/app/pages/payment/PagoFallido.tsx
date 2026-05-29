import React from 'react';
import { useApp } from '../../context/AppContext';
import { XCircle, RotateCcw, Home, AlertTriangle } from 'lucide-react';

export const PagoFallido: React.FC = () => {
  const { mpPayment, setView } = useApp();

  const orderId = mpPayment?.orderId || '';
  const shortOrder = orderId.slice(0, 8).toUpperCase();

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-8">

      {/* Error icon */}
      <div className="w-24 h-24 mx-auto rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
        <XCircle size={44} className="text-red-500" strokeWidth={1.5} />
      </div>

      {/* Headline */}
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold text-brand-black">Pago No Procesado</h1>
        <p className="text-sm text-brand-black/50 font-medium leading-relaxed max-w-sm mx-auto">
          Tu pago no pudo ser completado. No se realizó ningún cargo. Puedes intentarlo nuevamente con otro método de pago.
        </p>
      </div>

      {/* Info card */}
      <div className="bg-red-50 border border-red-200 rounded-luxury p-5 text-left space-y-3">
        <div className="flex items-center gap-2 text-red-600 pb-2 border-b border-red-200">
          <AlertTriangle size={15} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">Pago Rechazado por MercadoPago</span>
        </div>

        {orderId && (
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-brand-black/60">Referencia de Pedido</span>
            <span className="font-mono font-bold text-brand-black">#{shortOrder}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-brand-black/60">Estado</span>
          <span className="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] font-extrabold uppercase tracking-wide rounded-full border border-red-200">
            Fallido
          </span>
        </div>

        <p className="text-[11px] text-brand-black/50 font-medium leading-relaxed pt-1">
          Posibles causas: fondos insuficientes, datos incorrectos, tarjeta bloqueada o límite excedido.
          Intenta con otra tarjeta o método de pago.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setView('checkout')}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-brand-black text-brand-white text-xs font-bold rounded-luxury hover:bg-brand-green-dark transition-colors cursor-pointer"
        >
          <RotateCcw size={14} />
          Reintentar Pago
        </button>
        <button
          onClick={() => setView('cart')}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-5 border border-brand-black/10 text-brand-black text-xs font-bold rounded-luxury hover:border-brand-black/20 hover:bg-brand-gray-soft transition-colors cursor-pointer"
        >
          <Home size={14} />
          Volver al Carrito
        </button>
      </div>

    </div>
  );
};
