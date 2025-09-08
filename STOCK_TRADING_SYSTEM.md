# Bitburner Stock Market Trading System

## Overview
This module provides a fully automated, risk-managed stock trading system for Bitburner, designed to maximize passive income from the earliest stages of BitNode 1. It integrates seamlessly with the task-based architecture, persistent database, and configuration system of your TypeScript automation framework.

---

## Features
- **Automated Market Analysis**: Scans all stocks every 6 seconds for forecast and volatility changes
- **Position Management**: Buys and sells stocks based on configurable forecast thresholds
- **Risk Management**: Implements stop-loss, take-profit, and position sizing rules
- **Capital Allocation**: Coordinates with hack income and other investments for optimal cash flow
- **Performance Tracking**: Monitors profit/loss and trading history for each position

---

## Data Models

### Stock Position
```typescript
interface IStockPosition {
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
```

### Stock Metrics
```typescript
interface IStockMetrics {
  symbol: string;
  price: number;
  forecast: number;
  volatility: number;
  askPrice: number;
  bidPrice: number;
  maxShares: number;
  timestamp: number;
}
```

### Trading Strategy (Configuration)
```typescript
interface ITradingStrategy {
  strategy: string;
  enabled: boolean;
  buyThreshold: number;      // 0.55+ forecast
  sellThreshold: number;     // 0.45- forecast
  maxPositionSize: number;   // % of available capital
  riskManagement: {
    stopLoss: number;        // -0.10 = 10% max loss
    takeProfitRatio: number; // 2.0 = 2:1 profit ratio
    maxTotalExposure: number; // 0.80 = 80% of capital max
  };
  capitalAllocation: {
    reserveRatio: number;    // 0.20 = keep 20% liquid
    minCashBuffer: number;   // Absolute minimum cash
  };
}
```

### Stock History Entry
```typescript
interface IStockHistoryEntry {
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
```

---

## Database Schema Extensions
Extend your `DatabaseStoreName` enum and `tableDefinitions` array in `/lib/database.ts`:
```typescript
// In DatabaseStoreName enum:
StockPositions = 'stockPositions',
StockHistory = 'stockHistory',
StockMetrics = 'stockMetrics',

// In tableDefinitions array:
{ name: DatabaseStoreName.StockPositions, key: "symbol" },
{ name: DatabaseStoreName.StockHistory, key: "id", options: { autoIncrement: true } },
{ name: DatabaseStoreName.StockMetrics, key: "symbol" },
```

---

## Configuration Integration
Use the Configuration module (`/lib/configuration.ts`) to store and retrieve trading strategy and settings:
```typescript
const defaultTradingStrategy: ITradingStrategy = {
  strategy: 'default',
  enabled: true,
  buyThreshold: 0.55,    // Buy when forecast > 55%
  sellThreshold: 0.45,   // Sell when forecast < 45%
  maxPositionSize: 0.15, // Max 15% of portfolio per stock
  riskManagement: {
    stopLoss: -0.10,          // 10% max loss per position
    takeProfitRatio: 2.0,     // Take profit at 20% gain (2:1 ratio)
    maxTotalExposure: 0.80    // Max 80% of capital in stocks
  },
  capitalAllocation: {
    reserveRatio: 0.20,       // Keep 20% cash
    minCashBuffer: 100000     // Always keep $100k liquid
  }
};

// Usage in task:
let config = await Configuration.getInstance();
let strategy = await config.get<ITradingStrategy>('stockTrading');
if (!strategy) {
  await config.set({ key: 'stockTrading', value: defaultTradingStrategy });
  strategy = defaultTradingStrategy;
}
```

---

## Task Implementation & Integration
Follow your ScriptTask/DynamicScript pattern. Example:
```typescript
// src/tasks/stockTradingTask.ts
import { DynamicScript, getDynamicScriptContent } from "/lib/system";
import { ScriptTask } from "/models/ScriptTask";

export default (taskName: string = 'StockTrading') => new ScriptTask(
  { name: taskName, priority: 20, lastRun: 0, interval: 5000, enabled: true },
  new DynamicScript(taskName, `
    // Load trading strategy from configuration
    let config = await Configuration.getInstance();
    let strategy = await config.get('stockTrading');
    if (!strategy) {
      await config.set({ key: 'stockTrading', value: defaultTradingStrategy });
      strategy = defaultTradingStrategy;
    }

    // Fetch all stock symbols and metrics
    await DynamicScript.new("getStockMetrics",
      getDynamicScriptContent("stockMetrics", "ns.stock.getSymbols().map(s => ({ symbol: s, price: ns.stock.getPrice(s), forecast: ns.stock.getForecast(s), volatility: ns.stock.getVolatility(s), askPrice: ns.stock.getAskPrice(s), bidPrice: ns.stock.getBidPrice(s), maxShares: ns.stock.getMaxShares(s), timestamp: Date.now() }))", DatabaseStoreName.StockMetrics)
    ).run(ns, true);

    // Trading logic here: analyze, buy/sell, update positions/history
    // ...
  `, [
    'import { DynamicScript, getDynamicScriptContent } from "/lib/system";',
    'import { Configuration } from "/lib/configuration";',
    'import { DatabaseStoreName } from "/lib/database";',
  ])
)
```

### Task Registration
- Add `StockTrading` to your `TaskNames` enum in `daemon.ts`.
- Register the task in the `Tasks` object:
```typescript
[TaskNames.StockTrading]: stockTradingTask(TaskNames.StockTrading),
```

---

## Example Workflow
1. **StockTrading Task** runs every 5 seconds, updating metrics, analyzing, and executing buy/sell/hold logic based on the current strategy and risk management rules.
2. **Positions** and **history** are updated in the database, and all trades are logged for performance tracking.

---

## Benefits
- **Immediate ROI**: Profits from market movements even with small starting capital
- **Safe and Scalable**: Conservative defaults protect capital and scale with your progression
- **Fully Automated**: No manual intervention required after setup

---

## Integration Notes
- Requires TIX API access (purchase for $200k in-game)
- Works best when paired with hack income and server purchase automation
- Designed for extensibility: add new strategies, analytics, or reporting as needed

---

## Next Steps
- Implement the Hacknet Optimization System for additional passive income
- Add advanced analytics and reporting for stock trading performance
- Integrate with resource allocation manager for optimal fund distribution
