import { NS } from '@ns';
import { SimpleServerManager } from '/v2/network-client';

export async function main(ns: NS): Promise<void> {
    ns.clearLog();
    
    const networkClient = new SimpleServerManager(ns);
    const clientSnapshot = await networkClient.getNetworkSnapshot();
    const playerLevel = ns.getHackingLevel();
    
    ns.tprint(`=== TARGET DEBUGGING ===`);
    ns.tprint(`Player Hacking Level: ${playerLevel}`);
    ns.tprint(`Total Servers Found: ${clientSnapshot.servers.length}`);
    
    const CONFIG = {
        minTargetMoney: 1000000,            // $1M minimum
        maxTargetSecurity: 100,             // Maximum security level
    };
    
    // Filter servers step by step to see where they get eliminated
    let stepCount = 0;
    let candidates = clientSnapshot.servers;
    
    ns.tprint(`\nStep ${++stepCount}: All servers: ${candidates.length}`);
    
    // Filter 1: isTarget servers
    candidates = candidates.filter(s => s.isTarget);
    ns.tprint(`Step ${++stepCount}: Has money and admin rights (isTarget): ${candidates.length}`);
    
    // Filter 2: not purchased by player
    candidates = candidates.filter(s => !s.purchasedByPlayer);
    ns.tprint(`Step ${++stepCount}: Not purchased by player: ${candidates.length}`);
    
    // Detailed analysis of remaining candidates
    ns.tprint(`\n=== DETAILED CANDIDATE ANALYSIS ===`);
    
    for (const serverInfo of candidates) {
        const server = ns.getServer(serverInfo.hostname);
        const requiredLevel = server.requiredHackingSkill || 0;
        const maxMoney = server.moneyMax || 0;
        const currentSecurity = server.hackDifficulty || 1;
        const currentMoney = server.moneyAvailable || 0;
        
        const hackChance = ns.hackAnalyzeChance(serverInfo.hostname);
        const moneyPercent = ns.hackAnalyze(serverInfo.hostname);
        
        // Check each filter condition
        const levelOk = requiredLevel <= playerLevel;
        const moneyOk = maxMoney >= CONFIG.minTargetMoney;
        const securityOk = currentSecurity <= CONFIG.maxTargetSecurity;
        const chanceOk = hackChance >= 0.8;
        const currentMoneyOk = currentMoney >= maxMoney * 0.1;
        const positiveMoneyOk = currentMoney > 0 && maxMoney > 0;
        const validAnalysisOk = moneyPercent > 0 && isFinite(moneyPercent);
        
        const expectedMoney = currentMoney * moneyPercent * hackChance;
        const expectedMoneyOk = expectedMoney >= 10000;
        
        const passesAll = levelOk && moneyOk && securityOk && chanceOk && 
                         currentMoneyOk && positiveMoneyOk && validAnalysisOk && expectedMoneyOk;
        
        ns.tprint(`\n${serverInfo.hostname}:`);
        ns.tprint(`  Required Level: ${requiredLevel} <= ${playerLevel} = ${levelOk}`);
        ns.tprint(`  Max Money: ${ns.formatNumber(maxMoney)} >= ${ns.formatNumber(CONFIG.minTargetMoney)} = ${moneyOk}`);
        ns.tprint(`  Current Money: ${ns.formatNumber(currentMoney)} (${((currentMoney/maxMoney)*100).toFixed(1)}% of max)`);
        ns.tprint(`  Security: ${currentSecurity.toFixed(2)} <= ${CONFIG.maxTargetSecurity} = ${securityOk}`);
        ns.tprint(`  Hack Chance: ${(hackChance * 100).toFixed(1)}% >= 80% = ${chanceOk}`);
        ns.tprint(`  Money %/thread: ${(moneyPercent * 100).toFixed(4)}% = ${validAnalysisOk}`);
        ns.tprint(`  Expected Gain: ${ns.formatNumber(expectedMoney)} >= 10k = ${expectedMoneyOk}`);
        ns.tprint(`  Current Money >= 10% Max: ${currentMoneyOk}`);
        ns.tprint(`  PASSES ALL FILTERS: ${passesAll}`);
        
        if (!passesAll) {
            const failures = [];
            if (!levelOk) failures.push('level too high');
            if (!moneyOk) failures.push('max money too low');
            if (!securityOk) failures.push('security too high');
            if (!chanceOk) failures.push('hack chance too low');
            if (!currentMoneyOk) failures.push('current money < 10% max');
            if (!positiveMoneyOk) failures.push('zero/negative money');
            if (!validAnalysisOk) failures.push('invalid hack analysis');
            if (!expectedMoneyOk) failures.push('expected gain < 10k');
            ns.tprint(`  FAILED: ${failures.join(', ')}`);
        }
    }
    
    // Final count
    const validTargets = candidates.filter(serverInfo => {
        const server = ns.getServer(serverInfo.hostname);
        
        if ((server.requiredHackingSkill || 0) > playerLevel) return false;
        if ((server.moneyMax || 0) < CONFIG.minTargetMoney) return false;
        if ((server.hackDifficulty || 1) > CONFIG.maxTargetSecurity) return false;
        
        const hackChance = ns.hackAnalyzeChance(serverInfo.hostname);
        if (hackChance < 0.8) return false;
        
        const moneyPercent = ns.hackAnalyze(serverInfo.hostname);
        if (moneyPercent <= 0 || !isFinite(moneyPercent)) return false;
        
        const currentMoney = server.moneyAvailable || 0;
        const maxMoney = server.moneyMax || 0;
        if (currentMoney < maxMoney * 0.1) return false;
        if (currentMoney <= 0 || maxMoney <= 0) return false;
        
        const expectedMoney = currentMoney * moneyPercent * hackChance;
        if (expectedMoney < 10000) return false;
        
        return true;
    });
    
    ns.tprint(`\n=== SUMMARY ===`);
    ns.tprint(`Valid HWGW Targets Found: ${validTargets.length}`);
    
    if (validTargets.length === 0) {
        ns.tprint(`\nNO VALID TARGETS - Consider:`);
        ns.tprint(`1. Lowering minimum money requirement (currently $${ns.formatNumber(CONFIG.minTargetMoney)})`);
        ns.tprint(`2. Increasing maximum security tolerance (currently ${CONFIG.maxTargetSecurity})`);
        ns.tprint(`3. Lowering hack chance requirement (currently 80%)`);
        ns.tprint(`4. Growing servers to increase current money available`);
        ns.tprint(`5. Checking if servers need to be weakened first`);
    } else {
        ns.tprint(`\nValid targets: ${validTargets.map(s => s.hostname).join(', ')}`);
    }
}