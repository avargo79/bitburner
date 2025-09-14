import { NS } from '@ns';

/**
 * Quick System Check - Fast verification of critical systems
 * Use this for quick health checks, use system-test.js for comprehensive testing
 */

export async function main(ns: NS): Promise<void> {
    ns.tprint('🔍 Quick System Check - Verifying critical systems...');
    
    let passed = 0;
    let failed = 0;
    const startTime = Date.now();

    // Helper function for tests
    const test = (name: string, condition: boolean, details?: string) => {
        if (condition) {
            ns.tprint(`✅ ${name}`);
            if (details) ns.tprint(`   ${details}`);
            passed++;
        } else {
            ns.tprint(`❌ ${name}`);
            if (details) ns.tprint(`   ${details}`);
            failed++;
        }
    };

    ns.tprint('');

    // === CRITICAL FILES ===
    ns.tprint('📁 Core Files:');
    test('Botnet System', ns.fileExists('botnet.js'));
    test('Navigator System', ns.fileExists('navigator.js'));
    test('React Navigator', ns.fileExists('react-navigator.js'));
    test('Contracts System', ns.fileExists('contracts.js'));

    // === REMOTE SCRIPTS ===
    ns.tprint('\n🔗 Remote Scripts:');
    test('Hack Script', ns.fileExists('hk.js'));
    test('Grow Script', ns.fileExists('gr.js'));
    test('Weaken Script', ns.fileExists('wk.js'));
    test('Share Script', ns.fileExists('sh.js'));

    // === BROWSER APIS ===
    ns.tprint('\n🌐 Browser Access:');
    try {
        const win = (globalThis as any)['win' + 'dow'];
        const doc = (globalThis as any)['doc' + 'ument'];
        test('Window API', !!win && typeof win.location === 'object');
        test('Document API', !!doc && typeof doc.querySelector === 'function');
        test('LocalStorage', !!win?.localStorage && typeof win.localStorage.setItem === 'function');
        
        // Test React root
        const root = doc?.querySelector('#root');
        test('React Root Element', !!root, root ? 'Found #root element' : 'No #root element found');
    } catch (error) {
        test('Browser API Access', false, 'Failed to access browser APIs');
    }

    // === COMMUNICATION ===
    ns.tprint('\n📡 Communication:');
    try {
        const port = ns.getPortHandle(19);
        port.clear();
        port.write({ test: true });
        const data = port.read();
        test('Port Communication', typeof data === 'object' && (data as any).test === true);
    } catch (error) {
        test('Port Communication', false, 'Port read/write failed');
    }

    // === NETWORK ===
    ns.tprint('\n🌍 Network:');
    const servers = getAllServers(ns);
    test('Network Scanning', servers.length >= 10, `Found ${servers.length} servers`);
    
    let rootedCount = 0;
    for (const server of servers.slice(0, 5)) {
        if (ns.hasRootAccess(server)) rootedCount++;
    }
    test('Root Access', rootedCount > 0, `${rootedCount}/5 servers rooted in sample`);

    // === GAME API ===
    ns.tprint('\n🎮 Game API:');
    try {
        const money = ns.getServerMoneyAvailable('home');
        const level = ns.getHackingLevel();
        const hostname = ns.getHostname();
        test('Player Data', money >= 0 && level >= 1 && hostname.length > 0, 
             `Level ${level}, $${formatMoney(money)}, on ${hostname}`);
    } catch (error) {
        test('Player Data', false, 'Failed to get player information');
    }

    // === RAM STATUS ===
    ns.tprint('\n💾 RAM Status:');
    const currentRAM = ns.getServerMaxRam('home') - ns.getServerUsedRam('home');
    test('Available RAM', currentRAM >= 4, `${currentRAM.toFixed(2)}GB available on home`);

    // === RESULTS ===
    const duration = Date.now() - startTime;
    const total = passed + failed;
    const successRate = (passed / total) * 100;

    ns.tprint('\n' + '='.repeat(60));
    ns.tprint('🎯 QUICK CHECK RESULTS:');
    ns.tprint(`   Total Tests: ${total}`);
    ns.tprint(`   ✅ Passed: ${passed} (${successRate.toFixed(1)}%)`);
    ns.tprint(`   ❌ Failed: ${failed} (${(100 - successRate).toFixed(1)}%)`);
    ns.tprint(`   ⏱️  Duration: ${duration}ms`);

    if (successRate >= 90) {
        ns.tprint('\n🎉 SYSTEM STATUS: EXCELLENT - All systems operational!');
    } else if (successRate >= 75) {
        ns.tprint('\n✅ SYSTEM STATUS: GOOD - Minor issues detected');
    } else if (successRate >= 50) {
        ns.tprint('\n⚠️  SYSTEM STATUS: DEGRADED - Multiple issues need attention');
    } else {
        ns.tprint('\n❌ SYSTEM STATUS: CRITICAL - Major system failures');
    }

    ns.tprint('='.repeat(60));
    ns.tprint('💡 For detailed analysis, run: run system-test.js');
}

function getAllServers(ns: NS): string[] {
    const visited = new Set<string>();
    const queue: string[] = ['home'];
    
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
    if (amount >= 1e12) return (amount / 1e12).toFixed(2) + 'T';
    if (amount >= 1e9) return (amount / 1e9).toFixed(2) + 'B';
    if (amount >= 1e6) return (amount / 1e6).toFixed(2) + 'M';
    if (amount >= 1e3) return (amount / 1e3).toFixed(2) + 'K';
    return amount.toFixed(2);
}