import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Input } from '../../components/UI';
import { FlaskConical, Mail, Building2, Send, CheckCircle2, Leaf } from 'lucide-react';

export const SupplierPortal: React.FC = () => {
  const { setView } = useApp();

  const [contactName, setContactName] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 text-center space-y-10">

      {/* Logo + badge */}
      <div className="space-y-4 flex flex-col items-center">
        <div className="w-20 h-20 rounded-[1.5rem] bg-brand-green-dark/10 border border-brand-green-dark/15 flex items-center justify-center">
          <img src="/images/logo.png" alt="Skinly" className="w-12 h-12 object-contain" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase text-amber-700">
          <FlaskConical size={10} />
          Portal de Proveedores
        </span>
      </div>

      {/* Headline */}
      <div className="space-y-3 max-w-lg">
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-brand-black leading-tight">
          Próximamente
        </h1>
        <p className="text-sm text-brand-black/50 leading-relaxed font-medium">
          Estamos construyendo el portal para laboratorios y proveedores de ingredientes botánicos.
          Podrás registrar certificados de extracción, subir tus activos y conectar directamente con el equipo de auditoría de Skinly.
        </p>
      </div>

      {/* Features lista */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
        {[
          { icon: FlaskConical, label: 'Certificación de Laboratorio', desc: 'Registra sellos orgánicos y documentos FDA.' },
          { icon: Leaf, label: 'Subida de Formulaciones', desc: 'Presenta nuevos activos botánicos al catálogo.' },
          { icon: Building2, label: 'Directorio de Proveedores', desc: 'Tu empresa visible ante compradores verificados.' },
        ].map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="bg-brand-white border border-brand-black/5 rounded-luxury p-5 text-left space-y-2 shadow-sm">
              <div className="w-8 h-8 bg-brand-green-dark/10 rounded-lg flex items-center justify-center">
                <Icon size={16} className="text-brand-green-dark" />
              </div>
              <p className="font-bold text-brand-black text-xs">{f.label}</p>
              <p className="text-[11px] text-brand-black/40 leading-relaxed font-medium">{f.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Formulario de contacto */}
      <div className="w-full max-w-md">
        <div className="bg-brand-white border border-brand-black/5 rounded-luxury p-6 sm:p-8 shadow-sm space-y-5 text-left">

          <div className="space-y-1 border-b border-brand-black/5 pb-4">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-brand-green-dark" />
              <h2 className="font-heading font-bold text-brand-black text-base">Regístrate para ser notificado</h2>
            </div>
            <p className="text-[11px] text-brand-black/40 font-medium leading-relaxed">
              Sé el primero en acceder al portal cuando abramos. Te avisamos por correo.
            </p>
          </div>

          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 size={36} className="text-brand-green-dark mx-auto stroke-1" />
              <div>
                <p className="font-bold text-brand-black text-sm">¡Listo, te avisaremos!</p>
                <p className="text-[11px] text-brand-black/40 font-medium mt-1">
                  Recibirás un correo en cuanto el portal esté disponible.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                label="Nombre de contacto"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Tu nombre"
                required
              />
              <Input
                label="Empresa / Laboratorio"
                value={contactCompany}
                onChange={(e) => setContactCompany(e.target.value)}
                placeholder="OrgaSkyn Labs, S.A. de C.V."
              />
              <Input
                label="Correo electrónico"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contacto@tulaboratorio.com"
                required
              />

              <button
                type="submit"
                className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3 bg-brand-black text-brand-white text-xs font-extrabold uppercase tracking-wider rounded-luxury hover:bg-brand-green-dark transition-colors cursor-pointer"
              >
                <Send size={13} />
                Notificarme cuando abra
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Back to store */}
      <button
        onClick={() => setView('home')}
        className="text-xs font-semibold text-brand-black/40 hover:text-brand-black transition-colors cursor-pointer"
      >
        ← Volver a la tienda
      </button>

    </div>
  );
};
