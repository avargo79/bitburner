# Botnet V3: Event-Driven from Scratch (Game-Optimized Approach)

## 📋 MAJOR PIVOT: V3 Instead of V2 Refactor

**Decision Rationale**: After analyzing botnet-v2.ts (2,587 lines of complex logic), creating a new botnet-v3 is **significantly easier and safer** than retrofitting events into the existing system.

**Technical Status**: ✅ **PORT SYSTEM VALIDATED** - RAM costs confirmed: **0GB additional cost** for port operations (user POC testing completed)

## Overview

This plan creates a **new botnet-v3** built with **event-driven architecture from day one**. Instead of modifying the complex 2,587-line botnet-v2.ts, we build a **clean, focused system** that can reference V2 components when needed while maintaining V2 stability for existing users.

## Current State Analysis

**Why V3 Instead of V2 Refactor**:
- **botnet.ts**: 994 lines (original, working)
- **botnet-v2.ts**: 2,587 lines (complex TwoPhaseSystemManager, BatchPlanner, advanced HWGW)
- **Risk Assessment**: Modifying V2's complex architecture risks breaking existing functionality
- **Clean Slate Advantage**: V3 can be built event-driven from day one, simpler and more focused

**Existing Remote Scripts**: 
- `simple-hack.js`, `simple-grow.js`, `simple-weaken.js`, `simple-share.js` (basic operations, no events)
- All perform single operations with timing delays, exit silently
- V3 will create new event-enabled remote scripts while V2 continues using existing ones

## V3 Architecture Design

### Core Design Principles
1. **Event-driven from day one**: Port-based communication built into the foundation
2. **Simple and focused**: Start with ~500 lines, grow only as needed
3. **Game-appropriate**: Optimized for Bitburner constraints and player experience  
4. **Safe development**: V2 keeps running while V3 is developed and tested
5. **Performance-oriented**: Use events for better batch coordination and resource allocation

### Architecture Components

#### 1. Port-Based Event System
**Communication Method**: Bitburner port 20 for all cross-script communication
**Event Format**: Simple pipe-delimited strings: `operation_done|target|result|threads`

**Example Events**:
```
hack_done|n00dles|500000|10
grow_done|n00dles|1.5|5  
weaken_done|n00dles|2|3
batch_complete|n00dles|success|25
```

#### 2. Event-Enabled Remote Scripts (V3)
**New Scripts** (coexist with V2's simple-*.js):
- `src/remote/hk.ts` - Hack operation with completion events (RAM optimized name)
- `src/remote/gr.ts` - Grow operation with completion events (RAM optimized name)  
- `src/remote/wk.ts` - Weaken operation with completion events (RAM optimized name)

**Event Publishing Pattern**:
```typescript
async function publishEvent(ns: NS, type: string, target: string, result: any, threads: number): Promise<void> {
  try {
    const event = `${type}|${target}|${result}|${threads}`;
    ns.getPortHandle(20).write(event);
  } catch (error) {
    ns.print(`Event publish failed: ${error}`);
  }
}

// Usage in remote script
export async function main(ns: NS): Promise<void> {
  const target = ns.args[0] as string;
  const startTime = Date.now();
  
  try {
    const result = await ns.hack(target);
    await publishEvent(ns, 'hack_done', target, result || 0, ns.getRunningScript()?.threads || 1);
  } catch (error) {
    await publishEvent(ns, 'hack_failed', target, error.message, ns.getRunningScript()?.threads || 1);
  }
}
```

#### 3. V3 Main Controller
**Simple Event-Driven Loop**: ~300-500 lines focused on event processing and batch coordination

```typescript
export class BotnetV3Controller {
  private eventQueue: string[] = [];
  
  async main(ns: NS): Promise<void> {
    while (true) {
      // Process events from port 20
      await this.processEvents(ns);
      
      // Plan new batches based on current state + event data
      await this.planAndExecuteBatches(ns);
      
      // Main loop timing
      await ns.sleep(200);
    }
  }
  
  async processEvents(ns: NS): Promise<void> {
    const port = ns.getPortHandle(20);
    let eventsProcessed = 0;
    
    while (!port.empty() && eventsProcessed < 50) {
      const event = port.read() as string;
      await this.handleEvent(ns, event);
      eventsProcessed++;
      await ns.sleep(1); // Browser safety
    }
  }
}
```

## Simple 3-Step Implementation Strategy

### **Step 1: Create Basic V3 with Events (6-8 hours)**
**Goal**: Prove event-driven concept works with minimal functionality

**Deliverables**:
- `src/botnet-v3.ts` - Basic main controller with event processing (~300 lines)
- `src/remote/hk.ts` - Hack script with event publishing (RAM optimized name)
- Port 20 communication working between scripts

**Success Criteria**:
- V3 controller receives hack completion events
- Events logged with target, result, timing info
- No interference with existing V2 operations

**Architecture Focus**: 
- Single target, simple batch execution
- Event processing with basic safety (iteration limits, error handling)
- Minimal UI - console logging to prove concept

### **Step 2: Add Batch Coordination (8-10 hours)**
**Goal**: Use events for smarter HWGW batch timing and coordination

**Deliverables**:  
- Add `gr.ts`, `wk.ts` remote scripts with RAM-optimized names
- Implement batch tracking and completion detection
- Smart scheduling: start new batches when previous ones complete (instead of timer-based)

**Success Criteria**:
- Full HWGW batches execute with event coordination
- Batch failure rate lower than V2 (target: <5%)
- Faster batch turnaround due to event-driven scheduling

**Architecture Focus**:
- Track batch components and completion states
- Use completion events to trigger immediate re-planning
- Add basic performance metrics (money/hour, success rate)

### **Step 3: Performance Optimization & Dashboard (6-8 hours)**
**Goal**: Optimize resource allocation and provide player visibility

**Deliverables**:  
- Server performance tracking based on event data
- Smart resource allocation (prioritize high-performing servers)
- Simple dashboard showing success rates, money/hour, active batches

**Success Criteria**:
- V3 outperforms V2 in money/hour generation
- Clear player visibility into system performance
- Automatic adaptation to server performance changes

**Architecture Focus**:
- Event-driven performance analytics
- Dynamic server prioritization
- Player-friendly status display

## Expected Benefits

### Performance Improvements (Measurable)
- **Faster batch coordination**: Events eliminate timer-based waiting
- **Better resource allocation**: Use actual performance data from events
- **Higher success rates**: Event-driven error detection and retry logic
- **Increased money/hour**: More efficient operations and reduced waste

### Player Experience Improvements  
- **Real-time visibility**: See operations completing in real-time
- **Clear performance metrics**: Success rates, money/hour, efficiency stats
- **Better debugging**: Event logs show exactly what succeeded/failed
- **Easy A/B testing**: Compare V2 vs V3 performance side-by-side

## Migration Strategy

### Safe Development Approach
1. **V3 runs independently**: No impact on existing V2 users
2. **Separate script names**: `botnet-v3.ts`, `hack-v3.ts`, etc.  
3. **A/B testing capability**: Run both V2 and V3, measure performance
4. **Easy rollback**: If V3 has issues, V2 remains unaffected

### Success Measurement
- **Money per hour**: V3 should exceed V2 performance
- **Batch success rate**: Target >95% successful batch completion
- **Resource efficiency**: Better RAM utilization based on actual performance
- **System stability**: Consistent performance, no browser lockup

## Technical Foundation

### Browser Safety Requirements (CRITICAL)
All event processing loops MUST include:
```typescript
while (condition && iterations < MAX_ITERATIONS) {
  // Process events
  iterations++;
  await ns.sleep(1); // MANDATORY: Prevent browser lockup
}
```

### Event Processing Safety
- **Max events per cycle**: 50 events max per main loop iteration
- **Iteration limits**: Prevent infinite loops in all event processing
- **Error isolation**: Failed event processing doesn't crash the system
- **Port capacity management**: Handle port overflow gracefully

This V3 approach delivers the event-driven benefits with **significantly less complexity and risk** than retrofitting events into the 2,587-line botnet-v2.ts system.