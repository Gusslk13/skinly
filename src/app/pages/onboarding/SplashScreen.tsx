import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-brand-black text-brand-white flex flex-col items-center justify-center z-50 p-4 select-none overflow-hidden">

      {/* Decorative ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-green-dark/20 blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-green-light/10 blur-3xl opacity-40 pointer-events-none" />

      {/* Main Content */}
      <div className="flex flex-col items-center relative z-10 space-y-6">
        {/* Logo */}
        <img
          src="/images/logo.png"
          alt="Skinly"
          className="w-24 h-24 object-contain drop-shadow-2xl animate-pulse"
        />
        <div className="text-center space-y-1">
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-widest leading-none text-brand-white">
            SKINLY
          </h1>
          <p className="text-[10px] text-brand-white/40 font-semibold tracking-[0.25em] uppercase">
            Orgánicos Ultra Limpios
          </p>
        </div>
      </div>

      {/* Bottom loading bar */}
      <div className="absolute bottom-12 flex flex-col items-center gap-3 z-10">
        <span className="text-[9px] uppercase tracking-widest text-brand-white/20 font-bold">
          Cuidado de la Piel de Alta Gama
        </span>
        <div className="w-32 h-[2px] bg-brand-white/10 relative overflow-hidden rounded-full">
          <div className="absolute top-0 left-0 h-full w-16 bg-brand-green-light rounded-full animate-[slide_1.5s_ease-in-out_infinite]" />
        </div>
      </div>

    </div>
  );
};
