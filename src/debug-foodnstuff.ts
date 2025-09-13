import { NS } from '@ns';

export async function main(ns: NS): Promise<void> {
  const target = 'foodnstuff';
  
  ns.tprint(`\n=== FOODNSTUFF ANALYSIS ===`);
  
  try {
    const server = ns.getServer(target);
    
    ns.tprint(`📊 Server Status:`);
    ns.tprint(`   Hostname: ${server.hostname}`);
    ns.tprint(`   Has Root: ${server.hasAdminRights}`);
    ns.tprint(`   Required Ports: ${server.numOpenPortsRequired}`);
    
    ns.tprint(`\n🔒 Security:`);
    ns.tprint(`   Current: ${server.hackDifficulty?.toFixed(2)}`);
    ns.tprint(`   Minimum: ${server.minDifficulty?.toFixed(2)}`);
    ns.tprint(`   Needs Weaken: ${(server.hackDifficulty || 0) - (server.minDifficulty || 0) > 0.1 ? 'YES' : 'NO'}`);
    
    ns.tprint(`\n💰 Money:`);
    ns.tprint(`   Current: $${ns.formatNumber(server.moneyAvailable || 0)}`);
    ns.tprint(`   Maximum: $${ns.formatNumber(server.moneyMax || 0)}`);
    ns.tprint(`   Fill %: ${((server.moneyAvailable || 0) / (server.moneyMax || 0) * 100).toFixed(1)}%`);
    ns.tprint(`   Needs Grow: ${(server.moneyAvailable || 0) < (server.moneyMax || 0) * 0.95 ? 'YES' : 'NO'}`);
    
    if ((server.moneyAvailable || 0) < (server.moneyMax || 0) * 0.95) {
      const growthNeeded = (server.moneyMax || 0) / Math.max(1, server.moneyAvailable || 1);
      ns.tprint(`   Growth Needed: ${growthNeeded.toFixed(1)}x multiplier`);
      
      try {
        const threadsNeeded = ns.growthAnalyze(target, growthNeeded);
        ns.tprint(`   Threads Needed: ${Math.ceil(threadsNeeded).toLocaleString()}`);
        
        const homeRam = ns.getServerMaxRam('home');
        const ramPerThread = 1.75; // Grow script RAM cost
        const maxThreadsHome = Math.floor(homeRam / ramPerThread);
        
        ns.tprint(`\n🖥️ RAM Analysis:`);
        ns.tprint(`   Home RAM: ${homeRam.toFixed(0)}GB`);
        ns.tprint(`   Max Grow Threads (Home): ${maxThreadsHome.toLocaleString()}`);
        ns.tprint(`   Batches Needed: ${Math.ceil(threadsNeeded / maxThreadsHome)}`);
        
        // Check botnet capacity
        const allServers = ['home', ...ns.getPurchasedServers()];
        let totalRam = 0;
        let serverCount = 0;
        
        for (const hostname of allServers) {
          try {
            if (ns.hasRootAccess(hostname)) {
              const ram = ns.getServerMaxRam(hostname);
              totalRam += ram;
              serverCount++;
            }
          } catch (error) {
            // Skip invalid servers
          }
        }
        
        const totalThreads = Math.floor(totalRam / ramPerThread);
        ns.tprint(`\n🌐 Botnet Capacity:`);
        ns.tprint(`   Total Servers: ${serverCount}`);
        ns.tprint(`   Total RAM: ${totalRam.toFixed(0)}GB`);
        ns.tprint(`   Max Total Threads: ${totalThreads.toLocaleString()}`);
        ns.tprint(`   Can Handle Growth: ${totalThreads >= threadsNeeded ? 'YES' : 'NO'}`);
        
        if (totalThreads >= threadsNeeded) {
          const growTime = ns.getGrowTime(target);
          ns.tprint(`   Estimated Prep Time: ${(growTime / 1000 / 60).toFixed(1)} minutes`);
        } else {
          const shortfall = threadsNeeded - totalThreads;
          ns.tprint(`   Thread Shortfall: ${shortfall.toLocaleString()}`);
          ns.tprint(`   Need More RAM: ${(shortfall * ramPerThread).toFixed(0)}GB`);
        }
        
      } catch (error) {
        ns.tprint(`   ❌ Growth analysis error: ${error}`);
      }
    }
    
    ns.tprint(`\n⏰ Timing:`);
    ns.tprint(`   Hack Time: ${(ns.getHackTime(target) / 1000).toFixed(1)}s`);
    ns.tprint(`   Grow Time: ${(ns.getGrowTime(target) / 1000).toFixed(1)}s`);
    ns.tprint(`   Weaken Time: ${(ns.getWeakenTime(target) / 1000).toFixed(1)}s`);
    
    ns.tprint(`\n🎯 HWGW Viability:`);
    const hackChance = ns.hackAnalyzeChance(target);
    ns.tprint(`   Hack Chance: ${(hackChance * 100).toFixed(1)}%`);
    
    if (server.moneyMax && server.moneyMax > 0) {
      const hackPercent = ns.hackAnalyze(target);
      const moneyPerHack = (server.moneyMax || 0) * hackPercent;
      ns.tprint(`   Money/Hack: $${ns.formatNumber(moneyPerHack)}`);
      ns.tprint(`   Hack %: ${(hackPercent * 100).toFixed(4)}%`);
    }
    
  } catch (error) {
    ns.tprint(`❌ Error analyzing ${target}: ${error}`);
  }
}