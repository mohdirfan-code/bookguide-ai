"use client";

import { ChevronLeft, Bookmark, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SavedPage() {
  const router = useRouter();

  return (
    <div className="flex-1 bg-[#FAFAFA] flex flex-col w-full min-h-[100dvh]">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 shrink-0">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-primary hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="font-bold text-lg tracking-tight text-primary font-heading">
          Saved Books
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 px-6 pt-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
           <Bookmark className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-primary mb-2">No saved books yet</h2>
        <p className="text-sm text-gray-500 max-w-[250px]">
          Books you save during your chats will appear here for easy access.
        </p>
      </div>
    </div>
  );
}
