import axios from 'axios';
import * as cheerio from 'cheerio';
import type { NewsArticle, ScraperResult } from './types.js';

const NEWS_URL = process.env.NEWS_SOURCE_URL || 'https://news.smol.ai/';

export async function scrapeSmolNews(daysBack: number = 2): Promise<ScraperResult> {
  try {
    const response = await axios.get(NEWS_URL, {
      headers: {
        'User-Agent': 'SmolNewsAgent/1.0 (AI News Digest Bot)',
      },
    });

    const $ = cheerio.load(response.data);
    const articles: NewsArticle[] = [];

    // Parse articles from timeline list items with data attributes
    $('ul#timeline li[data-post-title]').each((_, element) => {
      const $el = $(element);
      
      const title = $el.attr('data-post-title') || '';
      const description = $el.attr('data-post-description') || '';
      const dateStr = $el.attr('data-post-date') || '';
      const allTags = $el.attr('data-post-all-tags') || '';
      const postId = $el.attr('data-post-id') || '';
      
      // Extract date from ISO string or link text
      let date = '';
      if (dateStr) {
        const parsed = new Date(dateStr);
        date = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        date = $el.find('time').text().trim();
      }

      // Parse tags
      const tags = allTags ? allTags.split(',').map(t => t.trim()) : [];

      // Build URL
      const url = postId ? `${NEWS_URL}issues/${postId}` : NEWS_URL;

      if (title && description) {
        articles.push({
          title,
          date,
          url,
          summary: description,
          tags,
        });
      }
    });

    // Filter to recent articles based on daysBack
    const now = new Date();
    const filteredArticles = articles.filter(article => {
      if (!article.date) return true; // Include if no date
      
      // Parse dates like "Feb 12"
      const currentYear = now.getFullYear();
      const articleDate = new Date(`${article.date} ${currentYear}`);
      
      // If parsing failed or date is in future, it might be from previous year
      if (articleDate > now) {
        articleDate.setFullYear(currentYear - 1);
      }

      const daysDiff = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= daysBack;
    });

    console.log(`Scraped ${filteredArticles.length} articles from the last ${daysBack} days`);

    return {
      articles: filteredArticles,
      scrapedAt: new Date(),
    };
  } catch (error) {
    console.error('Error scraping news:', error);
    throw new Error(`Failed to scrape news: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
