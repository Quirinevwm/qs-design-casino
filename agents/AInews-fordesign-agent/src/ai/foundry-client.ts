import axios from 'axios';
import type { NewsArticle } from '../scraper/types.js';
import type { AnalysisResult, DesignInsight } from './types.js';

const SYSTEM_PROMPT = `You are an AI design strategist analyzing AI engineering news for design implications.

Your mission: Extract exactly 3 insights from the provided news articles that focus on:
1. AI agent architectures and capabilities
2. AI model training and inference improvements  
3. How these developments influence the design of portals, CLIs, and developer tools

For each insight:
- Title: Clear, design-focused headline
- Summary: Technical context (2-3 sentences)
- Design implications: Specific, actionable implications for building portals and CLI experiences (2-3 sentences)
- Source articles: Which articles this insight came from (by title)
- Relevance score: 1-10 score for design/tooling relevance

Think like a design director who needs to understand how AI capabilities shape interface patterns, interaction models, and developer experience.

Output valid JSON only in this exact format:
{
  "insights": [
    {
      "title": "string",
      "summary": "string",
      "designImplications": "string",
      "sourceArticles": ["string"],
      "relevanceScore": number
    }
  ]
}`;

export class FoundryClient {
  private endpoint: string;
  private apiKey: string;
  private model: string;
  private isOpenAI: boolean;

  constructor() {
    const endpoint = process.env.AZURE_AI_ENDPOINT;
    const apiKey = process.env.AZURE_AI_API_KEY;
    const model = process.env.AZURE_AI_MODEL || 'claude-sonnet-4.5';

    if (!endpoint || !apiKey) {
      throw new Error('Azure AI Foundry credentials not configured. Set AZURE_AI_ENDPOINT and AZURE_AI_API_KEY.');
    }

    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.model = model;
    // Detect if using OpenAI or Anthropic endpoint
    this.isOpenAI = endpoint.includes('openai') || endpoint.includes('cognitiveservices');
  }

  async analyzeNews(articles: NewsArticle[]): Promise<AnalysisResult> {
    if (articles.length === 0) {
      return {
        insights: [],
        analyzedAt: new Date(),
        articlesProcessed: 0,
      };
    }

    // Format articles for the AI
    const articlesText = articles.map((article, idx) => {
      return `
Article ${idx + 1}: ${article.title}
Date: ${article.date}
Tags: ${article.tags.slice(0, 10).join(', ')}
Summary: ${article.summary.substring(0, 500)}
---`;
    }).join('\n');

    const userPrompt = `Analyze these ${articles.length} AI engineering news articles and extract the top 3 insights for design and tooling:

${articlesText}

Remember: Focus on agents, models, and how they influence portal/CLI design. Output JSON only.`;

    try {
      const url = this.endpoint;
      
      console.log('Calling URL:', url);
      console.log('Model:', this.model);
      console.log('API Type:', this.isOpenAI ? 'OpenAI' : 'Anthropic');
      
      let requestBody: any;
      let headers: any;

      if (this.isOpenAI) {
        // OpenAI format
        requestBody = {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        };
        headers = {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        };
      } else {
        // Anthropic format
        requestBody = {
          model: this.model,
          max_tokens: 2000,
          temperature: 0.7,
          system: SYSTEM_PROMPT,
          messages: [
            { role: 'user', content: userPrompt },
          ],
        };
        headers = {
          'api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        };
      }
      
      const response = await axios.post(url, requestBody, { headers });

      let text: string;
      
      if (this.isOpenAI) {
        // OpenAI response format
        text = response.data.choices[0]?.message?.content;
      } else {
        // Anthropic response format
        const content = response.data.content[0];
        if (content.type !== 'text') {
          throw new Error('Unexpected response type from AI model');
        }
        text = content.text;
      }

      if (!text) {
        throw new Error('No response from AI model');
      }

      // Parse JSON response
      const parsed = JSON.parse(text);
      const insights: DesignInsight[] = parsed.insights || [];

      // Ensure we have exactly 3 insights
      const top3Insights = insights.slice(0, 3);

      console.log(`Extracted ${top3Insights.length} design insights from ${articles.length} articles`);

      return {
        insights: top3Insights,
        analyzedAt: new Date(),
        articlesProcessed: articles.length,
      };
    } catch (error: any) {
      console.error('Error analyzing news with AI:', error.response?.data || error.message);
      throw new Error(`Failed to analyze news: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

