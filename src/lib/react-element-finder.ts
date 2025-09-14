import { getWindowAPI, getDocumentAPI } from '/lib/react-browser-utils';
import { findReactComponent } from '/lib/react-component-finder';
import { MaterialUIHelper } from '/lib/material-ui-integration';
import { ReactComponentInfo, ComponentSearchCriteria } from '/lib/navigator-react-types';

/**
 * Advanced React component element finder with Material-UI integration
 * Provides sophisticated component discovery and filtering capabilities
 */
export class ReactElementFinder {
    private window: Window;
    private document: Document;
    private componentCache: Map<string, { components: ReactComponentInfo[]; timestamp: number }>;
    private readonly CACHE_DURATION = 1000; // 1 second cache

    constructor() {
        this.window = getWindowAPI();
        this.document = getDocumentAPI();
        this.componentCache = new Map();
    }

    /**
     * Find React components by multiple search criteria with caching
     * @param criteria Search criteria for finding components
     * @returns Promise resolving to array of matching React components
     */
    async findByCriteria(criteria: ComponentSearchCriteria): Promise<ReactComponentInfo[]> {
        const cacheKey = this.createCacheKey(criteria);
        
        // Check cache first
        const cached = this.componentCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
            return cached.components;
        }

        try {
            let results: ReactComponentInfo[] = [];

            // Search by display name if provided
            if (criteria.displayName) {
                const byDisplayName = await findReactComponent({ 
                    displayName: criteria.displayName, 
                    maxDepth: criteria.maxDepth 
                });
                // Convert ReactComponent[] to ReactComponentInfo[]
                const convertedComponents = byDisplayName.map(component => ({
                    displayName: component.displayName || component.type,
                    props: component.props,
                    state: component.state,
                    domElement: component.element,
                    fiber: component.fiber
                }));
                results = this.mergeResults(results, convertedComponents);
            }

            // Search by MUI component type if provided
            if (criteria.muiType) {
                const byMUIType = await MaterialUIHelper.findMUIComponents(criteria.muiType);
                results = this.mergeResults(results, byMUIType);
            }

            // Filter by text content if provided
            if (criteria.textContent) {
                results = results.filter(component => 
                    this.componentContainsText(component, criteria.textContent!)
                );
            }

            // Filter by props if provided
            if (criteria.props) {
                results = results.filter(component => 
                    this.componentHasProps(component, criteria.props!)
                );
            }

            // Filter by DOM attributes if provided
            if (criteria.attributes) {
                results = results.filter(component => 
                    this.componentHasAttributes(component, criteria.attributes!)
                );
            }

            // Filter by interactivity if specified
            if (criteria.interactive !== undefined) {
                results = results.filter(component => 
                    this.isComponentInteractive(component) === criteria.interactive
                );
            }

            // Filter by visibility if specified
            if (criteria.visible !== undefined) {
                results = results.filter(component => 
                    this.isComponentVisible(component) === criteria.visible
                );
            }

            // Apply custom filter if provided
            if (criteria.customFilter) {
                results = results.filter(criteria.customFilter);
            }

            // Sort results by preference
            if (criteria.sortBy) {
                results = this.sortComponents(results, criteria.sortBy);
            }

            // Limit results if specified
            if (criteria.limit && criteria.limit > 0) {
                results = results.slice(0, criteria.limit);
            }

            // Cache results
            this.componentCache.set(cacheKey, {
                components: results,
                timestamp: Date.now()
            });

            return results;

        } catch (error) {
            console.warn('Error in ReactElementFinder.findByCriteria:', error);
            return [];
        }
    }

    /**
     * Find the best matching component for navigation
     * @param criteria Search criteria
     * @returns Single best matching component or null
     */
    async findBestMatch(criteria: ComponentSearchCriteria): Promise<ReactComponentInfo | null> {
        const components = await this.findByCriteria(criteria);
        
        if (components.length === 0) {
            return null;
        }

        // Return the first component (already sorted by preference)
        return components[0];
    }

    /**
     * Find components by text content (case-insensitive partial match)
     * @param text Text to search for in components
     * @param exactMatch Whether to require exact text match
     * @returns Array of components containing the text
     */
    async findByText(text: string, exactMatch: boolean = false): Promise<ReactComponentInfo[]> {
        return this.findByCriteria({
            textContent: text,
            customFilter: exactMatch 
                ? (component) => this.extractComponentText(component).toLowerCase() === text.toLowerCase()
                : undefined
        });
    }

    /**
     * Find interactive components (buttons, links, etc.)
     * @param textFilter Optional text filter for interactive components
     * @returns Array of interactive React components
     */
    async findInteractiveComponents(textFilter?: string): Promise<ReactComponentInfo[]> {
        return this.findByCriteria({
            interactive: true,
            textContent: textFilter,
            sortBy: 'interactivity'
        });
    }

    /**
     * Find Material-UI buttons with specific text or attributes
     * @param text Optional button text to match
     * @param variant Optional Material-UI button variant
     * @returns Array of matching MUI Button components
     */
    async findMUIButtons(text?: string, variant?: string): Promise<ReactComponentInfo[]> {
        const criteria: ComponentSearchCriteria = {
            muiType: 'Button',
            textContent: text
        };

        if (variant) {
            criteria.props = { variant };
        }

        return this.findByCriteria(criteria);
    }

    /**
     * Find Material-UI Tab components
     * @param label Optional tab label to match
     * @returns Array of matching MUI Tab components
     */
    async findMUITabs(label?: string): Promise<ReactComponentInfo[]> {
        return this.findByCriteria({
            muiType: 'Tab',
            textContent: label,
            sortBy: 'position'
        });
    }

    /**
     * Find components within a specific container component
     * @param containerCriteria Criteria for finding the container
     * @param childCriteria Criteria for finding children within the container
     * @returns Array of child components within matching containers
     */
    async findWithinContainer(
        containerCriteria: ComponentSearchCriteria,
        childCriteria: ComponentSearchCriteria
    ): Promise<ReactComponentInfo[]> {
        const containers = await this.findByCriteria(containerCriteria);
        const results: ReactComponentInfo[] = [];

        for (const container of containers) {
            if (container.domElement) {
                // Search within the container's DOM subtree
                const childComponents = await this.findComponentsInSubtree(
                    container.domElement,
                    childCriteria
                );
                results.push(...childComponents);
            }
        }

        return results;
    }

    /**
     * Find React components within a specific DOM subtree
     * @param rootElement Root DOM element to search within
     * @param criteria Search criteria for components
     * @returns Array of matching components within the subtree
     */
    private async findComponentsInSubtree(
        rootElement: Element,
        criteria: ComponentSearchCriteria
    ): Promise<ReactComponentInfo[]> {
        // This is a simplified implementation - in practice, we would
        // need to traverse the React Fiber tree within the subtree
        const allComponents = await this.findByCriteria(criteria);
        
        return allComponents.filter(component => {
            if (!component.domElement) return false;
            return rootElement.contains(component.domElement);
        });
    }

    /**
     * Clear the component cache
     */
    clearCache(): void {
        this.componentCache.clear();
    }

    /**
     * Get cache statistics
     * @returns Cache usage statistics
     */
    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.componentCache.size,
            keys: Array.from(this.componentCache.keys())
        };
    }

    /**
     * Create cache key from search criteria
     * @param criteria Component search criteria
     * @returns String cache key
     */
    private createCacheKey(criteria: ComponentSearchCriteria): string {
        const key = {
            displayName: criteria.displayName,
            muiType: criteria.muiType,
            textContent: criteria.textContent,
            props: criteria.props ? JSON.stringify(criteria.props) : undefined,
            attributes: criteria.attributes ? JSON.stringify(criteria.attributes) : undefined,
            interactive: criteria.interactive,
            visible: criteria.visible,
            maxDepth: criteria.maxDepth,
            limit: criteria.limit,
            sortBy: criteria.sortBy
        };
        
        return JSON.stringify(key);
    }

    /**
     * Merge component arrays, removing duplicates
     * @param existing Existing component array
     * @param newComponents New components to merge
     * @returns Merged array without duplicates
     */
    private mergeResults(existing: ReactComponentInfo[], newComponents: ReactComponentInfo[]): ReactComponentInfo[] {
        const merged = [...existing];
        const existingElements = new Set(existing.map(c => c.domElement));

        for (const component of newComponents) {
            if (!existingElements.has(component.domElement)) {
                merged.push(component);
                existingElements.add(component.domElement);
            }
        }

        return merged;
    }

    /**
     * Check if component contains specific text
     * @param component React component to check
     * @param text Text to search for
     * @returns True if component contains the text
     */
    private componentContainsText(component: ReactComponentInfo, text: string): boolean {
        const componentText = this.extractComponentText(component).toLowerCase();
        return componentText.includes(text.toLowerCase());
    }

    /**
     * Check if component has specific props
     * @param component React component to check
     * @param props Props to check for
     * @returns True if component has all specified props
     */
    private componentHasProps(component: ReactComponentInfo, props: Record<string, any>): boolean {
        if (!component.props) return false;

        return Object.entries(props).every(([key, value]) => {
            const componentValue = component.props![key];
            return componentValue === value;
        });
    }

    /**
     * Check if component's DOM element has specific attributes
     * @param component React component to check
     * @param attributes Attributes to check for
     * @returns True if DOM element has all specified attributes
     */
    private componentHasAttributes(component: ReactComponentInfo, attributes: Record<string, string>): boolean {
        if (!component.domElement) return false;

        return Object.entries(attributes).every(([key, value]) => {
            const attributeValue = component.domElement!.getAttribute(key);
            return attributeValue === value;
        });
    }

    /**
     * Check if component is interactive
     * @param component React component to check
     * @returns True if component is interactive
     */
    private isComponentInteractive(component: ReactComponentInfo): boolean {
        // Check for interactive props
        if (component.props) {
            const interactiveProps = ['onClick', 'onPress', 'onTap', 'href', 'to', 'onSubmit'];
            if (interactiveProps.some(prop => prop in component.props!)) {
                return true;
            }
        }

        // Check DOM element
        if (component.domElement) {
            const element = component.domElement;
            const tagName = element.tagName.toLowerCase();
            
            // Interactive HTML elements
            if (['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
                return true;
            }
            
            // Elements with interactive attributes
            if ((element as HTMLElement).onclick || 
                element.getAttribute('role') === 'button' ||
                element.getAttribute('tabindex') !== null ||
                element.getAttribute('aria-disabled') !== null) {
                return true;
            }

            // Material-UI interactive classes
            if (element.classList.contains('MuiButton-root') ||
                element.classList.contains('MuiTab-root') ||
                element.classList.contains('MuiMenuItem-root')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if component is visible
     * @param component React component to check
     * @returns True if component is visible
     */
    private isComponentVisible(component: ReactComponentInfo): boolean {
        if (!component.domElement) return false;

        const element = component.domElement as HTMLElement;
        const style = this.window.getComputedStyle(element);
        
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetHeight > 0 &&
               element.offsetWidth > 0;
    }

    /**
     * Extract text content from React component
     * @param component React component
     * @returns Text content of the component
     */
    private extractComponentText(component: ReactComponentInfo): string {
        if (component.domElement) {
            return component.domElement.textContent || (component.domElement as HTMLElement).innerText || '';
        }
        
        // Try to extract from React props
        if (component.props) {
            if (typeof component.props.children === 'string') {
                return component.props.children;
            }
            
            // Check common text props
            const textProps = ['label', 'text', 'title', 'aria-label'];
            for (const prop of textProps) {
                if (typeof component.props[prop] === 'string') {
                    return component.props[prop];
                }
            }
        }
        
        return '';
    }

    /**
     * Sort components by specified criteria
     * @param components Array of components to sort
     * @param sortBy Sorting criteria
     * @returns Sorted array of components
     */
    private sortComponents(components: ReactComponentInfo[], sortBy: string): ReactComponentInfo[] {
        switch (sortBy) {
            case 'position':
                return components.sort((a, b) => this.comparePosition(a, b));
            case 'interactivity':
                return components.sort((a, b) => Number(this.isComponentInteractive(b)) - Number(this.isComponentInteractive(a)));
            case 'text':
                return components.sort((a, b) => this.extractComponentText(a).localeCompare(this.extractComponentText(b)));
            case 'muiPriority':
                return components.sort((a, b) => this.compareMUIPriority(a, b));
            default:
                return components;
        }
    }

    /**
     * Compare position of two components (top-left to bottom-right)
     * @param a First component
     * @param b Second component  
     * @returns Comparison result
     */
    private comparePosition(a: ReactComponentInfo, b: ReactComponentInfo): number {
        if (!a.domElement || !b.domElement) return 0;

        const rectA = a.domElement.getBoundingClientRect();
        const rectB = b.domElement.getBoundingClientRect();

        // Compare by top position first
        if (Math.abs(rectA.top - rectB.top) > 5) {
            return rectA.top - rectB.top;
        }

        // Then by left position
        return rectA.left - rectB.left;
    }

    /**
     * Compare Material-UI component priority (buttons > tabs > other)
     * @param a First component
     * @param b Second component
     * @returns Comparison result
     */
    private compareMUIPriority(a: ReactComponentInfo, b: ReactComponentInfo): number {
        const getPriority = (component: ReactComponentInfo): number => {
            if (!component.domElement) return 0;
            
            const element = component.domElement;
            if (element.classList.contains('MuiButton-root')) return 3;
            if (element.classList.contains('MuiTab-root')) return 2;
            if (element.classList.contains('MuiMenuItem-root')) return 1;
            return 0;
        };

        return getPriority(b) - getPriority(a);
    }
}