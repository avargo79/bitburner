import { ReactGamePage } from '/lib/react-game-page';
import { ComponentSearchCriteria } from '/navigator-react-types';

export interface SleeveStats {
    hack: number;
    str: number;
    def: number;
    dex: number;
    agi: number;
    cha: number;
}

export interface SleeveInfo {
    id: number;
    task: string;
    location: string;
    earnings: number;
    experience: number;
    shock: number;
    sync: number;
    stats: SleeveStats;
    memory: number;
}

export interface SleeveUpgrade {
    name: string;
    cost: number;
    description: string;
    type: 'augmentation' | 'memory' | 'skill';
    available: boolean;
}

export interface SleeveTask {
    name: string;
    type: 'work' | 'crime' | 'faction' | 'company' | 'gym' | 'university' | 'recover';
    location?: string;
    description: string;
}

export class ReactSleevesPage extends ReactGamePage {
    protected getPageIdentifier(): string {
        return 'sleeves';
    }

    protected getExpectedUrl(): string {
        return '/sleeves';
    }

    // Implement required abstract methods
    async navigate(params?: any): Promise<any> {
        try {
            return { success: true, message: 'Navigated to sleeves page' };
        } catch (error) {
            return { success: false, error: 'Failed to navigate to sleeves page' };
        }
    }

    async isOnPage(): Promise<boolean> {
        try {
            const components = await this.findComponents('Sleeves');
            return components.length > 0;
        } catch (error) {
            return false;
        }
    }

    async getPrimaryComponent(): Promise<any> {
        try {
            const components = await this.findComponents('Sleeves');
            return components.length > 0 ? components[0] : null;
        } catch (error) {
            return null;
        }
    }

    async getSleeves(): Promise<SleeveInfo[]> {
        const sleeves: SleeveInfo[] = [];

        try {
            await this.ensureOnPage();
            await this.waitForPageLoad();

            const sleeveElements = await this.findComponents({
                className: /sleeve/i,
                timeout: 3000
            });

            if (sleeveElements.length === 0) {
                const sleeveRows = await this.findComponents({
                    role: 'row',
                    timeout: 3000
                });
                sleeveElements.push(...sleeveRows);
            }

            for (let i = 0; i < sleeveElements.length && i < 8; i++) {
                if (sleeveElements[i]) {
                    const sleeveElement = this.toElement(sleeveElements[i]);
                    if (sleeveElement) {
                        const sleeve = await this.parseSleeve(sleeveElement, i);
                        if (sleeve) {
                            sleeves.push(sleeve);
                        }
                    }
                }
            }

            return sleeves;

        } catch (error) {
            this.logError(`Failed to get sleeves: ${error}`);
            return [];
        }
    }

    async assignSleeveTask(sleeveId: number, taskType: string, location?: string): Promise<boolean> {
        try {
            const sleeveElement = await this.getSleeveElement(sleeveId);
            if (!sleeveElement) {
                return false;
            }

            const taskButton = await this.findComponent({
                text: /task|assign/i,
                tag: 'button',
                ancestor: sleeveElement,
                timeout: 2000
            });

            if (!taskButton) {
                this.logError(`Task button for sleeve ${sleeveId} not found`);
                return false;
            }

            await this.clickElement(taskButton);
            await this.waitForStableDOM();

            const taskOption = await this.findComponent({
                text: new RegExp(taskType, 'i'),
                timeout: 2000
            });

            if (!taskOption) {
                this.logError(`Task option ${taskType} not found`);
                return false;
            }

            await this.clickElement(taskOption);
            await this.waitForStableDOM();

            if (location) {
                const locationOption = await this.findComponent({
                    text: new RegExp(location, 'i'),
                    timeout: 2000
                });

                if (locationOption) {
                    await this.clickElement(locationOption);
                    await this.waitForStableDOM();
                }
            }

            const confirmButton = await this.findComponent({
                text: /confirm|start/i,
                tag: 'button',
                timeout: 2000
            });

            if (confirmButton) {
                await this.clickElement(confirmButton);
                await this.waitForStableDOM();
            }

            return true;

        } catch (error) {
            this.logError(`Failed to assign task ${taskType} to sleeve ${sleeveId}: ${error}`);
            return false;
        }
    }

    async upgradeSleeveMemory(sleeveId: number): Promise<boolean> {
        try {
            const sleeveElement = await this.getSleeveElement(sleeveId);
            if (!sleeveElement) {
                return false;
            }

            const memoryButton = await this.findComponent({
                text: /memory|upgrade/i,
                tag: 'button',
                ancestor: sleeveElement,
                timeout: 2000
            });

            if (!memoryButton) {
                this.logError(`Memory upgrade button for sleeve ${sleeveId} not found`);
                return false;
            }

            await this.clickElement(memoryButton);
            await this.waitForStableDOM();

            const upgradeButton = await this.findComponent({
                text: /purchase|buy|upgrade/i,
                tag: 'button',
                timeout: 2000
            });

            if (!upgradeButton) {
                this.logError(`Purchase button for memory upgrade not found`);
                return false;
            }

            await this.clickElement(upgradeButton);
            await this.waitForStableDOM();

            return true;

        } catch (error) {
            this.logError(`Failed to upgrade memory for sleeve ${sleeveId}: ${error}`);
            return false;
        }
    }

    async buySleeveAugmentation(sleeveId: number, augmentationName: string): Promise<boolean> {
        try {
            const sleeveElement = await this.getSleeveElement(sleeveId);
            if (!sleeveElement) {
                return false;
            }

            const augButton = await this.findComponent({
                text: /augmentation|aug/i,
                tag: 'button',
                ancestor: sleeveElement,
                timeout: 2000
            });

            if (!augButton) {
                this.logError(`Augmentation button for sleeve ${sleeveId} not found`);
                return false;
            }

            await this.clickElement(augButton);
            await this.waitForStableDOM();

            const augElement = await this.findComponent({
                text: new RegExp(augmentationName, 'i'),
                timeout: 2000
            });

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

            return true;

        } catch (error) {
            this.logError(`Failed to buy augmentation ${augmentationName} for sleeve ${sleeveId}: ${error}`);
            return false;
        }
    }

    async setSleeveToRecover(sleeveId: number): Promise<boolean> {
        return this.assignSleeveTask(sleeveId, 'Recovery');
    }

    async setSleeveToSync(sleeveId: number): Promise<boolean> {
        return this.assignSleeveTask(sleeveId, 'Synchronize');
    }

    async getAvailableSleeveUpgrades(sleeveId: number): Promise<SleeveUpgrade[]> {
        const upgrades: SleeveUpgrade[] = [];

        try {
            const sleeveElement = await this.getSleeveElement(sleeveId);
            if (!sleeveElement) {
                return [];
            }

            const upgradeButton = await this.findComponent({
                text: /upgrade|augmentation/i,
                tag: 'button',
                ancestor: sleeveElement,
                timeout: 2000
            });

            if (upgradeButton) {
                await this.clickElement(upgradeButton);
                await this.waitForStableDOM();
            }

            const upgradeElements = await this.findComponents({
                className: /upgrade|augmentation/i,
                timeout: 3000
            });

            for (const element of upgradeElements) {
                if (element) {
                    const upgradeElement = this.toElement(element);
                    if (upgradeElement) {
                        const upgrade = await this.parseSleeveUpgrade(upgradeElement);
                        if (upgrade) {
                            upgrades.push(upgrade);
                        }
                    }
                }
            }

            return upgrades;

        } catch (error) {
            this.logError(`Failed to get available upgrades for sleeve ${sleeveId}: ${error}`);
            return [];
        }
    }

    async getAvailableSleeveTasks(): Promise<SleeveTask[]> {
        const tasks: SleeveTask[] = [
            { name: 'Recovery', type: 'recover', description: 'Reduce shock and increase sync' },
            { name: 'Synchronize', type: 'recover', description: 'Increase synchronization' },
            { name: 'Commit Crime', type: 'crime', description: 'Commit crimes for money and experience' },
            { name: 'Work for Company', type: 'company', description: 'Work at a company for money and experience' },
            { name: 'Work for Faction', type: 'faction', description: 'Work for faction reputation' },
            { name: 'Train at Gym', type: 'gym', description: 'Train physical stats at gym' },
            { name: 'Study at University', type: 'university', description: 'Study at university for hacking and charisma' },
            { name: 'Idle', type: 'work', description: 'Do nothing' }
        ];

        return tasks;
    }

    async setSleeveToCommitCrime(sleeveId: number, crimeType: string): Promise<boolean> {
        try {
            const sleeveElement = await this.getSleeveElement(sleeveId);
            if (!sleeveElement) {
                return false;
            }

            const crimeButton = await this.findComponent({
                text: /crime/i,
                tag: 'button',
                ancestor: sleeveElement,
                timeout: 2000
            });

            if (!crimeButton) {
                this.logError(`Crime button for sleeve ${sleeveId} not found`);
                return false;
            }

            await this.clickElement(crimeButton);
            await this.waitForStableDOM();

            const crimeOption = await this.findComponent({
                text: new RegExp(crimeType, 'i'),
                timeout: 2000
            });

            if (!crimeOption) {
                this.logError(`Crime type ${crimeType} not found`);
                return false;
            }

            await this.clickElement(crimeOption);
            await this.waitForStableDOM();

            return true;

        } catch (error) {
            this.logError(`Failed to set sleeve ${sleeveId} to commit crime ${crimeType}: ${error}`);
            return false;
        }
    }

    async setSleeveToWorkForFaction(sleeveId: number, factionName: string, workType: string): Promise<boolean> {
        try {
            const sleeveElement = await this.getSleeveElement(sleeveId);
            if (!sleeveElement) {
                return false;
            }

            const factionButton = await this.findComponent({
                text: /faction/i,
                tag: 'button',
                ancestor: sleeveElement,
                timeout: 2000
            });

            if (!factionButton) {
                this.logError(`Faction button for sleeve ${sleeveId} not found`);
                return false;
            }

            await this.clickElement(factionButton);
            await this.waitForStableDOM();

            const factionOption = await this.findComponent({
                text: new RegExp(factionName, 'i'),
                timeout: 2000
            });

            if (!factionOption) {
                this.logError(`Faction ${factionName} not found`);
                return false;
            }

            await this.clickElement(factionOption);
            await this.waitForStableDOM();

            const workOption = await this.findComponent({
                text: new RegExp(workType, 'i'),
                timeout: 2000
            });

            if (workOption) {
                await this.clickElement(workOption);
                await this.waitForStableDOM();
            }

            return true;

        } catch (error) {
            this.logError(`Failed to set sleeve ${sleeveId} to work for faction ${factionName}: ${error}`);
            return false;
        }
    }

    private async getSleeveElement(sleeveId: number): Promise<Element | null> {
        try {
            const sleeveElements = await this.findComponents({
                className: /sleeve/i,
                timeout: 2000
            });

            if (sleeveElements.length > sleeveId) {
                return this.toElement(sleeveElements[sleeveId]);
            }

            const sleeveElement = await this.findComponent({
                text: new RegExp(`sleeve.*${sleeveId}`, 'i'),
                timeout: 2000
            });

            if (!sleeveElement) {
                this.logError(`Sleeve ${sleeveId} element not found`);
            }

            return sleeveElement ? this.toElement(sleeveElement) : null;

        } catch (error) {
            this.logError(`Failed to get sleeve ${sleeveId} element: ${error}`);
            return null;
        }
    }

    private async parseSleeve(element: Element, id: number): Promise<SleeveInfo | null> {
        try {
            const textContent = this.extractTextContent(element);
            
            const taskMatch = textContent.match(/Task:\s*([^\n|]+)/i);
            const task = taskMatch?.[1]?.trim() || 'Idle';

            const locationMatch = textContent.match(/Location:\s*([^\n|]+)/i);
            const location = locationMatch?.[1]?.trim() || 'None';

            const earningsMatch = textContent.match(/\$([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const earnings = this.parseNumber(earningsMatch?.[1] || '0');

            const expMatch = textContent.match(/Exp:\s*([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const experience = this.parseNumber(expMatch?.[1] || '0');

            const shockMatch = textContent.match(/Shock:\s*([0-9.]+)/i);
            const shock = parseFloat(shockMatch?.[1] || '0');

            const syncMatch = textContent.match(/Sync:\s*([0-9.]+)/i);
            const sync = parseFloat(syncMatch?.[1] || '0');

            const memoryMatch = textContent.match(/Memory:\s*([0-9,]+)/i);
            const memory = parseInt(memoryMatch?.[1]?.replace(/,/g, '') || '0');

            const hackMatch = textContent.match(/Hacking:\s*([0-9,]+)/i);
            const hack = parseInt(hackMatch?.[1]?.replace(/,/g, '') || '0');

            const strMatch = textContent.match(/Strength:\s*([0-9,]+)/i);
            const str = parseInt(strMatch?.[1]?.replace(/,/g, '') || '0');

            const defMatch = textContent.match(/Defense:\s*([0-9,]+)/i);
            const def = parseInt(defMatch?.[1]?.replace(/,/g, '') || '0');

            const dexMatch = textContent.match(/Dexterity:\s*([0-9,]+)/i);
            const dex = parseInt(dexMatch?.[1]?.replace(/,/g, '') || '0');

            const agiMatch = textContent.match(/Agility:\s*([0-9,]+)/i);
            const agi = parseInt(agiMatch?.[1]?.replace(/,/g, '') || '0');

            const chaMatch = textContent.match(/Charisma:\s*([0-9,]+)/i);
            const cha = parseInt(chaMatch?.[1]?.replace(/,/g, '') || '0');

            return {
                id,
                task,
                location,
                earnings,
                experience,
                shock,
                sync,
                stats: { hack, str, def, dex, agi, cha },
                memory
            };

        } catch (error) {
            this.logError(`Failed to parse sleeve ${id}: ${error}`);
            return null;
        }
    }

    private async parseSleeveUpgrade(element: Element): Promise<SleeveUpgrade | null> {
        try {
            const textContent = this.extractTextContent(element);
            
            const nameMatch = textContent.match(/^([^$]+)/);
            const name = nameMatch?.[1]?.trim() || 'Unknown';

            const costMatch = textContent.match(/\$([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const cost = this.parseNumber(costMatch?.[1] || '0');

            const descMatch = textContent.match(/Description:\s*(.+?)(?:\n|$)/i);
            const description = descMatch?.[1]?.trim() || '';

            let type: 'augmentation' | 'memory' | 'skill' = 'augmentation';
            if (name.toLowerCase().includes('memory')) {
                type = 'memory';
            } else if (name.toLowerCase().includes('skill')) {
                type = 'skill';
            }

            const buyButton = await this.findComponent({
                text: /purchase|buy/i,
                tag: 'button',
                ancestor: element,
                timeout: 1000
            });

            const available = !!buyButton;

            return { name, cost, description, type, available };

        } catch (error) {
            this.logError(`Failed to parse sleeve upgrade: ${error}`);
            return null;
        }
    }
}