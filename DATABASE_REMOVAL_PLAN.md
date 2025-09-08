# Database Removal Plan - Comprehensive Analysis

## **CURRENT DATABASE ARCHITECTURE**

### **Core Database Infrastructure**:
- **`src/lib/database.ts`** - IndexedDB wrapper, 9 store types (Servers, NS_Data, Tasks, etc.)
- **`src/lib/configuration.ts`** - Configuration management layer
- **`src/lib/system.ts`** - DynamicScript system for NS API calls
- **`src/lib/scheduler.ts`** - Task scheduling framework
- **`src/models/ScriptTask.ts`** - Task abstraction layer

### **Database Usage Categories**:

## **🟢 ALREADY STANDALONE (No Changes Needed)**
#### **Production Systems**:
- ✅ **`botnet.ts`** - Zero database dependencies
- ✅ **`contracts.ts`** + helpers - Zero database dependencies  
- ✅ **`stocks.ts`** - Zero database dependencies
- ✅ **`hacknet.ts`** - Zero database dependencies
- ✅ **All `remote/*.ts` HWGW scripts** (except prep.ts, wgh.loop.ts)

## **🟡 DATABASE-DEPENDENT BUT CONVERTIBLE**

#### **Diagnostic Tools** (Can be made standalone):
1. **`debug-batches.ts`** - Uses IScriptServer from database for server list
   - **Replacement**: Use `ns.scan()` recursive network discovery
2. **`ram-diagnostic.ts`** - Already mostly standalone, minimal DB usage

#### **Legacy Remote Scripts** (Remove entirely - obsoleted by botnet.ts):
3. **`remote/prep.ts`** - Basic prep script using database for server state
   - **Action**: Remove entirely - `botnet.ts` has superior integrated prep logic
4. **`remote/wgh.loop.ts`** - Simple infinite loop using database for server state  
   - **Action**: Remove entirely - `botnet.ts` has advanced HWGW coordination

#### **Obsolete Configuration Scripts** (Remove entirely):
5. **`printConfig.ts`** - Uses database Configuration class (no other usage found)
   - **Action**: Remove entirely - no other scripts use the database Configuration system

#### **Development/Utility Scripts**:
6. **`hudmanager.ts`** - Player data display from database
   - **Action**: Convert to direct NS API calls or remove
7. **`open.ts`** - Server opening utility using database
   - **Action**: Convert to direct NS API calls
8. **`probe.ts`** - Network analysis using database
   - **Action**: Convert to direct NS API calls

## **🔴 HEAVILY DATABASE-DEPENDENT (Remove or Minimal Keep)**

#### **Database Management Scripts**:
6. **`deleteDb.ts`** - Database deletion utility
   - **Action**: Remove entirely
7. **`start.ts`** - Database initialization + reset detection
   - **Action**: Simplify to basic game state detection without persistence
8. **`printTasks.ts`** - Task database viewer
   - **Action**: Remove (no tasks to view)
9. **`task.ts`** - Task configuration management  
   - **Action**: Remove (no tasks to manage)
10. **`resetTaskLastRun.ts`** - Task timer reset
    - **Action**: Remove (no tasks)

#### **Database-Dependent Tasks** (Remove entirely):
11. **`tasks/updateHackDataTask.ts`** - Server hack data maintenance
12. **`tasks/updatePlayerTask.ts`** - Player data caching  
13. **`tasks/updateServersTask.ts`** - Server state caching
14. **`tasks/updateResetInfoTask.ts`** - Reset detection

## **📋 REMOVAL STRATEGY**

### **Phase 1: Remove Core Database Infrastructure** (High Impact)
```
❌ DELETE: src/lib/database.ts
❌ DELETE: src/lib/configuration.ts  
❌ DELETE: src/lib/system.ts (DynamicScript)
❌ DELETE: src/lib/scheduler.ts
❌ DELETE: src/models/ScriptTask.ts
❌ DELETE: All 4 files in src/tasks/ directory
```

### **Phase 2: Remove Database Management Scripts**
```
❌ DELETE: deleteDb.ts, printTasks.ts, task.ts, resetTaskLastRun.ts, printConfig.ts
🔄 SIMPLIFY: start.ts (remove database init, keep basic reset detection)
```

### **Phase 3: Convert Diagnostic Tools**
```
🔄 CONVERT: debug-batches.ts (use ns.scan() for server discovery)
🔄 CONVERT: hudmanager.ts (use direct NS API calls)
🔄 CONVERT: open.ts, probe.ts (use direct NS API calls)
```

### **Phase 4: Remove Legacy Remote Scripts** 
```
❌ DELETE: remote/prep.ts (obsoleted by botnet.ts prep logic)
❌ DELETE: remote/wgh.loop.ts (obsoleted by botnet.ts HWGW coordination)
```

### **Phase 5: Clean Up Models and Libraries**
```
❌ DELETE: Any unused model files (IScriptPlayer, IScriptServer, etc.)
✅ KEEP: Game-specific models (StockPosition, TradingStrategy, etc.)
✅ KEEP: lib/contracts.ts (28 algorithms - address migration later)
❌ DELETE: lib/sequentialTaskRunner.ts (task system removed)
```

## **🎯 REPLACEMENT PATTERNS**

### **Server Data Access**:
```typescript
// OLD (Database):
const servers = await database.getAll<IScriptServer>(DatabaseStoreName.Servers);
const server = await database.get<IScriptServer>(DatabaseStoreName.Servers, hostname);

// NEW (Direct NS API):
function getServerList(ns: NS): string[] {
    const network = new Set<string>();
    function scan(host: string = 'home') {
        network.add(host);
        ns.scan(host).filter(h => !network.has(h)).forEach(scan);
    }
    scan();
    return [...network];
}
const server = ns.getServer(hostname);
```

### **Configuration Management Analysis**:
```typescript
// DATABASE CONFIGURATION (Remove entirely):
// src/lib/configuration.ts - Database-backed Configuration class
// src/printConfig.ts - Only script using database Configuration (REMOVE)

// INTERNAL CONFIGURATIONS (Keep - they're standalone):
// stocks.ts - Has own loadConfiguration() with hardcoded defaults
// hacknet.ts - Has own HacknetConfig interface with hardcoded defaults
```

### **Player Data Access**:
```typescript
// OLD (Database cache):
const player = await database.get<IScriptPlayer>(DatabaseStoreName.NS_Data, 'ns.getPlayer');

// NEW (Direct API):
const player = ns.getPlayer();
```

## **🔥 FINAL ARCHITECTURE AFTER REMOVAL**

### **Production Systems (100% Standalone)**:
- **`botnet.ts`** - Complete server management + HWGW batching
- **`contracts.ts`** + helpers - Contract solving system
- **`stocks.ts`** - Trading automation  
- **`hacknet.ts`** - Hacknet optimization

### **Simplified Utilities**:
- **`debug-batches.ts`** - HWGW analysis (using ns.scan())
- **`killremote.ts`** - Cleanup utility (already standalone)
- **`ram-diagnostic.ts`** - RAM analysis (minimal conversion)
- **Simplified `start.ts`** - Basic reset detection only

### **Core Libraries Kept**:
- **`lib/network.ts`, `lib/consts.ts`, `lib/react.ts`** - Non-database utilities
- **`lib/contracts.ts`** - Contract solving algorithms (28 total - standalone has only 12)
- **Game-specific models** - Stock trading, etc.

### **Eliminated Completely**:
- **Entire database layer** - IndexedDB, persistence, caching
- **Task system** - Scheduling, dynamic scripts, configuration  
- **15+ database-dependent scripts** - Converted or removed

## **💥 IMPACT ASSESSMENT**

### **Benefits**:
1. **Massive RAM reduction** - No database overhead (can be 50-100MB+)
2. **Real-time accuracy** - Direct NS API calls, no stale cache data
3. **Simplified architecture** - No complex persistence layers
4. **Faster startup** - No database initialization delays
5. **Better reliability** - No database corruption issues
6. **Cleaner configuration** - Production systems already use simple internal configs

### **Key Finding - Configuration Systems**:
- **Database Configuration is unused** - Only `printConfig.ts` imports it
- **Production systems already independent** - `stocks.ts` and `hacknet.ts` use internal configs
- **No conversion needed** - Can simply delete database Configuration class

### **Risks**:
1. **Repeated API calls** - May be slower than cached data
2. **Loss of historical data** - No persistence across game resets
3. **Development effort** - Significant conversion work needed

### **Mitigation**:
- **Smart caching** - Use in-memory variables for frequently accessed data
- **Batch operations** - Group NS API calls efficiently  
- **Essential state only** - Only persist truly critical data via files

## **RECOMMENDATION**: **PROCEED WITH FULL DATABASE REMOVAL**

The current database system is **over-engineered for the problem domain**. Bitburner's NS API provides real-time access to all needed data, making persistent caching largely unnecessary. The **4 production standalone systems prove this approach works excellently**.

**Next Step**: Execute Phase 1 removal of core database infrastructure, then systematically convert remaining scripts to use direct NS API calls.

---

## **DETAILED FILE INVENTORY**

### **Files with Database Dependencies** (17 total):
```
src/debug-batches.ts - IScriptServer lookup
src/deleteDb.ts - Database deletion
src/hudmanager.ts - Player data display  
src/lib/configuration.ts - Config management
src/lib/database.ts - Core DB wrapper
src/lib/scheduler.ts - Task scheduling
src/lib/system.ts - DynamicScript system
src/models/ScriptTask.ts - Task abstraction
src/open.ts - Server opening utility
src/printConfig.ts - Config display (database Configuration class)
src/printTasks.ts - Task viewer
src/probe.ts - Network analysis
src/ram-diagnostic.ts - RAM analysis (minimal DB usage)
src/resetTaskLastRun.ts - Task timer reset
src/start.ts - DB initialization
src/task.ts - Task management
src/tasks/updateHackDataTask.ts - Server data maintenance
src/tasks/updatePlayerTask.ts - Player data cache
src/tasks/updateResetInfoTask.ts - Reset detection
src/tasks/updateServersTask.ts - Server state cache
```

### **Legacy Remote Scripts to Remove** (2 total - obsoleted by botnet.ts):
```
src/remote/prep.ts - Basic prep (replaced by botnet.ts integrated prep)
src/remote/wgh.loop.ts - Simple loop (replaced by botnet.ts HWGW coordination)
```

### **Files Already Database-Free** (8 main scripts):
```
src/botnet.ts - Standalone server management + HWGW
src/contracts.ts - Standalone contract solver
src/contract-*.ts - Contract helper scripts (3 files)
src/stocks.ts - Standalone trading system (internal config)
src/hacknet.ts - Standalone hacknet optimization (internal config)
src/killremote.ts - Cleanup utility
src/remote/hwgw.*.ts - HWGW operation scripts (4 files)
src/remote/hwg.ts - Alternative HWGW script
src/remote/share.ts - Share power script
```

## **IMPLEMENTATION CHECKLIST**

### **Phase 1 - Core Infrastructure Removal**:
- [ ] Remove `src/lib/database.ts`
- [ ] Remove `src/lib/configuration.ts`
- [ ] Remove `src/lib/system.ts`
- [ ] Remove `src/lib/scheduler.ts`
- [ ] Remove `src/models/ScriptTask.ts`
- [ ] Remove entire `src/tasks/` directory (4 files)
- [ ] Verify TypeScript compilation after removals

### **Phase 2 - Database Management Scripts**:
- [ ] Remove `deleteDb.ts`
- [ ] Remove `printTasks.ts`
- [ ] Remove `task.ts`
- [ ] Remove `resetTaskLastRun.ts`
- [ ] Remove `printConfig.ts`
- [ ] Simplify `start.ts` (remove DB init)

### **Phase 3 - Convert Diagnostic Tools**:
- [ ] Convert `debug-batches.ts` to use `ns.scan()`
- [ ] Convert `hudmanager.ts` to direct NS API
- [ ] Convert `open.ts` to direct NS API
- [ ] Convert `probe.ts` to direct NS API

### **Phase 4 - Remove Legacy Remote Scripts**:
- [ ] Remove `remote/prep.ts` (obsoleted by botnet.ts)
- [ ] Remove `remote/wgh.loop.ts` (obsoleted by botnet.ts)

### **Phase 5 - Final Cleanup**:
- [ ] Remove unused model files
- [ ] Keep `lib/contracts.ts` (address algorithm migration later)
- [ ] Remove `lib/sequentialTaskRunner.ts`
- [ ] Final TypeScript compilation verification
- [ ] Test all standalone systems still work
- [ ] Update documentation/README