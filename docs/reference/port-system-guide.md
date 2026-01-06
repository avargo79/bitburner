# Bitburner Port System: Comprehensive Guide

## Table of Contents
1. [Port API Overview](#port-api-overview)
2. [How Ports Work](#how-ports-work)
3. [Common Patterns](#common-patterns)
4. [Best Practices](#best-practices)
5. [RAM Implications](#ram-implications)
6. [Limitations & Gotchas](#limitations--gotchas)
7. [Architecture Patterns](#architecture-patterns)
8. [Code Examples](#code-examples)

---

## Port API Overview

### Available APIs

**Basic Operations** (0 GB RAM each):
- `ns.readPort(portNumber)` - Read and remove first item from port queue
- `ns.writePort(portNumber, data)` - Write data to port (returns popped item if full)
- `ns.peek(portNumber)` - Read first item WITHOUT removing it
- `ns.clearPort(portNumber)` - Clear all data from port
- `ns.tryWritePort(portNumber, data)` - Attempt write, returns false if port is full

**Advanced Port Handle** (0 GB RAM):
- `ns.getPortHandle(portNumber)` - Returns a NetscriptPort object with additional methods

### NetscriptPort Interface

When you call `ns.getPortHandle(portNumber)`, you get an object with these methods:

```typescript
interface NetscriptPort {
  write(value: any): any;        // Write data, returns popped item if full
  tryWrite(value: any): boolean; // Returns false if port is full
  read(): any;                   // Read and remove first item
  peek(): any;                   // Read without removing
  clear(): void;                 // Empty the port
  empty(): boolean;              // Check if port is empty
  full(): boolean;               // Check if port is full
  nextWrite(): Promise<void>;    // Async: wait until port is written to
}
```

---

## How Ports Work

### Core Characteristics

**Ports are FIFO Queues**:
- First-In-First-Out data structure
- Reading pops items off the front
- Writing adds items to the back

**Global & Shared**:
- **20 ports available** (port numbers 1-20)
- Accessible from ANY script on ANY server
- Same port number = same data everywhere
- Great for inter-script communication

**In-Memory Only**:
- ⚠️ **Ports are NOT persistent** - data is lost when game closes/reloads
- For persistent storage, use files with `ns.read()` / `ns.write()`
- Ports are cleared on game restart

**Capacity Limits**:
- Default: **50 items per port** (customizable in game settings)
- Size of individual items doesn't matter (can store large objects)
- When full, `write()` pops oldest item; `tryWrite()` returns false

**Empty Port Behavior**:
- Reading empty port returns the string `"NULL PORT DATA"`
- Check with: `if (data === "NULL PORT DATA")` or `port.empty()`

**Data Types**:
- Supports any data type that can be cloned with `structuredClone()`
- Numbers, strings, arrays, objects all work
- ⚠️ **Cannot store** class instances, functions, or circular references
- Data is automatically deep-cloned when written

---

## Common Patterns

### Pattern 1: Command/Control Pattern

**Coordinator sends commands to workers:**

```javascript
// coordinator.js - Command dispatcher
export async function main(ns) {
  const CMD_PORT = 1;
  
  // Send commands to workers
  ns.writePort(CMD_PORT, { action: 'hack', target: 'n00dles', threads: 100 });
  ns.writePort(CMD_PORT, { action: 'grow', target: 'foodnstuff', threads: 50 });
}

// worker.js - Command consumer
export async function main(ns) {
  const CMD_PORT = 1;
  const port = ns.getPortHandle(CMD_PORT);
  
  while (true) {
    if (!port.empty()) {
      const command = port.read();
      if (command !== "NULL PORT DATA") {
        await executeCommand(ns, command);
      }
    }
    await ns.sleep(100);
  }
}
```

### Pattern 2: Status/Results Reporting

**Workers report results back to coordinator:**

```javascript
// worker.js - Report results
export async function main(ns) {
  const RESULTS_PORT = 2;
  
  const startMoney = ns.getServerMoneyAvailable(target);
  await ns.hack(target);
  const endMoney = ns.getServerMoneyAvailable(target);
  
  ns.writePort(RESULTS_PORT, {
    action: 'hack',
    target: target,
    moneyGained: startMoney - endMoney,
    timestamp: Date.now()
  });
}

// stats-collector.js - Collect metrics
export async function main(ns) {
  const RESULTS_PORT = 2;
  const port = ns.getPortHandle(RESULTS_PORT);
  
  let totalGained = 0;
  
  while (true) {
    while (!port.empty()) {
      const result = port.read();
      if (result !== "NULL PORT DATA") {
        totalGained += result.moneyGained;
        ns.print(`Total earned: $${totalGained}`);
      }
    }
    await ns.sleep(1000);
  }
}
```

### Pattern 3: Request/Response (RPC)

**Client-server pattern with response channels:**

```javascript
// client.js - Request data
export async function main(ns) {
  const REQUEST_PORT = 3;
  const RESPONSE_PORT = 4;
  
  // Send request
  ns.writePort(REQUEST_PORT, {
    requestId: Date.now(),
    action: 'analyzeServer',
    target: 'n00dles'
  });
  
  // Wait for response
  const responsePort = ns.getPortHandle(RESPONSE_PORT);
  await responsePort.nextWrite(); // Async wait for data
  
  const response = responsePort.read();
  ns.print(`Analysis: ${JSON.stringify(response)}`);
}

// server.js - Process requests
export async function main(ns) {
  const REQUEST_PORT = 3;
  const RESPONSE_PORT = 4;
  
  const requestPort = ns.getPortHandle(REQUEST_PORT);
  
  while (true) {
    await requestPort.nextWrite(); // Wait for requests
    
    const request = requestPort.read();
    if (request !== "NULL PORT DATA") {
      const result = ns.getServer(request.target);
      
      ns.writePort(RESPONSE_PORT, {
        requestId: request.requestId,
        data: result
      });
    }
  }
}
```

### Pattern 4: Synchronization/Coordination

**Coordinate timing between scripts:**

```javascript
// batcher.js - Coordinate HGW batch
export async function main(ns) {
  const SYNC_PORT = 5;
  
  // Launch batch
  ns.exec('hack.js', 'home', 1, 'target');
  ns.exec('grow.js', 'home', 1, 'target');
  ns.exec('weaken.js', 'home', 1, 'target');
  
  // Wait for all to complete
  let completed = 0;
  const port = ns.getPortHandle(SYNC_PORT);
  
  while (completed < 3) {
    await port.nextWrite();
    const msg = port.read();
    if (msg !== "NULL PORT DATA") {
      ns.print(`${msg.script} completed`);
      completed++;
    }
  }
  
  ns.print('Batch complete!');
}

// hack.js / grow.js / weaken.js - Report completion
export async function main(ns) {
  const SYNC_PORT = 5;
  const target = ns.args[0];
  
  await ns.hack(target); // or grow/weaken
  
  ns.writePort(SYNC_PORT, {
    script: ns.getScriptName(),
    target: target,
    timestamp: Date.now()
  });
}
```

### Pattern 5: Shared State Cache

**Cache expensive data for reuse:**

```javascript
// cache-manager.js - Maintain cache
export async function main(ns) {
  const CACHE_PORT = 6;
  const UPDATE_PORT = 7;
  
  let serverCache = {};
  
  // Initial population
  for (const server of getAllServers(ns)) {
    serverCache[server] = ns.getServer(server);
  }
  
  // Write initial cache
  ns.clearPort(CACHE_PORT);
  ns.writePort(CACHE_PORT, serverCache);
  
  // Listen for update requests
  const updatePort = ns.getPortHandle(UPDATE_PORT);
  
  while (true) {
    if (!updatePort.empty()) {
      const req = updatePort.read();
      if (req !== "NULL PORT DATA" && req.refresh) {
        serverCache[req.server] = ns.getServer(req.server);
        ns.clearPort(CACHE_PORT);
        ns.writePort(CACHE_PORT, serverCache);
      }
    }
    await ns.sleep(1000);
  }
}

// worker.js - Use cached data
export async function main(ns) {
  const CACHE_PORT = 6;
  
  // Read cached data (peek to not consume)
  const cache = ns.peek(CACHE_PORT);
  
  if (cache !== "NULL PORT DATA") {
    const serverInfo = cache['n00dles'];
    // Use serverInfo without calling ns.getServer()
  }
}
```

---

## Best Practices

### Port Assignment Strategies

**1. Dedicated Ports per Module**
```javascript
const PORTS = {
  DAEMON_COMMANDS: 1,
  DAEMON_STATUS: 2,
  HACK_RESULTS: 3,
  GROW_RESULTS: 4,
  WEAKEN_RESULTS: 5,
  SERVER_CACHE: 6,
  FACTION_SYNC: 7,
  STOCK_DATA: 8,
  GANG_UPDATES: 9,
  CORP_UPDATES: 10
};
```

**2. Request/Response Pairs**
- Use consecutive ports: Request on N, Response on N+1
- Example: Request on port 11, Response on port 12

**3. Broadcast vs Point-to-Point**
- Broadcast: One writer, many readers (use `peek()`)
- Point-to-Point: One writer, one reader (use `read()`)

### Message Format Conventions

**Use Structured Objects:**
```javascript
// Good: Structured with metadata
ns.writePort(PORT, {
  type: 'HACK_RESULT',
  target: 'n00dles',
  threads: 100,
  moneyGained: 1000000,
  timestamp: Date.now(),
  source: ns.getHostname()
});

// Bad: Ambiguous data
ns.writePort(PORT, "n00dles|1000000");
```

**JSON for Complex Data:**
```javascript
// Store complex structures
const data = {
  servers: [...],
  stats: {...},
  config: {...}
};

ns.writePort(PORT, data); // Auto-cloned
```

### Error Handling

**Check for Full Ports:**
```javascript
// Method 1: Check if write successful
const popped = ns.writePort(PORT, data);
if (popped !== null) {
  ns.print('WARNING: Port was full, lost data: ' + JSON.stringify(popped));
}

// Method 2: Use tryWrite
if (!ns.tryWritePort(PORT, data)) {
  ns.print('ERROR: Port full, cannot write');
  // Handle backpressure
  await ns.sleep(100);
}

// Method 3: Check before writing
const port = ns.getPortHandle(PORT);
if (!port.full()) {
  port.write(data);
}
```

**Validate Data on Read:**
```javascript
const data = ns.readPort(PORT);

// Always check for empty port
if (data === "NULL PORT DATA") {
  return; // No data available
}

// Validate structure
if (typeof data === 'object' && data.type === 'EXPECTED_TYPE') {
  processData(data);
} else {
  ns.print('WARNING: Unexpected data format: ' + JSON.stringify(data));
}
```

### Race Conditions

**Problem: Multiple writers/readers can collide**

```javascript
// UNSAFE: Race condition
if (!port.empty()) {
  const data = port.read(); // Another script might read first!
  process(data);
}

// SAFE: Atomic read-and-check
const data = port.read();
if (data !== "NULL PORT DATA") {
  process(data);
}
```

**Use Message IDs for Ordering:**
```javascript
let nextId = 0;

function sendMessage(ns, port, payload) {
  ns.writePort(port, {
    id: nextId++,
    timestamp: Date.now(),
    ...payload
  });
}

// Receiver can detect out-of-order or missing messages
```

---

## RAM Implications

### Zero RAM Cost

**All port operations cost 0 GB RAM:**
- `ns.readPort()` - 0 GB
- `ns.writePort()` - 0 GB
- `ns.peek()` - 0 GB
- `ns.clearPort()` - 0 GB
- `ns.tryWritePort()` - 0 GB
- `ns.getPortHandle()` - 0 GB
- All NetscriptPort methods - 0 GB

### RAM Optimization Pattern: Thin Worker + Fat Coordinator

**Problem:** Worker scripts need expensive NS functions

**Solution:** Workers send requests via ports, coordinator executes them

```javascript
// worker.js - TINY RAM (only uses ports + basic functions)
export async function main(ns) {
  const target = ns.args[0];
  const REQUEST_PORT = 1;
  const RESPONSE_PORT = 2;
  
  // Request analysis (no RAM cost for writePort)
  ns.writePort(REQUEST_PORT, {
    id: Math.random(),
    action: 'getWeakenTime',
    target: target
  });
  
  // Wait for response
  const responsePort = ns.getPortHandle(RESPONSE_PORT);
  await responsePort.nextWrite();
  const response = responsePort.read();
  
  // Use the data
  await ns.sleep(response.weakenTime);
  await ns.weaken(target);
}

// coordinator.js - Has all the RAM budget
export async function main(ns) {
  const REQUEST_PORT = 1;
  const RESPONSE_PORT = 2;
  
  const requestPort = ns.getPortHandle(REQUEST_PORT);
  
  while (true) {
    await requestPort.nextWrite();
    const req = requestPort.read();
    
    if (req !== "NULL PORT DATA") {
      let result;
      
      switch (req.action) {
        case 'getWeakenTime':
          result = { weakenTime: ns.getWeakenTime(req.target) };
          break;
        case 'getServerMaxMoney':
          result = { maxMoney: ns.getServerMaxMoney(req.target) };
          break;
        // ... more cases
      }
      
      ns.writePort(RESPONSE_PORT, { id: req.id, ...result });
    }
  }
}
```

### Cache Pattern for RAM Reduction

```javascript
// server-cache.js - Build once, share everywhere
export async function main(ns) {
  const CACHE_PORT = 10;
  
  const allServers = getAllServers(ns); // Find all servers
  const serverData = {};
  
  for (const hostname of allServers) {
    serverData[hostname] = {
      hostname: hostname,
      maxRam: ns.getServerMaxRam(hostname),
      maxMoney: ns.getServerMaxMoney(hostname),
      minSecurity: ns.getServerMinSecurityLevel(hostname),
      requiredHackLevel: ns.getServerRequiredHackingLevel(hostname),
      numPorts: ns.getServerNumPortsRequired(hostname),
      hasRoot: ns.hasRootAccess(hostname),
    };
  }
  
  ns.clearPort(CACHE_PORT);
  ns.writePort(CACHE_PORT, serverData);
  
  ns.print(`Cached ${allServers.length} servers to port ${CACHE_PORT}`);
}

// worker.js - Access without RAM cost
export async function main(ns) {
  const CACHE_PORT = 10;
  
  const cache = ns.peek(CACHE_PORT); // 0 GB RAM
  if (cache !== "NULL PORT DATA") {
    const serverInfo = cache['n00dles'];
    ns.print(`Max money: ${serverInfo.maxMoney}`);
  }
}
```

---

## Limitations & Gotchas

### Capacity Limits

**Default: 50 items per port**
- Configurable in game options
- When full, `writePort()` discards oldest item
- Use `tryWritePort()` to avoid data loss

```javascript
// Handle backpressure
const port = ns.getPortHandle(1);

while (port.full()) {
  ns.print('Port full, waiting...');
  await ns.sleep(50);
}

port.write(data);
```

### Data Serialization Issues

**What WORKS:**
```javascript
// Primitives
ns.writePort(1, 42);
ns.writePort(1, "hello");
ns.writePort(1, true);

// Arrays
ns.writePort(1, [1, 2, 3]);
ns.writePort(1, ['a', 'b', 'c']);

// Objects
ns.writePort(1, { key: 'value', nested: { data: 123 } });

// Mixed
ns.writePort(1, { arr: [1,2,3], obj: { x: 'y' }, num: 42 });
```

**What FAILS:**
```javascript
// Functions
ns.writePort(1, () => {}); // ERROR

// Class instances
class MyClass {}
ns.writePort(1, new MyClass()); // ERROR

// Circular references
const obj = {};
obj.self = obj;
ns.writePort(1, obj); // ERROR
```

### Non-Persistent Data

**Ports are cleared on:**
- Game close/reload
- Page refresh
- Save/load game
- Bitnode destruction/reset

**Mitigation:**
```javascript
// Periodically save critical data to file
export async function main(ns) {
  const DATA_PORT = 1;
  const SAVE_FILE = 'port-backup.txt';
  
  while (true) {
    const data = ns.peek(DATA_PORT);
    if (data !== "NULL PORT DATA") {
      await ns.write(SAVE_FILE, JSON.stringify(data), 'w');
    }
    await ns.sleep(60000); // Save every minute
  }
}

// On startup, restore from file
const savedData = ns.read('port-backup.txt');
if (savedData) {
  ns.writePort(DATA_PORT, JSON.parse(savedData));
}
```

### Performance Considerations

**Ports are fast, but not instant:**
- Reading/writing is synchronous
- `nextWrite()` is async (can await new data)
- Avoid tight loops that spam port operations

```javascript
// BAD: Tight loop
while (true) {
  if (!port.empty()) {
    process(port.read());
  }
  // No sleep = high CPU usage
}

// GOOD: Use nextWrite() or add sleep
while (true) {
  await port.nextWrite(); // Efficient waiting
  process(port.read());
}

// GOOD: Add sleep for polling
while (true) {
  if (!port.empty()) {
    process(port.read());
  }
  await ns.sleep(100);
}
```

### Empty Port Detection

**The string "NULL PORT DATA" is returned for empty ports:**

```javascript
// CORRECT
const data = ns.readPort(1);
if (data === "NULL PORT DATA") {
  // Port is empty
}

// ALSO CORRECT
const port = ns.getPortHandle(1);
if (port.empty()) {
  // Port is empty
}

// INCORRECT
if (!data) { // "NULL PORT DATA" is truthy!
  // This won't work
}
```

### Multiple Readers Can Race

**Problem:** If multiple scripts read the same port, messages can be stolen

```javascript
// Script A reads port 1
const data = ns.readPort(1); // Gets message

// Script B reads port 1 (simultaneously)
const data = ns.readPort(1); // Gets DIFFERENT message (or "NULL PORT DATA")
```

**Solutions:**
1. **Dedicated ports per consumer**
2. **Broadcast pattern** (use `peek()` instead of `read()`)
3. **Message routing** (include recipient in message)

---

## Architecture Patterns

### Pattern 1: Command Dispatcher

**Central coordinator sends commands to worker pool**

```
             ┌──────────────┐
             │  Coordinator │
             │   (daemon)   │
             └───────┬──────┘
                     │ Writes commands
                     ▼
              ┌─────────────┐
              │ Command Port│
              │   (Port 1)  │
              └──────┬──────┘
           Reads┌────┼────┐Reads
                │    │    │
                ▼    ▼    ▼
             ┌────┬────┬────┐
             │ W1 │ W2 │ W3 │
             └────┴────┴────┘
```

**When to use:**
- Centralized task distribution
- Load balancing across workers
- Dynamic worker assignment

### Pattern 2: Status Aggregator

**Multiple workers report to central stats collector**

```
  ┌────┬────┬────┐
  │ W1 │ W2 │ W3 │
  └─┬──┴──┬─┴──┬─┘
    │     │    │ All write results
    └────┐│┌───┘
         │││
         ▼▼▼
   ┌──────────────┐
   │ Results Port │
   │   (Port 2)   │
   └──────┬───────┘
          │ Reads & aggregates
          ▼
   ┌──────────────┐
   │Stats Collector│
   └──────────────┘
```

**When to use:**
- Metrics collection
- Progress monitoring
- Logging/debugging

### Pattern 3: Request/Response (RPC)

**Client-server pattern with bidirectional communication**

```
   ┌────────┐                    ┌────────┐
   │ Client │                    │ Server │
   └───┬────┘                    └───┬────┘
       │ Write request              │
       │                            │
       ▼                            │
   ┌──────────────┐                │
   │Request Port  │                │
   │   (Port 3)   │◄───────────────┘
   └──────────────┘       Reads
        │
        │
   ┌──────────────┐
   │Response Port │
   │   (Port 4)   │◄─────────────┐
   └──────┬───────┘               │
          │ Reads          Writes │
          ▼                       │
   ┌────────┐                    ┌┴───────┐
   │ Client │                    │ Server │
   └────────┘                    └────────┘
```

**When to use:**
- Remote procedure calls
- RAM optimization (thin clients)
- Centralized data/logic

### Pattern 4: Pub/Sub (Broadcast)

**One publisher, multiple subscribers**

```
        ┌───────────┐
        │ Publisher │
        └─────┬─────┘
              │ Writes once
              ▼
        ┌──────────┐
        │ Data Port│
        │ (Port 5) │
        └─────┬────┘
   peek() ┌───┼───┐ peek()
          │   │   │
          ▼   ▼   ▼
       ┌────────────┐
       │ S1  S2  S3 │ All read same data
       └────────────┘
```

**When to use:**
- Shared configuration
- Broadcast updates
- Cached data distribution

**Implementation:**
```javascript
// Publisher: Write once
ns.clearPort(5);
ns.writePort(5, broadcastData);

// Subscribers: Peek (don't consume)
const data = ns.peek(5);
if (data !== "NULL PORT DATA") {
  useData(data);
}
```

### Pattern 5: Pipeline

**Data flows through stages**

```
┌───────┐    ┌───────┐    ┌───────┐    ┌───────┐
│Stage 1│───▶│Port 1 │───▶│Stage 2│───▶│Port 2 │
└───────┘    └───────┘    └───────┘    └───────┘
                               │
                               ▼
                          ┌───────┐    ┌───────┐
                          │Stage 3│───▶│Port 3 │
                          └───────┘    └───────┘
```

**When to use:**
- Data processing workflows
- ETL patterns
- Multi-stage batch operations

---

## Code Examples

### Example 1: Complete HGW Coordination with Ports

```javascript
// coordinator.js - Orchestrates hack/grow/weaken
export async function main(ns) {
  const TASK_PORT = 1;
  const RESULT_PORT = 2;
  const target = ns.args[0] || 'n00dles';
  
  // Launch workers
  const workers = 10;
  for (let i = 0; i < workers; i++) {
    ns.exec('worker.js', 'home', 1, i);
  }
  
  // Distribute tasks
  while (true) {
    const server = ns.getServer(target);
    
    // Determine what's needed
    if (server.hackDifficulty > server.minDifficulty + 5) {
      ns.writePort(TASK_PORT, { action: 'weaken', target: target });
    } else if (server.moneyAvailable < server.moneyMax * 0.75) {
      ns.writePort(TASK_PORT, { action: 'grow', target: target });
    } else {
      ns.writePort(TASK_PORT, { action: 'hack', target: target });
    }
    
    // Check for results
    const resultPort = ns.getPortHandle(RESULT_PORT);
    while (!resultPort.empty()) {
      const result = resultPort.read();
      if (result !== "NULL PORT DATA") {
        ns.print(`${result.action} on ${result.target}: +$${result.moneyGained || 0}`);
      }
    }
    
    await ns.sleep(100);
  }
}

// worker.js - Executes tasks
export async function main(ns) {
  const TASK_PORT = 1;
  const RESULT_PORT = 2;
  const workerId = ns.args[0];
  
  const taskPort = ns.getPortHandle(TASK_PORT);
  
  ns.print(`Worker ${workerId} ready`);
  
  while (true) {
    await taskPort.nextWrite(); // Wait for task
    
    const task = taskPort.read();
    if (task === "NULL PORT DATA") continue;
    
    ns.print(`Worker ${workerId}: ${task.action} on ${task.target}`);
    
    let result = { action: task.action, target: task.target, workerId: workerId };
    
    switch (task.action) {
      case 'hack':
        result.moneyGained = await ns.hack(task.target);
        break;
      case 'grow':
        result.growthMultiplier = await ns.grow(task.target);
        break;
      case 'weaken':
        result.securityReduction = await ns.weaken(task.target);
        break;
    }
    
    ns.writePort(RESULT_PORT, result);
  }
}
```

### Example 2: Server Analysis Service (RAM Optimization)

```javascript
// analysis-service.js - High RAM, provides analysis to others
export async function main(ns) {
  const REQUEST_PORT = 10;
  const RESPONSE_PORT = 11;
  
  ns.print('Analysis service started on ports 10/11');
  
  const requestPort = ns.getPortHandle(REQUEST_PORT);
  
  while (true) {
    await requestPort.nextWrite();
    const request = requestPort.read();
    
    if (request === "NULL PORT DATA") continue;
    
    let response = { requestId: request.id };
    
    try {
      switch (request.method) {
        case 'getHackTime':
          response.result = ns.getHackTime(request.target);
          break;
        case 'getGrowTime':
          response.result = ns.getGrowTime(request.target);
          break;
        case 'getWeakenTime':
          response.result = ns.getWeakenTime(request.target);
          break;
        case 'getServerMaxMoney':
          response.result = ns.getServerMaxMoney(request.target);
          break;
        case 'getServerMinSecurity':
          response.result = ns.getServerMinSecurityLevel(request.target);
          break;
        case 'getServer':
          response.result = ns.getServer(request.target);
          break;
        default:
          response.error = 'Unknown method: ' + request.method;
      }
    } catch (error) {
      response.error = String(error);
    }
    
    ns.writePort(RESPONSE_PORT, response);
  }
}

// client.js - Low RAM, requests analysis
export async function main(ns) {
  const REQUEST_PORT = 10;
  const RESPONSE_PORT = 11;
  const target = ns.args[0] || 'n00dles';
  
  // Request analysis
  const requestId = Date.now() + Math.random();
  
  ns.writePort(REQUEST_PORT, {
    id: requestId,
    method: 'getHackTime',
    target: target
  });
  
  // Wait for response
  const responsePort = ns.getPortHandle(RESPONSE_PORT);
  
  while (true) {
    await responsePort.nextWrite();
    const response = responsePort.read();
    
    if (response !== "NULL PORT DATA" && response.requestId === requestId) {
      if (response.error) {
        ns.print('ERROR: ' + response.error);
      } else {
        ns.print(`Hack time for ${target}: ${response.result}ms`);
      }
      break;
    }
  }
}
```

### Example 3: Metrics Collection System

```javascript
// metric-collector.js - Aggregates stats from all workers
export async function main(ns) {
  const METRICS_PORT = 15;
  
  const stats = {
    totalHacks: 0,
    totalGrows: 0,
    totalWeakens: 0,
    moneyGained: 0,
    startTime: Date.now()
  };
  
  const metricsPort = ns.getPortHandle(METRICS_PORT);
  
  ns.tail();
  ns.disableLog('ALL');
  
  while (true) {
    while (!metricsPort.empty()) {
      const metric = metricsPort.read();
      
      if (metric !== "NULL PORT DATA") {
        switch (metric.type) {
          case 'hack':
            stats.totalHacks++;
            stats.moneyGained += metric.amount || 0;
            break;
          case 'grow':
            stats.totalGrows++;
            break;
          case 'weaken':
            stats.totalWeakens++;
            break;
        }
      }
    }
    
    // Display stats
    const runtime = (Date.now() - stats.startTime) / 1000;
    ns.clearLog();
    ns.print('=== METRICS ===');
    ns.print(`Runtime: ${runtime.toFixed(1)}s`);
    ns.print(`Total Hacks: ${stats.totalHacks}`);
    ns.print(`Total Grows: ${stats.totalGrows}`);
    ns.print(`Total Weakens: ${stats.totalWeakens}`);
    ns.print(`Money Gained: $${ns.formatNumber(stats.moneyGained)}`);
    ns.print(`$/sec: $${ns.formatNumber(stats.moneyGained / runtime)}`);
    
    await ns.sleep(1000);
  }
}

// Modified worker to report metrics
export async function main(ns) {
  const METRICS_PORT = 15;
  const target = ns.args[0];
  
  const amount = await ns.hack(target);
  
  // Report metric
  ns.writePort(METRICS_PORT, {
    type: 'hack',
    target: target,
    amount: amount,
    timestamp: Date.now()
  });
}
```

---

## Summary

**Ports are powerful for:**
- ✅ Inter-script communication (0 GB RAM)
- ✅ Command/control patterns
- ✅ Status reporting & metrics
- ✅ RAM optimization (thin clients)
- ✅ Synchronization between scripts

**Ports are NOT suitable for:**
- ❌ Persistent storage (use files)
- ❌ Very large data streams (50 item limit)
- ❌ Storing class instances or functions
- ❌ Circular data structures

**Key Takeaways:**
1. All port operations are **0 GB RAM**
2. Ports are **global** (accessible from any script, any server)
3. Ports are **FIFO queues** (first-in, first-out)
4. Ports are **not persistent** (cleared on game restart)
5. Use `peek()` for **read-only/broadcast** patterns
6. Use `nextWrite()` for **efficient async waiting**
7. Always check for `"NULL PORT DATA"` when reading
8. Use `tryWritePort()` to avoid data loss on full ports

**Recommended Port Allocation:**
- Ports 1-5: Core daemon/worker communication
- Ports 6-10: Module-specific (gang, corp, stocks, etc.)
- Ports 11-15: Services (RPC, cache, analysis)
- Ports 16-20: Temporary/debugging

Happy hacking! 🚀
