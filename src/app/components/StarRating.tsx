import React from 'react';
import { Star } from 'lucide-react';

export const StarRating: React.FC<{ rating: number; count?: number; size?: number }> = ({ rating, count, size = 13 }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => {
          const active = i < fullStars || (i === fullStars && hasHalf);
          return (
            <Star
              key={i}
              size={size}
              className={`${active ? 'text-brand-green-dark fill-brand-green-dark' : 'text-brand-black/10'}`}
            />
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-[10px] text-brand-black/40 font-semibold tracking-wide ml-1">({count})</span>
      )}
    </div>
  );
};
