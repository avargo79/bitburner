import { NS } from '@ns';

export async function main(ns: NS): Promise<void> {
  ns.tprint(`\n=== BASIC TARGETS ANALYSIS ===`);
  
  // Check basic targets that should be ready
  const basicTargets = ['n00dles', 'nectar-net', 'max-hardware', 'iron-gym'];
  
  for (const target of basicTargets) {
    try {
      if (!ns.serverExists(target)) {
        ns.tprint(`${target}: ❌ SERVER NOT FOUND`);
        continue;
      }
      
      const server = ns.getServer(target);
      const currentMoney = server.moneyAvailable || 0;
      const maxMoney = server.moneyMax || 0;
      const currentSec = server.hackDifficulty || 0;
      const minSec = server.minDifficulty || 0;
      
      const moneyReady = maxMoney === 0 || (currentMoney / maxMoney) >= 0.95;
      const secReady = (currentSec - minSec) <= 0.1;
      const rooted = server.hasAdminRights;
      const fullyReady = moneyReady && secReady && rooted;
      
      ns.tprint(`${target}: ${fullyReady ? '✅ READY' : '❌ NOT READY'}`);
      ns.tprint(`  Money: ${moneyReady ? '✅' : '❌'} $${ns.formatNumber(currentMoney)}/$${ns.formatNumber(maxMoney)} (${maxMoney > 0 ? ((currentMoney/maxMoney)*100).toFixed(1) : 'N/A'}%)`);
      ns.tprint(`  Security: ${secReady ? '✅' : '❌'} ${currentSec.toFixed(2)}/${minSec.toFixed(2)} (+${(currentSec-minSec).toFixed(2)})`);
      ns.tprint(`  Root: ${rooted ? '✅' : '❌'}`);
      
      if (fullyReady && maxMoney > 0) {
        // Quick money/hour estimate
        const hackChance = ns.hackAnalyzeChance(target);
        const hackAmount = ns.hackAnalyze(target);
        const hackTime = ns.getHackTime(target);
        const moneyPerHack = maxMoney * hackAmount;
        const hacksPer100Threads = hackChance * 100;
        const moneyPerHour = (moneyPerHack * hacksPer100Threads * 3600000) / hackTime;
        
        ns.tprint(`  💰 Estimated $/hour: $${ns.formatNumber(moneyPerHour)} (${hackChance.toFixed(1)}% chance, ${(hackTime/1000).toFixed(1)}s)`);
      }
      ns.tprint('');
      
    } catch (error) {
      ns.tprint(`Error checking ${target}: ${error}`);
    }
  }
  
  // Check current botnet target
  ns.tprint(`=== CURRENT BOTNET STATUS ===`);
  const processes = ns.ps().filter(p => p.filename === 'botnet-v3.js');
  if (processes.length > 0) {
    ns.tprint(`🤖 Botnet-v3 is running (PID: ${processes[0].pid})`);
    ns.tprint(`📊 Check the terminal output to see current target and performance`);
  } else {
    ns.tprint(`❌ Botnet-v3 is not running`);
  }
}