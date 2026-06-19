import { ChatInterface } from "@/components/ChatInterface";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border py-4 px-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-primary p-2 rounded-lg">
              <BookOpen className="text-primary-foreground w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-primary">BookGuide<span className="text-accent">AI</span></span>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        <ChatInterface />
      </main>
    </div>
  );
}
