import { NS } from "@ns";
import { BotnetOptions, DebugLevel, DebugCategory } from "/lib/botnet-types";

// ===== CENTRALIZED DEBUG LOGGING SYSTEM =====

/**
 * Centralized debug logging system
 * Provides consistent formatting and level-based filtering
 */
export class BotnetLogger {
    private ns: NS;
    private options: BotnetOptions;
    
    constructor(ns: NS, options: BotnetOptions) {
        this.ns = ns;
        this.options = options;
    }
    
    /**
     * Log error messages (always shown)
     */
    error(category: DebugCategory, message: string, data?: any): void {
        this.log(DebugLevel.ERROR, category, message, data);
    }
    
    /**
     * Log warning messages
     */
    warn(category: DebugCategory, message: string, data?: any): void {
        this.log(DebugLevel.WARN, category, message, data);
    }
    
    /**
     * Log informational messages
     */
    info(category: DebugCategory, message: string, data?: any): void {
        this.log(DebugLevel.INFO, category, message, data);
    }
    
    /**
     * Log debug messages (shown when debug=true)
     */
    debug(category: DebugCategory, message: string, data?: any): void {
        this.log(DebugLevel.DEBUG, category, message, data);
    }
    
    /**
     * Log trace messages (shown when debug=true and category-specific debug enabled)
     */
    trace(category: DebugCategory, message: string, data?: any): void {
        this.log(DebugLevel.TRACE, category, message, data);
    }
    
    /**
     * Log repboost-specific messages
     */
    repboost(level: DebugLevel, message: string, data?: any): void {
        if (!this.shouldLog(level, DebugCategory.REPBOOST)) return;
        
        const prefix = this.getPrefix(level, DebugCategory.REPBOOST);
        const formattedMessage = data ? `${prefix}${message} ${this.formatData(data)}` : `${prefix}${message}`;
        this.ns.tprint(formattedMessage);
    }
    
    /**
     * Log HWGW batching messages
     */
    hwgw(level: DebugLevel, message: string, data?: any): void {
        if (!this.shouldLog(level, DebugCategory.HWGW)) return;
        
        const prefix = this.getPrefix(level, DebugCategory.HWGW);
        const formattedMessage = data ? `${prefix}${message} ${this.formatData(data)}` : `${prefix}${message}`;
        this.ns.tprint(formattedMessage);
    }
    
    /**
     * Log server management messages
     */
    server(level: DebugLevel, message: string, data?: any): void {
        if (!this.shouldLog(level, DebugCategory.SERVER)) return;
        
        const prefix = this.getPrefix(level, DebugCategory.SERVER);
        const formattedMessage = data ? `${prefix}${message} ${this.formatData(data)}` : `${prefix}${message}`;
        this.ns.tprint(formattedMessage);
    }
    
    /**
     * Core logging implementation
     */
    private log(level: DebugLevel, category: DebugCategory, message: string, data?: any): void {
        if (!this.shouldLog(level, category)) return;
        
        const prefix = this.getPrefix(level, category);
        const formattedMessage = data ? `${prefix}${message} ${this.formatData(data)}` : `${prefix}${message}`;
        this.ns.tprint(formattedMessage);
    }
    
    /**
     * Determine if message should be logged based on options
     */
    private shouldLog(level: DebugLevel, category: DebugCategory): boolean {
        // Always show errors
        if (level === DebugLevel.ERROR) return true;
        
        // Check general debug setting
        if (level <= DebugLevel.INFO && this.options.debug) return true;
        
        // Check category-specific debug settings
        switch (category) {
            case DebugCategory.REPBOOST:
                return level <= DebugLevel.TRACE && this.options['repboost-debug'];
            case DebugCategory.HWGW:
            case DebugCategory.SERVER:
            case DebugCategory.NETWORK:
            case DebugCategory.ALLOCATION:
            case DebugCategory.EXECUTION:
                return level <= DebugLevel.DEBUG && this.options.debug;
            case DebugCategory.SYSTEM:
                return level <= DebugLevel.INFO;
            default:
                return false;
        }
    }
    
    /**
     * Generate formatted prefix for log messages
     */
    private getPrefix(level: DebugLevel, category: DebugCategory): string {
        const timestamp = new Date().toTimeString().substring(0, 8);
        const levelName = DebugLevel[level];
        return `[${timestamp}] ${category}:${levelName} - `;
    }
    
    /**
     * Format data objects for logging
     */
    private formatData(data: any): string {
        if (typeof data === 'object') {
            return JSON.stringify(data);
        }
        return String(data);
    }
}