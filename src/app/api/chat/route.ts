import { getCompressedCatalogContext, Book } from '@/lib/catalog';
import catalogData from '@/data/catalog.json';
import { getLLMProvider } from '@/lib/llm';

// Confidence calculation function
function calculateConfidence(book: Book, profile: Record<string, any>): number {
  let score = 50; // Base score
  
  // Budget Match
  if (profile.budget && book.price <= profile.budget) score += 15;

  // Genre Match
  if (profile.favoriteGenres && Array.isArray(profile.favoriteGenres)) {
    if (profile.favoriteGenres.some(g => g.toLowerCase() === book.genre.toLowerCase())) score += 10;
  }

  // Interests Match
  if (profile.interests && Array.isArray(profile.interests)) {
    if (profile.interests.some(i => book.description.toLowerCase().includes(i.toLowerCase()) || book.title.toLowerCase().includes(i.toLowerCase()))) {
      score += 15;
    }
  }

  // V5: Reader Intent & Thematic Tags
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
  try {
    const { messages, profile = {} } = await req.json();

    const catalogContext = getCompressedCatalogContext();

    const systemInstruction = `
      You are BookGuide AI, an expert, friendly, and highly professional assistant at a premium bookstore.
      Your job is to help customers discover books, find gifts, and navigate the store based on deep reader intent.

      CRITICAL RULES & GUARDRAILS:
      1. EXACTLY ONE RECOMMENDATION: You must return exactly ONE top recommendation. Do NOT return multiple books. If the user wants more, they will explicitly ask for options.
      2. CONVERSATION FIRST: If the user's request is vague (e.g. "Recommend a book for my father"), DO NOT guess. Return 0 recommendations and ask ONE clarifying question (e.g., "How old is he and what genres does he like?"). 
      3. CATALOG ONLY: ONLY recommend books explicitly provided in the "Available Books Catalog" below. NEVER invent or hallucinate books.
      4. BUDGET ENFORCEMENT: If a 'budget' is set, YOU MUST NOT recommend any book where the price exceeds the budget.
      5. AVOID REPETITION: Avoid recommending books already in the 'alreadyRecommended' list.
      6. RELUCTANT READERS: If the user hasn't read in years, dislikes reading, or wants an "easy" book, prioritize 'beginner' difficulty and 'fast_paced' books. Strictly avoid 'advanced' classics or long epics.
      7. AGE-AWARENESS: Strictly respect target audiences. Do not recommend children's books to adults, and vice versa. 
      8. EXPLANATION QUALITY: Recommendation 'reason' must be highly personalized. 
         - BAD: "This is a popular fantasy book."
         - GOOD: "Since your brother enjoys gaming and movies, this fast-paced adventure will keep him engaged even if he doesn't read often."

      PROFILE MANAGEMENT:
      Maintain the session profile. If you learn new info, update "profileUpdate".
      Always try to classify the user's psychological "readerIntent" (e.g. ["gift", "reluctant_reader"], ["productivity"], ["purpose"]).
      Fields to extract: budget (number), favoriteGenres (array), likedBooks (array), dislikedGenres (array), giftMode (boolean), giftRecipientAge (number), readingLevel (string), interests (array), readerIntent (array of strings).
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

      if (maxConfidence < 70) {
        // Wipe recommendations if we aren't confident, force a clarifying question
        data.recommendations = [];
        if (!data.followUpQuestion) {
          data.followUpQuestion = "To help me find the absolute perfect book for you, could you tell me a little bit more about what you enjoy or are looking for?";
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
