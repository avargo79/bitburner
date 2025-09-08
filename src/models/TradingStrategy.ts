export interface ITradingStrategy {
  strategy: string;
  enabled: boolean;
  buyThreshold: number;
  sellThreshold: number;
  maxPositionSize: number;
  riskManagement: {
    stopLoss: number;
    takeProfitRatio: number;
    maxTotalExposure: number;
  };
  capitalAllocation: {
    reserveRatio: number;    // 0.20 = keep 20% liquid
    minCashBuffer: number;   // Absolute minimum cash
  };
  debug?: boolean; // Enable debug output
}
