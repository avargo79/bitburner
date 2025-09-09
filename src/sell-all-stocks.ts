import { NS } from '@ns';

// Quick script to sell all stocks and kill stocks.js before aug reset
export async function main(ns: NS): Promise<void> {
  ns.tprint("📈 Stock liquidation script starting...");
  
  // Step 1: Kill stocks.js if running
  const runningScripts = ns.ps();
  const stocksScript = runningScripts.find(script => script.filename === 'stocks.js');
  
  if (stocksScript) {
    ns.tprint(`🔫 Killing stocks.js (PID: ${stocksScript.pid})...`);
    ns.kill(stocksScript.pid);
    await ns.sleep(500); // Give it time to stop
    ns.tprint("✅ stocks.js terminated");
  } else {
    ns.tprint("ℹ️  stocks.js not currently running");
  }
  
  // Step 2: Get all stock symbols
  const stockSymbols = ns.stock.getSymbols();
  
  if (stockSymbols.length === 0) {
    ns.tprint("ℹ️  No stocks available to trade");
    return;
  }
  
  let totalValue = 0;
  let stocksSold = 0;
  
  // Step 3: Sell all stocks
  for (const symbol of stockSymbols) {
    const position = ns.stock.getPosition(symbol);
    const [longShares, longPrice, shortShares, shortPrice] = position;
    
    // Sell long positions
    if (longShares > 0) {
      const salePrice = ns.stock.sellStock(symbol, longShares);
      if (salePrice > 0) {
        const profit = (salePrice - longPrice) * longShares;
        totalValue += salePrice * longShares;
        stocksSold++;
        ns.tprint(`📤 Sold ${longShares.toLocaleString()} ${symbol} @ $${salePrice.toFixed(2)} (P/L: $${profit.toLocaleString()})`);
      }
    }
    
    // Sell short positions
    if (shortShares > 0) {
      const salePrice = ns.stock.sellShort(symbol, shortShares);
      if (salePrice > 0) {
        const profit = (shortPrice - salePrice) * shortShares;
        totalValue += salePrice * shortShares;
        stocksSold++;
        ns.tprint(`📤 Covered ${shortShares.toLocaleString()} ${symbol} @ $${salePrice.toFixed(2)} (P/L: $${profit.toLocaleString()})`);
      }
    }
  }
  
  // Step 4: Summary
  if (stocksSold > 0) {
    ns.tprint(`✅ Liquidated ${stocksSold} stock positions`);
    ns.tprint(`💰 Total proceeds: $${totalValue.toLocaleString()}`);
    ns.tprint(`💵 Current money: $${ns.getPlayer().money.toLocaleString()}`);
  } else {
    ns.tprint("ℹ️  No stock positions to liquidate");
  }
  
  ns.tprint("🏁 Stock liquidation complete - ready for aug reset!");
}