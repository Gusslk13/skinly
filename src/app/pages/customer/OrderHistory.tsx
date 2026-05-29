import React from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/UI';
import {
  Calendar, Package, Truck, CheckCircle2, RefreshCw,
  Clock, CreditCard, XCircle, RotateCcw
} from 'lucide-react';

// ── Status pipeline (canonical order) ────────────────────────────────────────
type OrderStep = {
  key: string[];           // DB values that map to this step
  label: string;
  icon: React.ElementType;
};

const ORDER_STEPS: OrderStep[] = [
  { key: ['pendiente_pago', 'pending'],          label: 'Pendiente de Pago', icon: Clock        },
  { key: ['pagado', 'paid'],                     label: 'Confirmado',        icon: CreditCard   },
  { key: ['en_preparacion', 'preparing'],        label: 'En Preparación',    icon: RefreshCw    },
  { key: ['enviado', 'shipped'],                 label: 'Enviado',           icon: Truck        },
  { key: ['entregado', 'delivered'],             label: 'Entregado',         icon: CheckCircle2 },
];

const getStepIndex = (status: string): number => {
  const idx = ORDER_STEPS.findIndex(s => s.key.includes(status));
  return idx === -1 ? 0 : idx;
};

const STATUS_BADGE: Record<string, string> = {
  pendiente_pago: 'bg-amber-100 text-amber-800 border-amber-200/50',
  pending:        'bg-amber-100 text-amber-800 border-amber-200/50',
  pagado:         'bg-blue-100 text-blue-800 border-blue-200/50',
  paid:           'bg-blue-100 text-blue-800 border-blue-200/50',
  en_preparacion: 'bg-purple-100 text-purple-800 border-purple-200/50',
  preparing:      'bg-purple-100 text-purple-800 border-purple-200/50',
  enviado:        'bg-indigo-100 text-indigo-800 border-indigo-200/50',
  shipped:        'bg-indigo-100 text-indigo-800 border-indigo-200/50',
  entregado:      'bg-brand-green-dark/15 text-brand-green-dark border-brand-green-dark/20',
  delivered:      'bg-brand-green-dark/15 text-brand-green-dark border-brand-green-dark/20',
  cancelado:      'bg-red-100 text-red-800 border-red-200/50',
  cancelled:      'bg-red-100 text-red-800 border-red-200/50',
  reembolsado:    'bg-rose-100 text-rose-800 border-rose-200/50',
  refunded:       'bg-rose-100 text-rose-800 border-rose-200/50',
};

const STATUS_LABEL: Record<string, string> = {
  pendiente_pago: 'Pendiente de Pago',
  pending:        'Pendiente',
  pagado:         'Pago Confirmado',
  paid:           'Pago Confirmado',
  en_preparacion: 'En Preparación',
  preparing:      'En Preparación',
  enviado:        'Enviado',
  shipped:        'Enviado',
  entregado:      'Entregado',
  delivered:      'Entregado',
  cancelado:      'Cancelado',
  cancelled:      'Cancelado',
  reembolsado:    'Reembolsado',
  refunded:       'Reembolsado',
};

// 10 business days from a given date
const addBusinessDays = (start: Date, days: number): Date => {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
};

const getPaymentLabel = (method: string): string => {
  if (method.startsWith('mercadopago')) return 'MercadoPago';
  const labels: Record<string, string> = {
    credit_card:    'Tarjeta de Crédito',
    bank_transfer:  'Transferencia Bancaria',
    delivery_cash:  'Efectivo al Recibir',
    'por acordar':  'Por Acordar',
  };
  return labels[method] || method;
};

const isCancelled = (status: string) => ['cancelado', 'cancelled', 'reembolsado', 'refunded'].includes(status);

export const OrderHistory: React.FC = () => {
  const { orders, currentUser, setView } = useApp();

  const customerOrders = orders.filter(o => o.customerId === currentUser?.id);

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
        <Button variant="primary" onClick={() => setView('categories')} className="px-8 py-3">
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
        <p className="text-xs text-brand-black/40 font-medium">
          Monitorea envíos activos y revisa tus pedidos botánicos anteriores. Los cambios de estado se actualizan en tiempo real.
        </p>
      </div>

      {/* Lista de pedidos */}
      <div className="space-y-6">
        {customerOrders.map((order) => {
          const createdDate = new Date(order.createdAt);
          const dateLabel = createdDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

          // Estimated delivery: 7–10 business days from order creation
          const estDelivery7 = addBusinessDays(createdDate, 7);
          const estDelivery10 = addBusinessDays(createdDate, 10);
          const estLabel = `${estDelivery7.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – ${estDelivery10.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`;

          const cancelled = isCancelled(order.status);
          const stepIndex = getStepIndex(order.status);
          const progressPct = cancelled ? 0 : ORDER_STEPS.length <= 1 ? 0 : (stepIndex / (ORDER_STEPS.length - 1)) * 100;

          return (
            <div key={order.id} className="bg-brand-white rounded-luxury border border-brand-black/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">

              {/* ── Barra de metadatos ── */}
              <div className="bg-brand-gray-soft px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-brand-black/5 text-xs">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div>
                    <span className="block text-[10px] font-bold text-brand-black/40 uppercase tracking-wider">Fecha</span>
                    <span className="font-bold text-brand-black/80 flex items-center gap-1.5 mt-0.5">
                      <Calendar size={12} className="text-brand-black/40" />
                      {dateLabel}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-brand-black/40 uppercase tracking-wider">ID del Pedido</span>
                    <span className="font-mono font-bold text-brand-green-dark mt-0.5 block text-[11px]">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="block text-[10px] font-bold text-brand-black/40 uppercase tracking-wider">Pago</span>
                    <span className="font-semibold text-brand-black/80 mt-0.5 block">{getPaymentLabel(order.paymentMethod)}</span>
                  </div>
                  {!cancelled && order.status !== 'entregado' && order.status !== 'delivered' && (
                    <div>
                      <span className="block text-[10px] font-bold text-brand-black/40 uppercase tracking-wider">Entrega Estimada</span>
                      <span className="font-semibold text-brand-green-dark mt-0.5 block">{estLabel}</span>
                    </div>
                  )}
                </div>

                <span className={`px-3 py-1 border text-[10px] font-extrabold uppercase tracking-wider rounded-full ${STATUS_BADGE[order.status] || 'bg-brand-gray-soft text-brand-black border-brand-black/10'}`}>
                  {STATUS_LABEL[order.status] || order.status}
                </span>
              </div>

              {/* ── Contenido: productos + dirección ── */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-14 object-cover rounded-luxury border border-brand-black/5 shrink-0 bg-brand-gray-soft"
                      />
                      <div className="truncate">
                        <span
                          className="block text-sm font-bold text-brand-black hover:text-brand-green-dark cursor-pointer truncate transition-colors"
                          onClick={() => setView('product-details', item.productId)}
                        >
                          {item.name}
                        </span>
                        <span className="text-[10px] font-semibold text-brand-black/40">
                          Cant: {item.quantity} × ${item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-brand-gray-soft/50 p-4 rounded-luxury border border-brand-black/5 space-y-3.5 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold text-brand-black/40 uppercase tracking-wider">Enviar A</span>
                    <span className="font-bold text-brand-black/80 block mt-0.5">{order.shippingAddress?.name}</span>
                    <span className="text-brand-black/50 block truncate mt-0.5">
                      {order.shippingAddress?.address}, {order.shippingAddress?.city}
                    </span>
                  </div>
                  <div className="border-t border-brand-black/5 pt-2.5">
                    <div className="flex justify-between font-extrabold text-sm text-brand-black">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Barra de progreso de envío ── */}
              {!cancelled ? (
                <div className="px-6 py-5 bg-brand-green-dark/5 border-t border-brand-black/5">
                  <span className="block text-[10px] font-bold text-brand-green-dark uppercase tracking-widest mb-4">
                    Estado del Pedido
                  </span>

                  {/* Progress bar */}
                  <div className="relative mb-1">
                    {/* Track */}
                    <div className="absolute top-[14px] left-0 right-0 h-[2px] bg-brand-black/10 rounded-full" />
                    {/* Active fill */}
                    <div
                      className="absolute top-[14px] left-0 h-[2px] bg-brand-green-dark rounded-full transition-all duration-700"
                      style={{ width: `${progressPct}%` }}
                    />

                    {/* Steps */}
                    <div className="relative flex justify-between">
                      {ORDER_STEPS.map((step, i) => {
                        const isCompleted = i < stepIndex;
                        const isCurrent  = i === stepIndex;
                        const StepIcon   = step.icon;
                        return (
                          <div key={i} className="flex flex-col items-center" style={{ width: `${100 / ORDER_STEPS.length}%` }}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-brand-white ${
                              isCompleted
                                ? 'border-brand-green-dark bg-brand-green-dark text-brand-white'
                                : isCurrent
                                ? 'border-brand-green-dark text-brand-green-dark shadow-md shadow-brand-green-dark/20'
                                : 'border-brand-black/10 text-brand-black/20'
                            }`}>
                              {isCompleted
                                ? <CheckCircle2 size={13} className="text-brand-white" />
                                : <StepIcon
                                    size={12}
                                    className={isCurrent && (step.key.includes('en_preparacion') || step.key.includes('preparing'))
                                      ? 'animate-spin'
                                      : ''}
                                  />
                              }
                            </div>
                            <span className={`text-[9px] font-bold mt-1.5 text-center leading-tight max-w-[56px] ${
                              isCompleted || isCurrent ? 'text-brand-black/80' : 'text-brand-black/25'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Estimated delivery reminder */}
                  {order.status !== 'entregado' && order.status !== 'delivered' && (
                    <p className="text-[10px] text-brand-black/40 font-medium mt-4 flex items-center gap-1.5">
                      <Truck size={11} className="text-brand-green-dark" />
                      Entrega estimada: {estLabel} (7–10 días hábiles)
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-6 py-4 bg-red-50 border-t border-red-100 flex items-center gap-2 text-xs font-semibold text-red-700">
                  {order.status === 'reembolsado' || order.status === 'refunded'
                    ? <><RotateCcw size={14} /> Este pedido fue reembolsado.</>
                    : <><XCircle size={14} /> Este pedido fue cancelado.</>
                  }
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
