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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card text-card-foreground border border-border shadow-sm rounded-xl overflow-hidden flex flex-col my-4"
    >
      <div className="flex flex-row">
        <div className="w-[80px] sm:w-[100px] flex-shrink-0 bg-muted/20 relative flex flex-col items-center justify-center p-2 min-h-[120px] border-r border-border/50">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/40 animate-pulse">
              <BookOpen className="w-5 h-5 text-muted-foreground/30" />
            </div>
          )}
          
          {(!book.cover_image_url || imageError) ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-1">
              <BookOpen className="w-6 h-6 text-primary/40 mb-1" />
              <p className="text-[8px] text-muted-foreground line-clamp-2 leading-tight">{book.author}</p>
            </div>
          ) : (
            <img
              src={book.cover_image_url}
              alt={book.title}
              className={"w-full h-full object-contain transition-opacity duration-300 " + (imageLoading ? 'opacity-0' : 'opacity-100')}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          )}
        </div>
      
        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="text-base sm:text-lg font-bold text-primary leading-tight line-clamp-2">{book.title}</h3>
            <span className="inline-flex items-center bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold text-sm shrink-0 whitespace-nowrap">
              ₹{book.price}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-3">{book.author}</p>

          {/* Hero Location */}
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-3 bg-muted/40 px-2 py-1.5 rounded-md w-fit border border-border/50">
            <MapPin size={14} className="text-primary" />
            <span>{book.section} • Rack {book.rack}</span>
          </div>

          <div className="mt-auto pt-1">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 bg-accent/30 hover:bg-accent/50 text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              <BookOpen size={12} />
              {isExpanded ? 'Hide Details' : 'More Details'}
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
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
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-border/50 bg-muted/10">
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

              {whyRecommended && (
                <div className="mb-4 bg-primary/5 p-3 rounded-lg border border-primary/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Why Recommended</p>
                  <p className="text-sm font-medium text-foreground/90 italic">"{whyRecommended}"</p>
                </div>
              )}

              <p className="text-sm text-foreground/80 leading-relaxed">
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
    <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden flex flex-row my-4 animate-pulse">
      <div className="w-[80px] sm:w-[100px] flex-shrink-0 bg-muted/40 min-h-[120px] border-r border-border/50" />
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="h-5 bg-muted rounded w-2/3" />
          <div className="h-5 bg-muted rounded w-12" />
        </div>
        <div className="h-3 bg-muted rounded w-1/3 mb-4" />
        <div className="h-6 bg-muted/50 rounded w-1/2 mb-4" />
        <div className="h-6 bg-accent/20 rounded-full w-24 mt-auto" />
      </div>
    </div>
  );
}
