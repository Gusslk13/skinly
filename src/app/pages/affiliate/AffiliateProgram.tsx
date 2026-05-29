import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button, Input, TextArea } from '../../components/UI';
import {
  Award, DollarSign, TrendingUp, Users, Share2,
  CheckCircle2, ChevronRight, Sparkles, Send
} from 'lucide-react';

export const AffiliateProgram: React.FC = () => {
  const { setView, currentUser } = useApp();

  // Simple application form state (stored locally — admin reviews manually)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [audience, setAudience] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    // In a real app this would call an API. For now, simulate success.
    setSubmitted(true);
  };

  const benefits = [
    {
      icon: DollarSign,
      title: '15% de Comisión',
      desc: 'Gana el 15% de cada venta generada con tu código único de referido, pagado directamente a tu cuenta bancaria.',
      color: 'text-brand-green-dark',
      bg: 'bg-brand-green-dark/10',
    },
    {
      icon: TrendingUp,
      title: 'Rastreo en Tiempo Real',
      desc: 'Consulta tus métricas de clics, conversiones y comisiones acumuladas en tu panel de embajador.',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      icon: Users,
      title: 'Cupón para tu Comunidad',
      desc: 'Tu audiencia recibe 10% de descuento en toda la tienda — más razón para comprar y más ventas para ti.',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      icon: Share2,
      title: 'Kit de Marca Incluido',
      desc: 'Accede a renders de producto en alta resolución, logotipos y paleta oficial para tus contenidos.',
      color: 'text-brand-black',
      bg: 'bg-brand-gray-soft',
    },
  ];

  const steps = [
    { num: '01', label: 'Aplica', desc: 'Llena el formulario de solicitud. Nuestro equipo lo revisa en 2–3 días hábiles.' },
    { num: '02', label: 'Actívate', desc: 'Recibes tu código único, enlace de rastreo y acceso al kit de marca Skinly.' },
    { num: '03', label: 'Comparte', desc: 'Publica en redes sociales, stories, blogs o podcasts — tú decides el canal.' },
    { num: '04', label: 'Cobra', desc: 'Solicita tu pago desde el panel de embajador cuando acumules comisiones.' },
  ];

  return (
    <div className="space-y-0 pb-20">

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-[#0c0d0c] via-[#0e1611] to-[#0a0f0c] overflow-hidden px-5 py-20 sm:py-28 text-center">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full bg-brand-green-dark/15 blur-3xl opacity-60 pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl opacity-40 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-white/5 backdrop-blur-md rounded-full text-[10px] font-bold tracking-[0.18em] uppercase text-brand-green-light border border-brand-white/10">
            <Sparkles size={10} className="text-brand-green-light" />
            Programa de Embajadores Skinly
          </span>

          <h1 className="font-heading text-4xl sm:text-6xl font-extrabold leading-tight tracking-wide text-brand-white">
            Gana mientras<br />
            <span className="text-brand-green-light">compartes</span> lo que amas.
          </h1>

          <p className="text-sm sm:text-base text-brand-white/70 leading-relaxed font-medium max-w-xl mx-auto">
            Únete al programa de afiliados de Skinly y recibe el{' '}
            <strong className="text-brand-white">15% de comisión</strong> en cada venta que generes.
            Tu audiencia obtiene <strong className="text-brand-white">10% de descuento</strong>.
            Todos ganan.
          </p>

          <div className="flex flex-wrap gap-3 items-center justify-center pt-2">
            <a
              href="#solicitud"
              className="px-6 py-3 bg-brand-green-dark text-brand-white text-sm font-extrabold rounded-luxury hover:bg-brand-green-light hover:text-brand-black transition-all shadow-lg"
            >
              Solicitar Membresía
            </a>
            {currentUser?.role === 'affiliate' && (
              <Button
                variant="glass"
                onClick={() => setView('affiliate-dashboard')}
                className="border border-brand-white/10 text-brand-white hover:bg-brand-white/10"
              >
                Ir a mi Panel →
              </Button>
            )}
          </div>

          {/* Números rápidos */}
          <div className="pt-6 grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[
              { val: '15%', label: 'Comisión' },
              { val: '10%', label: 'Descuento audiencia' },
              { val: '2–3d', label: 'Aprobación' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <span className="block font-black text-2xl text-brand-white">{s.val}</span>
                <span className="block text-[10px] text-brand-white/40 font-semibold uppercase tracking-wider mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="font-heading text-3xl font-bold text-brand-black">¿Por qué ser embajador Skinly?</h2>
          <p className="text-xs text-brand-black/40 font-medium max-w-md mx-auto">
            Somos transparentes con nuestras comisiones. Sin límites de ganancias, sin fechas de vencimiento.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-3 text-left">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${b.bg}`}>
                  <Icon size={18} className={b.color} />
                </div>
                <h3 className="font-heading font-bold text-brand-black text-base">{b.title}</h3>
                <p className="text-xs text-brand-black/50 leading-relaxed font-medium">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-brand-white border-y border-brand-black/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="font-heading text-3xl font-bold text-brand-black">Cómo funciona</h2>
            <p className="text-xs text-brand-black/40 font-medium">Cuatro pasos simples para empezar a ganar.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 relative">
            {/* Línea conectora — visible en desktop */}
            <div className="hidden lg:block absolute top-6 left-[calc(12.5%+1rem)] right-[calc(12.5%+1rem)] h-px bg-brand-black/10 z-0" />

            {steps.map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center px-4 py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-black text-brand-white flex items-center justify-center font-black text-sm shadow-md">
                  {s.num}
                </div>
                <h3 className="font-heading font-bold text-brand-black">{s.label}</h3>
                <p className="text-xs text-brand-black/50 leading-relaxed font-medium max-w-[180px] mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULARIO DE SOLICITUD */}
      <section id="solicitud" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-brand-white p-8 sm:p-10 rounded-luxury border border-brand-black/5 shadow-sm space-y-6">

            <div className="space-y-1.5 border-b border-brand-black/5 pb-4">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-brand-green-dark" />
                <h2 className="font-heading text-xl font-bold text-brand-black">Solicitud de Membresía</h2>
              </div>
              <p className="text-[11px] text-brand-black/50 leading-relaxed font-semibold">
                Completa el formulario y nuestro equipo revisará tu solicitud en 2–3 días hábiles.
                Solo trabajamos con creadores auténticos alineados con los valores de Skinly.
              </p>
            </div>

            {submitted ? (
              <div className="py-10 text-center space-y-4">
                <CheckCircle2 size={44} className="text-brand-green-dark mx-auto stroke-1" />
                <div className="space-y-1.5">
                  <h3 className="font-heading text-xl font-bold text-brand-black">¡Solicitud Enviada!</h3>
                  <p className="text-xs text-brand-black/50 font-medium leading-relaxed max-w-sm mx-auto">
                    Revisaremos tu perfil en los próximos 2–3 días hábiles y te contactaremos al correo proporcionado con los siguientes pasos.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setView('home')} className="mx-auto mt-2">
                  Volver al Inicio
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nombre Completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Lupita García"
                    required
                  />
                  <Input
                    label="Correo Electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lupita@correo.com"
                    required
                  />
                </div>

                <Input
                  label="Usuario de Instagram / TikTok / Canal Principal"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@lupita_beauty o enlace a tu canal"
                />

                <TextArea
                  label="Cuéntanos sobre tu audiencia"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Describe tu comunidad, nicho de contenido, tamaño aproximado de audiencia y por qué encajas con Skinly..."
                />

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" className="gap-2 px-8 py-3">
                    <Send size={14} />
                    Enviar Solicitud
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};
