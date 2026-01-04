# Stock Market Guide

Trading stocks is the ultimate mid-game money printer. Access it via the WSE (World Stock Exchange).

## Prerequisites
- **WSE Account**: To trade.
- **TIX API Access ($5b)**: To use `ns.stock` functions.
- **4S Market Data ($1b + $25b)**: To see and use `forecast` data.

## The Math: Forecast & Volatility
- **Forecast**: A number between 0 and 1.
  - `0.5`: Neutral.
  - `> 0.5`: Price likely to RISE (Long).
  - `< 0.5`: Price likely to FALL (Short).
- **Volatility**: How much the price moves per tick. High volatility = Riskier but faster profit.

## Strategies

### 1. Pre-4S (Historical Data)
*Hard mode. Generally not recommended unless you are a math wizard.*
- **Method**: Track the last N ticks. If a stock rose X times, assume it's in an "Up" state.
- **Reliability**: Low. The market is chaotic.

### 2. Post-4S (Forecast Algo)
*The Meta Strategy.*
- **Buy Threshold**: `Forecast > 0.6` (Buy Long).
- **Sell Threshold**: `Forecast < 0.5` (Sell Long).
- **Short Threshold**: `Forecast < 0.4` (Buy Short).
- **Cover Threshold**: `Forecast > 0.5` (Sell Short).

## Automation Script Layout
```javascript
export async function main(ns) {
    while(true) {
        const stocks = ns.stock.getSymbols();
        for (const sym of stocks) {
            const forecast = ns.stock.getForecast(sym);
            if (forecast > 0.6) {
                // Buy Max Long
                buyStock(ns, sym); 
            } else if (forecast < 0.5) {
                // Liquidate Long
                sellStock(ns, sym);
            }
        }
        await ns.stock.nextUpdate(); // Waits ~4-6 seconds
    }
}
```

## Tips
- **Bonus Time**: In some BitNodes, bonus time makes the stock market tick faster (every 4s instead of 6s). Your script using `nextUpdate()` handles this automatically.
- **Liquidity**: Ensure you have enough cash to influence the market or buy significant volume.
- **Shorting**: Requires BN8 Source-File or high intelligence/stats in some servers.
