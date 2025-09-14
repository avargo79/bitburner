import { ReactGamePage } from '/lib/react-game-page';
import { ReactElementFinder } from '/lib/react-element-finder';
import { GameSection, NavigationParams, NavigationResult, ReactComponentInfo } from '/lib/navigator-react-types';

/**
 * React-powered Stats page navigation
 * Handles player statistics and character information
 */
export class ReactStatsPage extends ReactGamePage {
    private elementFinder: ReactElementFinder;

    constructor() {
        super();
        this.elementFinder = new ReactElementFinder();
    }

    async navigate(params?: NavigationParams): Promise<NavigationResult> {
        try {
            // Look for Stats navigation tab
            const statsNav = await this.elementFinder.findByCriteria({
                textContent: 'Stats',
                interactive: true,
                muiType: 'Tab',
                limit: 1
            });

            if (statsNav.length === 0) {
                // Fallback: look for stats button or link
                const statsButton = await this.elementFinder.findByCriteria({
                    textContent: 'Stats',
                    interactive: true,
                    sortBy: 'muiPriority',
                    limit: 1
                });

                if (statsButton.length === 0) {
                    return this.createResult(false, 'Stats navigation element not found');
                }

                const clickSuccess = await this.clickComponent(statsButton[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click stats navigation');
                }
            } else {
                const clickSuccess = await this.clickComponent(statsNav[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click stats tab');
                }
            }

            // Wait for stats page to load
            const statsReady = await this.waitForPageTransition('CharacterStats', 3000);
            if (!statsReady) {
                // Try alternative component names
                const alternativeReady = await this.waitForComponent('PlayerStats', 2000);
                if (!alternativeReady) {
                    return this.createResult(false, 'Stats page did not load');
                }
            }

            return this.createResult(true, 'Successfully navigated to Stats');

        } catch (error) {
            return this.createResult(false, `Stats navigation error: ${error}`);
        }
    }

    async isOnPage(): Promise<boolean> {
        try {
            // Check for stats-specific components
            const statsComponents = await this.elementFinder.findByCriteria({
                displayName: 'CharacterStats',
                visible: true,
                limit: 1
            });

            if (statsComponents.length > 0) {
                return true;
            }

            // Check for player stats elements
            const playerStats = await this.elementFinder.findByCriteria({
                displayName: 'PlayerStats',
                visible: true,
                limit: 1
            });

            if (playerStats.length > 0) {
                return true;
            }

            // Check for specific stat elements
            const hackingLevel = await this.elementFinder.findByText('Hacking Level:', false);
            return hackingLevel.length > 0;

        } catch (error) {
            console.warn('Error checking stats page:', error);
            return false;
        }
    }

    async getPrimaryComponent(): Promise<ReactComponentInfo | null> {
        try {
            // Look for main stats component
            const statsComponent = await this.elementFinder.findByCriteria({
                displayName: 'CharacterStats',
                visible: true,
                limit: 1
            });

            if (statsComponent.length > 0) {
                return statsComponent[0];
            }

            // Fallback to PlayerStats
            const playerStatsComponent = await this.elementFinder.findByCriteria({
                displayName: 'PlayerStats',
                visible: true,
                limit: 1
            });

            return playerStatsComponent.length > 0 ? playerStatsComponent[0] : null;

        } catch (error) {
            console.warn('Error getting stats primary component:', error);
            return null;
        }
    }

    /**
     * Get player hacking level from stats
     * @returns Current hacking level or null if not found
     */
    async getHackingLevel(): Promise<number | null> {
        try {
            const hackingElements = await this.elementFinder.findByText('Hacking Level:', false);
            
            for (const element of hackingElements) {
                const text = this.extractComponentText(element);
                const match = text.match(/Hacking Level:\s*(\d+)/i);
                if (match) {
                    return parseInt(match[1], 10);
                }
            }

            return null;

        } catch (error) {
            console.warn('Error getting hacking level:', error);
            return null;
        }
    }

    /**
     * Get player money from stats
     * @returns Current money amount or null if not found
     */
    async getPlayerMoney(): Promise<number | null> {
        try {
            const moneyElements = await this.elementFinder.findByText('Money:', false);
            
            for (const element of moneyElements) {
                const text = this.extractComponentText(element);
                const match = text.match(/Money:\s*\$?([\d,]+(?:\.\d+)?[kmbtKMBT]?)/i);
                if (match) {
                    return this.parseMoneyString(match[1]);
                }
            }

            return null;

        } catch (error) {
            console.warn('Error getting player money:', error);
            return null;
        }
    }

    /**
     * Get all player stats as an object
     * @returns Player stats object or null if not available
     */
    async getAllStats(): Promise<Record<string, any> | null> {
        try {
            const stats: Record<string, any> = {};

            // Define stat patterns to look for
            const statPatterns = [
                { key: 'hackingLevel', pattern: /Hacking Level:\s*(\d+)/i },
                { key: 'strength', pattern: /Strength:\s*(\d+)/i },
                { key: 'defense', pattern: /Defense:\s*(\d+)/i },
                { key: 'dexterity', pattern: /Dexterity:\s*(\d+)/i },
                { key: 'agility', pattern: /Agility:\s*(\d+)/i },
                { key: 'charisma', pattern: /Charisma:\s*(\d+)/i },
                { key: 'intelligence', pattern: /Intelligence:\s*(\d+)/i },
                { key: 'money', pattern: /Money:\s*\$?([\d,]+(?:\.\d+)?[kmbtKMBT]?)/i },
            ];

            // Get the main stats component text
            const primaryComponent = await this.getPrimaryComponent();
            if (!primaryComponent) {
                return null;
            }

            const statsText = this.extractComponentText(primaryComponent);

            // Extract each stat
            for (const { key, pattern } of statPatterns) {
                const match = statsText.match(pattern);
                if (match) {
                    if (key === 'money') {
                        stats[key] = this.parseMoneyString(match[1]);
                    } else {
                        stats[key] = parseInt(match[1], 10);
                    }
                }
            }

            return Object.keys(stats).length > 0 ? stats : null;

        } catch (error) {
            console.warn('Error getting all stats:', error);
            return null;
        }
    }

    /**
     * Parse money string with suffixes (k, m, b, t) to number
     * @param moneyStr Money string to parse
     * @returns Parsed number value
     */
    private parseMoneyString(moneyStr: string): number {
        const cleanStr = moneyStr.replace(/,/g, '');
        const match = cleanStr.match(/^([\d.]+)([kmbtKMBT]?)$/);
        
        if (!match) {
            return parseFloat(cleanStr) || 0;
        }

        const [, numStr, suffix] = match;
        const num = parseFloat(numStr);
        
        switch (suffix.toLowerCase()) {
            case 'k': return num * 1e3;
            case 'm': return num * 1e6;
            case 'b': return num * 1e9;
            case 't': return num * 1e12;
            default: return num;
        }
    }

    /**
     * Check if player has enough money for a purchase
     * @param requiredAmount Required money amount
     * @returns True if player has enough money
     */
    async hasEnoughMoney(requiredAmount: number): Promise<boolean> {
        const currentMoney = await this.getPlayerMoney();
        return currentMoney !== null && currentMoney >= requiredAmount;
    }

    /**
     * Check if player meets hacking level requirement
     * @param requiredLevel Required hacking level
     * @returns True if player meets requirement
     */
    async meetsHackingLevel(requiredLevel: number): Promise<boolean> {
        const currentLevel = await this.getHackingLevel();
        return currentLevel !== null && currentLevel >= requiredLevel;
    }
}
