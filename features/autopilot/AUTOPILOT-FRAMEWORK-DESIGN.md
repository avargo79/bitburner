# Bitburner Autopilot Framework - Iterative Design Document

## Framework-First Approach: Building for Extensibility

### Design Philosophy

Instead of building a monolithic autopilot, we'll create **composable frameworks** that provide value at each iteration and can be combined into increasingly sophisticated automation.

## Core Framework Layers

### Layer 1: Foundation Frameworks (Weeks 1-4)
**Goal:** Independent, immediately useful frameworks

#### 1.1 Game State Framework
```typescript
// Standalone game state monitoring with zero dependencies
interface IGameStateProvider {
    getCurrentState(): GameState;
    subscribeToChanges(callback: (state: GameState, previous: GameState) => void): Subscription;
    getHistoricalData(timeRange: TimeRange): GameState[];
}

class GameStateManager implements IGameStateProvider {
    // Zero dependencies - can be used standalone
    // Provides immediate value for manual scripts
    // Foundation for all other frameworks
}
```

**Immediate Value:** Any script can use this for game state awareness
**Complexity:** LOW - No decision making, just data collection

#### 1.2 Task Execution Framework
```typescript
// Generic task execution with retry/recovery - no game logic
interface IExecutableTask {
    id: string;
    priority: number;
    canExecute(): Promise<boolean>;
    execute(): Promise<TaskResult>;
    onFailure(error: Error): Promise<RecoveryAction>;
}

class TaskExecutor {
    // Manages any kind of task - not autopilot specific
    // Provides queue, retry, recovery, monitoring
    // Zero game logic - pure execution framework
}
```

**Immediate Value:** Any automation can use this task system
**Complexity:** LOW - Pure execution mechanics

#### 1.3 Configuration Framework
```typescript
// Generic configuration management
interface IConfigurable {
    getConfig<T>(key: string): T;
    setConfig<T>(key: string, value: T): void;
    validateConfig(config: object): ValidationResult;
}

class ConfigurationManager implements IConfigurable {
    // Handles persistence, validation, defaults
    // Works with any system requiring configuration
}
```

**Immediate Value:** Standardized config across all systems
**Complexity:** LOW - Data management only

### Layer 2: Game-Specific Frameworks (Weeks 5-8)
**Goal:** Game-aware frameworks built on Layer 1 foundations

#### 2.1 Decision Framework
```typescript
// Game-aware decision making built on game state framework
interface IDecisionMaker {
    evaluateOptions<T>(options: T[], criteria: DecisionCriteria): RankedOption<T>[];
    shouldExecute(task: IGameTask, context: GameContext): boolean;
}

class GameDecisionEngine implements IDecisionMaker {
    constructor(
        private gameState: IGameStateProvider,
        private guide: GuideBridge
    ) {}
    // Uses Layer 1 frameworks as foundation
}
```

#### 2.2 Automation Framework
```typescript
// Combines decision making with task execution
class AutomationOrchestrator {
    constructor(
        private taskExecutor: TaskExecutor,
        private decisionEngine: IDecisionMaker,
        private gameState: IGameStateProvider
    ) {}
    
    // Orchestrates automated gameplay using all Layer 1 frameworks
}
```

### Layer 3: Specialized Autopilots (Weeks 9+)
**Goal:** Specific autopilot implementations using all frameworks

#### 3.1 Faction Autopilot
```typescript
class FactionAutopilot extends AutomationOrchestrator {
    // Specialized for faction joining and reputation farming
    // Built entirely on lower-layer frameworks
}
```

#### 3.2 Augmentation Autopilot
```typescript
class AugmentationAutopilot extends AutomationOrchestrator {
    // Specialized for augmentation purchasing decisions
    // Built entirely on lower-layer frameworks
}
```

## Iterative Development Strategy

### Iteration 1 (Weeks 1-2): Game State Foundation
**Deliverable:** Standalone game state monitoring
```bash
# Immediate user value
run game-state-monitor.js --watch --export-data
```

**Success Criteria:**
- [ ] Reliable game state snapshots
- [ ] Change detection working
- [ ] Export functionality for analysis
- [ ] Zero dependencies on other systems

**Risk:** LOW - Pure data collection

### Iteration 2 (Weeks 3-4): Task Execution Engine
**Deliverable:** Generic task runner
```bash
# Users can define custom tasks
run task-executor.js --config=my-tasks.json
```

**Success Criteria:**
- [ ] Priority queue working
- [ ] Retry/recovery mechanisms
- [ ] Task monitoring and logging
- [ ] Works with any task type

**Risk:** LOW - No game-specific logic

### Iteration 3 (Weeks 5-6): Basic Game Automation
**Deliverable:** Simple faction automation
```bash
# First real automation using frameworks
run faction-autopilot.js --target=CyberSec --work=hack
```

**Success Criteria:**
- [ ] Combines game state + task execution
- [ ] Basic faction joining works
- [ ] Error handling implemented
- [ ] User can see immediate automation value

**Risk:** MEDIUM - First integration point

### Iteration 4 (Weeks 7-8): Decision Intelligence
**Deliverable:** ROI-based augmentation decisions
```bash
# Intelligent purchasing decisions
run augment-autopilot.js --budget=1000000 --roi-threshold=2.0
```

**Success Criteria:**
- [ ] Decision framework operational
- [ ] Integration with guide system
- [ ] Intelligent purchasing decisions
- [ ] Performance monitoring

**Risk:** MEDIUM - Complex decision logic

### Iteration 5+ (Weeks 9+): Full Autopilot
**Deliverable:** Complete automated gameplay
```bash
# Full autopilot using all frameworks
run autopilot.js --bitnode=1 --strategy=balanced
```

## Framework Benefits

### 1. **Independent Value Delivery**
Each framework provides immediate utility:
- Game state monitor useful for any script
- Task executor useful for any automation
- Configuration manager useful across systems

### 2. **Reduced Risk**
- No "big bang" integration
- Each layer tested independently
- Clear failure boundaries
- Easy rollback of individual components

### 3. **Maintainability**
- Clear separation of concerns
- Testable components
- Modular updates possible
- Framework reuse across projects

### 4. **Extensibility**
- New autopilots easy to create
- Third-party framework usage
- Community contribution points
- Plugin architecture possible

## Complexity Management Strategies

### 1. **Interface-Driven Design**
```typescript
// Every framework defined by interface first
interface IGameStateProvider { /* ... */ }
interface ITaskExecutor { /* ... */ }
interface IDecisionMaker { /* ... */ }

// Implementations can be swapped/upgraded independently
```

### 2. **Dependency Injection**
```typescript
// No hard-coded dependencies
class AutopilotSystem {
    constructor(
        private gameState: IGameStateProvider,
        private taskExecutor: ITaskExecutor,
        private decisionMaker: IDecisionMaker
    ) {}
}
```

### 3. **Event-Driven Architecture**
```typescript
// Loose coupling through events
gameState.subscribe('moneyChanged', (event) => {
    decisionEngine.reevaluateOptions();
});
```

### 4. **Configuration-Driven Behavior**
```typescript
// Behavior changes through config, not code changes
const autopilotConfig = {
    strategies: ['faction-first', 'augment-optimization'],
    riskTolerance: 0.7,
    priorities: { money: 0.3, experience: 0.7 }
};
```

## Revised Implementation Timeline

### Phase 1: Foundation (Weeks 1-4)
- **Week 1-2:** Game state monitoring framework
- **Week 3-4:** Task execution framework
- **Deliverable:** Two standalone, useful frameworks

### Phase 2: Integration (Weeks 5-8)
- **Week 5-6:** Decision making framework + basic automation
- **Week 7-8:** Configuration management + error handling
- **Deliverable:** Working faction automation

### Phase 3: Intelligence (Weeks 9-12)
- **Week 9-10:** Advanced decision algorithms
- **Week 11-12:** Multi-system coordination
- **Deliverable:** Intelligent augmentation automation

### Phase 4: Full Autopilot (Weeks 13-16)
- **Week 13-14:** Complete system integration
- **Week 15-16:** Performance optimization + monitoring
- **Deliverable:** Production-ready autopilot

## Success Metrics Per Phase

### Foundation Phase
- [ ] Frameworks usable independently
- [ ] Zero integration dependencies
- [ ] Clear API documentation
- [ ] Community adoption possible

### Integration Phase  
- [ ] Frameworks compose cleanly
- [ ] First automation working end-to-end
- [ ] Error boundaries functioning
- [ ] Performance acceptable

### Intelligence Phase
- [ ] Decision quality measurable
- [ ] ROI calculations accurate
- [ ] Strategy adaptation working
- [ ] Edge cases handled

### Full Autopilot Phase
- [ ] Complete BitNode automation
- [ ] Performance better than manual
- [ ] Error rate < 5%
- [ ] User satisfaction > 85%

## Risk Mitigation

### Technical Risks
- **Complexity Explosion:** Framework boundaries prevent this
- **Integration Issues:** Interface-driven design minimizes coupling
- **Performance Problems:** Incremental optimization possible
- **Game Updates Breaking System:** Modular design allows targeted fixes

### Project Risks
- **Scope Creep:** Framework approach naturally limits scope per iteration
- **Timeline Pressure:** Independent frameworks provide early value
- **Team Coordination:** Clear framework ownership possible
- **Technical Debt:** Interface stability prevents framework pollution

## Conclusion

The original PRD vision is achievable, but requires a **framework-first approach** to manage complexity and ensure iterative delivery. This revised design:

1. **Reduces Risk:** Independent frameworks with clear boundaries
2. **Enables Iteration:** Each framework delivers immediate value
3. **Manages Complexity:** Interface-driven design with loose coupling
4. **Ensures Maintainability:** Modular architecture with clear separation
5. **Provides Extensibility:** Framework reuse and community contribution

**Recommendation:** Proceed with framework-first approach, starting with game state monitoring as the foundation.