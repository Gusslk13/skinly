import React, { useState } from 'react';
import { useApp, FREE_SHIPPING_THRESHOLD } from '../../context/AppContext';
import { StarRating } from '../../components/StarRating';
import { VerifiedBadge } from '../../components/UI';
import { Button } from '../../components/UI';
import { ChevronLeft, ShoppingBag, Heart, Check, Truck, RefreshCw, Leaf, Star, MessageSquare, Send, ShieldAlert } from 'lucide-react';

// ── Render **bold** and line breaks from plain text ──────────────────────────
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const nodes: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(<strong key={i}>{part.slice(2, -2)}</strong>);
    } else {
      part.split('\n').forEach((line, j) => {
        if (j > 0) nodes.push(<br key={`${i}-br-${j}`} />);
        if (line) nodes.push(<span key={`${i}-${j}`}>{line}</span>);
      });
    }
  });
  return <>{nodes}</>;
}

type TabId = 'details' | 'benefits' | 'application' | 'ingredients' | 'reviews';

export const ProductDetails: React.FC = () => {
  const {
    selectedProductId, products, addToCart, toggleFavorite, isFavorite, goBack,
    reviews, fetchReviews, submitReview, hasUserPurchasedProduct, hasUserReviewedProduct,
    currentUser
  } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [activeImage, setActiveImage] = useState<string>('');

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const product = products.find(p => p.id === selectedProductId);

  // Build gallery from images[] or fallback to imageUrl
  const allImages = React.useMemo(() => {
    if (product) {
      if (Array.isArray(product.images) && product.images.length > 0) return product.images;
      if (product.imageUrl) return [product.imageUrl];
    }
    return [];
  }, [product]);

  // Set active image when product changes
  React.useEffect(() => {
    if (allImages.length > 0) setActiveImage(allImages[0]);
  }, [product?.id]);

  // Fetch reviews when product changes or reviews tab opened
  React.useEffect(() => {
    if (product?.id) fetchReviews(product.id);
  }, [product?.id]);

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

  const productReviews = reviews.filter(r => r.productId === product.id);
  const canReview = currentUser && hasUserPurchasedProduct(product.id) && !hasUserReviewedProduct(product.id) && !reviewSuccess;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) { setReviewError('Escribe un comentario para continuar.'); return; }
    setReviewLoading(true);
    setReviewError('');
    const res = await submitReview(product.id, reviewRating, reviewComment);
    setReviewLoading(false);
    if (res.success) { setReviewSuccess(true); setReviewComment(''); }
    else setReviewError(res.error || 'Error al enviar la reseña.');
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'details',      label: 'Detalles' },
    { id: 'benefits',     label: 'Beneficios' },
    { id: 'application',  label: 'Aplicación' },
    { id: 'ingredients',  label: `Ingredientes (${product.ingredients.length})` },
    { id: 'reviews',      label: `Reseñas (${productReviews.length})` },
  ];

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

        {/* Mitad izquierda — Galería */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative rounded-luxury overflow-hidden bg-brand-white border border-brand-black/5 aspect-[4/5] md:aspect-square flex items-center justify-center">
            <img
              src={activeImage || product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />

            {product.discountPrice && (
              <span className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-brand-green-light text-brand-black text-[10px] font-extrabold uppercase tracking-wider rounded-md">
                -{discountAmount}% DTO
              </span>
            )}

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

          {/* Thumbnail strip — only if multiple images */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`shrink-0 w-16 h-16 rounded-luxury overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImage === img
                      ? 'border-brand-green-dark shadow-md scale-105'
                      : 'border-brand-black/10 hover:border-brand-green-dark/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mitad derecha — Info */}
        <div className="flex flex-col justify-between text-left space-y-6">

          <div className="space-y-4">

            {/* Categoría + badge */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase font-bold text-brand-black/30 tracking-wider">
                {product.category}
              </span>
              {product.isVerified && <VerifiedBadge ingredients={product.ingredients} />}
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brand-black leading-tight tracking-wide">
              {product.name}
            </h1>

            <div className="flex items-center gap-3">
              <StarRating rating={product.rating} count={product.reviewsCount} size={15} />
              <span className="text-brand-black/10">|</span>
              <span className="text-xs font-semibold text-brand-green-dark">100% Extractos Orgánicos</span>
            </div>

            {/* Precios */}
            <div className="flex items-baseline gap-3 pt-2">
              {product.discountPrice ? (
                <>
                  <span className="text-2xl font-bold text-brand-black">${product.discountPrice.toFixed(2)}</span>
                  <span className="text-sm font-semibold text-brand-black/30 line-through">${product.price.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-2xl font-bold text-brand-black">${product.price.toFixed(2)}</span>
              )}
            </div>

            {/* Descripción corta */}
            <p className="text-sm text-brand-black/60 leading-relaxed pt-1">
              {renderMarkdown(product.description)}
            </p>

            {/* Stock */}
            <div className="pt-1">
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

          {/* Cantidad + CTA */}
          <div className="space-y-4 pt-4 border-t border-brand-black/5">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-black/40">Cantidad</span>
              <div className="flex items-center border border-brand-black/10 rounded-luxury bg-brand-white overflow-hidden">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 flex items-center justify-center text-sm font-bold text-brand-black/60 hover:bg-brand-gray-soft cursor-pointer transition-colors"
                  disabled={product.stock === 0}
                >
                  −
                </button>
                <span className="px-4 text-xs font-bold text-brand-black w-10 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                  className="w-10 h-10 flex items-center justify-center text-sm font-bold text-brand-black/60 hover:bg-brand-gray-soft cursor-pointer transition-colors"
                  disabled={product.stock === 0}
                >
                  +
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full py-3.5 gap-2"
              onClick={() => { addToCart(product, quantity); setQuantity(1); }}
              disabled={product.stock === 0}
            >
              <ShoppingBag size={16} />
              Agregar a la Bolsa
            </Button>
          </div>

          {/* Confianza */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-brand-black/5">
            <div className="flex items-start gap-2 p-3 bg-brand-green-dark/5 rounded-luxury border border-brand-green-dark/10">
              <Truck size={14} className="text-brand-green-dark mt-0.5 shrink-0" />
              <div>
                <span className="block text-[10px] font-extrabold text-brand-green-dark uppercase tracking-wide">Envío Gratis</span>
                <span className="block text-[9px] text-brand-black/50 font-medium leading-snug">En compras mayores a ${FREE_SHIPPING_THRESHOLD}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-brand-gray-soft/50 rounded-luxury border border-brand-black/5">
              <RefreshCw size={14} className="text-brand-green-dark shrink-0" />
              <span className="text-[10px] font-semibold text-brand-black/60 leading-snug">Devoluciones Sin Costo</span>
            </div>
          </div>

        </div>
      </div>

      {/* PESTAÑAS DE INFORMACIÓN DETALLADA */}
      <section className="bg-brand-white p-5 sm:p-8 rounded-luxury border border-brand-black/5 space-y-6 text-left">

        {/* Tab headers */}
        <div className="flex gap-1 sm:gap-6 border-b border-brand-black/5 overflow-x-auto pb-0 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-brand-green-dark border-b-2 border-brand-green-dark'
                  : 'text-brand-black/40 hover:text-brand-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[120px]">

          {/* DETALLES */}
          {activeTab === 'details' && (
            <div className="space-y-4 max-w-3xl text-sm leading-relaxed text-brand-black/75">
              {product.description ? (
                <p>{renderMarkdown(product.description)}</p>
              ) : (
                <p className="italic text-brand-black/40">Sin descripción disponible para este producto.</p>
              )}
            </div>
          )}

          {/* BENEFICIOS */}
          {activeTab === 'benefits' && (
            <div className="space-y-4 max-w-3xl">
              {product.benefits ? (
                <div className="text-sm leading-relaxed text-brand-black/75 space-y-3">
                  {product.benefits.split('\n').filter(Boolean).map((line, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-brand-green-dark/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Leaf size={10} className="text-brand-green-dark" />
                      </div>
                      <span>{renderMarkdown(line)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-sm text-brand-black/40">No hay información de beneficios para este producto todavía.</p>
              )}
            </div>
          )}

          {/* APLICACIÓN */}
          {activeTab === 'application' && (
            <div className="space-y-4 max-w-3xl">
              {product.howToUse ? (
                <div className="text-sm leading-relaxed text-brand-black/75 space-y-3">
                  {product.howToUse.split('\n').filter(Boolean).map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-brand-green-dark text-brand-white flex items-center justify-center shrink-0 text-[10px] font-extrabold mt-0.5">
                        {i + 1}
                      </div>
                      <span>{renderMarkdown(step)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-sm text-brand-black/40">No hay instrucciones de aplicación para este producto todavía.</p>
              )}
            </div>
          )}

          {/* INGREDIENTES */}
          {activeTab === 'ingredients' && (
            <div className="space-y-4">
              <p className="text-xs text-brand-black/50 leading-relaxed max-w-2xl">
                Cada ingrediente está auditado para verificar su estado libre de crueldad animal, sostenibilidad y seguridad cosmética completa.
              </p>
              {product.ingredients.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {product.ingredients.map((ing, i) => (
                    <div
                      key={i}
                      className="px-3.5 py-2 bg-brand-green-dark/5 text-brand-black border border-brand-green-dark/15 rounded-luxury text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Check size={12} className="text-brand-green-dark shrink-0" />
                      {ing}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-sm text-brand-black/40">Sin ingredientes registrados.</p>
              )}
            </div>
          )}

          {/* RESEÑAS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 max-w-2xl">

              {/* Formulario para dejar reseña (solo si compró y no ha reseñado) */}
              {canReview && (
                <form onSubmit={handleSubmitReview} className="bg-brand-green-dark/5 border border-brand-green-dark/15 rounded-luxury p-5 space-y-4">
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-green-dark mb-1">
                      Deja tu reseña
                    </span>
                    <p className="text-xs text-brand-black/50">Compraste este producto — comparte tu experiencia.</p>
                  </div>

                  {/* Star selector */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="cursor-pointer transition-transform active:scale-90"
                      >
                        <Star
                          size={22}
                          className={star <= reviewRating
                            ? 'fill-brand-green-dark text-brand-green-dark'
                            : 'text-brand-black/15'
                          }
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-brand-black/50">
                      {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][reviewRating]}
                    </span>
                  </div>

                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Cuéntanos cómo te fue con este producto..."
                    rows={3}
                    className="w-full px-4 py-3 bg-brand-white border border-brand-black/10 focus:border-brand-green-dark rounded-luxury text-sm outline-none resize-none transition-all"
                    disabled={reviewLoading}
                  />

                  {reviewError && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-luxury px-3 py-2">
                      <ShieldAlert size={13} className="shrink-0" />
                      {reviewError}
                    </div>
                  )}

                  <Button type="submit" variant="primary" disabled={reviewLoading} className="gap-2 py-2.5 text-xs">
                    <Send size={13} />
                    {reviewLoading ? 'Enviando...' : 'Publicar Reseña'}
                  </Button>
                </form>
              )}

              {/* Mensaje de éxito */}
              {reviewSuccess && (
                <div className="flex items-center gap-2.5 text-sm font-semibold text-brand-green-dark bg-brand-green-dark/5 border border-brand-green-dark/15 rounded-luxury px-4 py-3">
                  <Check size={16} className="shrink-0" />
                  ¡Gracias! Tu reseña fue publicada.
                </div>
              )}

              {/* Lista de reseñas */}
              {productReviews.length > 0 ? (
                <div className="space-y-4">
                  {productReviews.map(review => (
                    <div key={review.id} className="bg-brand-white border border-brand-black/5 rounded-luxury p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="block text-xs font-bold text-brand-black">{review.userFullName}</span>
                          <span className="text-[10px] text-brand-black/35 font-medium">
                            {new Date(review.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12}
                              className={s <= review.rating ? 'fill-brand-green-dark text-brand-green-dark' : 'text-brand-black/10'} />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-brand-black/65 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <MessageSquare size={32} className="mx-auto text-brand-black/15 stroke-1" />
                  <p className="text-xs text-brand-black/40 font-medium">
                    Aún no hay reseñas para este producto. ¡Sé el primero en compartir tu experiencia!
                  </p>
                </div>
              )}

              {/* Mensaje si no ha comprado */}
              {!currentUser && (
                <p className="text-xs text-brand-black/40 italic">
                  Inicia sesión y compra este producto para dejar una reseña.
                </p>
              )}
              {currentUser && !hasUserPurchasedProduct(product.id) && !hasUserReviewedProduct(product.id) && !reviewSuccess && (
                <p className="text-xs text-brand-black/40 italic">
                  Solo clientes que han comprado este producto pueden dejar reseñas verificadas.
                </p>
              )}

            </div>
          )}

        </div>
      </section>

    </div>
  );
};
