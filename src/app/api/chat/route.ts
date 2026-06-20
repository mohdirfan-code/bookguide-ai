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
      TARGET BEHAVIOR: 70% Recommendation, 30% Questioning. You MUST recommend books as soon as you have basic info (genre, budget, or general interest).
      
      CRITICAL RULES:
      1. EXACTLY ONE RECOMMENDATION: You must return exactly ONE top recommendation. Do NOT return multiple books.
      2. RECOMMENDATION FIRST: If you have ANY of the following: favoriteGenres, likedBooks, budget, readerIntent, giftRecipientAge, or interests -> YOU MUST RECOMMEND A BOOK. Do not ask a question without recommending a book first.
      3. AMBIGUOUS REQUESTS ONLY: Only ask a clarification question if the request is TRULY ambiguous (e.g., "Recommend a gift", "Recommend a book"). Ask exactly ONE question.
      4. LOW CONFIDENCE HANDLING: If you are unsure, recommend ONE safe, highly-rated book, AND you may optionally ask ONE follow-up question. The recommendation MUST come first.
      5. SURPRISE ME: If the user says "Surprise me", immediately recommend one highly rated book. You may ask an optional follow-up question, but never block the recommendation.
      6. FANTASY DETECTION: If the user mentions fantasy, Harry Potter, Percy Jackson, etc., classify readerIntent as 'fantasy_reader' and recommend immediately.
      7. ATOMIC HABITS: If the user mentions Atomic Habits, classify readerIntent as 'atomic_habits_fan' and recommend. Do not drift into business or startup.
      8. ANTI-LOOP: The user's profile includes 'clarificationCount' and 'lastQuestionAsked'. If clarificationCount >= 1, YOU MUST RECOMMEND A BOOK. Never ask the same question twice.
      9. EXPLANATION QUALITY: Recommendation 'reason' must be highly personalized. "Since your brother enjoys gaming, this fast-paced adventure..."
      10. CATALOG ONLY: ONLY recommend books explicitly provided in the "Available Books Catalog" below. NEVER invent or hallucinate books.

      PROFILE MANAGEMENT:
      Maintain the session profile. If you learn new info, update "profileUpdate".
      Always try to classify the user's psychological "readerIntent".
      NOTE: Do NOT generate or update the 'alreadyRecommended' list. The system handles that automatically.
    `;

    const schemaInstruction = `
      OUTPUT FORMAT:
      You MUST return a single, valid JSON object exactly matching the requested schema. DO NOT wrap it in Markdown (no \`\`\`json). Return RAW JSON ONLY.

      JSON Schema:
      {
        "profileUpdate": {
          "readerIntent": ["array", "of", "intent", "strings"],
          "description": "Any new or updated profile info. E.g. {'budget': 500, 'readerIntent': ['productivity']}"
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
    
    // 1. Calculate Confidence Scores
    if (data.recommendations && data.recommendations.length > 0) {
      const allBooks = catalogData as Book[];
      data.recommendations = data.recommendations.map((rec: any) => {
        const book = allBooks.find(b => b.title.toLowerCase() === rec.title.toLowerCase());
        if (book) {
          return { ...rec, confidence: calculateConfidence(book, { ...profile, ...(data.profileUpdate || {}) }) };
        }
        return { ...rec, confidence: 0 };
      });

      // 2. Conversation-First Mode: Enforce Confidence Threshold
      let maxConfidence = 0;
      if (data.recommendations.length > 0) {
        maxConfidence = Math.max(...data.recommendations.map((r: any) => r.confidence));
      }

      // V6 Anti-Loop Logic
      const clarificationCount = profile.clarificationCount || 0;
      const lastQuestion = profile.lastQuestionAsked || null;

      // Infinite Loop Protection
      if (data.followUpQuestion && data.followUpQuestion === lastQuestion) {
        data.followUpQuestion = null;
      }

      const hasCoreInfo = profile.favoriteGenres || profile.likedBooks || profile.budget || profile.readerIntent || profile.interests || profile.giftRecipientAge;

      if (maxConfidence < 40) {
        // We want to wipe only if we TRULY have no info and haven't asked a question yet
        if (!hasCoreInfo && clarificationCount === 0) {
          data.recommendations = [];
          if (!data.followUpQuestion) {
            data.followUpQuestion = "To help me find the absolute perfect book for you, could you tell me a little bit more about what you enjoy or are looking for?";
          }
        }
      }
      
      // Fallback if AI somehow wiped recommendations despite rules
      if (data.recommendations.length === 0 && (clarificationCount >= 1 || hasCoreInfo)) {
          // Grab a popular book as fallback
          const safeBooks = allBooks.filter(b => b.targetAudience !== 'children');
          if (safeBooks.length > 0) {
            data.recommendations = [{
              title: safeBooks[0].title,
              reason: "Since you're open to ideas, I highly recommend this as a widely beloved choice.",
              reasonType: "popular_choice",
              confidence: 50
            }];
          }
      }

      // 3. Append to alreadyRecommended (only if we actually recommended something)
      if (data.recommendations.length > 0) {
        const newTitles = data.recommendations.map((r: any) => r.title);
        if (!data.profileUpdate) data.profileUpdate = {};
        const currentAlreadyRecommended = profile.alreadyRecommended || [];
        data.profileUpdate.alreadyRecommended = Array.from(new Set([...currentAlreadyRecommended, ...newTitles]));
      }
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
