import { ReactGamePage } from '/lib/react-game-page';
import { ReactElementFinder } from '/lib/react-element-finder';
import { ReactEventHandler } from '/lib/react-event-handler';
import { GameSection, NavigationParams, NavigationResult, ReactComponentInfo } from '/navigator-react-types';

/**
 * React-powered Terminal page navigation
 * Handles terminal interface and command execution monitoring
 */
export class ReactTerminalPage extends ReactGamePage {
    private elementFinder: ReactElementFinder;

    constructor() {
        super();
        this.elementFinder = new ReactElementFinder();
    }

    async navigate(params?: NavigationParams): Promise<NavigationResult> {
        try {
            // Look for terminal navigation component
            const terminalNav = await this.elementFinder.findByCriteria({
                textContent: 'Terminal',
                interactive: true,
                muiType: 'Tab',
                limit: 1
            });

            if (terminalNav.length === 0) {
                // Fallback: look for terminal button
                const terminalButton = await this.elementFinder.findByCriteria({
                    textContent: 'Terminal',
                    interactive: true,
                    limit: 1
                });

                if (terminalButton.length === 0) {
                    return this.createResult(false, 'Terminal navigation element not found');
                }

                const clickSuccess = await this.clickComponent(terminalButton[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click terminal navigation');
                }
            } else {
                const clickSuccess = await this.clickComponent(terminalNav[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click terminal tab');
                }
            }

            // Wait for terminal interface to load
            const terminalReady = await this.waitForPageTransition('Terminal', 3000);
            if (!terminalReady) {
                return this.createResult(false, 'Terminal interface did not load');
            }

            return this.createResult(true, 'Successfully navigated to Terminal');

        } catch (error) {
            return this.createResult(false, `Terminal navigation error: ${error}`);
        }
    }

    async isOnPage(): Promise<boolean> {
        try {
            // Check for terminal-specific components
            const terminalComponents = await this.elementFinder.findByCriteria({
                displayName: 'Terminal',
                visible: true,
                limit: 1
            });

            if (terminalComponents.length > 0) {
                return true;
            }

            // Check for terminal input field
            const terminalInput = await this.elementFinder.findByCriteria({
                attributes: { 'class': 'terminal-input' },
                visible: true,
                limit: 1
            });

            return terminalInput.length > 0;

        } catch (error) {
            console.warn('Error checking terminal page:', error);
            return false;
        }
    }

    async getPrimaryComponent(): Promise<ReactComponentInfo | null> {
        try {
            // Look for main terminal component
            const terminalComponent = await this.elementFinder.findByCriteria({
                displayName: 'Terminal',
                visible: true,
                limit: 1
            });

            return terminalComponent.length > 0 ? terminalComponent[0] : null;

        } catch (error) {
            console.warn('Error getting terminal primary component:', error);
            return null;
        }
    }

    /**
     * Get the terminal input component for command execution
     * @returns Terminal input component or null
     */
    async getTerminalInput(): Promise<ReactComponentInfo | null> {
        try {
            const inputComponents = await this.elementFinder.findByCriteria({
                attributes: { 'type': 'text' },
                customFilter: (component) => {
                    const element = component.domElement as HTMLInputElement;
                    return element?.className?.includes('terminal') ||
                           element?.placeholder?.includes('terminal') ||
                           element?.id?.includes('terminal');
                },
                visible: true,
                limit: 1
            });

            return inputComponents.length > 0 ? inputComponents[0] : null;

        } catch (error) {
            console.warn('Error getting terminal input:', error);
            return null;
        }
    }

    /**
     * Execute a command in the terminal
     * @param command Command to execute
     * @returns Success status
     */
    async executeCommand(command: string): Promise<boolean> {
        try {
            const terminalInput = await this.getTerminalInput();
            if (!terminalInput || !terminalInput.domElement) {
                return false;
            }

            // Focus and clear input
            const inputElement = terminalInput.domElement as HTMLInputElement;
            inputElement.focus();
            inputElement.value = '';

            // Type command
            await ReactEventHandler.simulateTyping(inputElement, command);
            await this.sleep(100);

            // Press Enter
            await ReactEventHandler.simulateKeyPress(inputElement, 'Enter');

            return true;

        } catch (error) {
            console.warn('Error executing terminal command:', error);
            return false;
        }
    }

    /**
     * Get terminal output text
     * @returns Current terminal output
     */
    async getTerminalOutput(): Promise<string> {
        try {
            const outputComponents = await this.elementFinder.findByCriteria({
                customFilter: (component): boolean => {
                    const element = component.domElement;
                    return !!(element?.className?.includes('terminal-output') ||
                            element?.className?.includes('terminal-content'));
                },
                visible: true,
                limit: 1
            });

            if (outputComponents.length > 0) {
                return this.extractComponentText(outputComponents[0]);
            }

            return '';

        } catch (error) {
            console.warn('Error getting terminal output:', error);
            return '';
        }
    }
}