import { ReactGamePage } from '/lib/react-game-page';
import { ReactElementFinder } from '/lib/react-element-finder';
import { GameSection, NavigationParams, NavigationResult, ReactComponentInfo } from '/lib/navigator-react-types';

/**
 * React-powered BitVerse page navigation
 * Handles BitNode exploration, destruction, and Source-File management
 */
export class ReactBitVersePage extends ReactGamePage {
    private elementFinder: ReactElementFinder;

    constructor() {
        super();
        this.elementFinder = new ReactElementFinder();
    }

    async navigate(params?: NavigationParams): Promise<NavigationResult> {
        try {
            // Look for BitVerse navigation tab
            const bitVerseNav = await this.elementFinder.findByCriteria({
                textContent: 'BitVerse',
                interactive: true,
                muiType: 'Tab',
                limit: 1
            });

            if (bitVerseNav.length === 0) {
                // Try alternative names
                const alternativeNav = await this.elementFinder.findByCriteria({
                    customFilter: (component) => {
                        const text = this.extractComponentText(component);
                        return (text.includes('BitVerse') || text.includes('Bit-Verse')) &&
                               this.isComponentInteractive(component);
                    },
                    sortBy: 'muiPriority',
                    limit: 1
                });

                if (alternativeNav.length === 0) {
                    return this.createResult(false, 'BitVerse navigation element not found');
                }

                const clickSuccess = await this.clickComponent(alternativeNav[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click BitVerse navigation');
                }
            } else {
                const clickSuccess = await this.clickComponent(bitVerseNav[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click BitVerse tab');
                }
            }

            // Wait for BitVerse page to load
            const bitVerseReady = await this.waitForPageTransition('BitVerse', 4000);
            if (!bitVerseReady) {
                // Check for alternative component names
                const alternativeReady = await this.waitForComponent('BitNodes', 2000);
                if (!alternativeReady) {
                    return this.createResult(false, 'BitVerse page did not load');
                }
            }

            // Handle specific BitNode navigation if requested
            if (params?.nodeIndex !== undefined) {
                const nodeSuccess = await this.navigateToBitNode(params.nodeIndex, params.action);
                if (!nodeSuccess) {
                    return this.createResult(false, `Failed to navigate to BitNode ${params.nodeIndex}`);
                }
            }

            return this.createResult(true, 'Successfully navigated to BitVerse');

        } catch (error) {
            return this.createResult(false, `BitVerse navigation error: ${error}`);
        }
    }

    async isOnPage(): Promise<boolean> {
        try {
            // Check for BitVerse-specific components
            const bitVerseComponents = await this.elementFinder.findByCriteria({
                displayName: 'BitVerse',
                visible: true,
                limit: 1
            });

            if (bitVerseComponents.length > 0) {
                return true;
            }

            // Check for BitNodes component
            const bitNodesComponents = await this.elementFinder.findByCriteria({
                displayName: 'BitNodes',
                visible: true,
                limit: 1
            });

            if (bitNodesComponents.length > 0) {
                return true;
            }

            // Check for BitNode-specific text
            const bitNodeText = await this.elementFinder.findByText('BitNode', false);
            const sourceFileText = await this.elementFinder.findByText('Source-File', false);
            
            return bitNodeText.length > 0 || sourceFileText.length > 0;

        } catch (error) {
            console.warn('Error checking BitVerse page:', error);
            return false;
        }
    }

    async getPrimaryComponent(): Promise<ReactComponentInfo | null> {
        try {
            // Look for main BitVerse component
            const bitVerseComponent = await this.elementFinder.findByCriteria({
                displayName: 'BitVerse',
                visible: true,
                limit: 1
            });

            if (bitVerseComponent.length > 0) {
                return bitVerseComponent[0];
            }

            // Fallback to BitNodes component
            const bitNodesComponent = await this.elementFinder.findByCriteria({
                displayName: 'BitNodes',
                visible: true,
                limit: 1
            });

            return bitNodesComponent.length > 0 ? bitNodesComponent[0] : null;

        } catch (error) {
            console.warn('Error getting BitVerse primary component:', error);
            return null;
        }
    }

    /**
     * Navigate to a specific BitNode
     * @param nodeIndex Index of the BitNode (0-12)
     * @param action Action to perform ('enter', 'info', 'reset')
     * @returns Success status
     */
    async navigateToBitNode(nodeIndex: number, action: 'enter' | 'info' | 'reset' = 'info'): Promise<boolean> {
        try {
            // Find the specific BitNode component
            const bitNodeComponents = await this.elementFinder.findByCriteria({
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes(`BitNode-${nodeIndex}`) || 
                           text.includes(`BitNode ${nodeIndex}`);
                },
                visible: true,
                limit: 1
            });

            if (bitNodeComponents.length === 0) {
                console.warn(`BitNode ${nodeIndex} not found`);
                return false;
            }

            const bitNodeComponent = bitNodeComponents[0];

            // Perform the requested action
            switch (action) {
                case 'enter':
                    return await this.enterBitNode(bitNodeComponent, nodeIndex);
                case 'info':
                    return await this.viewBitNodeInfo(bitNodeComponent, nodeIndex);
                case 'reset':
                    return await this.resetBitNode(bitNodeComponent, nodeIndex);
                default:
                    return false;
            }

        } catch (error) {
            console.warn(`Error navigating to BitNode ${nodeIndex}:`, error);
            return false;
        }
    }

    /**
     * Enter a BitNode (destroy current and enter new one)
     * @param bitNodeComponent BitNode component
     * @param nodeIndex BitNode index
     * @returns Success status
     */
    private async enterBitNode(bitNodeComponent: ReactComponentInfo, nodeIndex: number): Promise<boolean> {
        try {
            // Look for enter/destroy button within the BitNode
            const enterButtons = await this.elementFinder.findWithinContainer(
                { customFilter: (c) => c === bitNodeComponent },
                {
                    customFilter: (component) => {
                        const text = this.extractComponentText(component);
                        return (text.includes('Enter') || text.includes('Destroy')) &&
                               this.isComponentInteractive(component);
                    },
                    limit: 1
                }
            );

            if (enterButtons.length === 0) {
                // Try clicking the BitNode directly
                return await this.clickComponent(bitNodeComponent);
            }

            return await this.clickComponent(enterButtons[0]);

        } catch (error) {
            console.warn(`Error entering BitNode ${nodeIndex}:`, error);
            return false;
        }
    }

    /**
     * View BitNode information
     * @param bitNodeComponent BitNode component
     * @param nodeIndex BitNode index
     * @returns Success status
     */
    private async viewBitNodeInfo(bitNodeComponent: ReactComponentInfo, nodeIndex: number): Promise<boolean> {
        try {
            // Look for info button
            const infoButtons = await this.elementFinder.findWithinContainer(
                { customFilter: (c) => c === bitNodeComponent },
                {
                    textContent: 'Info',
                    interactive: true,
                    limit: 1
                }
            );

            if (infoButtons.length > 0) {
                return await this.clickComponent(infoButtons[0]);
            }

            // Try clicking the BitNode for info
            return await this.clickComponent(bitNodeComponent);

        } catch (error) {
            console.warn(`Error viewing BitNode ${nodeIndex} info:`, error);
            return false;
        }
    }

    /**
     * Reset BitNode progress
     * @param bitNodeComponent BitNode component
     * @param nodeIndex BitNode index
     * @returns Success status
     */
    private async resetBitNode(bitNodeComponent: ReactComponentInfo, nodeIndex: number): Promise<boolean> {
        try {
            // Look for reset button
            const resetButtons = await this.elementFinder.findWithinContainer(
                { customFilter: (c) => c === bitNodeComponent },
                {
                    textContent: 'Reset',
                    interactive: true,
                    limit: 1
                }
            );

            if (resetButtons.length === 0) {
                console.warn(`Reset button not found for BitNode ${nodeIndex}`);
                return false;
            }

            return await this.clickComponent(resetButtons[0]);

        } catch (error) {
            console.warn(`Error resetting BitNode ${nodeIndex}:`, error);
            return false;
        }
    }

    /**
     * Get information about all available BitNodes
     * @returns Array of BitNode information or null
     */
    async getAllBitNodes(): Promise<Array<{
        index: number;
        name: string;
        description: string;
        completed: boolean;
        sourceFileLevel: number;
        multipliers?: Record<string, number>;
    }> | null> {
        try {
            const bitNodes: Array<any> = [];

            // Find all BitNode components
            const bitNodeComponents = await this.elementFinder.findByCriteria({
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes('BitNode-') || text.includes('BitNode ');
                },
                visible: true
            });

            for (const component of bitNodeComponents) {
                const bitNodeData = this.parseBitNodeData(component);
                if (bitNodeData) {
                    bitNodes.push(bitNodeData);
                }
            }

            return bitNodes.length > 0 ? bitNodes.sort((a, b) => a.index - b.index) : null;

        } catch (error) {
            console.warn('Error getting all BitNodes:', error);
            return null;
        }
    }

    /**
     * Get Source-Files information
     * @returns Array of Source-File information or null
     */
    async getSourceFiles(): Promise<Array<{
        number: number;
        level: number;
        name: string;
        description: string;
        maxLevel: number;
    }> | null> {
        try {
            // Look for Source-Files components
            const sourceFileComponents = await this.elementFinder.findByCriteria({
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes('Source-File') && 
                           (text.includes('Level:') || text.includes('Lv.'));
                },
                visible: true
            });

            const sourceFiles: Array<any> = [];

            for (const component of sourceFileComponents) {
                const sourceFileData = this.parseSourceFileData(component);
                if (sourceFileData) {
                    sourceFiles.push(sourceFileData);
                }
            }

            return sourceFiles.length > 0 ? sourceFiles.sort((a, b) => a.number - b.number) : null;

        } catch (error) {
            console.warn('Error getting Source-Files:', error);
            return null;
        }
    }

    /**
     * Parse BitNode data from component
     * @param component BitNode component
     * @returns Parsed BitNode data or null
     */
    private parseBitNodeData(component: ReactComponentInfo): any | null {
        try {
            const text = this.extractComponentText(component);
            
            const indexMatch = text.match(/BitNode[-\s](\d+)/);
            if (!indexMatch) return null;

            const index = parseInt(indexMatch[1], 10);
            const nameMatch = text.match(/BitNode[-\s]\d+:\s*([^\n]+)/);
            
            return {
                index,
                name: nameMatch ? nameMatch[1].trim() : `BitNode-${index}`,
                description: this.extractDescription(text),
                completed: text.includes('✓') || text.includes('Completed'),
                sourceFileLevel: this.extractSourceFileLevel(text),
                multipliers: this.extractMultipliers(text)
            };

        } catch (error) {
            console.warn('Error parsing BitNode data:', error);
            return null;
        }
    }

    /**
     * Parse Source-File data from component
     * @param component Source-File component
     * @returns Parsed Source-File data or null
     */
    private parseSourceFileData(component: ReactComponentInfo): any | null {
        try {
            const text = this.extractComponentText(component);
            
            const numberMatch = text.match(/Source-File\s*(\d+)/);
            if (!numberMatch) return null;

            const number = parseInt(numberMatch[1], 10);
            const levelMatch = text.match(/Level:?\s*(\d+)/);
            const nameMatch = text.match(/Source-File\s*\d+:\s*([^\n]+)/);

            return {
                number,
                level: levelMatch ? parseInt(levelMatch[1], 10) : 0,
                name: nameMatch ? nameMatch[1].trim() : `Source-File ${number}`,
                description: this.extractDescription(text),
                maxLevel: this.extractMaxLevel(text)
            };

        } catch (error) {
            console.warn('Error parsing Source-File data:', error);
            return null;
        }
    }

    /**
     * Extract description from text
     * @param text Component text
     * @returns Description string
     */
    private extractDescription(text: string): string {
        const lines = text.split('\n');
        const descriptionLines = lines.filter(line => 
            !line.includes('BitNode') && 
            !line.includes('Source-File') && 
            !line.includes('Level:') &&
            line.trim().length > 10
        );
        
        return descriptionLines.join(' ').trim();
    }

    /**
     * Extract Source-File level from text
     * @param text Component text
     * @returns Source-File level
     */
    private extractSourceFileLevel(text: string): number {
        const levelMatch = text.match(/Source-File.*Level:?\s*(\d+)/);
        return levelMatch ? parseInt(levelMatch[1], 10) : 0;
    }

    /**
     * Extract max level from text
     * @param text Component text
     * @returns Max level
     */
    private extractMaxLevel(text: string): number {
        const maxLevelMatch = text.match(/Max Level:?\s*(\d+)/);
        return maxLevelMatch ? parseInt(maxLevelMatch[1], 10) : 1;
    }

    /**
     * Extract multipliers from text
     * @param text Component text
     * @returns Multipliers object
     */
    private extractMultipliers(text: string): Record<string, number> {
        const multipliers: Record<string, number> = {};
        
        const multiplierMatches = text.matchAll(/([a-zA-Z\s]+):\s*x?([\d.]+)/g);
        for (const match of multiplierMatches) {
            const [, key, value] = match;
            const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
            multipliers[cleanKey] = parseFloat(value);
        }

        return multipliers;
    }
}
