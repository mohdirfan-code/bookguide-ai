'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [loadingText, setLoadingText] = useState('Thinking...');
  const [catalog, setCatalog] = useState<Book[]>([]);
  const [profile, setProfile] = useState<Record<string, any>>({});
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
  }, [messages, isLoading, loadingText]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setLoadingText('Thinking...');
      timer = setTimeout(() => {
        setLoadingText('Still thinking about the perfect book...');
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

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
      if (data.profileUpdate) {
        setProfile(prev => {
          const newProfile = { ...prev };
          for (const key in data.profileUpdate) {
            if (Array.isArray(data.profileUpdate[key])) {
              const prevArray = Array.isArray(prev[key]) ? prev[key] : [];
              newProfile[key] = Array.from(new Set([...prevArray, ...data.profileUpdate[key]]));
            } else {
              newProfile[key] = data.profileUpdate[key];
            }
          }
          return newProfile;
        });
      }

      let recommendations = data.recommendations || [];
      let messageText = data.message || "";

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
              <div className="flex flex-wrap gap-2 mt-2 pt-3 border-t border-border/50">
                <button
                  onClick={() => submitQuery("Can you recommend books similar to this?")}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
                >
                  <Search size={14} /> Similar
                </button>
                <button
                  onClick={() => submitQuery("None of these quite fit. Can you recommend something else?")}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-full transition-colors"
                >
                  <RefreshCw size={14} /> More
                </button>
                <button
                  onClick={() => inputRef.current?.focus()}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-full transition-colors"
                >
                  <ChevronRight size={14} /> Ask
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
    <div className="flex flex-col h-[100dvh] sm:h-[calc(100dvh-88px)] w-full max-w-4xl mx-auto bg-card sm:rounded-xl shadow-sm sm:border border-border overflow-hidden">
      
      {/* Session Header / Reset */}
      {messages.length > 0 && (
        <div className="flex justify-between items-center px-4 py-2 bg-muted/30 border-b border-border text-sm backdrop-blur-sm sticky top-0 z-20">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary" /> BookGuide AI
          </span>
          <button 
            onClick={resetSession}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            <RefreshCw size={12} /> New Chat
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4 py-4 sm:py-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 tracking-tight">📚 What are you looking for today?</h2>
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => submitQuery(prompt)}
                  className="bg-card hover:bg-accent/10 border border-border/60 hover:border-primary/30 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full transition-all text-foreground shadow-sm hover:shadow-md active:scale-95 flex items-center"
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
                  className={"p-4 sm:p-6 rounded-2xl shadow-sm " + (
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none max-w-[90%] sm:max-w-[80%]'
                      : 'bg-muted/30 text-foreground rounded-bl-none border border-border/50 w-full sm:w-[90%] md:w-[85%]'
                  )}
                >
                  {renderMessageContent(message)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full">
            <div className="bg-muted/30 border border-border/50 p-6 rounded-2xl rounded-bl-none flex flex-col gap-4 w-full sm:w-[90%] md:w-[85%]">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-muted-foreground">{loadingText}</span>
              </div>
              <RecommendationCardSkeleton />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 sm:p-5 bg-background/80 backdrop-blur-md border-t border-border z-10">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end relative max-w-4xl mx-auto w-full">
          <div className="relative flex-grow shadow-sm rounded-xl">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask for recommendations..."
              className="w-full bg-card border border-border/80 rounded-xl px-5 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-base sm:text-lg transition-all"
              rows={1}
              style={{ minHeight: '60px', maxHeight: '160px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
