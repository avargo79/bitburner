import { ReactGamePage } from '/lib/react-game-page';
import { ReactElementFinder } from '/lib/react-element-finder';
import { ReactEventHandler } from '/lib/react-event-handler';
import { GameSection, NavigationParams, NavigationResult, ReactComponentInfo } from '/navigator-react-types';

/**
 * React-powered Factions page navigation
 * Handles faction management, work assignments, and reputation tracking
 */
export class ReactFactionsPage extends ReactGamePage {
    private elementFinder: ReactElementFinder;

    constructor() {
        super();
        this.elementFinder = new ReactElementFinder();
    }

    async navigate(params?: NavigationParams): Promise<NavigationResult> {
        try {
            // Look for Factions navigation tab
            const factionsNav = await this.elementFinder.findByCriteria({
                textContent: 'Factions',
                interactive: true,
                muiType: 'Tab',
                limit: 1
            });

            if (factionsNav.length === 0) {
                // Try singular "Faction"
                const factionNav = await this.elementFinder.findByCriteria({
                    textContent: 'Faction',
                    interactive: true,
                    sortBy: 'muiPriority',
                    limit: 1
                });

                if (factionNav.length === 0) {
                    return this.createResult(false, 'Factions navigation element not found');
                }

                const clickSuccess = await this.clickComponent(factionNav[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click faction navigation');
                }
            } else {
                const clickSuccess = await this.clickComponent(factionsNav[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click factions tab');
                }
            }

            // Wait for factions page to load
            const factionsReady = await this.waitForPageTransition('FactionsRoot', 3000);
            if (!factionsReady) {
                const alternativeReady = await this.waitForComponent('Factions', 2000);
                if (!alternativeReady) {
                    return this.createResult(false, 'Factions page did not load');
                }
            }

            // Handle specific faction navigation if requested
            if (params?.factionName) {
                const factionSuccess = await this.navigateToFaction(params.factionName, params);
                if (!factionSuccess) {
                    return this.createResult(false, `Failed to navigate to faction ${params.factionName}`);
                }
            }

            return this.createResult(true, 'Successfully navigated to Factions');

        } catch (error) {
            return this.createResult(false, `Factions navigation error: ${error}`);
        }
    }

    async isOnPage(): Promise<boolean> {
        try {
            // Check for factions-specific components
            const factionsComponents = await this.elementFinder.findByCriteria({
                displayName: 'FactionsRoot',
                visible: true,
                limit: 1
            });

            if (factionsComponents.length > 0) {
                return true;
            }

            // Check for factions list
            const factionsList = await this.elementFinder.findByCriteria({
                displayName: 'Factions',
                visible: true,
                limit: 1
            });

            if (factionsList.length > 0) {
                return true;
            }

            // Check for faction-specific text
            const factionText = await this.elementFinder.findByText('Reputation:', false);
            const memberText = await this.elementFinder.findByText('Member:', false);
            
            return factionText.length > 0 || memberText.length > 0;

        } catch (error) {
            console.warn('Error checking factions page:', error);
            return false;
        }
    }

    async getPrimaryComponent(): Promise<ReactComponentInfo | null> {
        try {
            // Look for main factions component
            const factionsComponent = await this.elementFinder.findByCriteria({
                displayName: 'FactionsRoot',
                visible: true,
                limit: 1
            });

            if (factionsComponent.length > 0) {
                return factionsComponent[0];
            }

            // Fallback to Factions component
            const factionsFallback = await this.elementFinder.findByCriteria({
                displayName: 'Factions',
                visible: true,
                limit: 1
            });

            return factionsFallback.length > 0 ? factionsFallback[0] : null;

        } catch (error) {
            console.warn('Error getting factions primary component:', error);
            return null;
        }
    }

    /**
     * Navigate to a specific faction
     * @param factionName Name of the faction
     * @param params Additional parameters for faction navigation
     * @returns Success status
     */
    async navigateToFaction(factionName: string, params?: any): Promise<boolean> {
        try {
            // Find the specific faction in the list
            const factionComponents = await this.elementFinder.findByCriteria({
                textContent: factionName,
                interactive: true,
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes(factionName) && 
                           (text.includes('Reputation:') || text.includes('Member:') || 
                            this.isComponentInteractive(component));
                },
                limit: 1
            });

            if (factionComponents.length === 0) {
                console.warn(`Faction ${factionName} not found`);
                return false;
            }

            const factionSuccess = await this.clickComponent(factionComponents[0]);
            if (!factionSuccess) {
                return false;
            }

            // Wait for faction page to load
            await this.sleep(1000);

            // Handle specific actions if requested
            if (params?.action) {
                return await this.performFactionAction(params.action, params);
            }

            return true;

        } catch (error) {
            console.warn(`Error navigating to faction ${factionName}:`, error);
            return false;
        }
    }

    /**
     * Perform a specific action within a faction
     * @param action Action to perform ('work', 'donate', 'purchase', 'info')
     * @param params Additional parameters for the action
     * @returns Success status
     */
    async performFactionAction(action: 'work' | 'donate' | 'purchase' | 'info', params?: any): Promise<boolean> {
        try {
            switch (action) {
                case 'work':
                    return await this.startFactionWork(params?.workType);
                case 'donate':
                    return await this.donateFaction(params?.amount);
                case 'purchase':
                    return await this.purchaseAugmentation(params?.augmentationName);
                case 'info':
                    return true; // Already on faction page showing info
                default:
                    return false;
            }

        } catch (error) {
            console.warn(`Error performing faction action ${action}:`, error);
            return false;
        }
    }

    /**
     * Start faction work
     * @param workType Type of work ('hacking', 'field', 'security')
     * @returns Success status
     */
    async startFactionWork(workType: 'hacking' | 'field' | 'security' = 'hacking'): Promise<boolean> {
        try {
            // Look for work buttons
            let workButton: ReactComponentInfo[] = [];

            switch (workType) {
                case 'hacking':
                    workButton = await this.elementFinder.findByCriteria({
                        customFilter: (component) => {
                            const text = this.extractComponentText(component);
                            return (text.includes('Hacking Contracts') || 
                                   text.includes('Hack') && text.includes('Work')) &&
                                   this.isComponentInteractive(component);
                        },
                        limit: 1
                    });
                    break;

                case 'field':
                    workButton = await this.elementFinder.findByCriteria({
                        customFilter: (component) => {
                            const text = this.extractComponentText(component);
                            return (text.includes('Field Work') || 
                                   text.includes('Field')) &&
                                   this.isComponentInteractive(component);
                        },
                        limit: 1
                    });
                    break;

                case 'security':
                    workButton = await this.elementFinder.findByCriteria({
                        customFilter: (component) => {
                            const text = this.extractComponentText(component);
                            return (text.includes('Security Work') || 
                                   text.includes('Security')) &&
                                   this.isComponentInteractive(component);
                        },
                        limit: 1
                    });
                    break;
            }

            if (workButton.length === 0) {
                console.warn(`${workType} work button not found`);
                return false;
            }

            return await this.clickComponent(workButton[0]);

        } catch (error) {
            console.warn(`Error starting ${workType} work:`, error);
            return false;
        }
    }

    /**
     * Donate to faction
     * @param amount Amount to donate (optional, uses max if not specified)
     * @returns Success status
     */
    async donateFaction(amount?: number): Promise<boolean> {
        try {
            // Look for donate button or input
            const donateElements = await this.elementFinder.findByCriteria({
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes('Donate') && 
                           (this.isComponentInteractive(component) || 
                            component.domElement?.tagName === 'INPUT');
                },
                limit: 2
            });

            if (donateElements.length === 0) {
                console.warn('Donation elements not found');
                return false;
            }

            // If amount is specified, find input field and enter amount
            if (amount !== undefined) {
                const donateInput = donateElements.find(el => 
                    el.domElement?.tagName === 'INPUT'
                );

                if (donateInput && donateInput.domElement) {
                    const inputElement = donateInput.domElement as HTMLInputElement;
                    inputElement.focus();
                    inputElement.value = '';
                    await ReactEventHandler.simulateTyping(inputElement, amount.toString());
                }
            }

            // Click donate button
            const donateButton = donateElements.find(el => 
                this.isComponentInteractive(el) &&
                this.extractComponentText(el).includes('Donate')
            );

            if (!donateButton) {
                console.warn('Donate button not found');
                return false;
            }

            return await this.clickComponent(donateButton);

        } catch (error) {
            console.warn('Error donating to faction:', error);
            return false;
        }
    }

    /**
     * Purchase augmentation from faction
     * @param augmentationName Name of augmentation to purchase
     * @returns Success status
     */
    async purchaseAugmentation(augmentationName: string): Promise<boolean> {
        try {
            // Find the specific augmentation
            const augmentationElements = await this.elementFinder.findByCriteria({
                textContent: augmentationName,
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes(augmentationName) && 
                           (text.includes('Price:') || text.includes('Rep:'));
                },
                limit: 1
            });

            if (augmentationElements.length === 0) {
                console.warn(`Augmentation ${augmentationName} not found`);
                return false;
            }

            // Look for purchase button within or near the augmentation
            const purchaseButtons = await this.elementFinder.findWithinContainer(
                { customFilter: (c) => c === augmentationElements[0] },
                {
                    customFilter: (component) => {
                        const text = this.extractComponentText(component);
                        return (text.includes('Purchase') || text.includes('Buy')) &&
                               this.isComponentInteractive(component);
                    },
                    limit: 1
                }
            );

            if (purchaseButtons.length === 0) {
                // Try clicking the augmentation itself
                return await this.clickComponent(augmentationElements[0]);
            }

            return await this.clickComponent(purchaseButtons[0]);

        } catch (error) {
            console.warn(`Error purchasing augmentation ${augmentationName}:`, error);
            return false;
        }
    }

    /**
     * Get all factions information
     * @returns Array of faction data or null
     */
    async getAllFactions(): Promise<Array<{
        name: string;
        reputation: number;
        favor: number;
        isMember: boolean;
        hasInvitation: boolean;
        requiredStats?: Record<string, number>;
    }> | null> {
        try {
            const factions: Array<any> = [];

            // Find all faction components
            const factionComponents = await this.elementFinder.findByCriteria({
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes('Reputation:') || text.includes('Member:') ||
                           text.includes('Invited:');
                },
                visible: true
            });

            for (const component of factionComponents) {
                const factionData = this.parseFactionData(component);
                if (factionData) {
                    factions.push(factionData);
                }
            }

            return factions.length > 0 ? factions : null;

        } catch (error) {
            console.warn('Error getting all factions:', error);
            return null;
        }
    }

    /**
     * Get faction reputation
     * @param factionName Name of the faction
     * @returns Reputation amount or null
     */
    async getFactionReputation(factionName: string): Promise<number | null> {
        try {
            await this.navigateToFaction(factionName);
            await this.sleep(500);

            const reputationElements = await this.elementFinder.findByCriteria({
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes('Reputation:');
                },
                visible: true,
                limit: 1
            });

            if (reputationElements.length === 0) {
                return null;
            }

            const text = this.extractComponentText(reputationElements[0]);
            const match = text.match(/Reputation:\s*([\d,]+(?:\.\d+)?)/);
            
            return match ? parseFloat(match[1].replace(/,/g, '')) : null;

        } catch (error) {
            console.warn(`Error getting reputation for ${factionName}:`, error);
            return null;
        }
    }

    /**
     * Parse faction data from component
     * @param component Faction component
     * @returns Parsed faction data or null
     */
    private parseFactionData(component: ReactComponentInfo): any | null {
        try {
            const text = this.extractComponentText(component);
            
            const nameMatch = text.match(/^([^\n:]+)(?:\n|:)/);
            if (!nameMatch) return null;

            const name = nameMatch[1].trim();
            const reputationMatch = text.match(/Reputation:\s*([\d,]+(?:\.\d+)?)/);
            const favorMatch = text.match(/Favor:\s*([\d,]+(?:\.\d+)?)/);

            return {
                name,
                reputation: reputationMatch ? parseFloat(reputationMatch[1].replace(/,/g, '')) : 0,
                favor: favorMatch ? parseFloat(favorMatch[1].replace(/,/g, '')) : 0,
                isMember: text.includes('Member: ✓') || text.includes('Member: Yes'),
                hasInvitation: text.includes('Invited: ✓') || text.includes('Invitation: Yes'),
                requiredStats: this.extractRequiredStats(text)
            };

        } catch (error) {
            console.warn('Error parsing faction data:', error);
            return null;
        }
    }

    /**
     * Extract required stats from faction text
     * @param text Faction text
     * @returns Required stats object
     */
    private extractRequiredStats(text: string): Record<string, number> {
        const stats: Record<string, number> = {};
        
        const statPatterns = [
            { key: 'hacking', pattern: /Hacking:\s*(\d+)/ },
            { key: 'strength', pattern: /Strength:\s*(\d+)/ },
            { key: 'defense', pattern: /Defense:\s*(\d+)/ },
            { key: 'dexterity', pattern: /Dexterity:\s*(\d+)/ },
            { key: 'agility', pattern: /Agility:\s*(\d+)/ },
            { key: 'charisma', pattern: /Charisma:\s*(\d+)/ },
            { key: 'money', pattern: /Money:\s*\$?([\d,]+(?:\.\d+)?[kmbtKMBT]?)/ },
        ];

        for (const { key, pattern } of statPatterns) {
            const match = text.match(pattern);
            if (match) {
                if (key === 'money') {
                    stats[key] = this.parseMoneyString(match[1]);
                } else {
                    stats[key] = parseInt(match[1], 10);
                }
            }
        }

        return stats;
    }

    /**
     * Parse money string with suffixes to number
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
}