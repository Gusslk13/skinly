import React from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/UI';
import { Calendar, Package, ArrowRight, Truck, CheckCircle2, RefreshCw } from 'lucide-react';

export const OrderHistory: React.FC = () => {
  const { orders, currentUser, setView } = useApp();

  const customerOrders = orders.filter(o => o.customerId === currentUser?.id);

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200/50',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200/50',
      delivered: 'bg-brand-green-dark/15 text-brand-green-dark border-brand-green-dark/20',
      refunded: 'bg-red-100 text-red-800 border-red-200/50'
    };
    return classes[status as keyof typeof classes] || 'bg-brand-gray-soft text-brand-black';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      shipped: 'Enviado',
      delivered: 'Entregado',
      refunded: 'Reembolsado'
    };
    return labels[status] || status;
  };

  const getPaymentLabel = (method: string) => {
    const labels = {
      credit_card: 'Tarjeta de Crédito',
      bank_transfer: 'Transferencia Bancaria',
      delivery_cash: 'Efectivo al Recibir'
    };
    return labels[method as keyof typeof labels] || method;
  };

  if (customerOrders.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-brand-gray-soft flex items-center justify-center mx-auto text-brand-black/40 border border-brand-black/5">
          <Package size={28} className="stroke-1" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-brand-black">Sin Pedidos Aún</h2>
          <p className="text-xs text-brand-black/50 font-medium leading-relaxed max-w-xs mx-auto">
            Todavía no has realizado ningún pedido. Ordena complejos orgánicos clínicos para comenzar tu rutina Skinly.
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setView('categories')}
          className="px-8 py-3"
        >
          Comenzar a Comprar
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 space-y-8 text-left">
      
      {/* Encabezado */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-black">Historial de Pedidos</h1>
        <p className="text-xs text-brand-black/40 font-medium">Monitorea envíos activos y revisa tus pedidos botánicos anteriores.</p>
      </div>

      {/* Lista de pedidos */}
      <div className="space-y-6">
        {customerOrders.map((order) => {
          const date = new Date(order.createdAt).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          return (
            <div key={order.id} className="bg-brand-white rounded-luxury border border-brand-black/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              
              {/* Barra superior de metadatos del pedido */}
              <div className="bg-brand-gray-soft px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-brand-black/5 text-xs">
                <div className="flex gap-6">
                  <div>
                    <span className="block text-[10px] font-bold text-brand-black/40 uppercase tracking-wider">Fecha del Pedido</span>
                    <span className="font-bold text-brand-black/80 flex items-center gap-1.5 mt-0.5">
                      <Calendar size={13} className="text-brand-black/40" />
                      {date}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-brand-black/40 uppercase tracking-wider">ID del Pedido</span>
                    <span className="font-mono font-bold text-brand-green-dark mt-0.5 block">
                      {order.id.toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="block text-[10px] font-bold text-brand-black/40 uppercase tracking-wider">Método de Pago</span>
                    <span className="font-semibold text-brand-black/80 mt-0.5 block">
                      {getPaymentLabel(order.paymentMethod)}
                    </span>
                  </div>
                </div>
                
                {/* Etiqueta de estado */}
                <span className={`px-3 py-1 border text-[10px] font-extrabold uppercase tracking-wider rounded-full ${getStatusBadgeClass(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* Artículos del pedido y detalles de envío */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Lista resumen de productos */}
                <div className="md:col-span-2 space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-12 h-15 object-cover rounded-luxury border border-brand-black/5 shrink-0 bg-brand-gray-soft"
                      />
                      <div className="text-left truncate">
                        <span className="block text-sm font-bold text-brand-black hover:text-brand-green-dark transition-colors cursor-pointer truncate" onClick={() => setView('product-details', item.productId)}>
                          {item.name}
                        </span>
                        <span className="text-[10px] font-semibold text-brand-black/40">
                          Cant: {item.quantity} × ${item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detalles de entrega y totales */}
                <div className="bg-brand-gray-soft/50 p-4 rounded-luxury border border-brand-black/5 space-y-3.5 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold text-brand-black/40 uppercase tracking-wider">Enviar A</span>
                    <span className="font-bold text-brand-black/80 block mt-0.5">{order.shippingAddress?.name}</span>
                    <span className="text-brand-black/50 block truncate mt-0.5">{order.shippingAddress?.address}, {order.shippingAddress?.city}</span>
                  </div>

                  <div className="border-t border-brand-black/5 pt-2.5 space-y-1 text-brand-black/75">
                    <div className="flex justify-between font-extrabold text-sm text-brand-black pt-1.5 border-t border-brand-black/5">
                      <span>Total Pagado</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Rastreador de estado de entrega */}
              {order.status !== 'refunded' && (
                <div className="px-6 py-4 bg-brand-green-dark/5 border-t border-brand-black/5 text-xs">
                  <span className="block text-[10px] font-bold text-brand-green-dark uppercase tracking-wider mb-3">
                    Estado del Mensajero
                  </span>
                  
                  <div className="flex justify-between items-center max-w-lg relative">
                    {/* Línea de fondo */}
                    <div className="absolute inset-x-0 top-3.5 h-[2px] bg-brand-black/10 -z-10" />
                    
                    {/* Línea de progreso activa */}
                    <div className={`absolute left-0 top-3.5 h-[2px] bg-brand-green-dark -z-10 transition-all duration-1000 ${
                      order.status === 'pending' ? 'w-1/6' : order.status === 'shipped' ? 'w-1/2' : 'w-full'
                    }`} />

                    {[
                      { step: 'placed', label: 'Pedido Realizado', icon: CheckCircle2, active: true },
                      { step: 'preparing', label: 'En Preparación', icon: RefreshCw, active: true },
                      { step: 'shipped', label: 'En Camino', icon: Truck, active: order.status === 'shipped' || order.status === 'delivered' },
                      { step: 'delivered', label: 'Entregado', icon: CheckCircle2, active: order.status === 'delivered' }
                    ].map((step, idx) => {
                      const StepIcon = step.icon;
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center border-2 transition-all ${
                            step.active 
                              ? 'bg-brand-white border-brand-green-dark text-brand-green-dark shadow-sm' 
                              : 'bg-brand-white border-brand-black/10 text-brand-black/20'
                          }`}>
                            <StepIcon size={12} className={step.step === 'preparing' && order.status === 'pending' ? 'animate-spin' : ''} />
                          </div>
                          <span className={`text-[9px] font-bold mt-1.5 ${step.active ? 'text-brand-black/80' : 'text-brand-black/30'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
