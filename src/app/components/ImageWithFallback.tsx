import React, { useState } from 'react';
import { Leaf } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Skincare product',
  className = '',
  fallbackText,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-brand-gray-soft flex items-center justify-center ${className}`}>
      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-brand-gray-soft via-[#E8E8EF] to-brand-gray-soft bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] flex items-center justify-center">
          <Leaf className="text-brand-green-dark/20 animate-pulse" size={24} />
        </div>
      )}

      {/* Fallback Display */}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-brand-green-dark/5 text-brand-green-dark/60">
          <Leaf size={32} className="mb-2 stroke-1" />
          <span className="text-[10px] uppercase font-bold tracking-wider max-w-[80%]">
            {fallbackText || alt}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          {...props}
        />
      )}
    </div>
  );
};
