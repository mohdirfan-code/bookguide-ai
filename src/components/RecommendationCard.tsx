"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '@/lib/catalog';
import { MapPin, BookOpen, Star, Sparkles, ChevronDown, ChevronUp, Layers, Compass } from 'lucide-react';
import Image from 'next/image';

interface RecommendationCardProps {
  book: Book;
  whyRecommended?: string;
  reasonType?: string;
  onAction?: (action: string, book: Book) => void;
}

export function RecommendationCard({ book, whyRecommended, reasonType, onAction }: RecommendationCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  // Filter out demo-style placeholder descriptions
  const isDemoDesc = book.description?.toLowerCase().includes("demo") || book.description?.toLowerCase().includes("suitable for");
  const displayDescription = isDemoDesc || !book.description 
    ? `An immersive ${book.genre?.toLowerCase() || 'story'} by ${book.author || 'the author'}, filled with memorable characters and a richly crafted world.` 
    : book.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col w-full max-w-[340px] bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden mb-3"
    >
      <div className="p-4 flex flex-row gap-4">
        {/* Book Cover */}
        <div className="w-[72px] shrink-0">
          <div className="w-full aspect-[2/3] rounded-md overflow-hidden bg-gray-50 border border-gray-100 relative shadow-sm">
            {(!book.cover_image_url || imageError) ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-gray-300" />
              </div>
            ) : (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        </div>
      
        {/* Info */}
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-sm font-bold text-primary leading-snug line-clamp-2 mb-1">{book.title}</h3>
          <p className="text-xs font-medium text-gray-500 mb-2 truncate">{book.author}</p>
          
          <div className="flex flex-wrap gap-1.5 mb-2">
             <span className="inline-flex bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                {book.genre}
             </span>
             <span className="inline-flex bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                ₹{book.price}
             </span>
             {reasonType === 'popular_choice' && (
               <span className="inline-flex bg-red-50 text-red-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                  Popular
               </span>
             )}
          </div>

          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-brand mt-auto hover:opacity-80 transition-opacity"
          >
            {isExpanded ? 'Less Details' : 'More Details'}
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Permanently Visible Why Recommended */}
      {whyRecommended && (
        <div className="px-4 pb-3">
          <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-3 flex gap-2.5">
            <div className="shrink-0 mt-0.5">
               <Star className="w-4 h-4 text-accent fill-accent" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-primary mb-0.5">Why this book?</p>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                {whyRecommended}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="font-semibold text-primary block mb-1">Description</span>
                {displayDescription}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable Location */}
      <AnimatePresence>
        {showLocation && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-brand">
                  <MapPin className="w-5 h-5" />
                  <div>
                    <p className="text-xs font-bold">Aisle {book.section}, Rack {book.rack}</p>
                    <p className="text-[10px] opacity-80">Available in store</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2">
        <button 
          onClick={() => onAction && onAction('similar', book)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 shadow-sm text-gray-600 py-2 rounded-xl font-semibold text-[11px] hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
           <Sparkles className="w-3.5 h-3.5 text-indigo-brand" />
           Similar books
        </button>
        <button 
          onClick={() => setShowLocation(!showLocation)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 shadow-sm text-gray-600 py-2 rounded-xl font-semibold text-[11px] hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
           <MapPin className="w-3.5 h-3.5 text-indigo-brand" />
           Location
        </button>
        <button 
          onClick={() => onAction && onAction('more_category', book)}
          className="w-full flex items-center justify-center gap-1.5 bg-white border border-gray-200 shadow-sm text-gray-600 py-2 rounded-xl font-semibold text-[11px] hover:bg-gray-50 transition-colors"
        >
           <Layers className="w-3.5 h-3.5 text-indigo-brand" />
           More from {book.genre}
        </button>
      </div>
    </motion.div>
  );
}
