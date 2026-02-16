export interface DesignInsight {
  title: string;
  summary: string;
  designImplications: string;
  sourceArticles: string[];
  relevanceScore: number;
}

export interface AnalysisResult {
  insights: DesignInsight[];
  analyzedAt: Date;
  articlesProcessed: number;
}
