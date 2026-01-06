import { NS } from "@ns";
import { Logger } from "/lib/logger";

export type ConfigValueType = "string" | "number" | "boolean" | "array" | "object";

export interface ConfigSchemaEntry {
  default: unknown;
  type: ConfigValueType;
  description: string;
  required?: boolean;
}

export interface ConfigSchema {
  [key: string]: ConfigSchemaEntry;
}

export class ConfigManager {
  private ns: NS;
  private logger: Logger;
  private schema: ConfigSchema;
  private values: Map<string, unknown> = new Map();
  private scriptName: string;
  private configFilePath: string;

  constructor(ns: NS, logger: Logger, scriptName: string, schema: ConfigSchema) {
    this.ns = ns;
    this.logger = logger;
    this.scriptName = scriptName;
    this.schema = schema;
    this.configFilePath = `${scriptName}.config.txt`;
  }

  async load(cliArgs?: unknown[]): Promise<void> {
    // Step 1: Load defaults from schema
    this.loadDefaults();
    await this.logger.debug(`Loaded ${this.values.size} default config values`);

    // Step 2: Override with config file
    const fileLoaded = await this.loadFromFile();
    if (fileLoaded) {
      await this.logger.debug(`Loaded config from ${this.configFilePath}`);
    }

    // Step 3: Override with CLI args
    if (cliArgs && cliArgs.length > 0) {
      this.loadFromCliArgs(cliArgs);
      await this.logger.debug(`Applied ${cliArgs.length / 2} CLI arguments`);
    }

    // Validate all values
    this.validate();
  }

  async save(): Promise<void> {
    try {
      const changedValues = this.getChangedValues();
      
      if (Object.keys(changedValues).length === 0) {
        await this.logger.debug("No config changes to save");
        return;
      }

      const configJson = JSON.stringify(changedValues, null, 2);
      this.ns.write(this.configFilePath, configJson, "w");
      
      await this.logger.info(`Saved ${Object.keys(changedValues).length} config values to ${this.configFilePath}`);
    } catch (error) {
      await this.logger.error(`Failed to save config: ${error}`);
      throw error;
    }
  }

  get<T>(key: string): T {
    if (!this.values.has(key)) {
      throw new Error(`Config key "${key}" not found in schema`);
    }
    return this.values.get(key) as T;
  }

  set(key: string, value: unknown): void {
    if (!this.schema[key]) {
      throw new Error(`Config key "${key}" not found in schema`);
    }

    // Type validation
    const expectedType = this.schema[key].type;
    const actualType = this.getValueType(value);

    if (actualType !== expectedType) {
      throw new Error(
        `Config key "${key}" expects type ${expectedType}, got ${actualType}`
      );
    }

    this.values.set(key, value);
  }

  has(key: string): boolean {
    return this.values.has(key);
  }

  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of this.values.entries()) {
      result[key] = value;
    }
    return result;
  }

  getSchema(): ConfigSchema {
    return { ...this.schema };
  }

  private loadDefaults(): void {
    for (const [key, entry] of Object.entries(this.schema)) {
      this.values.set(key, entry.default);
    }
  }

  private async loadFromFile(): Promise<boolean> {
    try {
      const fileContent = this.ns.read(this.configFilePath);
      
      if (!fileContent) {
        return false;
      }

      const savedConfig = JSON.parse(fileContent) as Record<string, unknown>;
      
      for (const [key, value] of Object.entries(savedConfig)) {
        if (this.schema[key]) {
          this.values.set(key, value);
        } else {
          await this.logger.warn(`Unknown config key in file: ${key}`);
        }
      }

      return true;
    } catch (error) {
      await this.logger.warn(`Failed to load config file: ${error}`);
      return false;
    }
  }

  private loadFromCliArgs(args: unknown[]): void {
    // Parse CLI args in format: --key value --key2 value2
    for (let i = 0; i < args.length; i += 2) {
      const arg = args[i];
      
      if (typeof arg !== "string" || !arg.startsWith("--")) {
        continue;
      }

      const key = arg.slice(2); // Remove "--" prefix
      const value = args[i + 1];

      if (this.schema[key]) {
        // Convert value to appropriate type
        const schemaType = this.schema[key].type;
        const convertedValue = this.convertValue(value, schemaType);
        this.values.set(key, convertedValue);
      }
    }
  }

  private convertValue(value: unknown, targetType: ConfigValueType): unknown {
    switch (targetType) {
      case "string":
        return String(value);
      case "number":
        return Number(value);
      case "boolean":
        if (typeof value === "string") {
          return value.toLowerCase() === "true";
        }
        return Boolean(value);
      case "array":
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            return [value];
          }
        }
        return Array.isArray(value) ? value : [value];
      case "object":
        if (typeof value === "string") {
          return JSON.parse(value);
        }
        return value;
      default:
        return value;
    }
  }

  private getValueType(value: unknown): ConfigValueType {
    if (Array.isArray(value)) return "array";
    if (value === null || value === undefined) return "object";
    
    const type = typeof value;
    if (type === "string" || type === "number" || type === "boolean") {
      return type;
    }
    
    return "object";
  }

  private validate(): void {
    for (const [key, entry] of Object.entries(this.schema)) {
      const value = this.values.get(key);

      // Check required fields
      if (entry.required && (value === null || value === undefined)) {
        throw new Error(`Required config key "${key}" is missing`);
      }

      // Type validation
      const expectedType = entry.type;
      const actualType = this.getValueType(value);

      if (actualType !== expectedType) {
        throw new Error(
          `Config key "${key}" expects type ${expectedType}, got ${actualType}`
        );
      }
    }
  }

  private getChangedValues(): Record<string, unknown> {
    const changed: Record<string, unknown> = {};

    for (const [key, value] of this.values.entries()) {
      const defaultValue = this.schema[key].default;
      
      // Compare values (handle JSON comparison for objects/arrays)
      const valueJson = JSON.stringify(value);
      const defaultJson = JSON.stringify(defaultValue);

      if (valueJson !== defaultJson) {
        changed[key] = value;
      }
    }

    return changed;
  }

  async clear(): Promise<void> {
    this.loadDefaults();
    await this.logger.info("Reset config to defaults");
  }

  async delete(): Promise<void> {
    try {
      this.ns.rm(this.configFilePath);
      this.loadDefaults();
      await this.logger.info(`Deleted config file: ${this.configFilePath}`);
    } catch (error) {
      await this.logger.warn(`Failed to delete config file: ${error}`);
    }
  }

  toString(): string {
    const lines: string[] = [];
    lines.push(`Config for ${this.scriptName}:`);
    
    for (const [key, value] of this.values.entries()) {
      const entry = this.schema[key];
      const isChanged = JSON.stringify(value) !== JSON.stringify(entry.default);
      const marker = isChanged ? "*" : " ";
      lines.push(`  ${marker} ${key}: ${JSON.stringify(value)} (${entry.description})`);
    }
    
    return lines.join("\n");
  }
}

// Helper function to create config manager
export function createConfigManager(
  ns: NS,
  logger: Logger,
  scriptName: string,
  schema: ConfigSchema
): ConfigManager {
  return new ConfigManager(ns, logger, scriptName, schema);
}
