import 'dotenv/config';
import { scrapeSmolNews } from '../scraper/smol-news-scraper.js';
import { FoundryClient } from '../ai/foundry-client.js';
import { TeamsNotifier } from '../notifiers/teams-notifier.js';

export async function runDailyDigest(): Promise<void> {
  console.log('🤖 Starting AI news digest...');
  console.log('━'.repeat(50));

  try {
    // Step 1: Scrape news
    console.log('📰 Scraping news.smol.ai...');
    const scrapeResult = await scrapeSmolNews(7); // Last 7 days
    
    if (scrapeResult.articles.length === 0) {
      console.log('⚠️  No new articles found');
      return;
    }

    console.log(`✓ Found ${scrapeResult.articles.length} articles`);
    console.log('━'.repeat(50));

    // Step 2: Analyze with AI
    console.log('🧠 Analyzing with Azure AI Foundry...');
    const foundryClient = new FoundryClient();
    const analysis = await foundryClient.analyzeNews(scrapeResult.articles);

    if (analysis.insights.length === 0) {
      console.log('⚠️  No relevant insights extracted');
      return;
    }

    console.log(`✓ Extracted ${analysis.insights.length} design insights`);
    analysis.insights.forEach((insight, idx) => {
      console.log(`  ${idx + 1}. ${insight.title} (score: ${insight.relevanceScore})`);
    });
    console.log('━'.repeat(50));

    // Step 3: Send to Teams
    console.log('📤 Sending to Microsoft Teams...');
    const teamsNotifier = new TeamsNotifier();
    await teamsNotifier.send(analysis, scrapeResult.articles);

    console.log('✓ Digest sent successfully!');
    console.log('━'.repeat(50));
    console.log('🎉 Daily digest complete');

  } catch (error) {
    console.error('❌ Error running digest:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailyDigest()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
