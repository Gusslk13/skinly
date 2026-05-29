import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck, ChevronLeft, CreditCard,
  Package, Home, AlertCircle, Loader2
} from 'lucide-react';

// ─── Direct Edge Function URL (bypasses supabase.functions.invoke to avoid
//     response-parsing ambiguity when the function isn't deployed yet) ─────────
const MP_EDGE_URL =
  'https://bavarmytvyntpohimkqt.supabase.co/functions/v1/create-mp-preference';

// ─── Main checkout page ───────────────────────────────────────────────────────
export const Checkout: React.FC = () => {
  const {
    cart, getCartTotals, appliedCoupon,
    createMPOrder, goBack, setView, currentUser,
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
  const [loading,     setLoading]     = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [orderError,  setOrderError]  = useState('');

  const { subtotal, discount, shipping, total } = getCartTotals();
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

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

  // ── Helper: show inline error and re-enable the button ──────────────────────
  const abort = (msg: string) => {
    console.error('[Checkout MP]', msg);
    setOrderError(msg);
    setLoading(false);
    setLoadingStep('');
  };

  // ── Submit handler — MercadoPago Checkout Pro ────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setOrderError('');
    setLoadingStep('Creando tu pedido…');

    // Track the created orderId so we can cancel it on any failure
    let createdOrderId: string | null = null;

    // ── Step 1: persist order as 'pendiente_pago' ──────────────────────────────
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

    // ── Step 2: call Edge Function to get MP init_point ────────────────────────
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
      // Network-level failure (CORS, DNS, offline, etc.)
      await cancelOrder(createdOrderId, anonKey);
      return abort(
        `Error de red al conectar con MercadoPago: ${netErr?.message ?? 'sin detalles'}. ` +
        'Verifica que la Edge Function esté desplegada y CORS esté habilitado.'
      );
    }

    // ── Step 3: parse JSON response ────────────────────────────────────────────
    let mpData: any;
    try {
      mpData = await rawResponse.json();
    } catch {
      await cancelOrder(createdOrderId, anonKey);
      return abort(
        `La función de pago devolvió una respuesta no válida (HTTP ${rawResponse.status}). ` +
        'Es posible que la Edge Function no esté desplegada aún.'
      );
    }

    // ── Step 4: check for API-level errors ─────────────────────────────────────
    if (!rawResponse.ok || mpData?.error) {
      await cancelOrder(createdOrderId, anonKey);
      return abort(
        mpData?.error ||
        mpData?.message ||
        `Error del servidor de pagos (HTTP ${rawResponse.status}).`
      );
    }

    const initPoint: string | undefined = mpData?.init_point;
    if (!initPoint || typeof initPoint !== 'string' || !initPoint.startsWith('http')) {
      await cancelOrder(createdOrderId, anonKey);
      return abort(
        'MercadoPago no devolvió una URL de pago válida. ' +
        `Respuesta recibida: ${JSON.stringify(mpData)}`
      );
    }

    // ── Step 5: redirect (do NOT call setLoading after this point) ─────────────
    setLoadingStep('Redirigiendo a MercadoPago…');
    // Small delay so the user sees the step message before the page navigates
    setTimeout(() => { window.location.href = initPoint; }, 300);
  };

  // ─── Cancel the pending order in Supabase if the MP flow fails ─────────────
  // Uses fetch directly so it doesn't depend on the Supabase client state.
  const cancelOrder = async (orderId: string, anonKey: string) => {
    try {
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
    } catch {
      // best-effort — not critical
    }
  };

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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: shipping + payment (2/3) ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6 text-left lg:order-first">

          {/* Shipping form */}
          <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 space-y-5">
            <h2 className="font-heading text-xl font-bold text-brand-black border-b border-brand-black/5 pb-3">
              Datos de Envío
            </h2>

            {/* Name + Email */}
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

            {/* Phone */}
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

            {/* Address */}
            <Field label="Dirección de Envío" required error={errors.address}>
              <input
                value={address}
                onChange={e => { setAddress(e.target.value); clearErr('address'); }}
                placeholder="Calle, número, colonia, delegación"
                disabled={loading}
                className={fieldCls(!!errors.address)}
              />
            </Field>

            {/* City + State + Postal */}
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

            {/* References */}
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

          {/* Payment method */}
          <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 space-y-4">
            <h2 className="font-heading text-xl font-bold text-brand-black border-b border-brand-black/5 pb-3">
              Método de Pago
            </h2>

            {/* MercadoPago badge */}
            <div className="flex items-center gap-4 p-4 border border-[#009EE3]/20 bg-[#009EE3]/5 rounded-luxury">
              <div className="w-10 h-10 bg-[#009EE3] rounded-xl flex items-center justify-center shrink-0">
                <CreditCard size={18} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-brand-black">MercadoPago Checkout Pro</p>
                <p className="text-[11px] text-brand-black/50 leading-relaxed font-medium">
                  Tarjeta de crédito / débito, OXXO, transferencia y más. Procesado de forma segura.
                </p>
              </div>
              <span className="ml-auto shrink-0 w-4 h-4 rounded-full border-2 border-[#009EE3] flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#009EE3]" />
              </span>
            </div>

            <p className="text-[10px] text-brand-black/40 font-medium leading-relaxed">
              🔒 Al confirmar, serás redirigido al portal seguro de MercadoPago para completar el pago.
            </p>

            {/* Inline error display */}
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
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit button */}
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

            <p className="text-[9px] text-brand-black/35 text-center font-medium">
              🔒 Tu información está cifrada y protegida por MercadoPago.
            </p>
          </div>
        </div>

      </form>
    </div>
  );

  // ── Small helpers (defined inside component to access state) ─────────────────
  function clearErr(key: string) {
    setErrors(prev => ({ ...prev, [key]: '' }));
  }
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
