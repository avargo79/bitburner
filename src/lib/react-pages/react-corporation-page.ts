import { ReactGamePage } from '/lib/react-game-page';
import { ReactElementFinder } from '/lib/react-element-finder';
import { ReactEventHandler } from '/lib/react-event-handler';
import { GameSection, NavigationParams, NavigationResult, ReactComponentInfo } from '/lib/navigator-react-types';

/**
 * React-powered Corporation page navigation
 * Handles corporation management, divisions, and offices
 */
export class ReactCorporationPage extends ReactGamePage {
    private elementFinder: ReactElementFinder;

    constructor() {
        super();
        this.elementFinder = new ReactElementFinder();
    }

    async navigate(params?: NavigationParams): Promise<NavigationResult> {
        try {
            // Look for Corporation navigation tab
            const corpNav = await this.elementFinder.findByCriteria({
                textContent: 'Corp',
                interactive: true,
                muiType: 'Tab',
                limit: 1
            });

            if (corpNav.length === 0) {
                // Try full "Corporation" text
                const corpFullNav = await this.elementFinder.findByCriteria({
                    textContent: 'Corporation',
                    interactive: true,
                    sortBy: 'muiPriority',
                    limit: 1
                });

                if (corpFullNav.length === 0) {
                    return this.createResult(false, 'Corporation navigation element not found');
                }

                const clickSuccess = await this.clickComponent(corpFullNav[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click corporation navigation');
                }
            } else {
                const clickSuccess = await this.clickComponent(corpNav[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click corp tab');
                }
            }

            // Wait for corporation page to load
            const corpReady = await this.waitForPageTransition('Corporation', 4000);
            if (!corpReady) {
                // Check if corp creation is needed
                const createCorpReady = await this.waitForComponent('CreateCorporation', 2000);
                if (!createCorpReady) {
                    return this.createResult(false, 'Corporation page did not load');
                }
            }

            // Handle subsection navigation if specified
            if (params?.subsection) {
                const subsectionSuccess = await this.navigateToSubsection(params.subsection, params);
                if (!subsectionSuccess) {
                    return this.createResult(false, `Failed to navigate to ${params.subsection} subsection`);
                }
            }

            return this.createResult(true, 'Successfully navigated to Corporation');

        } catch (error) {
            return this.createResult(false, `Corporation navigation error: ${error}`);
        }
    }

    async isOnPage(): Promise<boolean> {
        try {
            // Check for corporation-specific components
            const corpComponents = await this.elementFinder.findByCriteria({
                displayName: 'Corporation',
                visible: true,
                limit: 1
            });

            if (corpComponents.length > 0) {
                return true;
            }

            // Check for create corporation page
            const createCorpComponents = await this.elementFinder.findByCriteria({
                displayName: 'CreateCorporation',
                visible: true,
                limit: 1
            });

            if (createCorpComponents.length > 0) {
                return true;
            }

            // Check for corporation-specific text
            const corpText = await this.elementFinder.findByText('Corporation Name:', false);
            return corpText.length > 0;

        } catch (error) {
            console.warn('Error checking corporation page:', error);
            return false;
        }
    }

    async getPrimaryComponent(): Promise<ReactComponentInfo | null> {
        try {
            // Look for main corporation component
            const corpComponent = await this.elementFinder.findByCriteria({
                displayName: 'Corporation',
                visible: true,
                limit: 1
            });

            if (corpComponent.length > 0) {
                return corpComponent[0];
            }

            // Check for create corporation component
            const createCorpComponent = await this.elementFinder.findByCriteria({
                displayName: 'CreateCorporation',
                visible: true,
                limit: 1
            });

            return createCorpComponent.length > 0 ? createCorpComponent[0] : null;

        } catch (error) {
            console.warn('Error getting corporation primary component:', error);
            return null;
        }
    }

    /**
     * Navigate to corporation subsection
     * @param subsection Subsection to navigate to ('overview', 'divisions', 'research', etc.)
     * @param params Optional parameters for subsection
     * @returns Success status
     */
    async navigateToSubsection(subsection: string, params?: any): Promise<boolean> {
        try {
            // Look for subsection tabs
            const subsectionTab = await this.elementFinder.findByCriteria({
                textContent: subsection,
                interactive: true,
                muiType: 'Tab',
                limit: 1
            });

            if (subsectionTab.length > 0) {
                return await this.clickComponent(subsectionTab[0]);
            }

            // Look for subsection buttons
            const subsectionButton = await this.elementFinder.findByCriteria({
                textContent: subsection,
                interactive: true,
                sortBy: 'muiPriority',
                limit: 1
            });

            if (subsectionButton.length > 0) {
                return await this.clickComponent(subsectionButton[0]);
            }

            console.warn(`Corporation subsection ${subsection} not found`);
            return false;

        } catch (error) {
            console.warn(`Error navigating to corporation subsection ${subsection}:`, error);
            return false;
        }
    }

    /**
     * Create a new corporation
     * @param corporationName Name for the new corporation
     * @returns Success status
     */
    async createCorporation(corporationName: string): Promise<boolean> {
        try {
            // Check if we're on the create corporation page
            const createCorpComponent = await this.elementFinder.findByCriteria({
                displayName: 'CreateCorporation',
                visible: true,
                limit: 1
            });

            if (createCorpComponent.length === 0) {
                console.warn('Create corporation page not found');
                return false;
            }

            // Find the corporation name input field
            const nameInput = await this.elementFinder.findByCriteria({
                attributes: { 'type': 'text' },
                customFilter: (component) => {
                    const element = component.domElement as HTMLInputElement;
                    return element?.placeholder?.toLowerCase().includes('corporation') ||
                           element?.id?.toLowerCase().includes('corp');
                },
                visible: true,
                limit: 1
            });

            if (nameInput.length === 0) {
                console.warn('Corporation name input not found');
                return false;
            }

            // Enter corporation name
            const inputElement = nameInput[0].domElement as HTMLInputElement;
            inputElement.focus();
            inputElement.value = '';
            await ReactEventHandler.simulateTyping(inputElement, corporationName);

            // Find and click create button
            const createButton = await this.elementFinder.findByCriteria({
                textContent: 'Create Corporation',
                interactive: true,
                muiType: 'Button',
                limit: 1
            });

            if (createButton.length === 0) {
                console.warn('Create corporation button not found');
                return false;
            }

            return await this.clickComponent(createButton[0]);

        } catch (error) {
            console.warn('Error creating corporation:', error);
            return false;
        }
    }

    /**
     * Get corporation overview information
     * @returns Corporation overview data or null
     */
    async getCorporationOverview(): Promise<{
        name: string;
        funds: number;
        revenue: number;
        expenses: number;
        profit: number;
        divisions: string[];
    } | null> {
        try {
            // Navigate to overview if not already there
            await this.navigateToSubsection('overview');
            await this.sleep(500);

            const overview = {
                name: '',
                funds: 0,
                revenue: 0,
                expenses: 0,
                profit: 0,
                divisions: [] as string[]
            };

            // Get corporation data from the page
            const overviewComponent = await this.getPrimaryComponent();
            if (!overviewComponent) {
                return null;
            }

            const overviewText = this.extractComponentText(overviewComponent);

            // Parse corporation data
            const nameMatch = overviewText.match(/Corporation Name:\s*([^\n]+)/i);
            if (nameMatch) overview.name = nameMatch[1].trim();

            const fundsMatch = overviewText.match(/Funds:\s*\$?([\d,]+(?:\.\d+)?[kmbtKMBT]?)/i);
            if (fundsMatch) overview.funds = this.parseMoneyString(fundsMatch[1]);

            const revenueMatch = overviewText.match(/Revenue:\s*\$?([\d,]+(?:\.\d+)?[kmbtKMBT]?)/i);
            if (revenueMatch) overview.revenue = this.parseMoneyString(revenueMatch[1]);

            const expensesMatch = overviewText.match(/Expenses:\s*\$?([\d,]+(?:\.\d+)?[kmbtKMBT]?)/i);
            if (expensesMatch) overview.expenses = this.parseMoneyString(expensesMatch[1]);

            const profitMatch = overviewText.match(/Profit:\s*\$?([\d,]+(?:\.\d+)?[kmbtKMBT]?)/i);
            if (profitMatch) overview.profit = this.parseMoneyString(profitMatch[1]);

            return overview;

        } catch (error) {
            console.warn('Error getting corporation overview:', error);
            return null;
        }
    }

    /**
     * Get list of corporation divisions
     * @returns Array of division names or null
     */
    async getDivisions(): Promise<string[] | null> {
        try {
            await this.navigateToSubsection('divisions');
            await this.sleep(500);

            const divisionElements = await this.elementFinder.findByCriteria({
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes('Division:') || text.includes('Industry:');
                },
                visible: true
            });

            const divisions: string[] = [];
            for (const element of divisionElements) {
                const text = this.extractComponentText(element);
                const divisionMatch = text.match(/Division:\s*([^\n]+)/i);
                if (divisionMatch) {
                    divisions.push(divisionMatch[1].trim());
                }
            }

            return divisions.length > 0 ? divisions : null;

        } catch (error) {
            console.warn('Error getting corporation divisions:', error);
            return null;
        }
    }

    /**
     * Create a new division
     * @param industryType Type of industry for the division
     * @param divisionName Name for the new division
     * @returns Success status
     */
    async createDivision(industryType: string, divisionName: string): Promise<boolean> {
        try {
            await this.navigateToSubsection('divisions');
            await this.sleep(500);

            // Find create division button
            const createButton = await this.elementFinder.findByCriteria({
                textContent: 'Expand into new Industry',
                interactive: true,
                muiType: 'Button',
                limit: 1
            });

            if (createButton.length === 0) {
                console.warn('Create division button not found');
                return false;
            }

            await this.clickComponent(createButton[0]);
            await this.sleep(1000);

            // Select industry type
            const industrySelect = await this.elementFinder.findByCriteria({
                textContent: industryType,
                interactive: true,
                limit: 1
            });

            if (industrySelect.length > 0) {
                await this.clickComponent(industrySelect[0]);
            }

            // Enter division name if input field exists
            const nameInput = await this.elementFinder.findByCriteria({
                attributes: { 'type': 'text' },
                customFilter: (component) => {
                    const element = component.domElement as HTMLInputElement;
                    return element?.placeholder?.toLowerCase().includes('division');
                },
                visible: true,
                limit: 1
            });

            if (nameInput.length > 0) {
                const inputElement = nameInput[0].domElement as HTMLInputElement;
                inputElement.focus();
                inputElement.value = '';
                await ReactEventHandler.simulateTyping(inputElement, divisionName);
            }

            // Confirm creation
            const confirmButton = await this.elementFinder.findByCriteria({
                textContent: 'Create Division',
                interactive: true,
                muiType: 'Button',
                limit: 1
            });

            if (confirmButton.length > 0) {
                return await this.clickComponent(confirmButton[0]);
            }

            return false;

        } catch (error) {
            console.warn('Error creating division:', error);
            return false;
        }
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
