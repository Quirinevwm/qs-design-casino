import axios from 'axios';
import type { AnalysisResult } from '../ai/types.js';
import type { NewsArticle } from '../scraper/types.js';

export class TeamsNotifier {
  private webhookUrl: string;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || process.env.TEAMS_WEBHOOK_URL || '';
    
    if (!this.webhookUrl) {
      throw new Error('Teams webhook URL not configured. Set TEAMS_WEBHOOK_URL environment variable.');
    }
  }

  async send(analysis: AnalysisResult, articles: NewsArticle[]): Promise<void> {
    if (analysis.insights.length === 0) {
      console.log('No insights to send');
      return;
    }

    const card = this.buildAdaptiveCard(analysis, articles);

    try {
      await axios.post(this.webhookUrl, card, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`Sent digest with ${analysis.insights.length} insights to Teams`);
    } catch (error: any) {
      console.error('Error sending to Teams:', error.message);
      if (error.response?.data) {
        console.error('Teams API response:', JSON.stringify(error.response.data, null, 2));
      }
      if (error.response?.status) {
        console.error('Status code:', error.response.status);
      }
      throw new Error(`Failed to send Teams notification: ${error.message}`);
    }
  }

  private buildAdaptiveCard(analysis: AnalysisResult, articles: NewsArticle[]) {
    // Create a map of article titles to URLs for easy lookup
    const articleMap = new Map(articles.map(a => [a.title.toLowerCase(), a.url]));
    
    const insightSections = analysis.insights.map((insight, idx) => {
      let sources = '';
      if (insight.sourceArticles && insight.sourceArticles.length > 0) {
        const sourceLinks = insight.sourceArticles.map(sourceName => {
          // Try to find the matching article URL
          const url = articleMap.get(sourceName.toLowerCase());
          return url ? `[${sourceName}](${url})` : sourceName;
        });
        sources = `\n\n_Sources: ${sourceLinks.join(', ')}_`;
      }
      
      return {
        activityTitle: `**${idx + 1}. ${insight.title}**`,
        activitySubtitle: insight.summary,
        activityText: `💡 **Design implications**\n\n${insight.designImplications}${sources}`,
      };
    });

    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: 'AI News Digest',
      themeColor: '0078D4',
      title: 'Hi Q,',
      text: `Here are your top 3 AI insights for today:\n\n${analysis.analyzedAt.toLocaleDateString()} • ${analysis.articlesProcessed} articles analyzed`,
      sections: insightSections,
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'View full news',
          targets: [
            {
              os: 'default',
              uri: 'https://news.smol.ai/',
            },
          ],
        },
      ],
    };
  }
}
