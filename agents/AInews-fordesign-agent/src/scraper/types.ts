export interface NewsArticle {
  title: string;
  date: string;
  url: string;
  summary: string;
  tags: string[];
}

export interface ScraperResult {
  articles: NewsArticle[];
  scrapedAt: Date;
}
