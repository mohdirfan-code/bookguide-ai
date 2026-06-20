import fs from 'fs';
import path from 'path';

export interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  price: number;
  section: string;
  rack: string;
  description: string;
  cover_image_url: string;
  search_query?: string;
  readingDifficulty: string;
  tags: string[];
  targetAudience: string;
}

// Read catalog from local JSON file
let cachedCatalog: Book[] | null = null;
let cachedCompressedContext: string | null = null;

export function getCatalog(): Book[] {
  if (cachedCatalog) return cachedCatalog;

  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'catalog.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    cachedCatalog = JSON.parse(fileContents);
    return cachedCatalog || [];
  } catch (error) {
    console.error('Error reading catalog:', error);
    return [];
  }
}

// Generate compressed catalog context for Gemini
export function getCompressedCatalogContext(): string {
  if (cachedCompressedContext) return cachedCompressedContext;

  const catalog = getCatalog();
  // Format to send ONLY fields needed for recommendation reasoning
  cachedCompressedContext = catalog.map(b => 
    `"${b.title}" | Genre: ${b.genre} | Sec: ${b.section} | Rack: ${b.rack} | ₹${b.price} | Audience: ${b.targetAudience} | Difficulty: ${b.readingDifficulty} | Tags: ${b.tags?.join(', ') || ''} | Desc: ${b.description.substring(0, 150)}...`
  ).join('\n');

  return cachedCompressedContext;
}

// Get book by title for exact matches (used after Gemini structured output)
export function getBookByTitle(title: string): Book | undefined {
  const catalog = getCatalog();
  return catalog.find(b => b.title.toLowerCase() === title.toLowerCase());
}

// Get similar books
export function getSimilarBooks(bookId: number, limit: number = 3): Book[] {
  const catalog = getCatalog();
  const sourceBook = catalog.find(b => b.id === bookId);
  if (!sourceBook) return [];
  return catalog
    .filter(b => b.id !== bookId)
    .filter(b => b.genre === sourceBook.genre || b.author === sourceBook.author)
    .slice(0, limit);
}
