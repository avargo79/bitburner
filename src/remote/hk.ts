import { NS } from '@ns';

/**
 * Hack script with event publishing (V3)
 * RAM-optimized name to avoid static analysis penalties
 */

async function publishEvent(ns: NS, type: string, batchId: string, result: any, threads: number): Promise<void> {
  try {
    const event = `${type}|${batchId}|${result}|${threads}`;
    ns.getPortHandle(20).write(event);
  } catch (error) {
    ns.print(`Event publish failed: ${error}`);
  }
}

export async function main(ns: NS): Promise<void> {
  const batchId = ns.args[0] as string;
  const delayUntil = ns.args[1] as number || 0;
  const threads = ns.getRunningScript()?.threads || 1;
  
  // Extract target server from batch ID (format: server-timestamp)
  // Split by '-' and take all parts except the last one (timestamp)
  const parts = batchId.split('-');
  const target = parts.slice(0, -1).join('-');
  
  // Handle timing delay like existing scripts
  const delayFor = Math.max(0, delayUntil - Date.now());
  if (delayFor > 0) {
    await ns.sleep(delayFor);
  }
  
  const startTime = Date.now();
  
  try {
    // Perform hack operation on the actual target server
    const result = await ns.hack(target);
    const actualGain = result || 0;
    
    // Publish success event with batchId for proper tracking
    await publishEvent(ns, 'hack_done', batchId, actualGain, threads);
    
    ns.print(`Hack completed: ${target} -> $${actualGain.toLocaleString()}`);
    
  } catch (error) {
    // Publish failure event with batchId for proper tracking
    await publishEvent(ns, 'hack_failed', batchId, (error as Error).message || 'Unknown error', threads);
    
    ns.print(`Hack failed: ${target} -> ${error}`);
  }
}