import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/ProductCard';
import { Button } from '../../components/UI';
import { Award, Leaf, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

export const Home: React.FC = () => {
  const { products, categories, setView, featuredBanner, currentUser } = useApp();
  const [activeCategory, setActiveCategory] = useState('Todos');

  const filteredProducts = products.filter(prod => {
    return activeCategory === 'Todos' || prod.category === activeCategory;
  });

  const featuredProducts = filteredProducts.filter(p => p.isFeatured);
  const regularProducts = filteredProducts.filter(p => !p.isFeatured);

  return (
    <div className="space-y-10 pb-20">
      
      {/* BANNER HERO DE LUJO */}
      <section className="relative min-h-[380px] sm:min-h-[520px] md:min-h-[580px] bg-gradient-to-br from-[#0c0d0c] via-[#0e1611] to-[#0a0f0c] overflow-hidden rounded-b-[1.5rem] sm:rounded-b-[2.5rem] flex items-center px-5 py-10 sm:p-12 md:p-16 border-b border-brand-white/5">

        {/* Luces de estudio de fondo */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-green-dark/15 blur-3xl opacity-60 pointer-events-none animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 rounded-full bg-brand-green-light/5 blur-3xl opacity-40 pointer-events-none" />

        {/* Composición en Grid Editorial */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center relative z-20">

          {/* Columna Izquierda: Información de Campaña */}
          <div className="lg:col-span-7 text-center sm:text-left space-y-4 sm:space-y-6 flex flex-col justify-center">
            <div className="animate-slide-up-subtle flex justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-white/5 backdrop-blur-md rounded-full text-[10px] font-bold tracking-[0.18em] uppercase text-brand-green-light border border-brand-white/10">
                <Sparkles size={10} className="text-brand-green-light" />
                Excelencia Botánica Skinly
              </span>
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-wide text-brand-white animate-scale-up-smooth">
              {featuredBanner.title}
            </h1>

            <p className="text-sm md:text-base text-brand-white/70 leading-relaxed font-medium max-w-lg mx-auto sm:mx-0 animate-slide-up-subtle">
              {featuredBanner.subtitle}
            </p>

            <div className="pt-1 flex flex-wrap gap-4 items-center justify-center sm:justify-start animate-slide-up-subtle">
              <Button
                variant="glass"
                size="lg"
                onClick={() => setView('categories')}
                className="font-bold border border-brand-white/10 hover:border-brand-green-light/30 hover:bg-brand-white/90 transition-all shadow-md active:scale-97 text-brand-black w-full sm:w-auto"
              >
                {featuredBanner.ctaText}
              </Button>
            </div>
          </div>

          {/* Columna Derecha: Imagen del producto — oculta en móvil */}
          <div className="hidden sm:flex lg:col-span-5 items-center justify-center lg:justify-end relative">
            {/* Sombra de suelo flotante */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-brand-black/50 rounded-full blur-2xl opacity-60 pointer-events-none" />

            {/* Marco de imagen principal */}
            <div className="relative w-60 sm:w-72 lg:w-80 xl:w-88 aspect-[3/4] rounded-[2rem] overflow-hidden border border-brand-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.5)] group">

              {/* Overlay de luz sutil encima */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/50 via-transparent to-brand-white/5 z-10 pointer-events-none" />

              <img
                src="/images/product-hero.png"
                alt="Skincare de Lujo Skinly"
                className="w-full h-full object-cover object-center transition-transform duration-[1800ms] ease-in-out group-hover:scale-[1.04]"
              />

              {/* Badge flotante inferior */}
              <div className="absolute bottom-4 left-4 right-4 z-20 bg-brand-black/50 backdrop-blur-md px-3 py-2.5 rounded-xl border border-brand-white/10 flex items-center justify-between">
                <div>
                  <span className="block text-[8px] uppercase tracking-widest text-brand-green-light font-black">Fórmula Activa</span>
                  <span className="text-xs font-bold text-brand-white">Edición Limitada</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 bg-brand-green-dark/60 text-brand-white rounded-md font-bold uppercase border border-brand-green-light/20 tracking-wide">
                  100% Orgánico
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Indicadores inferiores */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-16 z-20 hidden sm:flex items-center gap-4 text-brand-white/40 text-[9px] uppercase font-bold tracking-widest whitespace-nowrap">
          <span>Sin Crueldad Animal</span>
          <span className="w-1 h-1 rounded-full bg-brand-green-light" />
          <span>Sin Toxinas</span>
          <span className="w-1 h-1 rounded-full bg-brand-green-light" />
          <span>Verificado en Laboratorio</span>
        </div>
      </section>

      {/* SELECTOR RÁPIDO DE CATEGORÍAS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-brand-black tracking-wide">
              Compra por Tipo de Piel
            </h2>
            <p className="text-xs text-brand-black/40 font-medium">
              Formulado específicamente para la reparación clínica de la barrera cutánea.
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveCategory('Todos')}
              className={`px-4 py-2 text-xs font-bold rounded-full tracking-wide transition-all ease-luxury duration-300 cursor-pointer whitespace-nowrap border ${
                activeCategory === 'Todos'
                  ? 'bg-brand-black text-brand-white border-brand-black shadow-md'
                  : 'bg-brand-white text-brand-black/60 border-brand-black/5 hover:border-brand-black/10'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-4 py-2 text-xs font-bold rounded-full tracking-wide transition-all ease-luxury duration-300 cursor-pointer whitespace-nowrap border ${
                  activeCategory === cat.name
                    ? 'bg-brand-black text-brand-white border-brand-black shadow-md'
                    : 'bg-brand-white text-brand-black/60 border-brand-black/5 hover:border-brand-black/10'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-brand-black/5 pb-3">
          <TrendingUp className="text-brand-green-dark" size={18} />
          <h3 className="font-heading text-lg font-bold text-brand-black tracking-wide">
            Formulaciones Destacadas
          </h3>
        </div>

        {featuredProducts.length > 0 ? (
          <div key={activeCategory} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-brand-black/40 text-center py-10 bg-brand-white rounded-luxury border border-brand-black/5">
            No hay productos destacados en esta categoría por el momento.
          </p>
        )}
      </section>

      {/* TARJETA DE VERIFICACIÓN SKINLY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-green-dark text-brand-white rounded-luxury p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-lg">
          {/* Círculos de fondo */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-brand-white/5 blur-2xl animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-brand-white/5 blur-2xl animate-pulse" />

          <div className="space-y-4 relative z-10 max-w-xl text-left animate-slide-up-subtle">
            <div className="flex items-center gap-2 text-brand-green-light">
              <Award size={20} className="animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-widest">Estándares Certificados de Skincare</span>
            </div>
            <h3 className="font-heading text-3xl font-bold leading-tight">
              El Sello "Skinly Verificado"
            </h3>
            <p className="text-sm text-brand-white/70 leading-relaxed font-medium">
              Auditamos cada lote de laboratorio. Nuestros proveedores pasan por un proceso obligatorio de inspección de ingredientes. Haz clic en el sello de verificación de cualquier producto para ver sus compuestos botánicos certificados.
            </p>
          </div>

          <div className="flex gap-4 shrink-0 relative z-10">
            <Button 
              variant="glass" 
              onClick={() => setView('categories')}
              className="text-brand-green-dark font-extrabold px-6 py-3 hover:bg-brand-white"
            >
              Explorar Productos
            </Button>
          </div>
        </div>
      </section>

      {/* CATÁLOGO REGULAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-brand-black/5 pb-3">
          <Leaf className="text-brand-green-dark" size={18} />
          <h3 className="font-heading text-lg font-bold text-brand-black tracking-wide">
            Catálogo de Skincare
          </h3>
        </div>

        {regularProducts.length > 0 ? (
          <div key={activeCategory} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
            {regularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-brand-black/40 text-center py-10 bg-brand-white rounded-luxury border border-brand-black/5">
            Vuelve pronto para ver nuevas adiciones al catálogo.
          </p>
        )}
      </section>

      {/* SECCIÓN PROMOCIONAL DE AFILIADOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-white p-8 rounded-luxury border border-brand-black/5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 block">
              Afiliados Skinly
            </span>
            <h4 className="font-heading text-xl font-bold text-brand-black">
              ¿Tienes un cupón de referido?
            </h4>
            <p className="text-xs text-brand-black/50 font-medium">
              Ingresa un cupón activo de afiliado en tu Carrito para desbloquear{' '}
              <strong className="text-brand-black">10% DE DESCUENTO</strong> en tu compra.{' '}
              (Prueba <strong className="text-brand-green-dark font-mono">LUPITA10</strong>)
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setView('affiliate-program')}
            className="hover:bg-brand-black hover:text-brand-white transition-colors"
          >
            Ver Programa
          </Button>
        </div>
      </section>

    </div>
  );
};
