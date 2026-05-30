import React, { useState } from 'react';
import { useApp, FREE_SHIPPING_THRESHOLD } from '../../context/AppContext';
import { Button } from '../../components/UI';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { ShoppingBag, Trash2, ArrowRight, Ticket, X, Truck } from 'lucide-react';

export const Cart: React.FC = () => {
  const { 
    cart, updateCartQuantity, removeFromCart, getCartTotals, 
    appliedCoupon, applyCouponCode, removeCoupon, setView 
  } = useApp();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);

  const { subtotal, discount, shipping, total } = getCartTotals();
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    
    setCouponError('');
    setCouponSuccess(false);

    const result = applyCouponCode(couponCode);
    if (result.success) {
      setCouponSuccess(true);
      setCouponCode('');
      setTimeout(() => setCouponSuccess(false), 3000);
    } else {
      setCouponError(result.error || 'Código inválido');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-brand-green-dark/10 flex items-center justify-center mx-auto text-brand-green-dark">
          <ShoppingBag size={28} className="stroke-1" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-brand-black">Tu Bolsa está Vacía</h2>
          <p className="text-xs text-brand-black/50 font-medium leading-relaxed max-w-xs mx-auto">
            Descubre fórmulas de skincare premium y certificadas. Agrega serums de lujo y complejos botánicos para comenzar.
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setView('categories')}
          className="px-8 py-3"
        >
          Explorar Catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8">
      
      {/* Título de la página */}
      <div className="text-left">
        <h1 className="font-heading text-3xl font-bold text-brand-black">Tu Bolsa de Compras</h1>
        <p className="text-xs text-brand-black/40 font-medium">Revisa tus artículos orgánicos antes de pagar.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lista de artículos (2/3 de ancho) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Barra de progreso de envío gratis */}
          {(() => {
            const remains = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
            const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
            return remains > 0 ? (
              <div className="bg-brand-white border border-brand-black/5 rounded-luxury p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-brand-black/70">
                    <Truck size={13} className="text-brand-green-dark" />
                    <span>Te faltan <strong className="text-brand-black">${remains.toFixed(2)}</strong> para envío gratis</span>
                  </div>
                  <span className="text-[10px] font-bold text-brand-black/40">${FREE_SHIPPING_THRESHOLD} mínimo</span>
                </div>
                <div className="w-full h-1.5 bg-brand-gray-soft rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-green-dark rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-brand-green-dark/8 border border-brand-green-dark/20 rounded-luxury p-3.5 flex items-center gap-2.5 text-xs font-bold text-brand-green-dark">
                <Truck size={14} />
                🎉 ¡Tienes envío gratis en este pedido!
              </div>
            );
          })()}

          {/* Lista de artículos en el carrito */}
          <div className="bg-brand-white border border-brand-black/5 rounded-luxury divide-y divide-brand-black/5">
            {cart.map((item) => {
              const price = item.product.discountPrice || item.product.price;
              return (
                <div key={item.product.id} className="p-4 sm:p-6 flex gap-4 sm:gap-6 text-left relative">
                  
                  {/* Imagen */}
                  <div className="w-20 sm:w-24 aspect-[4/5] rounded-luxury overflow-hidden border border-brand-black/5 bg-brand-gray-soft shrink-0">
                    <ImageWithFallback 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                    />
                  </div>

                  {/* Detalles */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Título y categoría */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-heading text-sm sm:text-base font-bold text-brand-black hover:text-brand-green-dark transition-colors cursor-pointer" onClick={() => setView('product-details', item.product.id)}>
                            {item.product.name}
                          </h3>
                          <span className="text-[10px] uppercase font-bold text-brand-black/30 tracking-wider">
                            {item.product.category}
                          </span>
                        </div>

                        {/* Botón de eliminar */}
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-2 -mr-1 text-brand-black/30 hover:text-red-500 transition-colors cursor-pointer active:scale-90"
                          title="Eliminar artículo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Selector de cantidad y costo */}
                    <div className="flex justify-between items-center mt-4">
                      {/* Selector — botones táctiles grandes */}
                      <div className="flex items-center border border-brand-black/10 rounded-luxury bg-brand-white overflow-hidden">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-9 h-9 flex items-center justify-center text-sm font-bold text-brand-black/50 hover:bg-brand-gray-soft active:bg-brand-gray-soft cursor-pointer transition-colors"
                        >
                          −
                        </button>
                        <span className="px-3 text-xs font-bold text-brand-black min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-9 h-9 flex items-center justify-center text-sm font-bold text-brand-black/50 hover:bg-brand-gray-soft active:bg-brand-gray-soft cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Costo */}
                      <span className="text-sm font-bold text-brand-black">
                        ${(price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Resumen y cupones (1/3 de ancho) */}
        <div className="space-y-6">
          
          {/* Resumen del pedido */}
          <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm text-left space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5">
              Resumen del Pedido
            </h3>

            {/* Desglose de cálculos */}
            <div className="space-y-2.5 text-xs text-brand-black/75">
              <div className="flex justify-between font-semibold">
                <span>Subtotal de la Bolsa ({cartItemsCount} artículos)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between font-bold text-brand-green-dark">
                  <div className="flex items-center gap-1">
                    <Ticket size={12} />
                    <span>Cupón ({appliedCoupon.code} -{appliedCoupon.discountPercentage}%)</span>
                  </div>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-semibold">
                <span>Envío</span>
                <span>{shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}</span>
              </div>

              <div className="border-t border-brand-black/5 pt-3 flex justify-between font-bold text-base text-brand-black">
                <span>Total General</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* CTA de pago */}
            <Button
              variant="primary"
              fullWidth
              onClick={() => setView('checkout')}
              className="py-3.5 mt-4 gap-2"
            >
              Pago Seguro
              <ArrowRight size={14} />
            </Button>
          </div>

          {/* Área de cupones */}
          <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm text-left space-y-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-brand-black/5">
              <Ticket size={14} className="text-brand-green-dark animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black">
                Cupón Promocional y de Afiliado
              </h3>
            </div>

            {appliedCoupon ? (
              <div className="p-3 bg-brand-green-dark/5 border border-brand-green-dark/15 rounded-luxury text-xs text-left flex justify-between items-center font-semibold">
                <div>
                  <span className="block text-brand-green-dark font-extrabold">{appliedCoupon.code} ¡Activado!</span>
                  <span className="block text-[10px] text-brand-black/50 mt-0.5">Descuento de -{appliedCoupon.discountPercentage}% aplicado a este pedido.</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="p-1 text-brand-black/40 hover:text-red-500 transition-colors cursor-pointer"
                  title="Eliminar cupón"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ingresa código (ej. LUPITA10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 bg-brand-gray-soft px-3 py-2 text-xs border border-brand-black/5 rounded-luxury focus:outline-none focus:border-brand-green-dark uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-black hover:bg-brand-green-dark text-brand-white text-xs font-bold rounded-luxury cursor-pointer transition-colors"
                  >
                    Aplicar
                  </button>
                </div>

                {couponError && (
                  <span className="block text-[10px] text-red-500 font-semibold">{couponError}</span>
                )}

                {couponSuccess && (
                  <span className="block text-[10px] text-brand-green-dark font-bold">🎉 ¡Cupón aplicado exitosamente!</span>
                )}

                <p className="text-[10px] text-brand-black/40 leading-relaxed font-semibold pt-1">
                  💡 ¿Tienes un código de embajador o promoción? Ingrésalo aquí para aplicar tu descuento.
                </p>
              </form>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
