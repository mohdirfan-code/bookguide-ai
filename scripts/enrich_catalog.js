const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../src/data/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const getAudience = (book) => {
  if (book.genre === 'Children') return 'children';
  if (book.genre === 'Fantasy' && ['Harry Potter', 'The Hobbit', 'The Hunger Games', 'Percy Jackson', 'Maze Runner'].some(k => book.title.includes(k))) return 'young_adult';
  if (book.title === 'The Fault in Our Stars' || book.title === 'The Book Thief') return 'young_adult';
  return 'adult';
};

const getDifficulty = (book) => {
  if (book.genre === 'Children') return 'beginner';
  if (getAudience(book) === 'young_adult') return 'beginner';
  
  if (book.genre === 'Self Help' || book.genre === 'Business' || book.genre === 'Productivity') {
    if (['Atomic Habits', 'The Power of Habit', 'Think Like a Monk', 'Can\'t Hurt Me', 'Essentialism'].includes(book.title)) return 'beginner';
    if (['Thinking, Fast and Slow', 'Principles', 'The Intelligent Investor'].includes(book.title)) return 'advanced';
    return 'intermediate';
  }
  
  if (book.genre === 'Classic') {
    if (['Animal Farm', 'To Kill a Mockingbird', 'The Catcher in the Rye'].includes(book.title)) return 'intermediate';
    return 'advanced';
  }

  if (book.genre === 'Thriller' || book.genre === 'Mystery') return 'beginner';
  if (book.genre === 'Science' || book.genre === 'History') return 'intermediate';
  
  return 'intermediate';
};

const getTags = (book) => {
  const tags = new Set([book.genre.toLowerCase()]);
  
  const title = book.title.toLowerCase();
  
  if (title.includes('habit')) {
      tags.add('habits');
      tags.add('productivity');
      tags.add('personal_growth');
  }
  
  if (['atomic habits', 'deep work', 'essentialism', 'think like a monk', 'can\'t hurt me', 'the mountain is you'].includes(title)) {
      tags.add('personal_growth');
      tags.add('productivity');
  }

  if (book.genre === 'Business' || title.includes('startup') || title.includes('zero to one') || title.includes('good to great')) {
      tags.add('entrepreneurship');
      tags.add('leadership');
  }

  if (getDifficulty(book) === 'beginner') {
      tags.add('beginner_friendly');
  }

  if (title.includes('ready player one') || title.includes('maze runner')) {
      tags.add('gaming');
      tags.add('fast_paced');
  }
  
  if (book.genre === 'Thriller' || book.genre === 'Mystery' || getAudience(book) === 'young_adult') {
      tags.add('fast_paced');
      tags.add('page_turner');
  }

  if (['ikigai', 'start with why', 'man\'s search for meaning', 'the alchemist'].includes(title)) {
      tags.add('purpose');
      tags.add('life_direction');
  }

  return Array.from(tags);
};

const enrichedCatalog = catalog.map(book => {
  return {
    ...book,
    readingDifficulty: getDifficulty(book),
    tags: getTags(book),
    targetAudience: getAudience(book)
  };
});

fs.writeFileSync(catalogPath, JSON.stringify(enrichedCatalog, null, 2));
console.log('Catalog successfully enriched.');
