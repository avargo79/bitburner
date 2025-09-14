import { ReactGamePage } from '/lib/react-game-page';
import { ReactElementFinder } from '/lib/react-element-finder';
import { GameSection, NavigationParams, NavigationResult, ReactComponentInfo } from '/lib/navigator-react-types';

/**
 * React-powered Hacknet page navigation
 * Handles hacknet nodes management and upgrades
 */
export class ReactHacknetPage extends ReactGamePage {
    private elementFinder: ReactElementFinder;

    constructor() {
        super();
        this.elementFinder = new ReactElementFinder();
    }

    async navigate(params?: NavigationParams): Promise<NavigationResult> {
        try {
            // Look for Hacknet navigation tab
            const hacknetNav = await this.elementFinder.findByCriteria({
                textContent: 'Hacknet',
                interactive: true,
                muiType: 'Tab',
                limit: 1
            });

            if (hacknetNav.length === 0) {
                // Fallback: look for hacknet button
                const hacknetButton = await this.elementFinder.findByCriteria({
                    textContent: 'Hacknet',
                    interactive: true,
                    sortBy: 'muiPriority',
                    limit: 1
                });

                if (hacknetButton.length === 0) {
                    return this.createResult(false, 'Hacknet navigation element not found');
                }

                const clickSuccess = await this.clickComponent(hacknetButton[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click hacknet navigation');
                }
            } else {
                const clickSuccess = await this.clickComponent(hacknetNav[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click hacknet tab');
                }
            }

            // Wait for hacknet page to load
            const hacknetReady = await this.waitForPageTransition('HacknetRoot', 3000);
            if (!hacknetReady) {
                // Try alternative component names
                const alternativeReady = await this.waitForComponent('Hacknet', 2000);
                if (!alternativeReady) {
                    return this.createResult(false, 'Hacknet page did not load');
                }
            }

            return this.createResult(true, 'Successfully navigated to Hacknet');

        } catch (error) {
            return this.createResult(false, `Hacknet navigation error: ${error}`);
        }
    }

    async isOnPage(): Promise<boolean> {
        try {
            // Check for hacknet-specific components
            const hacknetComponents = await this.elementFinder.findByCriteria({
                displayName: 'HacknetRoot',
                visible: true,
                limit: 1
            });

            if (hacknetComponents.length > 0) {
                return true;
            }

            // Check for hacknet node elements
            const nodeElements = await this.elementFinder.findByText('hacknet-node', false);
            if (nodeElements.length > 0) {
                return true;
            }

            // Check for "Purchase Hacknet Node" button
            const purchaseButton = await this.elementFinder.findByText('Purchase Hacknet Node', true);
            return purchaseButton.length > 0;

        } catch (error) {
            console.warn('Error checking hacknet page:', error);
            return false;
        }
    }

    async getPrimaryComponent(): Promise<ReactComponentInfo | null> {
        try {
            // Look for main hacknet component
            const hacknetComponent = await this.elementFinder.findByCriteria({
                displayName: 'HacknetRoot',
                visible: true,
                limit: 1
            });

            if (hacknetComponent.length > 0) {
                return hacknetComponent[0];
            }

            // Fallback to Hacknet component
            const hacknetFallback = await this.elementFinder.findByCriteria({
                displayName: 'Hacknet',
                visible: true,
                limit: 1
            });

            return hacknetFallback.length > 0 ? hacknetFallback[0] : null;

        } catch (error) {
            console.warn('Error getting hacknet primary component:', error);
            return null;
        }
    }

    /**
     * Get all hacknet nodes information
     * @returns Array of hacknet node data
     */
    async getHacknetNodes(): Promise<Array<{
        index: number;
        name: string;
        level: number;
        ram: number;
        cores: number;
        production: string;
        totalProduction: string;
    }> | null> {
        try {
            const nodes: Array<any> = [];

            // Look for hacknet node components
            const nodeComponents = await this.elementFinder.findByCriteria({
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes('hacknet-node-') && 
                           (text.includes('Level:') || text.includes('RAM:') || text.includes('Cores:'));
                },
                visible: true
            });

            for (const nodeComponent of nodeComponents) {
                const nodeText = this.extractComponentText(nodeComponent);
                const nodeData = this.parseHacknetNodeData(nodeText);
                if (nodeData) {
                    nodes.push(nodeData);
                }
            }

            return nodes.length > 0 ? nodes : null;

        } catch (error) {
            console.warn('Error getting hacknet nodes:', error);
            return null;
        }
    }

    /**
     * Purchase a new hacknet node
     * @returns Success status
     */
    async purchaseHacknetNode(): Promise<boolean> {
        try {
            // Find purchase button
            const purchaseButtons = await this.elementFinder.findByCriteria({
                textContent: 'Purchase Hacknet Node',
                interactive: true,
                muiType: 'Button',
                limit: 1
            });

            if (purchaseButtons.length === 0) {
                // Try alternative text patterns
                const altPurchaseButtons = await this.elementFinder.findByCriteria({
                    customFilter: (component) => {
                        const text = this.extractComponentText(component);
                        return text.toLowerCase().includes('purchase') && 
                               text.toLowerCase().includes('hacknet');
                    },
                    interactive: true,
                    limit: 1
                });

                if (altPurchaseButtons.length === 0) {
                    console.warn('Purchase hacknet node button not found');
                    return false;
                }

                return await this.clickComponent(altPurchaseButtons[0]);
            }

            return await this.clickComponent(purchaseButtons[0]);

        } catch (error) {
            console.warn('Error purchasing hacknet node:', error);
            return false;
        }
    }

    /**
     * Upgrade a specific hacknet node
     * @param nodeIndex Index of the node to upgrade
     * @param upgradeType Type of upgrade ('level', 'ram', 'cores')
     * @returns Success status
     */
    async upgradeHacknetNode(nodeIndex: number, upgradeType: 'level' | 'ram' | 'cores'): Promise<boolean> {
        try {
            // Find the specific node component
            const nodeComponents = await this.elementFinder.findByCriteria({
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes(`hacknet-node-${nodeIndex}`);
                },
                visible: true,
                limit: 1
            });

            if (nodeComponents.length === 0) {
                console.warn(`Hacknet node ${nodeIndex} not found`);
                return false;
            }

            const nodeComponent = nodeComponents[0];

            // Find upgrade button within the node component
            let upgradePattern: string;
            switch (upgradeType) {
                case 'level':
                    upgradePattern = 'Upgrade Level';
                    break;
                case 'ram':
                    upgradePattern = 'Upgrade RAM';
                    break;
                case 'cores':
                    upgradePattern = 'Upgrade Cores';
                    break;
                default:
                    return false;
            }

            // Look for upgrade buttons within the node
            const upgradeButtons = await this.elementFinder.findWithinContainer(
                { customFilter: (c) => c === nodeComponent },
                {
                    textContent: upgradePattern,
                    interactive: true,
                    limit: 1
                }
            );

            if (upgradeButtons.length === 0) {
                console.warn(`${upgradeType} upgrade button not found for node ${nodeIndex}`);
                return false;
            }

            return await this.clickComponent(upgradeButtons[0]);

        } catch (error) {
            console.warn(`Error upgrading hacknet node ${nodeIndex}:`, error);
            return false;
        }
    }

    /**
     * Get total hacknet production per second
     * @returns Production rate or null if not found
     */
    async getTotalProduction(): Promise<number | null> {
        try {
            // Look for total production display
            const productionElements = await this.elementFinder.findByCriteria({
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes('Total Production:') || text.includes('/sec');
                },
                visible: true
            });

            for (const element of productionElements) {
                const text = this.extractComponentText(element);
                const match = text.match(/[\$]?([\d,]+(?:\.\d+)?[kmbtKMBT]?)\s*\/\s*sec/i);
                if (match) {
                    return this.parseMoneyString(match[1]);
                }
            }

            return null;

        } catch (error) {
            console.warn('Error getting total production:', error);
            return null;
        }
    }

    /**
     * Parse hacknet node data from text
     * @param nodeText Text containing node information
     * @returns Parsed node data or null
     */
    private parseHacknetNodeData(nodeText: string): any | null {
        try {
            const nameMatch = nodeText.match(/(hacknet-node-\d+)/);
            const levelMatch = nodeText.match(/Level:\s*(\d+)/);
            const ramMatch = nodeText.match(/RAM:\s*(\d+)\s*GB/);
            const coresMatch = nodeText.match(/Cores:\s*(\d+)/);
            const productionMatch = nodeText.match(/[\$]?([\d,]+(?:\.\d+)?[kmbtKMBT]?)\s*\/\s*sec/);

            if (!nameMatch) return null;

            const indexMatch = nameMatch[1].match(/(\d+)$/);
            
            return {
                index: indexMatch ? parseInt(indexMatch[1], 10) : 0,
                name: nameMatch[1],
                level: levelMatch ? parseInt(levelMatch[1], 10) : 0,
                ram: ramMatch ? parseInt(ramMatch[1], 10) : 0,
                cores: coresMatch ? parseInt(coresMatch[1], 10) : 0,
                production: productionMatch ? productionMatch[1] : '0',
                totalProduction: nodeText
            };

        } catch (error) {
            console.warn('Error parsing hacknet node data:', error);
            return null;
        }
    }

    /**
     * Parse money string with suffixes to number (reused from stats page)
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
