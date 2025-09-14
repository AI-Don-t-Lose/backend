export interface CategoryStat {
  categoryId: string;
  amount: number;
  percentage: number;
}

export interface SpendingAnalysis {
  userId: string;
  month: Date;
  totalAmount: number;
  categoryStats: CategoryStat[];
}
