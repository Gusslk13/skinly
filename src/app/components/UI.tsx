import React, { useState } from 'react';
import { Award, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

// ============================================================================
// LUXURY BUTTON
// ============================================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'glass' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-semibold rounded-luxury transition-all ease-luxury duration-300 focus:outline-none cursor-pointer tracking-wide active:scale-[0.98]";
  
  const variants = {
    primary: "bg-brand-black text-brand-white hover:bg-brand-green-dark hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-green-dark/15 active:translate-y-0",
    secondary: "bg-brand-green-dark text-brand-white hover:bg-brand-black hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-black/10 active:translate-y-0",
    outline: "border border-brand-black/15 hover:border-brand-black bg-transparent text-brand-black hover:-translate-y-0.5 active:translate-y-0 hover:bg-brand-black/5",
    glass: "bg-brand-white/80 backdrop-blur-md border border-brand-white/40 text-brand-black hover:bg-brand-white/95 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-black/5 active:translate-y-0",
    danger: "bg-red-600 text-brand-white hover:bg-red-700 hover:-translate-y-0.5 active:translate-y-0"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base"
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// ============================================================================
// LUXURY INPUT
// ============================================================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random()}`;
  return (
    <div className="w-full mb-4">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5 pl-0.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-3 bg-brand-white border ${
          error ? 'border-red-500 focus:ring-red-200' : 'border-brand-black/10 focus:border-brand-green-dark focus:ring-brand-green-light/20'
        } rounded-luxury text-sm outline-none transition-all ease-luxury duration-300 placeholder:text-brand-black/35 focus:shadow-md focus:shadow-brand-green-dark/5 ${className}`}
        {...props}
      />
      {error && <span className="block text-xs text-red-500 mt-1 pl-1">{error}</span>}
    </div>
  );
};

// ============================================================================
// LUXURY SELECT
// ============================================================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random()}`;
  return (
    <div className="w-full mb-4">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5 pl-0.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full px-4 py-3 bg-brand-white border ${
            error ? 'border-red-500 focus:ring-red-200' : 'border-brand-black/10 focus:border-brand-green-dark focus:ring-brand-green-light/20'
          } rounded-luxury text-sm outline-none transition-all ease-luxury duration-300 appearance-none focus:shadow-md focus:shadow-brand-green-dark/5 ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-black/50">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
      {error && <span className="block text-xs text-red-500 mt-1 pl-1">{error}</span>}
    </div>
  );
};

// ============================================================================
// LUXURY TEXTAREA
// ============================================================================
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const areaId = id || `area-${Math.random()}`;
  return (
    <div className="w-full mb-4">
      {label && (
        <label htmlFor={areaId} className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60 mb-1.5 pl-0.5">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        rows={4}
        className={`w-full px-4 py-3 bg-brand-white border ${
          error ? 'border-red-500 focus:ring-red-200' : 'border-brand-black/10 focus:border-brand-green-dark focus:ring-brand-green-light/20'
        } rounded-luxury text-sm outline-none transition-all ease-luxury duration-300 placeholder:text-brand-black/35 focus:shadow-md focus:shadow-brand-green-dark/5 resize-none ${className}`}
        {...props}
      />
      {error && <span className="block text-xs text-red-500 mt-1 pl-1">{error}</span>}
    </div>
  );
};

// ============================================================================
// PREMIUM BADGE & SKINLY VERIFIED DIALOG
// ============================================================================
export const VerifiedBadge: React.FC<{ ingredients?: string[] }> = ({ ingredients }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-green-dark/10 backdrop-blur-sm text-brand-green-dark border border-brand-green-dark/20 text-[10px] font-bold tracking-wider uppercase rounded-full cursor-pointer hover:bg-brand-green-dark/25 transition-all duration-300"
      >
        <Award size={12} className="text-brand-green-dark" />
        Skinly Verificado
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)}>
          <div 
            className="w-full max-w-md bg-brand-white p-6 rounded-luxury shadow-xl border border-brand-black/5 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-brand-black/50 hover:text-brand-black rounded-full hover:bg-brand-gray-soft cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="w-12 h-12 rounded-full bg-brand-green-dark/10 flex items-center justify-center mb-3">
                <Award size={28} className="text-brand-green-dark" />
              </div>
              <h3 className="text-xl font-bold text-brand-black">Skinly Verificado™</h3>
              <p className="text-xs text-brand-black/50 font-medium tracking-wide uppercase mt-1">Certificación de Ingredientes</p>
            </div>

            <div className="space-y-4 text-sm text-brand-black/80">
              <p className="leading-relaxed">
                Este producto cuenta con el prestigioso sello <strong>Skinly Verificado</strong>. Ha sido sometido a una rigurosa verificación de materias primas por parte de nuestro equipo de laboratorio.
              </p>
              
              <div className="bg-brand-green-dark/5 p-4 rounded-luxury border border-brand-green-dark/10">
                <h4 className="text-xs font-bold text-brand-green-dark uppercase tracking-wider mb-2">Ingredientes Activos Verificados</h4>
                {ingredients && ingredients.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {ingredients.map((ing, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-brand-white border border-brand-green-dark/10 text-brand-black/80 font-medium rounded-full">
                        {ing}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-brand-black/60">
                    Obtenido orgánicamente con activos botánicos 100% naturales y probados contra toxicidad.
                  </p>
                )}
              </div>

              <div className="text-xs text-brand-black/50 leading-relaxed border-t border-brand-black/5 pt-4">
                Nuestra verificación comprueba: estado 100% libre de crueldad, ausencia de rellenos de parabenos, cero disruptores endocrinos y cosecha botánica sostenible.
              </div>
            </div>

            <Button 
              variant="primary" 
              fullWidth 
              className="mt-6"
              onClick={() => setShowModal(false)}
            >
              Entendido
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

