import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/ProductCard';
import { Input, Select } from '../../components/UI';
import { Search, SlidersHorizontal, Leaf, X } from 'lucide-react';

export const Categories: React.FC = () => {
  const { products, categories } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [maxPrice, setMaxPrice] = useState(500);
  const [sortBy, setSortBy] = useState('featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Max price of any product — used to cap the slider
  const maxProductPrice = Math.max(500, ...products.map(p => p.price));

  const sortOptions = [
    { value: 'featured', label: 'Recomendados' },
    { value: 'price-low', label: 'Precio: Menor a Mayor' },
    { value: 'price-high', label: 'Precio: Mayor a Menor' },
    { value: 'rating', label: 'Mejor Calificados' }
  ];

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filteredProducts = products.filter(prod => {
    // Search: name or any ingredient
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q
      || prod.name.toLowerCase().includes(q)
      || (Array.isArray(prod.ingredients)
           ? prod.ingredients.some(ing => ing.toLowerCase().includes(q))
           : String(prod.ingredients ?? '').toLowerCase().includes(q));

    // Category: compare directly against the DB value stored in product.category
    const matchesCategory =
      selectedCategory === 'Todos' || prod.category === selectedCategory;

    // Price: compare against effective price
    const price = prod.discountPrice ?? prod.price;
    const matchesPrice = price <= maxPrice;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Ordenamiento
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.discountPrice || a.price;
    const priceB = b.discountPrice || b.price;

    if (sortBy === 'price-low') return priceA - priceB;
    if (sortBy === 'price-high') return priceB - priceA;
    if (sortBy === 'rating') return b.rating - a.rating;
    
    // Por defecto destacados
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todos');
    setMaxPrice(maxProductPrice);
    setSortBy('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      
      {/* Encabezado */}
      <div className="text-left space-y-2">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brand-black">
          Formulaciones Botánicas
        </h1>
        <p className="text-xs text-brand-black/40 font-medium">
          Compuestos cosméticos activos, limpios y con pruebas de toxicidad. Auditados a mano.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* FILTROS LATERALES (ESCRITORIO) */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6 bg-brand-white p-6 rounded-luxury border border-brand-black/5 h-fit">
          <div className="flex justify-between items-center pb-3 border-b border-brand-black/5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black">Filtros</h3>
            <button 
              onClick={clearFilters}
              className="text-[10px] font-bold text-brand-green-dark hover:underline cursor-pointer"
            >
              Limpiar Todo
            </button>
          </div>

          {/* Barra de búsqueda */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black/50">Buscar</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nombre del producto o ingrediente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-gray-soft px-3 py-2 text-xs border border-brand-black/5 rounded-luxury focus:outline-none focus:border-brand-green-dark"
              />
              <Search className="absolute right-3 top-2.5 text-brand-black/30" size={13} />
            </div>
          </div>

          {/* Selector de categorías — cargado dinámicamente desde los productos */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black/50">
              Categoría
            </label>
            <div className="flex flex-col gap-1.5">
              {/* "Todos" siempre primero */}
              <button
                onClick={() => setSelectedCategory('Todos')}
                className={`w-full text-left px-3 py-2 rounded-luxury text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'Todos'
                    ? 'bg-brand-green-dark/10 text-brand-green-dark border-l-2 border-brand-green-dark'
                    : 'hover:bg-brand-gray-soft text-brand-black/75'
                }`}
              >
                Todos ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter(p => p.category === cat.name).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full text-left px-3 py-2 rounded-luxury text-xs font-semibold transition-all cursor-pointer flex justify-between items-center ${
                      selectedCategory === cat.name
                        ? 'bg-brand-green-dark/10 text-brand-green-dark border-l-2 border-brand-green-dark'
                        : 'hover:bg-brand-gray-soft text-brand-black/75'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-brand-black/30 font-bold">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider de precio máximo */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black/50">Precio Máximo</label>
              <span className="text-xs font-bold text-brand-black">${maxPrice}</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxProductPrice}
              step="5"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-brand-green-dark h-1 bg-brand-gray-soft rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-bold text-brand-black/30">
              <span>$0</span>
              <span>${maxProductPrice}</span>
            </div>
          </div>
        </aside>

        {/* CONTENIDO DEL CATÁLOGO */}
        <div className="flex-1 space-y-6">
          
          {/* Barra de controles */}
          <div className="flex items-center justify-between bg-brand-white px-4 py-3 rounded-luxury border border-brand-black/5">
            <span className="text-xs text-brand-black/50 font-bold">
              Mostrando {sortedProducts.length} resultados
            </span>

            <div className="flex items-center gap-2">
              {/* Toggle de filtros móviles */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden p-2 text-brand-black/60 border border-brand-black/5 rounded-luxury bg-brand-white flex items-center gap-1.5 text-xs font-bold hover:bg-brand-gray-soft cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                Filtros
              </button>

              <Select
                options={sortOptions}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="!mb-0 py-1.5 px-3 text-xs w-48"
              />
            </div>
          </div>

          {/* Cuadrícula del catálogo */}
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-brand-white rounded-luxury border border-brand-black/5 p-6">
              <Leaf size={44} className="text-brand-black/20 mb-4 stroke-1 animate-pulse" />
              <h3 className="font-heading text-lg font-bold text-brand-black mb-1">No se Encontraron Formulaciones</h3>
              <p className="text-xs text-brand-black/50 font-medium max-w-sm mb-4">
                No encontramos productos que coincidan con tu búsqueda o filtros activos. Intenta ajustar los filtros.
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-brand-black text-brand-white hover:bg-brand-green-dark text-xs font-bold rounded-luxury transition-all cursor-pointer"
              >
                Reiniciar Filtros
              </button>
            </div>
          )}

        </div>

      </div>

      {/* FILTROS MÓVILES */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-brand-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowMobileFilters(false)}>
          <div 
            className="w-full max-w-xs bg-brand-white h-full p-6 flex flex-col justify-between overflow-y-auto animate-slide-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowMobileFilters(false)}
              className="absolute top-4 right-4 p-1.5 text-brand-black/50 hover:text-brand-black rounded-full hover:bg-brand-gray-soft cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>

            <div className="space-y-6 text-left mt-4">
              <div className="flex justify-between items-center pb-2 border-b border-brand-black/5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-black">Filtros</h3>
                <button 
                  onClick={clearFilters}
                  className="text-xs font-bold text-brand-green-dark hover:underline cursor-pointer"
                >
                  Limpiar Todo
                </button>
              </div>

              {/* Búsqueda */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black/50">Buscar</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nombre del producto o ingrediente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-brand-gray-soft px-3 py-2.5 text-xs border border-brand-black/5 rounded-luxury focus:outline-none focus:border-brand-green-dark"
                  />
                  <Search className="absolute right-3 top-3.5 text-brand-black/30" size={13} />
                </div>
              </div>

              {/* Categoría (móvil) */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black/50">Categoría</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedCategory('Todos')}
                    className={`px-3 py-2 rounded-luxury text-xs font-semibold transition-all cursor-pointer border ${
                      selectedCategory === 'Todos'
                        ? 'bg-brand-green-dark/15 text-brand-green-dark border-brand-green-dark'
                        : 'border-brand-black/5 hover:border-brand-black/10 text-brand-black/75 bg-brand-white'
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-3 py-2 rounded-luxury text-xs font-semibold transition-all cursor-pointer border ${
                        selectedCategory === cat.name
                          ? 'bg-brand-green-dark/15 text-brand-green-dark border-brand-green-dark'
                          : 'border-brand-black/5 hover:border-brand-black/10 text-brand-black/75 bg-brand-white'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Precio máximo (móvil) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black/50">Precio Máximo</label>
                  <span className="text-xs font-bold text-brand-black">${maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxProductPrice}
                  step="5"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-brand-green-dark h-1.5 bg-brand-gray-soft rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-bold text-brand-black/30">
                  <span>$0</span>
                  <span>${maxProductPrice}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full py-3 bg-brand-black text-brand-white hover:bg-brand-green-dark text-xs font-bold rounded-luxury mt-8 cursor-pointer"
            >
              Aplicar Filtros ({sortedProducts.length})
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
