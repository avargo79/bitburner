import { NS } from '@ns';

/**
 * Share script with continuous sharing and event publishing
 * Blocking implementation with while(true) loop
 * RAM-optimized name 'sh' to avoid static analysis penalties
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
  const batchId = ns.args[0] as string || 'share-unknown';
  const sharePercentage = ns.args[1] as number || 1.0; // 100% sharing by default
  const debug = ns.args[2] as boolean || false; // Debug mode flag
  const threads = ns.getRunningScript()?.threads || 1;
  
  const hostname = ns.getHostname();
  let totalShareTime = 0;
  let shareStartTime = Date.now();
  let shareCount = 0;
  
  // Publish startup event
  await publishEvent(ns, 'share_started', batchId, sharePercentage, threads);
  ns.print(`SHARE START: ${hostname} -> ${(sharePercentage * 100).toFixed(1)}% (${threads} threads)`);
  
  if (debug) {
    ns.print(`DEBUG SHARE: Batch ID: ${batchId}, Hostname: ${hostname}, Threads: ${threads}`);
    ns.print(`DEBUG SHARE: Server RAM: ${ns.getServerMaxRam(hostname)}GB, Used: ${ns.getServerUsedRam(hostname)}GB`);
  }
  
  // Register cleanup function for graceful shutdown
  const cleanup = async () => {
    const shareEndTime = Date.now();
    totalShareTime += (shareEndTime - shareStartTime);
    
    // Publish final stats
    await publishEvent(ns, 'share_stopped', batchId, {
      totalTimeMs: totalShareTime,
      hostname: hostname,
      threads: threads,
      shareCount: shareCount
    }, threads);
    
    ns.print(`SHARE STOP: ${hostname} -> Time: ${(totalShareTime / 1000).toFixed(1)}s, Count: ${shareCount}`);
    
    if (debug) {
      ns.print(`DEBUG SHARE: Final cleanup completed for ${hostname}`);
    }
  };
  
  // Setup atexit cleanup
  ns.atExit(cleanup);
  
  try {
    // Continuous sharing loop
    while (true) {
      if (debug && shareCount % 10 === 0) { // Debug every 10th share to avoid spam
        ns.print(`DEBUG SHARE: ${hostname} - Starting share #${shareCount + 1}`);
      }
      
      // Start sharing (this will block until interrupted)
      const shareResult = await ns.share();
      shareCount++;
      
      // If we reach here, sharing was interrupted - track the time
      const now = Date.now();
      totalShareTime += (now - shareStartTime);
      
      if (debug) {
        ns.print(`DEBUG SHARE: ${hostname} - Share completed #${shareCount}, Result: ${shareResult}`);
      }
      
      // Publish periodic update every 10 shares
      if (shareCount % 10 === 0) {
        await publishEvent(ns, 'share_update', batchId, {
          totalTimeMs: totalShareTime,
          hostname: hostname,
          lastUpdateMs: now,
          shareCount: shareCount
        }, threads);
        
        ns.print(`SHARE UPDATE: ${hostname} -> Shares: ${shareCount}, Time: ${(totalShareTime / 1000).toFixed(1)}s`);
      }
      
      // Brief pause before resuming (allows for script termination)
      await ns.sleep(100);
      shareStartTime = Date.now();
      
      // Resume sharing
      if (debug && shareCount % 10 === 0) {
        ns.print(`DEBUG SHARE: ${hostname} - Resuming after share #${shareCount}`);
      }
    }
  } catch (error) {
    // Handle any errors during sharing
    await publishEvent(ns, 'share_error', batchId, (error as Error).message || 'Unknown error', threads);
    ns.print(`SHARE ERROR: ${hostname} -> ${error}`);
    
    if (debug) {
      ns.print(`DEBUG SHARE: Error details - ${error}, Stack: ${(error as Error).stack}`);
    }
  }
}