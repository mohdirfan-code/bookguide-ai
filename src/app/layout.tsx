import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import { ChatProvider } from "@/lib/ChatContext";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BookGuide AI",
  description: "Your AI-Powered Book Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-[#FAFAFA]`}>
        <ChatProvider>
          <div className="flex flex-col mx-auto w-full max-w-md bg-white min-h-[100dvh] relative overflow-hidden shadow-2xl">
            {children}
            <BottomNav />
          </div>
        </ChatProvider>
      </body>
    </html>
  );
}
