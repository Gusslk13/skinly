import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StarRating } from '../../components/StarRating';
import { VerifiedBadge } from '../../components/UI';
import { Button } from '../../components/UI';
import { ChevronLeft, ShoppingBag, Heart, Check, HelpCircle, Truck, RefreshCw } from 'lucide-react';

export const ProductDetails: React.FC = () => {
  const { selectedProductId, products, addToCart, toggleFavorite, isFavorite, goBack } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'ingredients' | 'reviews'>('details');

  const product = products.find(p => p.id === selectedProductId);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-heading text-2xl font-bold text-brand-black">Formulación No Encontrada</h2>
        <p className="text-sm text-brand-black/50">El producto solicitado no pudo ser cargado.</p>
        <Button variant="outline" onClick={goBack}>Regresar</Button>
      </div>
    );
  }

  const liked = isFavorite(product.id);
  const discountAmount = product.discountPrice 
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) 
    : 0;

  const currentPrice = product.discountPrice || product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8">
      
      {/* Botón de regreso */}
      <div className="flex justify-start">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-black/50 hover:text-brand-black cursor-pointer transition-colors"
        >
          <ChevronLeft size={16} />
          Volver al Catálogo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Mitad izquierda - Imagen grande del producto */}
        <div className="relative rounded-luxury overflow-hidden bg-brand-white border border-brand-black/5 aspect-[4/5] md:aspect-square flex items-center justify-center">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />

          {/* Overlay de oferta */}
          {product.discountPrice && (
            <span className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-brand-green-light text-brand-black text-[10px] font-extrabold uppercase tracking-wider rounded-md">
              -{discountAmount}% DTO
            </span>
          )}

          {/* Botón de favorito */}
          <button
            onClick={() => toggleFavorite(product.id)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-brand-white/80 backdrop-blur-sm border border-brand-white/20 flex items-center justify-center text-brand-black hover:bg-brand-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
          >
            <Heart 
              size={18} 
              className={liked ? 'fill-red-500 text-red-500' : 'text-brand-black/70'} 
            />
          </button>
        </div>

        {/* Mitad derecha - Información del producto */}
        <div className="flex flex-col justify-between text-left space-y-6">
          
          <div className="space-y-4">
            
            {/* Estado de verificación y categoría */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase font-bold text-brand-black/30 tracking-wider">
                {product.category}
              </span>
              {product.isVerified && <VerifiedBadge ingredients={product.ingredients} />}
            </div>

            {/* Título */}
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brand-black leading-tight tracking-wide">
              {product.name}
            </h1>

            {/* Resumen de calificaciones */}
            <div className="flex items-center gap-3">
              <StarRating rating={product.rating} count={product.reviewsCount} size={15} />
              <span className="text-brand-black/10">|</span>
              <span className="text-xs font-semibold text-brand-green-dark">100% Extractos Orgánicos</span>
            </div>

            {/* Sección de precios */}
            <div className="flex items-baseline gap-3 pt-2">
              {product.discountPrice ? (
                <>
                  <span className="text-2xl font-bold text-brand-black">
                    ${product.discountPrice.toFixed(2)}
                  </span>
                  <span className="text-sm font-semibold text-brand-black/30 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-brand-black">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-sm text-brand-black/60 leading-relaxed pt-2">
              {product.description}
            </p>

            {/* Aviso de stock */}
            <div className="pt-2">
              {product.stock > 0 ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-green-dark">
                  <Check size={14} className="stroke-2" />
                  <span>En Stock (Listo para despachar)</span>
                  {product.stock <= 15 && (
                    <span className="text-red-500 font-extrabold ml-1">
                      (¡Solo quedan {product.stock} unidades!)
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-red-500">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>Sin Stock</span>
                </div>
              )}
            </div>

          </div>

          {/* Selector de cantidad y agregar al carrito */}
          <div className="space-y-4 pt-4 border-t border-brand-black/5">
            
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-black/40">
                Cantidad
              </span>
              <div className="flex items-center border border-brand-black/10 rounded-luxury bg-brand-white overflow-hidden">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="px-3.5 py-2 text-sm font-bold text-brand-black/60 hover:bg-brand-gray-soft cursor-pointer transition-colors"
                  disabled={product.stock === 0}
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold text-brand-black w-10 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                  className="px-3.5 py-2 text-sm font-bold text-brand-black/60 hover:bg-brand-gray-soft cursor-pointer transition-colors"
                  disabled={product.stock === 0}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="primary"
                className="flex-1 py-3.5 gap-2"
                onClick={() => {
                  addToCart(product, quantity);
                  setQuantity(1);
                }}
                disabled={product.stock === 0}
              >
                <ShoppingBag size={16} />
                Agregar a la Bolsa
              </Button>
            </div>

          </div>

          {/* Lista de confianza */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-black/5 text-[11px] font-semibold text-brand-black/60">
            <div className="flex items-center gap-2">
              <Truck size={14} className="text-brand-green-dark" />
              <span>Envío Gratis (más de $100)</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-brand-green-dark" />
              <span>Devoluciones Sin Costo</span>
            </div>
          </div>

        </div>

      </div>

      {/* PESTAÑAS DE INFORMACIÓN DETALLADA */}
      <section className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 space-y-6 text-left">
        <div className="flex gap-6 border-b border-brand-black/5 overflow-x-auto pb-0.5">
          {[
            { id: 'details', label: 'Detalles de Formulación' },
            { id: 'ingredients', label: `Ingredientes Auditados (${product.ingredients.length})` },
            { id: 'reviews', label: `Auditorías y Reseñas (${product.reviewsCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-brand-green-dark border-b-2 border-brand-green-dark'
                  : 'text-brand-black/40 hover:text-brand-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido de las pestañas */}
        <div>
          {activeTab === 'details' && (
            <div className="space-y-4 max-w-3xl text-sm leading-relaxed text-brand-black/75">
              <p>
                Nuestro **{product.name}** de alto rendimiento está formulado para tratar la pérdida transepidérmica de agua y reparar las capas epidérmicas. Al combinar escualano vegetal y componentes bioactivos, este producto restaura la elasticidad, aclara la hiperpigmentación y crea un acabado radiante visible.
              </p>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-black pt-2">Modo de Uso:</h4>
              <p className="text-xs">
                Aplica 2–3 gotas sobre la piel limpia y ligeramente húmeda, mañana y noche. Palmea suavemente en el rostro y cuello. Permite 30 segundos de absorción dérmica completa antes de aplicar hidratantes.
              </p>
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-4">
              <p className="text-xs text-brand-black/50 leading-relaxed max-w-2xl">
                Cada ingrediente listado a continuación está auditado para verificar su estado libre de crueldad animal, sostenibilidad y seguridad cosmética completa.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {product.ingredients.map((ing, i) => (
                  <div 
                    key={i} 
                    className="px-3.5 py-2 bg-brand-green-dark/5 text-brand-black border border-brand-green-dark/15 rounded-luxury text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Check size={12} className="text-brand-green-dark" />
                    {ing}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="bg-brand-gray-soft p-4 rounded-luxury border border-brand-black/5 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-brand-black">{product.rating}</span>
                  <span className="text-xs text-brand-black/40 font-bold"> de 5.0</span>
                  <p className="text-[10px] text-brand-black/40 font-semibold tracking-wider uppercase mt-1">Basado en {product.reviewsCount} auditorías de clientes</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-green-dark bg-brand-green-dark/15 px-3 py-1 rounded-full">
                    98.5% Lo Recomiendan
                  </span>
                </div>
              </div>

              {/* Reseña de muestra */}
              <div className="border-b border-brand-black/5 pb-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-brand-black">Giselle T. (Compra Verificada)</span>
                  <span className="text-[10px] text-brand-black/40 font-semibold">hace 2 días</span>
                </div>
                <StarRating rating={5.0} />
                <p className="text-xs text-brand-black/75 leading-relaxed">
                  "Este suero transformó completamente mis parches secos. Noté un brillo visible en la primera semana de aplicación. ¡Textura verdaderamente lujosa!"
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};
