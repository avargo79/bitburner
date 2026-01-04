import { NS } from "@ns";

/**
 * LONG-ONLY STOCK TRADER
 * 
 * Strategy:
 * - Requires 4S Market Data TIX API.
 * - BUY when Forecast > 0.60 (Strong Uptrend).
 * - SELL when Forecast < 0.50 (Trend Reversal).
 * - Ride the trend; no stop-losses (Bitburner trends are persistent).
 */

const CONFIG = {
  buyThreshold: 0.60,
  sellThreshold: 0.50,
  minTradeAmount: 100e6, // $100m minimum trade to absorb commission
  reserveStart: 20e9,    // Keep $20b if total wealth is low (optional)
  commish: 100000        // Cost per trade
};

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();

  // 1. Pre-flight Checks
  if (!ns.stock.hasWSEAccount() || !ns.stock.has4SDataTIXAPI()) {
    ns.tprint("ERROR: WSE Account and 4S Market Data TIX API are required.");
    return;
  }

  ns.print("Starting Long-Only Stock Manager...");

  while (true) {
    const stocks = ns.stock.getSymbols().sort((a, b) => ns.stock.getForecast(b) - ns.stock.getForecast(a));

    for (const sym of stocks) {
      const pos = ns.stock.getPosition(sym);
      const shares = pos[0];
      const avgPrice = pos[1];
      const forecast = ns.stock.getForecast(sym);
      const askPrice = ns.stock.getAskPrice(sym);
      const bidPrice = ns.stock.getBidPrice(sym);

      // SELL LOGIC
      if (shares > 0) {
        if (forecast < CONFIG.sellThreshold) {
          const profit = (bidPrice - avgPrice) * shares - (2 * CONFIG.commish);
          ns.stock.sellStock(sym, shares);
          ns.print(`SOLD ${sym}: Forecast ${forecast.toFixed(2)} dropped below ${CONFIG.sellThreshold}. Profit: $${ns.formatNumber(profit)}`);
        }
      }

      // BUY LOGIC
      if (forecast >= CONFIG.buyThreshold) {
        const money = ns.getServerMoneyAvailable("home");
        // Simple money management: spend almost everything if high confidence
        // But keep a small buffer if needed.
        const buffer = 10e6;
        const available = money - buffer - CONFIG.commish;

        if (available > CONFIG.minTradeAmount) {
          const maxShares = ns.stock.getMaxShares(sym);
          const sharesToBuy = Math.min(
            Math.floor(available / askPrice),
            maxShares - shares
          );

          if (sharesToBuy > 0) {
            // Only buy if the trade size is meaningful
            if ((sharesToBuy * askPrice) > CONFIG.minTradeAmount) {
              ns.stock.buyStock(sym, sharesToBuy);
              ns.print(`BOUGHT ${sym}: Forecast ${forecast.toFixed(2)}. Spent $${ns.formatNumber(sharesToBuy * askPrice)}`);
            }
          }
        }
      }
    }

    await ns.sleep(6000); // Wait for potential tick
  }
}