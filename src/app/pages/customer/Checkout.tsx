import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button, Input, Select, TextArea } from '../../components/UI';
import {
  ShieldCheck, ArrowRight, ChevronLeft, CreditCard,
  Landmark, Truck, CheckCircle2, Package, Home
} from 'lucide-react';

// ─── Confirmation screen shown after a successful order ───────────────────────
const OrderConfirmation: React.FC<{
  orderId: string;
  total: number;
  paymentMethod: string;
  onViewOrders: () => void;
  onContinueShopping: () => void;
}> = ({ orderId, total, paymentMethod, onViewOrders, onContinueShopping }) => {
  const shortId = orderId.slice(0, 8).toUpperCase();

  const methodLabel: Record<string, string> = {
    credit_card:    'Tarjeta de Crédito / Débito',
    bank_transfer:  'Transferencia Bancaria',
    delivery_cash:  'Efectivo al Recibir',
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-8">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-brand-green-dark/10 border border-brand-green-dark/20 flex items-center justify-center mx-auto">
        <CheckCircle2 size={36} className="text-brand-green-dark" strokeWidth={1.5} />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold text-brand-black">
          ¡Pedido Confirmado!
        </h1>
        <p className="text-sm text-brand-black/50 font-medium leading-relaxed max-w-sm mx-auto">
          Tu pedido ha sido recibido y está siendo procesado. Recibirás una confirmación en breve.
        </p>
      </div>

      {/* Order summary card */}
      <div className="bg-brand-white border border-brand-black/5 rounded-luxury p-6 text-left space-y-4 shadow-sm">
        <div className="flex justify-between items-center text-xs pb-3 border-b border-brand-black/5">
          <span className="font-bold uppercase tracking-wider text-brand-black/40">Número de Pedido</span>
          <span className="font-mono font-black text-brand-green-dark text-base">#{shortId}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-brand-black/60 font-semibold">Total Cobrado</span>
          <span className="font-black text-brand-black text-base">${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-brand-black/60 font-semibold">Método de Pago</span>
          <span className="font-semibold text-brand-black">{methodLabel[paymentMethod] ?? paymentMethod}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onViewOrders}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-brand-black text-brand-white text-xs font-bold rounded-luxury hover:bg-brand-green-dark transition-colors cursor-pointer"
        >
          <Package size={14} />
          Ver Mis Pedidos
        </button>
        <button
          onClick={onContinueShopping}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-5 border border-brand-black/10 text-brand-black text-xs font-bold rounded-luxury hover:border-brand-black/20 hover:bg-brand-gray-soft transition-colors cursor-pointer"
        >
          <Home size={14} />
          Seguir Comprando
        </button>
      </div>
    </div>
  );
};

// ─── Main checkout page ───────────────────────────────────────────────────────
export const Checkout: React.FC = () => {
  const { cart, getCartTotals, appliedCoupon, placeOrder, goBack, setView, currentUser } = useApp();

  // Shipping form
  const [fullName,   setFullName]   = useState(currentUser?.fullName  || '');
  const [email,      setEmail]      = useState(currentUser?.email     || '');
  const [phone,      setPhone]      = useState(currentUser?.phone     || '');
  const [address,    setAddress]    = useState(currentUser?.address   || '');
  const [city,       setCity]       = useState(currentUser?.city      || '');
  const [state,      setState]      = useState('');
  const [postalCode, setPostalCode] = useState(currentUser?.postalCode || '');
  const [references, setReferences] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer' | 'delivery_cash'>('delivery_cash');

  // UI state
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [orderError, setOrderError] = useState('');

  // Confirmation state — set on success
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: string; total: number } | null>(null);

  const { subtotal, discount, shipping, total } = getCartTotals();
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!fullName.trim())   e.fullName   = 'El nombre completo es requerido.';
    if (!email.trim())      e.email      = 'El correo electrónico es requerido.';
    if (!phone.trim())      e.phone      = 'El teléfono es requerido.';
    if (!address.trim())    e.address    = 'La dirección de envío es requerida.';
    if (!city.trim())       e.city       = 'La ciudad es requerida.';
    if (!postalCode.trim()) e.postalCode = 'El código postal es requerido.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setOrderError('');
    try {
      const res = await placeOrder({ fullName, phone, address, city, postalCode, references, paymentMethod });
      if (res.success && res.orderId) {
        setConfirmedOrder({ id: res.orderId, total });
      } else {
        setOrderError(res.error || 'Error al realizar el pedido. Intenta nuevamente.');
      }
    } catch {
      setOrderError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Show confirmation if order was placed ────────────────────────────────────
  if (confirmedOrder) {
    return (
      <OrderConfirmation
        orderId={confirmedOrder.id}
        total={confirmedOrder.total}
        paymentMethod={paymentMethod}
        onViewOrders={() => setView('order-history')}
        onContinueShopping={() => setView('home')}
      />
    );
  }

  // ── Checkout form ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8">

      {/* Back nav */}
      <div className="flex justify-between items-center pb-4 border-b border-brand-black/5">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-black/50 hover:text-brand-black cursor-pointer transition-colors"
        >
          <ChevronLeft size={16} />
          Regresar a la Bolsa
        </button>
        <span className="text-[10px] uppercase font-bold tracking-widest text-brand-green-dark bg-brand-green-dark/10 px-3 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck size={12} />
          Pago Seguro
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: shipping + payment (2/3) ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6 text-left">

          {/* Shipping form */}
          <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 space-y-5">
            <h2 className="font-heading text-xl font-bold text-brand-black border-b border-brand-black/5 pb-3">
              Datos de Envío
            </h2>

            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
                  Nombre Completo <span className="text-red-400">*</span>
                </label>
                <input
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: '' })); }}
                  placeholder="Victoria Sinclair"
                  className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/30 ${errors.fullName ? 'border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'}`}
                />
                {errors.fullName && <p className="text-[10px] text-red-500 font-semibold">{errors.fullName}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
                  Correo Electrónico <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  placeholder="victoria@ejemplo.com"
                  className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/30 ${errors.email ? 'border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'}`}
                />
                {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email}</p>}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
                Teléfono <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })); }}
                placeholder="+52 555-0199"
                className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/30 ${errors.phone ? 'border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'}`}
              />
              {errors.phone && <p className="text-[10px] text-red-500 font-semibold">{errors.phone}</p>}
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
                Dirección de Envío <span className="text-red-400">*</span>
              </label>
              <input
                value={address}
                onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: '' })); }}
                placeholder="Calle, número, colonia, delegación"
                className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/30 ${errors.address ? 'border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'}`}
              />
              {errors.address && <p className="text-[10px] text-red-500 font-semibold">{errors.address}</p>}
            </div>

            {/* City + State + Postal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
                  Ciudad <span className="text-red-400">*</span>
                </label>
                <input
                  value={city}
                  onChange={e => { setCity(e.target.value); setErrors(p => ({ ...p, city: '' })); }}
                  placeholder="Ciudad de México"
                  className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/30 ${errors.city ? 'border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'}`}
                />
                {errors.city && <p className="text-[10px] text-red-500 font-semibold">{errors.city}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
                  Estado
                </label>
                <input
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder="CDMX"
                  className="w-full px-4 py-3 bg-brand-white border border-brand-black/10 focus:border-brand-green-dark rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/30"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
                  Código Postal <span className="text-red-400">*</span>
                </label>
                <input
                  value={postalCode}
                  onChange={e => { setPostalCode(e.target.value); setErrors(p => ({ ...p, postalCode: '' })); }}
                  placeholder="06600"
                  className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/30 ${errors.postalCode ? 'border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'}`}
                />
                {errors.postalCode && <p className="text-[10px] text-red-500 font-semibold">{errors.postalCode}</p>}
              </div>
            </div>

            {/* References */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
                Referencias / Instrucciones de entrega
              </label>
              <textarea
                rows={2}
                value={references}
                onChange={e => setReferences(e.target.value)}
                placeholder="Código de acceso, edificio, referencias del domicilio..."
                className="w-full px-4 py-3 bg-brand-white border border-brand-black/10 focus:border-brand-green-dark rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/30 resize-none"
              />
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 space-y-5">
            <h2 className="font-heading text-xl font-bold text-brand-black border-b border-brand-black/5 pb-3">
              Método de Pago
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { id: 'delivery_cash'  as const, label: 'Efectivo',       icon: Truck,       desc: 'Pago al recibir' },
                { id: 'bank_transfer'  as const, label: 'Transferencia',   icon: Landmark,    desc: 'SPEI / transferencia' },
                { id: 'credit_card'    as const, label: 'Tarjeta',         icon: CreditCard,  desc: 'Crédito o débito' },
              ]).map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  className={`p-4 rounded-luxury border text-left flex flex-col justify-between h-24 transition-all cursor-pointer ${
                    paymentMethod === id
                      ? 'border-brand-green-dark bg-brand-green-dark/5'
                      : 'border-brand-black/5 hover:border-brand-black/15 bg-brand-white'
                  }`}
                >
                  <Icon size={18} className={paymentMethod === id ? 'text-brand-green-dark' : 'text-brand-black/50'} />
                  <div>
                    <span className={`block text-xs font-bold ${paymentMethod === id ? 'text-brand-green-dark' : 'text-brand-black'}`}>
                      {label}
                    </span>
                    <span className="block text-[10px] text-brand-black/40 mt-0.5">{desc}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Order-level error */}
            {orderError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-luxury">
                {orderError}
              </div>
            )}
          </div>

        </div>

        {/* ── Right: order summary (1/3) ──────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm text-left space-y-5 sticky top-4">
            <h2 className="font-heading text-lg font-bold text-brand-black border-b border-brand-black/5 pb-3">
              Resumen del Pedido
            </h2>

            {/* Product list */}
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {cart.map((item) => {
                const price = item.product.discountPrice ?? item.product.price;
                return (
                  <div key={item.product.id} className="flex gap-3 text-xs items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.product.imageUrl || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=80'}
                        alt={item.product.name}
                        className="w-9 h-11 object-cover rounded-md border border-brand-black/5 shrink-0 bg-brand-gray-soft"
                      />
                      <div className="min-w-0">
                        <span className="block truncate font-semibold text-brand-black">{item.product.name}</span>
                        <span className="block text-[10px] text-brand-black/40">× {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-bold text-brand-black shrink-0">${(price * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Cost breakdown */}
            <div className="border-t border-brand-black/5 pt-4 space-y-2.5 text-xs text-brand-black/70">
              <div className="flex justify-between font-semibold">
                <span>Subtotal ({cartItemsCount} artículos)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between font-bold text-brand-green-dark">
                  <span>Cupón ({appliedCoupon.code} -{appliedCoupon.discountPercentage}%)</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Envío</span>
                <span>{shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-brand-black/5 pt-3 flex justify-between font-black text-base text-brand-black">
                <span>Total a Pagar</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full py-4 bg-brand-green-dark hover:bg-brand-black text-white text-sm font-bold rounded-luxury flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando…
                </>
              ) : (
                <>
                  Confirmar Pedido
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <p className="text-[9px] text-brand-black/35 text-center font-medium">
              🔒 Tu información está cifrada y segura.
            </p>
          </div>
        </div>

      </form>
    </div>
  );
};
