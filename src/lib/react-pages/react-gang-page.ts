import { ReactGamePage } from '/lib/react-game-page';
import { ComponentSearchCriteria } from '/navigator-react-types';

export interface GangMemberInfo {
    name: string;
    task: string;
    earnings: number;
    respect: number;
    wanted: number;
    stats: {
        hack: number;
        str: number;
        def: number;
        dex: number;
        agi: number;
        cha: number;
    };
}

export interface GangInfo {
    faction: string;
    members: GangMemberInfo[];
    territory: number;
    power: number;
    respect: number;
    wantedLevel: number;
    money: number;
}

export interface TerritoryWarInfo {
    enemy: string;
    power: number;
    territory: number;
    chance: number;
}

export class ReactGangPage extends ReactGamePage {
    protected getPageIdentifier(): string {
        return 'gang';
    }

    protected getExpectedUrl(): string {
        return '/gang';
    }

    // Implement required abstract methods
    async navigate(params?: any): Promise<any> {
        try {
            return { success: true, message: 'Navigated to gang page' };
        } catch (error) {
            return { success: false, error: 'Failed to navigate to gang page' };
        }
    }

    async isOnPage(): Promise<boolean> {
        try {
            const components = await this.findComponents('Gang');
            return components.length > 0;
        } catch (error) {
            return false;
        }
    }

    async getPrimaryComponent(): Promise<any> {
        try {
            const components = await this.findComponents('Gang');
            return components.length > 0 ? components[0] : null;
        } catch (error) {
            return null;
        }
    }

    async getGangInfo(): Promise<GangInfo | null> {
        try {
            await this.ensureOnPage();
            await this.waitForPageLoad();

            const factionElement = await this.findComponent({
                text: /Gang:/,
                timeout: 2000
            });

            if (!factionElement) {
                throw new Error('Gang faction info not found');
            }

            const faction = this.extractTextContent(factionElement).replace('Gang:', '').trim();

            const members = await this.getGangMembers();
            const territoryInfo = await this.getTerritoryInfo();
            const gangStats = await this.getGangStats();

            return {
                faction,
                members,
                territory: territoryInfo.territory,
                power: territoryInfo.power,
                respect: gangStats.respect,
                wantedLevel: gangStats.wantedLevel,
                money: gangStats.money
            };

        } catch (error) {
            this.logError(`Failed to get gang info: ${error}`);
            return null;
        }
    }

    async getGangMembers(): Promise<GangMemberInfo[]> {
        const members: GangMemberInfo[] = [];

        try {
            const memberRows = await this.findComponents({
                role: 'row',
                timeout: 3000
            });

            for (const row of memberRows) {
                if (row) {
                    const rowElement = this.toElement(row);
                    if (rowElement) {
                        const memberInfo = await this.parseGangMember(rowElement);
                        if (memberInfo) {
                            members.push(memberInfo);
                        }
                    }
                }
            }

            return members;

        } catch (error) {
            this.logError(`Failed to get gang members: ${error}`);
            return [];
        }
    }

    async recruitGangMember(memberName: string): Promise<boolean> {
        try {
            const recruitButton = await this.findComponent({
                text: /Recruit/i,
                tag: 'button',
                timeout: 2000
            });

            if (!recruitButton) {
                this.logError('Recruit button not found');
                return false;
            }

            await this.clickElement(recruitButton);
            await this.waitForStableDOM();

            const nameInput = await this.findComponent({
                tag: 'input',
                placeholder: /name/i,
                timeout: 2000
            });

            if (!nameInput) {
                this.logError('Name input not found');
                return false;
            }

            await this.typeText(nameInput, memberName);

            const confirmButton = await this.findComponent({
                text: /confirm/i,
                tag: 'button',
                timeout: 2000
            });

            if (!confirmButton) {
                this.logError('Confirm button not found');
                return false;
            }

            await this.clickElement(confirmButton);
            await this.waitForStableDOM();

            const successMessage = await this.findComponent({
                text: new RegExp(memberName, 'i'),
                timeout: 2000
            });

            return !!successMessage;

        } catch (error) {
            this.logError(`Failed to recruit gang member ${memberName}: ${error}`);
            return false;
        }
    }

    async assignMemberTask(memberName: string, taskName: string): Promise<boolean> {
        try {
            const memberRow = await this.findComponent({
                text: new RegExp(memberName, 'i'),
                role: 'row',
                timeout: 2000
            });

            if (!memberRow) {
                this.logError(`Member ${memberName} not found`);
                return false;
            }

            const taskDropdown = await this.findComponent({
                tag: 'select',
                ancestor: memberRow,
                timeout: 2000
            });

            if (!taskDropdown) {
                this.logError(`Task dropdown for ${memberName} not found`);
                return false;
            }

            await this.selectOption(taskDropdown, taskName);
            await this.waitForStableDOM();

            const assignButton = await this.findComponent({
                text: /assign/i,
                tag: 'button',
                ancestor: memberRow,
                timeout: 2000
            });

            if (assignButton) {
                await this.clickElement(assignButton);
                await this.waitForStableDOM();
            }

            return true;

        } catch (error) {
            this.logError(`Failed to assign task ${taskName} to ${memberName}: ${error}`);
            return false;
        }
    }

    async getTerritoryWarInfo(): Promise<TerritoryWarInfo[]> {
        const territoryInfo: TerritoryWarInfo[] = [];

        try {
            const territorySection = await this.findComponent({
                text: /territory/i,
                timeout: 3000
            });

            if (!territorySection) {
                return [];
            }

            const enemyRows = await this.findComponents({
                role: 'row',
                ancestor: territorySection,
                timeout: 2000
            });

            for (const row of enemyRows) {
                if (row) {
                    const rowElement = this.toElement(row);
                    if (rowElement) {
                        const info = await this.parseTerritoryWarInfo(rowElement);
                        if (info) {
                            territoryInfo.push(info);
                        }
                    }
                }
            }

            return territoryInfo;

        } catch (error) {
            this.logError(`Failed to get territory war info: ${error}`);
            return [];
        }
    }

    async engageInTerritoryWarfare(enable: boolean = true): Promise<boolean> {
        try {
            const warfareCheckbox = await this.findComponent({
                tag: 'input',
                type: 'checkbox',
                text: /warfare/i,
                timeout: 2000
            });

            if (!warfareCheckbox) {
                this.logError('Territory warfare checkbox not found');
                return false;
            }

            const isChecked = await this.isElementChecked(warfareCheckbox);
            
            if (isChecked !== enable) {
                await this.clickElement(warfareCheckbox);
                await this.waitForStableDOM();
            }

            return true;

        } catch (error) {
            this.logError(`Failed to ${enable ? 'enable' : 'disable'} territory warfare: ${error}`);
            return false;
        }
    }

    async buyEquipment(memberName: string, equipmentName: string): Promise<boolean> {
        try {
            const memberRow = await this.findComponent({
                text: new RegExp(memberName, 'i'),
                role: 'row',
                timeout: 2000
            });

            if (!memberRow) {
                this.logError(`Member ${memberName} not found`);
                return false;
            }

            const equipmentButton = await this.findComponent({
                text: /equipment/i,
                tag: 'button',
                ancestor: memberRow,
                timeout: 2000
            });

            if (!equipmentButton) {
                this.logError(`Equipment button for ${memberName} not found`);
                return false;
            }

            await this.clickElement(equipmentButton);
            await this.waitForStableDOM();

            const equipmentItem = await this.findComponent({
                text: new RegExp(equipmentName, 'i'),
                timeout: 2000
            });

            if (!equipmentItem) {
                this.logError(`Equipment ${equipmentName} not found`);
                return false;
            }

            const buyButton = await this.findComponent({
                text: /buy/i,
                tag: 'button',
                ancestor: equipmentItem,
                timeout: 2000
            });

            if (!buyButton) {
                this.logError(`Buy button for ${equipmentName} not found`);
                return false;
            }

            await this.clickElement(buyButton);
            await this.waitForStableDOM();

            return true;

        } catch (error) {
            this.logError(`Failed to buy equipment ${equipmentName} for ${memberName}: ${error}`);
            return false;
        }
    }

    async ascendMember(memberName: string): Promise<boolean> {
        try {
            const memberRow = await this.findComponent({
                text: new RegExp(memberName, 'i'),
                role: 'row',
                timeout: 2000
            });

            if (!memberRow) {
                this.logError(`Member ${memberName} not found`);
                return false;
            }

            const ascendButton = await this.findComponent({
                text: /ascend/i,
                tag: 'button',
                ancestor: memberRow,
                timeout: 2000
            });

            if (!ascendButton) {
                this.logError(`Ascend button for ${memberName} not found`);
                return false;
            }

            await this.clickElement(ascendButton);
            await this.waitForStableDOM();

            const confirmButton = await this.findComponent({
                text: /confirm/i,
                tag: 'button',
                timeout: 2000
            });

            if (confirmButton) {
                await this.clickElement(confirmButton);
                await this.waitForStableDOM();
            }

            return true;

        } catch (error) {
            this.logError(`Failed to ascend member ${memberName}: ${error}`);
            return false;
        }
    }

    private async parseGangMember(element: Element): Promise<GangMemberInfo | null> {
        try {
            const textContent = this.extractTextContent(element);
            
            const nameMatch = textContent.match(/^([A-Za-z\s]+)/);
            const name = nameMatch?.[1]?.trim() || 'Unknown';

            const taskMatch = textContent.match(/Task:\s*([^|]+)/);
            const task = taskMatch?.[1]?.trim() || 'Unassigned';

            const earningsMatch = textContent.match(/\$([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const earnings = this.parseNumber(earningsMatch?.[1] || '0');

            const respectMatch = textContent.match(/Respect:\s*([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const respect = this.parseNumber(respectMatch?.[1] || '0');

            const wantedMatch = textContent.match(/Wanted:\s*([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const wanted = this.parseNumber(wantedMatch?.[1] || '0');

            const hackMatch = textContent.match(/Hack:\s*([0-9,]+)/);
            const hack = parseInt(hackMatch?.[1]?.replace(/,/g, '') || '0');

            const strMatch = textContent.match(/Str:\s*([0-9,]+)/);
            const str = parseInt(strMatch?.[1]?.replace(/,/g, '') || '0');

            const defMatch = textContent.match(/Def:\s*([0-9,]+)/);
            const def = parseInt(defMatch?.[1]?.replace(/,/g, '') || '0');

            const dexMatch = textContent.match(/Dex:\s*([0-9,]+)/);
            const dex = parseInt(dexMatch?.[1]?.replace(/,/g, '') || '0');

            const agiMatch = textContent.match(/Agi:\s*([0-9,]+)/);
            const agi = parseInt(agiMatch?.[1]?.replace(/,/g, '') || '0');

            const chaMatch = textContent.match(/Cha:\s*([0-9,]+)/);
            const cha = parseInt(chaMatch?.[1]?.replace(/,/g, '') || '0');

            return {
                name,
                task,
                earnings,
                respect,
                wanted,
                stats: { hack, str, def, dex, agi, cha }
            };

        } catch (error) {
            this.logError(`Failed to parse gang member: ${error}`);
            return null;
        }
    }

    private async parseTerritoryWarInfo(element: Element): Promise<TerritoryWarInfo | null> {
        try {
            const textContent = this.extractTextContent(element);
            
            const enemyMatch = textContent.match(/^([^:]+):/);
            const enemy = enemyMatch?.[1]?.trim() || 'Unknown';

            const powerMatch = textContent.match(/Power:\s*([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const power = this.parseNumber(powerMatch?.[1] || '0');

            const territoryMatch = textContent.match(/Territory:\s*([0-9.]+)%/);
            const territory = parseFloat(territoryMatch?.[1] || '0');

            const chanceMatch = textContent.match(/Chance:\s*([0-9.]+)%/);
            const chance = parseFloat(chanceMatch?.[1] || '0');

            return { enemy, power, territory, chance };

        } catch (error) {
            this.logError(`Failed to parse territory war info: ${error}`);
            return null;
        }
    }

    private async getTerritoryInfo(): Promise<{ territory: number; power: number }> {
        try {
            const territoryElement = await this.findComponent({
                text: /territory.*%/i,
                timeout: 2000
            });

            const territoryText = territoryElement ? this.extractTextContent(territoryElement) : '';
            const territoryMatch = territoryText.match(/([0-9.]+)%/);
            const territory = parseFloat(territoryMatch?.[1] || '0');

            const powerElement = await this.findComponent({
                text: /power/i,
                timeout: 2000
            });

            const powerText = powerElement ? this.extractTextContent(powerElement) : '';
            const powerMatch = powerText.match(/([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const power = this.parseNumber(powerMatch?.[1] || '0');

            return { territory, power };

        } catch (error) {
            this.logError(`Failed to get territory info: ${error}`);
            return { territory: 0, power: 0 };
        }
    }

    private async getGangStats(): Promise<{ respect: number; wantedLevel: number; money: number }> {
        try {
            const respectElement = await this.findComponent({
                text: /respect.*[0-9]/i,
                timeout: 2000
            });

            const respectText = respectElement ? this.extractTextContent(respectElement) : '';
            const respectMatch = respectText.match(/([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const respect = this.parseNumber(respectMatch?.[1] || '0');

            const wantedElement = await this.findComponent({
                text: /wanted.*[0-9]/i,
                timeout: 2000
            });

            const wantedText = wantedElement ? this.extractTextContent(wantedElement) : '';
            const wantedMatch = wantedText.match(/([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const wantedLevel = this.parseNumber(wantedMatch?.[1] || '0');

            const moneyElement = await this.findComponent({
                text: /\$[0-9]/i,
                timeout: 2000
            });

            const moneyText = moneyElement ? this.extractTextContent(moneyElement) : '';
            const moneyMatch = moneyText.match(/\$([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const money = this.parseNumber(moneyMatch?.[1] || '0');

            return { respect, wantedLevel, money };

        } catch (error) {
            this.logError(`Failed to get gang stats: ${error}`);
            return { respect: 0, wantedLevel: 0, money: 0 };
        }
    }
}