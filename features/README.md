# Bitburner Features - Development Planning

This directory contains feature specifications and development plans for the Bitburner automation framework using **Spec-Driven Development** methodology.

## Directory Structure

```
features/
├── README.md                    # This file - feature overview and guidelines
├── navigator/                   # Browser automation framework
│   ├── spec.md                 # Feature specification (WHAT/WHY)
│   ├── plan.md                 # Technical implementation plan (HOW)
│   └── research.md             # Technical decisions and research
├── botnet/                      # HWGW batching and server management
│   ├── spec.md                 # Feature specification  
│   ├── plan.md                 # Technical implementation plan
│   └── research.md             # Algorithm research and optimization
├── contracts/                   # Coding contract solver automation
│   ├── spec.md                 # Feature specification
│   ├── plan.md                 # Technical implementation plan
│   └── research.md             # Algorithm research and contract analysis
├── casino-bot/                  # Automated casino gambling system
│   ├── spec.md                 # Feature specification
│   ├── plan.md                 # Technical implementation plan
│   └── research.md             # Browser automation and blackjack strategy
├── autopilot/                   # Intelligent early game automation
│   ├── spec.md                 # Feature specification
│   ├── plan.md                 # Technical implementation plan
│   └── research.md             # Technical decisions and integration
└── botnet-share/                # RAM sharing for faction reputation
    ├── spec.md                 # Feature specification
    ├── plan.md                 # Technical implementation plan
    └── research.md             # Share mechanics and optimization
```

## Feature Status

### ✅ **Fully Documented Features** (Ready for Enhancement/Reference)
All features have complete standardized documentation following spec-driven development:

#### **🎯 Navigator** - Browser Automation Framework
- **Status**: Implemented + Fully Documented
- **Purpose**: Zero-cost browser automation for game interface interaction
- **Key Innovation**: Stealth DOM access bypassing 25GB RAM penalties

#### **💰 Botnet** - HWGW Income Generation
- **Status**: Implemented + Fully Documented  
- **Purpose**: Advanced HWGW batching with multi-server coordination
- **Key Innovation**: Sophisticated timing algorithms and network management

#### **🧮 Contracts** - Coding Contract Solver
- **Status**: Implemented + Fully Documented
- **Purpose**: Automated solving of all 20+ contract types with high success rates
- **Key Innovation**: Comprehensive algorithm library with error recovery

#### **🎲 Casino Bot** - Blackjack Automation
- **Status**: Implemented + Fully Documented
- **Purpose**: Optimal basic strategy blackjack for alternative income
- **Key Innovation**: Focus management and reliable browser automation

#### **🤖 Autopilot** - Early Game Automation  
- **Status**: Fully Documented (Ready for Implementation)
- **Purpose**: Hands-off faction joining and augmentation purchasing
- **Key Innovation**: Browser-first automation before Singularity APIs

#### **🤝 Botnet Share** - Faction Reputation Boost
- **Status**: Fully Documented (Ready for Implementation)
- **Purpose**: 25-45% faction reputation bonus during faction work
- **Key Innovation**: Zero-cost faction detection with intelligent RAM allocation

## Spec-Driven Development Methodology

### **Documentation Structure**
Each feature follows standardized documentation pattern:

1. **`spec.md`** - Feature Specification (WHAT/WHY)
   - User scenarios and acceptance criteria
   - Functional requirements and success metrics
   - Written for stakeholders, not developers

2. **`plan.md`** - Technical Implementation Plan (HOW)
   - Architecture decisions and integration points
   - Technical constraints and performance targets
   - Implementation phases and task planning

3. **`research.md`** - Technical Research and Decisions
   - Algorithm analysis and mathematical foundations
   - Technology choices and alternative evaluations
   - Performance optimization and risk assessment

### **Development Commands**
- **`/specify [description]`** - Generate feature specification from user requirements
- **`/plan [spec-path]`** - Create technical implementation plan from specification  
- **`/tasks [plan-path]`** - Generate actionable task breakdown for implementation

### **Quality Standards**
- **Separation of Concerns**: User requirements vs technical implementation
- **Standardized Templates**: Consistent documentation structure across features
- **Research Foundation**: Technical decisions backed by analysis and alternatives
- **Implementation Ready**: Clear path from specification to working code

## Enhancement Development Workflow

### **For Major Feature Enhancements**
Use sub-feature approach for significant additions:

```
features/
├── botnet/                     # Core system
├── botnet-share/              # RAM sharing enhancement  
├── botnet-analytics/          # Performance monitoring (future)
└── botnet-intelligence/       # Smart targeting (future)
```

### **For Minor Improvements**
- Direct implementation in existing codebase
- Update existing documentation to reflect changes
- No new feature directory needed

### **For Major Rewrites**
- Version-based approach: `botnet-v2/`
- Include migration planning and compatibility analysis
- Separate feature directory for new architecture

## Technical Foundation

### **Proven Integration Patterns**
- ✅ **Zero-cost browser automation**: Stealth DOM access techniques
- ✅ **Standalone script architecture**: Self-contained main(ns) functions
- ✅ **Direct NS API usage**: Minimal abstractions and dependencies
- ✅ **Stateless operation**: Fresh data gathering each execution cycle

### **Key Architectural Principles**
- **Browser-first automation**: DOM manipulation for pre-Singularity features
- **Minimal integration**: Build on existing systems vs new architecture  
- **Conservative defaults**: User-configurable with safe starting points
- **Performance optimization**: RAM efficiency and execution timing

### **Research Resources**
Comprehensive research resources documented in [AGENTS.md](../AGENTS.md):
- Official Bitburner documentation and source code
- Community repositories and automation examples
- Mathematical foundations and strategy optimization
- Browser API documentation and optimization techniques

## Implementation Priorities

### **High Priority** (Ready for Implementation)
- 🚀 **Botnet Share**: Simple enhancement with immediate value
- 🤖 **Autopilot System**: Comprehensive early game automation

### **Medium Priority** (Future Enhancements)
- 📊 **Analytics Dashboard**: Performance monitoring across all features
- 🎯 **Advanced Targeting**: AI-driven server selection optimization
- 🔄 **Multi-BitNode Support**: Adaptation for different game modes

### **Low Priority** (Research Phase)
- 🧠 **Machine Learning**: Pattern recognition for optimization
- 🌐 **Distributed Computing**: Cross-player botnet coordination
- 🎮 **Game Theory**: Advanced strategic decision making

## Development Guidelines

### **Creating New Features**
1. **Start with specification**: Use `/specify` command with clear user requirements
2. **Research thoroughly**: Leverage documented research resources
3. **Plan implementation**: Use `/plan` command for technical approach
4. **Generate tasks**: Use `/tasks` command for actionable breakdown
5. **Follow patterns**: Use existing features as architectural examples

### **Enhancing Existing Features**  
1. **Assess enhancement scope**: Minor fix vs major addition vs rewrite
2. **Choose approach**: Direct modification vs sub-feature vs versioning
3. **Follow documentation standards**: Update specs, plans, and research
4. **Maintain compatibility**: Ensure existing functionality continues working

### **Quality Assurance**
- **Documentation completeness**: All three files (spec, plan, research) present
- **Template compliance**: Follow standardized structure and content requirements
- **Research validation**: Technical decisions backed by analysis
- **Implementation readiness**: Clear path from documentation to working code

---

## Quick Reference

### **Documentation Templates**
- `templates/spec-template.md` - Feature specification structure
- `templates/plan-template.md` - Technical implementation planning
- `templates/tasks-template.md` - Task breakdown format

### **Enhancement Patterns**
- **Sub-features**: `botnet-share/`, `botnet-analytics/`
- **Versioning**: `feature-v2/` for major architectural changes
- **Direct modification**: For minor improvements and bug fixes

### **Research Resources**
- **AGENTS.md**: Comprehensive development and research guide
- **Official sources**: Bitburner GitHub, documentation, formulas
- **Community resources**: Reddit, Discord, proven automation repositories
- **Technical references**: Browser APIs, TypeScript, mathematical foundations

This organization provides structured, high-quality feature development with clear separation between user requirements, technical implementation, and research foundations. All features follow identical documentation patterns, making the codebase highly maintainable and discoverable.