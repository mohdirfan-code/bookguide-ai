import { getCompressedCatalogContext, Book } from '@/lib/catalog';
import catalogData from '@/data/catalog.json';
import { getLLMProvider } from '@/lib/llm';

// Confidence calculation function
function calculateConfidence(book: Book, profile: Record<string, any>): number {
  let score = 50; // Base score
  
  // V6: Relaxed matching for core categories
  if (profile.favoriteGenres && Array.isArray(profile.favoriteGenres)) {
    if (profile.favoriteGenres.some(g => g.toLowerCase() === book.genre.toLowerCase())) score += 30; // Boost genre match
  }

  // Budget Match
  if (profile.budget && book.price <= profile.budget) score += 20;

  // Interests Match
  if (profile.interests && Array.isArray(profile.interests)) {
    if (profile.interests.some(i => book.description.toLowerCase().includes(i.toLowerCase()) || book.title.toLowerCase().includes(i.toLowerCase()))) {
      score += 20;
    }
  }

  // V5/V6: Reader Intent & Thematic Tags
  if (profile.readerIntent && Array.isArray(profile.readerIntent)) {
    const intents = profile.readerIntent.map((i: string) => i.toLowerCase());
    
    // Check tags
    if (book.tags && book.tags.some(tag => intents.includes(tag.toLowerCase()))) {
      score += 20;
    }
    
    // Reluctant Reader Check
    if (intents.includes('reluctant_reader') || intents.includes('easy_read') || intents.includes('beginner')) {
      if (book.readingDifficulty === 'beginner') score += 20;
      if (book.readingDifficulty === 'advanced') score -= 30; // Penalize heavy books
      if (book.tags && book.tags.includes('fast_paced')) score += 15;
    }

    // Surprise Me / Quick start logic: if user just wants a recommendation
    if (intents.includes('surprise_me') || intents.includes('quick_recommendation') || intents.includes('fun')) {
      score += 25;
    }

    // Atomic Habits fan -> Productivity, Habits, etc
    if (intents.includes('atomic_habits_fan') || intents.includes('productivity')) {
      if (['Productivity', 'Self-help', 'Personal Growth'].some(g => book.genre.toLowerCase().includes(g.toLowerCase()))) score += 30;
      if (book.tags && book.tags.includes('habits')) score += 30;
    }

    // Fantasy detection
    if (intents.includes('fantasy_reader')) {
      if (book.genre.toLowerCase() === 'fantasy') score += 30;
    }
  }

  // V5: Reading Difficulty Exact Match
  if (profile.readingLevel && book.readingDifficulty) {
     if (profile.readingLevel.toLowerCase() === book.readingDifficulty.toLowerCase()) score += 10;
  }

  // V5: Age Match
  const age = profile.giftRecipientAge || profile.age;
  if (age) {
    if (age <= 12 && book.targetAudience === 'children') score += 25;
    else if (age > 12 && age <= 18 && book.targetAudience === 'young_adult') score += 25;
    else if (age > 18 && book.targetAudience === 'adult') score += 20;
    
    // Penalize wildly incorrect ages
    if (age > 15 && book.targetAudience === 'children') score -= 50;
    if (age < 13 && book.targetAudience === 'adult') score -= 40;
  }

  // Gift context match
  if (profile.giftMode) score += 5;

  return Math.max(0, Math.min(score, 100));
}

export async function POST(req: Request) {
  const tStart = Date.now();
  try {
    const { messages, profile = {} } = await req.json();

    const tCatalogStart = Date.now();
    const catalogContext = getCompressedCatalogContext();
    const tCatalog = Date.now() - tCatalogStart;

    const systemInstruction = `
      You are BookGuide AI, an expert bookstore assistant.
      STORE-KIOSK MODE: You are helping customers inside a physical bookstore. Customers expect fast recommendations. If you can infer intent from partial information, recommend a book immediately rather than asking questions. Prefer showing a recommendation over requesting additional information.
      TARGET BEHAVIOR: 70% Recommendation, 30% Questioning.
      
      CRITICAL GUARDRAILS:
      1. CATALOG LOCK: ONLY recommend books explicitly provided in the "Available Books Catalog" below. NEVER invent or hallucinate books. If a requested book is not in the catalog, say "We don't currently carry that title, but here are similar books available in our store:" and recommend catalog books only.
      2. BUDGET ENFORCEMENT: Budget is a HARD constraint. Never recommend a book over the budget unless the user explicitly says "ignore my budget".
      3. DUPLICATE & DIVERSITY: Do not recommend the same book twice. If user asks to "recommend something else", avoid the recentGenres and recentAuthors. Provide diverse recommendations.
      4. MENTAL HEALTH BOUNDARY: You are not a therapist. Allowed: "I'm sorry you're going through a difficult time. You may find [Book] helpful because...". NOT ALLOWED: "Have you considered therapy?", counseling, or professional help suggestions.
      5. AGE SAFETY: Never recommend adult content to children or young teens.
      6. RESPONSE LENGTH: Introduction: 1-2 short sentences. Recommendation reason: 1-2 sentences. Follow-up: 1 sentence. Avoid essay-length responses.
      7. OFF-TOPIC REQUESTS: If user asks about hacking, weapons, politics, or unrelated topics, respond: "I'm here to help you discover books available in this store." and redirect to books.

      PROFILE MANAGEMENT:
      Maintain the session profile. Extract budget, favoriteGenres, likedBooks, readerIntent, giftRecipientAge, interests, recentGenres, recentAuthors.
    `;

    const schemaInstruction = `
      OUTPUT FORMAT:
      You MUST return a single, valid JSON object exactly matching the requested schema. DO NOT wrap it in Markdown (no \`\`\`json). Return RAW JSON ONLY.

      JSON Schema:
      {
        "profileUpdate": {
          "readerIntent": ["array", "of", "intent", "strings"],
          "recentGenres": ["array", "of", "recent", "genres"],
          "recentAuthors": ["array", "of", "recent", "authors"],
          "description": "Any new or updated profile info."
        },
        "message": "Your conversational response to the user.",
        "recommendations": [
          {
            "title": "Exact catalog title",
            "reason": "Highly personalized reason matching their intent and context",
            "reasonType": "One of: intent_match, budget_match, genre_match, gift_recommendation, beginner_friendly, popular_choice, other"
          }
        ],
        "followUpQuestion": "A question to ask if you need more info (e.g. gift age). null if not needed."
      }
    `;

    const llmProvider = getLLMProvider();

    const generateWithRetry = async (retries = 1): Promise<any> => {
      try {
        return await llmProvider.generateResponse(
          messages,
          profile,
          systemInstruction,
          catalogContext,
          schemaInstruction
        );
      } catch (err) {
        if (retries > 0) {
          console.warn(`[API] JSON parsing/generation failed, retrying... (${retries} retries left)`);
          return generateWithRetry(retries - 1);
        }
        throw err;
      }
    };

    let data;
    try {
      data = await generateWithRetry(1);
    } catch (err) {
      console.error("Failed to generate valid JSON after retries", err);
      // Fallback message
      data = {
        message: "I'm having trouble processing that request. Could you try rephrasing it?",
        recommendations: [],
        followUpQuestion: null,
        profileUpdate: {}
      };
    }

    const perf = data._perf || { llm: 0, parse: 0 };
    delete data._perf;
    const tTotal = Date.now() - tStart;
    
    console.log(`\n[Performance]\nCatalog: ${tCatalog} ms\nLLM: ${perf.llm} ms\nParse: ${perf.parse} ms\nTotal: ${tTotal} ms\n`);

    // Backend Processing
    
    // 1. Calculate Confidence Scores & Apply Hard Filters
    let validRecommendations: any[] = [];
    const allBooks = catalogData as Book[];
    const safeBooks = allBooks.filter(b => b.targetAudience !== 'adult');

    if (data.recommendations && data.recommendations.length > 0) {
      validRecommendations = data.recommendations.map((rec: any) => {
        const book = allBooks.find(b => b.title.toLowerCase() === rec.title.toLowerCase());
        
        // Guardrail 1: Catalog Lock
        if (!book) return null; 
        
        // Guardrail 5: Budget Enforcement
        if (profile.budget && book.price > profile.budget) return null; 
        
        // Guardrail 6: Duplicate Prevention
        if (profile.alreadyRecommended?.includes(book.title)) return null; 
        
        // Guardrail 8: Age Safety
        const age = profile.giftRecipientAge || profile.age;
        if (age && age < 16 && book.targetAudience === 'adult') return null; 
        
        return { ...rec, confidence: calculateConfidence(book, { ...profile, ...(data.profileUpdate || {}) }), bookObj: book };
      }).filter(Boolean);
    }

    const hasCoreInfo = profile.favoriteGenres || profile.likedBooks || profile.budget || profile.readerIntent || profile.interests || profile.giftRecipientAge;
    const clarificationCount = profile.clarificationCount || 0;
    const lastQuestion = profile.lastQuestionAsked || null;

    let maxConfidence = validRecommendations.length > 0 
      ? Math.max(...validRecommendations.map((r: any) => r.confidence)) 
      : 0;

    // Intent Confidence Thresholds
    if (maxConfidence > 45) {
      // > 0.45: Recommend immediately. Force no follow-up.
      data.followUpQuestion = null;
    } else if (maxConfidence >= 25 && maxConfidence <= 45) {
      // 0.25 - 0.45: Recommend + ONE optional follow-up. (Leave followUpQuestion alone)
    } else if (maxConfidence < 25) {
      // < 0.25: Ask ONE clarification.
      validRecommendations = [];
      if (!data.followUpQuestion) {
        data.followUpQuestion = "What kinds of books or genres usually interest you?";
      }
    }

    // Safe Recommendation Fallback (Guardrails 1 & 10)
    // If we filtered everything out, OR if we MUST recommend due to loop protection:
    const mustRecommend = clarificationCount >= 1 && hasCoreInfo;
    
    if (validRecommendations.length === 0 && (data.recommendations?.length > 0 || mustRecommend)) {
        let fallbackPool = safeBooks;
        if (profile.budget) fallbackPool = fallbackPool.filter(b => b.price <= profile.budget);
        if (profile.favoriteGenres?.length > 0) {
          const genrePool = fallbackPool.filter(b => profile.favoriteGenres.some((g:string) => g.toLowerCase() === b.genre.toLowerCase()));
          if (genrePool.length > 0) fallbackPool = genrePool;
        }
        if (profile.alreadyRecommended) {
          fallbackPool = fallbackPool.filter(b => !profile.alreadyRecommended.includes(b.title));
        }
        
        if (fallbackPool.length > 0) {
          validRecommendations = [{
            title: fallbackPool[0].title,
            reason: "Based on what you've told me, I'd start with this excellent choice from our collection.",
            reasonType: "safe_fallback",
            confidence: 50,
            bookObj: fallbackPool[0]
          }];
          maxConfidence = 50;
          if (mustRecommend) data.followUpQuestion = null;
        }
    }

    // Loop Detection (Guardrail 2 & 3)
    if (data.followUpQuestion && data.followUpQuestion === lastQuestion) {
      data.followUpQuestion = null; // Never repeat
    }
    
    // Do NOT hard-stop unless user provided useful info
    if (clarificationCount >= 1 && hasCoreInfo) {
      data.followUpQuestion = null; 
    }

    // Ensure we don't return an empty array if we killed the followUp
    if (validRecommendations.length === 0 && !data.followUpQuestion) {
       data.followUpQuestion = "How can I help you find your next book?";
    }

    data.recommendations = validRecommendations.map(r => ({ 
      title: r.title, 
      reason: r.reason, 
      reasonType: r.reasonType, 
      confidence: r.confidence 
    }));

    // Update profile tracking
    if (validRecommendations.length > 0) {
      const newTitles = validRecommendations.map((r: any) => r.title);
      const newGenres = validRecommendations.map((r: any) => r.bookObj.genre);
      const newAuthors = validRecommendations.map((r: any) => r.bookObj.author);
      
      if (!data.profileUpdate) data.profileUpdate = {};
      
      data.profileUpdate.alreadyRecommended = Array.from(new Set([...(profile.alreadyRecommended || []), ...newTitles]));
      data.profileUpdate.recentGenres = Array.from(new Set([...(profile.recentGenres || []), ...newGenres]));
      data.profileUpdate.recentAuthors = Array.from(new Set([...(profile.recentAuthors || []), ...newAuthors]));
    }

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), { status: 500 });
  }
}
