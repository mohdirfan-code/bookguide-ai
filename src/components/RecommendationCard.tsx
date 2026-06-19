'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Book } from '@/lib/catalog';
import { MapPin, Tag, BookOpen } from 'lucide-react';

interface RecommendationCardProps {
  book: Book;
  whyRecommended?: string;
  reasonType?: string;
}

const getReasonBadge = (type?: string) => {
  switch (type) {
    case 'budget_match': return '💰 Fits your budget';
    case 'genre_match': return '🎯 Matches your genre';
    case 'gift_recommendation': return '🎁 Popular gift choice';
    case 'similar_to_liked_book': return '⭐ Similar to what you like';
    case 'beginner_friendly': return '🌱 Great for beginners';
    case 'popular_choice': return '🔥 Highly rated';
    default: return null;
  }
};

export function RecommendationCard({ book, whyRecommended, reasonType }: RecommendationCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card text-card-foreground border border-border shadow-sm rounded-xl overflow-hidden flex flex-col sm:flex-row my-4"
    >
      <div className="w-full sm:w-1/3 md:w-1/4 flex-shrink-0 bg-muted/20 relative flex flex-col items-center justify-center p-4 min-h-[200px]">
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/40 animate-pulse">
            <BookOpen className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        
        {(!book.cover_image_url || imageError) ? (
          <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center bg-primary/5 border border-primary/10 rounded-lg p-4 text-center">
            <p className="text-[10px] font-bold tracking-widest text-primary/50 uppercase mb-2">BookGuide AI</p>
            <BookOpen className="w-8 h-8 text-primary/40 mb-3" />
            <h4 className="text-sm font-bold text-primary line-clamp-3 mb-1">{book.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{book.author}</p>
          </div>
        ) : (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className={"w-full h-48 sm:h-full object-contain transition-opacity duration-300 " + (imageLoading ? 'opacity-0' : 'opacity-100')}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        )}
      </div>
      
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-primary leading-tight mb-1">{book.title}</h3>
        <p className="text-sm font-medium text-muted-foreground mb-3">by {book.author}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1 bg-accent/20 text-accent-foreground text-xs px-2.5 py-1 rounded-full font-medium">
            <Tag size={12} />
            <span className="line-clamp-1 max-w-[120px]">{book.genre}</span>
          </span>
          <span className="inline-flex items-center bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold text-sm shrink-0">
            ₹{book.price}
          </span>
        </div>

        {/* Store Location moved UP to guarantee visibility */}
        <div className="bg-muted/30 rounded-lg p-3 mb-4 border border-border/50 shrink-0">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Store Location</p>
              <p className="text-sm font-medium text-foreground">Section: {book.section} • Rack: {book.rack}</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed mb-4 line-clamp-3 md:line-clamp-4">
          {book.description}
        </p>

        {whyRecommended && (
          <div className="mt-auto pt-3 border-t border-border/50 bg-accent/5 -mx-4 -mb-4 p-4 sm:-mx-5 sm:-mb-5 sm:p-5">
            {reasonType && getReasonBadge(reasonType) && (
              <div className="mb-2 inline-flex items-center bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                {getReasonBadge(reasonType)}
              </div>
            )}
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              Why Recommended
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed font-medium">"{whyRecommended}"</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function RecommendationCardSkeleton() {
  return (
    <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden flex flex-col sm:flex-row my-4 animate-pulse">
      <div className="w-full sm:w-1/3 md:w-1/4 flex-shrink-0 bg-muted/40 min-h-[200px]" />
      <div className="p-4 sm:p-5 flex flex-col flex-grow space-y-4">
        <div>
          <div className="h-6 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/3" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-muted rounded w-20 rounded-full" />
          <div className="h-6 bg-muted rounded w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
        <div className="h-14 bg-muted/50 rounded-lg w-full" />
        <div className="h-16 bg-accent/10 rounded-lg w-full mt-auto" />
      </div>
    </div>
  );
}
