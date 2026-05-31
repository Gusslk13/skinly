import React, { useRef, useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../../supabase';
import { sendNotification } from '../../../lib/sendNotification';
import {
  ShieldCheck, ChevronLeft, CreditCard,
  Package, Home, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';

// ─── Tasa de conversión MXN → USD (aproximada) ───────────────────────────────
const MXN_TO_USD = 17.5;

// ─── Direct Edge Function URL ─────────────────────────────────────────────────
const MP_EDGE_URL =
  'https://bavarmytvyntpohimkqt.supabase.co/functions/v1/create-mp-preference';

// ─── Tipos locales ─────────────────────────────────────────────────────────────
type PaymentMethod = 'mercadopago' | 'paypal';

interface PayPalSuccess {
  orderId: string;
  captureId: string;
}

// ─── Main checkout page ───────────────────────────────────────────────────────
export const Checkout: React.FC = () => {
  const {
    cart, getCartTotals, appliedCoupon,
    createMPOrder, clearCart, goBack, setView, currentUser,
  } = useApp();

  // ── Shipping form state ──────────────────────────────────────────────────────
  const [fullName,   setFullName]   = useState(currentUser?.fullName   || '');
  const [email,      setEmail]      = useState(currentUser?.email      || '');
  const [phone,      setPhone]      = useState(currentUser?.phone      || '');
  const [address,    setAddress]    = useState(currentUser?.address    || '');
  const [city,       setCity]       = useState(currentUser?.city       || '');
  const [stateField, setStateField] = useState('');
  const [postalCode, setPostalCode] = useState(currentUser?.postalCode || '');
  const [references, setReferences] = useState('');

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago');
  const [loading,       setLoading]       = useState(false);
  const [loadingStep,   setLoadingStep]   = useState('');
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [orderError,    setOrderError]    = useState('');
  const [paypalSuccess, setPaypalSuccess] = useState<PayPalSuccess | null>(null);

  // ref para guardar el orderId de Supabase durante el flujo de PayPal
  const paypalOrderIdRef = useRef<string | null>(null);

  const { subtotal, discount, shipping, total } = getCartTotals();
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const usdTotal = total / MXN_TO_USD;

  // ── Field-level validation ───────────────────────────────────────────────────
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

  function clearErr(key: string) {
    setErrors(prev => ({ ...prev, [key]: '' }));
  }

  // ── Helper: show inline error ─────────────────────────────────────────────────
  const abort = (msg: string) => {
    console.error('[Checkout]', msg);
    setOrderError(msg);
    setLoading(false);
    setLoadingStep('');
  };

  // ── Cancel pending order in Supabase (best-effort) ────────────────────────────
  const cancelOrder = async (orderId: string) => {
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
      await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ status: 'cancelado' }),
      });
    } catch { /* best-effort */ }
  };

  // ── MercadoPago handler ───────────────────────────────────────────────────────
  const handleMPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setOrderError('');
    setLoadingStep('Creando tu pedido…');

    let createdOrderId: string | null = null;

    let orderRes: { success: boolean; orderId?: string; error?: string };
    try {
      orderRes = await createMPOrder({
        fullName, email, phone,
        address, city,
        state: stateField,
        postalCode,
        references,
      });
    } catch (err: any) {
      return abort(`Error inesperado al crear el pedido: ${err?.message ?? err}`);
    }

    if (!orderRes.success || !orderRes.orderId) {
      return abort(orderRes.error || 'No se pudo crear el pedido. Intenta nuevamente.');
    }
    createdOrderId = orderRes.orderId;

    setLoadingStep('Conectando con MercadoPago…');

    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
    let rawResponse: Response;
    try {
      rawResponse = await fetch(MP_EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.product.id,
            name:      item.product.name,
            price:     item.product.discountPrice ?? item.product.price,
            quantity:  item.quantity,
            imageUrl:  item.product.imageUrl,
            category:  item.product.category,
          })),
          buyer:   { name: fullName, email, phone },
          orderId: createdOrderId,
          siteUrl: window.location.origin,
        }),
      });
    } catch (netErr: any) {
      await cancelOrder(createdOrderId);
      return abort(
        `Error de red al conectar con MercadoPago: ${netErr?.message ?? 'sin detalles'}. ` +
        'Verifica que la Edge Function esté desplegada.'
      );
    }

    let mpData: any;
    try {
      mpData = await rawResponse.json();
    } catch {
      await cancelOrder(createdOrderId);
      return abort(
        `La función de pago devolvió una respuesta no válida (HTTP ${rawResponse.status}).`
      );
    }

    if (!rawResponse.ok || mpData?.error) {
      await cancelOrder(createdOrderId);
      return abort(mpData?.error || mpData?.message || `Error del servidor (HTTP ${rawResponse.status}).`);
    }

    const initPoint: string | undefined = mpData?.init_point;
    if (!initPoint || typeof initPoint !== 'string' || !initPoint.startsWith('http')) {
      await cancelOrder(createdOrderId);
      return abort(`MercadoPago no devolvió una URL de pago válida. Respuesta: ${JSON.stringify(mpData)}`);
    }

    setLoadingStep('Redirigiendo a MercadoPago…');
    setTimeout(() => { window.location.href = initPoint; }, 300);
  };

  // ── PayPal: createOrder callback (se ejecuta cuando el usuario hace clic en el botón PayPal) ──
  const handlePayPalCreate = async (_data: Record<string, unknown>, actions: any): Promise<string> => {
    if (!validate()) {
      // Lanzar un error detiene el flujo de PayPal y muestra el mensaje
      throw new Error('Por favor completa todos los campos requeridos antes de pagar con PayPal.');
    }

    setOrderError('');

    // Crear la orden en Supabase (pendiente_pago) antes de abrir la ventana de PayPal
    const orderRes = await createMPOrder({
      fullName, email, phone,
      address, city,
      state: stateField,
      postalCode,
      references,
    });

    if (!orderRes.success || !orderRes.orderId) {
      throw new Error(orderRes.error || 'No se pudo crear el pedido.');
    }

    paypalOrderIdRef.current = orderRes.orderId;

    // Crear la orden en PayPal con el monto en USD
    return actions.order.create({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: usdTotal.toFixed(2),
        },
        description: `Pedido Skinly — ${cartItemsCount} artículo(s)`,
      }],
      application_context: {
        brand_name: 'Skinly',
        shipping_preference: 'NO_SHIPPING',
      },
    });
  };

  // ── PayPal: onApprove callback (usuario aprobó el pago) ──────────────────────
  const handlePayPalApprove = async (_data: Record<string, unknown>, actions: any): Promise<void> => {
    try {
      const details = await actions.order.capture();
      const captureId = details.id as string;
      const supabaseOrderId = paypalOrderIdRef.current!;

      // Actualizar la orden en Supabase: pagado + método paypal
      await supabase.from('orders').update({
        status: 'pagado',
        payment_method: `paypal:${captureId}`,
      }).eq('id', supabaseOrderId);

      // Vaciar el carrito
      await clearCart();

      // Notificar a los admins del nuevo pedido pagado
      sendNotification({
        role: 'admin',
        title: 'Nuevo pedido pagado (PayPal)',
        body: `Pedido #${supabaseOrderId.slice(0, 8).toUpperCase()} confirmado vía PayPal (captura: ${captureId.slice(0, 12)}…).`,
        data: { orderId: supabaseOrderId, type: 'new_order' },
      });

      // Mostrar pantalla de éxito
      setPaypalSuccess({ orderId: supabaseOrderId, captureId });
    } catch (err: any) {
      setOrderError(`Error al confirmar el pago de PayPal: ${err?.message ?? 'intenta nuevamente.'}`);
    }
  };

  const handlePayPalError = (err: Record<string, unknown>) => {
    console.error('[PayPal error]', err);
    setOrderError('Ocurrió un error con PayPal. Por favor intenta nuevamente o usa MercadoPago.');
  };

  // ── Pantalla de éxito PayPal (renderizada inline, sin redireccionamiento) ────
  if (paypalSuccess) {
    const shortOrder = paypalSuccess.orderId.slice(0, 8).toUpperCase();
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-8">

        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full bg-brand-green-dark/10 animate-ping opacity-40" />
          <div className="relative w-24 h-24 rounded-full bg-brand-green-dark/10 border border-brand-green-dark/20 flex items-center justify-center">
            <CheckCircle2 size={44} className="text-brand-green-dark" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold text-brand-black">¡Pago Exitoso!</h1>
          <p className="text-sm text-brand-black/50 font-medium leading-relaxed max-w-sm mx-auto">
            Tu pago fue procesado correctamente por PayPal. Ya estamos preparando tu pedido.
          </p>
        </div>

        <div className="bg-brand-white border border-brand-black/5 rounded-luxury p-6 text-left space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#003087] pb-3 border-b border-brand-black/5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.217a.641.641 0 0 1 .633-.54h7.27c2.287 0 3.89.524 4.765 1.558.839.99.993 2.32.457 3.95l-.008.025c-.51 1.574-1.415 2.74-2.692 3.464-1.185.674-2.72 1.016-4.564 1.016H9.01a.641.641 0 0 0-.633.54l-.85 5.274-.004.017-.397 2.51a.642.642 0 0 1-.05.306z"/>
            </svg>
            <span className="text-[10px] font-extrabold uppercase tracking-widest">Pago Verificado por PayPal</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-brand-black/50">Número de Pedido</span>
            <span className="font-mono font-black text-brand-green-dark text-base">#{shortOrder}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-brand-black/50">ID de Captura PayPal</span>
            <span className="font-mono text-brand-black font-bold truncate max-w-[160px]">{paypalSuccess.captureId}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-brand-black/50">Estado</span>
            <span className="px-2.5 py-1 bg-brand-green-dark/10 text-brand-green-dark text-[10px] font-extrabold uppercase tracking-wide rounded-full border border-brand-green-dark/15">
              Aprobado
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-brand-black/50">Método</span>
            <span className="font-semibold text-[#003087]">PayPal</span>
          </div>
        </div>

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
  }

  // ── Checkout form ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8">

      {/* Back nav */}
      <div className="flex justify-between items-center pb-4 border-b border-brand-black/5">
        <button
          onClick={goBack}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-black/50 hover:text-brand-black cursor-pointer transition-colors disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Regresar a la Bolsa
        </button>
        <span className="text-[10px] uppercase font-bold tracking-widest text-brand-green-dark bg-brand-green-dark/10 px-3 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck size={12} />
          Pago Seguro
        </span>
      </div>

      <form
        onSubmit={paymentMethod === 'mercadopago' ? handleMPSubmit : (e) => e.preventDefault()}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >

        {/* ── Left: shipping + payment (2/3) ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6 text-left lg:order-first">

          {/* Shipping form */}
          <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 space-y-5">
            <h2 className="font-heading text-xl font-bold text-brand-black border-b border-brand-black/5 pb-3">
              Datos de Envío
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre Completo" required error={errors.fullName}>
                <input
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); clearErr('fullName'); }}
                  placeholder="Victoria Sinclair"
                  disabled={loading}
                  className={fieldCls(!!errors.fullName)}
                />
              </Field>
              <Field label="Correo Electrónico" required error={errors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearErr('email'); }}
                  placeholder="victoria@ejemplo.com"
                  disabled={loading}
                  className={fieldCls(!!errors.email)}
                />
              </Field>
            </div>

            <Field label="Teléfono" required error={errors.phone}>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); clearErr('phone'); }}
                placeholder="+52 555-0199"
                disabled={loading}
                className={fieldCls(!!errors.phone)}
              />
            </Field>

            <Field label="Dirección de Envío" required error={errors.address}>
              <input
                value={address}
                onChange={e => { setAddress(e.target.value); clearErr('address'); }}
                placeholder="Calle, número, colonia, delegación"
                disabled={loading}
                className={fieldCls(!!errors.address)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Ciudad" required error={errors.city}>
                <input
                  value={city}
                  onChange={e => { setCity(e.target.value); clearErr('city'); }}
                  placeholder="Ciudad de México"
                  disabled={loading}
                  className={fieldCls(!!errors.city)}
                />
              </Field>
              <Field label="Estado">
                <input
                  value={stateField}
                  onChange={e => setStateField(e.target.value)}
                  placeholder="CDMX"
                  disabled={loading}
                  className={fieldCls(false)}
                />
              </Field>
              <Field label="Código Postal" required error={errors.postalCode}>
                <input
                  value={postalCode}
                  onChange={e => { setPostalCode(e.target.value); clearErr('postalCode'); }}
                  placeholder="06600"
                  disabled={loading}
                  className={fieldCls(!!errors.postalCode)}
                />
              </Field>
            </div>

            <Field label="Referencias / Instrucciones de entrega">
              <textarea
                rows={2}
                value={references}
                onChange={e => setReferences(e.target.value)}
                placeholder="Código de acceso, edificio, referencias del domicilio..."
                disabled={loading}
                className={`${fieldCls(false)} resize-none`}
              />
            </Field>
          </div>

          {/* ── Payment method selector ──────────────────────────────────────── */}
          <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 space-y-5">
            <h2 className="font-heading text-xl font-bold text-brand-black border-b border-brand-black/5 pb-3">
              Método de Pago
            </h2>

            {/* Selector de método */}
            <div className="grid grid-cols-2 gap-3">
              {/* MercadoPago selector */}
              <button
                type="button"
                onClick={() => { setPaymentMethod('mercadopago'); setOrderError(''); }}
                className={`relative p-4 rounded-luxury border-2 text-left transition-all cursor-pointer ${
                  paymentMethod === 'mercadopago'
                    ? 'border-[#009EE3] bg-[#009EE3]/5'
                    : 'border-brand-black/10 hover:border-brand-black/20'
                }`}
              >
                {paymentMethod === 'mercadopago' && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#009EE3] flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </span>
                )}
                <img
                  src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png"
                  alt="MercadoPago"
                  className="h-5 object-contain mb-2"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="block text-[10px] font-bold text-brand-black/60 uppercase tracking-wide">
                  Tarjeta, OXXO, Transferencia
                </span>
              </button>

              {/* PayPal selector */}
              <button
                type="button"
                onClick={() => { setPaymentMethod('paypal'); setOrderError(''); }}
                className={`relative p-4 rounded-luxury border-2 text-left transition-all cursor-pointer ${
                  paymentMethod === 'paypal'
                    ? 'border-[#003087] bg-[#003087]/5'
                    : 'border-brand-black/10 hover:border-brand-black/20'
                }`}
              >
                {paymentMethod === 'paypal' && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#003087] flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </span>
                )}
                {/* Logo PayPal SVG */}
                <svg viewBox="0 0 100 24" className="h-5 w-auto mb-2" fill="none">
                  <text x="0" y="19" fontFamily="Arial" fontWeight="bold" fontSize="20" fill="#003087">Pay</text>
                  <text x="34" y="19" fontFamily="Arial" fontWeight="bold" fontSize="20" fill="#009cde">Pal</text>
                </svg>
                <span className="block text-[10px] font-bold text-brand-black/60 uppercase tracking-wide">
                  Cuenta PayPal o tarjeta
                </span>
              </button>
            </div>

            {/* ── Panel MercadoPago ──────────────────────────────────────────── */}
            {paymentMethod === 'mercadopago' && (
              <div className="border-2 border-[#009EE3] rounded-luxury overflow-hidden animate-fade-in">
                <div className="bg-[#009EE3] px-5 py-3 flex items-center justify-between">
                  <img
                    src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png"
                    alt="MercadoPago"
                    className="h-6 object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/30">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                    </svg>
                    100% Seguro
                  </span>
                </div>
                <div className="p-5 space-y-4 bg-[#009EE3]/3">
                  <p className="text-sm font-bold text-brand-black">Paga de forma segura con MercadoPago</p>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-black/40">Métodos aceptados</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="h-7 px-2.5 bg-white border border-brand-black/8 rounded-md flex items-center justify-center shadow-sm">
                        <svg viewBox="0 0 60 20" className="h-3.5 w-auto" fill="none">
                          <text x="0" y="16" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="#1A1F71">VISA</text>
                        </svg>
                      </div>
                      <div className="h-7 px-2 bg-white border border-brand-black/8 rounded-md flex items-center gap-1 shadow-sm">
                        <div className="w-4 h-4 rounded-full bg-[#EB001B]" />
                        <div className="w-4 h-4 rounded-full bg-[#F79E1B] -ml-2" />
                      </div>
                      <div className="h-7 px-2.5 bg-white border border-brand-black/8 rounded-md flex items-center shadow-sm">
                        <span className="text-[11px] font-extrabold text-[#EE3224] tracking-tight">OXXO</span>
                      </div>
                      <div className="h-7 px-2.5 bg-white border border-brand-black/8 rounded-md flex items-center gap-1.5 shadow-sm">
                        <CreditCard size={12} className="text-brand-black/50" />
                        <span className="text-[10px] font-bold text-brand-black/60">Transferencia</span>
                      </div>
                      <span className="text-[10px] font-semibold text-brand-black/40">y más…</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-brand-black/50 font-medium leading-relaxed">
                    Al confirmar tu pedido serás redirigido al portal seguro de MercadoPago para completar el pago.
                  </p>
                </div>
              </div>
            )}

            {/* ── Panel PayPal ───────────────────────────────────────────────── */}
            {paymentMethod === 'paypal' && (
              <div className="border-2 border-[#003087] rounded-luxury overflow-hidden animate-fade-in">
                <div className="bg-[#003087] px-5 py-3 flex items-center justify-between">
                  <svg viewBox="0 0 120 28" className="h-6 w-auto" fill="none">
                    <text x="0" y="22" fontFamily="Arial" fontWeight="bold" fontSize="22" fill="white">Pay</text>
                    <text x="40" y="22" fontFamily="Arial" fontWeight="bold" fontSize="22" fill="#009cde">Pal</text>
                  </svg>
                  <span className="inline-flex items-center gap-1 bg-white/15 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/25">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                    </svg>
                    Encriptado
                  </span>
                </div>
                <div className="p-5 space-y-4 bg-[#003087]/3">
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-luxury">
                    <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">
                      <strong>Precio en USD:</strong> Pagarás aproximadamente{' '}
                      <strong className="text-amber-900">${usdTotal.toFixed(2)} USD</strong>{' '}
                      (equivalente a ${total.toFixed(2)} MXN a ~$17.50 por dólar).
                    </p>
                  </div>
                  <p className="text-[10px] text-brand-black/50 font-medium leading-relaxed">
                    Se abrirá la ventana de PayPal para completar el pago de forma segura. Puedes usar tu cuenta PayPal o tarjeta de crédito/débito.
                  </p>
                  {/* Botones de PayPal */}
                  <PayPalSection
                    createOrder={handlePayPalCreate}
                    onApprove={handlePayPalApprove}
                    onError={handlePayPalError}
                  />
                </div>
              </div>
            )}

            {/* SSL trust line */}
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-brand-black/40 font-semibold">
              <svg className="w-3 h-3 text-brand-green-dark shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              Tu información está protegida con encriptación SSL de 256 bits
            </p>

            {/* Error display */}
            {orderError && (
              <div className="flex gap-3 items-start bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-luxury">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{orderError}</span>
              </div>
            )}
          </div>

        </div>

        {/* ── Right: order summary (1/3) ──────────────────────────────────────── */}
        <div className="space-y-6 lg:order-last">
          <div className="bg-brand-white p-5 sm:p-6 rounded-luxury border border-brand-black/5 shadow-sm text-left space-y-5 lg:sticky lg:top-4">
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
                        src={item.product.imageUrl || '/images/product-1.png'}
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
                <span>${total.toFixed(2)} MXN</span>
              </div>
              {paymentMethod === 'paypal' && (
                <div className="flex justify-between font-bold text-[#003087] text-xs bg-[#003087]/5 px-3 py-2 rounded-luxury border border-[#003087]/15">
                  <span>≈ USD (PayPal)</span>
                  <span>${usdTotal.toFixed(2)} USD</span>
                </div>
              )}
            </div>

            {/* Submit button — solo visible para MercadoPago */}
            {paymentMethod === 'mercadopago' && (
              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="w-full py-4 bg-[#009EE3] hover:bg-[#007cc4] text-white text-sm font-bold rounded-luxury flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2 shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>{loadingStep || 'Procesando…'}</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={15} />
                    Pagar con MercadoPago
                  </>
                )}
              </button>
            )}

            {/* Indicador para PayPal */}
            {paymentMethod === 'paypal' && (
              <div className="w-full py-3 bg-[#003087]/8 border border-[#003087]/15 text-[#003087] text-xs font-bold rounded-luxury flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                Usa el botón PayPal en el panel izquierdo
              </div>
            )}

            <p className="text-[9px] text-brand-black/35 text-center font-medium">
              🔒 Tu información está cifrada y protegida.
            </p>
          </div>
        </div>

      </form>
    </div>
  );
};

// ─── Componente auxiliar para PayPal (necesita el hook dentro del Provider) ────
const PayPalSection: React.FC<{
  createOrder: (data: Record<string, unknown>, actions: any) => Promise<string>;
  onApprove: (data: Record<string, unknown>, actions: any) => Promise<void>;
  onError: (err: Record<string, unknown>) => void;
}> = ({ createOrder, onApprove, onError }) => {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-xs text-brand-black/50 font-semibold">
        <Loader2 size={14} className="animate-spin" />
        Cargando PayPal…
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="text-xs text-red-600 font-semibold text-center py-3">
        No se pudo cargar PayPal. Verifica tu conexión o usa MercadoPago.
      </div>
    );
  }

  return (
    <PayPalButtons
      style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', height: 44 }}
      createOrder={createOrder}
      onApprove={onApprove}
      onError={onError}
      onCancel={() => console.log('[PayPal] Pago cancelado por el usuario.')}
      forceReRender={[]}
    />
  );
};

// ─── Micro-components ─────────────────────────────────────────────────────────
const fieldCls = (hasError: boolean) =>
  `w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/30 disabled:opacity-60 ${
    hasError ? 'border-red-400 focus:border-red-500' : 'border-brand-black/10 focus:border-brand-green-dark'
  }`;

const Field: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}> = ({ label, required, error, children }) => (
  <div className="space-y-1">
    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 font-semibold">{error}</p>}
  </div>
);
