"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ArrowRight, User, Gift, Wand2, Plus, Info, Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const INTERESTS = [
  { id: "fantasy", label: "Fantasy", icon: "⚔️" },
  { id: "scifi", label: "Science Fiction", icon: "🚀" },
  { id: "mystery", label: "Mystery", icon: "🔍" },
  { id: "romance", label: "Romance", icon: "❤️" },
  { id: "selfhelp", label: "Self Help", icon: "🧠" },
  { id: "productivity", label: "Productivity", icon: "📈" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "history", label: "History", icon: "🏛️" },
  { id: "travel", label: "Travel", icon: "🌍" },
  { id: "fiction", label: "Fiction", icon: "📖" },
  { id: "biographies", label: "Biographies", icon: "🌱" },
  { id: "others", label: "Others", icon: "•••" },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [recipient, setRecipient] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [readerType, setReaderType] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.push("/");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate loading matching books (Wireframe 6)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // Convert answers to chat prompt
    let initialMessage = `I'm looking for a book`;
    if (recipient === "myself") initialMessage += " for myself.";
    else if (recipient === "someone_else") initialMessage += " as a gift for someone else.";
    else initialMessage = "Surprise me with a great book!";
    
    if (interests.length > 0 && recipient !== "surprise") {
      initialMessage += ` I'm interested in: ${interests.join(", ")}.`;
    }
    if (readerType) {
      initialMessage += ` I'm the kind of reader who: ${readerType}.`;
    }
    if (budget && budget !== "no_preference") {
      initialMessage += ` My budget is ${budget}.`;
    }

    // Pass to chat page
    const encoded = encodeURIComponent(initialMessage);
    router.push(`/chat?q=${encoded}`);
  };

  if (isSubmitting) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex-1 bg-[#FAFAFA] flex flex-col w-full min-h-[100dvh]">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-6 h-6 text-primary" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-brand/20 rounded flex items-center justify-center">
            <span className="text-[10px]">✨</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-primary font-heading">BookGuide <span className="text-accent">AI</span></span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Progress Bar */}
      <div className="px-6 flex gap-2 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden">
            <div 
              className={cn("h-full bg-primary transition-all duration-300", step >= i ? "w-full" : "w-0")}
            />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 overflow-y-auto pb-32">
        <div className="text-center mb-8">
          <div className="inline-flex px-3 py-1 bg-amber-50 rounded-full text-accent text-xs font-semibold mb-4 border border-amber-100">
            Step {step} of 4
          </div>
          {step === 1 && (
            <>
              <h2 className="text-3xl font-heading text-primary leading-tight mb-2">
                Who are you looking <br /> for <span className="text-accent">a book</span> for?
              </h2>
              <p className="text-gray-500 text-sm">This helps us personalize your recommendations</p>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-3xl font-heading text-primary leading-tight mb-2">
                What <span className="text-accent">interests</span> you most?
              </h2>
              <p className="text-gray-500 text-sm">You can select multiple</p>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-3xl font-heading text-primary leading-tight mb-2">
                What <span className="text-accent">kind of reader</span> are you?
              </h2>
              <p className="text-gray-500 text-sm">This helps us suggest books that match your reading style.</p>
            </>
          )}
          {step === 4 && (
            <>
              <h2 className="text-3xl font-heading text-primary leading-tight mb-2">
                Any <span className="text-accent">budget</span> preference?
              </h2>
              <p className="text-gray-500 text-sm">This helps us recommend the best books within your range.</p>
            </>
          )}
        </div>

        {/* Step 1: Recipient */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <SelectionCard 
              icon={<div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-brand border border-indigo-100"><User className="w-6 h-6"/></div>}
              title="For Myself"
              desc="I want a book for me"
              selected={recipient === "myself"}
              onClick={() => { setRecipient("myself"); setTimeout(handleNext, 300); }}
            />
            <SelectionCard 
              icon={<div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-accent border border-amber-100"><Gift className="w-6 h-6"/></div>}
              title="For Someone Else"
              desc="I'm looking for a gift"
              selected={recipient === "someone_else"}
              onClick={() => { setRecipient("someone_else"); setTimeout(handleNext, 300); }}
            />
            <SelectionCard 
              icon={<div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100"><Wand2 className="w-6 h-6"/></div>}
              title="Surprise Me"
              desc="I want a surprise recommendation"
              selected={recipient === "surprise"}
              onClick={() => { setRecipient("surprise"); setTimeout(handleNext, 300); }}
            />
            <div className="mt-8 flex justify-center items-center gap-2 text-xs text-green-600">
               <ShieldCheckIcon className="w-4 h-4" />
               <p>Your preferences are private and secure.</p>
            </div>
          </div>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <div className="flex flex-col">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {INTERESTS.map((int) => (
                <button
                  key={int.id}
                  onClick={() => {
                    if (interests.includes(int.id)) setInterests(interests.filter(i => i !== int.id));
                    else setInterests([...interests, int.id]);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border bg-white transition-all",
                    interests.includes(int.id) ? "border-indigo-brand bg-indigo-50/30 ring-1 ring-indigo-brand shadow-sm" : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <div className="text-2xl mb-2">{int.icon}</div>
                  <span className="text-[11px] font-medium text-primary text-center">{int.label}</span>
                </button>
              ))}
            </div>
            <button className="w-full flex items-center gap-3 p-4 rounded-2xl border border-dashed border-gray-300 text-primary font-medium bg-white/50 justify-center">
              <Plus className="w-5 h-5 text-indigo-brand" />
              <span className="text-sm">Add a custom interest</span>
            </button>
            <div className="mt-8 flex justify-center items-center gap-2 text-xs text-accent bg-amber-50/50 p-3 rounded-xl">
               <Info className="w-4 h-4" />
               <p>The more we know, the better we can recommend.</p>
            </div>
          </div>
        )}

        {/* Step 3: Reader Type */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
             <RadioCard 
               icon="📚"
               title="I read regularly"
               desc="I read books frequently and love diving in."
               selected={readerType === "regularly"}
               onClick={() => { setReaderType("regularly"); setTimeout(handleNext, 300); }}
             />
             <RadioCard 
               icon="📖"
               title="I read sometimes"
               desc="I read when I find time or the right book."
               selected={readerType === "sometimes"}
               onClick={() => { setReaderType("sometimes"); setTimeout(handleNext, 300); }}
             />
             <RadioCard 
               icon="🌱"
               title="I rarely read"
               desc="I don't read often, but I want to get more into reading."
               selected={readerType === "rarely"}
               onClick={() => { setReaderType("rarely"); setTimeout(handleNext, 300); }}
             />
             <RadioCard 
               icon="⭐"
               title="This will be my first book"
               desc="I'm new to reading and looking for a great place to start."
               selected={readerType === "first"}
               onClick={() => { setReaderType("first"); setTimeout(handleNext, 300); }}
             />
             <div className="mt-6 bg-amber-50/30 border border-amber-100/50 p-4 rounded-2xl flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100/50 flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary mb-1">Why we ask this?</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">We recommend books that match your reading comfort level and help you enjoy every page.</p>
                </div>
             </div>
          </div>
        )}

        {/* Step 4: Budget */}
        {step === 4 && (
          <div className="flex flex-col gap-3">
             <RadioCard 
               icon="🪙"
               title="Under ₹300"
               desc="Great books under ₹300"
               selected={budget === "under_300"}
               onClick={() => { setBudget("under_300"); setTimeout(handleNext, 300); }}
             />
             <RadioCard 
               icon="💰"
               title="Under ₹500"
               desc="Great books under ₹500"
               selected={budget === "under_500"}
               onClick={() => { setBudget("under_500"); setTimeout(handleNext, 300); }}
             />
             <RadioCard 
               icon="💳"
               title="Under ₹1000"
               desc="Great books under ₹1000"
               selected={budget === "under_1000"}
               onClick={() => { setBudget("under_1000"); setTimeout(handleNext, 300); }}
             />
             <RadioCard 
               icon="♾️"
               title="No Preference"
               desc="Show me the best options"
               selected={budget === "no_preference"}
               onClick={() => { setBudget("no_preference"); setTimeout(handleNext, 300); }}
             />
             
             <button onClick={handleSubmit} className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium py-2">
               Skip for now <ArrowRight className="w-3 h-3" />
             </button>

             <div className="mt-2 bg-amber-50/30 border border-amber-100/50 p-4 rounded-2xl flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100/50 flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary mb-1">Why we ask this?</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">We'll recommend books that give you the best value and fit your budget.</p>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Bottom Fixed Action (Only if step doesn't auto-advance on all options) */}
      {(step === 2 || step === 4) && (
        <div className="fixed bottom-0 left-0 w-full max-w-md bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA] to-transparent pt-10 pb-8 px-6 z-10 sm:left-auto">
          <button 
            onClick={handleNext}
            className="w-full bg-primary text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold text-base shadow-xl shadow-primary/20 hover:bg-primary/95 transition-all"
          >
            {step === 4 ? "Let's Find My Book" : "Continue"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function SelectionCard({ icon, title, desc, selected, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl bg-white border transition-all text-left",
        selected ? "border-indigo-brand ring-1 ring-indigo-brand shadow-sm bg-indigo-50/10" : "border-gray-100 hover:border-gray-200"
      )}
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1">
        <h3 className="font-bold text-primary">{title}</h3>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <ChevronLeft className="w-5 h-5 text-gray-300 rotate-180" />
    </button>
  );
}

function RadioCard({ icon, title, desc, selected, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl bg-white border transition-all text-left",
        selected ? "border-indigo-brand ring-1 ring-indigo-brand shadow-sm bg-indigo-50/10" : "border-gray-100 hover:border-gray-200"
      )}
    >
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-2xl border border-gray-100 shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-primary">{title}</h3>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <div className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
        selected ? "border-indigo-brand" : "border-gray-300"
      )}>
        {selected && <div className="w-2.5 h-2.5 bg-indigo-brand rounded-full" />}
      </div>
    </button>
  );
}

function ShieldCheckIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LoadingScreen() {
  return (
    <div className="flex-1 bg-[#FAFAFA] flex flex-col items-center justify-center w-full min-h-[100dvh] px-6 text-center animate-in fade-in duration-500">
      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100">
        <Loader2 className="w-6 h-6 text-indigo-brand animate-spin" />
      </div>
      
      <h2 className="text-2xl font-bold text-primary mb-2">
        📚 Finding the perfect book for you...
      </h2>
      <p className="text-sm text-gray-500 mb-12">
        Searching our collection and matching your interests.
      </p>

      {/* Smooth Loading Bar Track */}
      <div className="w-full max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden relative mb-12">
        <div className="absolute top-0 left-0 h-full w-[40%] bg-gradient-to-r from-violet-500 via-indigo-brand to-violet-500 rounded-full animate-[shimmer-slide_1.5s_infinite_ease-in-out]" />
      </div>

      {/* Skeleton / Shimmer Content */}
      <div className="w-full max-w-sm flex flex-col gap-4 px-4 relative overflow-hidden">
        {/* Shimmer gradient overlay */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite] z-10" />
        
        {/* Skeleton items */}
        <div className="w-full h-24 bg-gray-100 rounded-2xl flex items-center p-4 gap-4">
           <div className="w-16 h-20 bg-gray-200 rounded-md shrink-0" />
           <div className="flex flex-col gap-2 flex-1">
              <div className="w-3/4 h-4 bg-gray-200 rounded" />
              <div className="w-1/2 h-3 bg-gray-200 rounded" />
              <div className="w-full h-2 bg-gray-200 rounded mt-2" />
              <div className="w-5/6 h-2 bg-gray-200 rounded" />
           </div>
        </div>
        <div className="w-full h-24 bg-gray-100 rounded-2xl flex items-center p-4 gap-4 opacity-70">
           <div className="w-16 h-20 bg-gray-200 rounded-md shrink-0" />
           <div className="flex flex-col gap-2 flex-1">
              <div className="w-2/3 h-4 bg-gray-200 rounded" />
              <div className="w-1/3 h-3 bg-gray-200 rounded" />
              <div className="w-full h-2 bg-gray-200 rounded mt-2" />
           </div>
        </div>
      </div>
    </div>
  );
}
