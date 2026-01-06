import { NS } from "@ns";
import { BitnodeConfig, ScriptPriority } from "/lib/bitnode-config";

/**
 * Script Launcher
 * 
 * Priority-based script launching system with prerequisite validation
 */

export interface LaunchStatus {
  script: string;
  priority: number;
  status: 'running' | 'waiting' | 'skipped' | 'failed';
  reason?: string;
  pid?: number;
}

interface ScriptLauncher {
  scriptPath: string;
  priority: number;
  checkPrereq: (ns: NS) => { ready: boolean; reason?: string };
}

/**
 * Launch scripts in priority order with prerequisite checking
 * @param {NS} ns - Netscript API
 * @param {BitnodeConfig} config - Bitnode configuration
 * @param {{dryRun?: boolean, force?: boolean, timeout?: number}} options - Launch options
 * @returns {Promise<LaunchStatus[]>} Array of launch statuses
 */
export async function launchScripts(
  ns: NS,
  config: BitnodeConfig,
  options?: {
    dryRun?: boolean;
    force?: boolean;
    timeout?: number;
  }
): Promise<LaunchStatus[]> {
  const statuses: LaunchStatus[] = [];
  const { dryRun = false, force = false, timeout = 300000 } = options ?? {};
  
  // Map script priorities to launcher configurations
  const launchers: ScriptLauncher[] = config.scriptPriorities
    .map(sp => ({
      scriptPath: `/src/${sp.name.replace('.ts', '.js')}`,
      priority: sp.priority,
      checkPrereq: getLauncherForScript(sp.name),
    }))
    .sort((a, b) => a.priority - b.priority); // Sort by priority (1=highest)
  
  // Launch ready scripts immediately
  for (const launcher of launchers) {
    const scriptName = launcher.scriptPath.split('/').pop() ?? launcher.scriptPath;
    
    // Check if already running
    if (ns.isRunning(launcher.scriptPath, 'home')) {
      statuses.push({
        script: scriptName,
        priority: launcher.priority,
        status: 'running',
        reason: 'Already running',
      });
      continue;
    }
    
    // Check prerequisites (unless forced)
    if (!force) {
      const prereqCheck = launcher.checkPrereq(ns);
      
      if (!prereqCheck.ready) {
        statuses.push({
          script: scriptName,
          priority: launcher.priority,
          status: 'skipped',
          reason: prereqCheck.reason,
        });
        continue;
      }
    }
    
    // Dry run - just report what would happen
    if (dryRun) {
      statuses.push({
        script: scriptName,
        priority: launcher.priority,
        status: 'waiting',
        reason: 'Dry run - would launch',
      });
      continue;
    }
    
    // Attempt to launch script
    try {
      const pid = ns.exec(launcher.scriptPath, 'home');
      
      if (pid === 0) {
        statuses.push({
          script: scriptName,
          priority: launcher.priority,
          status: 'failed',
          reason: 'Failed to start (insufficient RAM or script error)',
        });
      } else {
        statuses.push({
          script: scriptName,
          priority: launcher.priority,
          status: 'running',
          pid,
        });
        
        // Small delay between launches
        await ns.sleep(100);
      }
    } catch (error) {
      statuses.push({
        script: scriptName,
        priority: launcher.priority,
        status: 'failed',
        reason: `Launch error: ${error}`,
      });
    }
  }
  
  return statuses;
}

/**
 * Get prerequisite checker for a script
 */
function getLauncherForScript(scriptName: string): (ns: NS) => { ready: boolean; reason?: string } {
  // Map script names to their prerequisite checkers
  // These must be imported dynamically due to circular dependencies
  
  return (ns: NS) => {
    try {
      // Try to import and call the checkPrerequisites function from the script
      const scriptPath = `/src/${scriptName}`;
      
      // For now, we'll use a simpler approach without dynamic imports
      // Each script exports checkPrerequisites which we can call
      
      // contracts.ts - always ready
      if (scriptName === 'contracts.ts') {
        return { ready: true };
      }
      
      // sleeve.ts - needs SF10 or BN10
      if (scriptName === 'sleeve.ts' || scriptName === 'sleeve-crime.ts' || scriptName === 'sleeve-bladeburner.ts' || scriptName === 'sleeve-hacking.ts') {
        const resetInfo = ns.getResetInfo();
        const currentBN = resetInfo.currentNode;
        const sourceFiles = ns.singularity.getOwnedSourceFiles();
        const sf10Level = sourceFiles.find((sf: any) => sf.n === 10)?.lvl ?? 0;
        
        if (currentBN !== 10 && sf10Level === 0) {
          return { ready: false, reason: "Sleeves unavailable (need SF10 or BN10)" };
        }
        
        try {
          const sleeveCount = ns.sleeve.getNumSleeves();
          if (sleeveCount === 0) {
            return { ready: false, reason: "No sleeves available" };
          }
        } catch {
          return { ready: false, reason: "Sleeve API unavailable" };
        }
        
        return { ready: true };
      }
      
      // gangs.ts - needs SF2 or BN2 and karma
      if (scriptName === 'gangs.ts') {
        const player = ns.getPlayer();
        const resetInfo = ns.getResetInfo();
        const currentBN = resetInfo.currentNode;
        const sourceFiles = ns.singularity.getOwnedSourceFiles();
        const sf2Level = sourceFiles.find((sf: any) => sf.n === 2)?.lvl ?? 0;
        
        if (!ns.gang) {
          if (currentBN !== 2 && sf2Level === 0) {
            return { ready: false, reason: "Gang API unavailable (need SF2 or BN2)" };
          }
          return { ready: false, reason: "Gang API unavailable" };
        }
        
        try {
          if (ns.gang.inGang()) {
            return { ready: true };
          }
        } catch {
          return { ready: false, reason: "Gang API error" };
        }
        
        if (player.karma > -54000) {
          return { ready: false, reason: `Insufficient karma (need -54000, have ${Math.floor(player.karma)})` };
        }
        
        return { ready: true };
      }
      
      // bladeburner.ts - needs SF7 or BN7 and combat stats
      if (scriptName === 'bladeburner.ts') {
        const player = ns.getPlayer();
        const resetInfo = ns.getResetInfo();
        const currentBN = resetInfo.currentNode;
        const sourceFiles = ns.singularity.getOwnedSourceFiles();
        const sf7Level = sourceFiles.find((sf: any) => sf.n === 7)?.lvl ?? 0;
        
        if (!ns.bladeburner) {
          if (currentBN !== 7 && sf7Level === 0) {
            return { ready: false, reason: "Bladeburner API unavailable (need SF7 or BN7)" };
          }
          return { ready: false, reason: "Bladeburner API unavailable" };
        }
        
        const minStat = Math.min(
          player.skills.strength,
          player.skills.defense,
          player.skills.dexterity,
          player.skills.agility
        );
        
        if (minStat < 100) {
          return { ready: false, reason: `Low combat stats (min ${minStat}/100)` };
        }
        
        return { ready: true };
      }
      
      // botnet.ts - needs RAM
      if (scriptName === 'botnet.ts') {
        const homeServer = ns.getServer('home');
        if (homeServer.maxRam < 64) {
          return { ready: false, reason: `Insufficient home RAM (need 64GB, have ${homeServer.maxRam}GB)` };
        }
        return { ready: true };
      }
      
      // hacknet.ts - needs money
      if (scriptName === 'hacknet.ts') {
        if (!ns.hacknet) {
          return { ready: false, reason: "Hacknet API unavailable" };
        }
        if (ns.getPlayer().money < 10000) {
          return { ready: false, reason: "Insufficient money (need $10k)" };
        }
        return { ready: true };
      }
      
      // server-manager.ts, stocks.ts, corp.ts, casino-bot.ts - always ready if APIs exist
      if (scriptName === 'server-manager.ts') {
        return { ready: true };
      }
      
      if (scriptName === 'casino-bot.ts') {
        // Casino requires Singularity API
        if (!ns.singularity) {
          return { ready: false, reason: "Casino needs Singularity API" };
        }
        return { ready: true };
      }
      
      if (scriptName === 'stocks.ts') {
        if (!ns.stock) {
          return { ready: false, reason: "Stock market API unavailable" };
        }
        return { ready: true };
      }
      
      if (scriptName === 'corp.ts') {
        if (!ns.corporation) {
          return { ready: false, reason: "Corporation API unavailable" };
        }
        return { ready: true };
      }
      
      // Unknown script - assume ready
      return { ready: true };
      
    } catch (error) {
      return { ready: false, reason: `Prerequisite check error: ${error}` };
    }
  };
}

/**
 * Display launch status dashboard
 * @param {NS} ns - Netscript API
 * @param {LaunchStatus[]} statuses - Array of launch statuses to display
 */
export function displayLaunchStatus(ns: NS, statuses: LaunchStatus[]): void {
  ns.tprint("=".repeat(60));
  ns.tprint("SCRIPT LAUNCH STATUS");
  ns.tprint("=".repeat(60));
  
  const running = statuses.filter(s => s.status === 'running');
  const waiting = statuses.filter(s => s.status === 'waiting');
  const skipped = statuses.filter(s => s.status === 'skipped');
  const failed = statuses.filter(s => s.status === 'failed');
  
  ns.tprint(`✓ Running: ${running.length}`);
  ns.tprint(`⧗ Waiting: ${waiting.length}`);
  ns.tprint(`⊘ Skipped: ${skipped.length}`);
  ns.tprint(`✗ Failed: ${failed.length}`);
  ns.tprint("");
  
  // Show details for each status
  for (const status of statuses) {
    const icon = 
      status.status === 'running' ? '✓' :
      status.status === 'waiting' ? '⧗' :
      status.status === 'skipped' ? '⊘' :
      '✗';
    
    const pidInfo = status.pid ? ` (PID: ${status.pid})` : '';
    const reasonInfo = status.reason ? ` - ${status.reason}` : '';
    
    ns.tprint(`[${icon}] [P${status.priority}] ${status.script}${pidInfo}${reasonInfo}`);
  }
  
  ns.tprint("=".repeat(60));
}
