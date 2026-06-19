import Groq from "groq-sdk";
import { GoogleGenAI, Type } from '@google/genai';

export interface LLMProvider {
  name: string;
  generateResponse(
    messages: any[],
    profile: Record<string, any>,
    systemInstruction: string,
    catalogContext: string,
    schemaInstruction: string
  ): Promise<any>;
}

export class GroqProvider implements LLMProvider {
  name = "Groq";
  private groq: Groq;
  private model: string;

  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.model = "openai/gpt-oss-120b";
  }

  async generateResponse(
    messages: any[],
    profile: Record<string, any>,
    systemInstruction: string,
    catalogContext: string,
    schemaInstruction: string
  ): Promise<any> {
    const fullSystemPrompt = `
${systemInstruction}

AVAILABLE BOOKS CATALOG:
${catalogContext}

CURRENT CUSTOMER PROFILE:
${JSON.stringify(profile)}

${schemaInstruction}
    `;

    const formattedMessages = [
      { role: "system", content: fullSystemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === "model" ? "assistant" : "user",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content)
      }))
    ];

    const startTime = Date.now();
    let status = "success";

    try {
      const completion = await this.groq.chat.completions.create({
        messages: formattedMessages as any,
        model: this.model,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      
      const responseTime = Date.now() - startTime;
      console.log(`[LLM Performance] Provider: ${this.name} | Model: ${this.model} | Time: ${responseTime}ms | Status: ${status}`);

      return JSON.parse(cleanedText);
    } catch (error) {
      status = "failure";
      const responseTime = Date.now() - startTime;
      console.error(`[LLM Performance] Provider: ${this.name} | Model: ${this.model} | Time: ${responseTime}ms | Status: ${status}`, error);
      throw error;
    }
  }
}

export class GeminiProvider implements LLMProvider {
  name = "Gemini";
  private ai: GoogleGenAI;
  private model: string;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    this.model = "gemini-2.5-flash";
  }

  async generateResponse(
    messages: any[],
    profile: Record<string, any>,
    systemInstruction: string,
    catalogContext: string,
    schemaInstruction: string // Unused for Gemini as we use responseSchema object
  ): Promise<any> {
    const fullSystemPrompt = `
${systemInstruction}

AVAILABLE BOOKS CATALOG:
${catalogContext}

CURRENT CUSTOMER PROFILE:
${JSON.stringify(profile)}
    `;

    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }]
    }));

    const startTime = Date.now();
    let status = "success";

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: formattedMessages,
        config: {
          systemInstruction: fullSystemPrompt,
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              profileUpdate: {
                type: Type.OBJECT,
                properties: {
                  readerIntent: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Classify the user's reading intent. E.g. ['productivity', 'personal_growth'] or ['gift', 'reluctant_reader']"
                  }
                },
                description: "Any new or updated profile information learned in this turn. E.g. {'budget': 500, 'readerIntent': ['gift']}."
              },
              message: {
                type: Type.STRING,
                description: "Your conversational response to the user."
              },
              recommendations: {
                type: Type.ARRAY,
                description: "List of recommended books from the catalog. Leave empty if you need more info.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "The exact title of the book from the catalog" },
                    reason: { type: Type.STRING, description: "Why this book is recommended for this user" },
                    reasonType: { 
                      type: Type.STRING, 
                      description: "Categorize the reason",
                      enum: ["budget_match", "genre_match", "gift_recommendation", "similar_to_liked_book", "beginner_friendly", "popular_choice", "other"]
                    }
                  }
                }
              },
              followUpQuestion: {
                type: Type.STRING,
                description: "A question to ask if you need more info. Null if not needed.",
                nullable: true
              }
            },
            required: ["message", "recommendations"]
          }
        }
      });

      const rawText = response.text;
      const cleanedText = rawText.replace(/```json\n?|\n?```/g, '').trim();
      
      const responseTime = Date.now() - startTime;
      console.log(`[LLM Performance] Provider: ${this.name} | Model: ${this.model} | Time: ${responseTime}ms | Status: ${status}`);

      return JSON.parse(cleanedText);
    } catch (error) {
      status = "failure";
      const responseTime = Date.now() - startTime;
      console.error(`[LLM Performance] Provider: ${this.name} | Model: ${this.model} | Time: ${responseTime}ms | Status: ${status}`, error);
      throw error;
    }
  }
}

export class FallbackProvider implements LLMProvider {
  name = "Fallback Manager";
  private primary: LLMProvider;
  private secondary: LLMProvider;

  constructor(primary: LLMProvider, secondary: LLMProvider) {
    this.primary = primary;
    this.secondary = secondary;
  }

  async generateResponse(
    messages: any[],
    profile: Record<string, any>,
    systemInstruction: string,
    catalogContext: string,
    schemaInstruction: string
  ): Promise<any> {
    try {
      console.log(`[FallbackProvider] Attempting primary provider: ${this.primary.name}`);
      return await this.primary.generateResponse(messages, profile, systemInstruction, catalogContext, schemaInstruction);
    } catch (error) {
      console.warn(`[FallbackProvider] Primary provider ${this.primary.name} failed, falling back to ${this.secondary.name}...`);
      return await this.secondary.generateResponse(messages, profile, systemInstruction, catalogContext, schemaInstruction);
    }
  }
}

export function getLLMProvider(): LLMProvider {
  const providerName = process.env.LLM_PROVIDER || 'groq';
  
  const groq = new GroqProvider();
  const gemini = new GeminiProvider();
  
  if (providerName === 'gemini') {
    return new FallbackProvider(gemini, groq);
  }
  
  // Default to Groq with Gemini as fallback
  return new FallbackProvider(groq, gemini);
}
