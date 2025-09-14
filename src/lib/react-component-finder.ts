/**
 * React Component Discovery System
 * 
 * Provides comprehensive React component finding and manipulation utilities
 * for Bitburner navigator system. Uses React Fiber access to discover and
 * interact with the 523+ React components in the game interface.
 */

import { StealthBrowserAPI, ReactInstanceDiscovery } from '/lib/react-browser-utils';

export interface ReactFiber {
  key: string | null;
  elementType: any;
  type: any;
  stateNode: any;
  return: ReactFiber | null;
  child: ReactFiber | null;
  sibling: ReactFiber | null;
  memoizedProps: any;
  memoizedState: any;
  pendingProps: any;
  _debugOwner?: ReactFiber;
  _debugSource?: any;
}

export interface ReactComponent {
  fiber: ReactFiber;
  element: Element;
  props: any;
  state: any;
  type: string;
  displayName?: string;
  isVisible: boolean;
  depth: number;
}

export interface ComponentSearchCriteria {
  text?: string;
  className?: string;
  type?: string;
  props?: Record<string, any>;
  muiType?: string;
  displayName?: string;
  maxDepth?: number;
  includeHidden?: boolean;
}

/**
 * React Fiber Access Utilities
 * Provides low-level access to React's internal fiber structure
 */
export class ReactFiberAccess {
  private static stealthAPI = StealthBrowserAPI.getInstance();

  /**
   * Get React Fiber key from DOM element
   */
  static getFiberKey(element: Element): string | null {
    const keys = Object.keys(element);
    return keys.find(key => key.startsWith('__reactFiber$')) || null;
  }

  /**
   * Get React Fiber from DOM element
   */
  static getFiber(element: Element): ReactFiber | null {
    try {
      const fiberKey = this.getFiberKey(element);
      if (!fiberKey) return null;

      const fiber = (element as any)[fiberKey];
      return fiber || null;
    } catch (error) {
      console.warn(`Failed to get fiber for element: ${error}`);
      return null;
    }
  }

  /**
   * Get all React Fibers from DOM
   */
  static getAllFibers(): ReactFiber[] {
    try {
      const doc = this.stealthAPI.getDocument();
      const elements = doc.querySelectorAll('*');
      const fibers: ReactFiber[] = [];

      for (const element of Array.from(elements)) {
        const fiber = this.getFiber(element);
        if (fiber) {
          fibers.push(fiber);
        }
      }

      return fibers;
    } catch (error) {
      console.warn(`Failed to get all fibers: ${error}`);
      return [];
    }
  }

  /**
   * Walk up the fiber tree
   */
  static walkUpFiber(fiber: ReactFiber, predicate: (fiber: ReactFiber) => boolean): ReactFiber | null {
    let current = fiber.return;
    while (current) {
      if (predicate(current)) {
        return current;
      }
      current = current.return;
    }
    return null;
  }

  /**
   * Walk down the fiber tree
   */
  static walkDownFiber(
    fiber: ReactFiber, 
    predicate: (fiber: ReactFiber) => boolean,
    maxDepth: number = 10
  ): ReactFiber[] {
    const results: ReactFiber[] = [];
    const visited = new Set<ReactFiber>();

    const walk = (current: ReactFiber | null, depth: number) => {
      if (!current || depth > maxDepth || visited.has(current)) return;
      
      visited.add(current);

      if (predicate(current)) {
        results.push(current);
      }

      // Walk children
      walk(current.child, depth + 1);
      walk(current.sibling, depth);
    };

    walk(fiber.child, 0);
    return results;
  }
}

/**
 * React Component Finder
 * High-level interface for finding React components
 */
export class ReactComponentFinder {
  private static components: ReactComponent[] = [];
  private static lastScanTime: number = 0;
  private static CACHE_DURATION = 5000; // 5 seconds

  /**
   * Discover all React components in the DOM
   */
  static async discoverComponents(forceRefresh: boolean = false): Promise<ReactComponent[]> {
    const now = Date.now();
    
    if (!forceRefresh && this.components.length > 0 && (now - this.lastScanTime) < this.CACHE_DURATION) {
      return this.components;
    }

    this.components = [];
    this.lastScanTime = now;

    try {
      const doc = StealthBrowserAPI.getInstance().getDocument();
      const elements = doc.querySelectorAll('*');

      for (const element of Array.from(elements)) {
        const component = this.createReactComponent(element);
        if (component) {
          this.components.push(component);
        }
      }

      console.log(`Discovered ${this.components.length} React components`);
      return this.components;
    } catch (error) {
      console.warn(`Component discovery failed: ${error}`);
      return [];
    }
  }

  /**
   * Create ReactComponent from DOM element
   */
  private static createReactComponent(element: Element): ReactComponent | null {
    try {
      const fiber = ReactFiberAccess.getFiber(element);
      if (!fiber) return null;

      // Determine component type
      const type = this.getComponentType(fiber);
      if (!type) return null;

      // Calculate depth in React tree
      const depth = this.calculateDepth(fiber);

      // Check visibility
      const isVisible = this.isElementVisible(element);

      return {
        fiber,
        element,
        props: fiber.memoizedProps || {},
        state: fiber.memoizedState,
        type,
        displayName: this.getDisplayName(fiber),
        isVisible,
        depth
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get component type string
   */
  private static getComponentType(fiber: ReactFiber): string | null {
    if (typeof fiber.type === 'string') {
      return fiber.type; // DOM element
    }
    
    if (typeof fiber.type === 'function') {
      return fiber.type.name || fiber.type.displayName || 'Component';
    }

    if (fiber.elementType?.name) {
      return fiber.elementType.name;
    }

    return null;
  }

  /**
   * Get component display name
   */
  private static getDisplayName(fiber: ReactFiber): string | undefined {
    if (fiber.type?.displayName) {
      return fiber.type.displayName;
    }

    if (fiber.elementType?.displayName) {
      return fiber.elementType.displayName;
    }

    return undefined;
  }

  /**
   * Calculate component depth in React tree
   */
  private static calculateDepth(fiber: ReactFiber): number {
    let depth = 0;
    let current = fiber.return;
    
    while (current) {
      depth++;
      current = current.return;
    }
    
    return depth;
  }

  /**
   * Check if element is visible
   */
  private static isElementVisible(element: Element): boolean {
    try {
      if (!(element instanceof HTMLElement)) return false;
      
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        parseFloat(style.opacity) > 0
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Find components by search criteria
   */
  static async findComponents(criteria: ComponentSearchCriteria): Promise<ReactComponent[]> {
    const components = await this.discoverComponents();
    
    return components.filter(component => {
      return this.matchesCriteria(component, criteria);
    });
  }

  /**
   * Find single component by search criteria
   */
  static async findComponent(criteria: ComponentSearchCriteria): Promise<ReactComponent | null> {
    const components = await this.findComponents(criteria);
    return components[0] || null;
  }

  /**
   * Check if component matches search criteria
   */
  private static matchesCriteria(component: ReactComponent, criteria: ComponentSearchCriteria): boolean {
    // Text content matching
    if (criteria.text) {
      const text = this.getComponentText(component);
      if (!text.toLowerCase().includes(criteria.text.toLowerCase())) {
        return false;
      }
    }

    // Class name matching
    if (criteria.className) {
      const element = component.element as HTMLElement;
      if (!element.className?.includes(criteria.className)) {
        return false;
      }
    }

    // Component type matching
    if (criteria.type && component.type !== criteria.type) {
      return false;
    }

    // Display name matching
    if (criteria.displayName && component.displayName !== criteria.displayName) {
      return false;
    }

    // Props matching
    if (criteria.props) {
      if (!this.propsMatch(component.props, criteria.props)) {
        return false;
      }
    }

    // Material-UI type matching
    if (criteria.muiType) {
      if (!this.isMUIComponent(component, criteria.muiType)) {
        return false;
      }
    }

    // Visibility filter
    if (!criteria.includeHidden && !component.isVisible) {
      return false;
    }

    // Depth filter
    if (criteria.maxDepth && component.depth > criteria.maxDepth) {
      return false;
    }

    return true;
  }

  /**
   * Get text content from component
   */
  private static getComponentText(component: ReactComponent): string {
    try {
      return component.element.textContent || '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if props match criteria
   */
  private static propsMatch(componentProps: any, searchProps: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(searchProps)) {
      if (componentProps[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if component is Material-UI component of specific type
   */
  private static isMUIComponent(component: ReactComponent, muiType: string): boolean {
    const element = component.element as HTMLElement;
    const className = element.className || '';
    
    // Check for MUI class patterns
    const muiPatterns = [
      `Mui${muiType}-root`,
      `Mui${muiType}`,
      `css-${muiType}`,
      muiType.toLowerCase()
    ];

    return muiPatterns.some(pattern => className.includes(pattern));
  }

  /**
   * Get component statistics
   */
  static async getComponentStats(): Promise<{
    total: number;
    visible: number;
    hidden: number;
    byType: Record<string, number>;
    muiComponents: number;
  }> {
    const components = await this.discoverComponents();
    
    const stats = {
      total: components.length,
      visible: components.filter(c => c.isVisible).length,
      hidden: components.filter(c => !c.isVisible).length,
      byType: {} as Record<string, number>,
      muiComponents: 0
    };

    // Count by type
    components.forEach(component => {
      const type = component.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count MUI components
      const element = component.element as HTMLElement;
      if (element.className?.includes('Mui')) {
        stats.muiComponents++;
      }
    });

    return stats;
  }
}

/**
 * Component Validation Utilities
 */
export class ComponentValidator {
  /**
   * Validate component accessibility
   */
  static validateComponent(component: ReactComponent): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check fiber integrity
    if (!component.fiber) {
      issues.push('Missing React Fiber reference');
    }

    // Check element accessibility
    if (!component.element) {
      issues.push('Missing DOM element reference');
    }

    // Check visibility
    if (!component.isVisible) {
      issues.push('Component is not visible');
      recommendations.push('Check if component is rendered conditionally');
    }

    // Check props availability
    if (!component.props) {
      issues.push('Component props not accessible');
      recommendations.push('Component may not be fully initialized');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Test component interaction capabilities
   */
  static async testComponentInteraction(component: ReactComponent): Promise<{
    canClick: boolean;
    canReadText: boolean;
    canAccessProps: boolean;
    canAccessState: boolean;
  }> {
    const results = {
      canClick: false,
      canReadText: false,
      canAccessProps: false,
      canAccessState: false
    };

    try {
      // Test click capability
      if (component.element instanceof HTMLElement) {
        results.canClick = true;
      }

      // Test text reading
      if (component.element.textContent !== null) {
        results.canReadText = true;
      }

      // Test props access
      if (component.props && typeof component.props === 'object') {
        results.canAccessProps = true;
      }

      // Test state access
      if (component.state !== null) {
        results.canAccessState = true;
      }
    } catch (error) {
      console.warn(`Component interaction test failed: ${error}`);
    }

    return results;
  }
}

// Convenience exports for backward compatibility
export const findReactComponent = ReactComponentFinder.findComponents;