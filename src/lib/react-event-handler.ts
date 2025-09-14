/**
 * React Event Handling System
 * 
 * Provides comprehensive React event triggering and natural event simulation
 * for Bitburner navigator system. Handles React-specific event patterns
 * including onDoubleClick, onMouseDown, onTouchEnd as validated in POC.
 */

import { ReactComponent, ReactFiber } from '/lib/react-component-finder';
import { MUIComponent } from '/lib/material-ui-integration';
import { StealthBrowserAPI } from '/lib/react-browser-utils';

export interface ReactEventOptions {
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;
  detail?: number;
  view?: Window;
  clientX?: number;
  clientY?: number;
  button?: number;
  buttons?: number;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

export interface EventSimulationResult {
  success: boolean;
  eventsFired: string[];
  error?: string;
  duration?: number;
}

export interface TouchEventOptions extends ReactEventOptions {
  touches?: Touch[];
  targetTouches?: Touch[];
  changedTouches?: Touch[];
}

/**
 * React Event Handler Discovery
 * Finds and analyzes React event handlers in components
 */
export class ReactEventHandlerDiscovery {
  /**
   * Get all event handlers from React component
   */
  static getEventHandlers(component: ReactComponent): Record<string, Function> {
    const handlers: Record<string, Function> = {};
    
    try {
      const props = component.props || {};
      
      // Common React event handler patterns
      const eventPatterns = [
        'onClick', 'onDoubleClick', 'onMouseDown', 'onMouseUp', 'onMouseEnter', 'onMouseLeave',
        'onTouchStart', 'onTouchEnd', 'onTouchMove', 'onTouchCancel',
        'onKeyDown', 'onKeyUp', 'onKeyPress',
        'onChange', 'onInput', 'onFocus', 'onBlur',
        'onSubmit', 'onSelect', 'onScroll',
        'onDrag', 'onDrop', 'onDragOver'
      ];

      eventPatterns.forEach(eventName => {
        if (props[eventName] && typeof props[eventName] === 'function') {
          handlers[eventName] = props[eventName];
        }
      });

      return handlers;
    } catch (error) {
      console.warn(`Failed to get event handlers: ${error}`);
      return {};
    }
  }

  /**
   * Check if component has specific event handler
   */
  static hasEventHandler(component: ReactComponent, eventName: string): boolean {
    const handlers = this.getEventHandlers(component);
    return eventName in handlers;
  }

  /**
   * Get most common event handlers for component type
   */
  static getCommonHandlers(component: ReactComponent): string[] {
    const handlers = this.getEventHandlers(component);
    const handlerNames = Object.keys(handlers);

    // Sort by relevance for interaction
    const relevanceOrder = ['onClick', 'onDoubleClick', 'onMouseDown', 'onTouchEnd', 'onChange', 'onSubmit'];
    
    return handlerNames.sort((a, b) => {
      const aIndex = relevanceOrder.indexOf(a);
      const bIndex = relevanceOrder.indexOf(b);
      
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
  }

  /**
   * Analyze event handler function
   */
  static analyzeEventHandler(handler: Function): {
    isAsync: boolean;
    parameterCount: number;
    handlerType: string;
  } {
    try {
      const handlerString = handler.toString();
      
      return {
        isAsync: handlerString.includes('async') || handlerString.includes('await'),
        parameterCount: handler.length,
        handlerType: this.detectHandlerType(handlerString)
      };
    } catch (error) {
      return {
        isAsync: false,
        parameterCount: 0,
        handlerType: 'unknown'
      };
    }
  }

  /**
   * Detect handler type from function content
   */
  private static detectHandlerType(handlerString: string): string {
    if (handlerString.includes('preventDefault')) return 'preventable';
    if (handlerString.includes('stopPropagation')) return 'stoppable';
    if (handlerString.includes('setState')) return 'state-changing';
    if (handlerString.includes('dispatch')) return 'redux-action';
    if (handlerString.includes('navigate')) return 'navigation';
    
    return 'simple';
  }
}

/**
 * React Event Dispatcher
 * Triggers React events on components with proper timing and validation
 */
export class ReactEventDispatcher {
  private static readonly DEFAULT_DELAY = 50; // ms between events
  private static readonly TOUCH_DELAY = 100; // ms for touch events

  /**
   * Trigger React event on component
   */
  static async triggerEvent(
    component: ReactComponent | MUIComponent,
    eventType: string,
    options: ReactEventOptions = {}
  ): Promise<EventSimulationResult> {
    const startTime = Date.now();
    const eventsFired: string[] = [];

    try {
      const element = component.element;
      const handlers = ReactEventHandlerDiscovery.getEventHandlers(component);

      // Check if component has the requested event handler
      if (!handlers[eventType]) {
        return {
          success: false,
          eventsFired,
          error: `Component does not have ${eventType} handler`
        };
      }

      // Create and dispatch the event
      const event = this.createReactEvent(eventType, element, options);
      const success = await this.dispatchEventSafely(element, event, eventType);
      
      if (success) {
        eventsFired.push(eventType);
      }

      return {
        success,
        eventsFired,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        eventsFired,
        error: `Event triggering failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Create React-compatible event
   */
  private static createReactEvent(eventType: string, element: Element, options: ReactEventOptions): Event {
    const defaultOptions = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: StealthBrowserAPI.getInstance().getWindow(),
      ...options
    };

    // Determine event constructor based on type
    if (eventType.startsWith('onMouse') || eventType === 'onClick' || eventType === 'onDoubleClick') {
      return new MouseEvent(this.reactToNativeEventType(eventType), {
        ...defaultOptions,
        detail: eventType === 'onDoubleClick' ? 2 : 1,
        clientX: options.clientX || 0,
        clientY: options.clientY || 0,
        button: options.button || 0,
        buttons: options.buttons || 1
      });
    }

    if (eventType.startsWith('onTouch')) {
      // Simplified touch event handling for TypeScript compatibility
      return new TouchEvent(this.reactToNativeEventType(eventType), {
        ...defaultOptions
      } as TouchEventInit);
    }

    if (eventType.startsWith('onKey')) {
      return new KeyboardEvent(this.reactToNativeEventType(eventType), {
        ...defaultOptions,
        ctrlKey: options.ctrlKey || false,
        shiftKey: options.shiftKey || false,
        altKey: options.altKey || false,
        metaKey: options.metaKey || false
      });
    }

    if (eventType === 'onChange' || eventType === 'onInput') {
      return new InputEvent(this.reactToNativeEventType(eventType), defaultOptions);
    }

    if (eventType === 'onFocus' || eventType === 'onBlur') {
      return new FocusEvent(this.reactToNativeEventType(eventType), defaultOptions);
    }

    // Generic event
    return new Event(this.reactToNativeEventType(eventType), defaultOptions);
  }

  /**
   * Convert React event type to native DOM event type
   */
  private static reactToNativeEventType(reactEventType: string): string {
    const mapping: Record<string, string> = {
      'onClick': 'click',
      'onDoubleClick': 'dblclick',
      'onMouseDown': 'mousedown',
      'onMouseUp': 'mouseup',
      'onMouseEnter': 'mouseenter',
      'onMouseLeave': 'mouseleave',
      'onMouseOver': 'mouseover',
      'onMouseOut': 'mouseout',
      'onTouchStart': 'touchstart',
      'onTouchEnd': 'touchend',
      'onTouchMove': 'touchmove',
      'onTouchCancel': 'touchcancel',
      'onKeyDown': 'keydown',
      'onKeyUp': 'keyup',
      'onKeyPress': 'keypress',
      'onChange': 'change',
      'onInput': 'input',
      'onFocus': 'focus',
      'onBlur': 'blur',
      'onSubmit': 'submit',
      'onSelect': 'select',
      'onScroll': 'scroll'
    };

    return mapping[reactEventType] || reactEventType.slice(2).toLowerCase();
  }

  /**
   * Create Touch array for touch events
   */
  private static createTouchList(element: Element): Touch[] {
    const rect = element.getBoundingClientRect();
    const touch = new Touch({
      identifier: 0,
      target: element as EventTarget,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      pageX: rect.left + rect.width / 2,
      pageY: rect.top + rect.height / 2,
      screenX: rect.left + rect.width / 2,
      screenY: rect.top + rect.height / 2,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1
    });

    return [touch];
  }

  /**
   * Convert Touch array to TouchList for native events
   */
  private static arrayToTouchList(touches: Touch[]): TouchList {
    const touchList = touches as any;
    touchList.item = (index: number) => index < touches.length ? touches[index] : null;
    touchList.length = touches.length;
    return touchList as TouchList;
  }

  /**
   * Safely dispatch event with error handling
   */
  private static async dispatchEventSafely(element: Element, event: Event, eventType: string): Promise<boolean> {
    try {
      // Focus element if it's focusable and event requires it
      if (this.shouldFocusElement(eventType) && element instanceof HTMLElement) {
        element.focus();
        await this.wait(10);
      }

      // Dispatch the event
      const result = element.dispatchEvent(event);
      
      // Add small delay for React to process
      await this.wait(this.DEFAULT_DELAY);
      
      return result;
    } catch (error) {
      console.warn(`Event dispatch failed: ${error}`);
      return false;
    }
  }

  /**
   * Check if element should be focused for event
   */
  private static shouldFocusElement(eventType: string): boolean {
    const focusEvents = ['onClick', 'onDoubleClick', 'onKeyDown', 'onKeyUp', 'onChange', 'onInput'];
    return focusEvents.includes(eventType);
  }

  /**
   * Wait for specified duration
   */
  private static wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Natural Event Simulation
 * Provides human-like event sequences for better compatibility
 */
export class NaturalEventSimulator {
  /**
   * Simulate natural click sequence
   */
  static async simulateNaturalClick(component: ReactComponent | MUIComponent): Promise<EventSimulationResult> {
    const eventsFired: string[] = [];
    const startTime = Date.now();

    try {
      const element = component.element;
      
      // Natural click sequence: mousedown -> mouseup -> click
      const sequence = [
        { event: 'onMouseDown', delay: 0 },
        { event: 'onMouseUp', delay: 50 },
        { event: 'onClick', delay: 10 }
      ];

      for (const step of sequence) {
        if (step.delay > 0) {
          await ReactEventDispatcher['wait'](step.delay);
        }

        const result = await ReactEventDispatcher.triggerEvent(component, step.event);
        if (result.success) {
          eventsFired.push(step.event);
        }
      }

      return {
        success: eventsFired.length > 0,
        eventsFired,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        eventsFired,
        error: `Natural click simulation failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Simulate natural touch sequence
   */
  static async simulateNaturalTouch(component: ReactComponent | MUIComponent): Promise<EventSimulationResult> {
    const eventsFired: string[] = [];
    const startTime = Date.now();

    try {
      // Natural touch sequence: touchstart -> touchend
      const sequence = [
        { event: 'onTouchStart', delay: 0 },
        { event: 'onTouchEnd', delay: 100 }
      ];

      for (const step of sequence) {
        if (step.delay > 0) {
          await ReactEventDispatcher['wait'](step.delay);
        }

        const result = await ReactEventDispatcher.triggerEvent(component, step.event);
        if (result.success) {
          eventsFired.push(step.event);
        }
      }

      return {
        success: eventsFired.length > 0,
        eventsFired,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        eventsFired,
        error: `Natural touch simulation failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Simulate double-click with proper timing
   */
  static async simulateDoubleClick(component: ReactComponent | MUIComponent): Promise<EventSimulationResult> {
    const eventsFired: string[] = [];
    const startTime = Date.now();

    try {
      // First click
      const firstClick = await this.simulateNaturalClick(component);
      eventsFired.push(...firstClick.eventsFired);

      // Wait for double-click timing
      await ReactEventDispatcher['wait'](200);

      // Double-click event
      const doubleClick = await ReactEventDispatcher.triggerEvent(component, 'onDoubleClick');
      if (doubleClick.success) {
        eventsFired.push('onDoubleClick');
      }

      return {
        success: eventsFired.length > 0,
        eventsFired,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        eventsFired,
        error: `Double-click simulation failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Simulate form input with change events
   */
  static async simulateInput(
    component: ReactComponent | MUIComponent, 
    value: string
  ): Promise<EventSimulationResult> {
    const eventsFired: string[] = [];
    const startTime = Date.now();

    try {
      const element = component.element;
      
      if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) {
        return {
          success: false,
          eventsFired,
          error: 'Element is not an input or textarea'
        };
      }

      // Focus the element
      element.focus();
      await ReactEventDispatcher['wait'](10);

      // Set value and trigger input events
      const oldValue = element.value;
      element.value = value;

      // Trigger input event
      const inputResult = await ReactEventDispatcher.triggerEvent(component, 'onInput');
      if (inputResult.success) {
        eventsFired.push('onInput');
      }

      // Trigger change event
      const changeResult = await ReactEventDispatcher.triggerEvent(component, 'onChange');
      if (changeResult.success) {
        eventsFired.push('onChange');
      }

      return {
        success: eventsFired.length > 0,
        eventsFired,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        eventsFired,
        error: `Input simulation failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }
}

/**
 * Event Validation and Testing
 */
export class ReactEventValidator {
  /**
   * Test event handling capabilities of component
   */
  static async testComponentEvents(component: ReactComponent | MUIComponent): Promise<{
    supportedEvents: string[];
    testedEvents: Record<string, boolean>;
    recommendations: string[];
  }> {
    const handlers = ReactEventHandlerDiscovery.getEventHandlers(component);
    const supportedEvents = Object.keys(handlers);
    const testedEvents: Record<string, boolean> = {};
    const recommendations: string[] = [];

    // Test common interactive events
    const testEvents = ['onClick', 'onDoubleClick', 'onMouseDown', 'onTouchEnd'];
    
    for (const eventType of testEvents) {
      if (supportedEvents.includes(eventType)) {
        try {
          const result = await ReactEventDispatcher.triggerEvent(component, eventType);
          testedEvents[eventType] = result.success;
          
          if (!result.success) {
            recommendations.push(`${eventType} handler exists but may not be functional`);
          }
        } catch (error) {
          testedEvents[eventType] = false;
          recommendations.push(`${eventType} testing failed: ${error}`);
        }
      }
    }

    // Add general recommendations
    if (supportedEvents.length === 0) {
      recommendations.push('Component has no event handlers - may not be interactive');
    }

    if (supportedEvents.includes('onClick') && !supportedEvents.includes('onKeyDown')) {
      recommendations.push('Consider adding keyboard accessibility (onKeyDown)');
    }

    return {
      supportedEvents,
      testedEvents,
      recommendations
    };
  }

  /**
   * Validate React event system integrity
   */
  static async validateEventSystem(): Promise<{
    isWorking: boolean;
    issues: string[];
    capabilities: string[];
  }> {
    const issues: string[] = [];
    const capabilities: string[] = [];

    try {
      // Test basic event creation
      const testEvent = new MouseEvent('click', { bubbles: true });
      if (testEvent) {
        capabilities.push('Event creation supported');
      }

      // Test touch event support
      try {
        const touchEvent = new TouchEvent('touchstart');
        capabilities.push('Touch events supported');
      } catch (error) {
        issues.push('Touch events not supported');
      }

      // Test custom event support
      try {
        const customEvent = new CustomEvent('test');
        capabilities.push('Custom events supported');
      } catch (error) {
        issues.push('Custom events not supported');
      }

      // Test React Fiber access
      const doc = StealthBrowserAPI.getInstance().getDocument();
      const elements = doc.querySelectorAll('*');
      let reactElementsFound = 0;

      for (let i = 0; i < Math.min(50, elements.length); i++) {
        const element = elements[i];
        const keys = Object.keys(element);
        if (keys.some(key => key.startsWith('__reactFiber$'))) {
          reactElementsFound++;
        }
      }

      if (reactElementsFound > 0) {
        capabilities.push(`React Fiber access working (${reactElementsFound} elements)`);
      } else {
        issues.push('No React Fiber access detected');
      }

      return {
        isWorking: issues.length === 0,
        issues,
        capabilities
      };
    } catch (error) {
      issues.push(`Event system validation failed: ${error}`);
      return { isWorking: false, issues, capabilities };
    }
  }
}

/**
 * Comprehensive React Event Handler
 * Main interface for React event handling operations
 */
export class ReactEventHandler {
  static discovery = ReactEventHandlerDiscovery;
  static dispatcher = ReactEventDispatcher;
  static simulator = NaturalEventSimulator;
  static validator = ReactEventValidator;

  /**
   * Trigger React event on element
   */
  static triggerEvent(component: ReactComponent | MUIComponent, eventType: string, options?: ReactEventOptions): Promise<EventSimulationResult> {
    return ReactEventDispatcher.triggerEvent(component, eventType, options);
  }

  /**
   * Simulate natural user interaction
   */
  static simulateClick(component: ReactComponent | MUIComponent): Promise<EventSimulationResult> {
    return NaturalEventSimulator.simulateNaturalClick(component);
  }

  /**
   * Simulate typing text into an input element
   */
  static async simulateTyping(element: Element, text: string, options: { delay?: number } = {}): Promise<EventSimulationResult> {
    const delay = options.delay || 50;
    const eventsFired: string[] = [];
    const startTime = Date.now();

    try {
      const inputElement = element as HTMLInputElement;
      
      // Focus the element first
      inputElement.focus();
      eventsFired.push('focus');

      // Clear existing content
      inputElement.value = '';
      
      // Type each character
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        inputElement.value += char;
        
        // Fire input event
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
        eventsFired.push('input');
        
        // Wait between keystrokes
        if (delay > 0 && i < text.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Fire change event at the end
      const changeEvent = new Event('change', { bubbles: true });
      inputElement.dispatchEvent(changeEvent);
      eventsFired.push('change');

      return {
        success: true,
        eventsFired,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        eventsFired,
        error: `Typing simulation failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Simulate key press on an element
   */
  static async simulateKeyPress(element: Element, key: string, options: { ctrlKey?: boolean, shiftKey?: boolean } = {}): Promise<EventSimulationResult> {
    const eventsFired: string[] = [];
    const startTime = Date.now();

    try {
      const keyOptions = {
        key,
        code: key,
        bubbles: true,
        ctrlKey: options.ctrlKey || false,
        shiftKey: options.shiftKey || false
      };

      // Fire keydown event
      const keydownEvent = new KeyboardEvent('keydown', keyOptions);
      element.dispatchEvent(keydownEvent);
      eventsFired.push('keydown');

      // Fire keypress event (if printable character)
      if (key.length === 1) {
        const keypressEvent = new KeyboardEvent('keypress', keyOptions);
        element.dispatchEvent(keypressEvent);
        eventsFired.push('keypress');
      }

      // Fire keyup event
      const keyupEvent = new KeyboardEvent('keyup', keyOptions);
      element.dispatchEvent(keyupEvent);
      eventsFired.push('keyup');

      return {
        success: true,
        eventsFired,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        eventsFired,
        error: `Key press simulation failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }
}