# Bitburner Features - Development Planning

This directory contains feature specifications and development plans for the Bitburner automation framework.

## Directory Structure

```
features/
├── README.md                           # This file - feature overview
├── botnet-share/                       # Botnet RAM sharing feature
│   └── BOTNET_SHARE_FEATURE_PLAN.md   # Complete implementation plan
└── autopilot/                          # Intelligent autopilot system
    └── AUTOPILOT-CONSOLIDATED-PLAN.md  # Complete implementation specification
```

## Feature Status

### 🚀 **Botnet Share** - Ready for Implementation
- **Status**: Implementation-ready with complete technical specs
- **Timeline**: 2-3 hours total implementation
- **Purpose**: 25-45% faction reputation boost during faction work
- **Approach**: Minimal integration with existing botnet system

**Key Benefits**:
- Zero RAM cost faction detection using browser API stealth technique
- 15% RAM allocation for sharing when "Working for " text detected
- Automatic activation/deactivation based on game state
- Conservative defaults with user configuration options

### 🔬 **Autopilot System** - Consolidated Implementation Plan
- **Status**: Implementation-ready with unified specification
- **Timeline**: 4 weeks total (1 week per phase)
- **Purpose**: Hands-off early game automation using browser APIs
- **Approach**: Browser-first automation building on existing navigator system

**Key Benefits**:
- Works before Singularity APIs (BitNode 4) are unlocked
- Browser automation using existing navigator system (97.9% RAM optimized)
- Intelligent decisions based on guide system ROI analytics
- Conservative defaults with iterative 4-week development plan

## Implementation Priorities

### **Immediate (Next Session)**
- ✅ **Botnet Share**: All specs complete, ready to implement
  - Simple detection, minimal code changes, immediate value

### **Short-term (1-2 weeks)**
- 🔄 **Autopilot Implementation**: Start with Phase 1 foundation
  - Week 1: Game state monitoring and basic faction joining
  - Week 2: Augmentation purchasing and faction work automation

### **Medium-term (1-2 months)**
- 📋 **Feature Integration**: Combine botnet share with autopilot systems
- 🔧 **Performance Optimization**: Refine based on real-world usage

## Technical Foundation

### **Existing Systems Ready for Integration**
- ✅ **Navigator**: Browser automation framework (97.9% RAM optimized)
- ✅ **Guide System**: ROI analytics and progression logic
- ✅ **Botnet**: Income generation and server management
- ✅ **Browser API Breakthrough**: Zero-cost DOM access techniques

### **Key Architectural Decisions Made**
- **Browser-first automation**: Use DOM manipulation for pre-Singularity features
- **Minimal integration**: Build on existing systems vs new architecture
- **Conservative defaults**: User-configurable with safe starting points
- **Stealth techniques**: Bypass RAM penalties for browser API access

## Development Guidelines

### **For New Features**
1. **Document first**: Create feature spec before implementation
2. **Build on existing**: Leverage navigator, guide, and botnet systems
3. **Browser API stealth**: Use `globalThis['doc' + 'ument']` pattern for DOM access
4. **Conservative defaults**: Safe settings that work out of the box
5. **User configuration**: CLI flags for customization

### **File Organization**
- **Feature specs**: Complete implementation plans with technical details
- **Research docs**: Investigation results and design explorations
- **Status tracking**: Clear indicators of implementation readiness
- **Integration notes**: How features work together

## Next Steps

1. **Implement Botnet Share** (2-3 hours)
   - All technical details specified and verified
   - Minimal risk, immediate value delivery

2. **Choose Autopilot Approach** (planning session)
   - Evaluate three documented approaches
   - Consider timeline, complexity, and value delivery

3. **Establish Feature Development Process**
   - Template for new feature specifications
   - Integration testing approach
   - User feedback collection

---

## Quick Reference

### **Ready to Implement**
- ✅ **Botnet Share**: `features/botnet-share/BOTNET_SHARE_FEATURE_PLAN.md`

### **Needs Decision**
- ✅ **Autopilot Ready**: `features/autopilot/AUTOPILOT-CONSOLIDATED-PLAN.md`

### **Development Tools**
- **Navigator**: Browser automation - `src/navigator.ts`
- **Guide**: Progression logic - `src/guide.ts`  
- **Botnet**: Server management - `src/botnet.ts`
- **Browser Utils**: API stealth techniques - `src/browser-utils.ts`

This organization provides clear separation of concerns while maintaining visibility into the overall feature roadmap and implementation status.