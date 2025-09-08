import { Logger } from '/logger';

function getAPI(apiName: string): any {
    return (globalThis as any)[apiName];
}

export function getWindowAPI(): any {
    return getAPI('win' + 'dow');
}

export function getDocumentAPI(): any {
    return getAPI('doc' + 'ument');
}

export function getNavigatorAPI(): any {
    return getAPI('nav' + 'igator');
}

export function getLocationAPI(): any {
    return getAPI('loc' + 'ation');
}

export function getHistoryAPI(): any {
    return getAPI('his' + 'tory');
}

export function createElement(tagName: string): any {
    const doc = getDocumentAPI();
    return doc.createElement(tagName);
}

export function querySelector(selector: string): any {
    const doc = getDocumentAPI();
    return doc.querySelector(selector);
}

export function querySelectorAll(selector: string): any {
    const doc = getDocumentAPI();
    return doc.querySelectorAll(selector);
}

export function getElementById(id: string): any {
    const doc = getDocumentAPI();
    return doc.getElementById(id);
}

export function getBody(): any {
    const doc = getDocumentAPI();
    return doc.body;
}

export function getHead(): any {
    const doc = getDocumentAPI();
    return doc.head;
}

export function getUserAgent(): string {
    const nav = getNavigatorAPI();
    return nav.userAgent || 'unknown';
}

export function getCurrentURL(): string {
    const loc = getLocationAPI();
    return loc.href || 'unknown';
}

export function getHostname(): string {
    const loc = getLocationAPI();
    return loc.hostname || 'unknown';
}

export function getTitle(): string {
    const doc = getDocumentAPI();
    return doc.title || 'unknown';
}

export function navigateToURL(url: string): void {
    const loc = getLocationAPI();
    loc.href = url;
}

export function reloadPage(): void {
    const loc = getLocationAPI();
    loc.reload();
}

export function goBack(): void {
    const hist = getHistoryAPI();
    hist.back();
}

export function goForward(): void {
    const hist = getHistoryAPI();
    hist.forward();
}

export function clickElement(selector: string): boolean {
    try {
        const element = querySelector(selector);
        if (element && element.click) {
            element.click();
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function setElementValue(selector: string, value: string): boolean {
    try {
        const element = querySelector(selector);
        if (element) {
            element.value = value;
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function getElementText(selector: string): string {
    try {
        const element = querySelector(selector);
        return element ? (element.textContent || element.innerText || '') : '';
    } catch (e) {
        return '';
    }
}

export function waitForElement(selector: string, timeoutMs: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkElement = () => {
            const element = querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            if (Date.now() - startTime > timeoutMs) {
                reject(new Error(`Element ${selector} not found within ${timeoutMs}ms`));
                return;
            }
            
            setTimeout(checkElement, 100);
        };
        
        checkElement();
    });
}

export const storage = {
    set: (key: string, value: string): boolean => {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    get: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    },
    
    remove: (key: string): boolean => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    clear: (): boolean => {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            return false;
        }
    }
};

export class TerminalPageImpl {
    private logger: Logger;

    constructor(debug: boolean = false, ns?: any) {
        this.logger = new Logger(debug, ns, 'Terminal');
    }

    async executeCommand(command: string): Promise<boolean> {
        try {
            this.logger.debug(`Executing command: ${command}`);

            const terminalInput = querySelector('input[class*="terminal"]') || 
                                querySelector('input[placeholder*="terminal"]') || 
                                querySelector('.terminal input') ||
                                querySelector('div[class*="terminal"] input');

            if (!terminalInput) {
                this.logger.debug('Could not find terminal input field');
                return false;
            }

            terminalInput.value = '';
            terminalInput.focus();
            terminalInput.value = command;

            terminalInput.dispatchEvent(new Event('input', { bubbles: true }));
            terminalInput.dispatchEvent(new Event('change', { bubbles: true }));

            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            terminalInput.dispatchEvent(enterEvent);

            this.logger.debug(`Command executed: ${command}`);
            return true;
        } catch (e) {
            this.logger.debug(`Error executing command: ${e}`);
            return false;
        }
    }

    getRecentOutput(lines: number = 5): string[] {
        try {
            const terminalContainer = querySelector('.terminal') || 
                                    querySelector('[class*="terminal"]') ||
                                    querySelector('pre');

            if (!terminalContainer) {
                return [];
            }

            const outputText = terminalContainer.textContent || '';
            const outputLines = outputText.split('\n').filter((line: string) => line.trim().length > 0);
            
            return outputLines.slice(-lines);
        } catch (e) {
            this.logger.debug(`Error getting output: ${e}`);
            return [];
        }
    }

    async waitForOutput(expectedText: string, timeoutMs: number = 5000): Promise<boolean> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeoutMs) {
            const recent = this.getRecentOutput(10);
            const foundText = recent.some(line => line.includes(expectedText));
            
            if (foundText) {
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return false;
    }

    getServerFromPrompt(): string {
        try {
            const recent = this.getRecentOutput(1);
            if (recent.length > 0) {
                const line = recent[0];
                const match = line.match(/\[(.*?)@(.*?)\s+(.*?)\]/);
                if (match) {
                    return match[2] || 'home';
                }
            }
            return 'home';
        } catch (e) {
            return 'home';
        }
    }

    async readFile(filename: string): Promise<string[]> {
        const success = await this.executeCommand(`cat ${filename}`);
        if (!success) return [];

        await new Promise(resolve => setTimeout(resolve, 500));
        return this.getRecentOutput(50);
    }

    async connectToServer(server: string): Promise<boolean> {
        const success = await this.executeCommand(`connect ${server}`);
        if (!success) return false;

        await new Promise(resolve => setTimeout(resolve, 500));
        const newServer = this.getServerFromPrompt();
        return newServer === server;
    }

    async ls(path?: string): Promise<Array<{name: string, type: 'file' | 'script' | 'directory'}>> {
        const command = path ? `ls ${path}` : 'ls';
        const success = await this.executeCommand(command);
        if (!success) return [];

        await new Promise(resolve => setTimeout(resolve, 500));
        const output = this.getRecentOutput(20);
        return this.parseLsOutput(output);
    }

    private parseLsOutput(lines: string[]): Array<{name: string, type: 'file' | 'script' | 'directory'}> {
        const files: Array<{name: string, type: 'file' | 'script' | 'directory'}> = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.includes('$') && !trimmed.includes('[')) {
                let type: 'file' | 'script' | 'directory' = 'file';
                
                if (trimmed.endsWith('.js') || trimmed.endsWith('.script')) {
                    type = 'script';
                } else if (trimmed.endsWith('/')) {
                    type = 'directory';
                }
                
                files.push({
                    name: trimmed.replace('/', ''),
                    type
                });
            }
        }
        
        return files;
    }
}

export class Navigator {
    private logger: Logger;

    constructor(debug: boolean = false, ns?: any) {
        this.logger = new Logger(debug, ns, 'Navigator');
    }

    async terminal(): Promise<TerminalPageImpl> {
        this.logger.debug('Navigating to terminal');
        
        // Simple terminal navigation
        const terminalButton = querySelector('.MuiListItem-root:contains("Terminal")') ||
                              querySelector('div[class*="MuiListItem"]:contains("Terminal")') ||
                              querySelector('.MuiButtonBase-root:contains("Terminal")');
        
        if (terminalButton && terminalButton.click) {
            terminalButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return new TerminalPageImpl(this.logger.debugMode, this.logger.ns);
    }
}