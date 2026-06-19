import fs from 'fs';
import path from 'path';

const CATALOG_PATH = path.join(__dirname, '../src/data/catalog.json');
const OUTPUT_PATH = path.join(__dirname, '../src/data/catalog_enriched.json');

async function main() {
  const rawData = fs.readFileSync(CATALOG_PATH, 'utf-8');
  const catalog = JSON.parse(rawData);
  
  let updatedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const totalBooks = catalog.length;

  console.log(`Starting enrichment for ${totalBooks} books...`);

  for (const book of catalog) {
    if (book.cover_image_url && book.cover_image_url.includes('books.google.com')) {
      skippedCount++;
      continue;
    }

    try {
      const query = `intitle:"${encodeURIComponent(book.title)}"+inauthor:"${encodeURIComponent(book.author)}"`;
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      const url = `https://www.googleapis.com/books/v1/volumes?q=${query}${apiKey ? `&key=${apiKey}` : ''}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      
      const thumbnail = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
      
      if (thumbnail) {
        // Upgrade to https if needed
        book.cover_image_url = thumbnail.replace(/^http:\/\//i, 'https://');
        updatedCount++;
        console.log(`[SUCCESS] Updated cover for: ${book.title}`);
      } else {
        failedCount++;
        console.log(`[FAILED] No thumbnail found for: ${book.title}`);
      }
    } catch (err: any) {
      failedCount++;
      console.error(`[ERROR] Failed to fetch data for: ${book.title} - ${err.message}`);
    }
    
    // Increased delay to 2 seconds to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(catalog, null, 2));

  const successPercentage = totalBooks > 0 ? (((updatedCount + skippedCount) / totalBooks) * 100).toFixed(2) : 0;

  console.log('\n--- Enrichment Complete ---');
  console.log(`Total Books: ${totalBooks}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped (already have Google Books image): ${skippedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Success Percentage: ${successPercentage}%`);
  console.log(`\nNew catalog saved to: ${OUTPUT_PATH}`);
}

main().catch(console.error);
