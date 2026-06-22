"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Flame, MessageCircle, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Chats", href: "/chat", icon: MessageCircle },
  { name: "Popular", href: "/popular", icon: Flame },
  { name: "Saved", href: "/saved", icon: Bookmark },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on landing and onboarding wizard
  if (pathname === "/" || pathname?.startsWith("/wizard")) {
    return null;
  }

  return (
    <nav className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-[100]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href) && (item.href !== "/" || pathname === "/");
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-indigo-brand" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <item.icon
                className={cn("w-6 h-6", isActive && "fill-indigo-brand/10")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{item.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
