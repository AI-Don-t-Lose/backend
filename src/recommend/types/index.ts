export interface RecommendationResponse {
  date: number;
  stocks: string[];
}

export interface AIBriefingResponse {
  reason: string;
  contents: string;
  news: Array<{
    link: string;
    summary: string;
    date: number;
  }>;
}

export interface StockRecommendationDetail {
  score: number;
  reason: string;
  summary: {
    date: number;
    contents: string;
  };
  news: Array<{
    link: string;
    summary: string;
    date: number;
  }>;
}
