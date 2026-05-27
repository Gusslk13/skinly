import React, { useState } from 'react';
import { useApp, Product, Coupon, Order, User } from '../../context/AppContext';
import { Button, Input, Select, TextArea } from '../../components/UI';
import { ProductImageUploader } from '../../components/ProductImageUploader';
import {
  ShieldCheck, ShieldAlert, BarChart3, Package, Truck,
  Award, Ticket, Trash2, CheckCircle2,
  Layers, UserCheck, Plus, Settings, DollarSign,
  FileText, Terminal, Copy, AlertTriangle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser, products, orders, coupons, supplierApplications,
    registeredUsers, affiliateProfiles, addProduct, editProduct,
    deleteProduct, reviewSupplierApplication, featuredBanner, setFeaturedBanner,
    addCoupon, updateOrderStatus, dbSetupRequired
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'suppliers' | 'coupons' | 'customizer'>('overview');

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
            
            {/* Directorio de productos (2/3) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-brand-white p-4 rounded-luxury border border-brand-black/5 shadow-sm font-semibold flex justify-between items-center text-xs text-brand-black/50">
                <span>Catálogo Activo ({products.length} formulaciones)</span>
                <span>Controles de auditoría y verificación mayorista</span>
              </div>

              <div className="bg-brand-white border border-brand-black/5 rounded-luxury divide-y divide-brand-black/5 overflow-hidden">
                {products.map((p) => (
                  <div key={p.id} className="p-4 sm:p-5 flex gap-4 text-xs items-center justify-between text-left">
                    <div className="flex gap-4 items-center truncate">
                      <img src={p.imageUrl} alt={p.name} className="w-12 h-15 object-cover rounded-luxury border border-brand-black/5 bg-brand-gray-soft shrink-0" />
                      <div className="truncate space-y-0.5">
                        <h4 className="font-heading text-sm font-bold text-brand-black truncate max-w-[160px] sm:max-w-xs">{p.name}</h4>
                        <span className="block text-[10px] text-brand-black/35 font-semibold tracking-wider uppercase">{p.category}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const updated = { ...p, isVerified: !p.isVerified };
                              editProduct(updated);
                            }}
                            className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full tracking-wide border transition-all cursor-pointer ${
                              p.isVerified 
                                ? 'bg-brand-green-dark/15 text-brand-green-dark border-brand-green-dark/20' 
                                : 'bg-brand-gray-soft text-brand-black/40 border-brand-black/5 hover:border-brand-black/15'
                            }`}
                          >
                            Sello Verificado: {p.isVerified ? 'SÍ' : 'NO'}
                          </button>

                          <button
                            onClick={() => {
                              const updated = { ...p, isFeatured: !p.isFeatured };
                              editProduct(updated);
                            }}
                            className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full tracking-wide border transition-all cursor-pointer ${
                              p.isFeatured 
                                ? 'bg-brand-green-light text-brand-black border-brand-green-light' 
                                : 'bg-brand-gray-soft text-brand-black/40 border-brand-black/5 hover:border-brand-black/15'
                            }`}
                          >
                            Destacado: {p.isFeatured ? 'SÍ' : 'NO'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Stock, precio y herramientas */}
                    <div className="text-right space-y-2 shrink-0">
                      <div>
                        <span className="font-black text-brand-black block text-sm">${p.price.toFixed(2)}</span>
                        <span className={`block text-[10px] font-bold ${p.stock <= 15 ? 'text-red-500 font-extrabold' : 'text-brand-black/40'}`}>
                          Stock: {p.stock} unidades
                        </span>
                      </div>
                      
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-1 text-brand-black/30 hover:text-red-600 transition-colors cursor-pointer"
                        title="Eliminar producto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario para agregar producto (1/3) */}
            <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-6 text-left h-fit">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5 flex items-center gap-1.5">
                <Plus size={14} />
                Registrar Nuevo Producto
              </h3>

              <ProductAddWizard onAdd={(prodData) => addProduct(prodData)} />
            </div>

          </div>
        )}

        {/* ====================================================================
            PESTAÑA 3: GESTIÓN DE PEDIDOS Y DEVOLUCIONES
            ==================================================================== */}
        {activeTab === 'orders' && (
          <div className="bg-brand-white border border-brand-black/5 rounded-luxury divide-y divide-brand-black/5 overflow-hidden">
            <div className="p-4 bg-brand-gray-soft flex justify-between items-center text-xs font-bold text-brand-black/50">
              <span>Cumplimiento de Pedidos</span>
              <span>Registros de Despacho Pendiente</span>
            </div>

            {orders.map((o) => (
              <div key={o.id} className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-6 text-xs items-center text-left">
                
                {/* ID y Fecha */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-brand-black/40 uppercase block">ID del Pedido</span>
                  <span className="font-mono font-bold text-brand-green-dark block">{o.id.toUpperCase()}</span>
                  <span className="text-brand-black/50 block font-semibold">{new Date(o.createdAt).toLocaleDateString('es-MX')}</span>
                </div>

                {/* Detalles del cliente */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-brand-black/40 uppercase block">Destinatario</span>
                  <span className="font-bold text-brand-black block">{o.customerName}</span>
                  <span className="text-brand-black/50 block truncate max-w-[200px]" title={o.address}>{o.address}, {o.city}</span>
                </div>

                {/* Resumen de precios */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-brand-black/40 uppercase block">Importe del Pedido</span>
                  <span className="font-black text-brand-black block">${o.total.toFixed(2)}</span>
                  {o.couponCode && (
                    <span className="text-[9px] font-bold text-indigo-600 block uppercase">
                      Cupón: {o.couponCode} (-${o.discountAmount.toFixed(2)})
                    </span>
                  )}
                </div>

                {/* Acciones de estado */}
                <div className="space-y-2 flex flex-col items-start md:items-end">
                  <Select
                    options={[
                      { value: 'pending', label: 'Pendiente' },
                      { value: 'shipped', label: 'Enviado' },
                      { value: 'delivered', label: 'Entregado' },
                      { value: 'refunded', label: 'Reembolsado' }
                    ]}
                    value={o.status}
                    onChange={async (e) => {
                      await updateOrderStatus(o.id, e.target.value as any);
                      alert(`Estado del pedido actualizado a "${e.target.value}" exitosamente!`);
                    }}
                    className="!mb-0 py-1.5 px-3 text-xs w-36"
                  />
                  
                  {o.status !== 'refunded' && (
                    <button
                      onClick={async () => {
                        await updateOrderStatus(o.id, 'refunded');
                        alert('Pedido marcado como Reembolsado. Total acreditado de vuelta a la cuenta del cliente.');
                      }}
                      className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                    >
                      Procesar Devolución / Reembolso
                    </button>
                  )}
                </div>

              </div>
            ))}
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
                {coupons.map((c) => (
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
type FormErrors = Partial<Record<'name' | 'price' | 'stock' | 'ingredients', string>>;

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=600'
];

const ProductAddWizard: React.FC<{ onAdd: (prod: any) => void }> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('30');
  const [category, setCategory] = useState('Serums');
  const [ingredients, setIngredients] = useState('');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [hasUploadedImages, setHasUploadedImages] = useState(false);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = 'El nombre es obligatorio';
    if (!price || Number(price) <= 0) errs.price = 'Ingresa un precio válido';
    if (!stock || Number(stock) < 1) errs.stock = 'Stock mínimo: 1 unidad';
    if (!ingredients.trim()) errs.ingredients = 'Agrega al menos un ingrediente';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleImagesChange = (urls: string[]) => {
    setUploadedUrls(urls);
    if (urls.length > 0) setHasUploadedImages(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');

    const cleanIngredients = ingredients
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const primaryImage =
      uploadedUrls[0] ||
      FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];

    await onAdd({
      name: name.trim(),
      description: desc.trim() || `${name.trim()} es una formulación orgánica activa verificada para la salud dérmica.`,
      ingredients: cleanIngredients,
      category,
      price: Number(price),
      stock: Number(stock),
      imageUrl: primaryImage,
      isVerified: true,
      isFeatured: true
    });

    // Reset form
    setName('');
    setDesc('');
    setPrice('');
    setIngredients('');
    setStock('30');
    setCategory('Serums');
    setUploadedUrls([]);
    setHasUploadedImages(false);
    setErrors({});
    setStatus('success');
    setTimeout(() => setStatus('idle'), 3500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Success banner */}
      {status === 'success' && (
        <div className="flex items-center gap-2 bg-brand-green-dark/10 border border-brand-green-dark/20 text-brand-green-dark text-[11px] font-bold px-3 py-2.5 rounded-luxury animate-fade-in">
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
            type="number"
            min="1"
            step="0.5"
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
            type="number"
            min="1"
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

      {/* ── Image Uploader ──────────────────────────────────────── */}
      <div className="pt-1 pb-1 border-t border-brand-black/5">
        <ProductImageUploader
          onImagesChange={handleImagesChange}
          maxImages={6}
        />
        {!hasUploadedImages && (
          <p className="text-[10px] text-brand-black/35 font-medium mt-2">
            Sin imágenes: se asignará una foto de stock automáticamente.
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={status === 'submitting'}
        className="py-3 text-xs tracking-wider"
      >
        {status === 'submitting' ? (
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
