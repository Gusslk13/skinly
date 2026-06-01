import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../../supabase';
import {
  Building2, User as UserIcon, ChevronRight, ChevronLeft, Check,
  Package, TrendingUp, FileText, Settings, Upload, AlertCircle,
  Percent, ShieldCheck, Leaf, Clock, FlaskConical, Award,
  Loader2, X, BarChart2, Banknote, RefreshCw, ExternalLink,
  ToggleLeft, ToggleRight, CheckSquare, Square, HelpCircle, Store
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────
const PAID_STATUSES = ['pagado', 'enviado', 'entregado', 'paid', 'shipped', 'delivered'];
const SKINLY_COMMISSION = 0.05;
const PRODUCT_CATEGORIES = [
  'Serums', 'Hidratantes', 'Limpiadores', 'Tónicos',
  'Antienvejecimiento', 'Cuidado Masculino', 'Otro',
];

type DashTab = 'overview' | 'products' | 'application' | 'account';
type AppStep = 1 | 2 | 3 | 4 | 5;

// ─── Application form data ─────────────────────────────────────────────────────
interface AppFormData {
  sellerType: 'formal' | 'entrepreneur' | '';
  brandName: string;
  representativeName: string;
  contactEmail: string;
  contactPhone: string;
  stateCity: string;
  businessDescription: string;
  website: string;
  rfc: string;
  idOfficialUrl: string;
  actaUrl: string;
  registroSanitarioUrl: string;
  certificacionesUrl: string;
  productPhotosUrls: string[];
  ingredientsDetail: string;
  inocuityDeclaration: boolean;
  elaborationProcess: string;
  categories: string[];
  productCount: string;
  avgPrice: string;
  wantsAffiliate: boolean;
  extraCertifications: string;
}

const defaultForm: AppFormData = {
  sellerType: '', brandName: '', representativeName: '', contactEmail: '',
  contactPhone: '', stateCity: '', businessDescription: '', website: '',
  rfc: '', idOfficialUrl: '', actaUrl: '', registroSanitarioUrl: '',
  certificacionesUrl: '', productPhotosUrls: [], ingredientsDetail: '',
  inocuityDeclaration: false, elaborationProcess: '',
  categories: [], productCount: '', avgPrice: '', wantsAffiliate: false,
  extraCertifications: '',
};

// ─── File upload helper (uses product-images bucket with suppliers/ prefix) ────
const uploadFile = async (file: File, userId: string): Promise<string | null> => {
  const ext = file.name.split('.').pop();
  const path = `suppliers/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) {
    console.error('Upload error:', error.message);
    return null;
  }
  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
  return urlData.publicUrl;
};

// ─── FileUploadField component ─────────────────────────────────────────────────
const FileUploadField: React.FC<{
  label: string;
  accept: string;
  value: string;
  onChange: (url: string) => void;
  userId: string;
  required?: boolean;
  hint?: string;
  error?: string;
}> = ({ label, accept, value, onChange, userId, required, hint, error: externalError }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(externalError || '');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const url = await uploadFile(file, userId);
    setUploading(false);
    if (url) {
      onChange(url);
    } else {
      setError('Error al subir el archivo. Verifica tu conexión e intenta de nuevo.');
    }
  };

  const fileName = value ? value.split('/').pop()?.slice(17) : null; // strip timestamp prefix

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-[10px] text-brand-black/40 font-medium">{hint}</p>}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />

      {value ? (
        <div className="flex items-center gap-2 p-3 bg-brand-green-dark/5 border border-brand-green-dark/20 rounded-luxury">
          <Check size={14} className="text-brand-green-dark shrink-0" />
          <span className="text-[11px] font-semibold text-brand-green-dark truncate flex-1">{fileName || 'Archivo subido'}</span>
          <button
            type="button"
            onClick={() => { onChange(''); if (inputRef.current) inputRef.current.value = ''; }}
            className="text-brand-black/30 hover:text-red-500 cursor-pointer transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-brand-black/15 hover:border-brand-green-dark/40 rounded-luxury text-xs font-semibold text-brand-black/50 hover:text-brand-green-dark transition-all cursor-pointer disabled:opacity-60"
        >
          {uploading ? (
            <><Loader2 size={13} className="animate-spin" /> Subiendo…</>
          ) : (
            <><Upload size={13} /> Seleccionar archivo</>
          )}
        </button>
      )}

      {error && <p className="text-[10px] text-red-500 font-semibold">{error}</p>}
    </div>
  );
};

// ─── Multi-file upload (photos) ────────────────────────────────────────────────
const MultiPhotoUpload: React.FC<{
  value: string[];
  onChange: (urls: string[]) => void;
  userId: string;
  maxFiles?: number;
}> = ({ value, onChange, userId, maxFiles = 5 }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = maxFiles - value.length;
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    const urls = await Promise.all(toUpload.map(f => uploadFile(f, userId)));
    setUploading(false);
    const valid = urls.filter(Boolean) as string[];
    onChange([...value, ...valid]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-brand-black/10 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute inset-0 bg-brand-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        ))}
        {value.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-brand-black/15 hover:border-brand-green-dark/40 rounded-lg text-brand-black/30 hover:text-brand-green-dark transition-all cursor-pointer disabled:opacity-60"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={14} /><span className="text-[8px] font-bold mt-0.5">Subir</span></>}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      <p className="text-[10px] text-brand-black/40 font-medium">{value.length}/{maxFiles} fotos subidas</p>
    </div>
  );
};

// ─── Small helpers ─────────────────────────────────────────────────────────────
const SField: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div className="space-y-1">
    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 font-semibold">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full px-4 py-3 bg-brand-white border rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/30 ${
    err ? 'border-red-400 focus:border-red-500' : 'border-brand-black/10 focus:border-brand-green-dark'
  }`;

const textareaCls = 'w-full px-4 py-3 bg-brand-white border border-brand-black/10 focus:border-brand-green-dark rounded-luxury text-sm outline-none transition-all placeholder:text-brand-black/30 resize-none';

const StatCard: React.FC<{ label: string; value: string; sub?: string; color?: string; icon: React.ReactNode }> = ({ label, value, sub, color = 'brand-green-dark', icon }) => (
  <div className="bg-brand-white rounded-luxury border border-brand-black/5 p-5 shadow-sm space-y-3">
    <div className={`w-9 h-9 rounded-lg bg-${color}/10 flex items-center justify-center text-${color}`}>{icon}</div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-black/40">{label}</p>
      <p className="font-heading text-2xl font-extrabold text-brand-black mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-brand-black/40 font-medium mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  LANDING PAGE (pública)
// ─────────────────────────────────────────────────────────────────────────────
const SupplierLanding: React.FC<{ onApply: () => void }> = ({ onApply }) => (
  <div className="space-y-0">

    {/* HERO */}
    <section className="bg-gradient-to-br from-brand-black via-[#0e1611] to-[#0a0f0c] text-brand-white px-5 py-16 sm:py-24 text-center relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-green-dark/10 blur-3xl opacity-40 pointer-events-none" />
      <div className="relative max-w-3xl mx-auto space-y-6 z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-white/8 border border-brand-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase text-brand-green-light">
          <Store size={10} />
          Portal de Proveedores Skinly
        </span>
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05]">
          Vende en SKINLY.<br />
          <span className="text-brand-green-light">Llega a miles</span> de clientes.
        </h1>
        <p className="text-base text-brand-white/65 leading-relaxed max-w-xl mx-auto font-medium">
          Únete a la red de proveedores de skincare orgánico más exclusiva de México. Plataforma, logística y clientes — tú solo enfócate en formular.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={onApply}
            className="px-8 py-3.5 bg-brand-green-dark hover:bg-brand-green-light text-brand-white hover:text-brand-black font-extrabold text-sm rounded-luxury transition-all cursor-pointer shadow-lg"
          >
            Solicitar ser proveedor →
          </button>
          <a href="#estructura" className="px-8 py-3.5 bg-brand-white/8 hover:bg-brand-white/15 border border-brand-white/10 text-brand-white font-bold text-sm rounded-luxury transition-all cursor-pointer">
            Ver estructura de comisiones
          </a>
        </div>
      </div>
    </section>

    {/* BENEFICIOS */}
    <section className="max-w-6xl mx-auto px-4 py-14 sm:py-16 space-y-10">
      <div className="text-center space-y-2">
        <h2 className="font-heading text-3xl font-bold text-brand-black">¿Por qué vender en Skinly?</h2>
        <p className="text-sm text-brand-black/50 font-medium">Todo lo que necesitas para escalar tu marca de skincare.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { icon: <TrendingUp size={18} />, title: 'Miles de clientes calificados', desc: 'Accede a nuestra base de compradores activos apasionados por el skincare orgánico.' },
          { icon: <ShieldCheck size={18} />, title: 'Sello "Skinly Verificado"', desc: 'Tus productos obtienen el sello de verificación que impulsa la confianza y las conversiones.' },
          { icon: <Banknote size={18} />, title: 'Pagos puntuales', desc: 'Recibe tus ingresos netos cada quincena directamente a tu cuenta bancaria o PayPal.' },
          { icon: <BarChart2 size={18} />, title: 'Dashboard de ventas', desc: 'Panel en tiempo real con tus métricas: ventas, ingresos, inventario y más.' },
          { icon: <Award size={18} />, title: 'Programa de afiliados', desc: 'Activa el programa de afiliados y deja que influencers lleven tráfico a tus productos.' },
          { icon: <Leaf size={18} />, title: 'Mercado enfocado', desc: 'Clientes que buscan específicamente skincare natural, orgánico y libre de tóxicos.' },
        ].map(b => (
          <div key={b.title} className="bg-brand-white border border-brand-black/5 rounded-luxury p-6 shadow-sm space-y-3 text-left">
            <div className="w-9 h-9 bg-brand-green-dark/10 rounded-lg flex items-center justify-center text-brand-green-dark">{b.icon}</div>
            <p className="font-bold text-brand-black text-sm">{b.title}</p>
            <p className="text-[11px] text-brand-black/50 leading-relaxed font-medium">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ESTRUCTURA DE COMISIONES */}
    <section id="estructura" className="bg-brand-white border-y border-brand-black/5 py-14 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-brand-green-dark">
            <Percent size={10} /> Estructura de comisiones
          </span>
          <h2 className="font-heading text-3xl font-bold text-brand-black">Transparencia total en cada venta</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Comisión base */}
          <div className="bg-brand-gray-soft rounded-luxury p-6 space-y-4 border border-brand-black/5">
            <h3 className="font-heading text-base font-bold text-brand-black border-b border-brand-black/8 pb-2">Deducción por venta</h3>
            <div className="space-y-3">
              {[
                { label: 'Comisión Skinly', value: '5%', note: 'Por uso de plataforma, clientes y marketing', color: 'text-brand-green-dark' },
                { label: 'MercadoPago', value: '3.49% + $4 MXN', note: 'Cobrado por la pasarela de pago al procesador', color: 'text-[#009EE3]' },
                { label: 'PayPal', value: '3.49%', note: 'Cobrado por PayPal al procesador de pago', color: 'text-[#003087]' },
              ].map(r => (
                <div key={r.label} className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-xs font-bold text-brand-black">{r.label}</p>
                    <p className="text-[10px] text-brand-black/45 font-medium leading-relaxed">{r.note}</p>
                  </div>
                  <span className={`font-mono font-extrabold text-sm shrink-0 ${r.color}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Programa de afiliados */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-luxury p-6 space-y-4 border border-indigo-100">
            <h3 className="font-heading text-base font-bold text-brand-black border-b border-indigo-100 pb-2 flex items-center gap-2">
              <Award size={15} className="text-indigo-600" />
              Programa de afiliados (opcional)
            </h3>
            <p className="text-[11px] text-brand-black/60 font-medium leading-relaxed">
              Si activas el programa de afiliados, aplican costos adicionales cuando un influencer/afiliado refiere una venta de tu producto:
            </p>
            <div className="space-y-2">
              {[
                { label: 'Comisión al afiliado', value: '5%', color: 'text-indigo-600' },
                { label: 'Descuento al cliente', value: '10%', color: 'text-purple-600' },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <p className="text-xs font-semibold text-brand-black/70">{r.label}</p>
                  <span className={`font-mono font-extrabold text-sm ${r.color}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-brand-black/40 font-medium bg-white/60 p-2 rounded-lg">
              💡 Puedes activar o desactivar el programa de afiliados desde tu panel de proveedor en cualquier momento.
            </p>
          </div>
        </div>

        {/* Ejemplo práctico */}
        <div className="bg-brand-black text-brand-white rounded-luxury p-6 space-y-4">
          <h3 className="font-heading text-base font-bold">Ejemplo práctico: Serum a $850 MXN</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Precio de venta', value: '$850', note: 'Lo que paga el cliente' },
              { label: 'Comisión Skinly', value: '-$42.50', note: '5% de la venta' },
              { label: 'Pasarela (MP)', value: '-$33.66', note: '3.49% + $4 MXN' },
              { label: 'Ingreso neto*', value: '$773.84', note: 'Sin programa afiliados' },
            ].map(e => (
              <div key={e.label} className="space-y-1 text-center">
                <p className="text-[9px] uppercase tracking-widest font-bold text-brand-white/40">{e.label}</p>
                <p className={`font-heading text-xl font-extrabold ${e.label === 'Ingreso neto*' ? 'text-brand-green-light' : 'text-brand-white'}`}>{e.value}</p>
                <p className="text-[10px] text-brand-white/40 font-medium">{e.note}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-brand-white/30 font-medium">*Ingreso neto estimado. Los tiempos de acreditación dependen de la pasarela de pago.</p>
        </div>
      </div>
    </section>

    {/* TIPOS DE VENDEDOR */}
    <section className="max-w-5xl mx-auto px-4 py-14 sm:py-16 space-y-10">
      <div className="text-center space-y-2">
        <h2 className="font-heading text-3xl font-bold text-brand-black">Dos perfiles de vendedor</h2>
        <p className="text-sm text-brand-black/50 font-medium">Elige el que mejor se adapte a tu situación.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            icon: <Building2 size={22} className="text-brand-green-dark" />,
            type: 'Empresa Formal',
            badge: 'Mayor credibilidad',
            desc: 'Para empresas constituidas con RFC empresarial y registro ante COFEPRIS.',
            docs: ['RFC de empresa (texto)', 'Identificación oficial del representante legal', 'Acta constitutiva (PDF)', 'Registro sanitario COFEPRIS', 'Certificaciones de ingredientes'],
            color: 'brand-green-dark',
          },
          {
            icon: <UserIcon size={22} className="text-indigo-600" />,
            type: 'Emprendedor',
            badge: 'Proceso simplificado',
            desc: 'Para productores artesanales, formuladores independientes y marcas en crecimiento.',
            docs: ['RFC personal (texto)', 'Identificación oficial', 'Fotos del producto (hasta 5)', 'Descripción detallada de ingredientes', 'Declaración de inocuidad', 'Proceso de elaboración'],
            color: 'indigo-600',
          },
        ].map(t => (
          <div key={t.type} className="bg-brand-white border border-brand-black/5 rounded-luxury p-7 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className={`w-11 h-11 rounded-xl bg-${t.color}/10 flex items-center justify-center`}>{t.icon}</div>
              <span className="text-[9px] uppercase font-extrabold tracking-widest px-2.5 py-1 bg-brand-gray-soft rounded-full text-brand-black/50">{t.badge}</span>
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-brand-black">{t.type}</h3>
              <p className="text-[11px] text-brand-black/50 font-medium mt-1 leading-relaxed">{t.desc}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-black/40">Documentación requerida</p>
              {t.docs.map(d => (
                <div key={d} className="flex items-center gap-2">
                  <Check size={12} className="text-brand-green-dark shrink-0" />
                  <span className="text-[11px] text-brand-black/70 font-medium">{d}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button
          onClick={onApply}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-black hover:bg-brand-green-dark text-brand-white font-extrabold text-sm rounded-luxury transition-all cursor-pointer shadow-md"
        >
          <FlaskConical size={15} />
          Solicitar ser proveedor
        </button>
      </div>
    </section>

    {/* FAQ */}
    <section className="bg-brand-gray-soft border-t border-brand-black/5 py-14">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        <h2 className="font-heading text-2xl font-bold text-brand-black text-center">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {[
            { q: '¿Cuánto tiempo tarda en revisarse mi solicitud?', a: 'Revisamos cada solicitud en 3 a 5 días hábiles. Te notificaremos por correo electrónico con el resultado.' },
            { q: '¿Puedo vender si aún no tengo RFC?', a: 'Necesitas al menos RFC personal para registrarte como Emprendedor. Si no lo tienes, puedes tramitarlo en el SAT de forma gratuita.' },
            { q: '¿Cómo funciona el pago de mis ventas?', a: 'Los ingresos netos (después de comisiones) se depositan quincenalmente a la cuenta que registres. Los primeros 30 días aplica un período de verificación.' },
            { q: '¿Puedo tener mis propios precios?', a: 'Sí, tú defines el precio de venta de cada producto. Solo asegúrate de que el precio sea competitivo y cubra tus costos más las comisiones.' },
            { q: '¿Qué pasa si quiero salir de la plataforma?', a: 'Puedes retirar tus productos y solicitar la baja en cualquier momento. Solo necesitas que no haya órdenes pendientes de entrega.' },
          ].map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>
    </section>

  </div>
);

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-brand-white border border-brand-black/5 rounded-luxury overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <HelpCircle size={15} className="text-brand-green-dark shrink-0 mt-0.5" />
          <span className="text-sm font-bold text-brand-black">{question}</span>
        </div>
        <ChevronRight size={15} className={`text-brand-black/30 shrink-0 mt-0.5 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 pl-12 text-[11px] text-brand-black/55 font-medium leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  APPLICATION FLOW (formulario multi-paso)
// ─────────────────────────────────────────────────────────────────────────────
const SupplierApplyFlow: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { currentUser } = useApp();
  const [step, setStep] = useState<AppStep>(1);
  const [form, setForm] = useState<AppFormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof AppFormData | string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof AppFormData, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validateStep = (): boolean => {
    const e: typeof errors = {};
    if (step === 1 && !form.sellerType) e.sellerType = 'Selecciona el tipo de vendedor.';
    if (step === 2) {
      if (!form.brandName.trim()) e.brandName = 'Requerido.';
      if (!form.representativeName.trim()) e.representativeName = 'Requerido.';
      if (!form.contactEmail.trim()) e.contactEmail = 'Requerido.';
      if (!form.contactPhone.trim()) e.contactPhone = 'Requerido.';
      if (!form.stateCity.trim()) e.stateCity = 'Requerido.';
      if (!form.businessDescription.trim()) e.businessDescription = 'Requerido.';
    }
    if (step === 3) {
      if (!form.rfc.trim()) e.rfc = 'El RFC es requerido.';
      if (!form.idOfficialUrl) e.idOfficialUrl = 'Sube la identificación oficial.';
      if (form.sellerType === 'formal') {
        if (!form.actaUrl) e.actaUrl = 'Sube el acta constitutiva.';
      }
      if (form.sellerType === 'entrepreneur') {
        if (!form.ingredientsDetail.trim()) e.ingredientsDetail = 'Describe los ingredientes.';
        if (!form.inocuityDeclaration) e.inocuityDeclaration = 'Debes aceptar la declaración de inocuidad.';
        if (!form.elaborationProcess.trim()) e.elaborationProcess = 'Describe el proceso de elaboración.';
      }
    }
    if (step === 4) {
      if (form.categories.length === 0) e.categories = 'Selecciona al menos una categoría.';
      if (!form.productCount.trim()) e.productCount = 'Requerido.';
      if (!form.avgPrice.trim()) e.avgPrice = 'Requerido.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => (s + 1) as AppStep); };
  const prev = () => setStep(s => (s - 1) as AppStep);

  const handleSubmit = async () => {
    if (!currentUser || !validateStep()) return;
    setSubmitting(true);

    // Serialize the full form data
    const appData = JSON.stringify({
      sellerType: form.sellerType,
      representativeName: form.representativeName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      stateCity: form.stateCity,
      businessDescription: form.businessDescription,
      website: form.website,
      rfc: form.rfc,
      ingredientsDetail: form.ingredientsDetail,
      elaborationProcess: form.elaborationProcess,
      inocuityDeclaration: form.inocuityDeclaration,
      categories: form.categories,
      productCount: form.productCount,
      avgPrice: form.avgPrice,
      wantsAffiliate: form.wantsAffiliate,
      extraCertifications: form.extraCertifications,
    });

    const docsData = JSON.stringify({
      idOfficialUrl: form.idOfficialUrl,
      actaUrl: form.actaUrl,
      registroSanitarioUrl: form.registroSanitarioUrl,
      certificacionesUrl: form.certificacionesUrl,
      productPhotosUrls: form.productPhotosUrls,
    });

    const { error } = await supabase.from('suppliers').insert({
      user_id: currentUser.id,
      company_name: form.brandName,
      ingredients_description: appData,
      documents_url: docsData,
      status: 'pending',
    });

    setSubmitting(false);
    if (error) {
      setErrors({ _global: 'Error al enviar la solicitud: ' + error.message });
    } else {
      setSubmitted(true);
      onSuccess();
    }
  };

  if (submitted) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-brand-green-dark/10 border border-brand-green-dark/15 flex items-center justify-center mx-auto">
        <Check size={36} className="text-brand-green-dark" strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-bold text-brand-black">¡Solicitud enviada!</h2>
        <p className="text-sm text-brand-black/50 font-medium leading-relaxed">
          Tu solicitud será revisada en <strong>3-5 días hábiles</strong>. Te notificaremos por correo en cuanto tengamos una respuesta.
        </p>
      </div>
    </div>
  );

  const stepLabels = ['Tipo', 'Info básica', 'Documentación', 'Productos', 'Confirmar'];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 pb-24 space-y-6">

      {/* Progreso */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-brand-black">Solicitud de Proveedor</h1>
          <span className="text-xs font-bold text-brand-black/40">Paso {step} de 5</span>
        </div>
        <div className="flex gap-1.5">
          {[1,2,3,4,5].map(s => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-brand-green-dark' : 'bg-brand-gray-soft'}`}
            />
          ))}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-black/40">{stepLabels[step - 1]}</p>
      </div>

      {errors._global && (
        <div className="flex gap-2 items-start p-3 bg-red-50 border border-red-200 rounded-luxury text-xs text-red-700 font-semibold">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />{errors._global}
        </div>
      )}

      {/* ── Paso 1: Tipo de vendedor ───────────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 space-y-5">
          <div>
            <h2 className="font-heading text-lg font-bold text-brand-black">¿Cómo describes tu negocio?</h2>
            <p className="text-xs text-brand-black/50 font-medium mt-1">El tipo de vendedor define los documentos requeridos.</p>
          </div>
          <div className="space-y-3">
            {[
              { val: 'formal', icon: <Building2 size={20} className="text-brand-green-dark" />, title: 'Empresa Formal', desc: 'Tengo RFC empresarial, acta constitutiva y registro COFEPRIS.' },
              { val: 'entrepreneur', icon: <UserIcon size={20} className="text-indigo-600" />, title: 'Emprendedor', desc: 'Soy productor artesanal o marca independiente con RFC personal.' },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => set('sellerType', opt.val)}
                className={`w-full flex items-start gap-4 p-4 rounded-luxury border-2 text-left cursor-pointer transition-all ${
                  form.sellerType === opt.val
                    ? 'border-brand-green-dark bg-brand-green-dark/5'
                    : 'border-brand-black/10 hover:border-brand-black/20'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-brand-gray-soft flex items-center justify-center shrink-0 mt-0.5">{opt.icon}</div>
                <div>
                  <p className="font-bold text-brand-black text-sm">{opt.title}</p>
                  <p className="text-[11px] text-brand-black/50 font-medium leading-relaxed mt-0.5">{opt.desc}</p>
                </div>
                {form.sellerType === opt.val && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-brand-green-dark flex items-center justify-center shrink-0">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            ))}
            {errors.sellerType && <p className="text-[10px] text-red-500 font-semibold">{errors.sellerType}</p>}
          </div>
        </div>
      )}

      {/* ── Paso 2: Información básica ─────────────────────────────────────── */}
      {step === 2 && (
        <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 space-y-4">
          <h2 className="font-heading text-lg font-bold text-brand-black border-b border-brand-black/5 pb-3">Información básica</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SField label="Nombre de la empresa/marca" required error={errors.brandName as string}>
              <input value={form.brandName} onChange={e => set('brandName', e.target.value)} placeholder="OrgaSkyn Labs" className={inputCls(errors.brandName as string)} />
            </SField>
            <SField label="Nombre del representante" required error={errors.representativeName as string}>
              <input value={form.representativeName} onChange={e => set('representativeName', e.target.value)} placeholder="María González" className={inputCls(errors.representativeName as string)} />
            </SField>
            <SField label="Email de contacto" required error={errors.contactEmail as string}>
              <input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="maria@orgaskyn.com" className={inputCls(errors.contactEmail as string)} />
            </SField>
            <SField label="Teléfono" required error={errors.contactPhone as string}>
              <input type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="+52 555-0199" className={inputCls(errors.contactPhone as string)} />
            </SField>
            <SField label="Estado / Ciudad" required error={errors.stateCity as string}>
              <input value={form.stateCity} onChange={e => set('stateCity', e.target.value)} placeholder="Ciudad de México, CDMX" className={inputCls(errors.stateCity as string)} />
            </SField>
            <SField label="Sitio web o redes sociales">
              <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://instagram.com/tumarca" className={inputCls()} />
            </SField>
          </div>
          <SField label="Descripción del negocio" required error={errors.businessDescription as string}>
            <textarea rows={4} value={form.businessDescription} onChange={e => set('businessDescription', e.target.value)} placeholder="Cuéntanos sobre tu empresa, tu historia y qué tipo de productos elaboras..." className={textareaCls} />
          </SField>
        </div>
      )}

      {/* ── Paso 3: Documentación ─────────────────────────────────────────── */}
      {step === 3 && (
        <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 space-y-5">
          <div>
            <h2 className="font-heading text-lg font-bold text-brand-black border-b border-brand-black/5 pb-3">Documentación</h2>
            <p className="text-xs text-brand-black/40 font-medium mt-1">
              Perfil: <strong>{form.sellerType === 'formal' ? 'Empresa Formal' : 'Emprendedor'}</strong>
            </p>
          </div>

          <SField label="RFC" required error={errors.rfc as string}>
            <input
              value={form.rfc}
              onChange={e => set('rfc', e.target.value.toUpperCase())}
              placeholder={form.sellerType === 'formal' ? 'ABC891204EK5' : 'GOML850101AB2'}
              maxLength={13}
              className={inputCls(errors.rfc as string)}
            />
          </SField>

          <FileUploadField
            label="Identificación oficial"
            accept="image/*,.pdf"
            value={form.idOfficialUrl}
            onChange={url => set('idOfficialUrl', url)}
            userId={currentUser?.id || 'guest'}
            required
            error={errors.idOfficialUrl as string}
            hint={form.sellerType === 'formal' ? 'INE/pasaporte del representante legal (imagen o PDF)' : 'INE/pasaporte (imagen o PDF)'}
          />

          {form.sellerType === 'formal' && (
            <>
              <FileUploadField
                label="Acta constitutiva"
                accept=".pdf,image/*"
                value={form.actaUrl}
                onChange={url => set('actaUrl', url)}
                userId={currentUser?.id || 'guest'}
                required
                error={errors.actaUrl as string}
                hint="Documento oficial de constitución de la empresa (PDF)"
              />
              <FileUploadField
                label="Registro sanitario COFEPRIS"
                accept=".pdf,image/*"
                value={form.registroSanitarioUrl}
                onChange={url => set('registroSanitarioUrl', url)}
                userId={currentUser?.id || 'guest'}
                hint="Si no cuentas con él aún, indícalo en la descripción del negocio"
              />
              <FileUploadField
                label="Certificaciones de ingredientes"
                accept=".pdf,image/*"
                value={form.certificacionesUrl}
                onChange={url => set('certificacionesUrl', url)}
                userId={currentUser?.id || 'guest'}
                hint="Certificaciones orgánicas, de inocuidad u otras (PDF)"
              />
            </>
          )}

          {form.sellerType === 'entrepreneur' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
                  Fotos del producto <span className="text-brand-black/30 font-normal normal-case tracking-normal">(hasta 5)</span>
                </label>
                <MultiPhotoUpload value={form.productPhotosUrls} onChange={urls => set('productPhotosUrls', urls)} userId={currentUser?.id || 'guest'} />
              </div>

              <SField label="Descripción detallada de ingredientes" required error={errors.ingredientsDetail as string}>
                <textarea rows={4} value={form.ingredientsDetail} onChange={e => set('ingredientsDetail', e.target.value)} placeholder="Lista todos los ingredientes que utilizas, su origen y concentraciones aproximadas..." className={textareaCls} />
              </SField>

              <SField label="Proceso de elaboración" required error={errors.elaborationProcess as string}>
                <textarea rows={3} value={form.elaborationProcess} onChange={e => set('elaborationProcess', e.target.value)} placeholder="Describe cómo elaboras tus productos: lugar, condiciones de higiene, temperatura, etc." className={textareaCls} />
              </SField>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => set('inocuityDeclaration', !form.inocuityDeclaration)}
                  className="flex items-start gap-3 cursor-pointer text-left group w-full"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    form.inocuityDeclaration ? 'bg-brand-green-dark border-brand-green-dark' : 'border-brand-black/30 group-hover:border-brand-green-dark'
                  }`}>
                    {form.inocuityDeclaration && <Check size={10} className="text-white" />}
                  </div>
                  <p className="text-[11px] text-brand-black/70 font-medium leading-relaxed">
                    <strong className="text-brand-black">Declaración de inocuidad:</strong> Declaro que mis productos no contienen ingredientes dañinos, tóxicos o prohibidos por la normativa mexicana e internacional de cosméticos.
                    <span className="text-red-400 ml-1">*</span>
                  </p>
                </button>
                {errors.inocuityDeclaration && <p className="text-[10px] text-red-500 font-semibold">{errors.inocuityDeclaration}</p>}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Paso 4: Productos ──────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 space-y-5">
          <h2 className="font-heading text-lg font-bold text-brand-black border-b border-brand-black/5 pb-3">Sobre tus productos</h2>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-black/60">Categorías que manejas <span className="text-red-400">*</span></p>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_CATEGORIES.map(cat => {
                const active = form.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set('categories', active ? form.categories.filter(c => c !== cat) : [...form.categories, cat])}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                      active ? 'bg-brand-green-dark text-white border-brand-green-dark' : 'bg-brand-white text-brand-black/60 border-brand-black/10 hover:border-brand-black/20'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            {errors.categories && <p className="text-[10px] text-red-500 font-semibold">{errors.categories}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SField label="Número aprox. de productos" required error={errors.productCount as string}>
              <input type="number" min="1" value={form.productCount} onChange={e => set('productCount', e.target.value)} placeholder="12" className={inputCls(errors.productCount as string)} />
            </SField>
            <SField label="Precio promedio (MXN)" required error={errors.avgPrice as string}>
              <input type="number" min="1" value={form.avgPrice} onChange={e => set('avgPrice', e.target.value)} placeholder="650" className={inputCls(errors.avgPrice as string)} />
            </SField>
          </div>

          {/* Toggle afiliados */}
          <div className="p-4 border border-brand-black/8 rounded-luxury space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-brand-black">¿Activar programa de afiliados?</p>
                <p className="text-[10px] text-brand-black/45 font-medium leading-relaxed">
                  Los influencers podrán promover tus productos a cambio de 5% de comisión. El cliente recibe 10% de descuento. Solo aplica cuando el cliente usa el cupón del afiliado.
                </p>
              </div>
              <button type="button" onClick={() => set('wantsAffiliate', !form.wantsAffiliate)} className="shrink-0 cursor-pointer">
                {form.wantsAffiliate
                  ? <ToggleRight size={28} className="text-brand-green-dark" />
                  : <ToggleLeft size={28} className="text-brand-black/30" />}
              </button>
            </div>
            {form.wantsAffiliate && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[10px] text-amber-800 font-semibold">
                ⚠️ Al activarlo, acepta que cada venta con cupón afiliado deducirá un 5% adicional de tu ingreso neto, más el 10% de descuento al cliente.
              </div>
            )}
          </div>

          <SField label="Certificaciones adicionales (opcional)">
            <textarea rows={2} value={form.extraCertifications} onChange={e => set('extraCertifications', e.target.value)} placeholder="NOM-141-SSA1, certificado orgánico USDA, cruelty-free, vegano, etc." className={textareaCls} />
          </SField>
        </div>
      )}

      {/* ── Paso 5: Confirmación ──────────────────────────────────────────── */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 space-y-4">
            <h2 className="font-heading text-lg font-bold text-brand-black border-b border-brand-black/5 pb-3">Resumen de tu solicitud</h2>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              {[
                ['Tipo de vendedor', form.sellerType === 'formal' ? 'Empresa Formal' : 'Emprendedor'],
                ['Marca / Empresa', form.brandName],
                ['Representante', form.representativeName],
                ['Email', form.contactEmail],
                ['Teléfono', form.contactPhone],
                ['Ciudad/Estado', form.stateCity],
                ['RFC', form.rfc],
                ['Categorías', form.categories.join(', ') || '-'],
                ['Nº de productos', form.productCount || '-'],
                ['Precio promedio', form.avgPrice ? `$${form.avgPrice} MXN` : '-'],
                ['Programa afiliados', form.wantsAffiliate ? 'Sí, activado' : 'No'],
                ['Docs subidos',
                  [form.idOfficialUrl && 'ID', form.actaUrl && 'Acta', form.registroSanitarioUrl && 'COFEPRIS', form.certificacionesUrl && 'Certs', form.productPhotosUrls.length > 0 && `${form.productPhotosUrls.length} fotos`]
                    .filter(Boolean).join(', ') || 'Ninguno adicional'],
              ].map(([label, value]) => (
                <React.Fragment key={label as string}>
                  <span className="text-brand-black/40 font-semibold">{label}</span>
                  <span className="text-brand-black font-bold text-right">{value}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Términos y condiciones */}
          <div className="bg-brand-white p-5 rounded-luxury border border-brand-black/5 space-y-3 text-[10px] text-brand-black/50 font-medium leading-relaxed max-h-36 overflow-y-auto">
            <p className="font-bold text-brand-black text-xs">Términos y Condiciones de Proveedores Skinly</p>
            <p>Al enviar esta solicitud, confirmas que toda la información proporcionada es verídica y que los documentos presentados son auténticos. Entiendes que Skinly puede rechazar tu solicitud sin necesidad de justificación si los productos no cumplen con los estándares de calidad o inocuidad de la plataforma.</p>
            <p>Aceptas que Skinly aplicará una comisión del 5% sobre cada venta realizada a través de la plataforma. Los pagos a proveedores se realizarán de forma quincenal, sujetos a período de verificación inicial de 30 días.</p>
            <p>Los precios de tus productos son responsabilidad tuya. Skinly no se hace responsable de disputas relacionadas con la calidad del producto si este fue aprobado con base en documentación falsa.</p>
            <p>Puedes solicitar la baja de tu cuenta como proveedor en cualquier momento con un aviso de 15 días hábiles, siempre que no existan órdenes pendientes.</p>
          </div>

          <p className="flex items-center gap-2 text-xs text-brand-black/60 font-medium">
            <Clock size={12} className="text-brand-green-dark shrink-0" />
            Tu solicitud será revisada en <strong className="text-brand-black">3-5 días hábiles</strong>. Recibirás una notificación por correo.
          </p>
        </div>
      )}

      {/* Navegación entre pasos */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={prev}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-brand-black/10 text-brand-black text-xs font-bold rounded-luxury hover:border-brand-black/20 cursor-pointer transition-colors"
          >
            <ChevronLeft size={14} /> Anterior
          </button>
        )}
        {step < 5 && (
          <button
            type="button"
            onClick={next}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-brand-black hover:bg-brand-green-dark text-brand-white text-xs font-bold rounded-luxury cursor-pointer transition-colors"
          >
            Siguiente <ChevronRight size={14} />
          </button>
        )}
        {step === 5 && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-brand-green-dark hover:bg-brand-black text-brand-white text-xs font-bold rounded-luxury cursor-pointer transition-colors disabled:opacity-60"
          >
            {submitting ? <><Loader2 size={13} className="animate-spin" /> Enviando…</> : <><Check size={13} /> Enviar solicitud</>}
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  PENDING SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const ApplicationPending: React.FC<{ application: any; onViewDetails: () => void }> = ({ application, onViewDetails }) => (
  <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
    <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
      <Clock size={32} className="text-amber-600" strokeWidth={1.5} />
    </div>
    <div className="space-y-2">
      <h2 className="font-heading text-2xl font-bold text-brand-black">Solicitud en revisión</h2>
      <p className="text-sm text-brand-black/50 font-medium leading-relaxed">
        Hemos recibido tu solicitud para <strong>{application?.company_name || 'tu marca'}</strong>. Nuestro equipo la revisará en 3-5 días hábiles.
      </p>
    </div>
    <div className="bg-brand-white border border-brand-black/5 rounded-luxury p-5 text-left space-y-3 shadow-sm">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-brand-black/50">Estado</span>
        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase rounded-full border border-amber-200">Pendiente</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-brand-black/50">Empresa / Marca</span>
        <span className="font-bold text-brand-black">{application?.company_name || '-'}</span>
      </div>
      {application?.created_at && (
        <div className="flex justify-between text-xs">
          <span className="font-semibold text-brand-black/50">Fecha de solicitud</span>
          <span className="font-bold text-brand-black">{new Date(application.created_at).toLocaleDateString('es-MX')}</span>
        </div>
      )}
    </div>
    <button onClick={onViewDetails} className="text-xs font-semibold text-brand-green-dark hover:underline cursor-pointer">
      Ver detalles de la solicitud →
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  SUPPLIER DASHBOARD (role='supplier')
// ─────────────────────────────────────────────────────────────────────────────
const SupplierDashboard: React.FC = () => {
  const { currentUser, setView } = useApp();
  const [tab, setTab] = useState<DashTab>('overview');
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [salesItems, setSalesItems] = useState<any[]>([]);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    setRefreshing(true);

    const [{ data: prods }, { data: app }] = await Promise.all([
      supabase.from('products').select('*').eq('supplier_id', currentUser.id).order('created_at', { ascending: false }),
      supabase.from('suppliers').select('*').eq('user_id', currentUser.id).maybeSingle(),
    ]);

    setMyProducts(prods || []);
    setApplication(app);

    if (prods && prods.length > 0) {
      const productIds = prods.map((p: any) => p.id);
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, quantity, price, orders(id, status, created_at, total)')
        .in('product_id', productIds);
      setSalesItems(items || []);
    }

    setLoading(false);
    setRefreshing(false);
  }, [currentUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Metrics ─────────────────────────────────────────────────────────────────
  const paidItems = salesItems.filter((i: any) => PAID_STATUSES.includes(i.orders?.status || ''));

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());

  const revenue = (items: any[]) => items.reduce((s: number, i: any) => s + (Number(i.price) * Number(i.quantity)), 0);
  const monthItems = paidItems.filter((i: any) => new Date(i.orders?.created_at) >= startOfMonth);
  const weekItems  = paidItems.filter((i: any) => new Date(i.orders?.created_at) >= startOfWeek);
  const monthRev = revenue(monthItems);
  const weekRev  = revenue(weekItems);
  const netMonthRev = monthRev * (1 - SKINLY_COMMISSION);

  // Top products by units sold
  const productSalesMap: Record<string, { name: string; units: number; revenue: number }> = {};
  paidItems.forEach((i: any) => {
    const prod = myProducts.find((p: any) => p.id === i.product_id);
    if (!productSalesMap[i.product_id]) {
      productSalesMap[i.product_id] = { name: prod?.name || 'Producto', units: 0, revenue: 0 };
    }
    productSalesMap[i.product_id].units += Number(i.quantity);
    productSalesMap[i.product_id].revenue += Number(i.price) * Number(i.quantity);
  });
  const topProducts = Object.entries(productSalesMap)
    .sort(([, a], [, b]) => b.units - a.units)
    .slice(0, 5);

  // Recent orders (unique)
  const recentOrders: any[] = [];
  const seenIds = new Set<string>();
  paidItems.forEach((i: any) => {
    if (i.orders?.id && !seenIds.has(i.orders.id)) {
      seenIds.add(i.orders.id);
      recentOrders.push(i.orders);
    }
  });
  recentOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const tabItems: { id: DashTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',     label: 'Resumen',        icon: <BarChart2 size={14} /> },
    { id: 'products',     label: 'Mis Productos',   icon: <Package size={14} /> },
    { id: 'application',  label: 'Mi Solicitud',    icon: <FileText size={14} /> },
    { id: 'account',      label: 'Mi Cuenta',       icon: <Settings size={14} /> },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-32 gap-2 text-brand-black/40">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm font-semibold">Cargando portal…</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-[9px] font-extrabold uppercase tracking-widest text-amber-700">
              <FlaskConical size={9} /> Portal de Proveedor
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-brand-black">
            Hola, {currentUser?.fullName?.split(' ')[0] || 'Proveedor'}
          </h1>
          {application?.company_name && (
            <p className="text-xs text-brand-black/40 font-medium mt-0.5 flex items-center gap-1">
              <Building2 size={11} /> {application.company_name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-brand-black/60 hover:text-brand-black border border-brand-black/10 rounded-luxury cursor-pointer transition-colors"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={() => setView('categories')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-brand-white bg-brand-black hover:bg-brand-green-dark rounded-luxury cursor-pointer transition-colors"
          >
            <ExternalLink size={12} /> Ver tienda
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-brand-gray-soft rounded-luxury p-1 overflow-x-auto scrollbar-none">
        {tabItems.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-luxury whitespace-nowrap transition-all cursor-pointer ${
              tab === t.id ? 'bg-brand-white text-brand-black shadow-sm' : 'text-brand-black/50 hover:text-brand-black'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: RESUMEN ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Ingresos este mes" value={`$${monthRev.toFixed(0)}`} sub="MXN brutos (pagados)" icon={<Banknote size={16} />} />
            <StatCard label="Neto este mes (–5%)" value={`$${netMonthRev.toFixed(0)}`} sub="Después de comisión Skinly" icon={<Percent size={16} />} color="indigo-600" />
            <StatCard label="Ventas esta semana" value={`$${weekRev.toFixed(0)}`} sub="MXN de pedidos pagados" icon={<TrendingUp size={16} />} color="amber-600" />
            <StatCard label="Productos activos" value={`${myProducts.filter((p: any) => p.stock > 0).length}`} sub={`de ${myProducts.length} en total`} icon={<Package size={16} />} color="sky-600" />
          </div>

          {/* Top productos + últimas órdenes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top productos */}
            <div className="bg-brand-white rounded-luxury border border-brand-black/5 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-brand-black/5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black">Top 5 Productos</h3>
              </div>
              <div className="divide-y divide-brand-black/5">
                {topProducts.length === 0 ? (
                  <p className="text-xs text-brand-black/40 p-5 text-center font-medium">Sin ventas registradas aún.</p>
                ) : topProducts.map(([id, data], i) => (
                  <div key={id} className="px-5 py-3 flex items-center gap-3">
                    <span className="text-[10px] font-extrabold text-brand-black/30 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-brand-black truncate">{data.name}</p>
                      <p className="text-[10px] text-brand-black/40 font-medium">{data.units} unidades vendidas</p>
                    </div>
                    <span className="text-xs font-extrabold text-brand-green-dark">${data.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Últimas órdenes */}
            <div className="bg-brand-white rounded-luxury border border-brand-black/5 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-brand-black/5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black">Últimas Órdenes</h3>
              </div>
              <div className="divide-y divide-brand-black/5">
                {recentOrders.length === 0 ? (
                  <p className="text-xs text-brand-black/40 p-5 text-center font-medium">Sin pedidos aún.</p>
                ) : recentOrders.slice(0, 8).map((o: any) => (
                  <div key={o.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-brand-black font-mono">#{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] text-brand-black/40 font-medium">{new Date(o.created_at).toLocaleDateString('es-MX')}</p>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-brand-green-dark/10 text-brand-green-dark font-extrabold uppercase rounded-full border border-brand-green-dark/15">
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Low stock alert */}
          {myProducts.some((p: any) => p.stock <= 5) && (
            <div className="bg-amber-50 border border-amber-200 rounded-luxury p-4 flex items-start gap-3">
              <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800">Bajo stock en {myProducts.filter((p: any) => p.stock <= 5).length} producto(s)</p>
                <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                  {myProducts.filter((p: any) => p.stock <= 5).map((p: any) => p.name).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: MIS PRODUCTOS ───────────────────────────────────────────────── */}
      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-brand-black/50">{myProducts.length} productos registrados</p>
          </div>
          {myProducts.length === 0 ? (
            <div className="bg-brand-white rounded-luxury border border-brand-black/5 p-12 text-center space-y-3 shadow-sm">
              <Package size={32} className="text-brand-black/15 mx-auto" strokeWidth={1} />
              <p className="text-sm font-semibold text-brand-black/50">Aún no tienes productos registrados.</p>
              <p className="text-xs text-brand-black/30 font-medium">El equipo de Skinly cargará tus productos tras la aprobación de tu solicitud.</p>
            </div>
          ) : (
            <div className="bg-brand-white rounded-luxury border border-brand-black/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-brand-black/5 bg-brand-gray-soft/50">
                      <th className="text-left px-5 py-3 font-bold text-brand-black/50 uppercase tracking-wider">Producto</th>
                      <th className="text-left px-4 py-3 font-bold text-brand-black/50 uppercase tracking-wider">Categoría</th>
                      <th className="text-right px-4 py-3 font-bold text-brand-black/50 uppercase tracking-wider">Precio</th>
                      <th className="text-right px-4 py-3 font-bold text-brand-black/50 uppercase tracking-wider">Stock</th>
                      <th className="text-right px-4 py-3 font-bold text-brand-black/50 uppercase tracking-wider">Unidades vendidas</th>
                      <th className="text-right px-5 py-3 font-bold text-brand-black/50 uppercase tracking-wider">Ingresos brutos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-black/5">
                    {myProducts.map((p: any) => {
                      const stats = productSalesMap[p.id] || { units: 0, revenue: 0 };
                      return (
                        <tr key={p.id} className="hover:bg-brand-gray-soft/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              {p.image_url && (
                                <img src={p.image_url} alt="" className="w-8 h-10 object-cover rounded-md border border-brand-black/5 bg-brand-gray-soft shrink-0" />
                              )}
                              <span className="font-bold text-brand-black">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-brand-black/60">{p.category}</td>
                          <td className="px-4 py-3.5 text-right font-bold text-brand-black">${Number(p.price).toFixed(0)}</td>
                          <td className="px-4 py-3.5 text-right">
                            <span className={`font-extrabold ${p.stock <= 5 ? 'text-red-500' : 'text-brand-black'}`}>{p.stock}</span>
                          </td>
                          <td className="px-4 py-3.5 text-right text-brand-black/70 font-semibold">{stats.units}</td>
                          <td className="px-5 py-3.5 text-right font-extrabold text-brand-green-dark">${stats.revenue.toFixed(0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: MI SOLICITUD ────────────────────────────────────────────────── */}
      {tab === 'application' && (
        <div className="space-y-4 max-w-2xl">
          {!application ? (
            <div className="bg-brand-white rounded-luxury border border-brand-black/5 p-8 text-center space-y-3 shadow-sm">
              <FileText size={28} className="text-brand-black/15 mx-auto" strokeWidth={1} />
              <p className="text-sm font-semibold text-brand-black/50">No encontramos una solicitud vinculada a tu cuenta.</p>
            </div>
          ) : (
            <>
              <div className="bg-brand-white rounded-luxury border border-brand-black/5 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-base font-bold text-brand-black">Estado de tu solicitud</h3>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide rounded-full border ${
                    application.status === 'approved'
                      ? 'bg-brand-green-dark/10 text-brand-green-dark border-brand-green-dark/20'
                      : application.status === 'rejected'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {application.status === 'approved' ? 'Aprobado' : application.status === 'rejected' ? 'Rechazado' : 'Pendiente de revisión'}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    ['Empresa / Marca', application.company_name],
                    ['Fecha de solicitud', new Date(application.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-brand-black/5 last:border-0">
                      <span className="font-semibold text-brand-black/50">{label}</span>
                      <span className="font-bold text-brand-black">{value}</span>
                    </div>
                  ))}
                </div>
                {application.verification_notes && (
                  <div className="bg-brand-gray-soft rounded-luxury p-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-black/40">Notas del administrador</p>
                    <p className="text-xs text-brand-black/70 font-medium leading-relaxed">{application.verification_notes}</p>
                  </div>
                )}
              </div>

              {/* Documentos subidos */}
              {(() => {
                let docs: Record<string, string | string[]> = {};
                try { docs = JSON.parse(application.documents_url || '{}'); } catch {}
                const entries = Object.entries(docs).filter(([, v]) => v && (typeof v === 'string' ? v.length > 0 : (v as string[]).length > 0));
                if (entries.length === 0) return null;
                return (
                  <div className="bg-brand-white rounded-luxury border border-brand-black/5 p-6 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5">Documentos enviados</h3>
                    <div className="space-y-2">
                      {entries.map(([key, val]) => {
                        const labelMap: Record<string, string> = {
                          idOfficialUrl: 'Identificación Oficial', actaUrl: 'Acta Constitutiva',
                          registroSanitarioUrl: 'Registro COFEPRIS', certificacionesUrl: 'Certificaciones',
                          productPhotosUrls: 'Fotos del Producto',
                        };
                        const urls = Array.isArray(val) ? val : [val as string];
                        return urls.map((url, i) => (
                          <div key={`${key}-${i}`} className="flex items-center justify-between py-2 border-b border-brand-black/4 last:border-0">
                            <div className="flex items-center gap-2">
                              <FileText size={12} className="text-brand-green-dark" />
                              <span className="text-xs font-semibold text-brand-black">{labelMap[key] || key}{urls.length > 1 ? ` ${i + 1}` : ''}</span>
                            </div>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-green-dark hover:underline cursor-pointer flex items-center gap-1">
                              Ver <ExternalLink size={10} />
                            </a>
                          </div>
                        ));
                      })}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* ── TAB: MI CUENTA ───────────────────────────────────────────────────── */}
      {tab === 'account' && (
        <div className="space-y-5 max-w-xl">
          <div className="bg-brand-white rounded-luxury border border-brand-black/5 p-6 shadow-sm space-y-4">
            <h3 className="font-heading text-base font-bold text-brand-black border-b border-brand-black/5 pb-3">Información de cuenta</h3>
            <div className="space-y-3 text-xs">
              {[
                ['Nombre', currentUser?.fullName || '-'],
                ['Email', currentUser?.email || '-'],
                ['Teléfono', currentUser?.phone || '-'],
                ['Dirección', currentUser?.address ? `${currentUser.address}, ${currentUser.city}` : '-'],
                ['Rol de plataforma', 'Proveedor verificado'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-brand-black/5 last:border-0">
                  <span className="font-semibold text-brand-black/50">{label}</span>
                  <span className="font-bold text-brand-black text-right max-w-[60%] truncate">{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setView('profile')}
              className="text-[11px] font-bold text-brand-green-dark hover:underline cursor-pointer"
            >
              Actualizar datos de perfil →
            </button>
          </div>

          {/* Programa de afiliados */}
          {(() => {
            let appData: any = {};
            try { appData = JSON.parse(application?.ingredients_description || '{}'); } catch {}
            return (
              <div className="bg-brand-white rounded-luxury border border-brand-black/5 p-6 shadow-sm space-y-3">
                <h3 className="font-heading text-sm font-bold text-brand-black">Programa de Afiliados</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-brand-black/70">Estado actual</p>
                    <p className="text-[10px] text-brand-black/40 font-medium leading-relaxed mt-0.5">
                      {appData.wantsAffiliate ? 'Activado — influencers pueden promover tus productos.' : 'Desactivado — tus productos no aparecen en el programa de afiliados.'}
                    </p>
                  </div>
                  {appData.wantsAffiliate
                    ? <ToggleRight size={28} className="text-brand-green-dark shrink-0" />
                    : <ToggleLeft size={28} className="text-brand-black/20 shrink-0" />}
                </div>
                <p className="text-[10px] text-brand-black/40 font-medium">
                  Para cambiar la configuración de afiliados, contacta a <strong>soporte@skinly.mx</strong>
                </p>
              </div>
            );
          })()}

          <div className="bg-brand-gray-soft rounded-luxury p-4 text-[10px] text-brand-black/40 font-medium leading-relaxed space-y-1">
            <p className="font-bold text-brand-black/60">¿Necesitas ayuda?</p>
            <p>Escríbenos a <strong className="text-brand-green-dark">proveedores@skinly.mx</strong> o comunícate por WhatsApp. Nuestro equipo responde en menos de 24 horas hábiles.</p>
          </div>
        </div>
      )}

    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN ROUTER
// ─────────────────────────────────────────────────────────────────────────────
export const SupplierPortal: React.FC = () => {
  const { currentUser, setView } = useApp();
  const [existingApp, setExistingApp] = useState<any>(null);
  const [checkingApp, setCheckingApp] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!currentUser) { setCheckingApp(false); return; }
      const { data } = await supabase
        .from('suppliers')
        .select('id, status, company_name, created_at, verification_notes')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      setExistingApp(data);
      setCheckingApp(false);
    };
    check();
  }, [currentUser]);

  if (checkingApp) return (
    <div className="flex items-center justify-center py-32 gap-2 text-brand-black/40">
      <Loader2 size={16} className="animate-spin" />
      <span className="text-sm font-semibold">Cargando…</span>
    </div>
  );

  // ── Proveedor aprobado → Dashboard
  if (currentUser?.role === 'supplier') return <SupplierDashboard />;

  // ── Usuario con solicitud pendiente o rechazada
  if (currentUser && existingApp && !showForm) {
    if (existingApp.status === 'pending') {
      return <ApplicationPending application={existingApp} onViewDetails={() => setShowForm(true)} />;
    }
    if (existingApp.status === 'rejected') {
      return (
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
            <X size={32} className="text-red-500" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-bold text-brand-black">Solicitud no aprobada</h2>
            <p className="text-sm text-brand-black/50 font-medium leading-relaxed">
              Lo sentimos, tu solicitud para <strong>{existingApp.company_name}</strong> no fue aprobada en esta ocasión.
            </p>
            {existingApp.verification_notes && (
              <div className="bg-brand-white border border-brand-black/5 rounded-luxury p-4 text-xs text-brand-black/60 font-medium text-left mt-3">
                <p className="font-bold text-brand-black mb-1">Motivo indicado:</p>
                {existingApp.verification_notes}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-black hover:bg-brand-green-dark text-brand-white text-xs font-bold rounded-luxury cursor-pointer transition-colors"
          >
            Volver a solicitar
          </button>
        </div>
      );
    }
  }

  // ── Formulario de solicitud
  if (showForm && currentUser) {
    return (
      <div>
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <button
            onClick={() => setShowForm(false)}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-black/40 hover:text-brand-black cursor-pointer transition-colors"
          >
            <ChevronLeft size={14} /> Volver
          </button>
        </div>
        <SupplierApplyFlow onSuccess={() => { setShowForm(false); window.location.reload(); }} />
      </div>
    );
  }

  // ── Landing pública (+ CTA que lleva al login si no hay sesión, o al formulario si hay sesión)
  return (
    <SupplierLanding
      onApply={() => {
        if (!currentUser) {
          setView('login');
        } else {
          setShowForm(true);
        }
      }}
    />
  );
};
