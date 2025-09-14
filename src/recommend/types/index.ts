export interface RecommendationResponse {
  date: string;
  stocks: string[];
}

export interface AIBriefingResponse {
  reason: string;
  contents: string;
  news: Array<{
    link: string;
    summary: string;
    date: string;
  }>;
}

export interface StockRecommendationDetail {
  score: number;
  reason: string;
  summary: {
    date: string;
    contents: string;
  };
  news: Array<{
    link: string;
    summary: string;
    date: string;
  }>;
}
