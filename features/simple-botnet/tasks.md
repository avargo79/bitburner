# Simple Autonomous Botnet - Implementation Tasks

## Task Breakdown
**Total Tasks: 10**
**Estimated Development Time: 4-6 hours**
**Implementation Strategy: Single standalone script with inline calculations**

---

## **Phase 1: Core Infrastructure (Tasks 1-3)**

### **Task 1: Create Main Script Structure**
**Priority: HIGH | Estimated Time: 30 minutes**

**Objective**: Set up the basic standalone script architecture with main function and core imports.

**Implementation Steps**:
1. Create `src/simple-botnet.ts` with main(ns: NS) function signature
2. Add TypeScript imports for NS interface
3. Implement basic script argument parsing for configuration
4. Add initial logging structure using ns.print() and ns.tprint()
5. Create main execution loop with configurable sleep intervals

**Acceptance Criteria**:
- [ ] Script executes without errors in Bitburner
- [ ] Accepts command line arguments (target server, thread count)
- [ ] Logs startup messages and basic execution status
- [ ] Implements proper async/await patterns

**Dependencies**: None

---

### **Task 2: Network Discovery Implementation**
**Priority: HIGH | Estimated Time: 45 minutes**

**Objective**: Implement complete network topology discovery using NS API calls.

**Implementation Steps**:
1. Create recursive server discovery function using ns.scan()
2. Implement server rooting logic with ns.nuke() and port crackers
3. Build server capability assessment (RAM, max money, security)
4. Create network topology mapping and available server tracking
5. Add server filtering logic (exclude personal/faction servers)

**Acceptance Criteria**:
- [ ] Discovers all reachable servers in the network
- [ ] Successfully roots servers with available tools
- [ ] Builds accurate server capability database
- [ ] Excludes inappropriate targets from botnet

**Dependencies**: Task 1 (Main Script Structure)

---

### **Task 3: Target Selection Algorithm**
**Priority: HIGH | Estimated Time: 30 minutes**

**Objective**: Implement intelligent target prioritization based on profitability calculations.

**Implementation Steps**:
1. Create inline profit calculation using ns.getServerMaxMoney() and ns.getHackTime()
2. Implement target scoring algorithm (money/time ratio with security adjustment)
3. Add target validation (sufficient money, hackable level requirement)
4. Create dynamic target switching based on changing conditions
5. Implement target blacklisting for failed operations

**Acceptance Criteria**:
- [ ] Selects most profitable available targets
- [ ] Adapts target selection to player skill level
- [ ] Handles target exhaustion gracefully
- [ ] Maintains target priority rankings

**Dependencies**: Task 2 (Network Discovery)

---

## **Phase 2: HWGW Implementation (Tasks 4-6)**

### **Task 4: Basic HWGW Calculations**
**Priority: HIGH | Estimated Time: 45 minutes**

**Objective**: Implement inline HWGW timing and thread calculations without external dependencies.

**Implementation Steps**:
1. Create hack time calculation using ns.getHackTime()
2. Implement grow and weaken time calculations (hack time * multipliers)
3. Add thread calculation functions for each operation type
4. Create security level and money percentage tracking
5. Implement timing offset calculations for batch coordination

**Acceptance Criteria**:
- [ ] Accurately calculates operation timing requirements
- [ ] Determines correct thread counts for desired money percentage
- [ ] Handles security level restoration properly
- [ ] Provides consistent timing for batch coordination

**Dependencies**: Task 3 (Target Selection)

---

### **Task 5: Operation Execution System**
**Priority: HIGH | Estimated Time: 60 minutes**

**Objective**: Implement the core HWGW operation execution with proper NS API calls.

**Implementation Steps**:
1. Create operation launcher using ns.exec() for remote script execution
2. Implement hack operation with calculated threads and timing
3. Add grow operation with money restoration logic
4. Create weaken operations for security level management
5. Add operation status tracking and completion detection

**Acceptance Criteria**:
- [ ] Successfully launches hack/grow/weaken operations
- [ ] Executes operations on available botnet servers
- [ ] Tracks operation completion and results
- [ ] Handles operation failures and retries

**Dependencies**: Task 4 (HWGW Calculations), Remote scripts must exist

---

### **Task 6: Simple Batch Coordination**
**Priority: MEDIUM | Estimated Time: 45 minutes**

**Objective**: Implement basic batch timing to prevent operation conflicts.

**Implementation Steps**:
1. Create batch scheduling system with operation timing offsets
2. Implement batch size calculation based on available server RAM
3. Add batch completion tracking and result aggregation
4. Create next batch preparation while current batch executes
5. Implement adaptive batch timing based on actual execution results

**Acceptance Criteria**:
- [ ] Coordinates multiple operations within batches
- [ ] Prevents operation timing conflicts
- [ ] Scales batch size to available resources
- [ ] Maintains consistent batch execution rhythm

**Dependencies**: Task 5 (Operation Execution)

---

## **Phase 3: Optimization & Control (Tasks 7-10)**

### **Task 7: Resource Management**
**Priority: MEDIUM | Estimated Time: 30 minutes**

**Objective**: Implement intelligent server resource allocation and RAM management.

**Implementation Steps**:
1. Create server RAM capacity tracking and allocation
2. Implement thread distribution across multiple servers
3. Add server load balancing for optimal resource utilization
4. Create overflow handling when demand exceeds capacity
5. Implement server prioritization (prefer high-RAM servers)

**Acceptance Criteria**:
- [ ] Efficiently utilizes all available server RAM
- [ ] Distributes operations across botnet optimally
- [ ] Handles resource constraints gracefully
- [ ] Maximizes concurrent operation throughput

**Dependencies**: Task 5 (Operation Execution)

---

### **Task 8: Performance Monitoring**
**Priority: MEDIUM | Estimated Time: 30 minutes**

**Objective**: Add real-time monitoring and logging for botnet performance tracking.

**Implementation Steps**:
1. Implement money gain tracking and rate calculations
2. Add operation success/failure rate monitoring
3. Create server performance metrics (operations per hour)
4. Implement target profitability validation against predictions
5. Add periodic status reports with key metrics

**Acceptance Criteria**:
- [ ] Tracks money generation rate in real-time
- [ ] Reports operation success rates and failures
- [ ] Monitors server utilization and performance
- [ ] Provides actionable performance insights

**Dependencies**: Task 6 (Batch Coordination)

---

### **Task 9: Error Handling & Recovery**
**Priority: MEDIUM | Estimated Time: 45 minutes**

**Objective**: Implement robust error handling for autonomous operation reliability.

**Implementation Steps**:
1. Add comprehensive try/catch blocks around NS API calls
2. Implement operation timeout detection and recovery
3. Create server failure handling and exclusion logic
4. Add network topology refresh on connection failures
5. Implement graceful degradation when servers become unavailable

**Acceptance Criteria**:
- [ ] Handles NS API errors without crashing
- [ ] Recovers from temporary server unavailability
- [ ] Maintains operation continuity during errors
- [ ] Logs errors appropriately for debugging

**Dependencies**: Task 6 (Batch Coordination)

---

### **Task 10: Autonomous Operation Loop**
**Priority: HIGH | Estimated Time: 30 minutes**

**Objective**: Implement the main autonomous execution loop with proper lifecycle management.

**Implementation Steps**:
1. Create main execution loop with configurable cycle timing
2. Implement graceful shutdown handling and cleanup
3. Add periodic network rediscovery and target reevaluation
4. Create adaptive sleep timing based on operation scheduling
5. Implement script restart detection and state recovery

**Acceptance Criteria**:
- [ ] Runs continuously without manual intervention
- [ ] Adapts to changing network and game conditions
- [ ] Handles script restarts and game resets properly
- [ ] Maintains optimal operation timing and efficiency

**Dependencies**: Task 8 (Performance Monitoring), Task 9 (Error Handling)

---

## **Implementation Dependencies**

### **Required Remote Scripts**
- `src/remote/hack.ts` - Basic hack operation executor
- `src/remote/grow.ts` - Basic grow operation executor  
- `src/remote/weaken.ts` - Basic weaken operation executor

### **External Dependencies**
- Existing network of rooted servers for botnet operation
- Remote file API sync for script deployment
- Basic player hacking level for target access

### **Architecture Constraints**
- Single standalone script pattern - no external utilities
- Inline calculations - no shared libraries
- Direct NS API usage - no abstraction layers
- Stateless operation - fresh data gathering each cycle

## **Testing Strategy**
1. **Unit Testing**: Test each phase independently in-game
2. **Integration Testing**: Verify complete HWGW operation flow
3. **Performance Testing**: Monitor money generation rates and efficiency
4. **Stress Testing**: Test with maximum available botnet servers
5. **Recovery Testing**: Verify error handling and autonomous recovery

## **Success Metrics**
- **Autonomous Operation**: Runs continuously without intervention
- **Resource Utilization**: Uses >90% of available botnet RAM
- **Money Generation**: Achieves predictable income rates
- **Operation Success**: >95% successful HWGW batch completion
- **Error Recovery**: Handles failures without manual restart

---

**Total Implementation Time**: 4-6 hours across 10 focused tasks
**Architecture**: Single standalone script with inline calculations
**Execution Pattern**: Autonomous operation with adaptive resource management