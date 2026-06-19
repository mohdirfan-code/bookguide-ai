import Link from "next/link";
import { BookOpen, Sparkles, Gift, Map, Compass } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="py-6 px-6 sm:px-12 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl shadow-sm">
            <BookOpen className="text-primary-foreground w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-primary">BookGuide<span className="text-accent">AI</span></span>
        </div>
        <nav className="hidden sm:flex gap-6 font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="/chat" className="hover:text-primary transition-colors">Try Assistant</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 text-primary font-semibold text-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Sparkles size={16} />
          <span>Your intelligent bookstore companion</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-primary mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
          Find Your Next <br className="hidden sm:block" />
          <span className="text-accent">Great Read</span> in Seconds
        </h1>
        
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          AI-powered book recommendations tailored perfectly to your interests. 
          Discover hidden gems, find the perfect gift, and navigate the store effortlessly.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <Link 
            href="/chat" 
            className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
          >
            <Compass className="group-hover:rotate-12 transition-transform" />
            Find My Next Book
          </Link>
          <Link 
            href="/chat?mode=gift" 
            className="flex-1 sm:flex-none bg-card text-primary border-2 border-primary/20 hover:border-primary/50 hover:bg-muted/50 px-8 py-4 rounded-xl font-bold text-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group"
          >
            <Gift className="group-hover:-rotate-12 transition-transform" />
            Find a Gift
          </Link>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-card py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-primary mb-16">Why use BookGuide AI?</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8 text-accent" />}
              title="Personalized Recommendations"
              description="Tell us what you like, and our AI will instantly match you with books from our curated catalog."
            />
            <FeatureCard 
              icon={<Gift className="w-8 h-8 text-accent" />}
              title="Gift Finder"
              description="Answer a few questions about the recipient, and we'll suggest the perfect book for any occasion."
            />
            <FeatureCard 
              icon={<BookOpen className="w-8 h-8 text-accent" />}
              title="Similar Book Discovery"
              description="Loved a specific book? We'll show you exactly what our other readers also enjoyed."
            />
            <FeatureCard 
              icon={<Map className="w-8 h-8 text-accent" />}
              title="Store Navigation"
              description="Never get lost again. We'll show you the exact section and rack for every recommendation."
            />
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground bg-background border-t border-border text-sm">
        <p>© 2026 BookGuide AI. All rights reserved.</p>
        <p className="mt-1 opacity-70">Built for modern physical bookstores.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-background border border-border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-card w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-border/50">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-primary mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
