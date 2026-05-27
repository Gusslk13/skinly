import React from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/ProductCard';
import { Button } from '../../components/UI';
import { Heart, ChevronLeft } from 'lucide-react';

export const Favorites: React.FC = () => {
  const { favorites, products, setView } = useApp();

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  if (favorites.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
          <Heart size={28} className="stroke-1" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-brand-black">Tu Lista de Favoritos está Vacía</h2>
          <p className="text-xs text-brand-black/50 font-medium leading-relaxed max-w-xs mx-auto">
            Guarda fórmulas exclusivas en tu lista de favoritos. Haz clic en el icono del corazón en cualquier producto para guardarlo aquí.
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setView('categories')}
          className="px-8 py-3"
        >
          Explorar Fórmulas
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8">
      
      {/* Title */}
      <div className="text-left space-y-2">
        <div className="flex items-center gap-1">
          <button onClick={() => setView('home')} className="text-brand-black/40 hover:text-brand-black transition-colors font-bold uppercase tracking-wider text-[10px]">Inicio</button>
          <ChevronLeft size={12} className="text-brand-black/30" />
          <span className="text-[10px] uppercase font-bold text-brand-black/40">Artículos Guardados</span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-brand-black">Tus Favoritos</h1>
        <p className="text-xs text-brand-black/40 font-medium">Lleva el control de tus fórmulas orgánicas de lujo y sueros hidratantes.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favoriteProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

    </div>
  );
};
