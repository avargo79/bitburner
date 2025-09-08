# Bitburner Augmentation Guide System - Development Plan

## Overview

Based on comprehensive multi-source research across Reddit, GitHub, Steam, and official documentation, this plan outlines the expansion of our current BN1.1-focused `guide.ts` into a comprehensive multi-BitNode augmentation knowledge base.

## Current State Analysis

### ✅ What We Have (guide.ts)
- **BN1.1 Specific Guide**: Static augmentation recommendations without Singularity API dependencies
- **Community-Validated Data**: Aligned with proven meta strategies from Reddit/GitHub sources
- **16,674 bytes**: Focused implementation with 30+ essential augments for early game
- **Working CLI Interface**: `run guide.js` with multiple output modes (timeline, factions, export)
- **TypeScript Architecture**: Clean interfaces and modular design ready for expansion

### 🎯 Validation Results
- ✅ Essential augments (BitWire, Synaptic Enhancement) match community consensus
- ✅ Faction progression paths align with AskaDragoness's progression guide
- ✅ Cost/benefit analysis matches proven strategies from alainbryden's scripts
- ✅ BN1.1 constraints properly addressed (no API dependencies)

## Research Sources Integrated

### Primary Community Sources
1. **AskaDragoness BitNode Guide** - Comprehensive progression dependency chart
2. **alainbryden/bitburner-scripts** (678⭐) - Proven automation framework
3. **Steam Unique Augmentations Guide** - Complete faction-specific augment catalog
4. **Reddit r/Bitburner Meta Discussions** - Community-validated strategies
5. **bitburner-official repositories** - Official patterns and best practices

### Key Findings
- **40+ Factions** with unique requirements and augmentations
- **200+ Augmentations** with different availability across BitNodes
- **13 BitNodes** with complex dependencies and optimal progression paths
- **Proven Progression**: BN1→BN5→BN3→BN4 confirmed across multiple sources

## Expansion Plan

### Phase 1: Enhanced Current System (Week 1)
**Goal**: Improve existing BN1.1 guide with research findings

#### 1.1 Augment Database Expansion
- [ ] Add unique augments from Steam guide research
- [ ] Include faction-specific augments (ECorp HVMind, PCMatrix, etc.)
- [ ] Add prereq chains for complex augments
- [ ] Expand cost calculation with multiplier factors

#### 1.2 Faction System Enhancement
- [ ] Complete faction requirements database (40+ factions)
- [ ] Add faction invitation strategies
- [ ] Include faction-specific optimal paths
- [ ] Add faction exclusivity warnings

#### 1.3 CLI Interface Improvements
- [ ] Add `--bitnode X` parameter for future expansion
- [ ] Implement `--faction FNAME` specific guides
- [ ] Add `--budget X` filtering for cost planning
- [ ] Create `--shopping-list` optimized purchasing order

### Phase 2: Multi-BitNode Foundation (Week 2)
**Goal**: Architect system for all BitNodes

#### 2.1 Data Architecture Redesign
```typescript
interface BitNodeGuide {
    id: number;
    name: string;
    sourceFile: SourceFileData;
    constraints: BitNodeConstraints;
    augmentAvailability: AugmentAvailability;
    optimalProgression: ProgressionPath;
    specialMechanics: SpecialMechanic[];
}

interface SourceFileData {
    name: string;
    maxLevel: number;
    benefits: string[];
    unlocks: string[];
}
```

#### 2.2 BitNode-Specific Systems
- [ ] BN1: Source-File System (current implementation enhanced)
- [ ] BN2: Rise of the Underworld (gang mechanics)
- [ ] BN3: Corporatocracy (corporation focus)
- [ ] BN4: The Singularity (automation focus)
- [ ] BN5: Artificial Intelligence (intelligence mechanics)
- [ ] BN6-13: Specialized strategies per community research

#### 2.3 Progression Dependency System
- [ ] Implement AskaDragoness's dependency chart
- [ ] Add optimal BitNode progression paths
- [ ] Include challenge mode recommendations (.3 versions)
- [ ] Achievement tracking integration

### Phase 3: Advanced Features (Week 3)
**Goal**: Interactive planning and optimization tools

#### 3.1 Interactive Progression Planner
- [ ] `run guide.js --planner` interactive mode
- [ ] BitNode progression visualization
- [ ] Augment dependency tree display
- [ ] Cost optimization calculator

#### 3.2 Automation Integration
- [ ] Integration patterns from alainbryden's automation scripts
- [ ] Faction manager compatibility
- [ ] Auto-purchasing recommendations
- [ ] Progress tracking with save file analysis

#### 3.3 Advanced Analytics
- [ ] BitNode comparison tools
- [ ] ROI analysis for augment purchases
- [ ] Time-to-completion estimates
- [ ] Faction efficiency calculations

### Phase 4: Community Integration (Week 4)
**Goal**: Connect with broader Bitburner ecosystem

#### 4.1 External Script Compatibility
- [ ] alainbryden script integration points
- [ ] Standard faction manager interfaces
- [ ] Export formats for other tools
- [ ] Import from community spreadsheets

#### 4.2 Community Contributions
- [ ] Documentation for community contributions
- [ ] Standardized data formats
- [ ] GitHub integration for updates
- [ ] Community feedback incorporation system

## Implementation Strategy

### File Structure
```
src/
├── guide.ts                 # Current BN1.1 implementation (enhanced)
├── guide/
│   ├── core/
│   │   ├── types.ts         # All interfaces and types
│   │   ├── data.ts          # Master augment/faction database
│   │   └── calculator.ts    # Cost/optimization algorithms
│   ├── bitnodes/
│   │   ├── bn1.ts          # BitNode 1 specific logic
│   │   ├── bn2.ts          # BitNode 2 specific logic
│   │   └── ...             # BN3-13 implementations
│   ├── features/
│   │   ├── planner.ts      # Interactive planning tools
│   │   ├── analytics.ts    # Advanced analysis features
│   │   └── automation.ts   # Integration with automation scripts
│   └── cli/
│       ├── commands.ts     # CLI command definitions
│       └── formatters.ts   # Output formatting utilities
└── guide-master.ts         # New master orchestrator
```

### Backward Compatibility
- `run guide.js` continues to work as current BN1.1 guide
- `run guide-master.js` provides full multi-BitNode system
- Gradual migration path with feature flags
- Data export compatibility maintained

## Community Data Integration

### Augmentation Database Sources
1. **Steam Unique Augments Guide**: Faction-specific catalog
2. **alainbryden faction-manager.js**: Automation-tested data
3. **Community spreadsheets**: Crowd-sourced verification
4. **bitburner-src**: Official source code validation

### BitNode Strategy Sources
1. **AskaDragoness Progression Chart**: Dependency visualization
2. **Reddit meta discussions**: Community consensus paths
3. **GitHub automation scripts**: Proven efficient strategies
4. **Steam walkthroughs**: Player-tested approaches

## Success Metrics

### Phase 1 Success
- [ ] Enhanced BN1.1 guide with 50+ augments
- [ ] Complete faction database (40+ factions)
- [ ] Improved CLI with 5+ new features
- [ ] Community validation of enhanced data

### Phase 2 Success
- [ ] Multi-BitNode architecture supporting all 13 BitNodes
- [ ] Dependency system matching AskaDragoness chart
- [ ] BitNode-specific optimization strategies
- [ ] Source file progression planning

### Phase 3 Success
- [ ] Interactive planner tool
- [ ] Advanced analytics and ROI calculations
- [ ] Automation script integration
- [ ] Time-to-completion estimation system

### Phase 4 Success
- [ ] Community contribution framework
- [ ] External tool compatibility
- [ ] Regular community data updates
- [ ] Ecosystem integration with major script repositories

## Risk Mitigation

### Technical Risks
- **RAM Constraints**: Keep core functionality lightweight for early-game use
- **API Changes**: Maintain static fallbacks for Singularity-limited environments
- **Data Maintenance**: Automated validation against community sources
- **Performance**: Lazy loading for advanced features

### Community Risks
- **Data Accuracy**: Multiple source validation and community feedback loops
- **Maintenance Burden**: Modular architecture for community contributions
- **Feature Creep**: Phased approach with clear success criteria
- **Adoption**: Backward compatibility and gradual migration path

## Next Steps

1. **Immediate** (This Week): Begin Phase 1 implementation
2. **Week 1**: Complete enhanced BN1.1 system with research integration
3. **Week 2**: Architect and implement multi-BitNode foundation
4. **Week 3**: Build interactive features and automation integration
5. **Week 4**: Community integration and ecosystem connections

## Appendix: Research References

### Primary Sources
- [AskaDragoness BitNode Guide](https://docs.google.com/drawings/d/1ZvZMPV2H4V__-W0YnY6Dw4ntlg8m-wyx9c0rQ0Y69g0/edit)
- [alainbryden/bitburner-scripts](https://github.com/alainbryden/bitburner-scripts)
- [Steam Unique Augmentations Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2790457528)
- [Reddit r/Bitburner Meta Discussions](https://www.reddit.com/r/Bitburner/)

### Technical References
- [bitburner-official/bitburner-src](https://github.com/bitburner-official/bitburner-src)
- [Community Script Collections](https://github.com/search?q=bitburner+scripts)
- [Steam Community Guides](https://steamcommunity.com/app/1812820/guides/)

---

*This plan represents a comprehensive roadmap for transforming our focused BN1.1 guide into the definitive Bitburner augmentation knowledge base, validated by extensive community research and proven strategies.*