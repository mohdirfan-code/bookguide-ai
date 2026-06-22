"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Book } from "@/lib/catalog";

type StructuredResponse = {
  message: string;
  recommendations: { title: string; reason: string; reasonType?: string; confidence?: number }[];
  followUpQuestion: string | null;
};

type Message = {
  id: string;
  role: "user" | "model";
  content: string | StructuredResponse;
};

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  profile: Record<string, any>;
  setProfile: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  catalog: Book[];
  setCatalog: React.Dispatch<React.SetStateAction<Book[]>>;
  resetChat: () => void;
}

const defaultWelcomeMessage: Message = {
  id: "welcome",
  role: "model",
  content: {
    message: "Hi! I'm BookGuide AI. I can help you find your next great read.\n\nWhat are you in the mood for today?",
    recommendations: [],
    followUpQuestion: null
  }
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([defaultWelcomeMessage]);
  const [profile, setProfile] = useState<Record<string, any>>({
    clarificationCount: 0,
    lastQuestionAsked: null
  });
  const [catalog, setCatalog] = useState<Book[]>([]);

  const resetChat = () => {
    setMessages([defaultWelcomeMessage]);
    setProfile({
      clarificationCount: 0,
      lastQuestionAsked: null
    });
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        profile,
        setProfile,
        catalog,
        setCatalog,
        resetChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
