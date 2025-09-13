import { NS } from '@ns';

interface TargetAnalysis {
  hostname: string;
  maxMoney: number;
  currentMoney: number;
  securityLevel: number;
  minSecurityLevel: number;
  hackLevel: number;
  hackTime: number;
  growTime: number;
  weakenTime: number;
  hackChance: number;
  moneyPerSecond: number;
  efficiencyScore: number;
  preparationStatus: {
    hasRoot: boolean;
    canBeRooted: boolean;
    portsRequired: number;
    portsAvailable: number;
    isOptimalSecurity: boolean;
    isMaxMoney: boolean;
    isPrepared: boolean;
  };
  preparedPotential: {
    hackChance: number;
    moneyPerSecond: number;
    efficiencyScore: number;
  };
  requiredThreads: {
    hack: number;
    grow: number;
    weaken1: number;
    weaken2: number;
  };
}

interface OptimalTarget {
  analysis: TargetAnalysis;
  recommendedBatchSize: number;
  projectedMoneyPerHour: number;
  projectedBatchValue: number;
}

export async function main(ns: NS): Promise<void> {
  const playerHackLevel = ns.getHackingLevel();
  const playerMoney = ns.getServerMoneyAvailable('home');
  
  ns.tprint(`\n=== TARGET EVALUATION SYSTEM (PREPARATION-AWARE) ===`);
  ns.tprint(`Player Hack Level: ${playerHackLevel}`);
  ns.tprint(`Available Money: $${ns.formatNumber(playerMoney)}`);

  const allServers = getAllServers(ns);
  
  // Enhanced filtering: Include all servers we can potentially hack when prepared
  const potentialTargets = allServers.filter(hostname => {
    if (hostname === 'home') return false; // Never hack home
    const hackLevel = ns.getServerRequiredHackingLevel(hostname);
    const maxMoney = ns.getServerMaxMoney(hostname);
    return hackLevel <= playerHackLevel && maxMoney > 100000; // $100K minimum
  });

  ns.tprint(`\nAnalyzing ${potentialTargets.length} potential targets...`);
  ns.tprint(`(Including servers that need preparation: rooting, weakening, growing)`);

  const analyses: TargetAnalysis[] = [];
  for (const hostname of potentialTargets) {
    const analysis = analyzeTarget(ns, hostname);
    analyses.push(analysis);
  }

  // Sort by PREPARED potential efficiency (not current state)
  analyses.sort((a, b) => b.preparedPotential.efficiencyScore - a.preparedPotential.efficiencyScore);

  ns.tprint(`\n=== TOP 10 TARGETS BY PREPARED POTENTIAL ===`);
  for (let i = 0; i < Math.min(10, analyses.length); i++) {
    const target = analyses[i];
    const prep = target.preparationStatus;
    ns.tprint(`${i + 1}. ${target.hostname} ${prep.isPrepared ? '✅' : prep.canBeRooted ? '🔧' : '❌'}`);
    ns.tprint(`   Max Money: $${ns.formatNumber(target.maxMoney)}`);
    ns.tprint(`   Hack Level: ${target.hackLevel} (${target.preparedPotential.hackChance.toFixed(1)}% when prepared)`);
    ns.tprint(`   Prepared $/sec: $${ns.formatNumber(target.preparedPotential.moneyPerSecond)}`);
    ns.tprint(`   Prep Status: Root:${prep.hasRoot ? '✓' : prep.canBeRooted ? `${prep.portsAvailable}/${prep.portsRequired}` : '✗'} Sec:${prep.isOptimalSecurity ? '✓' : '✗'} Money:${prep.isMaxMoney ? '✓' : '✗'}`);
    ns.tprint('');
  }

  // Show preparation summary
  const preparedCount = analyses.filter(t => t.preparationStatus.isPrepared).length;
  const rootableCount = analyses.filter(t => t.preparationStatus.canBeRooted).length;
  const unrootableCount = analyses.filter(t => !t.preparationStatus.canBeRooted && !t.preparationStatus.hasRoot).length;
  
  ns.tprint(`\n=== PREPARATION SUMMARY ===`);
  ns.tprint(`✅ Fully Prepared: ${preparedCount}/${analyses.length}`);
  ns.tprint(`🔧 Can Be Prepared: ${rootableCount}/${analyses.length}`);
  ns.tprint(`❌ Cannot Root: ${unrootableCount}/${analyses.length}`);

  // Find optimal target with detailed recommendations
  const optimalTarget = findOptimalTarget(ns, analyses);
  
  ns.tprint(`\n=== OPTIMAL TARGET RECOMMENDATION ===`);
  ns.tprint(`🎯 TARGET: ${optimalTarget.analysis.hostname}`);
  ns.tprint(`💰 Max Money: $${ns.formatNumber(optimalTarget.analysis.maxMoney)}`);
  ns.tprint(`📊 Projected Batch Value: $${ns.formatNumber(optimalTarget.projectedBatchValue)}`);
  ns.tprint(`⚡ Projected Money/Hour: $${ns.formatNumber(optimalTarget.projectedMoneyPerHour)}`);
  ns.tprint(`🎛️ Recommended Batch Size: ${optimalTarget.recommendedBatchSize}`);
  
  const prep = optimalTarget.analysis.preparationStatus;
  ns.tprint(`🔧 Preparation Required: ${prep.isPrepared ? 'None (Ready!)' : 
    `Root:${prep.hasRoot ? '✓' : '⚠️'} Security:${prep.isOptimalSecurity ? '✓' : '⚠️'} Money:${prep.isMaxMoney ? '✓' : '⚠️'}`}`);
  
  const current = analyzeTarget(ns, 'n00dles');
  const improvement = (optimalTarget.projectedMoneyPerHour / (current.preparedPotential.moneyPerSecond * 3600)) - 1;
  ns.tprint(`📈 Improvement vs n00dles: ${(improvement * 100).toFixed(1)}% increase`);

  ns.tprint(`\n=== THREAD REQUIREMENTS ===`);
  ns.tprint(`Hack Threads: ${optimalTarget.analysis.requiredThreads.hack}`);
  ns.tprint(`Grow Threads: ${optimalTarget.analysis.requiredThreads.grow}`);
  ns.tprint(`Weaken Threads: ${optimalTarget.analysis.requiredThreads.weaken1 + optimalTarget.analysis.requiredThreads.weaken2}`);
  
  const totalRamNeeded = (optimalTarget.analysis.requiredThreads.hack * 1.7) + 
                        (optimalTarget.analysis.requiredThreads.grow * 1.75) + 
                        ((optimalTarget.analysis.requiredThreads.weaken1 + optimalTarget.analysis.requiredThreads.weaken2) * 1.75);
  ns.tprint(`Total RAM per batch: ${totalRamNeeded.toFixed(2)}GB`);

  // Write optimal target to file for easy V3 config update
  await ns.write('optimal-target.txt', JSON.stringify({
    hostname: optimalTarget.analysis.hostname,
    batchSize: optimalTarget.recommendedBatchSize,
    projectedMoneyPerHour: optimalTarget.projectedMoneyPerHour,
    improvement: improvement,
    preparationStatus: optimalTarget.analysis.preparationStatus
  }, null, 2), 'w');

  ns.tprint(`\n✅ Target recommendation saved to optimal-target.txt`);
  ns.tprint(`\n🚀 Ready to update V3 config with optimal prepared target!`);
}

function getAllServers(ns: NS): string[] {
  const visited = new Set<string>();
  const queue = ['home'];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    
    const neighbors = ns.scan(current);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }
  
  return Array.from(visited);
}

function analyzeTarget(ns: NS, hostname: string): TargetAnalysis {
  const server = ns.getServer(hostname);
  const hackLevel = ns.getServerRequiredHackingLevel(hostname);
  const hackTime = ns.getHackTime(hostname);
  const growTime = ns.getGrowTime(hostname);
  const weakenTime = ns.getWeakenTime(hostname);
  
  // Current state analysis
  const hackChance = ns.hackAnalyzeChance(hostname);
  
  // Preparation status analysis
  const hasRoot = server.hasAdminRights || false;
  const portsRequired = server.numOpenPortsRequired || 0;
  const portsAvailable = getAvailablePortOpeners(ns);
  const canBeRooted = hasRoot || (portsAvailable >= portsRequired);
  
  const currentSecurity = server.hackDifficulty || 0;
  const minSecurity = server.minDifficulty || 0;
  const isOptimalSecurity = Math.abs(currentSecurity - minSecurity) < 0.1;
  
  const currentMoney = server.moneyAvailable || 0;
  const maxMoney = server.moneyMax || 0;
  const isMaxMoney = maxMoney > 0 && (currentMoney / maxMoney) > 0.95;
  
  const isPrepared = hasRoot && isOptimalSecurity && isMaxMoney;
  
  // Calculate prepared potential (what performance would be when optimally prepared)
  const preparedHackChance = ns.hackAnalyzeChance(hostname); // This accounts for player skill vs min difficulty
  const preparedServer = { ...server, hackDifficulty: minSecurity, moneyAvailable: maxMoney };
  
  // Use min security for optimal calculations
  const tempSecurity = server.hackDifficulty;
  // Unfortunately can't directly simulate min security, so we'll estimate
  const securityDifference = (currentSecurity - minSecurity);
  const hackChanceImprovement = securityDifference * 0.002; // Rough estimate
  const estimatedPreparedHackChance = Math.min(1.0, preparedHackChance + hackChanceImprovement);
  
  // Calculate required threads for optimal batching (based on prepared state)
  const hackThreads = Math.max(1, Math.ceil(ns.hackAnalyzeThreads(hostname, maxMoney * 0.25)));
  const growThreads = Math.max(1, Math.ceil(ns.growthAnalyze(hostname, 1.33))); // Grow back to full + buffer
  const weaken1Threads = Math.max(1, Math.ceil(hackThreads * 0.002 / 0.05)); // Counter hack security
  const weaken2Threads = Math.max(1, Math.ceil(growThreads * 0.004 / 0.05)); // Counter grow security

  // Current efficiency metrics
  const batchTime = Math.max(hackTime, growTime, weakenTime);
  const currentExpectedMoney = currentMoney * 0.25 * hackChance;
  const currentMoneyPerSecond = currentExpectedMoney / (batchTime / 1000);
  const currentEfficiencyScore = (currentExpectedMoney / 1000000) * (hackChance * 100) / (batchTime / 1000);

  // Prepared potential metrics
  const preparedExpectedMoney = maxMoney * 0.25 * estimatedPreparedHackChance;
  const preparedMoneyPerSecond = preparedExpectedMoney / (batchTime / 1000);
  const preparedEfficiencyScore = (preparedExpectedMoney / 1000000) * (estimatedPreparedHackChance * 100) / (batchTime / 1000);

  return {
    hostname,
    maxMoney: maxMoney,
    currentMoney: currentMoney,
    securityLevel: currentSecurity,
    minSecurityLevel: minSecurity,
    hackLevel,
    hackTime,
    growTime,
    weakenTime,
    hackChance,
    moneyPerSecond: currentMoneyPerSecond,
    efficiencyScore: currentEfficiencyScore,
    preparationStatus: {
      hasRoot,
      canBeRooted,
      portsRequired,
      portsAvailable,
      isOptimalSecurity,
      isMaxMoney,
      isPrepared
    },
    preparedPotential: {
      hackChance: estimatedPreparedHackChance,
      moneyPerSecond: preparedMoneyPerSecond,
      efficiencyScore: preparedEfficiencyScore
    },
    requiredThreads: {
      hack: hackThreads,
      grow: growThreads,
      weaken1: weaken1Threads,
      weaken2: weaken2Threads
    }
  };
}

function getAvailablePortOpeners(ns: NS): number {
  let available = 0;
  if (ns.fileExists('BruteSSH.exe', 'home')) available++;
  if (ns.fileExists('FTPCrack.exe', 'home')) available++;
  if (ns.fileExists('relaySMTP.exe', 'home')) available++;
  if (ns.fileExists('HTTPWorm.exe', 'home')) available++;
  if (ns.fileExists('SQLInject.exe', 'home')) available++;
  return available;
}

function findOptimalTarget(ns: NS, analyses: TargetAnalysis[]): OptimalTarget {
  // Filter to only targets we can prepare (root + prepare)
  const preparableTargets = analyses.filter(t => t.preparationStatus.canBeRooted);
  
  if (preparableTargets.length === 0) {
    // Fallback to already prepared targets if no preparable ones
    const preparedTargets = analyses.filter(t => t.preparationStatus.isPrepared);
    if (preparedTargets.length === 0) {
      throw new Error("No suitable targets found!");
    }
    return findBestAmongTargets(ns, preparedTargets.slice(0, 5));
  }
  
  return findBestAmongTargets(ns, preparableTargets.slice(0, 5));
}

function findBestAmongTargets(ns: NS, analyses: TargetAnalysis[]): OptimalTarget {
  // Find target with best balance of PREPARED money potential and efficiency
  let bestTarget = analyses[0];
  let bestScore = 0;

  for (const analysis of analyses) {
    // Use PREPARED potential for scoring
    const moneyScore = Math.log10(analysis.maxMoney) * 10; // Logarithmic money scaling
    const chanceScore = analysis.preparedPotential.hackChance * 100;
    const timeScore = 3600 / (Math.max(analysis.hackTime, analysis.growTime, analysis.weakenTime) / 1000);
    
    const totalScore = moneyScore + chanceScore + timeScore;
    
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestTarget = analysis;
    }
  }

  // Calculate optimal batch size and projections using PREPARED potential
  const recommendedBatchSize = Math.min(50, Math.max(5, Math.floor(bestTarget.preparedPotential.hackChance * 20)));
  const batchValue = bestTarget.maxMoney * 0.25 * bestTarget.preparedPotential.hackChance;
  const batchTime = Math.max(bestTarget.hackTime, bestTarget.growTime, bestTarget.weakenTime) / 1000;
  const batchesPerHour = 3600 / batchTime;
  const projectedMoneyPerHour = batchValue * batchesPerHour;

  return {
    analysis: bestTarget,
    recommendedBatchSize,
    projectedMoneyPerHour,
    projectedBatchValue: batchValue
  };
}