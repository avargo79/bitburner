import { NS } from '@ns';

export enum LogLevel {
    TRACE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    CRITICAL = 5
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    levelName: string;
    message: string;
    context?: string;
}

interface LoggerConfig {
    level: LogLevel;
    maxFileSize: number; // bytes
    maxFiles: number;
    enableConsole: boolean;
    enableFile: boolean;
    logPrefix: string;
}

export class Logger {
    private ns: NS;
    private config: LoggerConfig;
    private static instances = new Map<string, Logger>();

    private constructor(ns: NS, context: string, config?: Partial<LoggerConfig>) {
        this.ns = ns;
        this.config = {
            level: LogLevel.INFO,
            maxFileSize: 1024 * 1024, // 1MB
            maxFiles: 5,
            enableConsole: true,
            enableFile: true,
            logPrefix: context,
            ...config
        };
    }

    static getInstance(ns: NS, context: string, config?: Partial<LoggerConfig>): Logger {
        const key = context;
        if (!Logger.instances.has(key)) {
            Logger.instances.set(key, new Logger(ns, context, config));
        } else {
            // Update existing instance config if provided
            const existingLogger = Logger.instances.get(key)!;
            if (config) {
                existingLogger.config = {
                    ...existingLogger.config,
                    ...config
                };
            }
        }
        return Logger.instances.get(key)!;
    }

    // Clear all logger instances (useful for debugging/testing)
    static clearInstances(): void {
        Logger.instances.clear();
    }

    private shouldLog(level: LogLevel): boolean {
        return level >= this.config.level;
    }

    private formatTimestamp(): string {
        const now = new Date();
        return now.toISOString().replace('T', ' ').slice(0, -5);
    }

    private getLevelName(level: LogLevel): string {
        switch (level) {
            case LogLevel.TRACE: return 'TRACE';
            case LogLevel.DEBUG: return 'DEBUG';
            case LogLevel.INFO: return 'INFO ';
            case LogLevel.WARN: return 'WARN ';
            case LogLevel.ERROR: return 'ERROR';
            case LogLevel.CRITICAL: return 'CRIT ';
            default: return 'UNKN ';
        }
    }

    private formatLogEntry(entry: LogEntry): string {
        const contextStr = entry.context ? `[${entry.context}] ` : '';
        return `${entry.timestamp} ${entry.levelName} ${contextStr}${entry.message}`;
    }

    private createLogEntry(level: LogLevel, message: string): LogEntry {
        return {
            timestamp: this.formatTimestamp(),
            level,
            levelName: this.getLevelName(level),
            message,
            context: this.config.logPrefix
        };
    }

    private async writeToFile(entry: LogEntry): Promise<void> {
        if (!this.config.enableFile) return;

        const logFileName = 'botnet.log.txt';
        const logLine = this.formatLogEntry(entry) + '\n';

        try {
            // Check if file exists and get current size
            let currentContent = '';
            try {
                currentContent = this.ns.read(logFileName);
            } catch (e) {
                // File doesn't exist, that's fine
            }

            // Check if rotation is needed - use string length as approximation for byte size
            const currentSize = currentContent.length;
            if (currentSize + logLine.length > this.config.maxFileSize) {
                await this.rotateLogFiles();
                currentContent = ''; // Start fresh after rotation
            }

            // Append to current log file
            const newContent = currentContent + logLine;
            this.ns.write(logFileName, newContent, 'w');

        } catch (error) {
            // If file logging fails, log to terminal only for critical issues
            // Don't spam the console with file write errors
            if (entry.level >= LogLevel.ERROR) {
                this.ns.tprint(`Logger: File write failed for ${entry.levelName} message: ${error}`);
            }
        }
    }

    private async rotateLogFiles(): Promise<void> {
        try {
            // Move existing logs: botnet.log.txt.4 -> botnet.log.txt.5, etc.
            for (let i = this.config.maxFiles - 1; i > 0; i--) {
                const oldFile = i === 1 ? 'botnet.log.txt' : `botnet.log.txt.${i}`;
                const newFile = `botnet.log.txt.${i + 1}`;
                
                try {
                    const content = this.ns.read(oldFile);
                    if (content) {
                        this.ns.write(newFile, content, 'w');
                    }
                } catch (e) {
                    // File doesn't exist, continue
                }
            }

            // Clear the current log file
            this.ns.write('botnet.log.txt', '', 'w');

        } catch (error) {
            if (this.config.enableConsole) {
                this.ns.print(`Logger Error: Failed to rotate log files: ${error}`);
            }
        }
    }

    private async log(level: LogLevel, message: string): Promise<void> {
        if (!this.shouldLog(level)) return;

        const entry = this.createLogEntry(level, message);
        const formattedMessage = this.formatLogEntry(entry);

        // Console output - Only for debug mode, and use tprint for important messages
        if (this.config.enableConsole) {
            switch (level) {
                case LogLevel.TRACE:
                case LogLevel.DEBUG:
                    // Debug messages to terminal when debugging
                    this.ns.tprint(`🔍 ${formattedMessage}`);
                    break;
                case LogLevel.INFO:
                    // Info messages to terminal
                    this.ns.tprint(`ℹ️  ${formattedMessage}`);
                    break;
                case LogLevel.WARN:
                    // Warnings go to terminal to ensure visibility
                    this.ns.tprint(`⚠️  ${formattedMessage}`);
                    break;
                case LogLevel.ERROR:
                case LogLevel.CRITICAL:
                    // Errors go to terminal to ensure visibility
                    this.ns.tprint(`❌ ${formattedMessage}`);
                    break;
            }
        }

        // File output
        await this.writeToFile(entry);
    }

    // Public logging methods
    async trace(message: string): Promise<void> {
        await this.log(LogLevel.TRACE, message);
    }

    async debug(message: string): Promise<void> {
        await this.log(LogLevel.DEBUG, message);
    }

    async info(message: string): Promise<void> {
        await this.log(LogLevel.INFO, message);
    }

    async warn(message: string): Promise<void> {
        await this.log(LogLevel.WARN, message);
    }

    async error(message: string): Promise<void> {
        await this.log(LogLevel.ERROR, message);
    }

    async critical(message: string): Promise<void> {
        await this.log(LogLevel.CRITICAL, message);
    }

    // Utility methods
    setLevel(level: LogLevel): void {
        this.config.level = level;
    }

    getLevel(): LogLevel {
        return this.config.level;
    }

    enableConsole(enable: boolean): void {
        this.config.enableConsole = enable;
    }

    enableFile(enable: boolean): void {
        this.config.enableFile = enable;
    }

    // Helper method to read recent logs
    getRecentLogs(lines: number = 50): string[] {
        try {
            const content = this.ns.read('botnet.log.txt');
            if (!content) return [];
            
            const logLines = content.split('\n').filter(line => line.trim());
            return logLines.slice(-lines);
        } catch (error) {
            return [`Error reading logs: ${error}`];
        }
    }

    // Helper method to clear all logs
    clearLogs(): void {
        try {
            this.ns.write('botnet.log.txt', '', 'w');
            for (let i = 1; i <= this.config.maxFiles; i++) {
                this.ns.write(`botnet.log.txt.${i}`, '', 'w');
            }
            if (this.config.enableConsole) {
                this.ns.print('All log files cleared');
            }
        } catch (error) {
            if (this.config.enableConsole) {
                this.ns.print(`Error clearing logs: ${error}`);
            }
        }
    }
}