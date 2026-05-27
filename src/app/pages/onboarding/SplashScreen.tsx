import React from 'react';
import { Leaf } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-brand-black text-brand-white flex flex-col items-center justify-center z-50 p-4 select-none">
      
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-brand-green-dark/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-brand-green-light/5 blur-3xl" />

      {/* Main Content */}
      <div className="flex flex-col items-center relative z-10">
        <div className="w-16 h-16 rounded-full bg-brand-white/5 border border-brand-white/15 flex items-center justify-center mb-6 animate-pulse">
          <Leaf className="text-brand-green-light" size={28} />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-widest leading-none text-brand-white mb-2">
          SKINLY
        </h1>
        <p className="text-[10px] text-brand-white/40 font-semibold tracking-[0.25em] uppercase">
          Orgánicos Ultra Limpios
        </p>
      </div>

      {/* Bottom Loading Progress Indicator */}
      <div className="absolute bottom-12 flex flex-col items-center gap-2 relative z-10">
        <span className="text-[9px] uppercase tracking-widest text-brand-white/20 font-bold">
          Cuidado de la Piel de Alta Gama
        </span>
        <div className="w-28 h-[2px] bg-brand-white/10 relative overflow-hidden rounded-full">
          <div className="absolute top-0 left-0 h-full w-12 bg-brand-green-light rounded-full animate-bounce" />
        </div>
      </div>

    </div>
  );
};
