import { NS } from '../NetscriptDefinitions.d';

/**
 * Basic System Health Check
 * Tests fundamental systems without complex dependencies
 */

export async function main(ns: NS): Promise<void> {
    ns.tprint('🏥 BASIC SYSTEM HEALTH CHECK');
    ns.tprint('Testing core infrastructure without complex dependencies...');
    
    let totalTests = 0;
    let passedTests = 0;
    
    const test = (name: string, condition: boolean, details?: string) => {
        totalTests++;
        if (condition) {
            ns.tprint(`✅ ${name}`);
            if (details) ns.tprint(`   ${details}`);
            passedTests++;
        } else {
            ns.tprint(`❌ ${name}`);
            if (details) ns.tprint(`   ${details}`);
        }
    };
    
    ns.tprint('\n📁 SCRIPT FILES:');
    test('Core Scripts Present', 
        ns.fileExists('botnet.js') && 
        ns.fileExists('navigator.js') && 
        ns.fileExists('contracts.js') && 
        ns.fileExists('hacknet.js'));
    
    test('Remote Scripts Present',
        ns.fileExists('hk.js') && 
        ns.fileExists('gr.js') && 
        ns.fileExists('wk.js') && 
        ns.fileExists('sh.js'));
    
    test('System Scripts Present',
        ns.fileExists('probe.js') && 
        ns.fileExists('server-manager.js') && 
        ns.fileExists('stocks.js'));
    
    ns.tprint('\n🔧 BASIC FUNCTIONALITY:');
    
    // Test network scanning
    const servers = getAllServers(ns);
    test('Network Scanning', servers.length >= 5, `Found ${servers.length} servers`);
    
    // Test server analysis
    let rootedServers = 0;
    for (const server of servers.slice(0, 5)) {
        if (ns.hasRootAccess(server)) rootedServers++;
    }
    test('Server Root Access', rootedServers > 0, `${rootedServers}/5 servers rooted`);
    
    // Test port communication
    try {
        const port = ns.getPortHandle(19);
        port.clear();
        port.write({ test: Date.now() });
        const data = port.read();
        test('Port Communication', typeof data === 'object', 'Port read/write works');
    } catch {
        test('Port Communication', false, 'Port operations failed');
    }
    
    // Test RAM availability
    const homeRAM = ns.getServerMaxRam('home') - ns.getServerUsedRam('home');
    test('Home RAM Available', homeRAM >= 2, `${homeRAM.toFixed(2)}GB free`);
    
    ns.tprint('\n🎮 GAME STATE:');
    
    // Test basic game API
    try {
        const level = ns.getHackingLevel();
        const money = ns.getServerMoneyAvailable('home');
        test('Game API Access', level >= 1 && money >= 0, 
             `Level ${level}, $${formatMoney(money)}`);
    } catch {
        test('Game API Access', false, 'Failed to read player data');
    }
    
    // Test script execution capability
    try {
        const scriptRAM = ns.getScriptRam('quick-test.js');
        test('Script RAM Calculation', scriptRAM > 0, `${scriptRAM.toFixed(2)}GB required`);
    } catch {
        test('Script RAM Calculation', false, 'Cannot calculate script RAM costs');
    }
    
    ns.tprint('\n💻 BROWSER ENVIRONMENT:');
    
    // Test browser globals access (safe version)
    try {
        const hasWindow = typeof globalThis !== 'undefined';
        const hasLocalStorage = typeof (globalThis as any).localStorage !== 'undefined';
        test('Browser Globals', hasWindow, 'globalThis accessible');
        test('Local Storage', hasLocalStorage, 'localStorage available');
    } catch {
        test('Browser Environment', false, 'Browser APIs not accessible');
    }
    
    ns.tprint('\n🏆 RESULTS:');
    ns.tprint(`   Total Tests: ${totalTests}`);
    ns.tprint(`   ✅ Passed: ${passedTests}`);
    ns.tprint(`   ❌ Failed: ${totalTests - passedTests}`);
    ns.tprint(`   Success Rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
    
    const successRate = (passedTests/totalTests)*100;
    if (successRate >= 90) {
        ns.tprint('\n🎉 STATUS: EXCELLENT - System ready for automation!');
    } else if (successRate >= 70) {
        ns.tprint('\n✅ STATUS: GOOD - Minor issues detected');
    } else {
        ns.tprint('\n⚠️  STATUS: NEEDS ATTENTION - Multiple issues found');
    }
    
    ns.tprint('\n📝 NEXT STEPS:');
    ns.tprint('   1. If all tests pass: run system-test.js for comprehensive analysis');
    ns.tprint('   2. If issues found: check file sync and build process');
    ns.tprint('   3. Start individual systems: run botnet.js, navigator.js, etc.');
    ns.tprint('   4. Monitor logs for runtime issues');
}

function getAllServers(ns: NS): string[] {
    const visited = new Set<string>();
    const queue = ['home'];
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        
        visited.add(current);
        const neighbors = ns.scan(current);
        queue.push(...neighbors.filter(server => !visited.has(server)));
    }
    
    return Array.from(visited);
}

function formatMoney(amount: number): string {
    if (amount >= 1e12) return (amount / 1e12).toFixed(1) + 'T';
    if (amount >= 1e9) return (amount / 1e9).toFixed(1) + 'B';
    if (amount >= 1e6) return (amount / 1e6).toFixed(1) + 'M';
    if (amount >= 1e3) return (amount / 1e3).toFixed(1) + 'K';
    return amount.toFixed(0);
}