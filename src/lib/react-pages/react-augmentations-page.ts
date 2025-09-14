import { ReactGamePage } from '/lib/react-game-page';
import { ComponentSearchCriteria } from '/lib/navigator-react-types';
import { ReactComponentFinder } from '/lib/react-component-finder';

export interface AugmentationInfo {
    name: string;
    faction: string;
    price: number;
    repCost: number;
    description: string;
    prereqs: string[];
    owned: boolean;
    available: boolean;
    stats: AugmentationStats;
}

export interface AugmentationStats {
    hack?: number;
    str?: number;
    def?: number;
    dex?: number;
    agi?: number;
    cha?: number;
    hackExp?: number;
    strExp?: number;
    defExp?: number;
    dexExp?: number;
    agiExp?: number;
    chaExp?: number;
    hackChance?: number;
    hackMoney?: number;
    hackTime?: number;
    workMoney?: number;
    crimeMoney?: number;
    crimeChance?: number;
}

export interface FactionAugmentations {
    faction: string;
    reputation: number;
    augmentations: AugmentationInfo[];
}

export class ReactAugmentationsPage extends ReactGamePage {
    protected getPageIdentifier(): string {
        return 'augmentations';
    }

    protected getExpectedUrl(): string {
        return '/augmentations';
    }

    // Implement required abstract methods
    async navigate(params?: any): Promise<any> {
        try {
            // Navigate to augmentations page through React components
            // This is a placeholder implementation
            return { success: true, message: 'Navigated to augmentations page' };
        } catch (error) {
            return { success: false, error: 'Failed to navigate to augmentations page' };
        }
    }

    async isOnPage(): Promise<boolean> {
        try {
            // Check if we're on the augmentations page by looking for specific components
            const components = await this.findComponents('Augmentations');
            return components.length > 0;
        } catch (error) {
            return false;
        }
    }

    async getPrimaryComponent(): Promise<any> {
        try {
            const components = await this.findComponents('Augmentations');
            return components.length > 0 ? components[0] : null;
        } catch (error) {
            return null;
        }
    }

    async getAllAugmentations(): Promise<AugmentationInfo[]> {
        const augmentations: AugmentationInfo[] = [];

        try {
            await this.ensureOnPage();
            await this.waitForPageLoad();

            const factionSections = await this.getFactionSections();

            for (const section of factionSections) {
                const factionAugs = await this.parseFactionAugmentations(section);
                augmentations.push(...factionAugs.augmentations);
            }

            return augmentations;

        } catch (error) {
            this.logError(`Failed to get all augmentations: ${error}`);
            return [];
        }
    }

    async getAugmentationsByFaction(): Promise<FactionAugmentations[]> {
        const factionAugmentations: FactionAugmentations[] = [];

        try {
            await this.ensureOnPage();
            await this.waitForPageLoad();

            const factionSections = await this.getFactionSections();

            for (const section of factionSections) {
                const factionAugs = await this.parseFactionAugmentations(section);
                factionAugmentations.push(factionAugs);
            }

            return factionAugmentations;

        } catch (error) {
            this.logError(`Failed to get augmentations by faction: ${error}`);
            return [];
        }
    }

    async buyAugmentation(augmentationName: string, factionName?: string): Promise<boolean> {
        try {
            let augElement: Element | null = null;

            if (factionName) {
                const factionSection = await this.findComponent({
                    text: new RegExp(factionName, 'i'),
                    timeout: 2000
                });

                if (factionSection) {
                    const augComponent = await this.findComponent({
                        text: new RegExp(augmentationName, 'i'),
                        ancestor: factionSection,
                        timeout: 2000
                    });
                    augElement = augComponent?.domElement || null;
                }
            }

            if (!augElement) {
                const augComponent = await this.findComponent({
                    text: new RegExp(augmentationName, 'i'),
                    timeout: 2000
                });
                augElement = augComponent?.domElement || null;
            }

            if (!augElement) {
                this.logError(`Augmentation ${augmentationName} not found`);
                return false;
            }

            const buyButton = await this.findComponent({
                text: /purchase|buy/i,
                tag: 'button',
                ancestor: augElement,
                timeout: 2000
            });

            if (!buyButton) {
                this.logError(`Buy button for ${augmentationName} not found`);
                return false;
            }

            await this.clickElement(buyButton);
            await this.waitForStableDOM();

            const confirmButton = await this.findComponent({
                text: /confirm|yes/i,
                tag: 'button',
                timeout: 2000
            });

            if (confirmButton) {
                await this.clickElement(confirmButton);
                await this.waitForStableDOM();
            }

            return true;

        } catch (error) {
            this.logError(`Failed to buy augmentation ${augmentationName}: ${error}`);
            return false;
        }
    }

    async getOwnedAugmentations(): Promise<AugmentationInfo[]> {
        const owned: AugmentationInfo[] = [];

        try {
            const ownedButton = await this.findComponent({
                text: /owned|installed/i,
                tag: 'button',
                timeout: 2000
            });

            if (ownedButton) {
                await this.clickElement(ownedButton);
                await this.waitForStableDOM();
            }

            const augElements = await this.findComponents({
                className: /augmentation|installed/i,
                timeout: 3000
            });

            for (const element of augElements) {
                const elementDom = this.toElement(element);
                if (elementDom) {
                    const aug = await this.parseAugmentation(elementDom, 'Unknown', true);
                    if (aug) {
                        owned.push(aug);
                    }
                }
            }

            return owned;

        } catch (error) {
            this.logError(`Failed to get owned augmentations: ${error}`);
            return [];
        }
    }

    async getAvailableAugmentations(): Promise<AugmentationInfo[]> {
        const available: AugmentationInfo[] = [];

        try {
            const availableButton = await this.findComponent({
                text: /available|purchase/i,
                tag: 'button',
                timeout: 2000
            });

            if (availableButton) {
                await this.clickElement(availableButton);
                await this.waitForStableDOM();
            }

            const allAugs = await this.getAllAugmentations();
            
            return allAugs.filter(aug => aug.available && !aug.owned);

        } catch (error) {
            this.logError(`Failed to get available augmentations: ${error}`);
            return [];
        }
    }

    async sortAugmentationsByPrice(): Promise<AugmentationInfo[]> {
        const augmentations = await this.getAllAugmentations();
        return augmentations.sort((a, b) => a.price - b.price);
    }

    async sortAugmentationsByReputation(): Promise<AugmentationInfo[]> {
        const augmentations = await this.getAllAugmentations();
        return augmentations.sort((a, b) => a.repCost - b.repCost);
    }

    async getPrerequisites(augmentationName: string): Promise<string[]> {
        try {
            const augElement = await this.findComponent({
                text: new RegExp(augmentationName, 'i'),
                timeout: 2000
            });

            if (!augElement) {
                return [];
            }

            const prereqElement = await this.findComponent({
                text: /prerequisite|require/i,
                ancestor: augElement,
                timeout: 2000
            });

            if (!prereqElement) {
                return [];
            }

            const prereqText = this.extractTextContent(prereqElement);
            const prereqs = prereqText
                .replace(/prerequisite.*?:/i, '')
                .split(',')
                .map(p => p.trim())
                .filter(p => p.length > 0);

            return prereqs;

        } catch (error) {
            this.logError(`Failed to get prerequisites for ${augmentationName}: ${error}`);
            return [];
        }
    }

    async canAffordAugmentation(augmentationName: string): Promise<{ canAfford: boolean; hasRep: boolean; meetsPrereqs: boolean }> {
        try {
            const augElement = await this.findComponent({
                text: new RegExp(augmentationName, 'i'),
                timeout: 2000
            });

            if (!augElement) {
                return { canAfford: false, hasRep: false, meetsPrereqs: false };
            }

            const buyButton = await this.findComponent({
                text: /purchase|buy/i,
                tag: 'button',
                ancestor: augElement,
                timeout: 2000
            });

            const canAfford = !!buyButton && !this.componentHasAttribute(buyButton, 'disabled');

            const repElement = await this.findComponent({
                text: /reputation.*[0-9]/i,
                ancestor: augElement,
                timeout: 2000
            });

            const hasRep = !repElement || !this.getTextContent(repElement)?.includes('insufficient');

            const prereqElement = await this.findComponent({
                text: /prerequisite/i,
                ancestor: augElement,
                timeout: 2000
            });

            const meetsPrereqs = !prereqElement || !this.getTextContent(prereqElement)?.includes('missing');

            return { canAfford, hasRep, meetsPrereqs };

        } catch (error) {
            this.logError(`Failed to check affordability for ${augmentationName}: ${error}`);
            return { canAfford: false, hasRep: false, meetsPrereqs: false };
        }
    }

    async installAllAugmentations(): Promise<boolean> {
        try {
            const installButton = await this.findComponent({
                text: /install.*all|install.*purchased/i,
                tag: 'button',
                timeout: 2000
            });

            if (!installButton) {
                this.logError('Install all button not found');
                return false;
            }

            await this.clickElement(installButton);
            await this.waitForStableDOM();

            const confirmButton = await this.findComponent({
                text: /confirm|yes.*reset/i,
                tag: 'button',
                timeout: 2000
            });

            if (confirmButton) {
                await this.clickElement(confirmButton);
                await this.waitForStableDOM();
            }

            return true;

        } catch (error) {
            this.logError(`Failed to install all augmentations: ${error}`);
            return false;
        }
    }

    private async getFactionSections(): Promise<Element[]> {
        try {
            const factionHeaders = await this.findComponents({
                text: /faction/i,
                timeout: 3000
            });

            if (factionHeaders.length === 0) {
                const sections = await this.findComponents({
                    role: 'section',
                    timeout: 3000
                });
                return this.toElements(sections);
            }

            return this.toElements(factionHeaders);

        } catch (error) {
            this.logError(`Failed to get faction sections: ${error}`);
            return [];
        }
    }

    private async parseFactionAugmentations(factionSection: Element): Promise<FactionAugmentations> {
        const augmentations: AugmentationInfo[] = [];
        
        try {
            const factionText = this.extractTextContent(factionSection);
            const factionMatch = factionText.match(/([^:]+):/);
            const faction = factionMatch?.[1]?.trim() || 'Unknown';

            const repMatch = factionText.match(/reputation.*?([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const reputation = this.parseNumber(repMatch?.[1] || '0');

            const augElements = await this.findComponents({
                className: /augmentation|item/i,
                ancestor: factionSection,
                timeout: 2000
            });

            for (const element of augElements) {
                if (element) {
                    const elementObj = this.toElement(element);
                    if (elementObj) {
                        const aug = await this.parseAugmentation(elementObj, faction);
                        if (aug) {
                            augmentations.push(aug);
                        }
                    }
                }
            }

            return { faction, reputation, augmentations };

        } catch (error) {
            this.logError(`Failed to parse faction augmentations: ${error}`);
            return { faction: 'Unknown', reputation: 0, augmentations: [] };
        }
    }

    private async parseAugmentation(element: Element, faction: string, owned: boolean = false): Promise<AugmentationInfo | null> {
        try {
            const textContent = this.extractTextContent(element);
            
            const nameMatch = textContent.match(/^([^$\n]+)/);
            const name = nameMatch?.[1]?.trim() || 'Unknown';

            const priceMatch = textContent.match(/\$([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const price = this.parseNumber(priceMatch?.[1] || '0');

            const repMatch = textContent.match(/reputation.*?([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const repCost = this.parseNumber(repMatch?.[1] || '0');

            const descMatch = textContent.match(/description:\s*(.+?)(?:\n|prerequisite|$)/i);
            const description = descMatch?.[1]?.trim() || '';

            const prereqMatch = textContent.match(/prerequisite.*?:\s*(.+?)(?:\n|$)/i);
            const prereqText = prereqMatch?.[1] || '';
            const prereqs = prereqText
                .split(',')
                .map(p => p.trim())
                .filter(p => p.length > 0);

            const buyButton = await this.findComponent({
                text: /purchase|buy/i,
                tag: 'button',
                ancestor: element,
                timeout: 1000
            });

            const available = !!buyButton && !this.componentHasAttribute(buyButton, 'disabled');

            const stats = await this.parseAugmentationStats(textContent);

            return {
                name,
                faction,
                price,
                repCost,
                description,
                prereqs,
                owned,
                available,
                stats
            };

        } catch (error) {
            this.logError(`Failed to parse augmentation: ${error}`);
            return null;
        }
    }

    private async parseAugmentationStats(textContent: string): Promise<AugmentationStats> {
        const stats: AugmentationStats = {};

        const statPatterns = {
            hack: /hacking.*?(\+|\-)([0-9]+)%/i,
            str: /strength.*?(\+|\-)([0-9]+)%/i,
            def: /defense.*?(\+|\-)([0-9]+)%/i,
            dex: /dexterity.*?(\+|\-)([0-9]+)%/i,
            agi: /agility.*?(\+|\-)([0-9]+)%/i,
            cha: /charisma.*?(\+|\-)([0-9]+)%/i,
            hackExp: /hacking.*?experience.*?(\+|\-)([0-9]+)%/i,
            strExp: /strength.*?experience.*?(\+|\-)([0-9]+)%/i,
            defExp: /defense.*?experience.*?(\+|\-)([0-9]+)%/i,
            dexExp: /dexterity.*?experience.*?(\+|\-)([0-9]+)%/i,
            agiExp: /agility.*?experience.*?(\+|\-)([0-9]+)%/i,
            chaExp: /charisma.*?experience.*?(\+|\-)([0-9]+)%/i,
            hackChance: /hack.*?chance.*?(\+|\-)([0-9]+)%/i,
            hackMoney: /hack.*?money.*?(\+|\-)([0-9]+)%/i,
            hackTime: /hack.*?time.*?(\+|\-)([0-9]+)%/i,
            workMoney: /work.*?money.*?(\+|\-)([0-9]+)%/i,
            crimeMoney: /crime.*?money.*?(\+|\-)([0-9]+)%/i,
            crimeChance: /crime.*?chance.*?(\+|\-)([0-9]+)%/i
        };

        for (const [statName, pattern] of Object.entries(statPatterns)) {
            const match = textContent.match(pattern);
            if (match) {
                const sign = match[1] === '+' ? 1 : -1;
                const value = parseInt(match[2]);
                (stats as any)[statName] = sign * value;
            }
        }

        return stats;
    }
}
