'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { Book } from '@/lib/catalog';
import { RecommendationCard, RecommendationCardSkeleton } from './RecommendationCard';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [catalog, setCatalog] = useState<Book[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<Record<string, any>>({
    clarificationCount: 0,
    lastQuestionAsked: null
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.json())
      .then(data => setCatalog(data))
      .catch(err => console.error("Failed to load catalog", err));
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 3);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const loadingMessages = [
    "Thinking about the perfect book...",
    "Finding the best match...",
    "Looking through the store catalog..."
  ];

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Show button if we are scrolled up more than 100px from the bottom
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  const resetSession = () => {
    setMessages([]);
    setProfile({});
    setInput('');
  };

  const submitQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: queryText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create chat history for Gemini. It needs string contents.
      const chatHistoryForApi = messages.map(m => ({
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
      
      // Safely merge profile updates (arrays like alreadyRecommended should be merged, not overwritten)
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


      // Allow the backend Conversation-First logic to shine.
      // If the backend returned 0 recommendations but provided a question, render exactly that.
      // If it failed completely (no recommendations, no question), only then do a generic fallback.
      if (recommendations.length === 0 && !data.followUpQuestion) {
        messageText = "I couldn't find a perfect match for that exact request, but here are a few popular books available in the store that you might enjoy.";
        // Fallback to top 1 popular book for compact UI
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

  const renderMessageContent = (message: Message) => {
    if (message.role === 'user') {
      return <p className="whitespace-pre-wrap">{message.content as string}</p>;
    }

    const data = message.content as StructuredResponse;
    
    return (
      <div className="flex flex-col gap-4 w-full">
        <p className="whitespace-pre-wrap leading-relaxed">{data.message}</p>
        
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="w-full flex flex-col gap-4 mt-2">
            {[...data.recommendations].sort((a, b) => (b.confidence || 0) - (a.confidence || 0)).map((rec, idx) => {
              const book = catalog.find(b => b.title.toLowerCase() === rec.title.toLowerCase());
              if (!book) return <span key={idx} className="text-red-500 text-sm font-bold">[Book Not Found in Catalog: {rec.title}]</span>;
              return <RecommendationCard key={idx} book={book} whyRecommended={rec.reason} reasonType={rec.reasonType} />;
            })}
            
            {/* Action Buttons - V2 Compact Chips */}
            {message === messages[messages.length - 1] && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                <button
                  onClick={() => submitQuery("Can you recommend books similar to this?")}
                  className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold bg-background/50 border border-border text-foreground hover:bg-muted px-3 py-1.5 rounded-full transition-colors"
                >
                  <Search size={14} /> Similar
                </button>
                <button
                  onClick={() => submitQuery("None of these quite fit. Can you recommend something else?")}
                  className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold bg-background/50 border border-border text-foreground hover:bg-muted px-3 py-1.5 rounded-full transition-colors"
                >
                  <RefreshCw size={14} /> More
                </button>
                <button
                  onClick={() => submitQuery("Do you have any good gift ideas?")}
                  className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold bg-background/50 border border-border text-foreground hover:bg-muted px-3 py-1.5 rounded-full transition-colors"
                >
                  🎁 Gift Ideas
                </button>
                <button
                  onClick={() => inputRef.current?.focus()}
                  className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold bg-background/50 border border-border text-foreground hover:bg-muted px-3 py-1.5 rounded-full transition-colors"
                >
                  ❓ Ask
                </button>
              </div>
            )}
          </div>
        )}

        {data.followUpQuestion && (
          <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-xl mt-2 font-semibold">
            {data.followUpQuestion}
          </div>
        )}
      </div>
    );
  };

  const suggestedPrompts = [
    "🎁 Gift for Someone",
    "🚀 Improve Productivity",
    "🌱 Easy Beginner Books",
    "🐉 Fantasy Books",
    "💰 Books Under ₹500",
    "✨ Surprise Me"
  ];

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] w-full bg-background relative overflow-hidden">
      
      {/* Minimalist Header */}
      <div 
        className="flex justify-between items-center px-4 h-14 sm:h-12 bg-background/95 backdrop-blur-sm sticky top-0 z-20 border-b border-transparent shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <Link href="/" className="font-bold text-foreground flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity">
          📚 BookGuide
        </Link>
        {messages.length > 0 && (
          <button 
            onClick={resetSession}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            <RefreshCw size={12} /> New Chat
          </button>
        )}
      </div>

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 pt-2 pb-32 space-y-6 relative"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto px-2 mt-[-48px]">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-6 tracking-tight">📚 What are you looking for today?</h2>
            
            <div className="grid grid-cols-2 gap-2 w-full">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => submitQuery(prompt.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF] |✨ |💰 |🐉 |🌱 |🚀 |🎁 /g, ''))}
                  className="bg-muted/30 hover:bg-muted text-[13px] font-medium px-3 py-3 rounded-xl transition-all text-foreground flex items-center justify-center text-center border border-border shadow-sm hover:shadow-md"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={"flex " + (message.role === 'user' ? 'justify-end' : 'justify-start w-full')}
              >
                <div
                  className={
                    message.role === 'user'
                      ? 'p-3.5 bg-muted/50 text-foreground rounded-2xl rounded-br-sm max-w-[85%] text-[15px] leading-relaxed'
                      : 'w-full text-foreground text-[15px] leading-relaxed max-w-3xl mx-auto'
                  }
                >
                  {renderMessageContent(message)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full">
            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center gap-2 px-1">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-[13px] font-medium text-muted-foreground ml-2">{loadingMessages[loadingStep]}</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-[90px] right-1/2 translate-x-1/2 bg-background border border-border/50 shadow-md text-foreground text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 z-30"
          >
            ⬇ New Messages
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Composer Container in Normal Flow */}
      <div 
        className="w-full bg-background pt-2 pb-4 px-4 shrink-0 z-40"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="w-full max-w-2xl mx-auto flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="flex gap-2 items-end bg-muted/40 border border-border/60 rounded-3xl p-1.5 shadow-sm focus-within:ring-1 focus-within:ring-border/80 transition-all w-full">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask about books..."
              className="w-full bg-transparent px-4 py-2.5 focus:outline-none resize-none text-[15px] max-h-[120px] scrollbar-thin"
              rows={1}
              style={{ height: '44px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 mb-0.5 mr-0.5 bg-primary text-primary-foreground rounded-full hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-sm"
            >
              <Send size={18} className="translate-x-[1px] translate-y-[1px] w-[18px] h-[18px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
