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
      image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=600'
    },
    {
      icon: Award,
      title: 'Sello Skinly Verificado',
      subtitle: 'Cada fórmula pasa por certificación de laboratorio. Haz clic en el sello de verificación de cualquier producto para auditar sus ingredientes limpios, seguridad certificada y potencia.',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600'
    },
    {
      icon: Sparkles,
      title: 'Potencia Clínicamente Comprobada',
      subtitle: 'Skincare premium que no hace compromisos. Experimenta resultados botánicos de grado médico con una estética lujosa y glassmórfica al estilo Draco.',
      image: 'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?auto=format&fit=crop&q=80&w=600'
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
    <div className="min-h-screen bg-brand-white flex flex-col md:flex-row relative">
      
      {/* Banner de imagen visual - Mitad izquierda en escritorio */}
      <div className="w-full md:w-1/2 h-72 md:h-screen relative overflow-hidden bg-brand-gray-soft">
        <img 
          src={slides[activeSlide].image} 
          alt={slides[activeSlide].title} 
          className="w-full h-full object-cover transition-all duration-1000 ease-in-out" 
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-black/40 md:from-transparent to-transparent" />
      </div>

      {/* Narrativa y navegación - Mitad derecha */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 sm:p-12 md:p-20 bg-brand-white">
        
        {/* Acción de saltar */}
        <div className="flex justify-end">
          <button 
            onClick={() => setView('login')}
            className="text-xs font-bold uppercase tracking-wider text-brand-black/40 hover:text-brand-black cursor-pointer transition-colors"
          >
            Saltar
          </button>
        </div>

        {/* Diapositiva de contenido */}
        <div className="my-auto max-w-md space-y-6">
          <div className="w-12 h-12 rounded-full bg-brand-green-dark/10 flex items-center justify-center text-brand-green-dark">
            <IconComponent size={24} />
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-black leading-tight">
              {slides[activeSlide].title}
            </h2>
            <p className="text-sm text-brand-black/60 leading-relaxed font-medium">
              {slides[activeSlide].subtitle}
            </p>
          </div>

          {/* Indicador de puntos */}
          <div className="flex gap-2 pt-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === activeSlide ? 'w-6 bg-brand-green-dark' : 'w-2 bg-brand-black/10'
                }`}
                title={`Ir a diapositiva ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Controles de acción */}
        <div className="flex items-center justify-between pt-6 border-t border-brand-black/5">
          <span className="text-xs text-brand-black/40 font-semibold uppercase tracking-wider">
            Paso {activeSlide + 1} de {slides.length}
          </span>

          <Button 
            onClick={handleNext}
            variant="primary"
            className="gap-2"
          >
            {activeSlide === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
            <ArrowRight size={14} />
          </Button>
        </div>

      </div>

    </div>
  );
};
