import fs from 'fs';
import path from 'path';

const CATALOG_PATH = path.join(__dirname, '../src/data/catalog.json');

async function checkImageValid(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    
    // Check Content-Length if available
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength) < 1500) {
      return false; // Less than 1.5KB is almost certainly a 1x1 placeholder
    }
    
    // Fallback: Read body to check size (since OpenLibrary sometimes drops Content-Length)
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 1500) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

async function getOpenLibraryCoverId(title: string, author: string): Promise<string | null> {
  try {
    const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`;
    const res = await fetch(searchUrl);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.docs && data.docs.length > 0) {
      for (const doc of data.docs) {
        if (doc.cover_i) {
          return doc.cover_i.toString();
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('Starting cover validation...');
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
  const originalLength = catalog.length;
  console.log(`Loaded ${originalLength} books from catalog.json`);

  let brokenCount = 0;
  let fixedWithIdCount = 0;
  let fallbackPlaceholderCount = 0;
  const brokenBooks: string[] = [];

  for (let i = 0; i < catalog.length; i++) {
    const book = catalog[i];
    const isValid = await checkImageValid(book.cover_image_url);
    
    if (!isValid) {
      brokenCount++;
      brokenBooks.push(book.title);
      console.log(`[BROKEN] Invalid cover detected for: ${book.title}`);

      // Try fetching by OpenLibrary Cover ID
      const coverId = await getOpenLibraryCoverId(book.title, book.author);
      if (coverId) {
        const idUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
        const isIdValid = await checkImageValid(idUrl);
        if (isIdValid) {
          catalog[i].cover_image_url = idUrl;
          fixedWithIdCount++;
          console.log(`  -> [FIXED] Found valid OpenLibrary Cover ID: ${coverId}`);
          continue; // Move to next book
        }
      }

      // Fallback to premium placeholder
      // We encode the title, keeping it somewhat short to fit nicely
      let shortTitle = book.title;
      if (shortTitle.length > 25) {
         shortTitle = shortTitle.substring(0, 25) + '...';
      }
      const text = encodeURIComponent(shortTitle);
      const placeholderUrl = `https://placehold.co/400x600/1e293b/ffffff?text=${text}`;
      catalog[i].cover_image_url = placeholderUrl;
      fallbackPlaceholderCount++;
      console.log(`  -> [FALLBACK] Used premium placeholder`);
    } else {
      console.log(`[OK] ${book.title}`);
    }

    // Small delay to be respectful to OpenLibrary API
    await new Promise(r => setTimeout(r, 200));
  }

  // Verification step: Ensure no data loss
  if (catalog.length !== originalLength) {
    throw new Error(`CRITICAL ERROR: Catalog length changed from ${originalLength} to ${catalog.length}. Aborting save to prevent data loss.`);
  }

  // Save the updated catalog
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));

  console.log('\n==================================');
  console.log('--- Validation & Fix Summary ---');
  console.log('==================================');
  console.log(`Total Books Checked: ${originalLength}`);
  console.log(`Initial Broken Covers: ${brokenCount}`);
  console.log(`Fixed via Cover IDs: ${fixedWithIdCount}`);
  console.log(`Replaced with Placeholders: ${fallbackPlaceholderCount}`);
  if (brokenBooks.length > 0) {
    console.log('\nList of books that had broken covers:');
    brokenBooks.forEach(b => console.log(` - ${b}`));
  }
  console.log('\n✅ Catalog size verified. No books lost. catalog.json updated successfully.');
}

main().catch(console.error);
