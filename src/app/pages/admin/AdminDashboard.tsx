import React, { useState, useRef } from 'react';
import { useApp, Product, Coupon, Order, User } from '../../context/AppContext';
import { supabase } from '../../../supabase';
import { Button, Input, Select, TextArea } from '../../components/UI';
import {
  ShieldCheck, ShieldAlert, BarChart3, Package, Truck,
  Award, Ticket, Trash2, CheckCircle2,
  Layers, UserCheck, Plus, Settings, DollarSign,
  FileText, Terminal, Copy, AlertTriangle, ImagePlus, X,
  Pencil, Star, StarOff
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser, products, orders, coupons, supplierApplications,
    registeredUsers, affiliateProfiles, addProduct, editProduct,
    deleteProduct, reviewSupplierApplication, featuredBanner, setFeaturedBanner,
    addCoupon, updateOrderStatus, dbSetupRequired
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'suppliers' | 'coupons' | 'customizer'>('overview');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Guardia de seguridad - ¡DEBE ser rol admin!
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

  // CÁLCULO DE ESTADÍSTICAS DE LA PLATAFORMA
  const totalRevenue = orders
    .filter(o => o.status !== 'refunded')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalProductsCount = products.length;
  const activeSuppliers = registeredUsers.filter(u => u.role === 'supplier').length;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      shipped: 'Enviado',
      delivered: 'Entregado',
      refunded: 'Reembolsado'
    };
    return labels[status] || status;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8 text-left">

      {/* ── DB Setup Required Banner ─────────────────────────────── */}
      {dbSetupRequired && <DBSetupBanner />}

      {/* Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-black/5">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-bold text-brand-black flex items-center gap-2">
            <ShieldCheck size={28} className="text-brand-green-dark" />
            Centro de Control
          </h1>
          <p className="text-xs text-brand-black/40 font-medium">Gestiona auditorías de inventario, certificaciones de laboratorio, pedidos y pagos de afiliados.</p>
        </div>

        {/* Botones de pestañas */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {[
            { id: 'overview' as const, label: 'Analíticas', icon: BarChart3 },
            { id: 'products' as const, label: 'Catálogo', icon: Package },
            { id: 'orders' as const, label: 'Pedidos', icon: Truck },
            { id: 'suppliers' as const, label: 'Auditorías Lab', icon: Award },
            { id: 'coupons' as const, label: 'Cupones', icon: Ticket },
            { id: 'customizer' as const, label: 'Personalizar', icon: Settings }
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-luxury transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-brand-black text-brand-white'
                    : 'bg-brand-white text-brand-black/60 border border-brand-black/5 hover:border-brand-black/10'
                }`}
              >
                <TabIcon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MÉTRICAS CLAVE DE RENDIMIENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat 1: Ingresos */}
        <div className="bg-brand-white p-5 rounded-luxury border border-brand-black/5 shadow-sm space-y-1 relative">
          <div className="flex justify-between items-center text-brand-black/50 text-[10px] uppercase font-bold tracking-wider">
            <span>Ingresos Totales</span>
            <DollarSign size={15} />
          </div>
          <span className="text-2xl font-black text-brand-black block">
            ${totalRevenue.toFixed(2)}
          </span>
          <span className="text-[9px] text-brand-green-dark font-semibold">Excluye reembolsos</span>
        </div>

        {/* Stat 2: Pedidos Activos */}
        <div className="bg-brand-white p-5 rounded-luxury border border-brand-black/5 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-brand-black/50 text-[10px] uppercase font-bold tracking-wider">
            <span>Pendientes de Envío</span>
            <Truck size={15} />
          </div>
          <span className="text-2xl font-black text-brand-black block">
            {pendingOrders} pedidos
          </span>
          <span className="text-[9px] text-brand-black/40 font-semibold">Requieren despacho</span>
        </div>

        {/* Stat 3: Productos */}
        <div className="bg-brand-white p-5 rounded-luxury border border-brand-black/5 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-brand-black/50 text-[10px] uppercase font-bold tracking-wider">
            <span>Catálogo Skincare</span>
            <Layers size={15} />
          </div>
          <span className="text-2xl font-black text-brand-black block">
            {totalProductsCount} artículos
          </span>
          <span className="text-[9px] text-brand-black/40 font-semibold">Serums y Cremas</span>
        </div>

        {/* Stat 4: Proveedores */}
        <div className="bg-brand-white p-5 rounded-luxury border border-brand-black/5 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-brand-black/50 text-[10px] uppercase font-bold tracking-wider">
            <span>Proveedores Certificados</span>
            <UserCheck size={15} />
          </div>
          <span className="text-2xl font-black text-brand-black block">
            {activeSuppliers} labs
          </span>
          <span className="text-[9px] text-brand-green-dark font-semibold">Bio-extracción sostenible</span>
        </div>

      </div>

      {/* CONTENIDO DETALLADO POR PESTAÑAS */}
      <div>
        
        {/* ====================================================================
            PESTAÑA 1: ANALÍTICAS
            ==================================================================== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Izquierda: Gráfica de ingresos (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Gráfica SVG de analíticas premium */}
              <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-brand-black/5">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black">Analíticas de Ingresos</h3>
                    <p className="text-[10px] text-brand-black/40">Conversiones semanales de la plataforma</p>
                  </div>
                  <span className="text-xs font-bold text-brand-green-dark bg-brand-green-dark/10 px-2 py-0.5 rounded-full">+18.5% esta semana</span>
                </div>

                {/* Barras de gráfica HTML/SVG */}
                <div className="h-64 flex items-end justify-between pt-6 border-b border-brand-black/10 px-4">
                  {[
                    { day: 'Lun', sales: 120 },
                    { day: 'Mar', sales: 180 },
                    { day: 'Mié', sales: 90 },
                    { day: 'Jue', sales: 240 },
                    { day: 'Vie', sales: 310 },
                    { day: 'Sáb', sales: 420 },
                    { day: 'Dom', sales: 380 }
                  ].map((item, idx) => {
                    const heightPercent = `${Math.round((item.sales / 450) * 100)}%`;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="w-8 sm:w-10 bg-brand-black hover:bg-brand-green-dark rounded-t-md transition-all duration-500 relative" style={{ height: heightPercent }}>
                          {/* Tooltip */}
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-brand-black text-brand-white text-[9px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow border border-brand-white/10">
                            ${item.sales}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-brand-black/40 uppercase tracking-wide">
                          {item.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Derecha: Registro de actividad reciente (1/3) */}
            <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5">
                Actividad Reciente de Compras
              </h3>

              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                {orders.map((o) => (
                  <div key={o.id} className="flex justify-between items-start text-xs border-b border-brand-black/5 pb-3 last:border-0 last:pb-0">
                    <div className="space-y-0.5">
                      <span className="font-bold text-brand-black block truncate max-w-[120px]">{o.customerName}</span>
                      <span className="text-[10px] text-brand-black/40 block font-mono">{o.id.toUpperCase()}</span>
                      {o.couponCode && (
                        <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded w-fit mt-0.5">
                          Cupón: {o.couponCode}
                        </span>
                      )}
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="font-extrabold text-brand-black block">${o.total.toFixed(2)}</span>
                      <span className={`text-[9px] font-extrabold uppercase tracking-wide block ${
                        o.status === 'delivered' ? 'text-brand-green-dark' : o.status === 'pending' ? 'text-amber-600 animate-pulse' : 'text-brand-black'
                      }`}>
                        {getStatusLabel(o.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ====================================================================
            PESTAÑA 2: GESTIÓN DEL CATÁLOGO DE PRODUCTOS
            ==================================================================== */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Lista de productos (2/3) ── */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-brand-white p-4 rounded-luxury border border-brand-black/5 shadow-sm font-semibold flex justify-between items-center text-xs text-brand-black/50">
                <span>Catálogo Activo ({products.length} formulaciones)</span>
                <span>{products.filter(p => p.isFeatured).length} destacados</span>
              </div>

              <div className="bg-brand-white border border-brand-black/5 rounded-luxury divide-y divide-brand-black/5 overflow-hidden">
                {products.length === 0 && (
                  <p className="text-xs italic text-brand-black/40 text-center py-10">No hay productos registrados aún.</p>
                )}
                {products.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 sm:p-5 flex gap-4 text-xs items-center justify-between text-left transition-colors ${
                      editingProduct?.id === p.id ? 'bg-brand-green-dark/5 border-l-2 border-brand-green-dark' : ''
                    }`}
                  >
                    {/* Imagen + info */}
                    <div className="flex gap-3 items-center min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={p.imageUrl || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=100'}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-luxury border border-brand-black/5 bg-brand-gray-soft"
                        />
                        {p.isFeatured && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow">
                            <Star size={8} className="fill-white text-white" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <h4 className="font-heading text-sm font-bold text-brand-black truncate max-w-[140px] sm:max-w-[220px]">{p.name}</h4>
                        <span className="block text-[10px] text-brand-black/35 font-semibold tracking-wider uppercase">{p.category}</span>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {/* Featured toggle */}
                          <button
                            onClick={() => editProduct({ ...p, isFeatured: !p.isFeatured })}
                            title={p.isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
                            className={`flex items-center gap-1 px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full tracking-wide border transition-all cursor-pointer ${
                              p.isFeatured
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-brand-gray-soft text-brand-black/40 border-brand-black/5 hover:border-amber-300 hover:text-amber-600'
                            }`}
                          >
                            {p.isFeatured ? <Star size={8} className="fill-amber-500 text-amber-500" /> : <StarOff size={8} />}
                            {p.isFeatured ? 'Destacado' : 'Destacar'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Precio, stock y acciones */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="font-black text-brand-black block text-sm">${p.price.toFixed(2)}</span>
                        <span className={`block text-[10px] font-bold ${p.stock <= 15 ? 'text-red-500' : 'text-brand-black/40'}`}>
                          {p.stock} uds.
                        </span>
                      </div>
                      {/* Edit */}
                      <button
                        onClick={() => setEditingProduct(editingProduct?.id === p.id ? null : p)}
                        title="Editar producto"
                        className={`p-1.5 rounded-luxury transition-colors cursor-pointer border ${
                          editingProduct?.id === p.id
                            ? 'bg-brand-green-dark text-white border-brand-green-dark'
                            : 'text-brand-black/40 border-brand-black/8 hover:text-brand-green-dark hover:border-brand-green-dark/30'
                        }`}
                      >
                        <Pencil size={13} />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar "${p.name}"?`)) deleteProduct(p.id);
                        }}
                        title="Eliminar producto"
                        className="p-1.5 text-brand-black/30 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Panel derecho: Agregar o Editar (1/3) ── */}
            <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-6 text-left h-fit sticky top-4">
              {editingProduct ? (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-brand-black/5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black flex items-center gap-1.5">
                      <Pencil size={13} className="text-brand-green-dark" />
                      Editar Producto
                    </h3>
                    <button
                      onClick={() => setEditingProduct(null)}
                      className="text-brand-black/30 hover:text-brand-black transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <ProductEditWizard
                    product={editingProduct}
                    onSave={async (prodData) => {
                      await editProduct(prodData);
                      setEditingProduct(null);
                    }}
                    onCancel={() => setEditingProduct(null)}
                  />
                </>
              ) : (
                <>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5 flex items-center gap-1.5">
                    <Plus size={14} />
                    Registrar Nuevo Producto
                  </h3>
                  <ProductAddWizard onAdd={(prodData) => addProduct(prodData)} />
                </>
              )}
            </div>

          </div>
        )}

        {/* ====================================================================
            PESTAÑA 3: GESTIÓN DE PEDIDOS
            ==================================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-brand-white p-4 rounded-luxury border border-brand-black/5 shadow-sm flex justify-between items-center text-xs font-bold text-brand-black/50">
              <span>{orders.length} pedidos en total</span>
              <span>{orders.filter(o => o.status === 'pending').length} pendientes de despacho</span>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs italic text-brand-black/40 text-center py-14 bg-brand-white rounded-luxury border border-brand-black/5">
                No hay pedidos registrados aún.
              </p>
            ) : (
              <div className="bg-brand-white border border-brand-black/5 rounded-luxury overflow-hidden">
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[1fr_1.4fr_0.8fr_0.7fr_1.1fr] gap-4 px-5 py-3 bg-brand-gray-soft border-b border-brand-black/5 text-[10px] font-extrabold uppercase tracking-wider text-brand-black/40">
                  <span>Pedido / Fecha</span>
                  <span>Cliente</span>
                  <span>Total</span>
                  <span>Artículos</span>
                  <span>Estado</span>
                </div>

                <div className="divide-y divide-brand-black/5">
                  {orders.map((o) => {
                    // Resolve email from registeredUsers using customerId
                    const userRecord = registeredUsers.find(u => u.id === o.customerId);
                    const email = o.customerEmail || userRecord?.email || '—';
                    const shortId = o.id.slice(0, 8).toUpperCase();

                    const statusConfig: Record<string, { label: string; cls: string }> = {
                      pending:   { label: 'Pendiente',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                      shipped:   { label: 'Enviado',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
                      delivered: { label: 'Entregado',   cls: 'bg-brand-green-dark/10 text-brand-green-dark border-brand-green-dark/20' },
                      refunded:  { label: 'Reembolsado', cls: 'bg-red-50 text-red-700 border-red-200' },
                    };
                    const sc = statusConfig[o.status] ?? statusConfig.pending;

                    return (
                      <div key={o.id} className="px-5 py-4 grid grid-cols-1 md:grid-cols-[1fr_1.4fr_0.8fr_0.7fr_1.1fr] gap-3 md:gap-4 text-xs items-center">

                        {/* ID + fecha */}
                        <div className="space-y-0.5">
                          <span className="font-mono font-black text-brand-green-dark text-[11px] block">#{shortId}</span>
                          <span className="text-[10px] text-brand-black/40 font-semibold block">
                            {new Date(o.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Cliente */}
                        <div className="space-y-0.5 min-w-0">
                          <span className="font-bold text-brand-black block truncate">{o.customerName}</span>
                          <span className="text-[10px] text-brand-black/40 block truncate">{email}</span>
                          <span className="text-[10px] text-brand-black/30 block truncate">{o.city}</span>
                        </div>

                        {/* Total */}
                        <div className="space-y-0.5">
                          <span className="font-black text-brand-black text-sm block">${o.total.toFixed(2)}</span>
                          {o.couponCode && (
                            <span className="text-[9px] font-bold text-indigo-500 block">
                              -{o.couponCode}
                            </span>
                          )}
                        </div>

                        {/* Items count */}
                        <div>
                          <span className="text-brand-black/60 font-semibold">
                            {o.items.reduce((s, i) => s + i.quantity, 0)} uds.
                          </span>
                        </div>

                        {/* Estado */}
                        <div className="flex flex-col gap-1.5 items-start md:items-end">
                          <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide rounded-full border ${sc.cls}`}>
                            {sc.label}
                          </span>
                          <select
                            value={o.status}
                            onChange={async (e) => {
                              await updateOrderStatus(o.id, e.target.value as any);
                            }}
                            className="text-[10px] font-semibold border border-brand-black/10 rounded-luxury px-2 py-1 bg-brand-white text-brand-black/70 outline-none focus:border-brand-green-dark cursor-pointer transition-colors"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregado</option>
                            <option value="refunded">Reembolsado</option>
                          </select>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            PESTAÑA 4: AUDITORÍAS DE PROVEEDORES DE LABORATORIO
            ==================================================================== */}
        {activeTab === 'suppliers' && (
          <div className="bg-brand-white border border-brand-black/5 rounded-luxury overflow-hidden">
            <div className="p-4 bg-brand-gray-soft flex justify-between items-center text-xs font-bold text-brand-black/50 border-b border-brand-black/5">
              <span>Solicitudes de proveedores de bio-laboratorio</span>
              <span>Auditorías de Certificaciones de Compuestos Orgánicos</span>
            </div>

            {supplierApplications.length > 0 ? (
              <div className="divide-y divide-brand-black/5">
                {supplierApplications.map((app) => (
                  <div key={app.id} className="p-6 text-xs text-left space-y-4">
                    
                    {/* Encabezado de metadatos de identidad */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-brand-black/40 uppercase block">Marca de Laboratorio</span>
                        <h4 className="font-heading text-base font-bold text-brand-black">{app.companyName}</h4>
                        <span className="text-[10px] text-brand-black/40 font-semibold uppercase tracking-wider block mt-0.5">Enviado: {app.createdAt}</span>
                      </div>

                      <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide rounded-full border ${
                        app.status === 'approved' 
                          ? 'bg-brand-green-dark/15 text-brand-green-dark border-brand-green-dark/20' 
                          : app.status === 'rejected' 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-amber-50 text-amber-800 border-amber-200/50 animate-pulse'
                      }`}>
                        {app.status === 'approved' ? 'Aprobado' : app.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </div>

                    {/* Descripción de ingredientes */}
                    <div className="bg-brand-gray-soft p-4 rounded-luxury border border-brand-black/5 space-y-2 leading-relaxed">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-brand-black/40 block">Auditoría de Ingredientes y Origen</span>
                      <p className="text-brand-black/75 font-medium">{app.ingredientsDescription}</p>
                      
                      <div className="flex items-center gap-1.5 text-brand-green-dark font-bold pt-1.5 border-t border-brand-black/5 mt-2">
                        <FileText size={13} />
                        <span className="hover:underline cursor-pointer" onClick={() => alert('Simulación de PDF de auditoría: compuestos botánicos activos validados.')}>
                          Certificado de auditoría: organic_compound_lab_results.pdf
                        </span>
                      </div>
                    </div>

                    {/* Botones de decisión de la solicitud */}
                    {app.status === 'pending' && (
                      <div className="flex justify-end gap-2.5">
                        <button
                          onClick={() => {
                            reviewSupplierApplication(app.id, false, 'Los documentos adjuntos carecían del sello oficial de certificación orgánica.');
                            alert('Solicitud de proveedor rechazada exitosamente.');
                          }}
                          className="px-4 py-2 bg-transparent hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-luxury cursor-pointer transition-colors"
                        >
                          Rechazar Laboratorio
                        </button>
                        
                        <button
                          onClick={() => {
                            reviewSupplierApplication(app.id, true);
                            alert('¡Solicitud de proveedor verificada y aprobada! Rol de cuenta de laboratorio actualizado a Proveedor Certificado.');
                          }}
                          className="px-4 py-2 bg-brand-green-dark hover:bg-brand-black text-brand-white text-xs font-bold rounded-luxury cursor-pointer transition-all duration-300"
                        >
                          Verificar y Aprobar Laboratorio
                        </button>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-brand-black/40 text-center py-10">No hay solicitudes de verificación de proveedores registradas en este momento.</p>
            )}
          </div>
        )}

        {/* ====================================================================
            PESTAÑA 5: GESTIÓN DE AFILIADOS Y CUPONES
            ==================================================================== */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            
            {/* Lista de cupones (2/3) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-brand-white p-4 rounded-luxury border border-brand-black/5 shadow-sm text-xs font-bold text-brand-black/50 flex justify-between items-center">
                <span>Lista de Cupones de Referido Activos</span>
                <span>Registro de Comisiones de Afiliados</span>
              </div>

              <div className="bg-brand-white border border-brand-black/5 rounded-luxury divide-y divide-brand-black/5 overflow-hidden">
                {coupons.map((c: Coupon) => (
                  <div key={c.code} className="p-4 sm:p-5 flex justify-between items-center text-xs">
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-brand-green-dark tracking-wide">{c.code}</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wide bg-brand-green-light text-brand-black px-2 py-0.5 rounded">
                          -{c.discountPercentage}% DTO
                        </span>
                      </div>
                      <span className="text-[10px] text-brand-black/40 font-semibold block uppercase">
                        {c.affiliateId ? `Referencia Afiliado: ${c.affiliateId}` : 'Cupón General de Plataforma'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block font-bold text-brand-black">{c.usageCount} usos en pagos</span>
                      <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full border mt-1 inline-block ${
                        c.isActive 
                          ? 'bg-brand-green-dark/15 text-brand-green-dark border-brand-green-dark/20' 
                          : 'bg-brand-gray-soft text-brand-black/30'
                      }`}>
                        {c.isActive ? 'Activo' : 'Vencido'}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Formulario para agregar cupón (1/3) */}
            <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-5 h-fit">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5">
                Agregar Código de Cupón
              </h3>

              <CouponAddForm />
            </div>

          </div>
        )}

        {/* ====================================================================
            PESTAÑA 6: PERSONALIZADOR DEL BANNER DE INICIO
            ==================================================================== */}
        {activeTab === 'customizer' && (
          <div className="max-w-2xl bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 shadow-sm space-y-6 text-left">
            <div className="border-b border-brand-black/5 pb-3 space-y-1">
              <h2 className="font-heading text-xl font-bold text-brand-black flex items-center gap-2">
                <Settings className="text-brand-green-dark" size={18} />
                Personalizar Banner de Inicio
              </h2>
              <p className="text-[11px] text-brand-black/50 leading-relaxed font-semibold">
                Modifica el contenido de marketing destacado en tiempo real. Los cambios se aplican instantáneamente en el dashboard de inicio del consumidor.
              </p>
            </div>

            <StorefrontCustomizeForm 
              banner={featuredBanner} 
              onSave={(banner) => {
                setFeaturedBanner(banner);
                alert('¡Banner de inicio actualizado exitosamente!');
              }} 
            />
          </div>
        )}

      </div>

    </div>
  );
};

// ============================================================================
// COMPONENTE AUXILIAR - DB SETUP BANNER
// ============================================================================
const DBSetupBanner: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const sqlUrl = 'https://supabase.com/dashboard/project/bavarmytvyntpohimkqt/sql/new';

  const copyPath = () => {
    navigator.clipboard.writeText('SKINLY_SETUP.sql').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-luxury overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-900">Configuración de Supabase requerida</p>
            <p className="text-[10px] text-amber-700 font-medium">
              Las tablas no tienen permisos. Ejecuta el SQL de setup una vez para activar el catálogo, storage y autenticación completa.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-amber-600 ml-4 shrink-0">{expanded ? 'Ocultar ▲' : 'Ver instrucciones ▼'}</span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-amber-200">
          {/* Steps */}
          <ol className="text-[10px] font-semibold text-amber-800 space-y-1.5 list-decimal list-inside mt-3">
            <li>
              Abre el{' '}
              <a href={sqlUrl} target="_blank" rel="noopener noreferrer"
                className="font-bold underline text-amber-900 hover:text-amber-700">
                SQL Editor de Supabase →
              </a>
            </li>
            <li>
              Copia el contenido del archivo{' '}
              <button onClick={copyPath} className="inline-flex items-center gap-1 font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 hover:bg-amber-200 cursor-pointer transition-colors">
                <Terminal size={10} />
                SKINLY_SETUP.sql
                {copied ? <CheckCircle2 size={10} className="text-green-600" /> : <Copy size={10} />}
              </button>
              {' '}(raíz del proyecto) y pégalo en el editor.
            </li>
            <li>Haz clic en <strong>Run</strong> y recarga la página.</li>
          </ol>

          {/* What it fixes */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              '✓ GRANTs en todas las tablas',
              '✓ RLS policies correctas',
              '✓ Bucket product-images creado',
              '✓ Perfil admin con role=admin',
              '✓ Catálogo visible a clientes',
              '✓ Subida de imágenes habilitada'
            ].map(item => (
              <span key={item} className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-1 rounded">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE AUXILIAR - FORMULARIO PARA AGREGAR PRODUCTOS
// ============================================================================
type FormErrors = Partial<Record<'name' | 'price' | 'stock' | 'ingredients' | 'image', string>>;

const BUCKET = 'product-images';

const ProductAddWizard: React.FC<{ onAdd: (prod: any) => void }> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('30');
  const [category, setCategory] = useState('Serums');
  const [ingredients, setIngredients] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'uploading' | 'submitting' | 'success'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = 'El nombre es obligatorio';
    if (!price || Number(price) <= 0) errs.price = 'Ingresa un precio válido';
    if (!stock || Number(stock) < 1) errs.stock = 'Stock mínimo: 1 unidad';
    if (!ingredients.trim()) errs.ingredients = 'Agrega al menos un ingrediente';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Solo se permiten imágenes (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('El archivo supera el límite de 5 MB');
      return;
    }
    setUploadError('');
    setImageFile(file);
    // Revoke previous blob URL to avoid memory leaks
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    // Reset input so the same file can be re-selected if needed
    e.target.value = '';
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
    setUploadError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setUploadError('');
    let imageUrl = '';
    let imageUrls: string[] = [];

    // ── Step 1: Upload image if selected ───────────────────────
    if (imageFile) {
      setStatus('uploading');
      const ext = imageFile.name.split('.').pop() || 'jpg';
      const path = `products/${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { data, error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, imageFile, { cacheControl: '3600', upsert: false, contentType: imageFile.type });

      if (uploadErr) {
        setUploadError(`Error al subir imagen: ${uploadErr.message}`);
        setStatus('idle');
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
      imageUrl = publicUrl;
      imageUrls = [publicUrl];
    }

    // ── Step 2: Save product ────────────────────────────────────
    setStatus('submitting');
    const cleanIngredients = ingredients
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    await onAdd({
      name: name.trim(),
      description: desc.trim() || `${name.trim()} es una formulación orgánica activa verificada para la salud dérmica.`,
      ingredients: cleanIngredients,
      category,
      price: Number(price),
      stock: Number(stock),
      imageUrl,          // empty string is fine — column allows null
      images: imageUrls, // empty array is fine
      isVerified: false,
      isFeatured: false
    });

    // ── Step 3: Reset form ──────────────────────────────────────
    setName('');
    setDesc('');
    setPrice('');
    setIngredients('');
    setStock('30');
    setCategory('Serums');
    clearImage();
    setErrors({});
    setStatus('success');
    setTimeout(() => setStatus('idle'), 3500);
  };

  const isBusy = status === 'uploading' || status === 'submitting';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Success banner */}
      {status === 'success' && (
        <div className="flex items-center gap-2 bg-brand-green-dark/10 border border-brand-green-dark/20 text-brand-green-dark text-[11px] font-bold px-3 py-2.5 rounded-luxury">
          <CheckCircle2 size={14} />
          ¡Producto registrado en el catálogo!
        </div>
      )}

      {/* Name */}
      <div className="w-full">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5">
          Nombre del Producto <span className="text-red-400">*</span>
        </label>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
          placeholder="Crème Resurfacing de Bakuchiol"
          className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/35 ${
            errors.name ? 'border-red-400 focus:border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'
          }`}
        />
        {errors.name && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.name}</p>}
      </div>

      {/* Price + Stock */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5">
            Precio ($) <span className="text-red-400">*</span>
          </label>
          <input
            type="number" min="1" step="0.5"
            value={price}
            onChange={(e) => { setPrice(e.target.value); setErrors(p => ({ ...p, price: undefined })); }}
            placeholder="62.00"
            className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/35 ${
              errors.price ? 'border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'
            }`}
          />
          {errors.price && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.price}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5">
            Stock Inicial <span className="text-red-400">*</span>
          </label>
          <input
            type="number" min="1"
            value={stock}
            onChange={(e) => { setStock(e.target.value); setErrors(p => ({ ...p, stock: undefined })); }}
            placeholder="30"
            className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/35 ${
              errors.stock ? 'border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'
            }`}
          />
          {errors.stock && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.stock}</p>}
        </div>
      </div>

      {/* Category */}
      <Select
        label="Categoría de Skincare"
        options={[
          { value: 'Serums', label: 'Serums' },
          { value: 'Moisturizers', label: 'Hidratantes' },
          { value: 'Cleansers', label: 'Limpiadores' },
          { value: 'Toners', label: 'Tónicos' },
          { value: 'Anti-Aging', label: 'Antienvejecimiento' }
        ]}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      {/* Ingredients */}
      <div className="w-full">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5">
          Ingredientes Activos <span className="text-red-400">*</span>
          <span className="normal-case font-normal ml-1 text-brand-black/35">(separados por coma)</span>
        </label>
        <textarea
          rows={3}
          value={ingredients}
          onChange={(e) => { setIngredients(e.target.value); setErrors(p => ({ ...p, ingredients: undefined })); }}
          placeholder="Bakuchiol, Manteca de Karité, Coenzima Q10, Escualano..."
          className={`w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/35 resize-none ${
            errors.ingredients ? 'border-red-400' : 'border-brand-black/10 focus:border-brand-green-dark'
          }`}
        />
        {errors.ingredients && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.ingredients}</p>}
      </div>

      {/* Description */}
      <TextArea
        label="Descripción del Producto"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Detalles de los beneficios de rejuvenecimiento dérmico..."
        rows={3}
      />

      {/* ── Image picker ───────────────────────────────────────── */}
      <div className="border-t border-brand-black/5 pt-3 space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
          Imagen del Producto
        </label>

        {imagePreview ? (
          /* Preview + remove */
          <div className="relative w-full aspect-video rounded-luxury overflow-hidden border border-brand-black/10 bg-brand-gray-soft">
            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-brand-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer shadow"
            >
              <X size={13} />
            </button>
            <div className="absolute bottom-2 left-2 bg-brand-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full truncate max-w-[80%]">
              {imageFile?.name}
            </div>
          </div>
        ) : (
          /* Drop zone / click area */
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-brand-black/12 rounded-luxury hover:border-brand-green-dark/50 hover:bg-brand-green-dark/3 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-brand-black/5 flex items-center justify-center">
              <ImagePlus size={18} className="text-brand-black/40" />
            </div>
            <span className="text-xs font-bold text-brand-black/50">Haz clic para seleccionar imagen</span>
            <span className="text-[9px] text-brand-black/30 font-medium">PNG · JPG · WEBP · Máx. 5 MB</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />

        {uploadError && (
          <p className="text-[10px] text-red-500 font-semibold">{uploadError}</p>
        )}
        {!imageFile && (
          <p className="text-[10px] text-brand-black/30 font-medium">
            Opcional — el producto se guardará sin imagen si no seleccionas ninguna.
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={isBusy}
        className="py-3 text-xs tracking-wider"
      >
        {status === 'uploading' ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Subiendo imagen…
          </span>
        ) : status === 'submitting' ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Guardando producto…
          </span>
        ) : (
          'Agregar al Catálogo'
        )}
      </Button>

    </form>
  );
};

// ============================================================================
// COMPONENTE AUXILIAR - FORMULARIO PARA EDITAR PRODUCTO EXISTENTE
// ============================================================================
const ProductEditWizard: React.FC<{
  product: Product;
  onSave: (prod: Product) => Promise<void>;
  onCancel: () => void;
}> = ({ product, onSave, onCancel }) => {
  const [name, setName] = useState(product.name);
  const [desc, setDesc] = useState(product.description);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [category, setCategory] = useState(product.category);
  const [ingredients, setIngredients] = useState(product.ingredients.join(', '));
  const [isFeatured, setIsFeatured] = useState(product.isFeatured);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product.imageUrl || '');
  const [isNewImage, setIsNewImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('Solo imágenes (PNG, JPG, WEBP)'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('Máx. 5 MB'); return; }
    setUploadError('');
    setImageFile(file);
    if (isNewImage && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setIsNewImage(true);
    e.target.value = '';
  };

  const clearImage = () => {
    if (isNewImage && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(product.imageUrl || '');
    setIsNewImage(false);
    setUploadError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || Number(price) <= 0 || Number(stock) < 0) return;

    setUploadError('');
    let finalImageUrl = product.imageUrl || '';
    let finalImages = product.images ?? (product.imageUrl ? [product.imageUrl] : []);

    if (imageFile && isNewImage) {
      setStatus('uploading');
      const path = `products/${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { data, error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, imageFile, { cacheControl: '3600', upsert: false, contentType: imageFile.type });
      if (uploadErr) {
        setUploadError(`Error al subir: ${uploadErr.message}`);
        setStatus('idle');
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(data.path);
      finalImageUrl = publicUrl;
      finalImages = [publicUrl];
    }

    setStatus('saving');
    await onSave({
      ...product,
      name: name.trim(),
      description: desc.trim(),
      price: Number(price),
      stock: Number(stock),
      category,
      ingredients: ingredients.split(',').map(i => i.trim()).filter(Boolean),
      imageUrl: finalImageUrl,
      images: finalImages,
      isFeatured,
    });
    setStatus('idle');
  };

  const isBusy = status !== 'idle';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Name */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">Nombre *</label>
        <input value={name} onChange={e => setName(e.target.value)} required
          className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all" />
      </div>

      {/* Price + Stock */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">Precio ($) *</label>
          <input type="number" min="0.5" step="0.5" value={price} onChange={e => setPrice(e.target.value)} required
            className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">Stock *</label>
          <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} required
            className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all" />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">Categoría</label>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all cursor-pointer">
          {['Serums','Moisturizers','Cleansers','Toners','Anti-Aging'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">
          Ingredientes <span className="normal-case font-normal text-brand-black/30">(coma separados)</span>
        </label>
        <textarea rows={2} value={ingredients} onChange={e => setIngredients(e.target.value)}
          className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all resize-none" />
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60 mb-1">Descripción</label>
        <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)}
          className="w-full px-3 py-2.5 bg-brand-white border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all resize-none" />
      </div>

      {/* Featured toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
        <div
          onClick={() => setIsFeatured(f => !f)}
          className={`relative w-9 h-5 rounded-full transition-colors border ${isFeatured ? 'bg-amber-400 border-amber-400' : 'bg-brand-black/10 border-brand-black/10'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isFeatured ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-xs font-semibold text-brand-black/70">
          {isFeatured ? '⭐ Producto Destacado' : 'Marcar como Destacado'}
        </span>
      </label>

      {/* Image */}
      <div className="border-t border-brand-black/5 pt-3 space-y-2">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-black/60">Imagen</label>

        {imagePreview ? (
          <div className="relative w-full aspect-video rounded-luxury overflow-hidden border border-brand-black/10 bg-brand-gray-soft">
            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
            {isNewImage && (
              <button type="button" onClick={clearImage}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer shadow">
                <X size={11} />
              </button>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 flex items-center gap-1 bg-brand-black/60 text-white text-[9px] font-bold px-2 py-1 rounded-luxury hover:bg-brand-black transition-colors cursor-pointer">
              <ImagePlus size={10} />
              Cambiar
            </button>
            {isNewImage && (
              <span className="absolute top-2 left-2 bg-brand-green-dark text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">Nueva</span>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-5 border-2 border-dashed border-brand-black/12 rounded-luxury hover:border-brand-green-dark/50 transition-all cursor-pointer">
            <ImagePlus size={18} className="text-brand-black/30" />
            <span className="text-[10px] text-brand-black/40 font-semibold">Seleccionar imagen</span>
          </button>
        )}

        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden" onChange={handleFileChange} />
        {uploadError && <p className="text-[10px] text-red-500 font-semibold">{uploadError}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={isBusy}
          className="flex-1 py-2.5 text-xs font-bold border border-brand-black/10 rounded-luxury text-brand-black/60 hover:border-brand-black/20 hover:text-brand-black transition-all cursor-pointer disabled:opacity-40">
          Cancelar
        </button>
        <button type="submit" disabled={isBusy}
          className="flex-1 py-2.5 text-xs font-bold bg-brand-green-dark text-white rounded-luxury hover:bg-brand-black transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5">
          {status === 'uploading' ? (
            <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Subiendo…</>
          ) : status === 'saving' ? (
            <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando…</>
          ) : (
            <><CheckCircle2 size={12} />Guardar Cambios</>
          )}
        </button>
      </div>

    </form>
  );
};

// ============================================================================
// COMPONENTE AUXILIAR - FORMULARIO PARA AGREGAR CUPONES
// ============================================================================
const CouponAddForm: React.FC = () => {
  const { addCoupon } = useApp();
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('10');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    await addCoupon({
      code: code.trim().toUpperCase(),
      discountPercentage: Number(discount),
      isActive: true,
      usageCount: 0
    });

    setCode('');
    setDiscount('10');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {success && (
        <span className="block text-[10px] text-brand-green-dark font-bold">🎉 ¡Cupón creado exitosamente!</span>
      )}

      <Input
        label="Código del Cupón"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="VERANO25"
        required
      />

      <Input
        label="Porcentaje de Descuento (%)"
        type="number"
        min="5"
        max="80"
        value={discount}
        onChange={(e) => setDiscount(e.target.value)}
        placeholder="10"
        required
      />

      <Button
        type="submit"
        variant="secondary"
        fullWidth
        className="py-2.5 text-xs"
      >
        Crear Cupón
      </Button>
    </form>
  );
};

// ============================================================================
// COMPONENTE AUXILIAR - FORMULARIO DEL BANNER DE LA TIENDA
// ============================================================================
const StorefrontCustomizeForm: React.FC<{
  banner: { title: string; subtitle: string; ctaText: string; imageUrl: string };
  onSave: (banner: any) => void;
}> = ({ banner, onSave }) => {
  const [title, setTitle] = useState(banner.title);
  const [sub, setSub] = useState(banner.subtitle);
  const [cta, setCta] = useState(banner.ctaText);
  const [imgUrl, setImgUrl] = useState(banner.imageUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, subtitle: sub, ctaText: cta, imageUrl: imgUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Título del Banner de Marketing"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <TextArea
        label="Descripción del Subtítulo"
        value={sub}
        onChange={(e) => setSub(e.target.value)}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Texto del Botón CTA"
          value={cta}
          onChange={(e) => setCta(e.target.value)}
          required
        />
        <Input
          label="URL de Imagen del Banner"
          value={imgUrl}
          onChange={(e) => setImgUrl(e.target.value)}
          required
        />
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          variant="primary"
          className="px-6 py-2.5 text-xs"
        >
          Guardar Banner de Inicio
        </Button>
      </div>
    </form>
  );
};
