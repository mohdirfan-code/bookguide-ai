import Link from "next/link";
import Image from "next/image";
import { BookOpen, Sparkles, BrainCircuit, MapPin, Zap, ArrowRight, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-[#FAFAFA] flex flex-col items-center w-full relative">
      {/* Top Header */}
      <div className="w-full pt-12 pb-4 flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-7 h-7 text-indigo-brand fill-indigo-brand/20" />
          <h1 className="text-2xl font-bold text-primary font-heading tracking-tight">
            BookGuide <span className="text-accent">AI</span>
          </h1>
        </div>
        <p className="text-[13px] text-gray-500 font-medium">Your AI-Powered Book Assistant</p>
      </div>

      {/* Hero Text */}
      <div className="text-center px-6 mt-4 z-10">
        <h2 className="text-[2.75rem] font-heading text-primary leading-[1.1] mb-5 tracking-tight">
          Find your <br /> next <span className="text-accent">great book</span>
        </h2>
        <p className="text-gray-600 text-base font-medium">
          Personalized recommendations <br /> in under <span className="text-accent font-bold">30 seconds</span>.
        </p>
      </div>

      {/* Hero Image & Floating Chips */}
      <div className="relative w-full max-w-[340px] mt-10 mb-8 flex-1 min-h-[300px]">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Subtle glow behind image */}
          <div className="absolute w-[250px] h-[250px] bg-accent/20 rounded-full blur-[60px]" />
          
          <div className="relative w-[280px] h-[320px] rounded-2xl overflow-hidden shadow-2xl border border-white/40">
            <Image 
              src="/images/hero_books.png" 
              alt="Stack of curated books" 
              fill 
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Floating Chips */}
        <div className="absolute top-[10%] left-[-5%] bg-white px-3 py-2 rounded-2xl shadow-md border border-gray-100 flex items-center gap-2 text-[11px] font-semibold text-primary animate-in fade-in zoom-in duration-700 delay-100 rounded-bl-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-brand" />
          New <br/> Perspectives
        </div>

        <div className="absolute top-[0%] right-[15%] bg-white px-3 py-2 rounded-2xl shadow-md border border-gray-100 flex items-center gap-2 text-[11px] font-semibold text-primary animate-in fade-in zoom-in duration-700 delay-200 rounded-bl-sm">
          <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          </div>
          Great <br/> Stories
        </div>

        <div className="absolute bottom-[35%] right-[-5%] bg-white px-3 py-2 rounded-2xl shadow-md border border-gray-100 flex items-center gap-2 text-[11px] font-semibold text-primary animate-in fade-in zoom-in duration-700 delay-300 rounded-bl-sm">
          <MapPin className="w-3.5 h-3.5 text-accent" />
          Helpful <br/> Insights
        </div>

        <div className="absolute bottom-[10%] right-[5%] bg-white px-3 py-2 rounded-2xl shadow-md border border-gray-100 flex items-center gap-2 text-[11px] font-semibold text-primary animate-in fade-in zoom-in duration-700 delay-400 rounded-bl-sm">
          <div className="w-4 h-4 bg-accent rounded-sm flex items-center justify-center">
             <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
          Perfect <br/> For You
        </div>
      </div>

      {/* Bottom Features Sheet */}
      <div className="w-full bg-white rounded-t-[2.5rem] shadow-[0_-8px_30px_rgba(0,0,0,0.04)] px-6 pt-10 pb-8 flex flex-col items-center z-20 relative border-t border-gray-50 mt-auto">
        
        <div className="grid grid-cols-3 gap-2 w-full mb-8">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 shadow-sm border border-gray-100">
              <BrainCircuit className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-primary text-xs mb-1.5">AI-Powered</h3>
            <p className="text-[10px] text-gray-500 leading-tight px-1">Smart recommendations just for you</p>
          </div>
          
          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 shadow-sm border border-gray-100">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-primary text-xs mb-1.5">In-Store Guidance</h3>
            <p className="text-[10px] text-gray-500 leading-tight px-1">Find the exact shelf location</p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 shadow-sm border border-gray-100">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-primary text-xs mb-1.5">Quick & Easy</h3>
            <p className="text-[10px] text-gray-500 leading-tight px-1">Discover your next read in seconds</p>
          </div>
        </div>

        {/* CTA */}
        <Link 
          href="/wizard" 
          className="w-full bg-primary text-white rounded-2xl py-[1.125rem] flex items-center justify-center gap-3 font-semibold text-base shadow-xl shadow-primary/20 hover:bg-primary/95 transition-all"
        >
          <Sparkles className="w-5 h-5 text-accent" />
          Start Discovering
          <ArrowRight className="w-5 h-5 ml-1" />
        </Link>

        {/* Privacy Note */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
          <p><span className="font-semibold text-gray-700">No sign-up required.</span> Your privacy is our priority.</p>
        </div>

      </div>
    </main>
  );
}
