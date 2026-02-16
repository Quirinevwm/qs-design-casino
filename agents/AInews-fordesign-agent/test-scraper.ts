import 'dotenv/config';
import { scrapeSmolNews } from './src/scraper/smol-news-scraper.js';

async function testScraper() {
  console.log('🧪 Testing scraper...\n');
  
  try {
    const result = await scrapeSmolNews(7); // Try 7 days
    
    console.log(`✓ Scraped ${result.articles.length} articles\n`);
    
    result.articles.slice(0, 5).forEach((article, idx) => {
      console.log(`${idx + 1}. ${article.title}`);
      console.log(`   Date: ${article.date}`);
      console.log(`   URL: ${article.url}`);
      console.log(`   Tags: ${article.tags.slice(0, 8).join(', ')}`);
      console.log(`   Summary: ${article.summary.substring(0, 200)}...`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testScraper();
