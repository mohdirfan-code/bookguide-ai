"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles, ChevronLeft, MoreHorizontal, BookOpen, RefreshCw } from 'lucide-react';
import { Book } from '@/lib/catalog';
import { RecommendationCard } from './RecommendationCard';
import { cn } from '@/lib/utils';
import { useChat } from '@/lib/ChatContext';

type StructuredResponse = {
  message: string;
  recommendations: { title: string; reason: string; reasonType?: string; confidence?: number }[];
  followUpQuestion: string | null;
};

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string | StructuredResponse;
};

export function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams ? searchParams.get('q') : null;

  const { messages, setMessages, profile, setProfile, catalog, setCatalog, resetChat } = useChat();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (catalog.length === 0) {
      fetch('/api/catalog')
        .then(res => res.json())
        .then(data => setCatalog(data))
        .catch(err => console.error("Failed to load catalog", err));
    }
  }, [catalog.length, setCatalog]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialQuery && !hasInitialized.current) {
      hasInitialized.current = true;
      submitQuery(initialQuery);
    }
  }, [initialQuery]);

  const submitQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    console.log("[BookGuide] User message sent:", queryText);

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: queryText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Exclude the hardcoded welcome message from history to prevent hallucinating context
      const historyToPass = messages.filter(m => m.id !== 'welcome');
      
      const chatHistoryForApi = historyToPass.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      }));
      chatHistoryForApi.push({ role: 'user', content: queryText });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistoryForApi, profile })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      
      if (data.profileUpdate || data.followUpQuestion) {
        setProfile(prev => {
          const newProfile = { ...prev };
          if (data.profileUpdate) {
            for (const key in data.profileUpdate) {
              if (Array.isArray(data.profileUpdate[key])) {
                const prevArray = Array.isArray(prev[key]) ? prev[key] : [];
                newProfile[key] = Array.from(new Set([...prevArray, ...data.profileUpdate[key]]));
              } else {
                newProfile[key] = data.profileUpdate[key];
              }
            }
          }
          if (data.followUpQuestion) {
            newProfile.clarificationCount = (newProfile.clarificationCount || 0) + 1;
            newProfile.lastQuestionAsked = data.followUpQuestion;
          }
          return newProfile;
        });
      }
      
      let recommendations = data.recommendations || [];
      let messageText = data.message || "";

      if (recommendations.length === 0 && !data.followUpQuestion) {
        messageText = "I couldn't find a perfect match for that exact request, but here are a few popular books available in the store that you might enjoy.";
        recommendations = catalog
          .filter(b => b.targetAudience !== 'children')
          .slice(0, 1)
          .map(b => ({
            title: b.title,
            reason: "A highly popular and beloved book from our catalog.",
            reasonType: "popular_choice"
          }));
      }

      const structuredResponse: StructuredResponse = {
        message: messageText,
        recommendations: recommendations,
        followUpQuestion: data.followUpQuestion || null
      };

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: structuredResponse }]);
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        content: { message: "I'm having trouble processing that request. Could you try rephrasing it?", recommendations: [], followUpQuestion: null } 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    submitQuery(input);
  };

  const suggestedPrompts = [
    "Surprise me",
    "I like fantasy",
    "Need a gift",
    "Under ₹500"
  ];

  const renderMessageContent = (message: Message) => {
    if (message.role === 'user') {
      return (
        <div className="flex justify-end w-full mb-4 px-4">
          <div className="bg-indigo-brand text-white px-4 py-3 rounded-[1.25rem] rounded-tr-[0.25rem] max-w-[85%] text-[15px] leading-relaxed shadow-sm">
            {message.content as string}
          </div>
        </div>
      );
    }

    const data = message.content as StructuredResponse;
    const isWelcome = message.id === 'welcome';
    
    return (
      <div className="flex w-full mb-4 px-4 gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-1 shadow-sm">
          <BookOpen className="w-4 h-4 text-indigo-brand" />
        </div>
        
        <div className="flex flex-col gap-3 max-w-[85%]">
          {/* Bubble */}
          <div className="bg-white border border-gray-100 text-primary px-4 py-3 rounded-[1.25rem] rounded-tl-[0.25rem] text-[15px] leading-relaxed shadow-sm">
            <p className="whitespace-pre-wrap">{data.message}</p>
            {data.followUpQuestion && (
              <div className="mt-3 pt-3 border-t border-gray-100 font-semibold text-indigo-brand">
                {data.followUpQuestion}
              </div>
            )}
          </div>
          
          {/* Welcome quick chips */}
          {isWelcome && messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => submitQuery(prompt)}
                  className="bg-white border border-indigo-100 text-indigo-brand hover:bg-indigo-50 text-[13px] font-medium px-4 py-2 rounded-full transition-colors shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          
          {/* Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="w-full flex flex-col gap-3 mt-1">
              {[...data.recommendations].sort((a, b) => (b.confidence || 0) - (a.confidence || 0)).map((rec, idx) => {
                const book = catalog.find(b => b.title.toLowerCase() === rec.title.toLowerCase());
                if (!book) return <span key={idx} className="text-red-500 text-sm font-bold">[Book Not Found in Catalog: {rec.title}]</span>;
                return (
                  <RecommendationCard 
                    key={idx} 
                    book={book} 
                    whyRecommended={rec.reason} 
                    reasonType={rec.reasonType} 
                    onAction={(action, targetBook) => {
                      if (action === 'similar') {
                        submitQuery(`Show me books similar to ${targetBook.title}`);
                      } else if (action === 'more_category') {
                        submitQuery(`Show me more ${targetBook.genre} books`);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Loading indicator if this is the last message and we are loading */}
          {isLoading && message.id === messages[messages.length - 1].id && (
            <div className="flex items-center gap-2 mt-2">
              <span className="flex gap-1 bg-white border border-gray-100 px-3 py-2 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 bg-indigo-brand/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-brand/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-brand/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] w-full bg-[#FAFAFA] relative overflow-hidden pb-16">
      
      {/* Header */}
      <div 
        className="flex justify-between items-center px-4 h-14 sm:h-12 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button onClick={() => router.push('/')} className="p-2 -ml-2 text-primary hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1.5 font-bold text-primary font-heading tracking-tight">
          BookGuide <span className="text-accent">AI</span>
        </div>
        <button onClick={resetChat} className="text-xs font-semibold px-3 py-1.5 border border-gray-200 text-gray-500 hover:text-primary hover:bg-gray-50 rounded-full transition-colors flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden pt-4 pb-20 relative"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              {renderMessageContent(message)}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* If user just sent a message and we are waiting for model, show typing indicator locally */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
           <div className="flex w-full mb-4 px-4 gap-3 animate-in fade-in">
             <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-1 shadow-sm">
               <BookOpen className="w-4 h-4 text-indigo-brand" />
             </div>
             <div className="flex items-center gap-2">
               <span className="flex gap-1 bg-white border border-gray-100 px-3 py-2 rounded-full shadow-sm">
                 <span className="w-1.5 h-1.5 bg-indigo-brand/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <span className="w-1.5 h-1.5 bg-indigo-brand/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <span className="w-1.5 h-1.5 bg-indigo-brand/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </span>
             </div>
           </div>
        )}
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Floating Composer */}
      <div 
        className="absolute bottom-16 left-0 w-full bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA] to-transparent pt-4 pb-4 px-4 shrink-0 z-40"
      >
        <div className="w-full mx-auto flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center bg-white border border-gray-200 rounded-full p-1.5 shadow-lg w-full">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="w-full bg-transparent px-4 py-2 focus:outline-none text-[15px] text-primary placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 flex items-center justify-center bg-indigo-brand text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:bg-gray-300 transition-all flex-shrink-0"
            >
              <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
