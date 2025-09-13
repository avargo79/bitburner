import { NS } from '@ns';

/**
 * Distributed server rooting script
 * Attempts to root a server using all available exploit tools + nuke
 */

async function publishEvent(ns: NS, type: string, target: string, result: any): Promise<void> {
  try {
    const event = `${type}|${target}|${result}`;
    ns.getPortHandle(21).write(event);
  } catch (error) {
    ns.print(`Event publish failed: ${error}`);
  }
}

function getRootStatus(ns: NS, target: string): { hasRoot: boolean; portsOpen: number; portsRequired: number } {
  return {
    hasRoot: ns.hasRootAccess(target),
    portsOpen: ns.getServerNumPortsRequired(target) - (ns.getServer(target).openPortCount || 0),
    portsRequired: ns.getServerNumPortsRequired(target)
  };
}

function attemptPortHacks(ns: NS, target: string): number {
  let portsOpened = 0;
  
  // Try all available port-opening programs
  try { ns.brutessh(target); portsOpened++; } catch {}
  try { ns.ftpcrack(target); portsOpened++; } catch {}
  try { ns.relaysmtp(target); portsOpened++; } catch {}
  try { ns.httpworm(target); portsOpened++; } catch {}
  try { ns.sqlinject(target); portsOpened++; } catch {}
  
  return portsOpened;
}

export async function main(ns: NS): Promise<void> {
  const target = ns.args[0] as string;
  
  if (!target) {
    ns.print("ERROR: No target server specified");
    return;
  }
  
  try {
    const initialStatus = getRootStatus(ns, target);
    
    // Skip if already rooted
    if (initialStatus.hasRoot) {
      await publishEvent(ns, 'root_skip', target, 'already_rooted');
      ns.print(`Root skipped: ${target} (already rooted)`);
      return;
    }
    
    // Attempt port hacking
    const portsOpened = attemptPortHacks(ns, target);
    const finalStatus = getRootStatus(ns, target);
    
    // Check if we have enough ports open
    if (portsOpened < finalStatus.portsRequired) {
      await publishEvent(ns, 'root_failed', target, `insufficient_ports:${portsOpened}/${finalStatus.portsRequired}`);
      ns.print(`Root failed: ${target} -> Need ${finalStatus.portsRequired} ports, only opened ${portsOpened}`);
      return;
    }
    
    // Attempt nuke
    ns.nuke(target);
    
    // Verify root access gained
    if (ns.hasRootAccess(target)) {
      await publishEvent(ns, 'root_success', target, `ports:${portsOpened}`);
      ns.print(`Root success: ${target} -> Opened ${portsOpened} ports + nuked`);
    } else {
      await publishEvent(ns, 'root_failed', target, 'nuke_failed');
      ns.print(`Root failed: ${target} -> Nuke failed after opening ports`);
    }
    
  } catch (error) {
    await publishEvent(ns, 'root_error', target, (error as Error).message || 'Unknown error');
    ns.print(`Root error: ${target} -> ${error}`);
  }
}