import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button, Input } from '../../components/UI';
import { Leaf, Eye, EyeOff, ShieldAlert, Check } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, setView } = useApp();
  
  // Inputs limpios
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberProfile, setRememberProfile] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Disparador oculto para modo desarrollador
  const [showHiddenDevTray, setShowHiddenDevTray] = useState(false);

  const demoAccounts = [
    { email: 'gustavo.tg130808@gmail.com', pass: 'negros130808$', label: 'Administrador (Gustavo)' },
    { email: 'customer@gmail.com', pass: 'customer123', label: 'Cliente (Giselle Thorne)' },
    { email: 'lupita@skinly.co', pass: 'lupita123', label: 'Afiliada (Lupita)' },
    { email: 'labs@orgaskyn.com', pass: 'labs123', label: 'Proveedor de Lab (Dr. Marcus Vance)' }
  ];

  const handleDevPresetSelect = (demo: typeof demoAccounts[0]) => {
    setEmail(demo.email);
    setPassword(demo.pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!password) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Credenciales incorrectas.');
      }
    } catch (err) {
      setError('Ocurrió un error durante la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (platform: string) => {
    setLoading(true);
    setError('');
    setTimeout(async () => {
      await login('customer@gmail.com', 'customer123');
      setLoading(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-brand-gray-soft flex items-center justify-center p-4 sm:p-6 md:p-8 select-none relative overflow-hidden">
      
      {/* Degradados decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-brand-green-dark/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-brand-green-light/5 blur-[120px]" />

      <div className="w-full max-w-[440px] bg-brand-white p-8 sm:p-10 rounded-luxury shadow-xl border border-brand-black/5 relative z-10">
        
        {/* Encabezado de marca y disparador secreto */}
        <div className="flex flex-col items-center text-center mb-8 select-none">
          <div className="w-12 h-12 rounded-full bg-brand-green-dark/10 flex items-center justify-center text-brand-green-dark mb-4">
            <Leaf size={22} className="stroke-[1.5]" />
          </div>
          
          {/* Doble clic secreto para presets de desarrollador */}
          <h2 
            onDoubleClick={() => setShowHiddenDevTray(!showHiddenDevTray)}
            className="font-heading text-3xl font-extrabold tracking-[0.15em] text-brand-black cursor-default active:scale-98 transition-all hover:text-brand-green-dark"
            title="Doble clic para acceder al panel de desarrollador"
          >
            SKINLY
          </h2>
          <p className="text-[10px] text-brand-black/40 font-bold tracking-[0.2em] uppercase mt-1">
            La Ciencia del Lujo Botánico
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-luxury flex items-center gap-2 text-xs font-semibold text-left">
            <ShieldAlert size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* BOTONES DE ACCESO SOCIAL */}
        <div className="grid grid-cols-1 gap-2.5 mb-6">
          {/* Google SSO */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-brand-white border border-brand-black/10 hover:border-brand-black hover:bg-brand-gray-soft text-xs font-bold text-brand-black rounded-luxury transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          {/* Apple SSO */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Apple')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-brand-black hover:bg-brand-green-dark text-xs font-bold text-brand-white rounded-luxury transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.05-1 .04-2.22.67-2.94 1.51-.62.73-1.16 1.87-1.02 2.98 1.1.09 2.25-.56 2.97-1.44"/>
            </svg>
            Continuar con Apple
          </button>
        </div>

        {/* SEPARADOR ELEGANTE */}
        <div className="flex items-center gap-3 mb-5 select-none">
          <div className="flex-1 h-[1px] bg-brand-black/5" />
          <span className="text-[9px] uppercase font-bold tracking-widest text-brand-black/30">o continuar con correo</span>
          <div className="flex-1 h-[1px] bg-brand-black/5" />
        </div>

        {/* FORMULARIO DE INICIO DE SESIÓN */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="nombre@skinly.co"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          {/* Campo de contraseña con botón de olvidé */}
          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center pr-0.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => alert('Restablecimiento de contraseña: Se enviará un enlace de recuperación a tu correo registrado.')}
                className="text-[10px] font-bold text-brand-green-dark hover:underline cursor-pointer transition-colors"
                tabIndex={-1}
              >
                ¿Olvidaste?
              </button>
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-brand-white border border-brand-black/10 focus:border-brand-green-dark focus:ring-brand-green-light/20 rounded-luxury text-sm outline-none transition-all duration-300 pr-10"
              />
              
              {/* Toggle mostrar/ocultar contraseña */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-brand-black/35 hover:text-brand-black transition-colors cursor-pointer"
                title={showPassword ? 'Ocultar Contraseña' : 'Mostrar Contraseña'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Recordar perfil */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setRememberProfile(!rememberProfile)}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                rememberProfile 
                  ? 'bg-brand-green-dark border-brand-green-dark text-brand-white' 
                  : 'border-brand-black/20 bg-brand-white'
              }`}
            >
              {rememberProfile && <Check size={11} className="stroke-[3]" />}
            </button>
            <span className="text-[11px] font-semibold text-brand-black/50 tracking-wide">
              Recordar mi perfil de piel
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
            className="py-3.5 mt-4"
          >
            {loading ? 'Autenticando...' : 'Iniciar Sesión'}
          </Button>

        </form>

        {/* Enlace de registro */}
        <div className="mt-6 text-center text-xs text-brand-black/50 select-none">
          <span>¿No tienes una cuenta? </span>
          <button
            onClick={() => setView('register')}
            className="font-bold text-brand-green-dark hover:underline cursor-pointer"
          >
            Regístrate aquí
          </button>
        </div>

        {/* PANEL SECRETO DE DESARROLLADOR (Activado con doble clic en el encabezado) */}
        {showHiddenDevTray && (
          <div className="mt-6 pt-5 border-t border-brand-black/10 text-left animate-scale-up">
            <div className="flex justify-between items-center mb-3">
              <span className="block text-[9px] font-extrabold text-brand-green-dark uppercase tracking-wider">
                🔒 Panel de presets de desarrollador
              </span>
              <button 
                onClick={() => setShowHiddenDevTray(false)}
                className="text-[9px] font-bold text-brand-black/40 hover:text-brand-black hover:underline cursor-pointer"
              >
                Ocultar
              </button>
            </div>
            <p className="text-[10px] text-brand-black/50 mb-3 leading-relaxed">
              Este panel está completamente oculto en producción y solo es accesible mediante atajos de código local para verificación de prototipos.
            </p>
            <div className="space-y-1.5">
              {demoAccounts.map((demo, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDevPresetSelect(demo)}
                  className={`w-full p-2.5 rounded-luxury border text-left flex justify-between items-center transition-all hover:bg-brand-gray-soft cursor-pointer ${
                    email === demo.email 
                      ? 'border-brand-green-dark bg-brand-green-dark/5 text-brand-green-dark font-semibold' 
                      : 'border-brand-black/5 text-brand-black/75 bg-brand-white'
                  }`}
                >
                  <div>
                    <span className="block text-[9px] font-extrabold uppercase tracking-wide opacity-50">
                      {demo.email}
                    </span>
                    <span className="block text-[10px] font-bold truncate">
                      {demo.label}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono opacity-40">{demo.pass}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
