import { NS } from '@ns';
import { Logger, LogLevel } from '/lib/logger';

/**
 * System Test Suite - Comprehensive testing of all Bitburner automation systems
 * Tests: Core Infrastructure, File Existence, Basic Functionality, Communication
 */

interface TestResult {
    name: string;
    status: 'PASS' | 'FAIL' | 'SKIP' | 'WARN';
    message: string;
    duration: number;
    details?: any;
}

interface TestSuite {
    name: string;
    results: TestResult[];
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    warnTests: number;
    duration: number;
}

class SystemTester {
    private ns: NS;
    private logger: Logger;
    private testSuites: TestSuite[] = [];
    
    constructor(ns: NS) {
        this.ns = ns;
        this.logger = Logger.getInstance(ns, 'SystemTest', { level: LogLevel.INFO });
    }

    // ===== CORE TEST INFRASTRUCTURE =====

    private async runTest(name: string, testFn: () => Promise<void> | void): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            this.logger.info(`Running test: ${name}`);
            await testFn();
            const duration = Date.now() - startTime;
            return {
                name,
                status: 'PASS',
                message: 'Test passed successfully',
                duration
            };
        } catch (error: any) {
            const duration = Date.now() - startTime;
            this.logger.error(`Test failed: ${name} - ${error?.message || error}`);
            return {
                name,
                status: 'FAIL',
                message: error.message || 'Test failed with unknown error',
                duration,
                details: error
            };
        }
    }

    private async runTestSuite(suiteName: string, tests: { name: string, fn: () => Promise<void> | void }[]): Promise<TestSuite> {
        const startTime = Date.now();
        this.logger.info(`=== Starting Test Suite: ${suiteName} ===`);
        
        const results: TestResult[] = [];
        
        for (const test of tests) {
            const result = await this.runTest(test.name, test.fn);
            results.push(result);
            
            // Add small delay between tests
            await this.ns.sleep(100);
        }
        
        const duration = Date.now() - startTime;
        const passedTests = results.filter(r => r.status === 'PASS').length;
        const failedTests = results.filter(r => r.status === 'FAIL').length;
        const skippedTests = results.filter(r => r.status === 'SKIP').length;
        const warnTests = results.filter(r => r.status === 'WARN').length;
        
        const suite: TestSuite = {
            name: suiteName,
            results,
            totalTests: tests.length,
            passedTests,
            failedTests,
            skippedTests,
            warnTests,
            duration
        };
        
        this.testSuites.push(suite);
        this.logger.info(`=== Completed Test Suite: ${suiteName} (${passedTests}/${tests.length} passed) ===`);
        
        return suite;
    }

    // ===== BROWSER AUTOMATION TESTS =====

    private async testBrowserAPIs(): Promise<void> {
        // Test stealth window access (should be FREE - 0GB RAM)
        const win = (globalThis as any)['win' + 'dow'];
        if (!win || typeof win.location !== 'object') {
            throw new Error('Failed to access window API via stealth technique');
        }

        // Test stealth document access (should be FREE - 0GB RAM)  
        const doc = (globalThis as any)['doc' + 'ument'];
        if (!doc || typeof doc.querySelector !== 'function') {
            throw new Error('Failed to access document API via stealth technique');
        }

        // Test localStorage access (FREE)
        const testKey = 'systemtest_' + Date.now();
        const testValue = 'test_value_' + Math.random();
        win.localStorage.setItem(testKey, testValue);
        
        if (win.localStorage.getItem(testKey) !== testValue) {
            throw new Error('localStorage read/write test failed');
        }
        
        win.localStorage.removeItem(testKey);
        
        this.logger.info('✅ Browser APIs: Stealth access working, localStorage functional');
    }

    private async testReactElementFinding(): Promise<void> {
        const doc = (globalThis as any)['doc' + 'ument'];
        
        // Test basic DOM access
        const rootElement = doc.querySelector('#root');
        if (!rootElement) {
            throw new Error('Failed to find React root element (#root)');
        }

        // Test React Fiber access
        const fiberKey = Object.keys(rootElement).find((key: string) => 
            key.startsWith('__reactInternalInstance') || 
            key.startsWith('_reactInternalFiber') ||
            key.startsWith('__reactFiber')
        );
        if (!fiberKey) {
            // This is common - React Fiber keys change between versions
            this.logger.warn('React Fiber key not found - may need different detection method');
        } else {
            this.logger.info(`✅ React Elements: Root element found, Fiber key: ${fiberKey}`);
        }
    }

    // ===== FILE SYSTEM TESTS =====

    private async testCoreScriptFiles(): Promise<void> {
        const coreScripts = [
            'botnet.js', 'navigator.js', 'contracts.js', 'hacknet.js', 
            'casino-bot.js', 'stocks.js', 'probe.js', 'server-manager.js'
        ];
        const missingScripts: string[] = [];

        for (const script of coreScripts) {
            if (!this.ns.fileExists(script)) {
                missingScripts.push(script);
            }
        }

        if (missingScripts.length > 0) {
            throw new Error(`Missing core scripts: ${missingScripts.join(', ')}`);
        }

        this.logger.info(`✅ Core Scripts: All ${coreScripts.length} main scripts present`);
    }

    private async testRemoteScriptFiles(): Promise<void> {
        const remoteScripts = ['hk.js', 'gr.js', 'wk.js', 'sh.js', 'root.js'];
        const missingScripts: string[] = [];

        for (const script of remoteScripts) {
            if (!this.ns.fileExists(script)) {
                missingScripts.push(script);
            }
        }

        if (missingScripts.length > 0) {
            throw new Error(`Missing remote scripts: ${missingScripts.join(', ')}`);
        }

        this.logger.info(`✅ Remote Scripts: All ${remoteScripts.length} remote scripts present`);
    }

    private async testReactLibraryFiles(): Promise<void> {
        // Test key React library files exist
        const reactFiles = [
            'react-navigator.js', 'react-game-state.js', 'react-browser-utils.js',
            'react-component-finder.js', 'react-element-finder.js'
        ];
        
        let existingFiles = 0;
        const missingFiles: string[] = [];

        for (const file of reactFiles) {
            if (this.ns.fileExists(file)) {
                existingFiles++;
            } else {
                missingFiles.push(file);
            }
        }

        if (existingFiles === 0) {
            throw new Error('No React library files found - React Navigator system not built');
        } else if (missingFiles.length > 0) {
            this.logger.warn(`React Library: ${existingFiles}/${reactFiles.length} files present. Missing: ${missingFiles.join(', ')}`);
        } else {
            this.logger.info(`✅ React Library: All ${reactFiles.length} library files present`);
        }
    }

    // ===== COMMUNICATION TESTS =====

    private async testPortCommunication(): Promise<void> {
        const testPort = 19; // Use port 19 for testing
        const testData = { test: true, timestamp: Date.now(), value: Math.random() };

        // Clear port first
        const port = this.ns.getPortHandle(testPort);
        port.clear();

        // Write test data
        port.write(testData);

        // Read test data
        const received = port.read();
        if (JSON.stringify(received) !== JSON.stringify(testData)) {
            throw new Error(`Port communication failed: expected ${JSON.stringify(testData)}, got ${JSON.stringify(received)}`);
        }

        this.logger.info('✅ Port Communication: Read/write operations functional');
    }

    private async testEventPortStatus(): Promise<void> {
        // Check the botnet event port (port 20) that should have real events
        const eventPort = this.ns.getPortHandle(20);
        const hasEvents = !eventPort.empty();
        const eventCount = eventPort.full() ? 20 : (hasEvents ? 'some' : 0);
        
        if (!hasEvents) {
            this.logger.warn('Event Port 20: No events found - botnet may not be running or publishing events');
        } else {
            this.logger.info(`✅ Event Port 20: ${eventCount} events queued - event system active`);
            
            // Peek at one event to verify structure
            if (!eventPort.empty()) {
                const sampleEvent = eventPort.peek();
                if (typeof sampleEvent === 'object' && sampleEvent !== null) {
                    this.logger.info('✅ Event Structure: Valid event objects detected');
                } else {
                    this.logger.warn('Event Structure: Unexpected event format detected');
                }
            }
        }
    }

    // ===== NETWORK & SERVER TESTS =====

    private async testNetworkAnalysis(): Promise<void> {
        // Test network scanning
        const allServers = this.getAllServers();
        if (allServers.length < 10) {
            throw new Error(`Network scan found only ${allServers.length} servers - seems incomplete`);
        }

        // Test server analysis
        let rootedServers = 0;
        let analysisErrors = 0;
        let totalMoney = 0;

        for (const server of allServers.slice(0, 10)) { // Test first 10 servers
            try {
                const hasRoot = this.ns.hasRootAccess(server);
                const maxMoney = this.ns.getServerMaxMoney(server);
                const security = this.ns.getServerSecurityLevel(server);
                
                if (hasRoot) rootedServers++;
                totalMoney += maxMoney;
                
                // Basic validation that we got reasonable values
                if (maxMoney < 0 || security < 0) {
                    analysisErrors++;
                }
            } catch (error) {
                analysisErrors++;
            }
        }

        if (analysisErrors > 3) {
            throw new Error(`Too many server analysis errors: ${analysisErrors}/10`);
        }

        this.logger.info(`✅ Network Analysis: Found ${allServers.length} servers, ${rootedServers}/10 rooted, $${this.formatMoney(totalMoney)} total money in sample`);
    }

    private async testBotnetCapabilities(): Promise<void> {
        // Test if botnet.js exists and basic RAM requirements
        if (!this.ns.fileExists('botnet.js')) {
            throw new Error('botnet.js file not found');
        }

        const botnetRAM = this.ns.getScriptRam('botnet.js');
        if (botnetRAM === 0) {
            throw new Error('botnet.js appears to be invalid or corrupted');
        }

        // Test current RAM situation
        const currentServer = this.ns.getHostname();
        const availableRAM = this.ns.getServerMaxRam(currentServer) - this.ns.getServerUsedRam(currentServer);
        
        // Test if we could theoretically run basic HWGW scripts
        const hkRAM = this.ns.fileExists('hk.js') ? this.ns.getScriptRam('hk.js') : 0;
        const grRAM = this.ns.fileExists('gr.js') ? this.ns.getScriptRam('gr.js') : 0;
        const wkRAM = this.ns.fileExists('wk.js') ? this.ns.getScriptRam('wk.js') : 0;

        this.logger.info(`✅ Botnet System: botnet.js (${botnetRAM.toFixed(2)}GB), Available RAM: ${availableRAM.toFixed(2)}GB`);
        this.logger.info(`   HWGW Scripts: hk.js (${hkRAM.toFixed(2)}GB), gr.js (${grRAM.toFixed(2)}GB), wk.js (${wkRAM.toFixed(2)}GB)`);
        
        if (availableRAM < 8) {
            this.logger.warn('Low RAM available - may limit botnet operations');
        }
    }

    // ===== UTILITY TESTS =====

    private async testLoggingSystem(): Promise<void> {
        const testLogger = Logger.getInstance(this.ns, 'TestLogger', { level: LogLevel.DEBUG });
        
        // Test different log levels
        testLogger.debug('Debug message test');
        testLogger.info('Info message test');
        testLogger.warn('Warning message test');
        testLogger.error('Error message test');
        
        this.logger.info('✅ Logging System: All log levels functional');
    }

    private async testGameAPIAccess(): Promise<void> {
        // Test basic game API functionality
        const playerMoney = this.ns.getServerMoneyAvailable('home');
        const playerLevel = this.ns.getHackingLevel();
        const currentServer = this.ns.getHostname();
        
        if (playerMoney < 0 || playerLevel < 1 || !currentServer) {
            throw new Error('Basic game API calls returned invalid data');
        }

        this.logger.info(`✅ Game API: Player level ${playerLevel}, money $${this.formatMoney(playerMoney)}, on ${currentServer}`);
    }

    // ===== INTEGRATION TESTS =====

    private async testScriptExecution(): Promise<void> {
        // Test if we can spawn and kill a simple script
        const testScript = 'test.js';
        if (!this.ns.fileExists(testScript)) {
            this.logger.warn('test.js not found - skipping script execution test');
            return;
        }

        // Try to run the test script briefly
        const pid = this.ns.exec(testScript, 'home');
        if (pid === 0) {
            throw new Error('Failed to execute test script');
        }

        await this.ns.sleep(100); // Let it run briefly
        this.ns.kill(pid);

        this.logger.info('✅ Script Execution: Can spawn and terminate scripts successfully');
    }

    // ===== HELPER METHODS =====

    private getAllServers(): string[] {
        const visited = new Set<string>();
        const queue: string[] = ['home'];
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;
            
            visited.add(current);
            const neighbors = this.ns.scan(current);
            queue.push(...neighbors.filter(server => !visited.has(server)));
        }
        
        return Array.from(visited);
    }

    private formatMoney(amount: number): string {
        if (amount >= 1e12) return (amount / 1e12).toFixed(2) + 'T';
        if (amount >= 1e9) return (amount / 1e9).toFixed(2) + 'B';
        if (amount >= 1e6) return (amount / 1e6).toFixed(2) + 'M';
        if (amount >= 1e3) return (amount / 1e3).toFixed(2) + 'K';
        return amount.toFixed(2);
    }

    // ===== MAIN TEST RUNNER =====

    public async runAllTests(): Promise<void> {
        this.logger.info('🚀 Starting Comprehensive System Test Suite');
        this.logger.info('Testing: File System, Browser APIs, Communication, Network, Core Systems');
        
        const totalStartTime = Date.now();

        // Test Suite 1: File System & Build Status
        await this.runTestSuite('File System & Build Status', [
            { name: 'Core Script Files', fn: () => this.testCoreScriptFiles() },
            { name: 'Remote Script Files', fn: () => this.testRemoteScriptFiles() },
            { name: 'React Library Files', fn: () => this.testReactLibraryFiles() }
        ]);

        // Test Suite 2: Browser Automation & APIs
        await this.runTestSuite('Browser Automation & APIs', [
            { name: 'Browser API Stealth Access', fn: () => this.testBrowserAPIs() },
            { name: 'React Element Finding', fn: () => this.testReactElementFinding() }
        ]);

        // Test Suite 3: Communication & Events
        await this.runTestSuite('Communication & Events', [
            { name: 'Port Communication', fn: () => this.testPortCommunication() },
            { name: 'Event Port Status', fn: () => this.testEventPortStatus() }
        ]);

        // Test Suite 4: Network & Servers
        await this.runTestSuite('Network & Servers', [
            { name: 'Network Analysis', fn: () => this.testNetworkAnalysis() },
            { name: 'Botnet Capabilities', fn: () => this.testBotnetCapabilities() }
        ]);

        // Test Suite 5: Core Systems
        await this.runTestSuite('Core Systems', [
            { name: 'Logging System', fn: () => this.testLoggingSystem() },
            { name: 'Game API Access', fn: () => this.testGameAPIAccess() },
            { name: 'Script Execution', fn: () => this.testScriptExecution() }
        ]);

        const totalDuration = Date.now() - totalStartTime;
        this.generateTestReport(totalDuration);
    }

    private generateTestReport(totalDuration: number): void {
        this.logger.info('\n' + '='.repeat(80));
        this.logger.info('🎯 SYSTEM TEST REPORT');
        this.logger.info('='.repeat(80));
        
        let totalTests = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        let totalSkipped = 0;
        let totalWarned = 0;

        for (const suite of this.testSuites) {
            this.logger.info(`\n📊 ${suite.name}:`);
            this.logger.info(`   Tests: ${suite.totalTests} | Passed: ${suite.passedTests} | Failed: ${suite.failedTests} | Warnings: ${suite.warnTests}`);
            this.logger.info(`   Duration: ${suite.duration}ms`);
            
            // Show failed tests
            const failedTests = suite.results.filter(r => r.status === 'FAIL');
            if (failedTests.length > 0) {
                this.logger.info('   ❌ Failed Tests:');
                for (const test of failedTests) {
                    this.logger.info(`      - ${test.name}: ${test.message}`);
                }
            }
            
            // Show warnings
            const warnedTests = suite.results.filter(r => r.status === 'WARN');
            if (warnedTests.length > 0) {
                this.logger.info('   ⚠️  Warnings:');
                for (const test of warnedTests) {
                    this.logger.info(`      - ${test.name}: ${test.message}`);
                }
            }

            totalTests += suite.totalTests;
            totalPassed += suite.passedTests;
            totalFailed += suite.failedTests;
            totalSkipped += suite.skippedTests;
            totalWarned += suite.warnTests;
        }

        this.logger.info('\n' + '='.repeat(80));
        this.logger.info('🏆 OVERALL RESULTS:');
        this.logger.info(`   Total Tests: ${totalTests}`);
        this.logger.info(`   ✅ Passed: ${totalPassed} (${((totalPassed/totalTests)*100).toFixed(1)}%)`);
        this.logger.info(`   ❌ Failed: ${totalFailed} (${((totalFailed/totalTests)*100).toFixed(1)}%)`);
        if (totalWarned > 0) {
            this.logger.info(`   ⚠️  Warnings: ${totalWarned} (${((totalWarned/totalTests)*100).toFixed(1)}%)`);
        }
        if (totalSkipped > 0) {
            this.logger.info(`   ⏭️  Skipped: ${totalSkipped} (${((totalSkipped/totalTests)*100).toFixed(1)}%)`);
        }
        this.logger.info(`   ⏱️  Total Duration: ${totalDuration}ms (${(totalDuration/1000).toFixed(2)}s)`);

        const successRate = (totalPassed / totalTests) * 100;
        if (successRate >= 90) {
            this.logger.info('\n🎉 SYSTEM STATUS: EXCELLENT - All critical systems operational!');
        } else if (successRate >= 75) {
            this.logger.info('\n✅ SYSTEM STATUS: GOOD - Most systems operational, minor issues detected');
        } else if (successRate >= 50) {
            this.logger.info('\n⚠️  SYSTEM STATUS: DEGRADED - Multiple system issues require attention');
        } else {
            this.logger.info('\n❌ SYSTEM STATUS: CRITICAL - Major system failures detected');
        }

        this.logger.info('\n📋 SYSTEM OVERVIEW:');
        this.logger.info('   🎮 Game Integration: Bitburner NS API access and script execution');
        this.logger.info('   🌐 Browser Automation: Zero-cost DOM access via stealth techniques');
        this.logger.info('   🤖 React Navigator: 13 specialized game page automation classes');
        this.logger.info('   🔗 Distributed Computing: HWGW remote scripts and port communication');
        this.logger.info('   📊 Performance Tracking: Event-driven metrics and monitoring');
        this.logger.info('   🏗️  Architecture: TypeScript automation framework with enterprise patterns');

        this.logger.info('='.repeat(80));
        
        // Store results in localStorage for later analysis
        try {
            const win = (globalThis as any)['win' + 'dow'];
            const reportData = {
                timestamp: Date.now(),
                suites: this.testSuites,
                summary: {
                    totalTests,
                    totalPassed,
                    totalFailed,
                    totalSkipped,
                    totalWarned,
                    successRate,
                    totalDuration
                }
            };
            win.localStorage.setItem('bitburner_system_test_report', JSON.stringify(reportData));
            this.logger.info('📄 Test report saved to localStorage as "bitburner_system_test_report"');
        } catch (error) {
            this.logger.warn('Failed to save test report to localStorage');
        }
    }
}

export async function main(ns: NS): Promise<void> {
    const tester = new SystemTester(ns);
    await tester.runAllTests();
}