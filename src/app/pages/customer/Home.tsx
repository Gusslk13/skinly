import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/ProductCard';
import { Button } from '../../components/UI';
import { Award, Leaf, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  'Serums':       'Serums',
  'Moisturizers': 'Hidratantes',
  'Cleansers':    'Limpiadores',
  'Toners':       'Tónicos',
  'Anti-Aging':   'Antienvejecimiento',
};

export const Home: React.FC = () => {
  const { products, setView, featuredBanner, currentUser } = useApp();
  const [activeCategory, setActiveCategory] = useState('Todos');

  // Derive categories from actual products — same values as in the store
  const availableCategories = useMemo(
    () => Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort(),
    [products]
  );

  const filteredProducts = products.filter(prod => {
    return activeCategory === 'Todos' || prod.category === activeCategory;
  });

  const featuredProducts = filteredProducts.filter(p => p.isFeatured);
  const regularProducts = filteredProducts.filter(p => !p.isFeatured);

  return (
    <div className="space-y-10 pb-20">
      
      {/* BANNER HERO DE LUJO */}
      <section className="relative min-h-[520px] md:min-h-[580px] bg-gradient-to-br from-[#0c0d0c] via-[#0e1611] to-[#0a0f0c] overflow-hidden rounded-b-[2.5rem] flex items-center p-6 sm:p-12 md:p-16 border-b border-brand-white/5">
        
        {/* Luces de estudio de fondo */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-green-dark/15 blur-3xl opacity-60 pointer-events-none animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 rounded-full bg-brand-green-light/5 blur-3xl opacity-40 pointer-events-none" />
        
        {/* Composición en Grid Editorial */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-20">
          
          {/* Columna Izquierda: Información de Campaña */}
          <div className="lg:col-span-7 text-left space-y-6 flex flex-col justify-center">
            <div className="animate-slide-up-subtle">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-white/5 backdrop-blur-md rounded-full text-[10px] font-bold tracking-[0.18em] uppercase text-brand-green-light border border-brand-white/10">
                <Sparkles size={10} className="text-brand-green-light" />
                Excelencia Botánica Skinly
              </span>
            </div>
            
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6.5xl font-extrabold leading-[1.08] tracking-wide text-brand-white max-w-xl animate-scale-up-smooth">
              {featuredBanner.title}
            </h1>
            
            <p className="text-sm md:text-base text-brand-white/70 leading-relaxed font-medium max-w-lg animate-slide-up-subtle">
              {featuredBanner.subtitle}
            </p>
            
            <div className="pt-2 flex flex-wrap gap-4 items-center animate-slide-up-subtle">
              <Button 
                variant="glass" 
                size="lg" 
                onClick={() => setView('categories')}
                className="font-bold border border-brand-white/10 hover:border-brand-green-light/30 hover:bg-brand-white/90 transition-all shadow-md active:scale-97 text-brand-black"
              >
                {featuredBanner.ctaText}
              </Button>
            </div>
          </div>
          
          {/* Columna Derecha: Presentación Cinematográfica del Producto */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end relative">
            {/* Sombra de suelo flotante */}
            <div className="absolute -bottom-6 w-4/5 h-6 bg-brand-black/60 rounded-full blur-xl opacity-50 transform scale-x-90 animate-pulse" />
            
            {/* Contenedor de la botella flotante de campaña */}
            <div className="relative w-64 sm:w-72 aspect-[3/4] rounded-[1.75rem] overflow-hidden border border-brand-white/10 shadow-2xl shadow-brand-green-dark/15 animate-parallax-float bg-brand-black/20 backdrop-blur-md group">
              {/* Reflejos de luz premium */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-black/30 via-transparent to-brand-white/10 z-10 pointer-events-none group-hover:opacity-80 transition-opacity duration-700" />
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-brand-white/5 rounded-full blur-2xl transform rotate-45 pointer-events-none" />
              
              <img 
                src={featuredBanner.imageUrl} 
                alt="Skincare de Lujo"
                className="w-full h-full object-cover opacity-90 transition-transform duration-[1500ms] ease-luxury group-hover:scale-105"
              />
              
              {/* Etiqueta flotante premium */}
              <div className="absolute bottom-4 left-4 right-4 z-20 bg-brand-black/40 backdrop-blur-md px-4 py-3 rounded-luxury border border-brand-white/10 flex items-center justify-between">
                <div>
                  <span className="block text-[8px] uppercase tracking-widest text-brand-green-light font-black">Fórmula Activa</span>
                  <span className="text-xs font-bold text-brand-white">Edición Limitada</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-brand-white/15 text-brand-white rounded-md font-bold uppercase border border-brand-white/10">100% Orgánico</span>
              </div>
            </div>
          </div>

        </div>

        {/* Indicadores inferiores */}
        <div className="absolute bottom-6 left-6 md:left-auto md:right-16 z-20 hidden md:flex items-center gap-5 text-brand-white/40 text-[9px] uppercase font-bold tracking-widest">
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
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-full tracking-wide transition-all ease-luxury duration-300 cursor-pointer whitespace-nowrap border ${
                  activeCategory === cat
                    ? 'bg-brand-black text-brand-white border-brand-black shadow-md'
                    : 'bg-brand-white text-brand-black/60 border-brand-black/5 hover:border-brand-black/10'
                }`}
              >
                {CATEGORY_LABELS[cat] ?? cat}
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
              Embajadores Skinly
            </span>
            <h4 className="font-heading text-xl font-bold text-brand-black">
              ¿Tienes un cupón de referido?
            </h4>
            <p className="text-xs text-brand-black/50 font-medium">
              Ingresa un cupón activo de embajador en tu Carrito para desbloquear **10% DE DESCUENTO** en tu compra. (Prueba **LUPITA10**)
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setView('cart')}
            className="hover:bg-brand-black hover:text-brand-white transition-colors"
          >
            Aplicar Código
          </Button>
        </div>
      </section>

    </div>
  );
};
