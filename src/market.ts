// https://github.com/chrisrabe/bitburner-automation/blob/main/_stable/diamond-hands.js

import { NS } from "../NetscriptDefinitions";
import { formatMoney } from "./utils";

const fees = 100000; // 100k commission
const tradeFees = 2 * fees; // buy + sell transactions
const tickDuration = 5 * 1000; // ~4s offline, ~6s online (5s compromise)

/** @param {NS} ns **/
export async function main(ns: NS) {
	ns.disableLog("ALL");

	while (true) {
		let overallValue = 0;
		const stocks = getStocks(ns);
		overallValue = takeTendies(ns, stocks, overallValue);
		yolo(ns, stocks);
		ns.print("Stock value: " + formatMoney(overallValue));
		ns.print("");
		// @TODO - Extend for market manipulation
		// - hack -> makes stock more likely to go down
		// - grow -> makes stock more likely to go up
		await ns.sleep(tickDuration);
	}
}

interface IStock {
	symbol: string;
	longShares: number;
	longPrice: number;
	shortShares: number;
	shortPrice: number;
	forecast: number;
	volatility: number;
	askPrice: number;
	bidPrice: number;
	maxShares: number;
	profit: number;
	cost: number;
	shares: number;
	profitPotential: number;
	summary: string;
}

function getStocks(ns: NS) {
	const stockSymbols = ns.stock.getSymbols();
	const stocks: IStock[] = [];
	for (const symbol of stockSymbols) {
		const pos = ns.stock.getPosition(symbol);
		const stock: IStock = {
			symbol,
			longShares: pos[0],
			longPrice: pos[1],
			shortShares: pos[2],
			shortPrice: pos[3],
			forecast: ns.stock.getForecast(symbol),
			volatility: ns.stock.getVolatility(symbol),
			askPrice: ns.stock.getAskPrice(symbol),
			bidPrice: ns.stock.getBidPrice(symbol),
			maxShares: ns.stock.getMaxShares(symbol),
			profit: 0,
			cost: 0,
			shares: 0,
			profitPotential: 0,
			summary: "",
		};
		const longProfit = stock.longShares * (stock.bidPrice - stock.longPrice) - tradeFees;
		const shortProfit = stock.shortPrice * (stock.shortPrice - stock.askPrice) - tradeFees;
		stock.profit = longProfit + shortProfit;

		const longCost = stock.longShares * stock.longPrice;
		const shortCost = stock.shortShares * stock.shortPrice;
		stock.cost = longCost + shortCost;
		// 0.6 -> 0.1 (10% - LONG)
		// 0.4 -> 0.1 (10% - SHORT)
		const profitChance = Math.abs(stock.forecast - 0.5); // chance to make profit for either positions
		stock.profitPotential = stock.volatility * profitChance; // potential to get the price movement

		stock.summary = `${stock.symbol}: ${stock.forecast.toFixed(3)} +/- ${stock.volatility.toFixed(3)}`;
		stocks.push(stock);
	}

	// Sort by profit potential
	return stocks.sort((a, b) => b.profitPotential - a.profitPotential);
}

function takeLongTendies(ns: NS, stock: IStock, overallValue: number) {
	if (stock.forecast > 0.5) {
		// HOLD
		const curValue = stock.cost + stock.profit;
		const roi = ns.formatNumber(100 * (stock.profit / stock.cost), 2);
		ns.print(`INFO\t ${stock.summary} LONG ${formatMoney(curValue)} ${roi}%`);
		overallValue += curValue;
	} else {
		// Take tendies!
		const salePrice = ns.stock.sellStock(stock.symbol, stock.longShares);
		const saleTotal = salePrice * stock.longShares;
		const saleCost = stock.longPrice * stock.longShares;
		const saleProfit = saleTotal - saleCost - tradeFees;
		stock.shares = 0;
		ns.print(`WARN\t${stock.summary} SOLD for ${formatMoney(saleProfit)} profit`);
	}

	return overallValue;
}

function takeTendies(ns: NS, stocks: IStock[], overallValue: number) {
	for (const stock of stocks) {
		if (stock.longShares > 0) {
			overallValue = takeLongTendies(ns, stock, overallValue);
		}
		// @TODO - Implement takeShortTendies when we have access (BN8)
	}
	return overallValue;
}

function yolo(ns: NS, stocks: IStock[]) {
	const riskThresh = 20 * fees;
	for (const stock of stocks) {
		const money = ns.getPlayer().money * 0.25; //Limit the money used to 25% of player funds
		if (stock.forecast > 0.55) {
			if (money > riskThresh) {
				const sharesWeCanBuy = Math.floor((money - fees) / stock.askPrice);
				const sharesToBuy = Math.min(stock.maxShares, sharesWeCanBuy);
				if (ns.stock.buyStock(stock.symbol, sharesToBuy) > 0) {
					ns.print(`WARN\t${stock.summary}\t- LONG @ ${formatMoney(sharesToBuy)}`);
				}
			}
		}
		// @TODO sell short when we have access (BN8)
	}
}
