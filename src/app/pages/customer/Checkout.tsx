import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button, Input, Select, TextArea } from '../../components/UI';
import { ShieldCheck, ArrowRight, ChevronLeft, CreditCard, Landmark, Truck } from 'lucide-react';

export const Checkout: React.FC = () => {
  const { cart, getCartTotals, appliedCoupon, placeOrder, goBack, currentUser } = useApp();
  
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [postalCode, setPostalCode] = useState(currentUser?.postalCode || '');
  const [references, setReferences] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer' | 'delivery_cash'>('credit_card');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { subtotal, discount, shipping, total } = getCartTotals();
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  const validate = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!fullName.trim()) tempErrors.fullName = 'El nombre completo es requerido.';
    if (!phone.trim()) tempErrors.phone = 'El número de teléfono es requerido.';
    if (!address.trim()) tempErrors.address = 'La dirección de envío es requerida.';
    if (!city.trim()) tempErrors.city = 'La ciudad es requerida.';
    if (!postalCode.trim()) tempErrors.postalCode = 'El código postal es requerido.';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await placeOrder({
        fullName,
        phone,
        address,
        city,
        postalCode,
        references,
        paymentMethod
      });

      if (!res.success) {
        alert(res.error || 'Error al realizar el pedido.');
      }
    } catch (err) {
      alert('Ocurrió un error durante el proceso de pago.');
    } finally {
      setLoading(false);
    }
  };

  const paymentOptions = [
    { value: 'credit_card', label: 'Tarjeta de Crédito o Débito' },
    { value: 'bank_transfer', label: 'Transferencia Bancaria' },
    { value: 'delivery_cash', label: 'Pago en Efectivo al Recibir' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8">
      
      {/* Navegación hacia atrás */}
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
          Pago Cifrado SSL
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columnas izquierdas (2/3) - Formulario de envío */}
        <div className="lg:col-span-2 space-y-6 text-left">
          
          <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 space-y-6">
            <h2 className="font-heading text-xl font-bold text-brand-black border-b border-brand-black/5 pb-3">
              Datos de Envío e Identidad
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre Completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                placeholder="Victoria Sinclair"
                required
              />
              <Input
                label="Número de Teléfono"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                placeholder="+52 555-0199"
                required
              />
            </div>

            <Input
              label="Dirección de Envío"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={errors.address}
              placeholder="Apt, suite, colonia o calle"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Ciudad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                error={errors.city}
                placeholder="Ciudad de México"
                required
              />
              <Input
                label="Código Postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                error={errors.postalCode}
                placeholder="06600"
                required
              />
            </div>

            <TextArea
              label="Referencias de Entrega / Instrucciones"
              value={references}
              onChange={(e) => setReferences(e.target.value)}
              placeholder="Códigos de acceso, puntos de entrega o instrucciones específicas para el mensajero..."
            />
          </div>

          {/* Selector de método de pago */}
          <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 space-y-6">
            <h2 className="font-heading text-xl font-bold text-brand-black border-b border-brand-black/5 pb-3">
              Método de Pago Seguro
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'credit_card' as const, label: 'Tarjeta de Crédito', icon: CreditCard, desc: 'Visa, Master, Amex' },
                { id: 'bank_transfer' as const, label: 'Transferencia', icon: Landmark, desc: 'Transferencia bancaria' },
                { id: 'delivery_cash' as const, label: 'Efectivo', icon: Truck, desc: 'Pago al recibir' }
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-luxury border text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-brand-green-dark bg-brand-green-dark/5 text-brand-green-dark' 
                        : 'border-brand-black/5 text-brand-black hover:border-brand-black/15 bg-brand-white'
                    }`}
                  >
                    <Icon size={20} className={isSelected ? 'text-brand-green-dark' : 'text-brand-black/60'} />
                    <div>
                      <span className="block text-xs font-bold">{method.label}</span>
                      <span className="block text-[10px] opacity-60 mt-0.5">{method.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Columna derecha (1/3) - Resumen del pedido */}
        <div className="space-y-6">
          
          <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm text-left space-y-5">
            <h2 className="font-heading text-lg font-bold text-brand-black border-b border-brand-black/5 pb-3">
              Resumen del Pedido
            </h2>

            {/* Desglose de productos */}
            <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
              {cart.map((item) => {
                const price = item.product.discountPrice || item.product.price;
                return (
                  <div key={item.product.id} className="flex gap-3 text-xs items-center justify-between font-semibold">
                    <div className="flex items-center gap-2.5 truncate">
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        className="w-8 h-10 object-cover rounded-md border border-brand-black/5 shrink-0 bg-brand-gray-soft"
                      />
                      <div className="truncate">
                        <span className="block truncate text-brand-black">{item.product.name}</span>
                        <span className="block text-[10px] text-brand-black/40">Cant: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="text-brand-black">${(price * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Desglose de costos */}
            <div className="border-t border-brand-black/5 pt-4 space-y-2.5 text-xs text-brand-black/75">
              <div className="flex justify-between font-semibold">
                <span>Subtotal ({cartItemsCount} artículos)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between font-bold text-brand-green-dark">
                  <span>Descuento ({appliedCoupon.code} -{appliedCoupon.discountPercentage}%)</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-semibold">
                <span>Envío de Lujo</span>
                <span>{shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}</span>
              </div>

              <div className="border-t border-brand-black/5 pt-3.5 flex justify-between font-bold text-base text-brand-black">
                <span>Total a Pagar</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="secondary"
              fullWidth
              disabled={loading}
              className="py-4 gap-2 text-sm mt-3"
            >
              {loading ? 'Procesando Pedido...' : 'Realizar Pedido Seguro'}
              <ArrowRight size={14} />
            </Button>

            <span className="block text-[9px] text-brand-black/40 leading-relaxed text-center font-medium pt-2">
              🔒 Al hacer clic, autorizas el cifrado y validación de esta compra. Se enviarán alertas del mensajero a tu teléfono.
            </span>
          </div>

        </div>

      </form>

    </div>
  );
};
