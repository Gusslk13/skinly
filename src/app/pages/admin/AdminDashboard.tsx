import React, { useState, useRef, useEffect } from 'react';
import { useApp, Product, Coupon, Order, User } from '../../context/AppContext';
import { supabase } from '../../../supabase';
import { Button, Input, Select, TextArea } from '../../components/UI';
import {
  ShieldCheck, ShieldAlert, BarChart3, Package, Truck,
  Award, Ticket, Trash2, CheckCircle2,
  Layers, UserCheck, Plus, Settings, DollarSign,
  FileText, Terminal, Copy, AlertTriangle, ImagePlus, X,
  Pencil, Star, StarOff, Users, ToggleLeft, ToggleRight,
  Clock, XCircle, Instagram, Youtube, Globe, Mic,
  Download, Search, TrendingUp, Save, History,
  AlertCircle, ShoppingCart, UserCog, ChevronRight
} from 'lucide-react';

// ── Status helpers ────────────────────────────────────────────────────────────
const PAID_STATUSES = ['pagado', 'enviado', 'entregado', 'paid', 'shipped', 'delivered'];

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pendiente_pago: { label: 'Pendiente de Pago', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  pendiente:      { label: 'Pendiente',          cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  pagado:         { label: 'Pagado',             cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  en_preparacion: { label: 'En Preparación',     cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  enviado:        { label: 'Enviado',            cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  entregado:      { label: 'Entregado',          cls: 'bg-green-50 text-green-700 border-green-200' },
  cancelado:      { label: 'Cancelado',          cls: 'bg-red-50 text-red-700 border-red-200' },
  reembolsado:    { label: 'Reembolsado',        cls: 'bg-red-50 text-red-700 border-red-200' },
  pending:        { label: 'Pendiente',          cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  shipped:        { label: 'Enviado',            cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  delivered:      { label: 'Entregado',          cls: 'bg-green-50 text-green-700 border-green-200' },
  refunded:       { label: 'Reembolsado',        cls: 'bg-red-50 text-red-700 border-red-200' },
};
const scfg = (s: string) => STATUS_CFG[s] ?? { label: s, cls: 'bg-gray-50 text-gray-700 border-gray-200' };

type AdminTab = 'overview' | 'products' | 'orders' | 'inventory' | 'suppliers' | 'affiliates' | 'coupons' | 'users' | 'customizer';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const AdminDashboard: React.FC = () => {
  const {
    currentUser, products, orders, coupons, supplierApplications,
    registeredUsers, affiliateProfiles, affiliateApplications,
    addProduct, editProduct, deleteProduct,
    reviewSupplierApplication, reviewAffiliateApplication,
    featuredBanner, setFeaturedBanner,
    addCoupon, toggleCouponStatus, updateOrderStatus, dbSetupRequired
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // ── Order detail panel state ──────────────────────────────────────────────
  const [selectedOrder, setSelectedOrder]   = useState<Order | null>(null);
  const [orderTracking, setOrderTracking]   = useState('');
  const [orderNotes,    setOrderNotes]      = useState('');
  const [orderHistory,  setOrderHistory]    = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail]   = useState(false);
  const [savingDetail,  setSavingDetail]    = useState(false);

  // ── Inventory edit state ──────────────────────────────────────────────────
  const [invEditing,   setInvEditing]   = useState<string | null>(null);
  const [invStock,     setInvStock]     = useState('');
  const [invThreshold, setInvThreshold] = useState('');
  const [invSaving,    setInvSaving]    = useState(false);

  // ── Users state ───────────────────────────────────────────────────────────
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  useEffect(() => { setLocalUsers(registeredUsers); }, [registeredUsers]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600 border border-red-200">
          <ShieldAlert size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-brand-black">Acceso No Autorizado</h2>
          <p className="text-xs text-brand-black/50 leading-relaxed max-w-xs mx-auto">
            No tienes credenciales administrativas. Solo el administrador autorizado puede acceder al Panel de Control.
          </p>
        </div>
      </div>
    );
  }

  // ── Metrics ───────────────────────────────────────────────────────────────
  const now          = new Date();
  const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek  = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const paidOrders   = orders.filter(o => PAID_STATUSES.includes(o.status));
  const todayOrders  = paidOrders.filter(o => new Date(o.createdAt) >= startOfDay);
  const weekOrders   = paidOrders.filter(o => new Date(o.createdAt) >= startOfWeek);
  const monthOrders  = paidOrders.filter(o => new Date(o.createdAt) >= startOfMonth);

  const todayRevenue  = todayOrders.reduce((s, o) => s + o.total, 0);
  const weekRevenue   = weekOrders.reduce((s, o) => s + o.total, 0);
  const monthRevenue  = monthOrders.reduce((s, o) => s + o.total, 0);

  const pendingCount  = orders.filter(o => ['pendiente', 'pending', 'pagado'].includes(o.status)).length;
  const lowStockProds = products.filter(p => p.stock <= 5);

  // Top 5 products sold
  const prodSales: Record<string, { name: string; qty: number; rev: number; img: string }> = {};
  for (const o of paidOrders) {
    for (const item of o.items) {
      if (!prodSales[item.productId]) {
        prodSales[item.productId] = { name: item.name, qty: 0, rev: 0, img: products.find(p => p.id === item.productId)?.imageUrl || '' };
      }
      prodSales[item.productId].qty += item.quantity;
      prodSales[item.productId].rev += item.price * item.quantity;
    }
  }
  const topProducts = Object.entries(prodSales).sort(([, a], [, b]) => b.qty - a.qty).slice(0, 5);

  // ── Order detail handlers ─────────────────────────────────────────────────
  const openOrderDetail = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingDetail(true);
    const { data } = await supabase.from('orders').select('tracking_number, admin_notes').eq('id', order.id).single();
    setOrderTracking(data?.tracking_number || '');
    setOrderNotes(data?.admin_notes || '');
    const { data: hist } = await supabase.from('order_status_history').select('*').eq('order_id', order.id).order('created_at', { ascending: false });
    setOrderHistory(hist || []);
    setLoadingDetail(false);
  };

  const saveOrderDetail = async () => {
    if (!selectedOrder) return;
    setSavingDetail(true);
    await supabase.from('orders').update({
      tracking_number: orderTracking || null,
      admin_notes:     orderNotes || null,
    }).eq('id', selectedOrder.id);
    setSavingDetail(false);
  };

  const changeOrderStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    const oldStatus = selectedOrder.status;
    await updateOrderStatus(selectedOrder.id, newStatus);
    await supabase.from('order_status_history').insert({
      order_id:   selectedOrder.id,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: currentUser.id,
    });
    const { data: hist } = await supabase.from('order_status_history').select('*').eq('order_id', selectedOrder.id).order('created_at', { ascending: false });
    setOrderHistory(hist || []);
    setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
  };

  // ── CSV Export ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = ['ID', 'Fecha', 'Cliente', 'Email', 'Teléfono', 'Dirección', 'Ciudad', 'Productos', 'Total', 'Status'];
    const rows = orders.map(o => [
      o.id.slice(0, 8).toUpperCase(),
      new Date(o.createdAt).toLocaleDateString('es-MX'),
      o.shippingAddress?.name || '',
      o.shippingAddress?.email || '',
      o.shippingAddress?.phone || '',
      o.shippingAddress?.address || '',
      o.shippingAddress?.city || '',
      o.items.map(i => `${i.name} x${i.quantity}`).join(' | '),
      o.total.toFixed(2),
      scfg(o.status).label,
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `skinly-ordenes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Inventory save ────────────────────────────────────────────────────────
  const saveInventory = async (prod: Product) => {
    setInvSaving(true);
    await supabase.from('products').update({
      stock:               Number(invStock),
      low_stock_threshold: Number(invThreshold),
    }).eq('id', prod.id);
    await editProduct({ ...prod, stock: Number(invStock) });
    setInvEditing(null);
    setInvSaving(false);
  };

  // ── User role change ──────────────────────────────────────────────────────
  const changeUserRole = async (userId: string, newRole: string) => {
    await supabase.from('users').update({ role: newRole }).eq('id', userId);
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
  };

  const filteredUsers = localUsers.filter(u =>
    u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // ── Top-level stat cards ──────────────────────────────────────────────────
  const StatCard = ({ label, value, sub, icon: Icon, accent }: any) => (
    <div className="bg-brand-white p-5 rounded-luxury border border-brand-black/5 shadow-sm space-y-1 relative overflow-hidden">
      <div className="flex justify-between items-center text-brand-black/50 text-[10px] uppercase font-bold tracking-wider">
        <span>{label}</span><Icon size={15} />
      </div>
      <span className="text-2xl font-black text-brand-black block">{value}</span>
      <span className={`text-[9px] font-semibold ${accent || 'text-brand-black/40'}`}>{sub}</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8 text-left">

      {dbSetupRequired && <DBSetupBanner />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-black/5">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-bold text-brand-black flex items-center gap-2">
            <ShieldCheck size={28} className="text-brand-green-dark" />Centro de Control
          </h1>
          <p className="text-xs text-brand-black/40 font-medium">Gestiona pedidos, inventario, afiliados y configuración de la tienda.</p>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {([
            { id: 'overview',   label: 'Analíticas',    icon: BarChart3  },
            { id: 'products',   label: 'Catálogo',      icon: Package    },
            { id: 'orders',     label: 'Pedidos',       icon: Truck      },
            { id: 'inventory',  label: 'Inventario',    icon: Layers     },
            { id: 'suppliers',  label: 'Auditorías Lab',icon: Award      },
            { id: 'affiliates', label: 'Afiliados',     icon: Users      },
            { id: 'coupons',    label: 'Cupones',       icon: Ticket     },
            { id: 'users',      label: 'Usuarios',      icon: UserCog    },
            { id: 'customizer', label: 'Personalizar',  icon: Settings   },
          ] as { id: AdminTab; label: string; icon: any }[]).map(tab => {
            const TabIcon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-luxury transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-brand-black text-brand-white'
                    : 'bg-brand-white text-brand-black/60 border border-brand-black/5 hover:border-brand-black/10'
                }`}>
                <TabIcon size={13} />{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ingresos este mes"  value={`$${monthRevenue.toFixed(2)}`}  sub="Solo órdenes pagadas"        icon={DollarSign}  accent="text-brand-green-dark" />
        <StatCard label="Pendientes despacho" value={`${pendingCount} pedidos`}      sub="Requieren acción"            icon={Truck}       accent="text-amber-600" />
        <StatCard label="Catálogo Skincare"   value={`${products.length} artículos`} sub={`${lowStockProds.length} con stock bajo`} icon={Package} accent={lowStockProds.length > 0 ? 'text-red-500' : 'text-brand-black/40'} />
        <StatCard label="Proveedores Cert."   value={`${registeredUsers.filter(u => u.role === 'supplier').length} labs`} sub="Bio-extracción sostenible" icon={UserCheck} accent="text-brand-green-dark" />
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <div>

        {/* ================================================================
            OVERVIEW — métricas reales
            ================================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* Period revenue cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Hoy',        rev: todayRevenue,  count: todayOrders.length,  from: startOfDay },
                { label: 'Esta semana',rev: weekRevenue,   count: weekOrders.length,   from: startOfWeek },
                { label: 'Este mes',   rev: monthRevenue,  count: monthOrders.length,  from: startOfMonth },
              ].map(p => (
                <div key={p.label} className="bg-brand-white p-5 rounded-luxury border border-brand-black/5 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-black/50">{p.label}</span>
                    <TrendingUp size={14} className="text-brand-green-dark" />
                  </div>
                  <p className="text-2xl font-black text-brand-black">${p.rev.toFixed(2)}</p>
                  <p className="text-[10px] text-brand-black/40 font-semibold">{p.count} orden{p.count !== 1 ? 'es' : ''} completada{p.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top 5 productos */}
              <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5 flex items-center gap-1.5">
                  <ShoppingCart size={13} className="text-brand-green-dark" />Top 5 Productos Vendidos
                </h3>
                {topProducts.length === 0 ? (
                  <p className="text-xs italic text-brand-black/40 py-4 text-center">Sin ventas pagadas todavía.</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map(([id, p], i) => (
                      <div key={id} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-brand-black text-brand-white text-[9px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                        {p.img && <img src={p.img} alt={p.name} className="w-8 h-8 rounded object-cover border border-brand-black/5 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-brand-black truncate">{p.name}</p>
                          <p className="text-[10px] text-brand-black/40 font-medium">{p.qty} uds · ${p.rev.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stock bajo */}
              <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5 flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-red-500" />Alertas de Stock Bajo
                </h3>
                {lowStockProds.length === 0 ? (
                  <p className="text-xs text-brand-green-dark font-semibold py-4 text-center">✓ Todos los productos tienen stock suficiente.</p>
                ) : (
                  <div className="space-y-2.5">
                    {lowStockProds.map(p => (
                      <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 bg-red-50 border border-red-100 rounded-luxury">
                        <span className="text-xs font-semibold text-red-800 truncate">{p.name}</span>
                        <span className={`text-xs font-black shrink-0 ${p.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                          {p.stock === 0 ? 'Agotado' : `${p.stock} uds.`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actividad reciente */}
            <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5">
                Actividad Reciente de Compras
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {orders.slice(0, 15).map(o => {
                  const sc = scfg(o.status);
                  return (
                    <div key={o.id} className="flex justify-between items-center text-xs border-b border-brand-black/5 pb-2 last:border-0">
                      <div className="space-y-0.5">
                        <span className="font-bold text-brand-black block truncate max-w-[140px]">{o.shippingAddress?.name || '—'}</span>
                        <span className="text-[10px] text-brand-black/40 font-mono">{o.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="font-extrabold text-brand-black block">${o.total.toFixed(2)}</span>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            PRODUCTS — sin cambios
            ================================================================ */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-brand-white p-4 rounded-luxury border border-brand-black/5 shadow-sm font-semibold flex justify-between items-center text-xs text-brand-black/50">
                <span>Catálogo Activo ({products.length} formulaciones)</span>
                <span>{products.filter(p => p.isFeatured).length} destacados</span>
              </div>
              <div className="bg-brand-white border border-brand-black/5 rounded-luxury divide-y divide-brand-black/5 overflow-hidden">
                {products.length === 0 && <p className="text-xs italic text-brand-black/40 text-center py-10">No hay productos registrados aún.</p>}
                {products.map(p => (
                  <div key={p.id} className={`p-4 sm:p-5 flex gap-4 text-xs items-center justify-between text-left transition-colors ${editingProduct?.id === p.id ? 'bg-brand-green-dark/5 border-l-2 border-brand-green-dark' : ''}`}>
                    <div className="flex gap-3 items-center min-w-0">
                      <div className="relative shrink-0">
                        <img src={p.imageUrl || '/images/product-1.png'} alt={p.name} className="w-12 h-12 object-cover rounded-luxury border border-brand-black/5 bg-brand-gray-soft" />
                        {p.isFeatured && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow"><Star size={8} className="fill-white text-white" /></span>}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <h4 className="font-heading text-sm font-bold text-brand-black truncate max-w-[140px] sm:max-w-[220px]">{p.name}</h4>
                        <span className="block text-[10px] text-brand-black/35 font-semibold tracking-wider uppercase">{p.category}</span>
                        <button onClick={() => editProduct({ ...p, isFeatured: !p.isFeatured })}
                          className={`flex items-center gap-1 px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full tracking-wide border transition-all cursor-pointer ${p.isFeatured ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-brand-gray-soft text-brand-black/40 border-brand-black/5 hover:border-amber-300 hover:text-amber-600'}`}>
                          {p.isFeatured ? <Star size={8} className="fill-amber-500 text-amber-500" /> : <StarOff size={8} />}
                          {p.isFeatured ? 'Destacado' : 'Destacar'}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="font-black text-brand-black block text-sm">${p.price.toFixed(2)}</span>
                        <span className={`block text-[10px] font-bold ${p.stock <= 5 ? 'text-red-500' : 'text-brand-black/40'}`}>{p.stock} uds.</span>
                      </div>
                      <button onClick={() => setEditingProduct(editingProduct?.id === p.id ? null : p)}
                        className={`p-1.5 rounded-luxury transition-colors cursor-pointer border ${editingProduct?.id === p.id ? 'bg-brand-green-dark text-white border-brand-green-dark' : 'text-brand-black/40 border-brand-black/8 hover:text-brand-green-dark hover:border-brand-green-dark/30'}`}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => { if (window.confirm(`¿Eliminar "${p.name}"?`)) deleteProduct(p.id); }}
                        className="p-1.5 text-brand-black/30 hover:text-red-600 transition-colors cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-brand-white p-5 sm:p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-6 text-left h-fit lg:sticky lg:top-4">
              {editingProduct ? (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-brand-black/5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black flex items-center gap-1.5"><Pencil size={13} className="text-brand-green-dark" />Editar Producto</h3>
                    <button onClick={() => setEditingProduct(null)} className="text-brand-black/30 hover:text-brand-black transition-colors cursor-pointer"><X size={15} /></button>
                  </div>
                  <ProductEditWizard product={editingProduct} onSave={async (prod) => { await editProduct(prod); setEditingProduct(null); }} onCancel={() => setEditingProduct(null)} />
                </>
              ) : (
                <>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5 flex items-center gap-1.5"><Plus size={14} />Registrar Nuevo Producto</h3>
                  <ProductAddWizard onAdd={(prodData) => addProduct(prodData)} />
                </>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            ORDERS — con detalle completo + exportar CSV
            ================================================================ */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-brand-white p-4 rounded-luxury border border-brand-black/5 shadow-sm flex flex-wrap justify-between items-center gap-3 text-xs font-bold text-brand-black/50">
              <span>{orders.length} pedidos en total · {pendingCount} pendientes</span>
              <button onClick={exportCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-brand-green-dark/10 hover:bg-brand-green-dark text-brand-green-dark hover:text-white rounded-luxury transition-all cursor-pointer font-bold text-xs border border-brand-green-dark/20">
                <Download size={13} />Exportar CSV
              </button>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs italic text-brand-black/40 text-center py-14 bg-brand-white rounded-luxury border border-brand-black/5">No hay pedidos registrados aún.</p>
            ) : (
              <div className="bg-brand-white border border-brand-black/5 rounded-luxury overflow-hidden">
                <div className="hidden md:grid grid-cols-[1fr_1.4fr_0.8fr_0.7fr_1.1fr_auto] gap-4 px-5 py-3 bg-brand-gray-soft border-b border-brand-black/5 text-[10px] font-extrabold uppercase tracking-wider text-brand-black/40">
                  <span>Pedido / Fecha</span><span>Cliente</span><span>Total</span><span>Artículos</span><span>Estado</span><span></span>
                </div>
                <div className="divide-y divide-brand-black/5">
                  {orders.map(o => {
                    const userRecord = registeredUsers.find(u => u.id === o.customerId);
                    const email   = o.shippingAddress?.email || userRecord?.email || '—';
                    const shortId = o.id.slice(0, 8).toUpperCase();
                    const sc      = scfg(o.status);
                    return (
                      <div key={o.id} className="px-4 sm:px-5 py-4 text-xs hover:bg-brand-gray-soft/30 transition-colors">
                        {/* Mobile */}
                        <div className="flex items-start justify-between gap-3 md:hidden">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-brand-green-dark text-[11px]">#{shortId}</span>
                              <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide rounded-full border ${sc.cls}`}>{sc.label}</span>
                            </div>
                            <span className="font-bold text-brand-black block truncate">{o.shippingAddress?.name || '—'}</span>
                            <span className="text-[10px] text-brand-black/40 block truncate">{email}</span>
                            <div className="flex items-center gap-3 flex-wrap pt-0.5">
                              <span className="font-black text-brand-black">${o.total.toFixed(2)}</span>
                              <span className="text-brand-black/40">{o.items.reduce((s, i) => s + i.quantity, 0)} uds.</span>
                            </div>
                          </div>
                          <button onClick={() => openOrderDetail(o)} className="shrink-0 p-2 bg-brand-green-dark/10 hover:bg-brand-green-dark text-brand-green-dark hover:text-white rounded-luxury transition-all cursor-pointer"><ChevronRight size={15} /></button>
                        </div>
                        {/* Desktop */}
                        <div className="hidden md:grid grid-cols-[1fr_1.4fr_0.8fr_0.7fr_1.1fr_auto] gap-4 items-center">
                          <div className="space-y-0.5">
                            <span className="font-mono font-black text-brand-green-dark text-[11px] block">#{shortId}</span>
                            <span className="text-[10px] text-brand-black/40 font-semibold block">{new Date(o.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-bold text-brand-black block truncate">{o.shippingAddress?.name || '—'}</span>
                            <span className="text-[10px] text-brand-black/40 block truncate">{email}</span>
                            <span className="text-[10px] text-brand-black/30 block truncate">{o.shippingAddress?.city || '—'}</span>
                          </div>
                          <span className="font-black text-brand-black text-sm">${o.total.toFixed(2)}</span>
                          <span className="text-brand-black/60 font-semibold">{o.items.reduce((s, i) => s + i.quantity, 0)} uds.</span>
                          <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide rounded-full border ${sc.cls}`}>{sc.label}</span>
                          <button onClick={() => openOrderDetail(o)} className="p-1.5 bg-brand-green-dark/10 hover:bg-brand-green-dark text-brand-green-dark hover:text-white rounded-luxury transition-all cursor-pointer"><ChevronRight size={14} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order detail slide-over */}
            {selectedOrder && (
              <OrderDetailPanel
                order={selectedOrder}
                tracking={orderTracking}
                notes={orderNotes}
                history={orderHistory}
                loading={loadingDetail}
                saving={savingDetail}
                onTrackingChange={setOrderTracking}
                onNotesChange={setOrderNotes}
                onSave={saveOrderDetail}
                onStatusChange={changeOrderStatus}
                onClose={() => setSelectedOrder(null)}
                registeredUsers={registeredUsers}
              />
            )}
          </div>
        )}

        {/* ================================================================
            INVENTORY — stock + umbral editable
            ================================================================ */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {lowStockProds.length > 0 && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-luxury text-xs font-semibold text-red-800">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span><strong>{lowStockProds.length} producto{lowStockProds.length > 1 ? 's' : ''}</strong> con stock ≤ 5 unidades. Reabastece pronto.</span>
              </div>
            )}

            <div className="bg-brand-white border border-brand-black/5 rounded-luxury overflow-hidden shadow-sm">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-brand-gray-soft border-b border-brand-black/5 text-[10px] font-extrabold uppercase tracking-wider text-brand-black/40">
                <span>Producto</span><span>Stock</span><span>Umbral alerta</span><span>Estado</span><span></span>
              </div>
              <div className="divide-y divide-brand-black/5">
                {products.map(p => {
                  const isEditing = invEditing === p.id;
                  const isLow     = p.stock <= 5;
                  return (
                    <div key={p.id} className={`grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center text-xs transition-colors ${isLow ? 'bg-red-50/30' : ''}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={p.imageUrl || '/images/product-1.png'} alt={p.name} className="w-9 h-9 object-cover rounded border border-brand-black/5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-brand-black truncate">{p.name}</p>
                          <p className="text-[10px] text-brand-black/40 uppercase tracking-wide">{p.category}</p>
                        </div>
                      </div>
                      <div>
                        {isEditing ? (
                          <input type="number" min="0" value={invStock} onChange={e => setInvStock(e.target.value)}
                            className="w-20 px-2 py-1.5 border border-brand-green-dark rounded text-xs outline-none font-bold text-brand-black" />
                        ) : (
                          <span className={`font-black text-sm ${isLow ? 'text-red-600' : 'text-brand-black'}`}>{p.stock}</span>
                        )}
                      </div>
                      <div>
                        {isEditing ? (
                          <input type="number" min="0" value={invThreshold} onChange={e => setInvThreshold(e.target.value)}
                            className="w-20 px-2 py-1.5 border border-brand-green-dark rounded text-xs outline-none font-bold text-brand-black" />
                        ) : (
                          <span className="font-semibold text-brand-black/60">5 uds.</span>
                        )}
                      </div>
                      <div>
                        {p.stock === 0
                          ? <span className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 rounded-full border border-red-200">Agotado</span>
                          : isLow
                          ? <span className="px-2 py-0.5 text-[9px] font-bold bg-orange-50 text-orange-700 rounded-full border border-orange-200">Stock bajo</span>
                          : <span className="px-2 py-0.5 text-[9px] font-bold bg-green-50 text-green-700 rounded-full border border-green-200">OK</span>}
                      </div>
                      <div className="flex gap-1.5">
                        {isEditing ? (
                          <>
                            <button onClick={() => saveInventory(p)} disabled={invSaving}
                              className="p-1.5 bg-brand-green-dark text-white rounded cursor-pointer hover:bg-brand-black transition-colors disabled:opacity-40">
                              <Save size={13} />
                            </button>
                            <button onClick={() => setInvEditing(null)} className="p-1.5 text-brand-black/40 hover:text-red-600 rounded cursor-pointer transition-colors"><X size={13} /></button>
                          </>
                        ) : (
                          <button onClick={() => { setInvEditing(p.id); setInvStock(String(p.stock)); setInvThreshold('5'); }}
                            className="p-1.5 text-brand-black/40 hover:text-brand-green-dark rounded cursor-pointer transition-colors border border-brand-black/10 hover:border-brand-green-dark/30">
                            <Pencil size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            SUPPLIERS — sin cambios
            ================================================================ */}
        {activeTab === 'suppliers' && (
          <div className="bg-brand-white border border-brand-black/5 rounded-luxury overflow-hidden">
            <div className="p-4 bg-brand-gray-soft flex justify-between items-center text-xs font-bold text-brand-black/50 border-b border-brand-black/5">
              <span>Solicitudes de proveedores de bio-laboratorio</span>
              <span>Auditorías de Certificaciones de Compuestos Orgánicos</span>
            </div>
            {supplierApplications.length > 0 ? (
              <div className="divide-y divide-brand-black/5">
                {supplierApplications.map(app => (
                  <div key={app.id} className="p-6 text-xs text-left space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-brand-black/40 uppercase block">Marca de Laboratorio</span>
                        <h4 className="font-heading text-base font-bold text-brand-black">{app.companyName}</h4>
                        <span className="text-[10px] text-brand-black/40 font-semibold uppercase tracking-wider block mt-0.5">Enviado: {app.createdAt}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide rounded-full border ${app.status === 'approved' ? 'bg-brand-green-dark/15 text-brand-green-dark border-brand-green-dark/20' : app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200/50 animate-pulse'}`}>
                        {app.status === 'approved' ? 'Aprobado' : app.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="bg-brand-gray-soft p-4 rounded-luxury border border-brand-black/5 space-y-2 leading-relaxed">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-brand-black/40 block">Auditoría de Ingredientes y Origen</span>
                      <p className="text-brand-black/75 font-medium">{app.ingredientsDescription}</p>
                      <div className="flex items-center gap-1.5 text-brand-green-dark font-bold pt-1.5 border-t border-brand-black/5 mt-2">
                        <FileText size={13} />
                        <span className="hover:underline cursor-pointer" onClick={() => alert('Simulación de PDF de auditoría.')}>Certificado de auditoría: organic_compound_lab_results.pdf</span>
                      </div>
                    </div>
                    {app.status === 'pending' && (
                      <div className="flex justify-end gap-2.5">
                        <button onClick={() => { reviewSupplierApplication(app.id, false, 'Documentos sin sello oficial.'); alert('Solicitud rechazada.'); }}
                          className="px-4 py-2 bg-transparent hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-luxury cursor-pointer transition-colors">Rechazar Laboratorio</button>
                        <button onClick={() => { reviewSupplierApplication(app.id, true); alert('¡Proveedor aprobado!'); }}
                          className="px-4 py-2 bg-brand-green-dark hover:bg-brand-black text-brand-white text-xs font-bold rounded-luxury cursor-pointer transition-all">Verificar y Aprobar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-brand-black/40 text-center py-10">No hay solicitudes de verificación de proveedores.</p>
            )}
          </div>
        )}

        {/* ================================================================
            AFFILIATES — sin cambios
            ================================================================ */}
        {activeTab === 'affiliates' && (
          <div className="space-y-8 text-left">
            <div className="space-y-4">
              <div className="bg-brand-white p-4 rounded-luxury border border-brand-black/5 shadow-sm flex justify-between items-center text-xs font-bold text-brand-black/60">
                <span>Solicitudes de Membresía ({affiliateApplications.length})</span>
                <span className="text-amber-600">{affiliateApplications.filter(a => a.status === 'pendiente').length} pendientes</span>
              </div>
              {affiliateApplications.length === 0 ? (
                <p className="text-xs italic text-brand-black/40 text-center py-10">No hay solicitudes de afiliado registradas.</p>
              ) : (
                <div className="space-y-4">
                  {affiliateApplications.map(app => (
                    <div key={app.id} className="bg-brand-white border border-brand-black/5 rounded-luxury overflow-hidden shadow-sm">
                      <div className="bg-brand-gray-soft px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-brand-black/5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-green-dark/10 flex items-center justify-center text-sm font-black text-brand-green-dark">{app.fullName.charAt(0).toUpperCase()}</div>
                          <div>
                            <span className="block text-sm font-bold text-brand-black">{app.fullName}</span>
                            <span className="block text-[10px] text-brand-black/40 font-medium">{app.email} {app.phone ? `· ${app.phone}` : ''}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-full border ${app.status === 'aprobado' ? 'bg-brand-green-dark/15 text-brand-green-dark border-brand-green-dark/20' : app.status === 'rechazado' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                            {app.status === 'aprobado' ? 'Aprobado' : app.status === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                          </span>
                          <span className="text-[9px] text-brand-black/30 font-medium">{new Date(app.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-brand-black/35 tracking-wider mb-1">Plataforma</span>
                          <span className="font-semibold text-brand-black capitalize">{app.platform || '—'}</span>
                          <span className="block text-brand-green-dark font-bold mt-0.5">{app.handle}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-brand-black/35 tracking-wider mb-1">Seguidores</span>
                          <span className="font-semibold text-brand-black">{app.followersCount || '—'}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="block text-[9px] uppercase font-bold text-brand-black/35 tracking-wider mb-1">¿Por qué quiere ser afiliado?</span>
                          <p className="text-brand-black/70 leading-relaxed line-clamp-3">{app.whyAffiliate || '—'}</p>
                        </div>
                        {app.promotionPlan && (
                          <div className="sm:col-span-2 lg:col-span-4">
                            <span className="block text-[9px] uppercase font-bold text-brand-black/35 tracking-wider mb-1">Plan de Promoción</span>
                            <p className="text-brand-black/70 leading-relaxed line-clamp-2">{app.promotionPlan}</p>
                          </div>
                        )}
                        {app.couponCode && (
                          <div>
                            <span className="block text-[9px] uppercase font-bold text-brand-black/35 tracking-wider mb-1">Código Asignado</span>
                            <span className="font-mono font-black text-brand-green-dark">{app.couponCode}</span>
                          </div>
                        )}
                      </div>
                      {app.status === 'pendiente' && (
                        <div className="px-5 pb-4 flex gap-2 flex-wrap">
                          <button onClick={() => reviewAffiliateApplication(app.id, true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-brand-green-dark hover:bg-brand-black text-brand-white text-xs font-bold rounded-luxury cursor-pointer transition-all">
                            <CheckCircle2 size={13} />Aprobar y Activar
                          </button>
                          <button onClick={() => { if (confirm(`¿Rechazar la solicitud de ${app.fullName}?`)) reviewAffiliateApplication(app.id, false); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-transparent hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-luxury cursor-pointer transition-all">
                            <XCircle size={13} />Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-brand-white p-4 rounded-luxury border border-brand-black/5 shadow-sm text-xs font-bold text-brand-black/60">
                <span>Afiliados Activos ({affiliateProfiles.length})</span>
              </div>
              {affiliateProfiles.length === 0 ? (
                <p className="text-xs italic text-brand-black/40 text-center py-6">No hay afiliados activos todavía.</p>
              ) : (
                <div className="bg-brand-white border border-brand-black/5 rounded-luxury divide-y divide-brand-black/5 overflow-hidden">
                  {affiliateProfiles.map(aff => {
                    const user = registeredUsers.find(u => u.id === aff.userId);
                    return (
                      <div key={aff.userId} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div className="space-y-0.5">
                          <span className="block font-bold text-brand-black">{user?.fullName || aff.userId.slice(0, 8)}</span>
                          <span className="font-mono font-black text-brand-green-dark text-sm">{aff.couponCode}</span>
                          <span className="block text-[10px] text-brand-black/40">{user?.email}</span>
                        </div>
                        <div className="flex gap-6 text-center">
                          <div><span className="block font-black text-brand-black text-base">{aff.referredSales}</span><span className="block text-[9px] text-brand-black/40 uppercase tracking-wide">Ventas</span></div>
                          <div><span className="block font-black text-brand-black text-base">{aff.clicksCount}</span><span className="block text-[9px] text-brand-black/40 uppercase tracking-wide">Clics</span></div>
                          <div><span className="block font-black text-brand-green-dark text-base">${aff.commissionEarned.toFixed(2)}</span><span className="block text-[9px] text-brand-black/40 uppercase tracking-wide">Comisión</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            COUPONS — sin cambios
            ================================================================ */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-brand-white p-4 rounded-luxury border border-brand-black/5 shadow-sm text-xs font-bold text-brand-black/50 flex justify-between items-center">
                <span>Lista de Cupones de Referido Activos</span>
                <span>Registro de Comisiones de Afiliados</span>
              </div>
              <div className="bg-brand-white border border-brand-black/5 rounded-luxury divide-y divide-brand-black/5 overflow-hidden">
                {coupons.length === 0 && <p className="text-xs italic text-brand-black/40 text-center py-8">No hay cupones creados aún.</p>}
                {coupons.map((c: Coupon) => {
                  const isExpired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
                  const isMaxed   = c.maxUses && c.maxUses > 0 ? c.usageCount >= c.maxUses : false;
                  return (
                    <div key={c.code} className="p-4 sm:p-5 flex flex-wrap justify-between items-center gap-4 text-xs">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-black text-brand-green-dark tracking-wide">{c.code}</span>
                          <span className="text-[10px] font-extrabold uppercase tracking-wide bg-brand-green-light text-brand-black px-2 py-0.5 rounded">-{c.discountPercentage}% DTO</span>
                          {isExpired && <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">Expirado</span>}
                          {isMaxed   && <span className="text-[9px] font-bold text-orange-500 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">Límite alcanzado</span>}
                        </div>
                        <div className="flex gap-3 text-[10px] text-brand-black/40 font-semibold flex-wrap">
                          <span>{c.affiliateId ? `Afiliado: ${c.affiliateId.slice(0, 8)}…` : 'Cupón General'}</span>
                          <span>{c.usageCount} uso{c.usageCount !== 1 ? 's' : ''}{c.maxUses ? ` / ${c.maxUses} máx` : ''}</span>
                          {c.expiresAt && <span>Expira: {new Date(c.expiresAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full border ${c.isActive ? 'bg-brand-green-dark/15 text-brand-green-dark border-brand-green-dark/20' : 'bg-brand-gray-soft text-brand-black/30 border-brand-black/10'}`}>{c.isActive ? 'Activo' : 'Inactivo'}</span>
                        <button onClick={() => toggleCouponStatus(c.code, !c.isActive)} className="text-brand-black/40 hover:text-brand-green-dark transition-colors cursor-pointer">
                          {c.isActive ? <ToggleRight size={22} className="text-brand-green-dark" /> : <ToggleLeft size={22} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-5 h-fit">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5">Agregar Código de Cupón</h3>
              <CouponAddForm />
            </div>
          </div>
        )}

        {/* ================================================================
            USERS — gestión de usuarios con búsqueda y rol
            ================================================================ */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-brand-white p-4 rounded-luxury border border-brand-black/5 shadow-sm flex flex-wrap justify-between items-center gap-3 text-xs font-bold text-brand-black/50">
              <span>{localUsers.length} usuarios registrados</span>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-black/30" />
                <input
                  placeholder="Buscar por nombre o email…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-brand-gray-soft border border-brand-black/5 rounded-luxury text-xs outline-none focus:border-brand-green-dark transition-all w-56"
                />
              </div>
            </div>

            <div className="bg-brand-white border border-brand-black/5 rounded-luxury overflow-hidden shadow-sm">
              <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_0.8fr_auto] gap-4 px-5 py-3 bg-brand-gray-soft border-b border-brand-black/5 text-[10px] font-extrabold uppercase tracking-wider text-brand-black/40">
                <span>Nombre</span><span>Email</span><span>Pedidos</span><span>Rol actual</span><span>Cambiar rol</span>
              </div>
              {filteredUsers.length === 0 ? (
                <p className="text-xs italic text-brand-black/40 text-center py-10">No se encontraron usuarios.</p>
              ) : (
                <div className="divide-y divide-brand-black/5">
                  {filteredUsers.map(u => {
                    const userOrderCount = orders.filter(o => o.customerId === u.id).length;
                    const roleColors: Record<string, string> = {
                      admin:    'bg-brand-green-dark/15 text-brand-green-dark border-brand-green-dark/20',
                      affiliate:'bg-indigo-50 text-indigo-700 border-indigo-200',
                      supplier: 'bg-amber-50 text-amber-700 border-amber-200',
                      customer: 'bg-brand-gray-soft text-brand-black/60 border-brand-black/10',
                    };
                    return (
                      <div key={u.id} className="px-5 py-4 text-xs">
                        {/* Mobile */}
                        <div className="flex items-center justify-between gap-3 md:hidden">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-brand-black truncate">{u.fullName}</p>
                            <p className="text-[10px] text-brand-black/40 truncate">{u.email}</p>
                            <p className="text-[10px] text-brand-black/30">{userOrderCount} pedido{userOrderCount !== 1 ? 's' : ''}</p>
                          </div>
                          <select value={u.role} onChange={e => changeUserRole(u.id, e.target.value)}
                            className="text-[10px] font-semibold border border-brand-black/10 rounded-luxury px-2 py-1.5 bg-brand-white outline-none focus:border-brand-green-dark cursor-pointer">
                            <option value="customer">Cliente</option>
                            <option value="affiliate">Afiliado</option>
                            <option value="supplier">Proveedor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        {/* Desktop */}
                        <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_0.8fr_auto] gap-4 items-center">
                          <div className="min-w-0">
                            <p className="font-bold text-brand-black truncate">{u.fullName}</p>
                            <p className="text-[10px] text-brand-black/30 font-mono">{u.id.slice(0, 8)}</p>
                          </div>
                          <p className="text-brand-black/60 truncate font-medium">{u.email}</p>
                          <p className="font-semibold text-brand-black">{userOrderCount} pedido{userOrderCount !== 1 ? 's' : ''}</p>
                          <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide rounded-full border w-fit ${roleColors[u.role] || roleColors.customer}`}>
                            {u.role}
                          </span>
                          <select value={u.role} onChange={e => changeUserRole(u.id, e.target.value)}
                            className="text-[10px] font-semibold border border-brand-black/10 rounded-luxury px-2 py-1.5 bg-brand-white outline-none focus:border-brand-green-dark cursor-pointer transition-colors">
                            <option value="customer">Cliente</option>
                            <option value="affiliate">Afiliado</option>
                            <option value="supplier">Proveedor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            CUSTOMIZER — sin cambios
            ================================================================ */}
        {activeTab === 'customizer' && (
          <div className="max-w-2xl bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 shadow-sm space-y-6 text-left">
            <div className="border-b border-brand-black/5 pb-3 space-y-1">
              <h2 className="font-heading text-xl font-bold text-brand-black flex items-center gap-2">
                <Settings className="text-brand-green-dark" size={18} />Personalizar Banner de Inicio
              </h2>
              <p className="text-[11px] text-brand-black/50 leading-relaxed font-semibold">
                Modifica el contenido de marketing destacado en tiempo real.
              </p>
            </div>
            <StorefrontCustomizeForm banner={featuredBanner} onSave={(banner) => { setFeaturedBanner(banner); alert('¡Banner actualizado!'); }} />
          </div>
        )}

      </div>
    </div>
  );
};

// ============================================================================
// ORDER DETAIL PANEL — slide-over derecho
// ============================================================================
interface OrderDetailPanelProps {
  order: Order;
  tracking: string;
  notes: string;
  history: any[];
  loading: boolean;
  saving: boolean;
  onTrackingChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onSave: () => void;
  onStatusChange: (s: string) => void;
  onClose: () => void;
  registeredUsers: any[];
}

const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({
  order, tracking, notes, history, loading, saving,
  onTrackingChange, onNotesChange, onSave, onStatusChange, onClose, registeredUsers
}) => {
  const sc = STATUS_CFG[order.status] ?? { label: order.status, cls: 'bg-gray-50 text-gray-700 border-gray-200' };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-brand-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-lg bg-brand-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-black/5 bg-brand-gray-soft shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-black/40">Detalle del Pedido</p>
            <h2 className="font-heading text-lg font-bold text-brand-black font-mono">#{order.id.slice(0, 8).toUpperCase()}</h2>
            <p className="text-[10px] text-brand-black/40 font-medium">{new Date(order.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide rounded-full border ${sc.cls}`}>{sc.label}</span>
            <button onClick={onClose} className="p-2 text-brand-black/40 hover:text-brand-black transition-colors cursor-pointer"><X size={18} /></button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-brand-green-dark/30 border-t-brand-green-dark rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Change status */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-black/50">Cambiar Estado</label>
              <select
                value={order.status}
                onChange={e => onStatusChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-brand-black/10 rounded-luxury text-xs font-semibold bg-brand-white outline-none focus:border-brand-green-dark cursor-pointer transition-colors"
              >
                {[
                  { value: 'pendiente_pago', label: 'Pendiente de Pago' },
                  { value: 'pendiente',      label: 'Pendiente' },
                  { value: 'pagado',         label: 'Pagado' },
                  { value: 'en_preparacion', label: 'En Preparación' },
                  { value: 'enviado',        label: 'Enviado' },
                  { value: 'entregado',      label: 'Entregado' },
                  { value: 'cancelado',      label: 'Cancelado' },
                  { value: 'reembolsado',    label: 'Reembolsado' },
                ].map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Customer */}
            <div className="bg-brand-gray-soft p-4 rounded-luxury space-y-1.5 text-xs">
              <p className="text-[9px] font-bold uppercase tracking-wider text-brand-black/40">Cliente</p>
              <p className="font-bold text-brand-black">{order.shippingAddress?.name || '—'}</p>
              <p className="text-brand-black/60">{order.shippingAddress?.email || '—'}</p>
              <p className="text-brand-black/60">{order.shippingAddress?.phone || '—'}</p>
            </div>

            {/* Shipping address */}
            <div className="bg-brand-gray-soft p-4 rounded-luxury space-y-1.5 text-xs">
              <p className="text-[9px] font-bold uppercase tracking-wider text-brand-black/40">Dirección de Envío</p>
              <p className="font-semibold text-brand-black">{order.shippingAddress?.address || '—'}</p>
              <p className="text-brand-black/60">{[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.postal_code].filter(Boolean).join(', ')}</p>
              {order.shippingAddress?.notes && <p className="text-brand-black/40 italic">Nota: {order.shippingAddress.notes}</p>}
            </div>

            {/* Items */}
            <div className="space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-brand-black/40">Productos ({order.items.reduce((s, i) => s + i.quantity, 0)} uds.)</p>
              <div className="border border-brand-black/5 rounded-luxury divide-y divide-brand-black/5 overflow-hidden">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 text-xs">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded border border-brand-black/5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-brand-black truncate">{item.name}</p>
                      <p className="text-brand-black/40 font-medium">${item.price.toFixed(2)} × {item.quantity}</p>
                    </div>
                    <span className="font-black text-brand-black shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-brand-black/5 pt-3 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-base text-brand-black pt-1">
                <span>Total</span><span>${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-brand-black/40 font-medium">
                <span>Método de pago</span><span className="capitalize">{order.paymentMethod || '—'}</span>
              </div>
            </div>

            {/* Tracking number */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-black/50">Número de Guía de Rastreo</label>
              <input
                value={tracking}
                onChange={e => onTrackingChange(e.target.value)}
                placeholder="Ej. 1Z999AA10123456784"
                className="w-full px-3 py-2.5 border border-brand-black/10 rounded-luxury text-xs font-mono bg-brand-white outline-none focus:border-brand-green-dark transition-all"
              />
            </div>

            {/* Admin notes */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-black/50">Notas Internas (solo admin)</label>
              <textarea
                value={notes}
                onChange={e => onNotesChange(e.target.value)}
                rows={3}
                placeholder="Notas sobre este pedido…"
                className="w-full px-3 py-2.5 border border-brand-black/10 rounded-luxury text-xs bg-brand-white outline-none focus:border-brand-green-dark transition-all resize-none"
              />
            </div>

            {/* Save button */}
            <button
              onClick={onSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-green-dark hover:bg-brand-black text-white text-xs font-bold rounded-luxury transition-all cursor-pointer disabled:opacity-40"
            >
              {saving ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando…</> : <><Save size={13} />Guardar Guía y Notas</>}
            </button>

            {/* Status history */}
            {history.length > 0 && (
              <div className="space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-brand-black/40 flex items-center gap-1.5"><History size={11} />Historial de Cambios de Estado</p>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[10px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-green-dark mt-1.5 shrink-0" />
                      <div>
                        <span className="font-bold text-brand-black">
                          {h.old_status ? `${scfg(h.old_status).label} → ` : ''}{scfg(h.new_status).label}
                        </span>
                        <span className="block text-brand-black/40 font-medium">{new Date(h.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// DB SETUP BANNER
// ============================================================================
const DBSetupBanner: React.FC = () => {
  const [copied, setCopied]     = useState(false);
  const [expanded, setExpanded] = useState(true);
  const sqlUrl = 'https://supabase.com/dashboard/project/bavarmytvyntpohimkqt/sql/new';
  const copyPath = () => { navigator.clipboard.writeText('SKINLY_SETUP.sql').then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-luxury overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-900">Configuración de Supabase requerida</p>
            <p className="text-[10px] text-amber-700 font-medium">Las tablas no tienen permisos. Ejecuta el SQL de setup una vez para activar todo.</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-amber-600 ml-4 shrink-0">{expanded ? 'Ocultar ▲' : 'Ver instrucciones ▼'}</span>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-amber-200">
          <ol className="text-[10px] font-semibold text-amber-800 space-y-1.5 list-decimal list-inside mt-3">
            <li>Abre el <a href={sqlUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline text-amber-900 hover:text-amber-700">SQL Editor de Supabase →</a></li>
            <li>Copia el contenido del archivo <button onClick={copyPath} className="inline-flex items-center gap-1 font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 hover:bg-amber-200 cursor-pointer transition-colors"><Terminal size={10} />SKINLY_SETUP.sql{copied ? <CheckCircle2 size={10} className="text-green-600" /> : <Copy size={10} />}</button> y pégalo.</li>
            <li>Haz clic en <strong>Run</strong> y recarga la página.</li>
          </ol>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {['✓ GRANTs en todas las tablas','✓ RLS policies correctas','✓ Bucket product-images creado','✓ Perfil admin con role=admin','✓ Catálogo visible a clientes','✓ Subida de imágenes habilitada'].map(item => (
              <span key={item} className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-1 rounded">{item}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MULTI-IMAGE UPLOADER
// ============================================================================
const MAX_IMAGES = 6;
const BUCKET = 'product-images';

interface ImageEntry { preview: string; file: File | null; isNew: boolean; }
interface MultiImageUploaderProps { entries: ImageEntry[]; onChange: (e: ImageEntry[]) => void; uploadError: string; onUploadError: (m: string) => void; compact?: boolean; }

const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({ entries, onChange, uploadError, onUploadError, compact = false }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    onUploadError('');
    const toAdd = Array.from(files).slice(0, MAX_IMAGES - entries.length);
    const newEntries: ImageEntry[] = [];
    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) { onUploadError('Solo imágenes (PNG, JPG, WEBP)'); continue; }
      if (file.size > 5 * 1024 * 1024) { onUploadError('Máx. 5 MB por imagen'); continue; }
      newEntries.push({ preview: URL.createObjectURL(file), file, isNew: true });
    }
    if (newEntries.length > 0) onChange([...entries, ...newEntries]);
  };

  const removeEntry = (idx: number) => {
    const entry = entries[idx];
    if (entry.isNew) URL.revokeObjectURL(entry.preview);
    onChange(entries.filter((_, i) => i !== idx));
  };

  const remaining = MAX_IMAGES - entries.length;

  return (
    <div className="space-y-2.5">
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {entries.map((entry, idx) => (
            <div key={idx} className="relative group aspect-square rounded-luxury overflow-hidden border border-brand-black/10 bg-brand-gray-soft">
              <img src={entry.preview} alt={`img-${idx}`} className="w-full h-full object-cover" />
              {idx === 0 && <span className="absolute top-1 left-1 text-[8px] font-extrabold bg-brand-green-dark text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">Principal</span>}
              {entry.isNew && idx > 0 && <span className="absolute top-1 left-1 text-[8px] font-bold bg-brand-black/60 text-white px-1 py-0.5 rounded-full">Nueva</span>}
              <button type="button" onClick={() => removeEntry(idx)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-brand-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all cursor-pointer shadow"><X size={10} /></button>
              <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-brand-black/50 text-white w-4 h-4 rounded-full flex items-center justify-center">{idx + 1}</span>
            </div>
          ))}
        </div>
      )}
      {entries.length < MAX_IMAGES && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full flex flex-col items-center gap-2 rounded-luxury border-2 border-dashed transition-all cursor-pointer select-none ${compact ? 'py-4' : 'py-7'} ${dragOver ? 'border-brand-green-dark bg-brand-green-dark/5' : 'border-brand-black/15 hover:border-brand-green-dark/40 hover:bg-brand-gray-soft/50'}`}
        >
          <div className={`rounded-full flex items-center justify-center transition-colors ${compact ? 'w-8 h-8' : 'w-11 h-11'} ${dragOver ? 'bg-brand-green-dark/15' : 'bg-brand-black/5'}`}>
            <ImagePlus size={compact ? 15 : 18} className={dragOver ? 'text-brand-green-dark' : 'text-brand-black/40'} />
          </div>
          <div className="text-center px-2">
            <span className={`block font-bold text-brand-black/60 ${compact ? 'text-[10px]' : 'text-xs'}`}>{dragOver ? 'Suelta aquí' : entries.length === 0 ? 'Arrastra imágenes o haz clic' : `Agregar más (${remaining} restante${remaining !== 1 ? 's' : ''})`}</span>
            <span className="block text-[9px] text-brand-black/30 font-medium mt-0.5">Hasta {MAX_IMAGES} imágenes · PNG · JPG · WEBP · 5 MB c/u</span>
          </div>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
      {uploadError && <p className="text-[10px] text-red-500 font-semibold">{uploadError}</p>}
      {entries.length === 0 && <p className="text-[10px] text-brand-black/30 font-medium">Opcional — el producto se guardará sin imágenes si no seleccionas ninguna.</p>}
      {entries.length === MAX_IMAGES && <p className="text-[10px] text-brand-green-dark font-semibold">Máximo de {MAX_IMAGES} imágenes alcanzado.</p>}
    </div>
  );
};

async function uploadImageEntries(entries: ImageEntry[]): Promise<string[]> {
  const urls: string[] = [];
  for (const entry of entries) {
    if (!entry.isNew || !entry.file) { urls.push(entry.preview); } else {
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}-${entry.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { data, error } = await supabase.storage.from(BUCKET).upload(path, entry.file, { cacheControl: '3600', upsert: false, contentType: entry.file.type });
      if (error) throw new Error(error.message);
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
      urls.push(publicUrl);
    }
  }
  return urls;
}

// ============================================================================
// PRODUCT ADD WIZARD
// ============================================================================
type FormErrors = Partial<Record<'name' | 'price' | 'stock' | 'ingredients' | 'image', string>>;

const ProductAddWizard: React.FC<{ onAdd: (prod: any) => void }> = ({ onAdd }) => {
  const { categories } = useApp();
  const [name, setName]             = useState('');
  const [desc, setDesc]             = useState('');
  const [benefits, setBenefits]     = useState('');
  const [howToUse, setHowToUse]     = useState('');
  const [price, setPrice]           = useState('');
  const [stock, setStock]           = useState('30');
  const [categoryId, setCategoryId] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([]);
  const [uploadError, setUploadError]   = useState('');
  const [errors, setErrors]             = useState<FormErrors>({});
  const [status, setStatus]             = useState<'idle' | 'uploading' | 'submitting' | 'success'>('idle');

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = 'El nombre es obligatorio';
    if (!price || Number(price) <= 0) errs.price = 'Ingresa un precio válido';
    if (!stock || Number(stock) < 1) errs.stock = 'Stock mínimo: 1 unidad';
    if (!ingredients.trim()) errs.ingredients = 'Agrega al menos un ingrediente';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setUploadError('');
    let imageUrls: string[] = [];
    if (imageEntries.length > 0) {
      setStatus('uploading');
      try { imageUrls = await uploadImageEntries(imageEntries); }
      catch (err: any) { setUploadError(`Error al subir imágenes: ${err.message}`); setStatus('idle'); return; }
    }
    setStatus('submitting');
    const cleanIngredients = ingredients.split(',').map(i => i.trim()).filter(Boolean);
    const categoryName = categories.find(c => c.id === categoryId)?.name ?? categoryId;
    await onAdd({ name: name.trim(), description: desc.trim() || `${name.trim()} es una formulación orgánica activa verificada.`, ingredients: cleanIngredients, benefits: benefits.trim(), howToUse: howToUse.trim(), category: categoryName, price: Number(price), stock: Number(stock), imageUrl: imageUrls[0] ?? '', images: imageUrls, isVerified: false, isFeatured: false });
    setName(''); setDesc(''); setBenefits(''); setHowToUse(''); setPrice(''); setIngredients(''); setStock('30'); setCategoryId('');
    imageEntries.forEach(e => { if (e.isNew) URL.revokeObjectURL(e.preview); });
    setImageEntries([]);
    setErrors({});
    setStatus('success');
    setTimeout(() => setStatus('idle'), 3500);
  };

  const isBusy = status === 'uploading' || status === 'submitting';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'success' && <div className="flex items-center gap-2 bg-brand-green-dark/10 border border-brand-green-dark/20 text-brand-green-dark text-[11px] font-bold px-3 py-2.5 rounded-luxury"><CheckCircle2 size={14} />¡Producto registrado en el catálogo!</div>}
      <div className="w-full">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5">Nombre del Producto <span className="text-red-400">*</span></label>
        <input value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }} placeholder="Crème Resurfacing de Bakuchiol" className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/35 ${errors.name ? 'border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'}`} />
        {errors.name && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.name}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5">Precio ($) <span className="text-red-400">*</span></label>
          <input type="number" min="1" step="0.5" value={price} onChange={e => { setPrice(e.target.value); setErrors(p => ({ ...p, price: undefined })); }} placeholder="62.00" className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/35 ${errors.price ? 'border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'}`} />
          {errors.price && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5">Stock Inicial <span className="text-red-400">*</span></label>
          <input type="number" min="1" value={stock} onChange={e => { setStock(e.target.value); setErrors(p => ({ ...p, stock: undefined })); }} placeholder="30" className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/35 ${errors.stock ? 'border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'}`} />
          {errors.stock && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.stock}</p>}
        </div>
      </div>
      <div className="w-full">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5">Categoría de Skincare</label>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-4 py-3 bg-brand-white border border-brand-black/10 focus:border-brand-green-dark rounded-luxury text-sm outline-none transition-all cursor-pointer">
          <option value="" disabled>— Selecciona una categoría —</option>
          {categories.length === 0 ? <option disabled>Cargando…</option> : categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>
      <div className="w-full">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5">Ingredientes Activos <span className="text-red-400">*</span> <span className="normal-case font-normal text-brand-black/35">(separados por coma)</span></label>
        <textarea rows={2} value={ingredients} onChange={e => { setIngredients(e.target.value); setErrors(p => ({ ...p, ingredients: undefined })); }} placeholder="Bakuchiol, Manteca de Karité, Coenzima Q10..." className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/35 resize-none ${errors.ingredients ? 'border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'}`} />
        {errors.ingredients && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.ingredients}</p>}
      </div>
      <TextArea label="Descripción" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe brevemente el producto..." rows={2} />
      <div className="w-full">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5">Beneficios <span className="normal-case font-normal text-brand-black/35">(un beneficio por línea)</span></label>
        <textarea rows={2} value={benefits} onChange={e => setBenefits(e.target.value)} placeholder={"Hidratación profunda 24 horas\nReduce líneas de expresión"} className="w-full px-4 py-3 bg-brand-white border border-brand-black/10 focus:border-brand-green-dark rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/35 resize-none" />
      </div>
      <div className="w-full">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5">Modo de Aplicación <span className="normal-case font-normal text-brand-black/35">(un paso por línea)</span></label>
        <textarea rows={2} value={howToUse} onChange={e => setHowToUse(e.target.value)} placeholder={"Limpia el rostro con agua tibia\nAplica 2-3 gotas en piel húmeda"} className="w-full px-4 py-3 bg-brand-white border border-brand-black/10 focus:border-brand-green-dark rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/35 resize-none" />
      </div>
      <div className="border-t border-brand-black/5 pt-3 space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">Imágenes del Producto <span className="normal-case font-normal text-brand-black/35">(hasta {MAX_IMAGES})</span></label>
        <MultiImageUploader entries={imageEntries} onChange={setImageEntries} uploadError={uploadError} onUploadError={setUploadError} />
      </div>
      <Button type="submit" variant="primary" fullWidth disabled={isBusy} className="py-3 text-xs tracking-wider">
        {status === 'uploading' ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Subiendo imágenes…</span>
          : status === 'submitting' ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando producto…</span>
          : 'Agregar al Catálogo'}
      </Button>
    </form>
  );
};

// ============================================================================
// PRODUCT EDIT WIZARD
// ============================================================================
const ProductEditWizard: React.FC<{ product: Product; onSave: (p: Product) => Promise<void>; onCancel: () => void }> = ({ product, onSave, onCancel }) => {
  const { categories } = useApp();
  const safeIngredients = (() => { const raw = product.ingredients; if (!raw) return ''; if (Array.isArray(raw)) return raw.join(', '); return String(raw); })();
  const initEntries: ImageEntry[] = (Array.isArray(product.images) && product.images.length > 0 ? product.images : product.imageUrl ? [product.imageUrl] : []).map(url => ({ preview: url, file: null, isNew: false }));
  const initCategoryId = () => { const match = categories.find(c => c.name === product.category); return match ? match.id : ''; };

  const [name, setName]           = useState(product.name ?? '');
  const [desc, setDesc]           = useState(product.description ?? '');
  const [benefits, setBenefits]   = useState(product.benefits ?? '');
  const [howToUse, setHowToUse]   = useState(product.howToUse ?? '');
  const [price, setPrice]         = useState(product.price != null ? String(product.price) : '');
  const [stock, setStock]         = useState(product.stock != null ? String(product.stock) : '0');
  const [categoryId, setCategoryId] = useState(initCategoryId);
  const [ingredients, setIngredients] = useState(safeIngredients);
  const [isFeatured, setIsFeatured]   = useState(product.isFeatured ?? false);
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>(initEntries);
  const [uploadError, setUploadError]   = useState('');
  const [status, setStatus]             = useState<'idle' | 'uploading' | 'saving'>('idle');

  React.useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      const match = categories.find(c => c.name === product.category);
      if (match) setCategoryId(match.id);
    }
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || Number(price) <= 0 || Number(stock) < 0) return;
    setUploadError('');
    let imageUrls: string[] = [];
    if (imageEntries.length > 0) {
      const hasNew = imageEntries.some(e => e.isNew);
      if (hasNew) setStatus('uploading');
      try { imageUrls = await uploadImageEntries(imageEntries); }
      catch (err: any) { setUploadError(`Error al subir imágenes: ${err.message}`); setStatus('idle'); return; }
    }
    setStatus('saving');
    const categoryName = categories.find(c => c.id === categoryId)?.name ?? product.category;
    await onSave({ ...product, name: name.trim(), description: desc.trim(), benefits: benefits.trim(), howToUse: howToUse.trim(), price: Number(price), stock: Number(stock), category: categoryName, ingredients: ingredients.split(',').map(i => i.trim()).filter(Boolean), imageUrl: imageUrls[0] ?? product.imageUrl ?? '', images: imageUrls.length > 0 ? imageUrls : (product.images ?? []), isFeatured });
    setStatus('idle');
  };

  const isBusy = status !== 'idle';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div><label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">Nombre *</label><input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">Precio ($) *</label><input type="number" min="0.5" step="0.5" value={price} onChange={e => setPrice(e.target.value)} required className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all" /></div>
        <div><label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">Stock *</label><input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} required className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all" /></div>
      </div>
      <div><label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">Categoría</label>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all cursor-pointer">
          <option value="" disabled>— Selecciona —</option>
          {categories.length === 0 ? <option disabled>Cargando…</option> : categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>
      <div><label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">Ingredientes <span className="normal-case font-normal text-brand-black/30">(coma separados)</span></label><textarea rows={2} value={ingredients} onChange={e => setIngredients(e.target.value)} className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all resize-none" /></div>
      <div><label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">Descripción</label><textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all resize-none" /></div>
      <div><label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">Beneficios <span className="normal-case font-normal text-brand-black/30">(un beneficio por línea)</span></label><textarea rows={2} value={benefits} onChange={e => setBenefits(e.target.value)} className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all resize-none" /></div>
      <div><label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">Modo de Aplicación <span className="normal-case font-normal text-brand-black/30">(un paso por línea)</span></label><textarea rows={2} value={howToUse} onChange={e => setHowToUse(e.target.value)} className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all resize-none" /></div>
      <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
        <div onClick={() => setIsFeatured(f => !f)} className={`relative w-9 h-5 rounded-full transition-colors border ${isFeatured ? 'bg-amber-400 border-amber-400' : 'bg-brand-black/10 border-brand-black/10'}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isFeatured ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-xs font-semibold text-brand-black/70">{isFeatured ? '⭐ Producto Destacado' : 'Marcar como Destacado'}</span>
      </label>
      <div className="border-t border-brand-black/5 pt-3 space-y-1.5">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60">Imágenes <span className="normal-case font-normal text-brand-black/30">(hasta {MAX_IMAGES})</span></label>
        <MultiImageUploader entries={imageEntries} onChange={setImageEntries} uploadError={uploadError} onUploadError={setUploadError} compact />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={isBusy} className="flex-1 py-2.5 text-xs font-bold border border-brand-black/10 rounded-luxury text-brand-black/60 hover:border-brand-black/20 hover:text-brand-black transition-all cursor-pointer disabled:opacity-40">Cancelar</button>
        <button type="submit" disabled={isBusy} className="flex-1 py-2.5 text-xs font-bold bg-brand-green-dark text-white rounded-luxury hover:bg-brand-black transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5">
          {status === 'uploading' ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Subiendo…</>
            : status === 'saving' ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando…</>
            : <><CheckCircle2 size={12} />Guardar Cambios</>}
        </button>
      </div>
    </form>
  );
};

// ============================================================================
// COUPON ADD FORM
// ============================================================================
const CouponAddForm: React.FC = () => {
  const { addCoupon } = useApp();
  const [code, setCode]           = useState('');
  const [discount, setDiscount]   = useState('10');
  const [maxUses, setMaxUses]     = useState('0');
  const [expiresAt, setExpiresAt] = useState('');
  const [success, setSuccess]     = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    await addCoupon({ code: code.trim().toUpperCase(), discountPercentage: Number(discount), isActive: true, usageCount: 0, maxUses: Number(maxUses), expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined });
    setCode(''); setDiscount('10'); setMaxUses('0'); setExpiresAt('');
    setLoading(false); setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const fc = "w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all";
  const lc = "block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {success && <span className="block text-[10px] text-brand-green-dark font-bold">🎉 ¡Cupón creado exitosamente!</span>}
      <div><label className={lc}>Código del Cupón *</label><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="VERANO25" required className={fc} /></div>
      <div><label className={lc}>Descuento (%)</label><input type="number" min="1" max="80" value={discount} onChange={e => setDiscount(e.target.value)} className={fc} /></div>
      <div><label className={lc}>Máximo de Usos <span className="normal-case font-normal text-brand-black/30">(0 = ilimitado)</span></label><input type="number" min="0" value={maxUses} onChange={e => setMaxUses(e.target.value)} className={fc} /></div>
      <div><label className={lc}>Fecha de Expiración <span className="normal-case font-normal text-brand-black/30">(opcional)</span></label><input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} min={new Date().toISOString().split('T')[0]} className={fc} /></div>
      <Button type="submit" variant="secondary" fullWidth disabled={loading} className="py-2.5 text-xs">{loading ? 'Guardando...' : 'Crear Cupón'}</Button>
    </form>
  );
};

// ============================================================================
// STOREFRONT CUSTOMIZE FORM
// ============================================================================
const StorefrontCustomizeForm: React.FC<{ banner: { title: string; subtitle: string; ctaText: string; imageUrl: string }; onSave: (b: any) => void }> = ({ banner, onSave }) => {
  const [title, setTitle]   = useState(banner.title);
  const [sub, setSub]       = useState(banner.subtitle);
  const [cta, setCta]       = useState(banner.ctaText);
  const [imgUrl, setImgUrl] = useState(banner.imageUrl);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ title, subtitle: sub, ctaText: cta, imageUrl: imgUrl }); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Título del Banner de Marketing" value={title} onChange={e => setTitle(e.target.value)} required />
      <TextArea label="Descripción del Subtítulo" value={sub} onChange={e => setSub(e.target.value)} required />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Texto del Botón CTA" value={cta} onChange={e => setCta(e.target.value)} required />
        <Input label="URL de Imagen del Banner" value={imgUrl} onChange={e => setImgUrl(e.target.value)} required />
      </div>
      <div className="pt-2 flex justify-end">
        <Button type="submit" variant="primary" className="px-6 py-2.5 text-xs">Guardar Banner de Inicio</Button>
      </div>
    </form>
  );
};
