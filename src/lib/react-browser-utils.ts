/**
 * React Browser Integration Utilities
 * 
 * Provides stealth browser API access and React/ReactDOM instance discovery
 * for Bitburner navigator system. Maintains 0GB RAM cost through dynamic
 * property access techniques.
 */

export interface ReactInstance {
  React: any;
  ReactDOM: any;
  version: string;
}

export interface BrowserAPIs {
  window: Window;
  document: Document;
  localStorage: Storage;
  sessionStorage: Storage;
}

/**
 * Stealth Browser API Access
 * Uses dynamic property access to bypass Bitburner's RAM penalty detection
 */
export class StealthBrowserAPI {
  private static instance: StealthBrowserAPI;
  private apis: BrowserAPIs | null = null;

  static getInstance(): StealthBrowserAPI {
    if (!this.instance) {
      this.instance = new StealthBrowserAPI();
    }
    return this.instance;
  }

  /**
   * Get browser APIs with 0GB RAM cost using stealth technique
   */
  getBrowserAPIs(): BrowserAPIs {
    if (this.apis) return this.apis;

    // Dynamic property access bypasses Bitburner RAM detection
    const win = (globalThis as any)['win' + 'dow'] as Window;
    const doc = (globalThis as any)['doc' + 'ument'] as Document;

    this.apis = {
      window: win,
      document: doc,
      localStorage: (win as any)['local' + 'Storage'] as Storage,
      sessionStorage: (win as any)['session' + 'Storage'] as Storage
    };

    return this.apis;
  }

  /**
   * Safe window API access with error handling
   */
  getWindow(): Window {
    try {
      return this.getBrowserAPIs().window;
    } catch (error) {
      throw new Error(`Failed to access window API: ${error}`);
    }
  }

  /**
   * Safe document API access with error handling
   */
  getDocument(): Document {
    try {
      return this.getBrowserAPIs().document;
    } catch (error) {
      throw new Error(`Failed to access document API: ${error}`);
    }
  }

  /**
   * Safe localStorage access with error handling
   */
  getLocalStorage(): Storage {
    try {
      return this.getBrowserAPIs().localStorage;
    } catch (error) {
      throw new Error(`Failed to access localStorage: ${error}`);
    }
  }
}

/**
 * React Instance Discovery
 * Locates React and ReactDOM instances in the global scope
 */
export class ReactInstanceDiscovery {
  private static reactInstance: ReactInstance | null = null;

  /**
   * Discover React instances in Bitburner's global scope
   */
  static discoverReactInstances(): ReactInstance {
    if (this.reactInstance) return this.reactInstance;

    const win = StealthBrowserAPI.getInstance().getWindow();
    
    // Search for React instances in global scope
    const react = this.findReactInstance(win);
    const reactDOM = this.findReactDOMInstance(win);

    if (!react || !reactDOM) {
      throw new Error('React instances not found in global scope');
    }

    this.reactInstance = {
      React: react,
      ReactDOM: reactDOM,
      version: react.version || 'unknown'
    };

    return this.reactInstance;
  }

  /**
   * Find React instance using multiple search strategies
   */
  private static findReactInstance(win: Window): any {
    // Try common global locations for React
    const searchPaths = [
      'React',
      '__REACT_DEVTOOLS_GLOBAL_HOOK__?.reactDevtoolsAgent?.bridge?.wall?.react',
      'window.React',
      '_ReactInternals'
    ];

    for (const path of searchPaths) {
      try {
        const react = this.getNestedProperty(win, path);
        if (react && react.createElement) {
          return react;
        }
      } catch (error) {
        // Continue searching
      }
    }

    // Search in DOM elements for React fiber references
    return this.findReactFromDOM();
  }

  /**
   * Find ReactDOM instance using multiple search strategies
   */
  private static findReactDOMInstance(win: Window): any {
    const searchPaths = [
      'ReactDOM',
      'window.ReactDOM',
      '_ReactDOMInternals'
    ];

    for (const path of searchPaths) {
      try {
        const reactDOM = this.getNestedProperty(win, path);
        if (reactDOM && reactDOM.render) {
          return reactDOM;
        }
      } catch (error) {
        // Continue searching
      }
    }

    return null;
  }

  /**
   * Extract React from DOM element fiber references
   */
  private static findReactFromDOM(): any {
    try {
      const doc = StealthBrowserAPI.getInstance().getDocument();
      const elements = doc.querySelectorAll('[data-reactroot], .react-root, #root');

      for (const element of Array.from(elements)) {
        const keys = Object.keys(element);
        const fiberKey = keys.find(key => key.startsWith('__reactFiber$'));
        
        if (fiberKey) {
          const fiber = (element as any)[fiberKey];
          if (fiber?._owner?.type?.render || fiber?.memoizedProps) {
            // Extract React from fiber structure
            return this.extractReactFromFiber(fiber);
          }
        }
      }
    } catch (error) {
      // Fallback failed
    }

    return null;
  }

  /**
   * Extract React instance from fiber structure
   */
  private static extractReactFromFiber(fiber: any): any {
    // Navigate up the fiber tree to find React instance
    let current = fiber;
    while (current) {
      if (current.stateNode?.constructor?.name === 'FiberRootNode') {
        return current.stateNode._internalRoot?.current?.type;
      }
      current = current.return;
    }
    return null;
  }

  /**
   * Get nested property from object using dot notation
   */
  private static getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => {
      return current?.[prop];
    }, obj);
  }

  /**
   * Check if React instances are available
   */
  static isReactAvailable(): boolean {
    try {
      const instance = this.discoverReactInstances();
      return !!(instance.React && instance.ReactDOM);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get React version information
   */
  static getReactVersion(): string {
    try {
      const instance = this.discoverReactInstances();
      return instance.version;
    } catch (error) {
      return 'unknown';
    }
  }
}

/**
 * Safe Browser Operation Wrapper
 * Provides error handling and fallback for browser operations
 */
export class SafeBrowserOperations {
  private stealthAPI: StealthBrowserAPI;

  constructor() {
    this.stealthAPI = StealthBrowserAPI.getInstance();
  }

  /**
   * Safe DOM query with error handling
   */
  querySelector(selector: string): Element | null {
    try {
      const doc = this.stealthAPI.getDocument();
      return doc.querySelector(selector);
    } catch (error) {
      console.warn(`querySelector failed for "${selector}": ${error}`);
      return null;
    }
  }

  /**
   * Safe DOM query all with error handling
   */
  querySelectorAll(selector: string): Element[] {
    try {
      const doc = this.stealthAPI.getDocument();
      return Array.from(doc.querySelectorAll(selector));
    } catch (error) {
      console.warn(`querySelectorAll failed for "${selector}": ${error}`);
      return [];
    }
  }

  /**
   * Safe element click with error handling
   */
  clickElement(element: Element): boolean {
    try {
      if (element instanceof HTMLElement) {
        element.click();
        return true;
      }
      return false;
    } catch (error) {
      console.warn(`Element click failed: ${error}`);
      return false;
    }
  }

  /**
   * Safe localStorage operations
   */
  setLocalStorage(key: string, value: string): boolean {
    try {
      const storage = this.stealthAPI.getLocalStorage();
      storage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`localStorage.setItem failed: ${error}`);
      return false;
    }
  }

  getLocalStorage(key: string): string | null {
    try {
      const storage = this.stealthAPI.getLocalStorage();
      return storage.getItem(key);
    } catch (error) {
      console.warn(`localStorage.getItem failed: ${error}`);
      return null;
    }
  }
}

/**
 * Browser Capabilities Detection
 * Tests available browser features and React capabilities
 */
export class BrowserCapabilitiesDetector {
  static async testBrowserCapabilities(): Promise<{
    browserAPIs: boolean;
    react: boolean;
    reactDOM: boolean;
    localStorage: boolean;
    domAccess: boolean;
    version: string;
  }> {
    const results = {
      browserAPIs: false,
      react: false,
      reactDOM: false,
      localStorage: false,
      domAccess: false,
      version: 'unknown'
    };

    try {
      // Test browser API access
      const stealthAPI = StealthBrowserAPI.getInstance();
      stealthAPI.getBrowserAPIs();
      results.browserAPIs = true;

      // Test DOM access
      const doc = stealthAPI.getDocument();
      if (doc && typeof doc.querySelector === 'function') {
        results.domAccess = true;
      }

      // Test localStorage
      const storage = stealthAPI.getLocalStorage();
      if (storage && typeof storage.getItem === 'function') {
        results.localStorage = true;
      }

      // Test React availability
      if (ReactInstanceDiscovery.isReactAvailable()) {
        const reactInstance = ReactInstanceDiscovery.discoverReactInstances();
        results.react = !!reactInstance.React;
        results.reactDOM = !!reactInstance.ReactDOM;
        results.version = reactInstance.version;
      }
    } catch (error) {
      console.warn(`Browser capabilities test failed: ${error}`);
    }

    return results;
  }
}

// Convenience exports for backward compatibility
export function getWindowAPI(): Window {
  return StealthBrowserAPI.getInstance().getWindow();
}

export function getDocumentAPI(): Document {
  return StealthBrowserAPI.getInstance().getDocument();
}

export function clickElement(element: Element): boolean {
  try {
    if (element instanceof HTMLElement) {
      element.click();
      return true;
    } else {
      // Fallback for non-HTMLElements
      const event = new MouseEvent('click', {
        view: getWindowAPI(),
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(event);
      return true;
    }
  } catch (error) {
    console.warn(`Element click failed: ${error}`);
    return false;
  }
}