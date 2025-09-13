# Server Management Extraction Plan

## Current Server Management Analysis

### Current Implementation Scope
The server management functionality is currently embedded within the main botnet.ts file, handling:

1. **Server Discovery & Rooting** (Lines 277-284)
2. **Purchased Server Management** (Lines 362-363) 
3. **Script Deployment** (Lines 297-298)
4. **Network Topology Building** (Lines 275)

### Functions to Extract

#### Core Server Management Functions
```typescript
// Currently in botnet.ts - to be extracted
async function executeServerManagementCycle(ns: NS, servers: ServerData[], options: BotnetOptions): Promise<IServerManagementResult>
function performServerRooting(ns: NS, servers: ServerData[]): number
async function managePurchasedServers(ns: NS, servers: ServerData[], maxServers: number, targetRamPower: number): Promise<any>
function deployRemoteScripts(ns: NS, attackers: ServerData[]): void
```

#### Supporting Utilities (from lib/botnet-server-management.ts)
```typescript
function rootServer(ns: NS, hostname: string): boolean
function getViableAttackers(servers: ServerData[]): ServerData[]
function getViableTargets(servers: ServerData[], playerHackLevel: number): ServerData[]
```

## Extracted Server Manager Architecture

### Standalone Script Design: `server-manager.ts`

```typescript
import { NS } from "@ns";
import { ServerData, ServerManagementOptions, ServerManagerResult } from "/lib/server-manager-types";

/**
 * Standalone server management script
 * Handles rooting, purchasing, upgrading, and script deployment
 */
export async function main(ns: NS): Promise<void> {
    const options = parseArguments(ns);
    const manager = new ServerManager(ns, options);
    
    if (options.continuous) {
        await manager.runContinuous();
    } else {
        const result = await manager.runOnce();
        manager.printResults(result);
    }
}

class ServerManager {
    private ns: NS;
    private options: ServerManagementOptions;
    private logger: ServerLogger;
    
    constructor(ns: NS, options: ServerManagementOptions) {
        this.ns = ns;
        this.options = options;
        this.logger = new ServerLogger(ns, options.debug);
    }
    
    async runOnce(): Promise<ServerManagerResult> {
        const discovery = await this.discoverNetwork();
        const rooting = await this.performRooting(discovery.newServers);
        const purchasing = await this.managePurchasedServers(discovery.allServers);
        const deployment = await this.deployScripts(discovery.attackers);
        
        return {
            discovery,
            rooting,
            purchasing,
            deployment,
            timestamp: Date.now()
        };
    }
    
    async runContinuous(): Promise<void> {
        let cycles = 0;
        while (true) {
            try {
                const result = await this.runOnce();
                this.logger.logCycleResults(cycles++, result);
                
                await this.ns.sleep(this.options.cycleDelay);
            } catch (error) {
                this.logger.error(`Server management error: ${error}`);
                await this.ns.sleep(5000); // Error recovery delay
            }
        }
    }
}
```

### Core Components

#### 1. **Network Discovery Engine**
```typescript
class NetworkDiscoveryEngine {
    private cache: Map<string, ServerData> = new Map();
    private lastFullScan = 0;
    
    async discoverNetwork(forceFullScan = false): Promise<DiscoveryResult> {
        const now = Date.now();
        const needsFullScan = forceFullScan || 
                             (now - this.lastFullScan) > this.options.fullScanInterval;
        
        if (needsFullScan) {
            return this.performFullNetworkScan();
        } else {
            return this.performIncrementalScan();
        }
    }
    
    private async performFullNetworkScan(): Promise<DiscoveryResult> {
        const allServers = this.scanNetworkRecursively('home');
        const serverData = this.buildServerDataBatch(allServers);
        
        // Update cache
        this.cache.clear();
        serverData.forEach(server => this.cache.set(server.hostname, server));
        this.lastFullScan = Date.now();
        
        return {
            allServers: serverData,
            newServers: this.identifyNewServers(serverData),
            changedServers: [],
            scanType: 'full'
        };
    }
    
    private async performIncrementalScan(): Promise<DiscoveryResult> {
        const knownServers = Array.from(this.cache.values());
        const updatedData = this.refreshServerData(knownServers);
        const newServers = this.detectNewServers();
        
        return {
            allServers: [...updatedData, ...newServers],
            newServers: newServers,
            changedServers: this.detectChanges(updatedData),
            scanType: 'incremental'
        };
    }
}
```

#### 2. **Server Rooting Engine**
```typescript
class ServerRootingEngine {
    private portOpeners = [
        { name: 'BruteSSH.exe', func: (ns: NS, hostname: string) => ns.brutessh(hostname) },
        { name: 'FTPCrack.exe', func: (ns: NS, hostname: string) => ns.ftpcrack(hostname) },
        { name: 'relaySMTP.exe', func: (ns: NS, hostname: string) => ns.relaysmtp(hostname) },
        { name: 'HTTPWorm.exe', func: (ns: NS, hostname: string) => ns.httpworm(hostname) },
        { name: 'SQLInject.exe', func: (ns: NS, hostname: string) => ns.sqlinject(hostname) }
    ];
    
    async rootServers(servers: ServerData[]): Promise<RootingResult> {
        const results: RootingResult = {
            attempted: [],
            successful: [],
            failed: [],
            skipped: []
        };
        
        const availablePrograms = this.detectAvailablePrograms();
        
        for (const server of servers) {
            if (server.hasAdminRights) {
                results.skipped.push({ hostname: server.hostname, reason: 'already_rooted' });
                continue;
            }
            
            if (!this.canRoot(server, availablePrograms)) {
                results.skipped.push({ 
                    hostname: server.hostname, 
                    reason: 'insufficient_tools',
                    required: server.numOpenPortsRequired,
                    available: availablePrograms.length
                });
                continue;
            }
            
            try {
                results.attempted.push(server.hostname);
                const success = await this.attemptRoot(server, availablePrograms);
                
                if (success) {
                    results.successful.push(server.hostname);
                    this.logger.info(`Successfully rooted ${server.hostname}`);
                } else {
                    results.failed.push({ hostname: server.hostname, reason: 'root_failed' });
                }
            } catch (error) {
                results.failed.push({ hostname: server.hostname, reason: error.toString() });
                this.logger.error(`Failed to root ${server.hostname}: ${error}`);
            }
        }
        
        return results;
    }
    
    private async attemptRoot(server: ServerData, availablePrograms: Program[]): Promise<boolean> {
        // Open required ports
        const requiredPorts = Math.min(server.numOpenPortsRequired, availablePrograms.length);
        
        for (let i = 0; i < requiredPorts; i++) {
            try {
                availablePrograms[i].func(this.ns, server.hostname);
            } catch (error) {
                this.logger.debug(`Port opener ${availablePrograms[i].name} failed on ${server.hostname}`);
            }
        }
        
        // Attempt to get root access
        try {
            this.ns.nuke(server.hostname);
            return this.ns.hasRootAccess(server.hostname);
        } catch (error) {
            return false;
        }
    }
}
```

#### 3. **Purchased Server Manager**
```typescript
class PurchasedServerManager {
    async managePurchasedServers(
        existingServers: ServerData[], 
        budget: number,
        maxServers: number,
        targetRamPower: number
    ): Promise<PurchasedServerResult> {
        
        const currentPurchased = existingServers.filter(s => s.purchasedByPlayer);
        const result: PurchasedServerResult = {
            purchased: [],
            upgraded: [],
            deleted: [],
            skipped: [],
            totalCost: 0
        };
        
        // Phase 1: Upgrade existing servers if beneficial
        const upgradeResults = await this.upgradeExistingServers(currentPurchased, budget, targetRamPower);
        result.upgraded = upgradeResults.upgraded;
        result.totalCost += upgradeResults.cost;
        budget -= upgradeResults.cost;
        
        // Phase 2: Purchase new servers if slots available
        const slotsAvailable = maxServers - currentPurchased.length;
        if (slotsAvailable > 0 && budget > 0) {
            const purchaseResults = await this.purchaseNewServers(slotsAvailable, budget, targetRamPower);
            result.purchased = purchaseResults.purchased;
            result.totalCost += purchaseResults.cost;
        }
        
        // Phase 3: Consider replacing low-RAM servers
        const replacementResults = await this.considerReplacements(currentPurchased, budget, targetRamPower);
        result.deleted = replacementResults.deleted;
        result.purchased.push(...replacementResults.purchased);
        result.totalCost += replacementResults.netCost;
        
        return result;
    }
    
    private async upgradeExistingServers(
        servers: ServerData[], 
        budget: number, 
        targetRamPower: number
    ): Promise<UpgradeResult> {
        const upgraded: string[] = [];
        let totalCost = 0;
        
        // Sort by ROI - upgrade servers that give best RAM increase per dollar
        const upgradeOpportunities = servers
            .map(server => this.calculateUpgradeROI(server, targetRamPower))
            .filter(opportunity => opportunity.worthwhile && opportunity.cost <= budget)
            .sort((a, b) => b.roi - a.roi);
        
        for (const opportunity of upgradeOpportunities) {
            if (totalCost + opportunity.cost > budget) break;
            
            try {
                this.ns.deleteServer(opportunity.hostname);
                this.ns.purchaseServer(opportunity.hostname, opportunity.newRamSize);
                
                upgraded.push(opportunity.hostname);
                totalCost += opportunity.cost;
                budget -= opportunity.cost;
                
                this.logger.info(`Upgraded ${opportunity.hostname} to ${opportunity.newRamSize}GB for $${opportunity.cost.toLocaleString()}`);
            } catch (error) {
                this.logger.error(`Failed to upgrade ${opportunity.hostname}: ${error}`);
            }
        }
        
        return { upgraded, cost: totalCost };
    }
}
```

#### 4. **Script Deployment Engine**
```typescript
class ScriptDeploymentEngine {
    private scriptCache = new Map<string, string[]>();
    
    async deployScripts(targetServers: ServerData[]): Promise<DeploymentResult> {
        const result: DeploymentResult = {
            serversUpdated: [],
            scriptsDeployed: [],
            errors: [],
            totalBytes: 0
        };
        
        const requiredScripts = this.getRequiredScripts();
        
        for (const server of targetServers) {
            try {
                const deploymentNeeded = await this.checkDeploymentNeeded(server, requiredScripts);
                
                if (deploymentNeeded.length > 0) {
                    await this.deployToServer(server.hostname, deploymentNeeded);
                    
                    result.serversUpdated.push(server.hostname);
                    result.scriptsDeployed.push(...deploymentNeeded);
                    result.totalBytes += this.calculateScriptSize(deploymentNeeded);
                }
            } catch (error) {
                result.errors.push({
                    server: server.hostname,
                    error: error.toString()
                });
            }
        }
        
        return result;
    }
    
    private async checkDeploymentNeeded(server: ServerData, requiredScripts: string[]): Promise<string[]> {
        const existingScripts = this.ns.ls(server.hostname);
        
        return requiredScripts.filter(script => {
            // Check if script exists and is up to date
            if (!existingScripts.includes(script)) return true;
            
            // Check if local version is newer (simple timestamp comparison)
            const localTimestamp = this.getScriptTimestamp(script);
            const remoteTimestamp = this.scriptCache.get(`${server.hostname}:${script}`);
            
            return !remoteTimestamp || localTimestamp > parseInt(remoteTimestamp);
        });
    }
    
    private async deployToServer(hostname: string, scripts: string[]): Promise<void> {
        const results = scripts.map(script => ({
            script,
            success: this.ns.scp(script, hostname)
        }));
        
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            throw new Error(`Failed to deploy scripts: ${failed.map(f => f.script).join(', ')}`);
        }
        
        // Update cache with deployment timestamps
        const timestamp = Date.now().toString();
        scripts.forEach(script => {
            this.scriptCache.set(`${hostname}:${script}`, timestamp);
        });
        
        this.logger.debug(`Deployed ${scripts.length} scripts to ${hostname}`);
    }
}
```

## Integration with Botnet

### Communication Interface

The server manager will communicate with the main botnet through:

#### 1. **Status Files** (Persistent State)
```typescript
// Written by server-manager.ts, read by botnet.ts
interface ServerManagerStatus {
    lastUpdate: number;
    totalServers: number;
    rootedServers: number;
    purchasedServers: number;
    networkTopology: ServerData[];
    managementActive: boolean;
}
```

#### 2. **Event-Based Communication**
```typescript
// localStorage events for real-time updates
function notifyBotnetOfChanges(changes: ServerManagerResult): void {
    const event = {
        type: 'server-management-update',
        timestamp: Date.now(),
        changes: {
            newServers: changes.rooting.successful,
            purchasedServers: changes.purchasing.purchased,
            scriptsDeployed: changes.deployment.serversUpdated
        }
    };
    
    localStorage.setItem('botnet-server-events', JSON.stringify(event));
}
```

#### 3. **Shared Configuration**
```typescript
// Shared config file: server-management-config.json
interface SharedServerConfig {
    maxServers: number;
    targetRamPower: number;
    rootingEnabled: boolean;
    purchasingEnabled: boolean;
    scriptDeploymentEnabled: boolean;
    cycleDelay: number;
    budget: {
        maxSpending: number;
        upgradeThreshold: number;
    };
}
```

### Standalone Operation Benefits

#### 1. **Independent Lifecycle**
- Server manager runs continuously in background
- Botnet can focus purely on HWGW operations
- Reduced complexity in main botnet loop

#### 2. **Resource Isolation**
- Server management uses minimal RAM (~2-5GB)
- No interference with HWGW batch allocation
- Can run on home server without competition

#### 3. **Fault Tolerance**
- Server manager failures don't affect botnet operation
- Botnet failures don't affect server management
- Independent restart and recovery

#### 4. **Optimization Opportunities**
- Server manager can optimize for different metrics
- Specialized caching and batching strategies
- Focused performance tuning for management tasks

## Implementation Timeline

### Phase 1: Core Extraction (1-2 days)
1. Create `server-manager.ts` with basic structure
2. Extract network discovery functions
3. Extract rooting functionality
4. Basic status file communication

### Phase 2: Advanced Features (2-3 days)
1. Purchased server management
2. Script deployment engine
3. Event-based communication
4. Configuration management

### Phase 3: Integration and Testing (1-2 days)
1. Integrate with existing botnet
2. Test standalone operation
3. Performance optimization
4. Error handling and recovery

### Phase 4: Advanced Optimization (ongoing)
1. Predictive server purchasing
2. Intelligent upgrade timing
3. Network topology optimization
4. Advanced monitoring and alerts

## Configuration Options

### Command Line Arguments
```typescript
const serverManagerArgs = [
    ['continuous', false],           // Run continuously vs one-shot
    ['cycle-delay', 30000],         // Delay between management cycles
    ['max-servers', 25],            // Maximum purchased servers
    ['target-ram-power', 20],       // Target RAM size (2^20 = 1TB)
    ['rooting-enabled', true],      // Enable automatic rooting
    ['purchasing-enabled', true],    // Enable server purchasing
    ['deployment-enabled', true],    // Enable script deployment
    ['budget-limit', 1000000000],   // Maximum spending per cycle
    ['upgrade-threshold', 0.5],     // Minimum ROI for upgrades
    ['debug', false],               // Debug logging
    ['status-file', 'server-manager-status.txt'], // Status file location
];
```

### Integration Example
```bash
# Run server manager continuously in background
run server-manager.js --continuous --cycle-delay 60000 --debug

# Run botnet with server management disabled (managed externally)
run botnet.js --no-rooting --repboost
```

This extraction plan creates a truly standalone server management system that reduces the main botnet complexity by ~200 lines while providing better fault tolerance, independent optimization, and cleaner separation of concerns.