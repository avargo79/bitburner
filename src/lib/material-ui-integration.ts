/**
 * Material-UI Integration Utilities
 * 
 * Provides specialized utilities for interacting with Material-UI components
 * in Bitburner's React interface. Handles MUI-specific patterns, theming,
 * and component discovery optimized for the 523+ MUI components.
 */

import { ReactComponent, ReactComponentFinder, ComponentSearchCriteria } from '/lib/react-component-finder';
import { StealthBrowserAPI } from '/lib/react-browser-utils';

export interface MUIComponent extends ReactComponent {
  muiType: string;
  muiVariant?: string;
  muiColor?: string;
  muiSize?: string;
  muiDisabled?: boolean;
  muiSelected?: boolean;
  hasRipple?: boolean;
}

export interface MUITheme {
  palette: {
    primary: { main: string };
    secondary: { main: string };
    background: { default: string; paper: string };
    text: { primary: string; secondary: string };
  };
  typography: {
    fontFamily: string;
    fontSize: number;
  };
  spacing: (factor: number) => string;
}

/**
 * Material-UI Component Type Detection
 */
export class MUIComponentDetector {
  // Common MUI component patterns from POC research
  private static readonly MUI_PATTERNS = {
    Button: ['MuiButton-root', 'MuiButtonBase-root'],
    Typography: ['MuiTypography-root', 'MuiTypography-h1', 'MuiTypography-h2', 'MuiTypography-h3', 'MuiTypography-h4', 'MuiTypography-body1', 'MuiTypography-body2'],
    ListItem: ['MuiListItem-root', 'MuiListItemButton-root'],
    ListItemText: ['MuiListItemText-root', 'MuiListItemText-primary', 'MuiListItemText-secondary'],
    Tab: ['MuiTab-root', 'MuiButtonBase-root'],
    AppBar: ['MuiAppBar-root', 'MuiPaper-root'],
    Drawer: ['MuiDrawer-root', 'MuiDrawer-paper'],
    Dialog: ['MuiDialog-root', 'MuiModal-root'],
    TextField: ['MuiTextField-root', 'MuiInputBase-root'],
    Chip: ['MuiChip-root'],
    Card: ['MuiCard-root', 'MuiPaper-root'],
    CardContent: ['MuiCardContent-root'],
    IconButton: ['MuiIconButton-root', 'MuiButtonBase-root'],
    Menu: ['MuiMenu-root', 'MuiPopover-root'],
    MenuItem: ['MuiMenuItem-root', 'MuiButtonBase-root'],
    Tooltip: ['MuiTooltip-tooltip'],
    Slider: ['MuiSlider-root'],
    Switch: ['MuiSwitch-root'],
    Checkbox: ['MuiCheckbox-root'],
    Radio: ['MuiRadio-root'],
    FormControl: ['MuiFormControl-root'],
    Select: ['MuiSelect-root'],
    Table: ['MuiTable-root'],
    TableCell: ['MuiTableCell-root'],
    TableRow: ['MuiTableRow-root'],
    Accordion: ['MuiAccordion-root'],
    Badge: ['MuiBadge-root'],
    LinearProgress: ['MuiLinearProgress-root'],
    CircularProgress: ['MuiCircularProgress-root']
  };

  /**
   * Detect MUI component type from element
   */
  static detectMUIType(element: Element): string | undefined {
    const className = element.className || '';
    
    // Check against known patterns first
    for (const [type, patterns] of Object.entries(this.MUI_PATTERNS)) {
      if (patterns.some(pattern => className.includes(pattern))) {
        return type;
      }
    }
    
    // Fallback to generic pattern
    if (className.includes('Mui') && className.includes('-root')) {
      const match = className.match(/Mui([A-Z][a-zA-Z]*)-root/);
      return match ? match[1] : undefined;
    }

    return undefined;
  }

  /**
   * Check if element is MUI component
   */
  static isMUIComponent(element: Element): boolean {
    return this.detectMUIType(element) !== undefined;
  }

  /**
   * Get MUI component variant
   */
  static getMUIVariant(element: Element): string | undefined {
    const className = element.className || '';
    
    // Common variant patterns
    const variantPatterns = [
      /Mui\w+-outlined/,
      /Mui\w+-filled/,
      /Mui\w+-standard/,
      /Mui\w+-contained/,
      /Mui\w+-text/,
      /Mui\w+-fullWidth/,
      /Mui\w+-dense/
    ];

    for (const pattern of variantPatterns) {
      const match = className.match(pattern);
      if (match) {
        return match[0].split('-')[1];
      }
    }

    return undefined;
  }

  /**
   * Get MUI component color
   */
  static getMUIColor(element: Element): string | undefined {
    const className = element.className || '';
    
    const colorPatterns = [
      'primary', 'secondary', 'success', 'error', 'warning', 'info'
    ];

    for (const color of colorPatterns) {
      if (className.includes(`color${color.charAt(0).toUpperCase() + color.slice(1)}`)) {
        return color;
      }
    }

    return undefined;
  }

  /**
   * Get MUI component size
   */
  static getMUISize(element: Element): string | undefined {
    const className = element.className || '';
    
    const sizePatterns = ['small', 'medium', 'large'];
    
    for (const size of sizePatterns) {
      if (className.includes(`size${size.charAt(0).toUpperCase() + size.slice(1)}`)) {
        return size;
      }
    }

    return undefined;
  }

  /**
   * Check if MUI component is disabled
   */
  static isMUIDisabled(element: Element): boolean {
    const className = element.className || '';
    return className.includes('Mui-disabled') || 
           (element as HTMLElement).hasAttribute('disabled');
  }

  /**
   * Check if MUI component is selected
   */
  static isMUISelected(element: Element): boolean {
    const className = element.className || '';
    return className.includes('Mui-selected') ||
           className.includes('Mui-checked') ||
           (element as HTMLElement).getAttribute('aria-selected') === 'true';
  }
}

/**
 * Material-UI Component Finder
 * Specialized finder for MUI components
 */
export class MUIComponentFinder {
  /**
   * Find MUI components by type
   */
  static async findMUIComponents(muiType: string, additionalCriteria?: Partial<ComponentSearchCriteria>): Promise<MUIComponent[]> {
    const criteria: ComponentSearchCriteria = {
      muiType,
      includeHidden: false,
      ...additionalCriteria
    };

    const components = await ReactComponentFinder.findComponents(criteria);
    
    return components.map(component => this.enhanceMUIComponent(component))
                    .filter(component => component.muiType === muiType);
  }

  /**
   * Find single MUI component by type
   */
  static async findMUIComponent(muiType: string, additionalCriteria?: Partial<ComponentSearchCriteria>): Promise<MUIComponent | null> {
    const components = await this.findMUIComponents(muiType, additionalCriteria);
    return components[0] || null;
  }

  /**
   * Find MUI buttons with text
   */
  static async findMUIButton(text: string): Promise<MUIComponent | null> {
    return this.findMUIComponent('Button', { text });
  }

  /**
   * Find MUI list items with text
   */
  static async findMUIListItem(text: string): Promise<MUIComponent | null> {
    return this.findMUIComponent('ListItem', { text });
  }

  /**
   * Find MUI tabs with text
   */
  static async findMUITab(text: string): Promise<MUIComponent | null> {
    return this.findMUIComponent('Tab', { text });
  }

  /**
   * Find MUI typography with text
   */
  static async findMUITypography(text: string): Promise<MUIComponent | null> {
    return this.findMUIComponent('Typography', { text });
  }

  /**
   * Find all MUI components in navigation drawer
   */
  static async findNavigationItems(): Promise<MUIComponent[]> {
    const drawer = await this.findMUIComponent('Drawer');
    if (!drawer) return [];

    // Find list items within drawer
    const criteria: ComponentSearchCriteria = {
      muiType: 'ListItem',
      includeHidden: false
    };

    const allListItems = await ReactComponentFinder.findComponents(criteria);
    
    // Filter to only those within the drawer
    return allListItems
      .map(component => this.enhanceMUIComponent(component))
      .filter(component => this.isWithinElement(component.element, drawer.element));
  }

  /**
   * Enhance ReactComponent with MUI-specific properties
   */
  static enhanceMUIComponent(component: ReactComponent): MUIComponent {
    const element = component.element;
    
    return {
      ...component,
      muiType: MUIComponentDetector.detectMUIType(element) || 'Unknown',
      muiVariant: MUIComponentDetector.getMUIVariant(element) || undefined,
      muiColor: MUIComponentDetector.getMUIColor(element) || undefined,
      muiSize: MUIComponentDetector.getMUISize(element) || undefined,
      muiDisabled: MUIComponentDetector.isMUIDisabled(element),
      muiSelected: MUIComponentDetector.isMUISelected(element),
      hasRipple: element.className?.includes('MuiTouchRipple') || false
    };
  }

  /**
   * Check if element is within another element
   */
  private static isWithinElement(child: Element, parent: Element): boolean {
    return parent.contains(child);
  }

  /**
   * Get all unique MUI component types in current page
   */
  static async getAllMUITypes(): Promise<string[]> {
    const components = await ReactComponentFinder.discoverComponents();
    const muiTypes = new Set<string>();

    components.forEach(component => {
      const muiType = MUIComponentDetector.detectMUIType(component.element);
      if (muiType) {
        muiTypes.add(muiType);
      }
    });

    return Array.from(muiTypes).sort();
  }
}

/**
 * Material-UI Theme Access
 * Utilities for accessing MUI theme information
 */
export class MUIThemeAccess {
  private static theme: MUITheme | null = null;

  /**
   * Extract MUI theme from current page
   */
  static extractTheme(): MUITheme | null {
    if (this.theme) return this.theme;

    try {
      const doc = StealthBrowserAPI.getInstance().getDocument();
      const root = doc.documentElement;
      const styles = getComputedStyle(root);

      // Extract CSS custom properties used by MUI
      this.theme = {
        palette: {
          primary: { main: this.getCSSVar(styles, '--mui-palette-primary-main') || '#1976d2' },
          secondary: { main: this.getCSSVar(styles, '--mui-palette-secondary-main') || '#dc004e' },
          background: { 
            default: this.getCSSVar(styles, '--mui-palette-background-default') || '#fafafa',
            paper: this.getCSSVar(styles, '--mui-palette-background-paper') || '#fff'
          },
          text: {
            primary: this.getCSSVar(styles, '--mui-palette-text-primary') || 'rgba(0, 0, 0, 0.87)',
            secondary: this.getCSSVar(styles, '--mui-palette-text-secondary') || 'rgba(0, 0, 0, 0.6)'
          }
        },
        typography: {
          fontFamily: styles.fontFamily || 'Roboto, sans-serif',
          fontSize: parseInt(styles.fontSize) || 14
        },
        spacing: (factor: number) => `${factor * 8}px`
      };

      return this.theme;
    } catch (error) {
      console.warn(`Failed to extract MUI theme: ${error}`);
      return null;
    }
  }

  /**
   * Get CSS custom property value
   */
  private static getCSSVar(styles: CSSStyleDeclaration, propertyName: string): string | null {
    try {
      return styles.getPropertyValue(propertyName)?.trim() || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current theme mode (light/dark)
   */
  static getThemeMode(): 'light' | 'dark' | 'unknown' {
    const theme = this.extractTheme();
    if (!theme) return 'unknown';

    // Analyze background color to determine theme
    const bgColor = theme.palette.background.default;
    const isDark = this.isColorDark(bgColor);
    
    return isDark ? 'dark' : 'light';
  }

  /**
   * Get current MUI theme
   */
  static getCurrentTheme(): MUITheme | null {
    return this.extractTheme();
  }

  /**
   * Check if color is dark
   */
  private static isColorDark(color: string): boolean {
    try {
      // Simple heuristic for dark colors
      if (color.startsWith('#')) {
        const hex = color.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128;
      }
      
      if (color.startsWith('rgb')) {
        const matches = color.match(/\d+/g);
        if (matches && matches.length >= 3) {
          const [r, g, b] = matches.map(Number);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          return brightness < 128;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}

/**
 * MUI Component Statistics and Validation
 */
export class MUIComponentStats {
  /**
   * Get comprehensive MUI component statistics
   */
  static async getMUIStats(): Promise<{
    totalMUIComponents: number;
    componentsByType: Record<string, number>;
    interactiveComponents: number;
    disabledComponents: number;
    visibleComponents: number;
    themeMode: string;
    commonPatterns: string[];
  }> {
    const allComponents = await ReactComponentFinder.discoverComponents();
    const muiComponents = allComponents.filter(c => MUIComponentDetector.isMUIComponent(c.element));
    
    const stats = {
      totalMUIComponents: muiComponents.length,
      componentsByType: {} as Record<string, number>,
      interactiveComponents: 0,
      disabledComponents: 0,
      visibleComponents: 0,
      themeMode: MUIThemeAccess.getThemeMode(),
      commonPatterns: [] as string[]
    };

    const patternCount = {} as Record<string, number>;

    muiComponents.forEach(component => {
      const muiType = MUIComponentDetector.detectMUIType(component.element);
      if (muiType) {
        stats.componentsByType[muiType] = (stats.componentsByType[muiType] || 0) + 1;
      }

      if (this.isInteractiveComponent(component.element)) {
        stats.interactiveComponents++;
      }

      if (MUIComponentDetector.isMUIDisabled(component.element)) {
        stats.disabledComponents++;
      }

      if (component.isVisible) {
        stats.visibleComponents++;
      }

      // Track class patterns
      const className = component.element.className || '';
      const patterns = className.split(' ').filter(cls => cls.startsWith('Mui'));
      patterns.forEach(pattern => {
        patternCount[pattern] = (patternCount[pattern] || 0) + 1;
      });
    });

    // Get most common patterns
    stats.commonPatterns = Object.entries(patternCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([pattern]) => pattern);

    return stats;
  }

  /**
   * Check if component is interactive
   */
  private static isInteractiveComponent(element: Element): boolean {
    const interactiveTypes = ['Button', 'ListItem', 'Tab', 'IconButton', 'MenuItem', 'Switch', 'Checkbox', 'Radio'];
    const muiType = MUIComponentDetector.detectMUIType(element);
    return muiType ? interactiveTypes.includes(muiType) : false;
  }

  /**
   * Validate MUI component integrity
   */
  static async validateMUIIntegration(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
    componentCount: number;
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const stats = await this.getMUIStats();
      
      if (stats.totalMUIComponents === 0) {
        issues.push('No MUI components detected');
        recommendations.push('Verify Material-UI is loaded');
      }

      if (stats.totalMUIComponents < 100) {
        issues.push('Fewer MUI components than expected from POC');
        recommendations.push('Check if page is fully loaded');
      }

      if (stats.visibleComponents < stats.totalMUIComponents * 0.3) {
        issues.push('Many MUI components are hidden');
        recommendations.push('May indicate UI state issues');
      }

      if (stats.disabledComponents > stats.totalMUIComponents * 0.5) {
        issues.push('High number of disabled components');
        recommendations.push('Check game state prerequisites');
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations,
        componentCount: stats.totalMUIComponents
      };
    } catch (error) {
      issues.push(`MUI validation failed: ${error}`);
      return { isValid: false, issues, recommendations, componentCount: 0 };
    }
  }
}

/**
 * Comprehensive Material-UI Helper
 * Main interface for Material-UI component operations
 */
export class MaterialUIHelper {
  static detector = MUIComponentDetector;
  static finder = MUIComponentFinder;
  static theme = MUIThemeAccess;
  static stats = MUIComponentStats;

  /**
   * Find MUI component by criteria
   */
  static async findComponent(criteria: ComponentSearchCriteria): Promise<MUIComponent | null> {
    if (criteria.muiType) {
      return MUIComponentFinder.findMUIComponent(criteria.muiType, criteria);
    } else {
      // If no MUI type specified, find first MUI component matching other criteria
      const components = await ReactComponentFinder.findComponents(criteria);
      for (const component of components) {
        if (MUIComponentDetector.isMUIComponent(component.element)) {
          return MUIComponentFinder.enhanceMUIComponent(component);
        }
      }
      return null;
    }
  }

  /**
   * Get current MUI theme
   */
  static getCurrentTheme(): MUITheme | null {
    return MUIThemeAccess.getCurrentTheme();
  }

  /**
   * Find multiple MUI components by type
   */
  static async findMUIComponents(muiType: string, additionalCriteria?: Partial<ComponentSearchCriteria>): Promise<MUIComponent[]> {
    return MUIComponentFinder.findMUIComponents(muiType, additionalCriteria);
  }

  /**
   * Get MUI component statistics
   */
  static async getStats() {
    return MUIComponentStats.getMUIStats();
  }
}