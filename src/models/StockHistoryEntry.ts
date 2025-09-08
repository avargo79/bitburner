export interface IStockHistoryEntry {
  id?: number;
  symbol: string;
  price: number;
  forecast: number;
  volatility: number;
  timestamp: number;
  action?: 'buy' | 'sell' | 'hold';
  shares?: number;
  reason?: string;
}
