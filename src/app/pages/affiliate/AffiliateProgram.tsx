import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/UI';
import {
  Award, DollarSign, TrendingUp, Users, Share2,
  CheckCircle2, Sparkles, Send, ShieldAlert, Clock, XCircle
} from 'lucide-react';
import { supabase } from '../../../supabase';

const PLATFORMS = [
  { value: 'tiktok',    label: 'TikTok'    },
  { value: 'instagram', label: 'Instagram'  },
  { value: 'youtube',   label: 'YouTube'    },
  { value: 'blog',      label: 'Blog / Web' },
  { value: 'podcast',   label: 'Podcast'    },
  { value: 'otro',      label: 'Otro'       },
];

type AppStatus = 'pendiente' | 'aprobado' | 'rechazado' | null;

export const AffiliateProgram: React.FC = () => {
  const { setView, currentUser, submitAffiliateApplication } = useApp();

  // Check if user already has a pending/approved application
  const [existingStatus, setExistingStatus] = useState<AppStatus>(null);
  const [existingCoupon, setExistingCoupon] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      if (!currentUser) { setCheckingStatus(false); return; }
      const { data } = await supabase
        .from('affiliate_applications')
        .select('status, coupon_code')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setExistingStatus(data.status as AppStatus);
        setExistingCoupon(data.coupon_code || null);
      }
      setCheckingStatus(false);
    };
    checkExisting();
  }, [currentUser?.id]);

  // Form state
  const [fullName,       setFullName]       = useState(currentUser?.fullName || '');
  const [email,          setEmail]          = useState(currentUser?.email    || '');
  const [phone,          setPhone]          = useState('');
  const [platform,       setPlatform]       = useState('');
  const [handle,         setHandle]         = useState('');
  const [followersCount, setFollowersCount] = useState('');
  const [whyAffiliate,   setWhyAffiliate]   = useState('');
  const [promotionPlan,  setPromotionPlan]  = useState('');
  const [loading,        setLoading]        = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [formError,      setFormError]      = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !platform || !handle || !whyAffiliate) {
      setFormError('Por favor completa todos los campos obligatorios (*).');
      return;
    }
    setLoading(true);
    setFormError('');
    const res = await submitAffiliateApplication({
      userId: currentUser?.id,
      fullName, email, phone, platform, handle,
      followersCount, whyAffiliate, promotionPlan
    });
    setLoading(false);
    if (res.success) {
      setSubmitted(true);
      setExistingStatus('pendiente');
    } else {
      setFormError(res.error || 'Error al enviar solicitud.');
    }
  };

  const benefits = [
    {
      icon: DollarSign,
      title: '5% de Comisión',
      desc: 'Gana el 5% de cada venta generada con tu código único, pagado directamente a tu cuenta bancaria.',
      color: 'text-brand-green-dark', bg: 'bg-brand-green-dark/10',
    },
    {
      icon: TrendingUp,
      title: 'Rastreo en Tiempo Real',
      desc: 'Consulta tus métricas de clics, conversiones y comisiones acumuladas en tu panel de embajador.',
      color: 'text-indigo-600', bg: 'bg-indigo-50',
    },
    {
      icon: Users,
      title: 'Cupón para tu Comunidad',
      desc: 'Tu audiencia recibe 10% de descuento en toda la tienda — más razón para comprar y más ventas para ti.',
      color: 'text-amber-600', bg: 'bg-amber-50',
    },
    {
      icon: Share2,
      title: 'Kit de Marca Incluido',
      desc: 'Renders de producto en alta resolución, logotipos y paleta oficial para tus contenidos.',
      color: 'text-brand-black', bg: 'bg-brand-gray-soft',
    },
  ];

  const steps = [
    { num: '01', label: 'Aplica',   desc: 'Llena el formulario. Nuestro equipo lo revisa en 2–3 días hábiles.' },
    { num: '02', label: 'Actívate', desc: 'Recibes tu código único, enlace de rastreo y acceso al kit de marca.' },
    { num: '03', label: 'Comparte', desc: 'Publica en redes sociales, stories, blogs — tú decides el canal.' },
    { num: '04', label: 'Cobra',    desc: 'Solicita tu pago desde el panel de embajador cuando acumules comisiones.' },
  ];

  // ── Status card for users who already applied ─────────────────────────────
  const StatusCard = () => {
    if (existingStatus === 'pendiente') return (
      <div className="flex items-start gap-4 p-6 bg-amber-50 border border-amber-200 rounded-luxury">
        <Clock size={28} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-heading text-lg font-bold text-amber-900">Solicitud en Revisión</h3>
          <p className="text-xs text-amber-800 font-medium leading-relaxed mt-1">
            Tu solicitud está siendo evaluada por nuestro equipo. Te contactaremos en 2–3 días hábiles al correo registrado.
          </p>
        </div>
      </div>
    );
    if (existingStatus === 'aprobado') return (
      <div className="flex items-start gap-4 p-6 bg-brand-green-dark/5 border border-brand-green-dark/20 rounded-luxury">
        <CheckCircle2 size={28} className="text-brand-green-dark shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h3 className="font-heading text-lg font-bold text-brand-green-dark">¡Eres Embajador Skinly!</h3>
          {existingCoupon && (
            <p className="text-xs text-brand-black/70 font-medium leading-relaxed">
              Tu código de referido es: <span className="font-mono font-extrabold text-brand-green-dark text-sm">{existingCoupon}</span>
            </p>
          )}
          <Button variant="primary" onClick={() => setView('affiliate-dashboard')} className="mt-2 py-2 text-xs">
            Ir a mi Panel →
          </Button>
        </div>
      </div>
    );
    if (existingStatus === 'rechazado') return (
      <div className="flex items-start gap-4 p-6 bg-red-50 border border-red-200 rounded-luxury">
        <XCircle size={28} className="text-red-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-heading text-lg font-bold text-red-800">Solicitud No Aprobada</h3>
          <p className="text-xs text-red-700 font-medium leading-relaxed mt-1">
            En esta ocasión tu solicitud no fue aprobada. Puedes volver a aplicar después de 30 días o contactar a soporte para más información.
          </p>
        </div>
      </div>
    );
    return null;
  };

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
            <strong className="text-brand-white">5% de comisión</strong> en cada venta que generes.
            Tu audiencia obtiene <strong className="text-brand-white">10% de descuento</strong>.
            Todos ganan.
          </p>

          <div className="flex flex-wrap gap-3 items-center justify-center pt-2">
            <a href="#solicitud" className="px-6 py-3 bg-brand-green-dark text-brand-white text-sm font-extrabold rounded-luxury hover:bg-brand-green-light hover:text-brand-black transition-all shadow-lg">
              Solicitar Membresía
            </a>
            {currentUser?.role === 'affiliate' && (
              <Button variant="glass" onClick={() => setView('affiliate-dashboard')}
                className="border border-brand-white/10 text-brand-white hover:bg-brand-white/10">
                Ir a mi Panel →
              </Button>
            )}
          </div>

          {/* Stats rápidos */}
          <div className="pt-6 grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[
              { val: '5%',  label: 'Comisión'         },
              { val: '10%', label: 'Descuento audiencia' },
              { val: '2–3d', label: 'Aprobación'        },
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

            <div className="space-y-1.5 border-b border-brand-black/5 pb-5">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-brand-green-dark" />
                <h2 className="font-heading text-xl font-bold text-brand-black">Solicitud de Membresía</h2>
              </div>
              <p className="text-[11px] text-brand-black/50 leading-relaxed font-semibold">
                Completa el formulario y nuestro equipo revisará tu solicitud en 2–3 días hábiles.
                Solo trabajamos con creadores auténticos alineados con los valores de Skinly.
              </p>
            </div>

            {/* If already applied, show status */}
            {!checkingStatus && existingStatus && !submitted && <StatusCard />}

            {/* Show form only if hasn't applied yet (or application rejected) */}
            {!checkingStatus && (!existingStatus || existingStatus === 'rechazado') && !submitted && (
              <form onSubmit={handleSubmit} className="space-y-5">

                {formError && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-luxury px-3 py-2.5">
                    <ShieldAlert size={14} className="shrink-0" />
                    {formError}
                  </div>
                )}

                {/* Nombre + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-black/60 mb-1.5">Nombre Completo *</label>
                    <input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Lupita García"
                      required
                      className="w-full px-4 py-3 border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all bg-brand-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-black/60 mb-1.5">Correo Electrónico *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="lupita@correo.com"
                      required
                      className="w-full px-4 py-3 border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all bg-brand-white"
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-black/60 mb-1.5">Teléfono</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full px-4 py-3 border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all bg-brand-white"
                  />
                </div>

                {/* Plataforma + Handle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-black/60 mb-1.5">Plataforma Principal *</label>
                    <select
                      value={platform}
                      onChange={e => setPlatform(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all bg-brand-white cursor-pointer"
                    >
                      <option value="" disabled>— Selecciona —</option>
                      {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-black/60 mb-1.5">Usuario / Handle *</label>
                    <input
                      value={handle}
                      onChange={e => setHandle(e.target.value)}
                      placeholder="@lupita_beauty"
                      required
                      className="w-full px-4 py-3 border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all bg-brand-white"
                    />
                  </div>
                </div>

                {/* Seguidores */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-black/60 mb-1.5">Número Aproximado de Seguidores</label>
                  <select
                    value={followersCount}
                    onChange={e => setFollowersCount(e.target.value)}
                    className="w-full px-4 py-3 border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all bg-brand-white cursor-pointer"
                  >
                    <option value="">— Selecciona un rango —</option>
                    <option value="menos_1k">Menos de 1,000</option>
                    <option value="1k_10k">1,000 – 10,000</option>
                    <option value="10k_50k">10,000 – 50,000</option>
                    <option value="50k_100k">50,000 – 100,000</option>
                    <option value="100k_500k">100,000 – 500,000</option>
                    <option value="mas_500k">Más de 500,000</option>
                  </select>
                </div>

                {/* ¿Por qué quieres ser afiliado? */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-black/60 mb-1.5">¿Por qué quieres ser embajador Skinly? *</label>
                  <textarea
                    value={whyAffiliate}
                    onChange={e => setWhyAffiliate(e.target.value)}
                    rows={3}
                    required
                    placeholder="Cuéntanos tu relación con el skincare, cómo conociste Skinly y por qué crees que eres el fit perfecto para nuestra marca..."
                    className="w-full px-4 py-3 border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all bg-brand-white resize-none"
                  />
                </div>

                {/* Plan de promoción */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-black/60 mb-1.5">¿Cómo planeas promocionar Skinly?</label>
                  <textarea
                    value={promotionPlan}
                    onChange={e => setPromotionPlan(e.target.value)}
                    rows={3}
                    placeholder="Describe el tipo de contenido que crearías, la frecuencia, formatos (reels, unboxing, tutoriales), etc."
                    className="w-full px-4 py-3 border border-brand-black/10 rounded-luxury text-sm outline-none focus:border-brand-green-dark transition-all bg-brand-white resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" disabled={loading} className="gap-2 px-8 py-3">
                    <Send size={14} />
                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                  </Button>
                </div>
              </form>
            )}

            {/* Success state */}
            {(submitted || existingStatus === 'pendiente') && !checkingStatus && existingStatus !== 'aprobado' && (
              submitted && (
                <div className="py-8 text-center space-y-4">
                  <CheckCircle2 size={44} className="text-brand-green-dark mx-auto stroke-1" />
                  <div className="space-y-1.5">
                    <h3 className="font-heading text-xl font-bold text-brand-black">¡Solicitud Enviada!</h3>
                    <p className="text-xs text-brand-black/50 font-medium leading-relaxed max-w-sm mx-auto">
                      Revisaremos tu perfil en los próximos 2–3 días hábiles y te contactaremos al correo proporcionado.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setView('home')} className="mx-auto mt-2">
                    Volver al Inicio
                  </Button>
                </div>
              )
            )}

          </div>
        </div>
      </section>

    </div>
  );
};
