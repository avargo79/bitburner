import { getWindowAPI } from '/lib/react-browser-utils';
import { findReactComponent } from '/lib/react-component-finder';
import { MaterialUIHelper } from '/lib/material-ui-integration';
import { ReactEventHandler } from '/lib/react-event-handler';
import { GameSection, NavigationParams, ReactComponentInfo, NavigationResult } from '/lib/navigator-react-types';

/**
 * Base class for React-powered game page navigation
 * Provides common patterns for React component discovery and interaction
 */
export abstract class ReactGamePage {
    protected window: Window;
    protected muiHelper: MaterialUIHelper;
    protected eventHandler: ReactEventHandler;

    constructor() {
        this.window = getWindowAPI();
        this.muiHelper = new MaterialUIHelper();
        this.eventHandler = new ReactEventHandler();
    }

    /**
     * Navigate to this game section using React component interaction
     * @param params Navigation parameters specific to this section
     * @returns Navigation result with success status and details
     */
    abstract navigate(params?: NavigationParams): Promise<NavigationResult>;

    /**
     * Verify we're currently on the correct page by checking React components
     * @returns True if on correct page, false otherwise
     */
    abstract isOnPage(): Promise<boolean>;

    /**
     * Get the primary navigation component for this page
     * @returns React component info for the main navigation element
     */
    abstract getPrimaryComponent(): Promise<ReactComponentInfo | null>;

    /**
     * Ensure we're on the correct page, navigating if necessary
     * @returns True if successfully on page, false otherwise
     */
    async ensureOnPage(): Promise<boolean> {
        try {
            // Check if we're already on the correct page
            if (await this.isOnPage()) {
                return true;
            }

            // Navigate to the page
            const result = await this.navigate();
            return result.success;
        } catch (error) {
            console.warn('Failed to ensure on page:', error);
            return false;
        }
    }

    /**
     * Find React components by search criteria (returns ReactComponentInfo[])
     * @param criteria Search criteria object
     * @returns Array of matching React components
     */
    protected async findComponents(criteria: { 
        text?: string | RegExp; 
        className?: string | RegExp; 
        role?: string; 
        ancestor?: Element | ReactComponentInfo; 
        timeout?: number;
        tag?: string;
        type?: string;
        placeholder?: string | RegExp;
    }): Promise<ReactComponentInfo[]>;
    /**
     * Find React components by display name with caching
     * @param displayName React component displayName to search for
     * @param maxDepth Maximum depth to search (default: 10)
     * @returns Array of matching React components with props and state
     */
    protected async findComponents(displayName: string, maxDepth?: number): Promise<ReactComponentInfo[]>;
    protected async findComponents(
        criteriaOrDisplayName: string | { 
            text?: string | RegExp; 
            className?: string | RegExp; 
            role?: string; 
            ancestor?: Element | ReactComponentInfo; 
            timeout?: number;
            tag?: string;
            type?: string;
            placeholder?: string | RegExp;
        }, 
        maxDepth: number = 10
    ): Promise<ReactComponentInfo[]> {
        if (typeof criteriaOrDisplayName === 'string') {
            // Original string-based implementation
            try {
                const components = await findReactComponent({ displayName: criteriaOrDisplayName, maxDepth });
                return components.map(component => ({
                    displayName: component.displayName || component.type,
                    props: component.props,
                    state: component.state,
                    domElement: component.element,
                    fiber: component.fiber
                }));
            } catch (error) {
                console.warn(`Failed to find React components with displayName: ${criteriaOrDisplayName}`, error);
                return [];
            }
        } else {
            // Object-based criteria implementation
            const searchCriteria = criteriaOrDisplayName;
            const timeout = searchCriteria.timeout || 5000;
            const startTime = Date.now();
            const results: ReactComponentInfo[] = [];
            
            while (Date.now() - startTime < timeout) {
                const components = await this.findComponents('*', maxDepth);
                
                for (const c of components) {
                    if (!c.domElement) continue;
                    
                    let matches = true;
                    
                    // Check text criteria
                    if (searchCriteria.text && matches) {
                        const text = this.extractTextContent(c);
                        matches = searchCriteria.text instanceof RegExp 
                            ? searchCriteria.text.test(text)
                            : text.includes(searchCriteria.text as string);
                    }
                    
                    // Check className criteria  
                    if (searchCriteria.className && matches) {
                        const classList = c.domElement.classList;
                        const classNames = Array.from(classList) as string[];
                        matches = searchCriteria.className instanceof RegExp
                            ? classNames.some(cls => (searchCriteria.className as RegExp).test(cls))
                            : classList.contains(searchCriteria.className as string);
                    }

                    // Check role criteria
                    if (searchCriteria.role && matches) {
                        const role = c.domElement.getAttribute('role');
                        matches = role === searchCriteria.role;
                    }
                    
                    // Check tag criteria
                    if (searchCriteria.tag && matches) {
                        matches = c.domElement.tagName.toLowerCase() === searchCriteria.tag.toLowerCase();
                    }
                    
                    // Check type criteria (for input elements)
                    if (searchCriteria.type && matches) {
                        const type = c.domElement.getAttribute('type');
                        matches = type === searchCriteria.type;
                    }
                    
                    // Check placeholder criteria
                    if (searchCriteria.placeholder && matches) {
                        const placeholder = c.domElement.getAttribute('placeholder');
                        if (placeholder) {
                            matches = searchCriteria.placeholder instanceof RegExp
                                ? searchCriteria.placeholder.test(placeholder)
                                : placeholder.includes(searchCriteria.placeholder);
                        } else {
                            matches = false;
                        }
                    }
                    
                    // Check ancestor criteria
                    if (searchCriteria.ancestor && matches) {
                        const ancestorElement = 'domElement' in searchCriteria.ancestor 
                            ? searchCriteria.ancestor.domElement 
                            : searchCriteria.ancestor as Element;
                        if (ancestorElement && c.domElement) {
                            matches = ancestorElement.contains(c.domElement);
                        } else {
                            matches = false;
                        }
                    }
                    
                    if (matches) {
                        results.push(c);
                    }
                }
                
                if (results.length > 0) break;
                
                // Short delay before retrying
                await this.sleep(100);
            }
            
            return results;
        }
    }

    /**
     * Find Material-UI components by component type
     * @param componentType MUI component type (e.g., 'Button', 'Tab', 'MenuItem')
     * @returns Array of matching MUI components
     */
    protected async findMUIComponents(componentType: string): Promise<ReactComponentInfo[]> {
        try {
            return await MaterialUIHelper.findMUIComponents(componentType);
        } catch (error) {
            console.warn(`Failed to find MUI components of type: ${componentType}`, error);
            return [];
        }
    }

    /**
     * Click a React component using natural event simulation
     * @param component React component to click
     * @param options Click options (delay, position, etc.)
     * @returns Success status of the click operation
     */
    protected async clickComponent(component: ReactComponentInfo, options?: {
        delay?: number;
        position?: { x: number; y: number };
        doubleClick?: boolean;
    }): Promise<boolean> {
        if (!component.domElement) {
            console.warn('Cannot click component without DOM element');
            return false;
        }

        try {
            // Convert ReactComponentInfo to ReactComponent format for the event handler
            const reactComponent = {
                fiber: component.fiber,
                element: component.domElement!,
                props: component.props || {},
                state: component.state || {},
                type: component.displayName || 'Unknown',
                displayName: component.displayName,
                isVisible: true,
                depth: 0
            };
            const result = await ReactEventHandler.simulateClick(reactComponent);
            return result.success;
        } catch (error) {
            console.warn('Failed to click React component', error);
            return false;
        }
    }

    /**
     * Wait for a React component to appear with timeout
     * @param displayName Component displayName to wait for
     * @param timeout Maximum wait time in milliseconds (default: 5000)
     * @param interval Check interval in milliseconds (default: 100)
     * @returns First matching component or null if timeout
     */
    protected async waitForComponent(
        displayName: string, 
        timeout: number = 5000, 
        interval: number = 100
    ): Promise<ReactComponentInfo | null> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const components = await this.findComponents(displayName);
            if (components.length > 0) {
                return components[0];
            }
            await this.sleep(interval);
        }
        
        return null;
    }

    /**
     * Wait for page transition to complete by checking for target component
     * @param targetDisplayName Expected component after navigation
     * @param timeout Maximum wait time in milliseconds (default: 3000)
     * @returns True if transition successful, false if timeout
     */
    protected async waitForPageTransition(targetDisplayName: string, timeout: number = 3000): Promise<boolean> {
        const component = await this.waitForComponent(targetDisplayName, timeout);
        return component !== null;
    }

    /**
     * Extract text content from React component
     * @param component React component to extract text from
     * @returns Text content of the component
     */
    protected extractComponentText(component: ReactComponentInfo): string {
        if (component.domElement) {
            return component.domElement.textContent || (component.domElement as HTMLElement).innerText || '';
        }
        
        // Try to extract from React props
        if (component.props && typeof component.props.children === 'string') {
            return component.props.children;
        }
        
        return '';
    }

    /**
     * Check if React component is interactive (clickable, has handlers)
     * @param component React component to check
     * @returns True if component appears interactive
     */
    protected isComponentInteractive(component: ReactComponentInfo): boolean {
        // Check for common interactive props
        if (component.props) {
            const interactiveProps = ['onClick', 'onPress', 'onTap', 'href', 'to'];
            if (interactiveProps.some(prop => prop in component.props!)) {
                return true;
            }
        }

        // Check DOM element for interactive attributes
        if (component.domElement) {
            const element = component.domElement;
            const tagName = element.tagName.toLowerCase();
            
            // Common interactive elements
            if (['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
                return true;
            }
            
            // Check for click handlers or role attributes
            if ((element as HTMLElement).onclick || 
                element.getAttribute('role') === 'button' ||
                element.getAttribute('tabindex') !== null) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get navigation breadcrumb from current page
     * @returns Array of navigation path components
     */
    protected async getNavigationBreadcrumb(): Promise<string[]> {
        try {
            // Look for common breadcrumb patterns
            const breadcrumbComponents = await this.findComponents('Breadcrumb');
            if (breadcrumbComponents.length > 0) {
                return this.extractBreadcrumbPath(breadcrumbComponents[0]);
            }

            // Look for navigation indicators
            const navComponents = await this.findComponents('Navigation');
            if (navComponents.length > 0) {
                return this.extractNavigationPath(navComponents[0]);
            }

            return [];
        } catch (error) {
            console.warn('Failed to get navigation breadcrumb', error);
            return [];
        }
    }

    /**
     * Extract breadcrumb path from breadcrumb component
     * @param breadcrumbComponent React breadcrumb component
     * @returns Array of breadcrumb path items
     */
    private extractBreadcrumbPath(breadcrumbComponent: ReactComponentInfo): string[] {
        const path: string[] = [];
        
        // Try to extract from props
        if (breadcrumbComponent.props && breadcrumbComponent.props.items) {
            const items = breadcrumbComponent.props.items;
            if (Array.isArray(items)) {
                return items.map(item => 
                    typeof item === 'string' ? item : 
                    item.label || item.text || item.name || String(item)
                );
            }
        }

        // Try to extract from DOM
        if (breadcrumbComponent.domElement) {
            const breadcrumbItems = breadcrumbComponent.domElement.querySelectorAll('[role="button"], a, span');
            breadcrumbItems.forEach(item => {
                const text = item.textContent?.trim();
                if (text && !path.includes(text)) {
                    path.push(text);
                }
            });
        }

        return path;
    }

    /**
     * Extract navigation path from navigation component
     * @param navComponent React navigation component
     * @returns Array of navigation path items
     */
    private extractNavigationPath(navComponent: ReactComponentInfo): string[] {
        const path: string[] = [];
        
        if (navComponent.domElement) {
            const activeItems = navComponent.domElement.querySelectorAll('.active, [aria-selected="true"], .selected');
            activeItems.forEach(item => {
                const text = item.textContent?.trim();
                if (text) {
                    path.push(text);
                }
            });
        }

        return path;
    }

    /**
     * Utility sleep function for delays
     * @param ms Milliseconds to sleep
     */
    protected sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create navigation result object
     * @param success Whether navigation was successful
     * @param message Optional message describing the result
     * @param data Optional additional data
     * @returns NavigationResult object
     */
    protected createResult(success: boolean, message?: string, data?: any): NavigationResult {
        return {
            success,
            message,
            timestamp: Date.now(),
            section: this.constructor.name.replace('ReactPage', '').toLowerCase() as GameSection,
            data
        };
    }

    // === Missing Utility Methods ===

    /**
     * Log error message to console
     * @param message Error message to log
     */
    protected logError(message: string): void {
        console.error(`[${this.constructor.name}] ${message}`);
    }

    /**
     * Wait for page to fully load by checking for stable DOM
     * @param timeout Maximum wait time in milliseconds
     */
    protected async waitForPageLoad(timeout: number = 5000): Promise<void> {
        const startTime = Date.now();
        let lastBodyHTML = '';
        let stableCount = 0;
        const requiredStableChecks = 3;

        while (Date.now() - startTime < timeout) {
            const currentBodyHTML = this.window.document.body.innerHTML;
            
            if (currentBodyHTML === lastBodyHTML) {
                stableCount++;
                if (stableCount >= requiredStableChecks) {
                    return; // DOM is stable
                }
            } else {
                stableCount = 0;
                lastBodyHTML = currentBodyHTML;
            }
            
            await this.sleep(100);
        }
    }

    /**
     * Wait for DOM to stabilize after an action
     * @param timeout Maximum wait time in milliseconds
     */
    protected async waitForStableDOM(timeout: number = 3000): Promise<void> {
        await this.waitForPageLoad(timeout);
    }

    /**
     * Click a DOM element with proper event simulation
     * @param element Element to click
     */
    protected async clickElement(element: Element): Promise<void>;
    /**
     * Click a React component by extracting its DOM element
     * @param component React component to click  
     */
    protected async clickElement(component: ReactComponentInfo): Promise<void>;
    protected async clickElement(elementOrComponent: Element | ReactComponentInfo): Promise<void> {
        const element = 'domElement' in elementOrComponent ? elementOrComponent.domElement : elementOrComponent;
        
        if (!element || !(element instanceof HTMLElement)) {
            return;
        }

        // Create and dispatch proper mouse events
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY
        });

        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY
        });

        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY
        });

        element.dispatchEvent(mouseDownEvent);
        await this.sleep(50);
        element.dispatchEvent(mouseUpEvent);
        element.dispatchEvent(clickEvent);
        
        // Also trigger focus if it's a focusable element
        if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement || element instanceof HTMLSelectElement) {
            element.focus();
        }
    }

    /**
     * Extract text content from a React component
     * @param component Component to extract text from
     */
    protected extractTextContent(component: ReactComponentInfo): string;
    /**
     * Extract text content from a DOM element
     * @param element Element to extract text from
     */
    protected extractTextContent(element: Element): string;
    protected extractTextContent(componentOrElement: ReactComponentInfo | Element): string {
        if ('domElement' in componentOrElement) {
            // It's a ReactComponentInfo
            return this.extractComponentText(componentOrElement);
        } else {
            // It's an Element
            return (componentOrElement as Element).textContent || (componentOrElement as HTMLElement).innerText || '';
        }
    }

    /**
     * Check if an element (checkbox, radio) is checked
     * @param element Element to check
     */
    protected isElementChecked(element: Element): boolean;
    /**
     * Check if a React component (checkbox, radio) is checked
     * @param component React component to check
     */
    protected isElementChecked(component: ReactComponentInfo): boolean;
    protected isElementChecked(elementOrComponent: Element | ReactComponentInfo): boolean {
        const element = 'domElement' in elementOrComponent ? elementOrComponent.domElement : elementOrComponent;
        
        if (element && element instanceof HTMLInputElement) {
            return element.checked;
        }
        return false;
    }

    /**
     * Type text into an input element
     * @param element Input element to type into
     * @param text Text to type
     */
    protected async typeText(element: Element, text: string): Promise<void>;
    /**
     * Type text into a React input component
     * @param component React input component
     * @param text Text to type
     */
    protected async typeText(component: ReactComponentInfo, text: string): Promise<void>;
    protected async typeText(elementOrComponent: Element | ReactComponentInfo, text: string): Promise<void> {
        const element = 'domElement' in elementOrComponent ? elementOrComponent.domElement : elementOrComponent;
        
        if (element && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
            // Clear existing value
            element.value = '';
            element.focus();
            
            // Type character by character with slight delay
            for (const char of text) {
                element.value += char;
                
                // Trigger input events
                element.dispatchEvent(new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: char
                }));
                
                await this.sleep(50); // Small delay between characters
            }
            
            // Trigger change event
            element.dispatchEvent(new Event('change', {
                bubbles: true,
                cancelable: true
            }));
        }
    }

    /**
     * Select an option in a select element
     * @param element Select element
     * @param value Value to select
     */
    protected async selectOption(element: Element, value: string): Promise<void>;
    /**
     * Select an option in a React select component
     * @param component React select component
     * @param value Value to select
     */
    protected async selectOption(component: ReactComponentInfo, value: string): Promise<void>;
    protected async selectOption(elementOrComponent: Element | ReactComponentInfo, value: string): Promise<void> {
        const element = 'domElement' in elementOrComponent ? elementOrComponent.domElement : elementOrComponent;
        
        if (element && element instanceof HTMLSelectElement) {
            element.value = value;
            element.dispatchEvent(new Event('change', {
                bubbles: true,
                cancelable: true
            }));
        }
    }

    /**
     * Parse number from text string, handling various formats
     * @param text Text to parse number from
     */
    protected parseNumber(text: string): number {
        // Remove common formatting characters
        const cleanText = text.replace(/[,$%\s]/g, '');
        const num = parseFloat(cleanText);
        return isNaN(num) ? 0 : num;
    }

    /**
     * Enhanced findComponent that accepts complex search criteria
     */
    protected async findComponent(criteria: string): Promise<ReactComponentInfo | null>;
    protected async findComponent(criteria: { 
        text?: string | RegExp; 
        className?: string | RegExp; 
        role?: string; 
        ancestor?: Element | ReactComponentInfo; 
        timeout?: number;
        tag?: string;
        type?: string;
        placeholder?: string | RegExp;
    }): Promise<ReactComponentInfo | null>;
    protected async findComponent(criteria: string | { 
        text?: string | RegExp; 
        className?: string | RegExp; 
        role?: string; 
        ancestor?: Element | ReactComponentInfo; 
        timeout?: number;
        tag?: string;
        type?: string;
        placeholder?: string | RegExp;
    }): Promise<ReactComponentInfo | null> {
        if (typeof criteria === 'string') {
            const components = await this.findComponents(criteria);
            return components.length > 0 ? components[0] : null;
        }
        
        // Handle object criteria
        const searchCriteria = criteria;
        const timeout = searchCriteria.timeout || 5000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const components = await this.findComponents('*');
            
            for (const c of components) {
                if (!c.domElement) continue;
                
                let matches = true;
                
                // Check text criteria
                if (searchCriteria.text && matches) {
                    const text = this.extractTextContent(c);
                    matches = searchCriteria.text instanceof RegExp 
                        ? searchCriteria.text.test(text)
                        : text.includes(searchCriteria.text as string);
                }
                
                // Check className criteria  
                if (searchCriteria.className && matches) {
                    const classList = c.domElement.classList;
                    const classNames = Array.from(classList) as string[];
                    matches = searchCriteria.className instanceof RegExp
                        ? classNames.some(cls => (searchCriteria.className as RegExp).test(cls))
                        : classList.contains(searchCriteria.className as string);
                }

                // Check role criteria
                if (searchCriteria.role && matches) {
                    const role = c.domElement.getAttribute('role');
                    matches = role === searchCriteria.role;
                }
                
                // Check tag criteria
                if (searchCriteria.tag && matches) {
                    matches = c.domElement.tagName.toLowerCase() === searchCriteria.tag.toLowerCase();
                }
                
                // Check type criteria (for input elements)
                if (searchCriteria.type && matches) {
                    const type = c.domElement.getAttribute('type');
                    matches = type === searchCriteria.type;
                }
                
                // Check placeholder criteria
                if (searchCriteria.placeholder && matches) {
                    const placeholder = c.domElement.getAttribute('placeholder');
                    if (placeholder) {
                        matches = searchCriteria.placeholder instanceof RegExp
                            ? searchCriteria.placeholder.test(placeholder)
                            : placeholder.includes(searchCriteria.placeholder);
                    } else {
                        matches = false;
                    }
                }
                
                // Check ancestor criteria
                if (searchCriteria.ancestor && matches) {
                    const ancestorElement = 'domElement' in searchCriteria.ancestor 
                        ? searchCriteria.ancestor.domElement 
                        : searchCriteria.ancestor;
                    
                    if (ancestorElement) {
                        matches = (ancestorElement as Element).contains(c.domElement);
                    }
                }
                
                if (matches) {
                    return c;
                }
            }
            
            // Small delay before retrying
            await this.sleep(100);
        }
        
        return null;
    }

    /**
     * Enhanced findComponents method to return Element[] when needed for backwards compatibility
     */
    protected async findElementComponents(criteria: { 
        text?: string | RegExp; 
        className?: string | RegExp; 
        role?: string; 
        timeout?: number;
        tag?: string;
        type?: string;
        placeholder?: string | RegExp;
    }): Promise<Element[]> {
        const component = await this.findComponent(criteria);
        if (component && component.domElement) {
            return [component.domElement];
        }
        return [];
    }

    /**
     * Wait for a delay
     * @param ms Milliseconds to wait
     */
    protected async waitForDelay(ms: number): Promise<void> {
        await this.sleep(ms);
    }

    /**
     * Helper method to access domElement properties safely
     */
    protected getElementFromComponent(component: ReactComponentInfo): Element | null {
        return component.domElement || null;
    }

    /**
     * Check if a ReactComponentInfo has a specific attribute
     */
    protected componentHasAttribute(component: ReactComponentInfo, attributeName: string): boolean {
        return component.domElement?.hasAttribute(attributeName) || false;
    }

    /**
     * Get text content from ReactComponentInfo or Element
     */
    protected getTextContent(target: ReactComponentInfo | Element): string {
        if ('domElement' in target) {
            return target.domElement?.textContent || '';
        }
        return (target as Element).textContent || '';
    }

    /**
     * Convert ReactComponentInfo to Element for backwards compatibility
     */
    protected toElement(componentOrElement: ReactComponentInfo | Element | null): Element | null {
        if (!componentOrElement) return null;
        if ('domElement' in componentOrElement) {
            return componentOrElement.domElement || null;
        }
        return componentOrElement as Element;
    }

    /**
     * Convert ReactComponentInfo array to Element array for backwards compatibility
     */
    protected toElements(components: ReactComponentInfo[] | Element[]): Element[] {
        return components.map(component => {
            if ('domElement' in component) {
                return component.domElement;
            }
            return component as Element;
        }).filter(el => el !== null) as Element[];
    }
}