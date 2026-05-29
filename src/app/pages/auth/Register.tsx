import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button, Input } from '../../components/UI';
import { Eye, EyeOff, ShieldAlert, Check } from 'lucide-react';
import { supabase } from '../../../supabase';

export const Register: React.FC = () => {
  const { register, setView } = useApp();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }
    if (!agreeTerms) {
      setError('Debes aceptar los Términos de Servicio y la Política de Privacidad.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await register(fullName, email, password);
      if (!res.success) {
        setError(res.error || 'Error al registrar la cuenta.');
      }
    } catch (err) {
      setError('Ocurrió un error durante el registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // No setLoading(false) on success — browser redirects to Google
  };

  return (
    <div className="min-h-screen bg-brand-gray-soft flex items-center justify-center p-4 sm:p-6 md:p-8 select-none relative overflow-hidden">
      
      {/* Degradados decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-brand-green-dark/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-brand-green-light/5 blur-[120px]" />

      <div className="w-full max-w-[440px] bg-brand-white p-8 sm:p-10 rounded-luxury shadow-xl border border-brand-black/5 relative z-10">
        
        {/* Encabezado de marca */}
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="/images/logo.png"
            alt="Skinly"
            className="w-14 h-14 object-contain mb-3"
          />
          <h2 className="font-heading text-3xl font-extrabold tracking-[0.15em] text-brand-black">
            SKINLY
          </h2>
          <p className="text-[10px] text-brand-black/40 font-bold tracking-[0.2em] uppercase mt-1">
            Tu rutina. Tu piel. Tu marca.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-luxury flex items-center gap-2 text-xs font-semibold text-left">
            <ShieldAlert size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* BOTÓN DE REGISTRO SOCIAL */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
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
        </div>

        {/* Separador */}
        <div className="flex items-center gap-3 mb-5 text-[9px] uppercase font-bold tracking-widest text-brand-black/30">
          <div className="flex-1 h-[1px] bg-brand-black/5" />
          <span>o regístrate con correo</span>
          <div className="flex-1 h-[1px] bg-brand-black/5" />
        </div>

        {/* FORMULARIO DE REGISTRO */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          <Input
            label="Nombre Completo"
            type="text"
            placeholder="Victoria Sinclair"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="victoria@skinly.co"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          {/* Campo de contraseña con toggle */}
          <div className="space-y-1.5 relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
              Elige una Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-brand-white border border-brand-black/10 focus:border-brand-green-dark focus:ring-brand-green-light/20 rounded-luxury text-sm outline-none transition-all duration-300 pr-10"
              />
              
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

          {/* Checkbox de términos */}
          <div className="flex items-start gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setAgreeTerms(!agreeTerms)}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 mt-0.5 cursor-pointer ${
                agreeTerms 
                  ? 'bg-brand-green-dark border-brand-green-dark text-brand-white' 
                  : 'border-brand-black/20 bg-brand-white'
              }`}
            >
              {agreeTerms && <Check size={11} className="stroke-[3]" />}
            </button>
            <span className="text-[11px] font-semibold text-brand-black/50 leading-tight">
              Al registrarme, acepto los{' '}
              <span className="text-brand-black font-bold">Términos de Servicio</span>
              {' '}y el{' '}
              <span className="text-brand-black font-bold">Consentimiento de Privacidad del Perfil de Piel</span>.
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
            className="py-3.5 mt-4"
          >
            {loading ? 'Registrando Cuenta...' : 'Crear Cuenta'}
          </Button>

        </form>

        {/* Enlace de inicio de sesión */}
        <div className="mt-6 text-center text-xs text-brand-black/50">
          <span>¿Ya tienes una cuenta? </span>
          <button
            onClick={() => setView('login')}
            className="font-bold text-brand-green-dark hover:underline cursor-pointer"
          >
            Inicia sesión aquí
          </button>
        </div>

      </div>

    </div>
  );
};
