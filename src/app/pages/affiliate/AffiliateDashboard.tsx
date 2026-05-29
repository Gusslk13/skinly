import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/UI';
import { 
  Award, TrendingUp, DollarSign, MousePointer, Share2, 
  Calendar, Check, FileText, Sparkles, Send, Copy
} from 'lucide-react';

export const AffiliateDashboard: React.FC = () => {
  const { currentUser, affiliateProfiles, requestPayout } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);

  const affProfile = affiliateProfiles.find(aff => aff.userId === currentUser?.id);

  if (!affProfile) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
          <Award size={28} className="stroke-1" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-brand-black">Sin Perfil de Afiliado</h2>
          <p className="text-xs text-brand-black/50 font-medium leading-relaxed max-w-xs mx-auto">
            No tienes un perfil de afiliado asociado a esta cuenta. Intenta cambiar de rol o contacta a soporte.
          </p>
        </div>
      </div>
    );
  }

  const referralLink = `https://skinly.co/ref?coupon=${affProfile.couponCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const activePayouts = affProfile.payoutHistory;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8 text-left">
      
      {/* Encabezado */}
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold text-brand-black">Panel de Embajador Afiliado</h1>
        <p className="text-xs text-brand-black/40 font-medium">Rastrea ventas referidas, revisa comisiones y solicita pagos.</p>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Métrica 1 - Comisión Ganada */}
        <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-brand-green-dark" />
          <div className="flex justify-between items-center text-brand-black/50">
            <span className="text-[10px] font-bold uppercase tracking-wider">Comisión Pendiente</span>
            <DollarSign size={16} className="text-brand-green-dark" />
          </div>
          <span className="text-3xl font-black text-brand-black block">
            ${affProfile.commissionEarned.toFixed(2)}
          </span>
          <span className="text-[9px] font-bold text-brand-green-dark bg-brand-green-dark/10 px-2 py-0.5 rounded-full uppercase tracking-wider block w-fit">
            Tasa base 15%
          </span>
        </div>

        {/* Métrica 2 - Ventas Referidas */}
        <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-indigo-600" />
          <div className="flex justify-between items-center text-brand-black/50">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pedidos Referidos</span>
            <TrendingUp size={16} className="text-indigo-600" />
          </div>
          <span className="text-3xl font-black text-brand-black block">
            {affProfile.referredSales}
          </span>
          <span className="text-[9px] font-semibold text-brand-black/40 block">
            Ventas convertidas con cupón
          </span>
        </div>

        {/* Métrica 3 - Clics Únicos */}
        <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-brand-green-light" />
          <div className="flex justify-between items-center text-brand-black/50">
            <span className="text-[10px] font-bold uppercase tracking-wider">Clics de Referido</span>
            <MousePointer size={16} className="text-brand-green-dark" />
          </div>
          <span className="text-3xl font-black text-brand-black block">
            {affProfile.clicksCount}
          </span>
          <span className="text-[9px] font-semibold text-brand-black/40 block">
            Visitas únicas registradas por enlace
          </span>
        </div>

        {/* Métrica 4 - Tasa de Conversión */}
        <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-brand-black" />
          <div className="flex justify-between items-center text-brand-black/50">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tasa de Conversión</span>
            <Sparkles size={16} className="text-brand-black" />
          </div>
          <span className="text-3xl font-black text-brand-black block">
            {affProfile.clicksCount > 0 
              ? `${((affProfile.referredSales / affProfile.clicksCount) * 100).toFixed(1)}%` 
              : '0%'}
          </span>
          <span className="text-[9px] font-semibold text-brand-black/40 block">
            Tasa de clic a venta
          </span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columnas izquierdas (2/3) - Generador de enlace y herramientas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tarjeta de activos de marketing */}
          <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 shadow-sm space-y-6">
            <h2 className="font-heading text-xl font-bold text-brand-black border-b border-brand-black/5 pb-3">
              Activos de Marketing del Embajador
            </h2>

            {/* Visualización del código de cupón activo */}
            <div className="bg-brand-green-dark text-brand-white p-6 rounded-luxury relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-brand-white/5 blur-xl" />
              
              <div className="space-y-1 text-left relative z-10">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-green-light block">
                  Código de Referido Activo
                </span>
                <h3 className="font-mono text-3xl font-black tracking-wider">
                  {affProfile.couponCode}
                </h3>
                <p className="text-[11px] text-brand-white/70 leading-relaxed font-semibold">
                  Ofrece a tus clientes <strong>10% de descuento</strong> en su pedido, y recibe <strong>15% de comisión</strong> sobre el total pagado.
                </p>
              </div>

              <div className="bg-brand-white/10 backdrop-blur-md px-4 py-2 rounded-luxury text-left relative z-10 border border-brand-white/10">
                <span className="block text-[8px] uppercase tracking-wider text-brand-white/50 font-bold">Usos Totales:</span>
                <span className="text-lg font-black">{affProfile.referredSales} pagos</span>
              </div>
            </div>

            {/* Generador de enlace de referido */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 pl-0.5">
                Tu Enlace de Rastreo Directo
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-brand-gray-soft px-4 py-3 text-xs font-semibold border border-brand-black/5 rounded-luxury outline-none text-brand-black/75 truncate"
                />
                
                <button
                  onClick={copyToClipboard}
                  className={`px-5 py-3 rounded-luxury text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedLink 
                      ? 'bg-brand-green-dark text-brand-white' 
                      : 'bg-brand-black text-brand-white hover:bg-brand-green-dark'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check size={14} />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copiar Enlace
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Kit de marca */}
            <div className="bg-brand-gray-soft p-4 rounded-luxury border border-brand-black/5 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-3 text-left">
                <FileText className="text-brand-green-dark shrink-0" size={18} />
                <div>
                  <span className="block font-bold text-brand-black">Kit de Prensa y Marca Skinly (2026)</span>
                  <span className="text-[10px] text-brand-black/40">Logotipos premium, renders de productos y paleta de colores.</span>
                </div>
              </div>
              <button onClick={() => alert('Descarga simulada: Activos del kit de marca descargados exitosamente.')} className="text-brand-green-dark hover:underline font-extrabold uppercase tracking-wider text-[10px] shrink-0 cursor-pointer">
                Descargar Kit
              </button>
            </div>

          </div>

        </div>

        {/* Columna derecha (1/3) - Solicitudes de pago */}
        <div className="space-y-6">
          
          {/* Formulario de pago */}
          <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm text-left space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5">
              Solicitar Pago Bancario
            </h3>

            <div className="bg-brand-gray-soft p-4 rounded-luxury border border-brand-black/5 text-xs text-brand-black/60 space-y-1.5">
              <span className="block text-[9px] uppercase font-bold text-brand-black/40">Saldo Retirable</span>
              <span className="text-2xl font-black text-brand-black block">
                ${affProfile.commissionEarned.toFixed(2)}
              </span>
              <span className="block text-[10px]">Transferencia segura por Wire Directo.</span>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={() => currentUser && requestPayout(currentUser.id)}
              disabled={affProfile.commissionEarned <= 0}
              className="py-3 gap-2"
            >
              <Send size={13} />
              Solicitar Pago Bancario
            </Button>
          </div>

          {/* Historial de pagos */}
          <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm text-left space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5">
              Historial de Pagos
            </h3>

            {activePayouts.length > 0 ? (
              <div className="space-y-3">
                {activePayouts.map((pay) => (
                  <div key={pay.id} className="flex justify-between items-center text-xs border-b border-brand-black/5 pb-2.5 last:border-0 last:pb-0">
                    <div className="space-y-0.5">
                      <span className="font-bold text-brand-black block">${pay.amount.toFixed(2)} Wire</span>
                      <span className="text-[10px] text-brand-black/40 flex items-center gap-1">
                        <Calendar size={11} />
                        {pay.date}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide rounded-full border ${
                      pay.status === 'paid' 
                        ? 'bg-brand-green-dark/15 text-brand-green-dark border-brand-green-dark/20' 
                        : 'bg-amber-50 text-amber-800 border-amber-200/50'
                    }`}>
                      {pay.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-brand-black/40 text-center py-6">No hay transacciones de pago registradas aún.</p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
