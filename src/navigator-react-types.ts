/**
 * React Navigation Types and Interfaces
 * 
 * Comprehensive type definitions and interfaces for the React-first Bitburner
 * navigator system. Defines all 33+ game sections, React-specific methods,
 * and component structure interfaces.
 */

import { ReactComponent, ReactFiber } from '/lib/react-component-finder';
import { MUIComponent } from '/lib/material-ui-integration';
import { ReactGamePage } from '/lib/react-game-page';

// Type aliases for clarity
export type ReactGameComponent = ReactComponent;
import { EventSimulationResult } from '/lib/react-event-handler';

/**
 * Complete Bitburner Game Section Enumeration
 * All 33+ navigation sections identified from plan research
 */
export enum ReactGameSection {
  // Core Navigation
  Terminal = 'Terminal',
  ScriptEditor = 'Script Editor',
  ActiveScripts = 'Active Scripts',
  RecentErrorsPassed = 'Recent Errors/Passed',

  // Character Progression  
  Stats = 'Stats',
  Augmentations = 'Augmentations',
  Factions = 'Factions',
  Milestones = 'Milestones',

  // Economic Systems
  Hacknet = 'Hacknet',
  StockMarket = 'Stock Market', 
  Corporation = 'Corporation',

  // Advanced Features
  Gang = 'Gang',
  Bladeburner = 'Bladeburner',
  Sleeves = 'Sleeves',

  // World Navigation
  City = 'City',
  Travel = 'Travel',
  Job = 'Job',

  // BitNode Progression
  BitVerse = 'BitVerse',
  SourceFiles = 'Source-Files',
  InfiltrationMap = 'Infiltration Map',
  Tutorial = 'Tutorial',
  Documentation = 'Documentation',
  DevMenu = 'Dev Menu',

  // Specialized Sections
  Stanek = 'Stanek\'s Gift',
  Grafting = 'Grafting',
  GoClones = 'Go Clones',
  CodingContracts = 'Coding Contracts',

  // Activity Sections
  TrainCombat = 'Train Combat',
  TrainCharisma = 'Train Charisma',
  TrainHacking = 'Train Hacking',
  University = 'University',
  Gym = 'Gym',

  // Meta/System
  GameOptions = 'Game Options',
  Achievements = 'Achievements',
  Statistics = 'Statistics'
}

/**
 * Navigation Context for Complex Pages
 * Supports hierarchical navigation with parameters
 */
export interface ReactNavigationContext {
  section: ReactGameSection;
  subsection?: string;
  parameters?: Record<string, any>;
  metadata?: {
    requiresUnlock?: boolean;
    prerequisites?: string[];
    estimatedNavTime?: number;
  };
}

/**
 * Core interface for all game page implementations
 */
export interface IReactGamePage {
  readonly section: ReactGameSection;
  readonly context?: ReactNavigationContext;
  readonly isReady: boolean;
  readonly rootComponent?: ReactGameComponent;
  
  // Navigation Methods
  navigateTo(): Promise<boolean>;
  isCurrentPage(): Promise<boolean>;
  waitForReady(timeoutMs?: number): Promise<boolean>;
  
  // Component Interaction
  findComponent(criteria: ReactComponentSearchCriteria): Promise<ReactGameComponent | null>;
  findComponents(criteria: ReactComponentSearchCriteria): Promise<ReactGameComponent[]>;
  clickComponent(component: ReactGameComponent): Promise<boolean>;
  inputToComponent(component: ReactGameComponent, value: string): Promise<boolean>;
  readComponent(component: ReactGameComponent): Promise<string>;
  
  // Page State
  getPageState(): Promise<ReactPageState>;
  waitForStateChange(property: string, timeoutMs?: number): Promise<boolean>;
  
  // Hierarchical Navigation (for complex pages)
  navigateToSubsection?(subsection: string, params?: Record<string, any>): Promise<boolean>;
  getCurrentSubsection?(): Promise<string | null>;
  getAvailableSubsections?(): Promise<string[]>;
  
  // Lifecycle
  onPageLoad?(): Promise<void>;
  onPageUnload?(): Promise<void>;
  refresh(): Promise<void>;
}

/**
 * Component Search Criteria for React Game Pages
 */
export interface ReactComponentSearchCriteria {
  text?: string;
  className?: string;
  muiType?: string;
  role?: string;
  props?: Record<string, any>;
  state?: Record<string, any>;
  gameContext?: Partial<ReactNavigationContext>;
  maxDepth?: number;
  includeHidden?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Advanced Component Search Criteria for ReactElementFinder
 */
export interface ComponentSearchCriteria {
  displayName?: string;
  muiType?: string;
  textContent?: string;
  props?: Record<string, any>;
  attributes?: Record<string, string>;
  interactive?: boolean;
  visible?: boolean;
  maxDepth?: number;
  limit?: number;
  sortBy?: 'position' | 'interactivity' | 'text' | 'muiPriority';
  customFilter?: (component: ReactComponentInfo) => boolean;
}

/**
 * React Page State Interface
 */
export interface ReactPageState {
  isLoaded: boolean;
  isVisible: boolean;
  hasError: boolean;
  errorMessage?: string;
  loadTime?: number;
  componentCount: number;
  interactiveComponents: number;
  gameData?: Record<string, any>;
  lastUpdate: number;
}

/**
 * React Navigation Result
 */
export interface ReactNavigationResult {
  success: boolean;
  method: 'react' | 'hash' | 'dom' | 'fallback';
  duration: number;
  error?: string;
  targetSection: ReactGameSection;
  actualSection?: ReactGameSection;
  componentsFoufnd: number;
  navigationPath?: string[];
}

/**
 * React Game Page Factory Interface
 */
export interface ReactGamePageFactory {
  createPage(section: ReactGameSection, context?: ReactNavigationContext): IReactGamePage;
  getSupportedSections(): ReactGameSection[];
  getPageClass(section: ReactGameSection): typeof ReactGamePage;
}

/**
 * React Navigation Strategy Interface
 */
export interface ReactNavigationStrategy {
  name: string;
  priority: number;
  canNavigate(section: ReactGameSection, context?: ReactNavigationContext): Promise<boolean>;
  navigate(section: ReactGameSection, context?: ReactNavigationContext): Promise<ReactNavigationResult>;
  isCurrentSection(section: ReactGameSection): Promise<boolean>;
  getNavigationElement(section: ReactGameSection): Promise<ReactGameComponent | null>;
}

/**
 * Complex Page Parameter Interfaces
 * For sections requiring specific context/parameters
 */
export interface ReactBitVerseParams {
  nodeIndex?: number;
  action?: 'enter' | 'info' | 'reset';
}

export interface ReactFactionParams {
  factionName: string;
  action?: 'work' | 'donate' | 'purchase' | 'info';
  workType?: 'hacking' | 'field' | 'security';
}

export interface ReactLocationParams {
  locationName: string;
  cityName?: string;
  action?: 'work' | 'info' | 'travel' | 'purchase';
}

export interface ReactCorporationParams {
  divisionName?: string;
  tab?: 'overview' | 'divisions' | 'research' | 'warehouse';
  office?: string;
}

export interface ReactGangParams {
  tab?: 'management' | 'equipment' | 'territory';
  memberName?: string;
  action?: 'recruit' | 'assign' | 'upgrade';
}

export interface ReactBladeburnerParams {
  tab?: 'general' | 'contracts' | 'operations' | 'blackops' | 'skills';
  actionType?: 'contract' | 'operation' | 'blackop';
  actionName?: string;
}

/**
 * Conditional Access System
 */
export interface ReactConditionalAccess {
  checkFeatureUnlocked(feature: ReactGameSection): Promise<boolean>;
  getUnlockRequirements(feature: ReactGameSection): Promise<string[]>;
  waitForUnlock(feature: ReactGameSection, timeoutMs?: number): Promise<boolean>;
  getLockedFeatures(): Promise<ReactGameSection[]>;
  getUnlockedFeatures(): Promise<ReactGameSection[]>;
}

/**
 * React Game State Monitor Interface
 */
export interface ReactGameStateMonitor {
  // Player State
  getPlayerMoney(): Promise<number>;
  getPlayerHackingLevel(): Promise<number>;
  getPlayerStats(): Promise<PlayerStats>;
  getCurrentServer(): Promise<string>;
  
  // Game Progress
  getBitNodeInfo(): Promise<BitNodeInfo>;
  getAugmentationData(): Promise<AugmentationData>;
  getFactionData(): Promise<FactionData[]>;
  getStockData(): Promise<StockData[]>;
  
  // Real-time Monitoring
  onStateChange<T>(property: keyof GameStateData, callback: (newValue: T) => void): void;
  offStateChange(property: keyof GameStateData, callback: Function): void;
  
  // State Caching
  getCachedState<T>(property: keyof GameStateData): T | null;
  invalidateCache(property?: keyof GameStateData): void;
}

/**
 * Supporting Data Interfaces
 */
export interface PlayerStats {
  hacking: number;
  strength: number;
  defense: number;
  dexterity: number;
  agility: number;
  charisma: number;
  intelligence: number;
  money: number;
  totalPlaytime: number;
}

export interface BitNodeInfo {
  currentNode: number;
  sourceFiles: SourceFileData[];
  availableNodes: number[];
  nodeMultipliers: Record<string, number>;
}

export interface SourceFileData {
  n: number;
  lvl: number;
  name: string;
  description: string;
}

export interface AugmentationData {
  owned: string[];
  available: string[];
  queued: string[];
  costs: Record<string, { money: number; rep: number }>;
}

export interface FactionData {
  name: string;
  reputation: number;
  favor: number;
  isMember: boolean;
  hasInvitation: boolean;
  workTypes: string[];
}

export interface StockData {
  symbol: string;
  price: number;
  shares: number;
  maxShares: number;
  forecast: number;
  volatility: number;
  askPrice: number;
  bidPrice: number;
}

export interface GameStateData {
  player: PlayerStats;
  bitNode: BitNodeInfo;
  augmentations: AugmentationData;
  factions: FactionData[];
  stocks: StockData[];
  currentSection: ReactGameSection;
  lastUpdate: number;
}

/**
 * React Automation Workflow Interfaces
 */
export interface ReactAutomationWorkflow {
  name: string;
  description: string;
  steps: ReactWorkflowStep[];
  prerequisites?: (state: GameStateData) => boolean;
  estimatedDuration: number;
  priority: 'high' | 'medium' | 'low';
}

export interface ReactWorkflowStep {
  name: string;
  section: ReactGameSection;
  context?: ReactNavigationContext;
  action: ReactWorkflowAction;
  condition?: (state: GameStateData) => boolean;
  retryCount?: number;
  timeout?: number;
}

export interface ReactWorkflowAction {
  type: 'click' | 'input' | 'read' | 'wait' | 'navigate' | 'custom';
  target?: ReactComponentSearchCriteria;
  value?: any;
  customHandler?: (page: ReactGamePage) => Promise<boolean>;
}

/**
 * React Navigation Orchestrator Interface
 */
export interface ReactNavigationOrchestrator {
  // Workflow Execution
  executeWorkflow(workflow: ReactAutomationWorkflow): Promise<WorkflowResult>;
  executeSteps(steps: ReactWorkflowStep[]): Promise<StepResult[]>;
  
  // Navigation Management
  queueNavigation(section: ReactGameSection, context?: ReactNavigationContext): Promise<void>;
  processNavigationQueue(): Promise<void>;
  getCurrentNavigation(): ReactNavigationContext | null;
  
  // Performance Monitoring
  getNavigationStats(): NavigationStats;
  resetStats(): void;
  
  // Strategy Management
  addStrategy(strategy: ReactNavigationStrategy): void;
  removeStrategy(strategyName: string): void;
  getActiveStrategies(): ReactNavigationStrategy[];
}

export interface WorkflowResult {
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  duration: number;
  error?: string;
  results: StepResult[];
}

export interface StepResult {
  stepName: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

export interface NavigationStats {
  totalNavigations: number;
  successfulNavigations: number;
  averageDuration: number;
  methodUsage: Record<string, number>;
  sectionStats: Record<ReactGameSection, {
    attempts: number;
    successes: number;
    averageDuration: number;
  }>;
}

/**
 * Type Guards and Utilities
 */
export namespace ReactNavigationTypes {
  export function isReactGameComponent(component: any): component is ReactGameComponent {
    return component && 
           typeof component === 'object' && 
           'element' in component && 
           'fiber' in component;
  }

  export function isMUIGameComponent(component: any): component is MUIComponent {
    return isReactGameComponent(component) && 
           'muiType' in component;
  }

  export function isComplexSection(section: ReactGameSection): boolean {
    const complexSections = [
      ReactGameSection.BitVerse,
      ReactGameSection.Factions,
      ReactGameSection.City,
      ReactGameSection.Corporation,
      ReactGameSection.Gang,
      ReactGameSection.Bladeburner
    ];
    return complexSections.includes(section);
  }

  export function getDefaultContext(section: ReactGameSection): ReactNavigationContext {
    return {
      section,
      metadata: {
        requiresUnlock: isAdvancedFeature(section),
        estimatedNavTime: getEstimatedNavTime(section)
      }
    };
  }

  export function isAdvancedFeature(section: ReactGameSection): boolean {
    const advancedFeatures = [
      ReactGameSection.Corporation,
      ReactGameSection.Gang,
      ReactGameSection.Bladeburner,
      ReactGameSection.Sleeves,
      ReactGameSection.BitVerse,
      ReactGameSection.Stanek,
      ReactGameSection.Grafting
    ];
    return advancedFeatures.includes(section);
  }

  export function getEstimatedNavTime(section: ReactGameSection): number {
    // Estimated navigation time in milliseconds
    const timings: Partial<Record<ReactGameSection, number>> = {
      [ReactGameSection.Terminal]: 100,
      [ReactGameSection.ScriptEditor]: 200,
      [ReactGameSection.Stats]: 150,
      [ReactGameSection.Hacknet]: 300,
      [ReactGameSection.BitVerse]: 500,
      [ReactGameSection.Corporation]: 800,
      [ReactGameSection.Gang]: 600,
      [ReactGameSection.Bladeburner]: 700
    };
    return timings[section] || 250;
  }

  export function getSectionPriority(section: ReactGameSection): number {
    // Higher numbers = higher priority for navigation
    const priorities: Partial<Record<ReactGameSection, number>> = {
      [ReactGameSection.Terminal]: 10,
      [ReactGameSection.ScriptEditor]: 9,
      [ReactGameSection.ActiveScripts]: 8,
      [ReactGameSection.Stats]: 7,
      [ReactGameSection.Hacknet]: 6,
      [ReactGameSection.Corporation]: 5,
      [ReactGameSection.Gang]: 4,
      [ReactGameSection.BitVerse]: 3
    };
    return priorities[section] || 1;
  }
}

/**
 * Additional types for ReactElementFinder integration
 */
export interface ReactComponentInfo {
  displayName?: string;
  props?: Record<string, any>;
  state?: any;
  domElement?: Element;
  fiber?: any;
  children?: ReactComponentInfo[];
  parent?: ReactComponentInfo | null;
  muiType?: string;
}

/**
 * Simplified types for compatibility
 */
export type GameSection = string;

export interface NavigationParams {
  [key: string]: any;
}

export interface NavigationResult {
  success: boolean;
  message?: string;
  timestamp: number;
  section: GameSection;
  data?: any;
}