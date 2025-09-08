export interface IStockMetrics {
  symbol: string;
  price: number;
  forecast: number;
  volatility: number;
  askPrice: number;
  bidPrice: number;
  maxShares: number;
  timestamp: number;
}
