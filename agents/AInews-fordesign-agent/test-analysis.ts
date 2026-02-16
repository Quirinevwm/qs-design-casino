import 'dotenv/config';
import { scrapeSmolNews } from './src/scraper/smol-news-scraper.js';
import { FoundryClient } from './src/ai/foundry-client.js';

async function testAnalysis() {
  console.log('🤖 Testing AI analysis...');
  console.log('━'.repeat(50));

  try {
    // Step 1: Scrape news
    console.log('📰 Scraping news...');
    const scrapeResult = await scrapeSmolNews(7);
    console.log(`✓ Found ${scrapeResult.articles.length} articles\n`);

    // Step 2: Analyze with AI
    console.log('🧠 Analyzing with Azure AI Foundry...');
    const foundryClient = new FoundryClient();
    const analysis = await foundryClient.analyzeNews(scrapeResult.articles);

    console.log(`✓ Extracted ${analysis.insights.length} insights\n`);
    console.log('━'.repeat(50));

    // Display insights
    analysis.insights.forEach((insight, idx) => {
      console.log(`\n${idx + 1}. ${insight.title}`);
      console.log(`   Relevance: ${insight.relevanceScore}/10`);
      console.log(`\n   ${insight.summary}`);
      console.log(`\n   💡 Design implications:`);
      console.log(`   ${insight.designImplications}`);
      console.log(`\n   Sources: ${insight.sourceArticles.join(', ')}`);
      console.log('━'.repeat(50));
    });

    console.log('\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

testAnalysis();
