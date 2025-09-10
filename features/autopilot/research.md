# Technical Research: Autopilot System

**Feature**: Autopilot System  
**Date**: Wed Sep 10 2025  
**Context**: Early game automation for Bitburner progression

## Research Findings

### Browser Automation Approach
**Decision**: Use existing navigator system with zero-cost DOM access techniques  
**Rationale**: Proven browser automation framework already exists with 97.9% RAM optimization through stealth techniques. Autopilot can extend this system without recreating browser interaction patterns.  
**Alternatives considered**: 
- Pure NS API approach (rejected: insufficient data access for faction/augmentation discovery)
- Direct DOM manipulation from scratch (rejected: unnecessary duplication of proven navigator patterns)
- Complex UI automation frameworks (rejected: RAM overhead, complexity)  
**RAM impact**: ~2-3GB additional overhead beyond base navigator system

### Game State Reading Strategy
**Decision**: Hybrid NS API + DOM scraping approach  
**Rationale**: NS API provides reliable player stats, money, and basic faction data. DOM scraping fills gaps for faction availability, augmentation costs, and current activity detection. Combination provides complete state picture.  
**Alternatives considered**:
- NS API only (rejected: missing critical faction/augmentation availability data)
- DOM scraping only (rejected: unreliable for core stats, higher complexity)
- Singularity API dependency (rejected: early game focus requires pre-BitNode 4 operation)  
**RAM impact**: ~1-2GB for DOM access using stealth techniques (`globalThis['doc' + 'ument']`)

### Decision Engine Integration
**Decision**: Leverage existing guide system for ROI analysis and progression logic  
**Rationale**: Guide system already contains sophisticated faction progression analytics, augmentation ROI calculations, and BitNode-specific strategies. Autopilot should consume this intelligence rather than recreate it.  
**Alternatives considered**:
- Simple hardcoded decision tree (rejected: inflexible, suboptimal decisions)
- Machine learning approach (rejected: complexity, training data requirements)
- User-defined priority systems (rejected: defeats automation purpose)  
**RAM impact**: ~1GB for guide system interface and decision caching

### Configuration Management
**Decision**: localStorage-based configuration with runtime CLI overrides  
**Rationale**: Allows persistent user preferences across script restarts while enabling easy runtime adjustments. Balances convenience with flexibility.  
**Alternatives considered**:
- File-based configuration (rejected: complexity, sync issues in browser environment)
- Pure CLI arguments (rejected: loses settings on restart)
- In-game UI configuration (rejected: scope creep, UI development overhead)  
**RAM impact**: <0.5GB for configuration parsing and validation

### Error Recovery Patterns
**Decision**: Graceful degradation with retry logic and fallback actions  
**Rationale**: Browser automation can fail due to UI changes, network issues, or timing problems. System should continue operating with reduced functionality rather than crashing.  
**Alternatives considered**:
- Fail-fast approach (rejected: reduces reliability for long-running automation)
- Complex state recovery (rejected: implementation complexity, debugging difficulty)
- User intervention requirements (rejected: defeats hands-off automation goal)  
**RAM impact**: ~0.5GB for error handling state and retry logic

### Performance Optimization Techniques
**Decision**: 30-second evaluation cycles with action queuing and state caching  
**Rationale**: Balances responsiveness with performance impact. Long enough to avoid excessive DOM scraping, short enough for timely decision making.  
**Alternatives considered**:
- Continuous monitoring (rejected: performance impact, unnecessary reactivity)
- Longer cycles (60s+) (rejected: slower response to game state changes)
- Event-driven approach (rejected: complexity, browser API limitations)  
**RAM impact**: ~0.5GB for state caching and action queue management

## Technical Architecture Decisions

### Zero-Cost DOM Access Implementation
```typescript
// Proven technique from navigator system
const doc = globalThis['doc' + 'ument'];
const win = globalThis['win' + 'dow'];
```
This stealth technique bypasses Bitburner's 25GB RAM penalty for direct `document` and `window` access while providing full browser automation capabilities.

### State Management Pattern
```typescript
interface GameState {
    timestamp: number;
    player: PlayerStats;
    factions: FactionData;
    augmentations: AugmentationData;
}
```
Stateless design gathers fresh data each evaluation cycle rather than maintaining persistent state, ensuring accuracy and simplifying restart handling.

### Action Execution Pattern
```typescript
abstract class AutomationAction {
    abstract execute(navigator: Navigator): Promise<ActionResult>;
    abstract getEstimatedTime(): number;
    abstract getDescription(): string;
}
```
Leverages existing navigator system for browser automation while providing standardized interface for different action types.

### Integration Points
- **Navigator System**: Extends existing browser automation capabilities
- **Guide System**: Consumes ROI analytics and progression recommendations  
- **Botnet System**: Coordinates timing to avoid conflicts during UI automation
- **Logger System**: Uses existing logging patterns for status reporting

## Mathematical Foundations

### Budget Management Algorithm
```
spendingBudget = playerMoney * configuredSpendingRatio
emergencyReserve = max(configuredMinReserve, predictedIncomeRisk)
availableBudget = spendingBudget - emergencyReserve
```

### Faction Progression Priority
```
factionScore = augmentationValue * accessibilityWeight * progressionMultiplier
where:
- augmentationValue: ROI from guide system analysis
- accessibilityWeight: inverse of stat requirements difficulty
- progressionMultiplier: position in optimal faction sequence
```

### Work Type Optimization
```
workEfficiency = statMultiplier * timeMultiplier * reputationGain
optimalWorkType = max(hackingWork, fieldWork, securityWork) by workEfficiency
```

### Augmentation Purchase Timing
```
purchaseThreshold = (reputationCost <= currentReputation + reputationBuffer) 
                    AND (moneyCost <= availableBudget)
                    AND (prerequisites.all(owned))
```

## Implementation Risk Mitigation

### DOM Stability Risks
- Multiple CSS selector strategies for element discovery
- Fallback text-based element identification
- Graceful degradation when automation fails

### Timing Coordination Risks  
- State checking before automation actions
- Conflict detection with other running systems
- Automatic pause when manual user activity detected

### Resource Management Risks
- RAM usage monitoring and reporting
- Execution time limiting for individual actions
- Memory cleanup between evaluation cycles

## Validation Approach

### Performance Benchmarks
- RAM usage: Target <8GB total system overhead
- Response time: <30 seconds per automation action
- Reliability: >90% success rate for individual actions
- Endurance: 4+ hour continuous operation capability

### Functional Testing
- Complete progression path: Start → CyberSec → NiteSec → First augmentation
- Error recovery: UI changes, insufficient resources, faction conflicts
- Configuration modes: Conservative, balanced, aggressive behavior validation
- Integration testing: Compatibility with existing botnet and navigator systems

---

*Research complete - ready for Phase 1 design and contracts generation*