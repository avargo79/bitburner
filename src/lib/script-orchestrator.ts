import { NS } from "@ns";
import { BitnodeDetector } from "/lib/bitnode-detector";
import { Prerequisites, AnyRequirement } from "/lib/prerequisites";
import { Logger } from "/lib/logger";

export type LaunchMode = "parallel" | "sequential";

export interface ScriptConfig {
  name: string;
  args?: (string | number | boolean)[];
  threads?: number;
  shouldRun?: () => boolean | Promise<boolean>;
  requirements?: AnyRequirement[];
  minHomeRam?: number;
  launchMode: LaunchMode;
  onComplete?: string; // Script to run after this completes
  onCompleteArgs?: (string | number | boolean)[];
  retryOnFailure?: boolean;
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
}

export interface LaunchResult {
  pid: number;
  scriptName: string;
  success: boolean;
  error?: string;
}

export class ScriptOrchestrator {
  private ns: NS;
  private detector: BitnodeDetector;
  private prerequisites: Prerequisites;
  private logger: Logger;
  private runningScripts: Map<string, number> = new Map(); // scriptName -> PID

  constructor(ns: NS, detector: BitnodeDetector, prerequisites: Prerequisites, logger: Logger) {
    this.ns = ns;
    this.detector = detector;
    this.prerequisites = prerequisites;
    this.logger = logger;
  }

  async launchScript(config: ScriptConfig): Promise<LaunchResult> {
    const scriptName = config.name;

    // Check if script already running
    if (this.isScriptRunning(scriptName)) {
      await this.logger.debug(`Script ${scriptName} already running, skipping`);
      return {
        pid: this.runningScripts.get(scriptName)!,
        scriptName,
        success: true,
      };
    }

    // Check prerequisites
    if (config.requirements && config.requirements.length > 0) {
      const canRun = await this.prerequisites.checkAll(config.requirements);
      if (!canRun) {
        const reasons = await this.prerequisites.getAllFailureReasons(config.requirements);
        const error = `Prerequisites not met for ${scriptName}: ${reasons.join(", ")}`;
        await this.logger.warn(error);
        return { pid: 0, scriptName, success: false, error };
      }
    }

    // Check custom shouldRun function
    if (config.shouldRun) {
      const shouldRun = await config.shouldRun();
      if (!shouldRun) {
        const error = `shouldRun() returned false for ${scriptName}`;
        await this.logger.debug(error);
        return { pid: 0, scriptName, success: false, error };
      }
    }

    // Check RAM requirements
    if (config.minHomeRam) {
      const homeRam = this.ns.getServerMaxRam("home");
      if (homeRam < config.minHomeRam) {
        const error = `Insufficient RAM for ${scriptName}: requires ${config.minHomeRam}GB, have ${homeRam}GB`;
        await this.logger.warn(error);
        return { pid: 0, scriptName, success: false, error };
      }
    }

    // Attempt to launch with retries
    const maxAttempts = config.retryOnFailure ? (config.retryAttempts ?? 3) : 1;
    const retryDelay = config.retryDelay ?? 5000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const threads = config.threads ?? 1;
        const args = config.args ?? [];
        
        const pid = this.ns.exec(scriptName, "home", threads, ...args);
        
        if (pid > 0) {
          this.runningScripts.set(scriptName, pid);
          await this.logger.info(`Launched ${scriptName} (PID: ${pid})`);
          
          // If onComplete specified, wait for completion and launch next
          if (config.onComplete) {
            await this.waitForCompletion(pid);
            this.runningScripts.delete(scriptName);
            
            const nextConfig: ScriptConfig = {
              name: config.onComplete,
              args: config.onCompleteArgs ?? [],
              launchMode: "sequential",
            };
            
            return await this.launchScript(nextConfig);
          }
          
          return { pid, scriptName, success: true };
        } else {
          const error = `Failed to launch ${scriptName} (PID: 0)`;
          
          if (attempt < maxAttempts) {
            await this.logger.warn(`${error}, retrying in ${retryDelay}ms (${attempt}/${maxAttempts})`);
            await this.ns.sleep(retryDelay);
          } else {
            await this.logger.error(error);
            return { pid: 0, scriptName, success: false, error };
          }
        }
      } catch (error) {
        const errorMsg = `Exception launching ${scriptName}: ${error}`;
        
        if (attempt < maxAttempts) {
          await this.logger.warn(`${errorMsg}, retrying in ${retryDelay}ms (${attempt}/${maxAttempts})`);
          await this.ns.sleep(retryDelay);
        } else {
          await this.logger.error(errorMsg);
          return { pid: 0, scriptName, success: false, error: errorMsg };
        }
      }
    }

    return { 
      pid: 0, 
      scriptName, 
      success: false, 
      error: `Failed after ${maxAttempts} attempts` 
    };
  }

  async launchScripts(configs: ScriptConfig[]): Promise<LaunchResult[]> {
    const results: LaunchResult[] = [];

    // Separate parallel and sequential scripts
    const parallelScripts = configs.filter(c => c.launchMode === "parallel");
    const sequentialScripts = configs.filter(c => c.launchMode === "sequential");

    // Launch parallel scripts simultaneously
    if (parallelScripts.length > 0) {
      await this.logger.info(`Launching ${parallelScripts.length} scripts in parallel`);
      const parallelResults = await Promise.all(
        parallelScripts.map(config => this.launchScript(config))
      );
      results.push(...parallelResults);
    }

    // Launch sequential scripts one by one
    if (sequentialScripts.length > 0) {
      await this.logger.info(`Launching ${sequentialScripts.length} scripts sequentially`);
      for (const config of sequentialScripts) {
        const result = await this.launchScript(config);
        results.push(result);
        
        // If script failed and has no retry, stop sequential execution
        if (!result.success && !config.retryOnFailure) {
          await this.logger.error(`Sequential script ${config.name} failed, stopping execution`);
          break;
        }
      }
    }

    return results;
  }

  async waitForCompletion(pid: number, checkInterval: number = 1000): Promise<void> {
    while (this.ns.isRunning(pid)) {
      await this.ns.sleep(checkInterval);
    }
  }

  isScriptRunning(scriptName: string, hostname: string = "home"): boolean {
    return this.ns.isRunning(scriptName, hostname);
  }

  async killScript(scriptName: string, hostname: string = "home"): Promise<boolean> {
    const killed = this.ns.kill(scriptName, hostname);
    
    if (killed) {
      this.runningScripts.delete(scriptName);
      await this.logger.info(`Killed script: ${scriptName}`);
    }
    
    return killed;
  }

  async killAllScripts(): Promise<number> {
    let killedCount = 0;
    
    for (const [scriptName, pid] of this.runningScripts.entries()) {
      if (await this.killScript(scriptName)) {
        killedCount++;
      }
    }
    
    this.runningScripts.clear();
    return killedCount;
  }

  getRunningScripts(): Map<string, number> {
    return new Map(this.runningScripts);
  }

  getPid(scriptName: string): number | undefined {
    return this.runningScripts.get(scriptName);
  }

  async refreshRunningScripts(): Promise<void> {
    // Remove scripts that are no longer running
    for (const [scriptName, pid] of this.runningScripts.entries()) {
      if (!this.ns.isRunning(pid)) {
        this.runningScripts.delete(scriptName);
        await this.logger.debug(`Script ${scriptName} (PID: ${pid}) no longer running`);
      }
    }
  }
}
