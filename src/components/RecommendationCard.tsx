'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '@/lib/catalog';
import { MapPin, Tag, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col my-2 w-full"
    >
      <div className="flex flex-row gap-3">
        <div className="w-[60px] flex-shrink-0 relative flex flex-col items-center justify-start mt-1">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/40 animate-pulse">
              <BookOpen className="w-5 h-5 text-muted-foreground/30" />
            </div>
          )}
          
          {(!book.cover_image_url || imageError) ? (
            <div className="w-full aspect-[2/3] flex flex-col items-center justify-center text-center bg-primary/5 rounded-md border border-primary/10">
              <BookOpen className="w-4 h-4 text-primary/40" />
            </div>
          ) : (
            <img
              src={book.cover_image_url}
              alt={book.title}
              className={"w-full rounded-md shadow-sm object-cover aspect-[2/3] transition-opacity duration-300 " + (imageLoading ? 'opacity-0' : 'opacity-100')}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          )}
        </div>
      
        <div className="flex flex-col flex-grow min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2">{book.title}</h3>
            <span className="inline-flex items-center text-primary font-bold text-sm shrink-0 whitespace-nowrap">
              ₹{book.price}
            </span>
          </div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5 truncate">{book.author}</p>

          {/* Hero Location */}
          <div className="flex items-center gap-1 text-xs font-semibold text-foreground mb-2">
            <MapPin size={12} className="text-primary shrink-0" />
            <span className="truncate">{book.section} • Rack {book.rack}</span>
          </div>

          {whyRecommended && (
            <div className="mb-2">
              <p className="text-xs text-foreground/90 leading-snug italic">"{whyRecommended}"</p>
            </div>
          )}

          <div className="mt-1">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-semibold transition-colors"
            >
              <BookOpen size={12} />
              {isExpanded ? 'Hide Details' : 'More Details'}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3"
          >
            <div className="p-3 bg-muted/20 rounded-lg">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1 bg-accent/20 text-accent-foreground text-xs px-2.5 py-1 rounded-full font-medium">
                  <Tag size={12} />
                  {book.genre}
                </span>
                {reasonType && getReasonBadge(reasonType) && (
                  <span className="inline-flex items-center bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    {getReasonBadge(reasonType)}
                  </span>
                )}
              </div>

              <p className="text-xs text-foreground/80 leading-relaxed mt-2">
                {book.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function RecommendationCardSkeleton() {
  return (
    <div className="flex flex-row gap-3 my-2 w-full animate-pulse">
      <div className="w-[60px] aspect-[2/3] flex-shrink-0 bg-muted/40 rounded-md" />
      <div className="flex flex-col flex-grow py-1">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-10" />
        </div>
        <div className="h-3 bg-muted rounded w-1/3 mb-3" />
        <div className="h-3 bg-muted rounded w-1/2 mb-3" />
        <div className="h-3 bg-muted rounded w-full mb-1" />
        <div className="h-3 bg-muted rounded w-4/5 mt-auto" />
      </div>
    </div>
  );
}
