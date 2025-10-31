import { NS } from "@ns";

// Lightweight interfaces for standalone operation
interface TradingStrategy {
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
    reserveRatio: number;
    minCashBuffer: number;
  };
  debug: boolean;
}

interface StockPosition {
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

interface StockMetrics {
  symbol: string;
  price: number;
  forecast: number;
  volatility: number;
  askPrice: number;
  bidPrice: number;
  maxShares: number;
  timestamp: number;
}

interface StockHistoryEntry {
  symbol: string;
  price: number;
  forecast: number;
  volatility: number;
  timestamp: number;
  action: 'buy' | 'sell';
  shares: number;
  reason: string;
}

// In-memory data structures for fast access
const positions = new Map<string, StockPosition>();
const metrics = new Map<string, StockMetrics>();
const history: StockHistoryEntry[] = [];

// Configuration and state
let strategy: TradingStrategy;
let debug = false;
let startTime = 0;

const defaultTradingStrategy: TradingStrategy = {
  strategy: 'aggressive',
  enabled: true,
  buyThreshold: 0.52,  // More aggressive - capture more opportunities
  sellThreshold: 0.48,  // More aggressive - exit faster on downtrends
  maxPositionSize: 0.25,  // Larger positions - maximize gains on winners
  riskManagement: {
    stopLoss: -0.05,  // Tighter stop loss - cut losses faster
    takeProfitRatio: 1.5,  // Take profits sooner - lock in gains
    maxTotalExposure: 0.95  // Higher exposure - keep money working
  },
  capitalAllocation: {
    reserveRatio: 0.05,  // Minimal reserve - maximize invested capital
    minCashBuffer: 10000  // Lower buffer - more aggressive deployment
  },
  debug: false
};

// Command line arguments schema
const argsSchema: [string, string | number | boolean | string[]][] = [
  ['debug', false],
  ['help', false],
];

/**
 * Main entry point for standalone stock trading system
 */
export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  ns.clearLog();

  // Parse command line arguments
  const flags = ns.flags(argsSchema);

  // Handle help flag
  if (flags.help) {
    showHelp(ns);
    return;
  }

  // Set debug mode from flags (reset to false first to ensure clean state)
  debug = flags.debug ? true : false;

  // Check for existing stock trading instances
  const runningScripts = ns.ps();
  for (const script of runningScripts) {
    if (script.filename === 'stocks.js' && script.pid !== ns.getRunningScript()?.pid) {
      ns.tprint(`[Stocks] Another stock trading instance is already running (PID: ${script.pid}). Exiting.`);
      return;
    }
  }

  // Initialize configuration
  loadConfiguration(ns);
  loadInitialData(ns);
  startTime = Date.now();

  if (debug) ns.tprint("[Stocks] Starting standalone stock trading system...");

  // Main trading loop
  while (true) {
    try {
      await updateMetrics(ns);
      await executeTrading(ns);

      // Update status display with error handling
      try {
        updateStatusDisplay(ns);
      } catch (statusErr) {
        if (debug) ns.tprint('[Stocks] Status display error: ' + statusErr);
      }

      await ns.sleep(2000); // Run every 2 seconds for faster response
    } catch (err) {
      ns.tprint('[Stocks] ERROR: ' + (err && (err as any).message ? (err as any).message : err));
      await ns.sleep(5000); // Wait on error
    }
  }
}

/**
 * Show help information
 */
function showHelp(ns: NS): void {
  ns.tprint("=== Standalone Stock Trading System ===");
  ns.tprint("");
  ns.tprint("Usage: run stocks.js [options]");
  ns.tprint("");
  ns.tprint("Options:");
  ns.tprint("  --debug     Enable verbose debug output");
  ns.tprint("  --help      Show this help message");
  ns.tprint("");
  ns.tprint("Examples:");
  ns.tprint("  run stocks.js               # Run with default settings (quiet)");
  ns.tprint("  run stocks.js --debug       # Run with verbose output");
  ns.tprint("  tail stocks.js              # View real-time status display");
  ns.tprint("");
  ns.tprint("The stock system runs independently with all data kept in memory.");
  ns.tprint("Use 'tail stocks.js' to view a real-time status dashboard with:");
  ns.tprint("• Portfolio overview with P&L");
  ns.tprint("• Active positions and performance");
  ns.tprint("• Recent trading activity");
  ns.tprint("• Market opportunities and strategy config");
}

/**
 * Load trading strategy configuration
 */
function loadConfiguration(ns: NS): void {
  strategy = defaultTradingStrategy;

  if (debug) {
    ns.tprint('[Stocks] Configuration loaded (default strategy)');
    ns.tprint('[Stocks] Strategy: ' + JSON.stringify(strategy, null, 2));
  }
}

/**
 * Load existing positions from game API
 */
function loadInitialData(ns: NS): void {
  try {
    // Check API access
    const hasTixApi = ns.stock.hasWSEAccount();
    const has4SApi = ns.stock.has4SData();
    const has4SApiTix = ns.stock.has4SDataTIXAPI();

    if (debug) {
      ns.tprint('[Stocks] API Access Check:');
      ns.tprint(`  WSE Account (basic trading): ${hasTixApi ? '✓' : '✗'}`);
      ns.tprint(`  4S Market Data (prices): ${has4SApi ? '✓' : '✗'}`);
      ns.tprint(`  4S Market Data TIX API (forecast): ${has4SApiTix ? '✓' : '✗'}`);
    }

    if (!hasTixApi) {
      ns.tprint('[Stocks] ERROR: You need to purchase WSE Account access to trade stocks!');
      ns.tprint('[Stocks] Go to City > Stock Market > Purchase WSE Account ($200m)');
      return;
    }

    if (!has4SApiTix) {
      ns.tprint('[Stocks] WARNING: You need 4S Market Data TIX API for forecast data!');
      ns.tprint('[Stocks] Without it, you can only see prices but not make informed trades.');
      ns.tprint('[Stocks] Go to City > Stock Market > Purchase 4S Market Data TIX API ($25b)');
    }

    const symbols = ns.stock.getSymbols();
    let positionsLoaded = 0;

    // Check each symbol for existing positions
    for (const symbol of symbols) {
      const position = ns.stock.getPosition(symbol);
      if (position[0] > 0) { // Has shares
        const price = ns.stock.getPrice(symbol);
        const forecast = ns.stock.getForecast(symbol);
        const volatility = ns.stock.getVolatility(symbol);

        const stockPosition: StockPosition = {
          symbol,
          shares: position[0],
          avgPrice: position[1],
          currentPrice: price,
          forecast,
          volatility,
          lastUpdate: Date.now(),
          profitLoss: (price - position[1]) * position[0],
          profitLossPercent: (price - position[1]) / position[1]
        };

        positions.set(symbol, stockPosition);
        positionsLoaded++;
      }
    }

    if (debug) {
      ns.tprint(`[Stocks] Loaded ${positionsLoaded} existing positions from game`);
    }
  } catch (err) {
    ns.tprint('[Stocks] Failed to load initial data: ' + err);
  }
}

/**
 * Update stock metrics for all symbols
 */
async function updateMetrics(ns: NS): Promise<void> {
  const symbols = ns.stock.getSymbols();

  if (symbols.length === 0) {
    ns.tprint('[Stocks] ERROR: No stock symbols found. Do you have the Stock Market API?');
    return;
  }

  for (const symbol of symbols) {
    const price = ns.stock.getPrice(symbol);
    const position = ns.stock.getPosition(symbol);

    const metric: StockMetrics = {
      symbol,
      price,
      forecast: ns.stock.getForecast(symbol),
      volatility: ns.stock.getVolatility(symbol),
      askPrice: ns.stock.getAskPrice(symbol),
      bidPrice: ns.stock.getBidPrice(symbol),
      maxShares: ns.stock.getMaxShares(symbol),
      timestamp: Date.now()
    };

    metrics.set(symbol, metric);

    // Update position data if we have shares
    if (position[0] > 0) {
      const existingPos = positions.get(symbol);
      if (existingPos) {
        existingPos.currentPrice = price;
        existingPos.forecast = metric.forecast;
        existingPos.volatility = metric.volatility;
        existingPos.lastUpdate = Date.now();
        existingPos.profitLoss = (price - existingPos.avgPrice) * existingPos.shares;
        existingPos.profitLossPercent = (price - existingPos.avgPrice) / existingPos.avgPrice;
        positions.set(symbol, existingPos);
      }
    }
  }

  if (debug && symbols.length > 0) {
    ns.tprint(`[Stocks] Updated metrics for ${symbols.length} symbols`);
  }
}

/**
 * Execute trading decisions based on current metrics and positions
 */
async function executeTrading(ns: NS): Promise<void> {
  if (!strategy.enabled) return;

  const cash = ns.getServerMoneyAvailable('home');
  let totalExposure = 0;

  // Calculate total exposure
  for (const pos of positions.values()) {
    totalExposure += pos.shares * pos.currentPrice;
  }

  const totalCapital = cash + totalExposure;
  const maxExposure = totalCapital * strategy.riskManagement.maxTotalExposure;
  const minCash = Math.max(strategy.capitalAllocation.reserveRatio * totalCapital, strategy.capitalAllocation.minCashBuffer);

  // PHASE 1: Sell underperforming positions first to free up capital
  for (const metric of metrics.values()) {
    const position = positions.get(metric.symbol);

    // --- SELL LOGIC ---
    if (position && position.shares > 0) {
      const profit = (metric.price - position.avgPrice) * position.shares;
      const profitPct = (metric.price - position.avgPrice) / position.avgPrice;
      const stopLoss = profitPct <= strategy.riskManagement.stopLoss;
      const takeProfit = profitPct >= Math.abs(strategy.riskManagement.stopLoss) * strategy.riskManagement.takeProfitRatio;

      // Sell if forecast drops, hit stop loss, or take profit
      // Also sell immediately if forecast goes below 0.5 (negative expectation)
      const immediateSell = metric.forecast < 0.50;

      if (metric.forecast < strategy.sellThreshold || stopLoss || takeProfit || immediateSell) {
        const sold = ns.stock.sellStock(metric.symbol, position.shares);

        // Record transaction
        const historyEntry: StockHistoryEntry = {
          symbol: metric.symbol,
          price: metric.price,
          forecast: metric.forecast,
          volatility: metric.volatility,
          timestamp: Date.now(),
          action: 'sell',
          shares: position.shares,
          reason: immediateSell ? 'immediateSell' : stopLoss ? 'stopLoss' : takeProfit ? 'takeProfit' : 'forecast'
        };
        history.push(historyEntry);

        // Remove position
        positions.delete(metric.symbol);

        if (debug) {
          ns.tprint(`[Stocks] SOLD ${position.shares} shares of ${metric.symbol} at $${metric.price.toFixed(2)} (${historyEntry.reason}) - Profit: $${profit.toFixed(2)}`);
        }
      }
    }
  }

  // PHASE 2: Buy opportunities - prioritize by expected value
  const buyOpportunities = Array.from(metrics.values())
    .filter(m => !positions.has(m.symbol) && m.forecast > strategy.buyThreshold)
    .map(m => ({
      metric: m,
      expectedValue: (m.forecast - 0.5) * m.volatility, // Higher forecast + volatility = more profit potential
      score: m.forecast
    }))
    .sort((a, b) => b.expectedValue - a.expectedValue);

  if (debug) {
    ns.tprint(`[Stocks] Found ${buyOpportunities.length} buy opportunities (threshold: ${strategy.buyThreshold})`);
    ns.tprint(`[Stocks] Current cash: $${ns.formatNumber(cash)}, Total exposure: $${ns.formatNumber(totalExposure)}, Total capital: $${ns.formatNumber(totalCapital)}`);
    ns.tprint(`[Stocks] Max exposure allowed: $${ns.formatNumber(maxExposure)}, Min cash required: $${ns.formatNumber(minCash)}`);
    ns.tprint(`[Stocks] Available cash after buffer: $${ns.formatNumber(cash - minCash)}`);

    if (buyOpportunities.length > 0) {
      ns.tprint(`[Stocks] Top 5 opportunities:`);
      for (let i = 0; i < Math.min(5, buyOpportunities.length); i++) {
        const opp = buyOpportunities[i];
        ns.tprint(`  ${opp.metric.symbol}: forecast=${(opp.metric.forecast * 100).toFixed(2)}%, volatility=${(opp.metric.volatility * 100).toFixed(2)}%, EV=${opp.expectedValue.toFixed(4)}, price=$${ns.formatNumber(opp.metric.askPrice)}`);
      }
    }
  }

  for (const opportunity of buyOpportunities) {
    const metric = opportunity.metric;

    // Recalculate exposure after each purchase
    totalExposure = 0;
    for (const pos of positions.values()) {
      totalExposure += pos.shares * pos.currentPrice;
    }

    if (totalExposure >= maxExposure) break;

    const availableCash = ns.getServerMoneyAvailable('home') - minCash;
    const remainingExposureCapacity = maxExposure - totalExposure;

    // Dynamic position sizing: invest more in high-confidence opportunities
    const confidenceMultiplier = Math.min(2.0, (metric.forecast - 0.5) * 4); // 0.52 forecast = 1.08x, 0.60 forecast = 1.4x
    const targetPositionSize = Math.min(
      strategy.maxPositionSize * confidenceMultiplier,
      0.30 // Cap at 30% for any single position
    );

    const maxPositionValue = Math.min(
      availableCash * targetPositionSize,
      remainingExposureCapacity
    );

    // CRITICAL: Respect per-stock share limits
    const currentShares = ns.stock.getPosition(metric.symbol)[0];
    const maxSharesForStock = metric.maxShares;
    const availableSharesToBuy = maxSharesForStock - currentShares;

    // Calculate shares based on position value, but cap at available shares
    let sharesToBuy = Math.floor(maxPositionValue / metric.askPrice);
    sharesToBuy = Math.min(sharesToBuy, availableSharesToBuy);

    if (debug) {
      ns.tprint(`[Stocks] Evaluating ${metric.symbol}:`);
      ns.tprint(`  Available cash: $${ns.formatNumber(availableCash)}`);
      ns.tprint(`  Remaining exposure capacity: $${ns.formatNumber(remainingExposureCapacity)}`);
      ns.tprint(`  Target position size: ${(targetPositionSize * 100).toFixed(1)}%`);
      ns.tprint(`  Max position value: $${ns.formatNumber(maxPositionValue)}`);
      ns.tprint(`  Ask price: $${ns.formatNumber(metric.askPrice)}`);
      ns.tprint(`  Max shares for stock: ${ns.formatNumber(maxSharesForStock)}`);
      ns.tprint(`  Currently owned: ${ns.formatNumber(currentShares)}`);
      ns.tprint(`  Available to buy: ${ns.formatNumber(availableSharesToBuy)}`);
      ns.tprint(`  Shares to buy (after limits): ${ns.formatNumber(sharesToBuy)}`);
      ns.tprint(`  Total cost: $${ns.formatNumber(sharesToBuy * metric.askPrice)}`);
      ns.tprint(`  Can afford: ${availableCash >= sharesToBuy * metric.askPrice}`);
    }

    if (sharesToBuy > 0 && availableCash >= sharesToBuy * metric.askPrice) {
      const bought = ns.stock.buyStock(metric.symbol, sharesToBuy);

      if (bought > 0) {
        const newPosition: StockPosition = {
          symbol: metric.symbol,
          shares: bought,
          avgPrice: metric.askPrice,
          currentPrice: metric.price,
          forecast: metric.forecast,
          volatility: metric.volatility,
          lastUpdate: Date.now(),
          profitLoss: 0,
          profitLossPercent: 0
        };

        positions.set(metric.symbol, newPosition);

        // Record transaction
        const historyEntry: StockHistoryEntry = {
          symbol: metric.symbol,
          price: metric.askPrice,
          forecast: metric.forecast,
          volatility: metric.volatility,
          timestamp: Date.now(),
          action: 'buy',
          shares: bought,
          reason: 'highExpectedValue'
        };
        history.push(historyEntry);

        if (debug) {
          ns.tprint(`[Stocks] BOUGHT ${bought} shares of ${metric.symbol} at $${metric.askPrice.toFixed(2)} (forecast: ${(metric.forecast * 100).toFixed(1)}%, EV: ${opportunity.expectedValue.toFixed(4)})`);
        }
      } else {
        if (debug) {
          // Check why purchase failed
          const maxShares = ns.stock.getMaxShares(metric.symbol);
          const currentShares = ns.stock.getPosition(metric.symbol)[0];
          const purchaseLimit = maxShares - currentShares;

          ns.tprint(`[Stocks] Failed to buy ${metric.symbol} - bought 0 shares (requested ${sharesToBuy})`);
          ns.tprint(`  Max shares for this stock: ${ns.formatNumber(maxShares)}`);
          ns.tprint(`  Currently owned: ${ns.formatNumber(currentShares)}`);
          ns.tprint(`  Purchase limit: ${ns.formatNumber(purchaseLimit)}`);
          ns.tprint(`  Requested: ${ns.formatNumber(sharesToBuy)}`);

          if (sharesToBuy > purchaseLimit) {
            ns.tprint(`  ⚠️ Requesting more shares than allowed!`);
          }

          // Check API access
          if (!ns.stock.hasWSEAccount()) {
            ns.tprint(`  ❌ ERROR: No WSE Account! Purchase it first ($200m)`);
          }
        }
      }
    } else {
      if (debug) {
        if (sharesToBuy <= 0) {
          const maxSharesForStock = metric.maxShares;
          const currentShares = ns.stock.getPosition(metric.symbol)[0];
          if (currentShares >= maxSharesForStock) {
            ns.tprint(`[Stocks] Skipping ${metric.symbol} - already at max shares (${ns.formatNumber(currentShares)}/${ns.formatNumber(maxSharesForStock)})`);
          } else {
            ns.tprint(`[Stocks] Skipping ${metric.symbol} - position value too small for at least 1 share (maxPositionValue=${ns.formatNumber(maxPositionValue)}, askPrice=${ns.formatNumber(metric.askPrice)})`);
          }
        } else {
          ns.tprint(`[Stocks] Skipping ${metric.symbol} - insufficient cash (need ${ns.formatNumber(sharesToBuy * metric.askPrice)}, have ${ns.formatNumber(availableCash)})`);
        }
      }
    }
  }

  // Trim history to keep memory usage reasonable (keep last 100 entries)
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }
}

/**
 * Update the status display when script is being tailed
 */
function updateStatusDisplay(ns: NS): void {
  // Clear the log to create a fresh status display
  ns.clearLog();

  // Simple test first
  ns.print("Stock Trading System Status");
  ns.print("Running at: " + new Date().toLocaleTimeString());
  ns.print("");

  const cash = ns.getServerMoneyAvailable('home');
  let totalValue = 0;
  let totalProfitLoss = 0;
  let totalInvested = 0;

  // Calculate portfolio totals
  for (const pos of positions.values()) {
    const positionValue = pos.shares * pos.currentPrice;
    const invested = pos.shares * pos.avgPrice;
    totalValue += positionValue;
    totalInvested += invested;
    totalProfitLoss += pos.profitLoss;
  }

  const totalPortfolio = cash + totalValue;
  const profitPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  // Header
  ns.print("═══════════════════════════════════════════════════════════════");
  ns.print("                    STOCK TRADING SYSTEM                      ");
  ns.print("═══════════════════════════════════════════════════════════════");
  ns.print("");

  // Portfolio Summary
  ns.print("📊 PORTFOLIO OVERVIEW");
  ns.print("─────────────────────────────────────────────────────────────");
  ns.print(`💰 Cash Available:     $${formatMoney(cash)}`);
  ns.print(`📈 Stock Positions:    $${formatMoney(totalValue)}`);
  ns.print(`💼 Total Portfolio:    $${formatMoney(totalPortfolio)}`);
  ns.print(`${totalProfitLoss >= 0 ? '🟢' : '🔴'} P&L:               $${formatMoney(totalProfitLoss)} (${profitPercent.toFixed(2)}%)`);
  ns.print("");

  // Active Positions
  if (positions.size > 0) {
    ns.print("📈 ACTIVE POSITIONS");
    ns.print("─────────────────────────────────────────────────────────────");

    // Sort positions by profit/loss percentage
    const sortedPositions = Array.from(positions.values()).sort((a, b) => b.profitLossPercent - a.profitLossPercent);

    for (const pos of sortedPositions.slice(0, 8)) { // Show top 8 positions
      const value = pos.shares * pos.currentPrice;
      const pnlIcon = pos.profitLoss >= 0 ? '🟢' : '🔴';
      const forecastIcon = pos.forecast > 0.55 ? '📈' : pos.forecast < 0.45 ? '📉' : '➡️';

      ns.print(`${pnlIcon} ${pos.symbol.padEnd(6)} ${forecastIcon} ${formatShares(pos.shares).padStart(8)} @ $${pos.currentPrice.toFixed(2).padStart(8)} = $${formatMoney(value).padStart(10)} (${(pos.profitLossPercent * 100).toFixed(1)}%)`);
    }

    if (positions.size > 8) {
      ns.print(`... and ${positions.size - 8} more positions`);
    }
  } else {
    ns.print("📈 ACTIVE POSITIONS");
    ns.print("─────────────────────────────────────────────────────────────");
    ns.print("No active positions");
  }
  ns.print("");

  // Recent Activity
  if (history.length > 0) {
    ns.print("📋 RECENT ACTIVITY");
    ns.print("─────────────────────────────────────────────────────────────");

    const recentHistory = history.slice(-5).reverse(); // Last 5 trades, newest first
    for (const trade of recentHistory) {
      const actionIcon = trade.action === 'buy' ? '🟢 BUY ' : '🔴 SELL';
      const time = new Date(trade.timestamp).toLocaleTimeString();
      const value = trade.shares * trade.price;

      ns.print(`${actionIcon} ${trade.symbol.padEnd(6)} ${formatShares(trade.shares).padStart(8)} @ $${trade.price.toFixed(2).padStart(8)} = $${formatMoney(value).padStart(10)} [${time}]`);
    }
  } else {
    ns.print("📋 RECENT ACTIVITY");
    ns.print("─────────────────────────────────────────────────────────────");
    ns.print("No recent trades");
  }
  ns.print("");

  // Market Overview
  ns.print("🎯 MARKET OPPORTUNITIES");
  ns.print("─────────────────────────────────────────────────────────────");

  // Find top buy candidates (high forecast, not owned)
  const buyTargets = Array.from(metrics.values())
    .filter(m => !positions.has(m.symbol) && m.forecast > strategy.buyThreshold)
    .sort((a, b) => b.forecast - a.forecast)
    .slice(0, 3);

  if (buyTargets.length > 0) {
    for (const target of buyTargets) {
      ns.print(`📈 ${target.symbol.padEnd(6)} Forecast: ${(target.forecast * 100).toFixed(1)}% Price: $${target.price.toFixed(2).padStart(8)} Vol: ${(target.volatility * 100).toFixed(1)}%`);
    }
  } else {
    ns.print("No strong buy signals detected");
  }

  // Trading Configuration
  ns.print("");
  ns.print("⚙️  STRATEGY CONFIG");
  ns.print("─────────────────────────────────────────────────────────────");
  ns.print(`Status: ${strategy.enabled ? '🟢 ACTIVE' : '🔴 DISABLED'} | Buy: >${(strategy.buyThreshold * 100).toFixed(0)}% | Sell: <${(strategy.sellThreshold * 100).toFixed(0)}% | Max Pos: ${(strategy.maxPositionSize * 100).toFixed(0)}%`);
  ns.print(`Debug: ${debug ? 'ON' : 'OFF'} | Positions: ${positions.size} | History: ${history.length} | Uptime: ${formatUptime(Date.now() - startTime)}`);

  ns.print("");
  ns.print("Use 'tail stocks.js' to view this status | Ctrl+C to stop");
}

/**
 * Format money values for display
 */
function formatMoney(amount: number): string {
  if (amount >= 1e12) return (amount / 1e12).toFixed(2) + 't';
  if (amount >= 1e9) return (amount / 1e9).toFixed(2) + 'b';
  if (amount >= 1e6) return (amount / 1e6).toFixed(2) + 'm';
  if (amount >= 1e3) return (amount / 1e3).toFixed(2) + 'k';
  return amount.toFixed(2);
}

/**
 * Format share counts for display
 */
function formatShares(shares: number): string {
  if (shares >= 1e9) return (shares / 1e9).toFixed(1) + 'b';
  if (shares >= 1e6) return (shares / 1e6).toFixed(1) + 'm';
  if (shares >= 1e3) return (shares / 1e3).toFixed(1) + 'k';
  return shares.toString();
}

/**
 * Format uptime for display
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}