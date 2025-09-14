import { ReactGamePage } from '/lib/react-game-page';
import { ComponentSearchCriteria } from '/navigator-react-types';

export interface StockInfo {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    shares: number;
    maxShares: number;
    forecast: number;
    volatility: number;
    askPrice: number;
    bidPrice: number;
    position: 'Long' | 'Short' | 'None';
}

export interface StockPortfolio {
    totalValue: number;
    totalGain: number;
    totalGainPercent: number;
    stocks: StockHolding[];
}

export interface StockHolding {
    symbol: string;
    name: string;
    shares: number;
    avgPrice: number;
    currentPrice: number;
    totalValue: number;
    gain: number;
    gainPercent: number;
    position: 'Long' | 'Short';
}

export interface StockTransaction {
    symbol: string;
    type: 'buy' | 'sell';
    position: 'Long' | 'Short';
    shares: number;
    price: number;
    total: number;
    timestamp: Date;
}

export class ReactStockMarketPage extends ReactGamePage {
    protected getPageIdentifier(): string {
        return 'stockmarket';
    }

    protected getExpectedUrl(): string {
        return '/stockmarket';
    }

    // Implement required abstract methods
    async navigate(params?: any): Promise<any> {
        try {
            return { success: true, message: 'Navigated to stock market page' };
        } catch (error) {
            return { success: false, error: 'Failed to navigate to stock market page' };
        }
    }

    async isOnPage(): Promise<boolean> {
        try {
            const components = await this.findComponents('StockMarket');
            return components.length > 0;
        } catch (error) {
            return false;
        }
    }

    async getPrimaryComponent(): Promise<any> {
        try {
            const components = await this.findComponents('StockMarket');
            return components.length > 0 ? components[0] : null;
        } catch (error) {
            return null;
        }
    }

    async getAllStocks(): Promise<StockInfo[]> {
        const stocks: StockInfo[] = [];

        try {
            await this.ensureOnPage();
            await this.waitForPageLoad();

            const stockRows = await this.findComponents({
                role: 'row',
                timeout: 3000
            });

            if (stockRows.length === 0) {
                const stockElements = await this.findComponents({
                    className: /stock|ticker/i,
                    timeout: 3000
                });
                stockRows.push(...stockElements);
            }

            for (const row of stockRows) {
                const stockElement = this.toElement(row);
                if (stockElement) {
                    const stock = await this.parseStock(stockElement);
                    if (stock) {
                        stocks.push(stock);
                    }
                }
            }

            return stocks;

        } catch (error) {
            this.logError(`Failed to get all stocks: ${error}`);
            return [];
        }
    }

    async getStockBySymbol(symbol: string): Promise<StockInfo | null> {
        try {
            const stockElement = await this.findComponent({
                text: new RegExp(symbol, 'i'),
                timeout: 2000
            });

            if (!stockElement) {
                this.logError(`Stock ${symbol} not found`);
                return null;
            }

            const stockElementObj = this.toElement(stockElement);
            if (!stockElementObj) {
                return null;
            }

            return await this.parseStock(stockElementObj);

        } catch (error) {
            this.logError(`Failed to get stock ${symbol}: ${error}`);
            return null;
        }
    }

    async buyStock(symbol: string, shares: number): Promise<boolean> {
        try {
            const stockElement = await this.findComponent({
                text: new RegExp(symbol, 'i'),
                timeout: 2000
            });

            if (!stockElement) {
                this.logError(`Stock ${symbol} not found`);
                return false;
            }

            const buyButton = await this.findComponent({
                text: /buy/i,
                tag: 'button',
                ancestor: stockElement,
                timeout: 2000
            });

            if (!buyButton) {
                this.logError(`Buy button for ${symbol} not found`);
                return false;
            }

            await this.clickElement(buyButton);
            await this.waitForStableDOM();

            const sharesInput = await this.findComponent({
                tag: 'input',
                type: 'number',
                timeout: 2000
            });

            if (!sharesInput) {
                this.logError('Shares input not found');
                return false;
            }

            await this.typeText(sharesInput, shares.toString());

            const confirmButton = await this.findComponent({
                text: /confirm|purchase/i,
                tag: 'button',
                timeout: 2000
            });

            if (!confirmButton) {
                this.logError('Confirm button not found');
                return false;
            }

            await this.clickElement(confirmButton);
            await this.waitForStableDOM();

            return true;

        } catch (error) {
            this.logError(`Failed to buy ${shares} shares of ${symbol}: ${error}`);
            return false;
        }
    }

    async sellStock(symbol: string, shares: number): Promise<boolean> {
        try {
            const stockElement = await this.findComponent({
                text: new RegExp(symbol, 'i'),
                timeout: 2000
            });

            if (!stockElement) {
                this.logError(`Stock ${symbol} not found`);
                return false;
            }

            const sellButton = await this.findComponent({
                text: /sell/i,
                tag: 'button',
                ancestor: stockElement,
                timeout: 2000
            });

            if (!sellButton) {
                this.logError(`Sell button for ${symbol} not found`);
                return false;
            }

            await this.clickElement(sellButton);
            await this.waitForStableDOM();

            const sharesInput = await this.findComponent({
                tag: 'input',
                type: 'number',
                timeout: 2000
            });

            if (!sharesInput) {
                this.logError('Shares input not found');
                return false;
            }

            await this.typeText(sharesInput, shares.toString());

            const confirmButton = await this.findComponent({
                text: /confirm|sell/i,
                tag: 'button',
                timeout: 2000
            });

            if (!confirmButton) {
                this.logError('Confirm button not found');
                return false;
            }

            await this.clickElement(confirmButton);
            await this.waitForStableDOM();

            return true;

        } catch (error) {
            this.logError(`Failed to sell ${shares} shares of ${symbol}: ${error}`);
            return false;
        }
    }

    async sellAllStock(symbol: string): Promise<boolean> {
        try {
            const stockElement = await this.findComponent({
                text: new RegExp(symbol, 'i'),
                timeout: 2000
            });

            if (!stockElement) {
                this.logError(`Stock ${symbol} not found`);
                return false;
            }

            const sellAllButton = await this.findComponent({
                text: /sell.*all|max/i,
                tag: 'button',
                ancestor: stockElement,
                timeout: 2000
            });

            if (sellAllButton) {
                await this.clickElement(sellAllButton);
                await this.waitForStableDOM();
                return true;
            }

            const stockElementObj = this.toElement(stockElement);
            if (!stockElementObj) {
                return false;
            }

            const stock = await this.parseStock(stockElementObj);
            if (stock && stock.shares > 0) {
                return await this.sellStock(symbol, stock.shares);
            }

            return false;

        } catch (error) {
            this.logError(`Failed to sell all shares of ${symbol}: ${error}`);
            return false;
        }
    }

    async getPortfolio(): Promise<StockPortfolio> {
        try {
            const holdings: StockHolding[] = [];
            let totalValue = 0;
            let totalGain = 0;

            const portfolioButton = await this.findComponent({
                text: /portfolio|holdings/i,
                tag: 'button',
                timeout: 2000
            });

            if (portfolioButton) {
                await this.clickElement(portfolioButton);
                await this.waitForStableDOM();
            }

            const holdingElements = await this.findComponents({
                className: /holding|position/i,
                timeout: 3000
            });

            for (const element of holdingElements) {
                const holdingElement = this.toElement(element);
                if (holdingElement) {
                    const holding = await this.parseHolding(holdingElement);
                    if (holding) {
                        holdings.push(holding);
                        totalValue += holding.totalValue;
                        totalGain += holding.gain;
                    }
                }
            }

            const totalGainPercent = totalValue > 0 ? (totalGain / (totalValue - totalGain)) * 100 : 0;

            return {
                totalValue,
                totalGain,
                totalGainPercent,
                stocks: holdings
            };

        } catch (error) {
            this.logError(`Failed to get portfolio: ${error}`);
            return {
                totalValue: 0,
                totalGain: 0,
                totalGainPercent: 0,
                stocks: []
            };
        }
    }

    async shortStock(symbol: string, shares: number): Promise<boolean> {
        try {
            const stockElement = await this.findComponent({
                text: new RegExp(symbol, 'i'),
                timeout: 2000
            });

            if (!stockElement) {
                this.logError(`Stock ${symbol} not found`);
                return false;
            }

            const shortButton = await this.findComponent({
                text: /short/i,
                tag: 'button',
                ancestor: stockElement,
                timeout: 2000
            });

            if (!shortButton) {
                this.logError(`Short button for ${symbol} not found`);
                return false;
            }

            await this.clickElement(shortButton);
            await this.waitForStableDOM();

            const sharesInput = await this.findComponent({
                tag: 'input',
                type: 'number',
                timeout: 2000
            });

            if (!sharesInput) {
                this.logError('Shares input not found');
                return false;
            }

            await this.typeText(sharesInput, shares.toString());

            const confirmButton = await this.findComponent({
                text: /confirm|short/i,
                tag: 'button',
                timeout: 2000
            });

            if (!confirmButton) {
                this.logError('Confirm button not found');
                return false;
            }

            await this.clickElement(confirmButton);
            await this.waitForStableDOM();

            return true;

        } catch (error) {
            this.logError(`Failed to short ${shares} shares of ${symbol}: ${error}`);
            return false;
        }
    }

    async coverShortPosition(symbol: string, shares: number): Promise<boolean> {
        try {
            const stockElement = await this.findComponent({
                text: new RegExp(symbol, 'i'),
                timeout: 2000
            });

            if (!stockElement) {
                this.logError(`Stock ${symbol} not found`);
                return false;
            }

            const coverButton = await this.findComponent({
                text: /cover/i,
                tag: 'button',
                ancestor: stockElement,
                timeout: 2000
            });

            if (!coverButton) {
                this.logError(`Cover button for ${symbol} not found`);
                return false;
            }

            await this.clickElement(coverButton);
            await this.waitForStableDOM();

            const sharesInput = await this.findComponent({
                tag: 'input',
                type: 'number',
                timeout: 2000
            });

            if (!sharesInput) {
                this.logError('Shares input not found');
                return false;
            }

            await this.typeText(sharesInput, shares.toString());

            const confirmButton = await this.findComponent({
                text: /confirm|cover/i,
                tag: 'button',
                timeout: 2000
            });

            if (!confirmButton) {
                this.logError('Confirm button not found');
                return false;
            }

            await this.clickElement(confirmButton);
            await this.waitForStableDOM();

            return true;

        } catch (error) {
            this.logError(`Failed to cover ${shares} shares of ${symbol}: ${error}`);
            return false;
        }
    }

    async getTopPerformers(count: number = 5): Promise<StockInfo[]> {
        const stocks = await this.getAllStocks();
        return stocks
            .filter(stock => stock.changePercent > 0)
            .sort((a, b) => b.changePercent - a.changePercent)
            .slice(0, count);
    }

    async getTopLosers(count: number = 5): Promise<StockInfo[]> {
        const stocks = await this.getAllStocks();
        return stocks
            .filter(stock => stock.changePercent < 0)
            .sort((a, b) => a.changePercent - b.changePercent)
            .slice(0, count);
    }

    async getMostVolatile(count: number = 5): Promise<StockInfo[]> {
        const stocks = await this.getAllStocks();
        return stocks
            .sort((a, b) => b.volatility - a.volatility)
            .slice(0, count);
    }

    private async parseStock(element: Element): Promise<StockInfo | null> {
        try {
            const textContent = this.extractTextContent(element);
            
            const symbolMatch = textContent.match(/([A-Z]{3,4})/);
            const symbol = symbolMatch?.[1] || 'UNK';

            const nameMatch = textContent.match(/([A-Za-z\s&-]+)(?:\s+[A-Z]{3,4}|\s+\$)/);
            const name = nameMatch?.[1]?.trim() || 'Unknown';

            const priceMatch = textContent.match(/\$([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const price = this.parseNumber(priceMatch?.[1] || '0');

            const changeMatch = textContent.match(/(\+|\-)?\$?([0-9,]+(?:\.[0-9]+)?[kmb]?)\s*\((\+|\-)?([0-9.]+)%\)/i);
            const change = this.parseNumber(changeMatch?.[2] || '0') * (changeMatch?.[1] === '-' ? -1 : 1);
            const changePercent = parseFloat(changeMatch?.[4] || '0') * (changeMatch?.[3] === '-' ? -1 : 1);

            const sharesMatch = textContent.match(/shares.*?([0-9,]+)/i);
            const shares = parseInt(sharesMatch?.[1]?.replace(/,/g, '') || '0');

            const maxSharesMatch = textContent.match(/max.*?([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const maxShares = this.parseNumber(maxSharesMatch?.[1] || '0');

            const forecastMatch = textContent.match(/forecast.*?([0-9.]+)%/i);
            const forecast = parseFloat(forecastMatch?.[1] || '50');

            const volatilityMatch = textContent.match(/volatility.*?([0-9.]+)%/i);
            const volatility = parseFloat(volatilityMatch?.[1] || '0');

            const askMatch = textContent.match(/ask.*?\$([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const askPrice = this.parseNumber(askMatch?.[1] || price.toString());

            const bidMatch = textContent.match(/bid.*?\$([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const bidPrice = this.parseNumber(bidMatch?.[1] || price.toString());

            let position: 'Long' | 'Short' | 'None' = 'None';
            if (textContent.toLowerCase().includes('long')) {
                position = 'Long';
            } else if (textContent.toLowerCase().includes('short')) {
                position = 'Short';
            }

            return {
                symbol,
                name,
                price,
                change,
                changePercent,
                shares,
                maxShares,
                forecast,
                volatility,
                askPrice,
                bidPrice,
                position
            };

        } catch (error) {
            this.logError(`Failed to parse stock: ${error}`);
            return null;
        }
    }

    private async parseHolding(element: Element): Promise<StockHolding | null> {
        try {
            const textContent = this.extractTextContent(element);
            
            const symbolMatch = textContent.match(/([A-Z]{3,4})/);
            const symbol = symbolMatch?.[1] || 'UNK';

            const nameMatch = textContent.match(/([A-Za-z\s&-]+)(?:\s+[A-Z]{3,4}|\s+[0-9])/);
            const name = nameMatch?.[1]?.trim() || 'Unknown';

            const sharesMatch = textContent.match(/([0-9,]+)\s*shares/i);
            const shares = parseInt(sharesMatch?.[1]?.replace(/,/g, '') || '0');

            const avgPriceMatch = textContent.match(/avg.*?\$([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const avgPrice = this.parseNumber(avgPriceMatch?.[1] || '0');

            const currentPriceMatch = textContent.match(/current.*?\$([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const currentPrice = this.parseNumber(currentPriceMatch?.[1] || '0');

            const totalValue = shares * currentPrice;
            const gain = totalValue - (shares * avgPrice);
            const gainPercent = avgPrice > 0 ? (gain / (shares * avgPrice)) * 100 : 0;

            const position: 'Long' | 'Short' = textContent.toLowerCase().includes('short') ? 'Short' : 'Long';

            return {
                symbol,
                name,
                shares,
                avgPrice,
                currentPrice,
                totalValue,
                gain,
                gainPercent,
                position
            };

        } catch (error) {
            this.logError(`Failed to parse holding: ${error}`);
            return null;
        }
    }
}