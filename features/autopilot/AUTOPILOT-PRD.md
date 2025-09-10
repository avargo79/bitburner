# Bitburner Autopilot System - Product Requirements Document (PRD)

## Executive Summary

The Bitburner Autopilot System is an intelligent automation framework that provides hands-off gameplay by integrating with existing navigator and guide systems. It monitors game state changes and executes optimal progression strategies automatically, adapting to different BitNodes and game phases.

## Problem Statement

Current Bitburner automation requires manual oversight and decision-making. Players must:
- Manually decide when to join factions or buy augmentations
- Monitor game state changes and adapt strategies
- Coordinate between different automation systems (botnet, navigator, guide)
- Handle BitNode-specific optimization manually

## Solution Overview

A comprehensive autopilot system that:
- Monitors game state in real-time using NS API + browser APIs
- Makes intelligent decisions based on guide system recommendations
- Automates UI interactions using the navigator system
- Coordinates with existing botnet automation
- Adapts strategies based on BitNode progression and game phase

## Architecture Overview

### Core Components

```
Autopilot System
├── Core Engine
│   ├── Task Manager (Priority queue, execution)
│   ├── State Monitor (Game state tracking)
│   ├── Decision Engine (AI decision making)
│   └── Config Manager (User preferences)
├── Integration Layer
│   ├── Navigator Bridge (UI automation)
│   ├── Guide Bridge (Progression logic)
│   └── Botnet Bridge (Income coordination)
├── Task Library
│   ├── Faction Tasks (Join, reputation work)
│   ├── Augment Tasks (Purchase, install)
│   ├── Money Tasks (Income optimization)
│   ├── Server Tasks (Management, rooting)
│   └── BitNode Tasks (Progression, completion)
└── Strategy Layer
    ├── Early Game Strategy
    ├── Mid Game Strategy
    └── Endgame Strategy
```

## Technical Specifications

### 1. Game State Monitoring

**Interface:**
```typescript
interface GameStateSnapshot {
    player: {
        money: number;
        hacking: number;
        combat: { str: number; def: number; dex: number; agi: number };
        charisma: number;
        intelligence?: number;
        karma: number;
    };
    factions: { name: string; rep: number; joined: boolean; favor: number }[];
    augmentations: { name: string; owned: boolean; cost: number; repReq: number }[];
    servers: { hostname: string; rooted: boolean; money: number; maxMoney: number }[];
    bitNode: { current: number; level: number };
    hacknet: { nodes: number; totalProduction: number };
    corporation?: { exists: boolean; funds: number; divisions: string[] };
    timestamp: number;
    changesSince?: GameStateSnapshot;
}
```

**Implementation:**
- Continuous monitoring every 5 seconds
- Change detection triggers task re-evaluation
- Historical snapshots for trend analysis
- Browser API integration for UI state

### 2. Task Management System

**Task Priority System:**
```typescript
enum AutopilotPriority {
    CRITICAL = 1,    // Red Pill, BitNode completion, essential prerequisites
    HIGH = 2,        // Essential augments, key factions, income scaling
    MEDIUM = 3,      // Optimization tasks, server management, prep work
    LOW = 4          // Quality of life, non-essential improvements
}

interface AutopilotTask {
    id: string;
    type: TaskType;
    priority: AutopilotPriority;
    prerequisites: TaskPrerequisite[];
    estimatedTime: number;
    maxRetries: number;
    cooldown: number;
    
    canExecute(context: AutopilotContext): boolean;
    execute(context: AutopilotContext): Promise<TaskResult>;
    onFailure(error: Error, context: AutopilotContext): Promise<void>;
}
```

**Task Types:**
- `FactionJoinTask`: Automated faction joining based on requirements
- `FactionWorkTask`: Reputation farming with optimal work selection
- `AugmentPurchaseTask`: ROI-based augmentation purchasing
- `MoneyManagementTask`: Income optimization and budgeting
- `ServerManagementTask`: Automated server rooting and management
- `BitNodeProgressionTask`: Red Pill acquisition and completion

### 3. Integration Bridges

**Navigator Bridge:**
```typescript
class NavigatorBridge {
    constructor(private navigator: Navigator) {}
    
    async navigateToSection(section: GameSection): Promise<GamePage>;
    async executeUIAction(action: UIAction): Promise<boolean>;
    async waitForPageReady(section: GameSection): Promise<boolean>;
    async extractPageData(section: GameSection): Promise<any>;
}
```

**Guide Bridge:**
```typescript
class GuideBridge {
    constructor(private guide: GuideSystem) {}
    
    getOptimalAugmentations(budget: number): EnhancedAugmentData[];
    getNextFactionTarget(currentState: GameStateSnapshot): string | null;
    getBitNodeStrategy(bitNode: number): ProgressionPath;
    calculateROI(augment: EnhancedAugmentData, playerState: PlayerStats): number;
}
```

**Botnet Bridge:**
```typescript
class BotnetBridge {
    async getIncomeRate(): Promise<number>;
    async adjustTargeting(preferences: TargetingPreferences): Promise<void>;
    async pauseForUIActions(): Promise<void>;
    async resumeOperations(): Promise<void>;
}
```

## Detailed Feature Specifications

### 1. Faction Management

**Automatic Faction Joining:**
- Monitor faction requirements from guide system
- Detect when requirements are met
- Navigate to factions page and join automatically
- Handle city faction conflicts intelligently
- Support for special faction requirements (hacknet, crime, etc.)

**Reputation Optimization:**
- Calculate optimal work type based on player stats
- Switch work methods when more efficient options become available
- Monitor for faction conflicts and handle gracefully
- Integrate with augmentation purchase planning

**Implementation Priority:** HIGH

### 2. Augmentation System

**Intelligent Purchase Decisions:**
- Use guide system's ROI analytics for purchase prioritization
- Respect user-defined budget constraints
- Handle prerequisite augmentation chains
- Optimize for current BitNode and game phase

**Installation Timing:**
- Detect optimal installation timing (end of cycle, before reset)
- Coordinate with other systems before installation
- Handle special augmentations (Red Pill, faction-specific)

**Implementation Priority:** HIGH

### 3. Money Management

**Budget Allocation:**
- Reserve funds for essential purchases
- Dynamic budget adjustment based on income rate
- Emergency fund management for unexpected opportunities
- Integration with botnet income projections

**Income Optimization:**
- Coordinate with botnet for server targeting
- Adjust hacking focus based on current needs
- Balance short-term vs long-term income strategies

**Implementation Priority:** MEDIUM

### 4. BitNode Progression

**Strategy Adaptation:**
- Load BitNode-specific strategies from guide system
- Adapt priorities based on BitNode constraints
- Handle unique BitNode mechanics (corporation, gang, etc.)
- Optimize for Source File acquisition

**Completion Detection:**
- Monitor for Red Pill availability
- Handle Daedalus faction requirements
- Coordinate final preparations before reset

**Implementation Priority:** HIGH

## User Interface & Configuration

### Configuration System

```typescript
interface AutopilotConfig {
    enabled: boolean;
    mode: 'conservative' | 'balanced' | 'aggressive';
    bitNodeTarget?: number;
    
    priorities: {
        maxSpendingRatio: number;        // Max % of money to spend
        factionRepBuffer: number;        // Extra rep before switching
        augmentCostThreshold: number;    // Cost threshold for auto-purchase
        riskTolerance: number;           // 0-1 scale for risky decisions
    };
    
    restrictions: {
        neverPurchase: string[];         // Augments to never buy
        alwaysPurchase: string[];        // Priority augments
        excludeFactions: string[];       // Factions to avoid
        onlyCity?: string;               // Restrict to specific city
    };
    
    notifications: {
        majorDecisions: boolean;         // Notify on big purchases
        factionJoins: boolean;           // Notify on faction joins
        errors: boolean;                 // Notify on errors/failures
        achievements: boolean;           // Notify on milestones
    };
}
```

### Command Interface

**CLI Commands:**
- `run autopilot.js` - Start autopilot with default config
- `run autopilot.js --config=conservative` - Use predefined config
- `run autopilot.js --target-bitnode=5` - Target specific BitNode
- `run autopilot.js --dry-run` - Show planned actions without executing

**Runtime Commands:**
- `autopilot status` - Show current status and active tasks
- `autopilot pause` - Pause automation temporarily
- `autopilot resume` - Resume automation
- `autopilot config` - Show current configuration
- `autopilot debug` - Enable debug logging

## Error Handling & Recovery

### Failure Scenarios

**UI Navigation Failures:**
- Retry with exponential backoff
- Fallback to alternative navigation paths
- Skip non-critical tasks if repeated failures

**Resource Constraint Failures:**
- Adjust priorities dynamically
- Defer non-essential tasks
- Emergency budget reallocation

**Game State Inconsistencies:**
- Re-snapshot game state
- Validate task prerequisites
- Reset task queue if necessary

### Recovery Mechanisms

**Automatic Recovery:**
- Retry failed tasks with increasing delays
- Fallback strategies for common failure modes
- Graceful degradation when systems unavailable

**Manual Recovery:**
- Clear task queue command
- Force re-evaluation command
- Emergency stop functionality

## Performance & Monitoring

### Performance Metrics

**Efficiency Tracking:**
- Tasks completed per hour
- Money earned per time unit
- Augmentations acquired per cycle
- Time to BitNode completion

**Resource Utilization:**
- CPU usage monitoring
- Memory usage tracking
- Network request frequency
- UI automation efficiency

### Monitoring Dashboard

**Real-time Status:**
- Current active tasks
- Game state summary
- Progress toward goals
- Error/warning counts

**Historical Analysis:**
- Performance trends over time
- Decision accuracy tracking
- Resource allocation efficiency
- BitNode completion statistics

## Implementation Phases

### Phase 1: Core Infrastructure (Weeks 1-2)
**Goals:** Establish foundational systems
- [ ] Game state monitoring system
- [ ] Basic task manager with priority queue
- [ ] Configuration management
- [ ] Integration bridges (basic functionality)
- [ ] Simple faction joining automation

**Success Criteria:**
- Autopilot can monitor game state continuously
- Basic faction joining works reliably
- Configuration system functional
- Integration with navigator/guide established

### Phase 2: Essential Automation (Weeks 3-4)
**Goals:** Implement core automation features
- [ ] Augmentation purchasing logic
- [ ] Faction reputation automation
- [ ] Money management and budgeting
- [ ] Basic BitNode progression following
- [ ] Error handling and recovery

**Success Criteria:**
- Can complete early game progression automatically
- Augmentation purchases based on guide recommendations
- Faction work automation functional
- Basic error recovery implemented

### Phase 3: Intelligent Decision Making (Weeks 5-6)
**Goals:** Advanced decision making and optimization
- [ ] ROI-based decision engine
- [ ] Multi-BitNode strategy adaptation
- [ ] Advanced task scheduling
- [ ] Performance monitoring
- [ ] Risk assessment system

**Success Criteria:**
- Makes optimal decisions based on game state
- Adapts strategies for different BitNodes
- Performance metrics tracking
- Handles edge cases gracefully

### Phase 4: Polish & Enhancement (Weeks 7-8)
**Goals:** User experience and advanced features
- [ ] Comprehensive CLI interface
- [ ] Advanced configuration options
- [ ] Detailed logging and analytics
- [ ] User documentation
- [ ] Integration testing

**Success Criteria:**
- Production-ready user interface
- Comprehensive documentation
- Robust error handling
- Full integration test coverage

## Success Metrics

### Primary KPIs
- **Automation Coverage:** % of gameplay automated successfully
- **Decision Accuracy:** % of decisions that align with optimal strategy
- **Time to Completion:** BitNode completion time vs manual play
- **User Satisfaction:** Subjective rating of autopilot effectiveness

### Secondary KPIs
- **Error Rate:** Frequency of failures requiring manual intervention
- **Resource Efficiency:** Optimal use of money, time, and game resources
- **Adaptability:** Success rate across different BitNodes and scenarios
- **Performance Impact:** System resource usage and game responsiveness

## Risk Assessment

### High Risk Items
1. **Browser API Changes:** Game updates breaking DOM automation
2. **Game Balance Changes:** Updates affecting optimal strategies
3. **Performance Impact:** Autopilot causing game lag or crashes
4. **Complex Edge Cases:** Unexpected game states breaking automation

### Mitigation Strategies
1. **Robust Error Handling:** Comprehensive try-catch and fallback logic
2. **Modular Design:** Easy to update individual components
3. **Configuration Flexibility:** User overrides for strategy changes
4. **Monitoring & Alerts:** Early detection of system issues

## Dependencies

### Internal Dependencies
- **Navigator System:** UI automation and page interaction
- **Guide System:** Optimal progression strategies and data
- **Botnet System:** Income generation and server management
- **Logger System:** Debugging and monitoring

### External Dependencies
- **Bitburner Game:** Stable NS API and game mechanics
- **Browser APIs:** DOM access and localStorage
- **TypeScript:** Type safety and development tooling

## Future Enhancements

### Post-MVP Features
- **Machine Learning:** Learn from player preferences and outcomes
- **Multi-Account Support:** Coordinate multiple Bitburner instances
- **Cloud Sync:** Share configurations and strategies across devices
- **Advanced Analytics:** Detailed performance analysis and optimization
- **Community Integration:** Share strategies and compare performance

### Long-term Vision
Transform the autopilot into a comprehensive Bitburner AI that can:
- Learn optimal strategies through reinforcement learning
- Adapt to game updates automatically
- Provide coaching and recommendations for manual play
- Support competitive speedrunning and optimization challenges

---

## Appendix

### A. Technical Architecture Diagrams
[Detailed system architecture diagrams would be included here]

### B. API Reference
[Complete API documentation for all autopilot interfaces]

### C. Configuration Examples
[Sample configurations for different play styles and scenarios]

### D. Troubleshooting Guide
[Common issues and resolution steps]

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-10  
**Next Review:** 2025-01-17  
**Owner:** Bitburner Automation Team