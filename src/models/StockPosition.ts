export interface IStockPosition {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  forecast: number;
  volatility: number;
  lastUpdate: number;
  profitLoss: number;
  profitLossPercent: number;
}
