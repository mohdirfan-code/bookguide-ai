"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Flame, MapPin, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { Book } from "@/lib/catalog";

export default function PopularPage() {
  const router = useRouter();
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.json())
      .then((data: Book[]) => {
        // Just mock taking the first 10 for popular
        setPopularBooks(data.slice(0, 10));
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex-1 bg-[#FAFAFA] flex flex-col w-full min-h-[100dvh]">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 shrink-0">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-primary hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary font-heading">
          <Flame className="w-5 h-5 text-accent" /> Popular
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24">
        {loading ? (
          <div className="flex justify-center mt-10">
            <div className="w-8 h-8 border-4 border-indigo-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {popularBooks.map((book, idx) => (
              <div key={idx} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                 <div className="w-16 shrink-0 aspect-[2/3] bg-gray-50 rounded-md overflow-hidden border border-gray-100 relative">
                   {book.cover_image_url ? (
                     <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                   ) : (
                     <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-gray-300" />
                     </div>
                   )}
                 </div>
                 <div className="flex flex-col flex-1 py-1">
                   <h3 className="text-sm font-bold text-primary line-clamp-2 leading-tight">{book.title}</h3>
                   <p className="text-xs text-gray-500 mt-1 mb-2">{book.author}</p>
                   
                   <div className="mt-auto flex items-center justify-between">
                     <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                       {book.genre}
                     </span>
                     <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-brand">
                       <MapPin className="w-3 h-3" />
                       Aisle {book.section}
                     </div>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
