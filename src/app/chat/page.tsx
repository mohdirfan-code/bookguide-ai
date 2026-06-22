import { ChatInterface } from "@/components/ChatInterface";
import { Suspense } from "react";

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-[#FAFAFA] w-full min-h-[100dvh]" />}>
      <ChatInterface />
    </Suspense>
  );
}
