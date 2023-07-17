//
//Stock market bot for bitburner, primary written by steamid / Meng - https://danielyxie.github.io/bitburner/
// Modified by Tonalnan https://steamcommunity.com/profiles/76561198152627199/

import { NS } from "../NetscriptDefinitions";

/** @param {NS} ns **/
export async function main(ns: NS) {
	ns.disableLog("sleep");
	ns.disableLog("getServerMoneyAvailable");
	const stockSymbols = ns.stock.getSymbols(); // all symbols
	const portfolio: Stock[] = []; // init portfolio

	//~~~~~~~~~~~~~~~~~~~~~You can edit these~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	const FORECAST_THRESH = 0.6; // buy above this forecast value, 0.6=60% (0.6 default)
	const MIN_CASH = 200000; // minimum cash to keep (0 default)
	const SELL_THRESH = 0.5; // sell belove this forecast value, 0.5=50% (0.5 default)
	const SPEND_RATIO = 1; // spends up to this ratio of your total money to buy stocks (minus your min_cash set), 1=100% (1 default)
	const MIN_SPEND = 100000000; // minimum available money to buy stocks, limited due to 100k commission fees, 100000000=100m (100000000 default)
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	ns.print("Starting run - Do we own any stocks?"); //Finds and adds any stocks we already own
	for (const stock of stockSymbols) {
		const pos = ns.stock.getPosition(stock);
		if (pos[0] > 0) {
			portfolio.push({ sym: stock, value: pos[1], shares: pos[0] });
			ns.print("Detected: " + stock + ", quant: " + pos[0] + " @ " + pos[1]);
		}
	}

	if (ns.getServerMoneyAvailable("home") < MIN_CASH) {
		ns.print("Stockbot has no money to play with!");
		ns.print("Stockbot will nap for 5 mins while you make some money");
		await ns.sleep(300000);
	}

	while (true) {
		const goodoffers: StockOffer[] = [];
		let lenght = 0;
		for (const stock of stockSymbols) {
			// for each stock symbol
			if (portfolio.findIndex((obj) => obj.sym === stock) !== -1) {
				//if we own the stock...
				if (ns.stock.getForecast(stock) < SELL_THRESH) {
					//...look at forecast to decide sell it
					sellStock(stock);
				}
			}
			if (ns.stock.getForecast(stock) >= FORECAST_THRESH) {
				//if the forecast is better than threshold then...
				goodoffers.push({ symbol: stock, value: (ns.stock.getForecast(stock) - 0.5) * ns.stock.getVolatility(stock) }); //...record it to stock massive with information about profitability
				lenght += 1;
			}
		}

		goodoffers.sort((a, b) => b.value - a.value); //standart js-optimized sort of quicksort, google for more info, do the same as bubble sort below

		for (let i = 0; i < lenght; i++) {
			//buy stocks from most profitable to less
			if ((ns.getServerMoneyAvailable("home") - MIN_CASH - 100000) * SPEND_RATIO > MIN_SPEND && ns.stock.getMaxShares(goodoffers[i].symbol) > ns.stock.getPosition(goodoffers[i].symbol)[0]) {
				buyStock(goodoffers[i].symbol);
			}
		}

		await ns.sleep(6000); //wait for stocks update
	}

	function buyStock(stock: string) {
		const stockPrice = ns.stock.getAskPrice(stock); // Get the stockprice
		const shares = stockBuyQuantCalc(stockPrice, stock); // calculate the shares to buy using stockBuyQuantCalc
		ns.stock.buyStock(stock, shares);
		ns.print("Bought: " + stock + ", quant: " + Math.round(shares) + " @ $" + Math.round(stockPrice));
		portfolio.push({ sym: stock, value: stockPrice, shares: shares }); //store the purchase info in portfolio
	}

	function sellStock(stock: string) {
		const position = ns.stock.getPosition(stock);
		const stockPrice = ns.stock.getAskPrice(stock);
		const i = portfolio.findIndex((obj) => obj.sym === stock); //Find the stock info in the portfolio
		ns.print("SOLD: " + stock + ", quant: " + Math.round(portfolio[i].shares) + " @ $" + Math.round(stockPrice) + " - bought at $" + Math.round(portfolio[i].value));
		portfolio.splice(i, 1); // Remove the stock from portfolio
		ns.stock.sellStock(stock, position[0]);
	}

	function stockBuyQuantCalc(stockPrice: number, stock: string) {
		// Calculates how many shares to buy
		const playerMoney = ns.getServerMoneyAvailable("home") - MIN_CASH - 100000;
		const maxSpend = playerMoney * SPEND_RATIO;
		const calcShares = Math.floor(maxSpend / stockPrice);
		const position = ns.stock.getPosition(stock);
		const avShares = ns.stock.getMaxShares(stock) - position[0];
		if (calcShares > avShares) {
			return avShares;
		} else {
			return calcShares;
		}
	}
}

interface Stock {
	sym: string;
	value: number;
	shares: number;
}

interface StockOffer {
	symbol: string;
	value: number;
}
