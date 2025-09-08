# Bitburner TypeScript Automation Framework

## Project Overview
This repository contains a custom, production-grade Bitburner automation framework written in TypeScript. It features advanced agent-based task scheduling, HWGW batching, persistent database storage, and distributed hacking operations for optimal in-game performance.

- **Task-based architecture**: Modular, extensible, and robust
- **Persistent state**: Uses IndexedDB for cross-session data
- **Continuous batching**: Maximizes RAM utilization and hacking income
- **Distributed execution**: Leverages all available servers
- **Multi-BitNode augmentation guide**: Comprehensive progression system

## Quick Start
1. **Install dependencies**
   ```sh
   npm install
   ```
2. **Start the build/watch process**
   ```sh
   npm run watch
   ```
3. **Connect Bitburner Remote File API**
   - Enter the port shown in the watch output into the Bitburner game settings
   - Press "Connect" in-game to sync scripts
4. **Run the main automation script in-game**
   ```
   run daemon.js
   ```

## Available Scripts

### Automation System
- `run daemon.js` - Main automation orchestrator
- `run start.js` - Quick start automation
- `run killremote.js` - Kill all remote scripts

### Augmentation Guide System 
- `run guide.js` - **Comprehensive Multi-BitNode augmentation guide system**

#### Guide System Commands
```bash
# BitNode-specific guides
run guide.js bitnode 1        # BitNode 1 guide
run guide.js bitnode 2        # BitNode 2 guide
run guide.js bn 1 --detail complete  # Detailed BitNode 1 guide

# Progression planning
run guide.js progression      # Optimal BitNode progression path
run guide.js progression --style fastProgression
run guide.js next            # Next recommended BitNode

# Interactive progression planner
run guide.js planner          # Interactive planning mode
run guide.js planner --mode guided    # Step-by-step guidance
run guide.js plan --mode automatic    # Automatic optimal plan

# Advanced analytics and ROI analysis
run guide.js analytics        # Full ROI and efficiency analysis
run guide.js analytics --budget 10000000  # Budget-constrained analysis
run guide.js roi --focus hacking          # Focus on hacking augments
run guide.js analyze --focus combat       # Combat-focused analysis

# Automation integration
run guide.js automation       # Generate automation recommendations
run guide.js auto --execute   # Execute top automation recommendations
run guide.js automation --export  # Export config for other scripts
run guide.js integrate --execute --maxExecutions 5  # Execute up to 5 actions

# Augmentation search and filtering
run guide.js augments         # All augmentations
run guide.js augments --filter priority --value ESSENTIAL
run guide.js augments --budget 1000000
run guide.js search --filter category --value HACKING

# Dependencies and readiness
run guide.js dependencies     # Show BitNode dependencies
run guide.js ready --target 4 # Check readiness for BitNode 4
run guide.js deps --target 5  # Dependencies for BitNode 5

# Faction guides
run guide.js faction "CyberSec"
run guide.js fac "BitRunners" --bitnode 1

# Comparison and planning
run guide.js compare --bitnodes 1,2,3
run guide.js vs --bitnodes 4,5 --aspect difficulty

# Data export
run guide.js export           # Export all data as JSON
run guide.js export --format csv --scope augments
```

### Other Utilities
- `run contracts.js` - Contract solver
- `run stocks.js` - Stock market automation
- `run hacknet.js` - Hacknet management

## Development & Build
- All source code is in the `/src` directory
- TypeScript is compiled and synced automatically by the watcher
- Use `npx tsc` to check for type errors
- Use `npx eslint src/` to lint code

## Guide System Architecture

The comprehensive guide system provides multi-BitNode support:

### Features
- **13 BitNode support** with specific strategies for each
- **Community-validated data** from Reddit, Steam, and GitHub sources
- **Progression dependencies** based on AskaDragoness's progression chart
- **Interactive planning** with optimal path recommendations and real-time analysis
- **Advanced analytics** with ROI calculations and efficiency optimization
- **Automation integration** compatible with existing script frameworks
- **Advanced filtering** for augmentations and factions
- **Export capabilities** for external tool integration

### Implementation
- **Single consolidated script**: All functionality in `src/guide.ts`
- **Zero dependencies**: Self-contained with no external imports
- **Backward compatibility**: Enhanced BN1.1 functionality preserved
- **Full feature set**: Complete multi-BitNode system in one file

## Documentation
- See source code comments and TypeScript interfaces for detailed usage
- Main entry point: `src/daemon.ts`
- Configuration: `src/lib/configuration.ts`
- Guide system: `GUIDE_PLAN.md` for development roadmap

## License
This project is for personal Bitburner automation and is not affiliated with the official Bitburner template. Use at your own risk.
