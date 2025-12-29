export interface RevenueBlock {
  total: number;
  growth: number;
}

export interface RevenueSummaryResponse {
  success: boolean;
  range: string;
  room: RevenueBlock;
  restaurant: RevenueBlock;
  total: number;
}
