import { ReactGamePage } from '/lib/react-game-page';
import { ComponentSearchCriteria } from '/navigator-react-types';

export interface BladeburnerAction {
    name: string;
    type: 'contract' | 'operation' | 'blackop';
    level: number;
    count: number;
    maxCount: number;
    successChance: number;
    rank: number;
    stamina: number;
    time: number;
}

export interface BladeburnerSkill {
    name: string;
    level: number;
    cost: number;
    description: string;
}

export interface BladeburnerStats {
    rank: number;
    stamina: number;
    maxStamina: number;
    money: number;
    skillPoints: number;
    cyclesRemaining: number;
    currentAction: string;
}

export interface BladeburnerCity {
    name: string;
    chaos: number;
    population: number;
    communities: number;
    synthoids: number;
}

export class ReactBladeburnerPage extends ReactGamePage {
    protected getPageIdentifier(): string {
        return 'bladeburner';
    }

    protected getExpectedUrl(): string {
        return '/bladeburner';
    }

    // Implement required abstract methods
    async navigate(params?: any): Promise<any> {
        try {
            return { success: true, message: 'Navigated to bladeburner page' };
        } catch (error) {
            return { success: false, error: 'Failed to navigate to bladeburner page' };
        }
    }

    async isOnPage(): Promise<boolean> {
        try {
            const components = await this.findComponents('Bladeburner');
            return components.length > 0;
        } catch (error) {
            return false;
        }
    }

    async getPrimaryComponent(): Promise<any> {
        try {
            const components = await this.findComponents('Bladeburner');
            return components.length > 0 ? components[0] : null;
        } catch (error) {
            return null;
        }
    }

    async getBladeburnerStats(): Promise<BladeburnerStats | null> {
        try {
            await this.ensureOnPage();
            await this.waitForPageLoad();

            const rankElement = await this.findComponent({
                text: /rank.*[0-9]/i,
                timeout: 2000
            });

            const rankText = rankElement ? this.extractTextContent(rankElement) : '';
            const rankMatch = rankText.match(/([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const rank = this.parseNumber(rankMatch?.[1] || '0');

            const staminaElement = await this.findComponent({
                text: /stamina.*[0-9]/i,
                timeout: 2000
            });

            const staminaText = staminaElement ? this.extractTextContent(staminaElement) : '';
            const staminaMatch = staminaText.match(/([0-9,]+)\/([0-9,]+)/);
            const stamina = parseInt(staminaMatch?.[1]?.replace(/,/g, '') || '0');
            const maxStamina = parseInt(staminaMatch?.[2]?.replace(/,/g, '') || '0');

            const moneyElement = await this.findComponent({
                text: /\$[0-9]/i,
                timeout: 2000
            });

            const moneyText = moneyElement ? this.extractTextContent(moneyElement) : '';
            const moneyMatch = moneyText.match(/\$([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const money = this.parseNumber(moneyMatch?.[1] || '0');

            const skillPointsElement = await this.findComponent({
                text: /skill.*points.*[0-9]/i,
                timeout: 2000
            });

            const skillPointsText = skillPointsElement ? this.extractTextContent(skillPointsElement) : '';
            const skillPointsMatch = skillPointsText.match(/([0-9,]+)/);
            const skillPoints = parseInt(skillPointsMatch?.[1]?.replace(/,/g, '') || '0');

            const cyclesElement = await this.findComponent({
                text: /cycles.*remaining.*[0-9]/i,
                timeout: 2000
            });

            const cyclesText = cyclesElement ? this.extractTextContent(cyclesElement) : '';
            const cyclesMatch = cyclesText.match(/([0-9,]+)/);
            const cyclesRemaining = parseInt(cyclesMatch?.[1]?.replace(/,/g, '') || '0');

            const currentActionElement = await this.findComponent({
                text: /current.*action/i,
                timeout: 2000
            });

            const currentActionText = currentActionElement ? this.extractTextContent(currentActionElement) : '';
            const currentAction = currentActionText.replace(/current.*action:?\s*/i, '').trim() || 'None';

            return {
                rank,
                stamina,
                maxStamina,
                money,
                skillPoints,
                cyclesRemaining,
                currentAction
            };

        } catch (error) {
            this.logError(`Failed to get Bladeburner stats: ${error}`);
            return null;
        }
    }

    async getAvailableActions(): Promise<BladeburnerAction[]> {
        const actions: BladeburnerAction[] = [];

        try {
            const actionSections = await this.findComponents({
                text: /(contracts|operations|black ops)/i,
                timeout: 3000
            });

            for (const section of actionSections) {
                if (section) {
                    const sectionElement = this.toElement(section);
                    if (sectionElement) {
                        const sectionActions = await this.parseActionSection(sectionElement);
                        actions.push(...sectionActions);
                    }
                }
            }

            return actions;

        } catch (error) {
            this.logError(`Failed to get available actions: ${error}`);
            return [];
        }
    }

    async startAction(actionName: string, actionType: 'contract' | 'operation' | 'blackop'): Promise<boolean> {
        try {
            const actionElement = await this.findComponent({
                text: new RegExp(actionName, 'i'),
                timeout: 2000
            });

            if (!actionElement) {
                this.logError(`Action ${actionName} not found`);
                return false;
            }

            const startButton = await this.findComponent({
                text: /start/i,
                tag: 'button',
                ancestor: actionElement,
                timeout: 2000
            });

            if (!startButton) {
                this.logError(`Start button for ${actionName} not found`);
                return false;
            }

            await this.clickElement(startButton);
            await this.waitForStableDOM();

            return true;

        } catch (error) {
            this.logError(`Failed to start action ${actionName}: ${error}`);
            return false;
        }
    }

    async stopCurrentAction(): Promise<boolean> {
        try {
            const stopButton = await this.findComponent({
                text: /stop/i,
                tag: 'button',
                timeout: 2000
            });

            if (!stopButton) {
                this.logError('Stop button not found');
                return false;
            }

            await this.clickElement(stopButton);
            await this.waitForStableDOM();

            return true;

        } catch (error) {
            this.logError(`Failed to stop current action: ${error}`);
            return false;
        }
    }

    async getSkills(): Promise<BladeburnerSkill[]> {
        const skills: BladeburnerSkill[] = [];

        try {
            const skillsButton = await this.findComponent({
                text: /skills/i,
                tag: 'button',
                timeout: 2000
            });

            if (skillsButton) {
                await this.clickElement(skillsButton);
                await this.waitForStableDOM();
            }

            const skillElements = await this.findComponents({
                className: /skill/i,
                timeout: 3000
            });

            for (const element of skillElements) {
                if (element) {
                    const skillElement = this.toElement(element);
                    if (skillElement) {
                        const skill = await this.parseSkill(skillElement);
                        if (skill) {
                            skills.push(skill);
                        }
                    }
                }
            }

            return skills;

        } catch (error) {
            this.logError(`Failed to get skills: ${error}`);
            return [];
        }
    }

    async upgradeSkill(skillName: string): Promise<boolean> {
        try {
            const skillElement = await this.findComponent({
                text: new RegExp(skillName, 'i'),
                timeout: 2000
            });

            if (!skillElement) {
                this.logError(`Skill ${skillName} not found`);
                return false;
            }

            const upgradeButton = await this.findComponent({
                text: /(upgrade|level up|\+)/i,
                tag: 'button',
                ancestor: skillElement,
                timeout: 2000
            });

            if (!upgradeButton) {
                this.logError(`Upgrade button for ${skillName} not found`);
                return false;
            }

            await this.clickElement(upgradeButton);
            await this.waitForStableDOM();

            return true;

        } catch (error) {
            this.logError(`Failed to upgrade skill ${skillName}: ${error}`);
            return false;
        }
    }

    async getCityInfo(): Promise<BladeburnerCity[]> {
        const cities: BladeburnerCity[] = [];

        try {
            const cityButton = await this.findComponent({
                text: /city/i,
                tag: 'button',
                timeout: 2000
            });

            if (cityButton) {
                await this.clickElement(cityButton);
                await this.waitForStableDOM();
            }

            const cityElements = await this.findComponents({
                className: /city/i,
                timeout: 3000
            });

            for (const element of cityElements) {
                if (element) {
                    const cityElement = this.toElement(element);
                    if (cityElement) {
                        const city = await this.parseCity(cityElement);
                        if (city) {
                            cities.push(city);
                        }
                    }
                }
            }

            return cities;

        } catch (error) {
            this.logError(`Failed to get city info: ${error}`);
            return [];
        }
    }

    async travelToCity(cityName: string): Promise<boolean> {
        try {
            const cityElement = await this.findComponent({
                text: new RegExp(cityName, 'i'),
                timeout: 2000
            });

            if (!cityElement) {
                this.logError(`City ${cityName} not found`);
                return false;
            }

            const travelButton = await this.findComponent({
                text: /travel/i,
                tag: 'button',
                ancestor: cityElement,
                timeout: 2000
            });

            if (!travelButton) {
                this.logError(`Travel button for ${cityName} not found`);
                return false;
            }

            await this.clickElement(travelButton);
            await this.waitForStableDOM();

            return true;

        } catch (error) {
            this.logError(`Failed to travel to ${cityName}: ${error}`);
            return false;
        }
    }

    async recruitTeamMembers(actionName: string, count: number): Promise<boolean> {
        try {
            const actionElement = await this.findComponent({
                text: new RegExp(actionName, 'i'),
                timeout: 2000
            });

            if (!actionElement) {
                this.logError(`Action ${actionName} not found`);
                return false;
            }

            const recruitButton = await this.findComponent({
                text: /recruit/i,
                tag: 'button',
                ancestor: actionElement,
                timeout: 2000
            });

            if (!recruitButton) {
                this.logError(`Recruit button for ${actionName} not found`);
                return false;
            }

            for (let i = 0; i < count; i++) {
                await this.clickElement(recruitButton);
                await this.waitForDelay(100);
            }

            await this.waitForStableDOM();

            return true;

        } catch (error) {
            this.logError(`Failed to recruit team members for ${actionName}: ${error}`);
            return false;
        }
    }

    async automateAction(actionName: string, enable: boolean = true): Promise<boolean> {
        try {
            const actionElement = await this.findComponent({
                text: new RegExp(actionName, 'i'),
                timeout: 2000
            });

            if (!actionElement) {
                this.logError(`Action ${actionName} not found`);
                return false;
            }

            const automateCheckbox = await this.findComponent({
                tag: 'input',
                type: 'checkbox',
                ancestor: actionElement,
                timeout: 2000
            });

            if (!automateCheckbox) {
                this.logError(`Automate checkbox for ${actionName} not found`);
                return false;
            }

            const isChecked = await this.isElementChecked(automateCheckbox);
            
            if (isChecked !== enable) {
                await this.clickElement(automateCheckbox);
                await this.waitForStableDOM();
            }

            return true;

        } catch (error) {
            this.logError(`Failed to ${enable ? 'enable' : 'disable'} automation for ${actionName}: ${error}`);
            return false;
        }
    }

    private async parseActionSection(sectionElement: Element): Promise<BladeburnerAction[]> {
        const actions: BladeburnerAction[] = [];

        try {
            const sectionText = this.extractTextContent(sectionElement);
            let actionType: 'contract' | 'operation' | 'blackop' = 'contract';
            
            if (sectionText.toLowerCase().includes('operation')) {
                actionType = 'operation';
            } else if (sectionText.toLowerCase().includes('black')) {
                actionType = 'blackop';
            }

            const actionElements = await this.findComponents({
                className: /action|item/i,
                ancestor: sectionElement,
                timeout: 2000
            });

            for (const element of actionElements) {
                if (element) {
                    const actionElement = this.toElement(element);
                    if (actionElement) {
                        const action = await this.parseAction(actionElement, actionType);
                        if (action) {
                            actions.push(action);
                        }
                    }
                }
            }

            return actions;

        } catch (error) {
            this.logError(`Failed to parse action section: ${error}`);
            return [];
        }
    }

    private async parseAction(element: Element, type: 'contract' | 'operation' | 'blackop'): Promise<BladeburnerAction | null> {
        try {
            const textContent = this.extractTextContent(element);
            
            const nameMatch = textContent.match(/^([^(]+)/);
            const name = nameMatch?.[1]?.trim() || 'Unknown';

            const levelMatch = textContent.match(/Level:\s*([0-9]+)/i);
            const level = parseInt(levelMatch?.[1] || '1');

            const countMatch = textContent.match(/Count:\s*([0-9]+)\/([0-9]+)/i);
            const count = parseInt(countMatch?.[1] || '0');
            const maxCount = parseInt(countMatch?.[2] || '0');

            const chanceMatch = textContent.match(/([0-9.]+)%.*chance/i);
            const successChance = parseFloat(chanceMatch?.[1] || '0');

            const rankMatch = textContent.match(/Rank:\s*([0-9,]+)/i);
            const rank = parseInt(rankMatch?.[1]?.replace(/,/g, '') || '0');

            const staminaMatch = textContent.match(/Stamina:\s*([0-9,]+)/i);
            const stamina = parseInt(staminaMatch?.[1]?.replace(/,/g, '') || '0');

            const timeMatch = textContent.match(/Time:\s*([0-9.]+)\s*s/i);
            const time = parseFloat(timeMatch?.[1] || '0');

            return {
                name,
                type,
                level,
                count,
                maxCount,
                successChance,
                rank,
                stamina,
                time
            };

        } catch (error) {
            this.logError(`Failed to parse action: ${error}`);
            return null;
        }
    }

    private async parseSkill(element: Element): Promise<BladeburnerSkill | null> {
        try {
            const textContent = this.extractTextContent(element);
            
            const nameMatch = textContent.match(/^([^(]+)/);
            const name = nameMatch?.[1]?.trim() || 'Unknown';

            const levelMatch = textContent.match(/Level:\s*([0-9]+)/i);
            const level = parseInt(levelMatch?.[1] || '0');

            const costMatch = textContent.match(/Cost:\s*([0-9,]+)/i);
            const cost = parseInt(costMatch?.[1]?.replace(/,/g, '') || '0');

            const descMatch = textContent.match(/Description:\s*(.+?)(?:\n|$)/i);
            const description = descMatch?.[1]?.trim() || '';

            return { name, level, cost, description };

        } catch (error) {
            this.logError(`Failed to parse skill: ${error}`);
            return null;
        }
    }

    private async parseCity(element: Element): Promise<BladeburnerCity | null> {
        try {
            const textContent = this.extractTextContent(element);
            
            const nameMatch = textContent.match(/^([^:]+):/);
            const name = nameMatch?.[1]?.trim() || 'Unknown';

            const chaosMatch = textContent.match(/Chaos:\s*([0-9.]+)/i);
            const chaos = parseFloat(chaosMatch?.[1] || '0');

            const popMatch = textContent.match(/Population:\s*([0-9,]+(?:\.[0-9]+)?[kmb]?)/i);
            const population = this.parseNumber(popMatch?.[1] || '0');

            const commMatch = textContent.match(/Communities:\s*([0-9,]+)/i);
            const communities = parseInt(commMatch?.[1]?.replace(/,/g, '') || '0');

            const synthMatch = textContent.match(/Synthoids:\s*([0-9,]+)/i);
            const synthoids = parseInt(synthMatch?.[1]?.replace(/,/g, '') || '0');

            return { name, chaos, population, communities, synthoids };

        } catch (error) {
            this.logError(`Failed to parse city: ${error}`);
            return null;
        }
    }
}