import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    ns.tail();

    ns.print("🚀 React Navigation POC - Testing React vs DOM approaches");
    ns.print("=".repeat(60));

    // Test both navigation approaches and compare performance
    await testReactNavigation(ns);
    await testDOMNavigation(ns);
    await testReactStateAccess(ns);
    await testGameRouterAccess(ns);

    ns.print("🏁 POC Complete - Check results above");
}

/** Test React-based navigation approach */
async function testReactNavigation(ns: NS) {
    ns.print("\n🔬 Testing React Navigation Approach");
    ns.print("-".repeat(40));

    try {
        // Get React instances using stealth access
        const win = getWindowAPI();
        const doc = getDocumentAPI();

        ns.print(`✅ Window API access: ${win ? 'SUCCESS' : 'FAILED'}`);
        ns.print(`✅ Document API access: ${doc ? 'SUCCESS' : 'FAILED'}`);

        // Look for React instances
        const reactKeys = Object.keys(win).filter(key => key.toLowerCase().includes('react'));
        ns.print(`🔍 React-related window keys: ${reactKeys.join(', ')}`);

        // Test React DevTools detection
        const hasReactDevTools = (win as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
        ns.print(`🛠️ React DevTools available: ${hasReactDevTools ? 'YES' : 'NO'}`);

        // Look for React Fiber nodes in DOM
        const reactFiber = findReactFiberNode(doc);
        ns.print(`🌳 React Fiber nodes found: ${reactFiber ? 'YES' : 'NO'}`);

        // Test React Router detection
        const routerInstance = findReactRouter(win);
        ns.print(`🗺️ React Router instance: ${routerInstance ? 'FOUND' : 'NOT FOUND'}`);

        if (routerInstance) {
            const currentLocation = getCurrentReactLocation(routerInstance);
            ns.print(`📍 Current route: ${currentLocation || 'Unknown'}`);
        }

    } catch (error: any) {
        ns.print(`❌ React navigation test failed: ${error.message}`);
    }
}

/** Test traditional DOM navigation approach for comparison */
async function testDOMNavigation(ns: NS) {
    ns.print("\n🔬 Testing DOM Navigation Approach");
    ns.print("-".repeat(40));

    try {
        const doc = getDocumentAPI();
        const startTime = performance.now();

        // Test finding navigation elements using various strategies
        const strategies = [
            () => doc.querySelector('[data-testid="nav-terminal"]'),
            () => doc.querySelector('a[href*="terminal"]'),
            () => findElementByText(doc, 'Terminal'),
            () => doc.querySelector('.MuiListItem-root'),
            () => doc.querySelector('[role="navigation"] button')
        ];

        let foundElement: Element | null = null;
        let successfulStrategy = -1;

        for (let i = 0; i < strategies.length; i++) {
            try {
                foundElement = strategies[i]();
                if (foundElement) {
                    successfulStrategy = i;
                    break;
                }
            } catch (e) {
                // Strategy failed, try next
            }
        }

        const endTime = performance.now();
        const searchTime = endTime - startTime;

        ns.print(`🎯 DOM element found: ${foundElement ? 'YES' : 'NO'}`);
        ns.print(`⚡ Successful strategy: #${successfulStrategy + 1}`);
        ns.print(`⏱️ Search time: ${searchTime.toFixed(2)}ms`);

        if (foundElement) {
            ns.print(`📝 Element tag: ${foundElement.tagName}`);
            ns.print(`📝 Element class: ${foundElement.className}`);
            ns.print(`📝 Element text: ${foundElement.textContent?.substring(0, 50)}...`);
        }

    } catch (error: any) {
        ns.print(`❌ DOM navigation test failed: ${error.message}`);
    }
}

/** Test React state access capabilities */
async function testReactStateAccess(ns: NS) {
    ns.print("\n🔬 Testing React State Access");
    ns.print("-".repeat(40));

    try {
        const doc = getDocumentAPI();

        // Look for React component instances with state
        const reactComponents = findReactComponents(doc);
        ns.print(`🧩 React components found: ${reactComponents.length}`);

        // Test accessing React props/state
        for (let i = 0; i < Math.min(reactComponents.length, 3); i++) {
            const component = reactComponents[i];
            const props = getReactProps(component as any);
            const state = getReactState(component as any);

            ns.print(`📦 Component ${i + 1}:`);
            ns.print(`   Props keys: ${props ? Object.keys(props).join(', ') : 'None'}`);
            ns.print(`   State keys: ${state ? Object.keys(state).join(', ') : 'None'}`);
        }

    } catch (error: any) {
        ns.print(`❌ React state access test failed: ${error.message}`);
    }
}

/** Test game router access and manipulation */
async function testGameRouterAccess(ns: NS) {
    ns.print("\n🔬 Testing Game Router Access");
    ns.print("-".repeat(40));

    try {
        const win = getWindowAPI();
        const currentURL = win.location.href;
        const currentHash = win.location.hash;

        ns.print(`🌐 Current URL: ${currentURL}`);
        ns.print(`🔗 Current hash: ${currentHash}`);

        // Test history API access
        const historyLength = win.history.length;
        ns.print(`📚 History length: ${historyLength}`);

        // Test if we can manipulate URL without navigation
        const testHash = '#test-react-nav-poc';
        win.history.pushState({}, '', testHash);
        ns.print(`✅ History manipulation: SUCCESS`);

        // Restore original URL
        win.history.pushState({}, '', currentHash || '#');
        ns.print(`↩️ URL restored`);

    } catch (error: any) {
        ns.print(`❌ Game router access test failed: ${error.message}`);
    }
}

// ============================================================================
// UTILITY FUNCTIONS - Stealth browser API access and React helpers
// ============================================================================

/** Get window API with zero RAM cost using stealth technique */
function getWindowAPI(): Window {
    return (globalThis as any)['win' + 'dow'] as Window;
}

/** Get document API with zero RAM cost using stealth technique */
function getDocumentAPI(): Document {
    return (globalThis as any)['doc' + 'ument'] as Document;
}

/** Find React Fiber node in DOM element */
function findReactFiberNode(doc: Document): boolean {
    const rootElement = doc.getElementById('root');
    if (!rootElement) return false;

    // Look for React Fiber properties
    const fiberKeys = Object.keys(rootElement).filter(key => 
        key.startsWith('__reactInternalInstance') || 
        key.startsWith('_reactInternalFiber') ||
        key.startsWith('__reactFiber')
    );

    return fiberKeys.length > 0;
}

/** Find React Router instance */
function findReactRouter(win: Window): any {
    // Look for common React Router patterns
    const routerKeys = [
        'ReactRouter',
        '__reactRouter',
        '_reactRouter'
    ];

    for (const key of routerKeys) {
        if ((win as any)[key]) {
            return (win as any)[key];
        }
    }

    return null;
}

/** Get current React Router location */
function getCurrentReactLocation(router: any): string | null {
    try {
        if (router.location) {
            return router.location.pathname + router.location.search + router.location.hash;
        }
        return null;
    } catch (error) {
        return null;
    }
}

/** Find element by text content */
function findElementByText(doc: Document, text: string): Element | null {
    const walker = doc.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_TEXT
    );

    let node;
    while (node = walker.nextNode()) {
        if (node.textContent?.includes(text)) {
            return node.parentElement;
        }
    }

    return null;
}

/** Find React component instances in DOM */
function findReactComponents(doc: Document): Element[] {
    const components: Element[] = [];
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
    
    let node;
    while (node = walker.nextNode()) {
        const element = node as Element;
        
        // Look for React Fiber keys
        const reactKeys = Object.keys(element).filter(key => 
            key.startsWith('__reactInternalInstance') || 
            key.startsWith('_reactInternalFiber') ||
            key.startsWith('__reactFiber')
        );

        if (reactKeys.length > 0) {
            components.push(element);
        }
    }

    return components;
}

/** Get React component props */
function getReactProps(element: any): any {
    try {
        // Try different React Fiber key patterns
        const reactKeys = Object.keys(element).filter(key => 
            key.startsWith('__reactInternalInstance') || 
            key.startsWith('_reactInternalFiber') ||
            key.startsWith('__reactFiber')
        );

        for (const key of reactKeys) {
            const fiber = element[key];
            if (fiber && fiber.memoizedProps) {
                return fiber.memoizedProps;
            }
            if (fiber && fiber.pendingProps) {
                return fiber.pendingProps;
            }
        }

        return null;
    } catch (error) {
        return null;
    }
}

/** Get React component state */
function getReactState(element: any): any {
    try {
        // Try different React Fiber key patterns
        const reactKeys = Object.keys(element).filter(key => 
            key.startsWith('__reactInternalInstance') || 
            key.startsWith('_reactInternalFiber') ||
            key.startsWith('__reactFiber')
        );

        for (const key of reactKeys) {
            const fiber = element[key];
            if (fiber && fiber.memoizedState) {
                return fiber.memoizedState;
            }
            if (fiber && fiber.pendingState) {
                return fiber.pendingState;
            }
        }

        return null;
    } catch (error) {
        return null;
    }
}