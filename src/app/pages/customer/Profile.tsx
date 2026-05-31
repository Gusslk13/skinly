import React, { useState } from 'react';
import { useApp, UserRole } from '../../context/AppContext';
import { Button, Input } from '../../components/UI';
import { 
  User as UserIcon, ShieldAlert, ShieldCheck, Mail, MapPin, 
  Phone, Award, Package, LogOut, Sparkles, BookOpen, Clock, Heart
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser, logout, setView, registeredUsers, setCurrentUser } = useApp();
  
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [postalCode, setPostalCode] = useState(currentUser?.postalCode || '');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setSaving(true);
    setSaveSuccess(false);

    // Simular guardado en base de datos
    setTimeout(() => {
      const updatedUser = {
        ...currentUser,
        fullName,
        phone,
        address,
        city,
        postalCode
      };
      
      setCurrentUser(updatedUser);
      setSaving(false);
      setSaveSuccess(true);

      setTimeout(() => setSaveSuccess(false), 3500);
    }, 800);
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      customer: 'Cliente Preferido',
      affiliate: 'Afiliado Skinly',
      supplier: 'Proveedor de Laboratorio',
      admin: 'Administrador de Plataforma'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return ShieldCheck;
    if (role === 'affiliate') return Award;
    if (role === 'supplier') return Package;
    return UserIcon;
  };

  const RoleIcon = getRoleIcon(currentUser?.role || 'customer');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 space-y-8 text-left">
      
      {/* Título */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-black">Tu Perfil</h1>
        <p className="text-xs text-brand-black/40 font-medium">Gestiona tus direcciones de envío y portales de socio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Columna izquierda - Resumen de información y accesos rápidos */}
        <div className="space-y-6">
          
          {/* Tarjeta de identidad */}
          <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 text-center space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-brand-green-dark" />
            
            {/* Bloque de avatar */}
            <div className="relative w-20 h-20 rounded-full overflow-hidden mx-auto bg-brand-gray-soft border border-brand-black/5 flex items-center justify-center">
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.fullName} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={32} className="text-brand-black/30" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-brand-black">{currentUser?.fullName}</h3>
              <p className="text-xs text-brand-black/50 font-medium flex items-center justify-center gap-1">
                <Mail size={12} />
                {currentUser?.email}
              </p>
            </div>

            {/* Indicador de rol */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-green-dark/10 text-brand-green-dark text-[10px] font-extrabold uppercase tracking-wider rounded-full">
              <RoleIcon size={12} />
              {getRoleLabel(currentUser?.role || 'customer')}
            </div>
          </div>

          {/* Accesos rápidos a portales */}
          <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5">
              Accesos Rápidos
            </h3>

            <div className="space-y-2.5">
              {/* Acceso al panel admin */}
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setView('admin-dashboard')}
                  className="w-full flex items-center justify-between p-3 rounded-luxury bg-brand-green-dark/10 hover:bg-brand-green-dark/20 text-brand-green-dark text-xs font-bold border border-brand-green-dark/20 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={14} />
                    Abrir Panel Admin
                  </span>
                  <span>→</span>
                </button>
              )}

              {/* Acceso al dashboard de afiliados */}
              {currentUser?.role === 'affiliate' && (
                <button
                  onClick={() => setView('affiliate-dashboard')}
                  className="w-full flex items-center justify-between p-3 rounded-luxury bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Award size={14} />
                    Abrir Portal de Afiliado
                  </span>
                  <span>→</span>
                </button>
              )}

              {/* Acceso al portal de proveedores */}
              {currentUser?.role === 'supplier' && (
                <button
                  onClick={() => setView('supplier-portal')}
                  className="w-full flex items-center justify-between p-3 rounded-luxury bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Package size={14} />
                    Abrir Portal de Proveedor
                  </span>
                  <span>→</span>
                </button>
              )}

              {/* Accesos generales */}
              <button
                onClick={() => setView('order-history')}
                className="w-full flex items-center justify-between p-3 rounded-luxury bg-brand-gray-soft hover:bg-brand-black/5 text-brand-black text-xs font-bold border border-brand-black/5 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Clock size={14} className="text-brand-black/50" />
                  Seguimiento de Pedidos
                </span>
                <span>→</span>
              </button>

              <button
                onClick={() => setView('favorites')}
                className="w-full flex items-center justify-between p-3 rounded-luxury bg-brand-gray-soft hover:bg-brand-black/5 text-brand-black text-xs font-bold border border-brand-black/5 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Heart size={14} className="text-brand-black/50" />
                  Lista de Deseos
                </span>
                <span>→</span>
              </button>
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={logout}
              className="py-2.5 text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut size={13} />
              Cerrar Sesión
            </Button>
          </div>

          {/* Cuadro de programas de socio para clientes regulares */}
          {currentUser?.role === 'customer' && (
            <div className="bg-gradient-to-br from-brand-green-dark to-brand-black text-brand-white p-6 rounded-luxury shadow-md space-y-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand-white/10 text-[9px] font-extrabold uppercase tracking-widest text-brand-green-light rounded-full border border-brand-white/10">
                <Sparkles size={9} />
                Programas de Asociación
              </span>
              <div className="space-y-1.5 text-left">
                <h4 className="font-heading text-base font-bold">Gana comisiones y comparte ingredientes</h4>
                <p className="text-[11px] text-brand-white/70 leading-relaxed">
                  Únete a nuestra red de afiliados para ganar <strong>5% en comisiones</strong> por referidos, o aplica para convertirte en proveedor botánico certificado.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setView('affiliate-program')}
                  className="flex-1 py-2 bg-brand-white text-brand-black hover:bg-brand-green-light text-[10px] font-bold uppercase tracking-wider rounded-luxury transition-all cursor-pointer"
                >
                  Ser Afiliado
                </button>
                <button
                  onClick={() => setView('supplier-portal')}
                  className="flex-1 py-2 bg-brand-white/10 hover:bg-brand-white/20 text-brand-white text-[10px] font-bold uppercase tracking-wider rounded-luxury border border-brand-white/15 transition-all cursor-pointer"
                >
                  Ser Proveedor
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Columnas derechas (2/3) - Libreta de direcciones */}
        <div className="md:col-span-2">
          
          <form onSubmit={handleSave} className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 shadow-sm space-y-6">
            <h2 className="font-heading text-xl font-bold text-brand-black border-b border-brand-black/5 pb-3">
              Libreta de Direcciones de Envío
            </h2>

            {saveSuccess && (
              <div className="p-3 bg-brand-green-dark/15 border border-brand-green-dark/20 text-brand-green-dark rounded-luxury text-xs font-bold flex items-center gap-2">
                <ShieldCheck size={14} className="stroke-2 shrink-0" />
                <span>¡Dirección actualizada! Estos datos se autocompletarán en el próximo pago.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre Completo / Destinatario"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Victoria Sinclair"
                required
              />
              <Input
                label="Número de Teléfono"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 555-0199"
              />
            </div>

            <Input
              label="Dirección"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Reforma 742, Col. Cuauhtémoc"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Ciudad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ciudad de México"
              />
              <Input
                label="Código Postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="06600"
              />
            </div>

            <div className="pt-4 border-t border-brand-black/5 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                className="px-6 py-2.5 text-xs"
              >
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
};
