/**
 * Simple Logging System for Bitburner Scripts
 * - .log() uses ns.print() for regular output
 * - .debug() uses ns.tprint() only if debug mode is enabled
 */

export class Logger {
    public debugMode: boolean;
    public ns?: any;
    private prefix: string;

    constructor(debugMode: boolean = false, ns?: any, prefix: string = '') {
        this.debugMode = debugMode;
        this.ns = ns;
        this.prefix = prefix;
    }

    private formatMessage(message: string): string {
        return this.prefix ? `[${this.prefix}] ${message}` : message;
    }

    // Regular logging - always outputs to ns.print() or console.log
    log(message: string): void {
        const formatted = this.formatMessage(message);
        
        if (this.ns && this.ns.print) {
            this.ns.print(formatted);
        } else {
            console.log(formatted);
        }
    }

    // Debug logging - only outputs if debug is true, uses ns.tprint() or console.log
    debug(message: string): void {
        if (!this.debugMode) return;
        
        const formatted = this.formatMessage(message);
        
        if (this.ns && this.ns.tprint) {
            this.ns.tprint(formatted);
        } else {
            console.log(`[DEBUG] ${formatted}`);
        }
    }

    // Update NS reference if needed
    setNS(ns: any): void {
        this.ns = ns;
    }
}