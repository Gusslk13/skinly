import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/UI';
import { Leaf, Award, Sparkles, ArrowRight } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { setView } = useApp();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      icon: Leaf,
      title: 'Sostenibilidad Eco-Lux',
      subtitle: 'Botánicos activos puros, obtenidos éticamente de cooperativas de comercio justo. Formulados sin parabenos, siliconas ni colorantes sintéticos.',
      image: '/images/product-1.png'
    },
    {
      icon: Award,
      title: 'Sello Skinly Verificado',
      subtitle: 'Cada fórmula pasa por certificación de laboratorio. Haz clic en el sello de verificación de cualquier producto para auditar sus ingredientes limpios, seguridad certificada y potencia.',
      image: '/images/product-2.png'
    },
    {
      icon: Sparkles,
      title: 'Potencia Clínicamente Comprobada',
      subtitle: 'Skincare premium que no hace compromisos. Experimenta resultados botánicos con extractos de alta pureza y un diseño de lujo que se siente tan bien como se ve.',
      image: '/images/product-3.png'
    }
  ];

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide(activeSlide + 1);
    } else {
      setView('login');
    }
  };

  const IconComponent = slides[activeSlide].icon;

  return (
    <div className="min-h-screen bg-brand-white flex flex-col md:flex-row relative overflow-hidden">

      {/* Imagen visual — ocupa mitad izquierda en desktop, barra superior en móvil */}
      <div className="w-full md:w-1/2 h-64 sm:h-80 md:h-screen relative overflow-hidden bg-brand-black shrink-0">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green-dark/30 via-transparent to-brand-black/60 z-10 pointer-events-none" />
        <img
          src={slides[activeSlide].image}
          alt={slides[activeSlide].title}
          className="w-full h-full object-cover object-center transition-all duration-700 ease-in-out"
        />
        {/* Logo overlay en esquina */}
        <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
          <img src="/images/logo.png" alt="Skinly" className="w-8 h-8 object-contain drop-shadow-lg" />
          <span className="font-heading text-sm font-bold tracking-widest text-brand-white/90 drop-shadow">SKINLY</span>
        </div>
        {/* Slide counter pill */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeSlide ? 'w-6 bg-brand-white' : 'w-2 bg-brand-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Narrativa y navegación — mitad derecha */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 sm:p-12 md:p-16 lg:p-20 bg-brand-white">

        {/* Skip */}
        <div className="flex justify-end">
          <button
            onClick={() => setView('login')}
            className="text-xs font-bold uppercase tracking-wider text-brand-black/30 hover:text-brand-black cursor-pointer transition-colors"
          >
            Saltar →
          </button>
        </div>

        {/* Contenido del slide */}
        <div className="my-auto max-w-md space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-green-dark/10 flex items-center justify-center text-brand-green-dark border border-brand-green-dark/10">
            <IconComponent size={22} />
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-black leading-tight tracking-wide">
              {slides[activeSlide].title}
            </h2>
            <p className="text-sm text-brand-black/55 leading-relaxed font-medium">
              {slides[activeSlide].subtitle}
            </p>
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {['100% Orgánico', 'Sin Parabenos', 'Cruelty Free'].map(tag => (
              <span key={tag} className="text-[10px] font-bold uppercase tracking-wide px-3 py-1 bg-brand-green-dark/8 text-brand-green-dark rounded-full border border-brand-green-dark/15">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between pt-6 border-t border-brand-black/5">
          <span className="text-[10px] text-brand-black/35 font-bold uppercase tracking-widest">
            {activeSlide + 1} / {slides.length}
          </span>
          <Button
            onClick={handleNext}
            variant="primary"
            className="gap-2 px-6"
          >
            {activeSlide === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
            <ArrowRight size={14} />
          </Button>
        </div>

      </div>

    </div>
  );
};
