import React from 'react';
import { Product, useApp } from '../context/AppContext';
import { ImageWithFallback } from './ImageWithFallback';
import { StarRating } from './StarRating';
import { VerifiedBadge } from './UI';
import { Heart, ShoppingBag } from 'lucide-react';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { setView, addToCart, toggleFavorite, isFavorite } = useApp();
  
  const liked = isFavorite(product.id);
  const discountAmount = product.discountPrice 
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) 
    : 0;

  return (
    <div 
      onClick={() => setView('product-details', product.id)}
      className="group bg-brand-white rounded-luxury overflow-hidden border border-brand-black/5 hover:border-brand-black/10 hover:shadow-xl hover:shadow-brand-black/[0.03] hover:-translate-y-1 transition-all ease-luxury duration-500 flex flex-col cursor-pointer relative"
    >
      {/* Favorite Button Overlay */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(product.id);
        }}
        className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-brand-white/80 backdrop-blur-sm border border-brand-white/20 flex items-center justify-center text-brand-black hover:bg-brand-white hover:scale-105 active:scale-95 transition-all ease-luxury duration-300 cursor-pointer shadow-sm"
      >
        <Heart 
          size={15} 
          className={`transition-colors duration-300 ${liked ? 'fill-red-500 text-red-500' : 'text-brand-black/70'}`} 
        />
      </button>

      {/* Sale/Discount Badge Overlay */}
      {product.discountPrice && (
        <span className="absolute top-3.5 left-3.5 z-10 px-2 py-0.5 bg-brand-green-light text-brand-black text-[9px] font-extrabold uppercase tracking-wider rounded-md">
          -{discountAmount}% DTO
        </span>
      )}

      {/* Product Image */}
      <div className="w-full aspect-[4/5] relative overflow-hidden bg-brand-gray-soft">
        <ImageWithFallback
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform ease-luxury duration-[1200ms] group-hover:scale-[1.03]"
        />

        {/* Quick Add Overlay — always visible on mobile, hover on desktop */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform ease-luxury duration-500 bg-gradient-to-t from-brand-black/40 to-transparent">
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product, 1);
            }}
            className="w-full py-2.5 bg-brand-white hover:bg-brand-green-dark hover:text-brand-white text-brand-black text-xs font-semibold rounded-luxury flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all ease-luxury duration-300 active:scale-95"
          >
            <ShoppingBag size={13} />
            Agregar rápido
          </button>
        </div>
      </div>

      {/* Content details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Verification Badge */}
          <div className="min-h-5 mb-1.5 flex items-center">
            {product.isVerified && <VerifiedBadge ingredients={product.ingredients} />}
          </div>

          {/* Name */}
          <h3 className="font-heading text-base font-semibold text-brand-black leading-tight tracking-wide mb-1 group-hover:text-brand-green-dark transition-colors">
            {product.name}
          </h3>

          {/* Category */}
          <span className="text-[10px] uppercase font-semibold text-brand-black/30 tracking-wider block mb-2">
            {product.category}
          </span>
        </div>

        <div>
          {/* Reviews Star count */}
          <div className="mb-2">
            <StarRating rating={product.rating} count={product.reviewsCount} />
          </div>

          {/* Pricing Grid */}
          <div className="flex items-center gap-2">
            {product.discountPrice ? (
              <>
                <span className="text-sm font-bold text-brand-black">
                  ${product.discountPrice.toFixed(2)}
                </span>
                <span className="text-xs text-brand-black/35 line-through">
                  ${product.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-brand-black">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
