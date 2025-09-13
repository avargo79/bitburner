# Bitburner Botnet System - Consolidated Feature Documentation

## Overview
This directory contains all documentation for the Bitburner botnet automation system, consolidating multiple feature development phases into a comprehensive resource.

## Document Organization

### 📋 Core Specifications
- **[spec.md](spec.md)** - Original botnet system specification
- **[spec-refactor.md](spec-refactor.md)** - Modular architecture specification  
- **[spec-share.md](spec-share.md)** - Resource sharing system specification

### 📊 Research & Analysis
- **[research.md](research.md)** - Original botnet research and analysis
- **[research-share.md](research-share.md)** - Resource sharing research and benchmarks

### 🏗️ Implementation Plans
- **[plan.md](plan.md)** - Original botnet implementation plan
- **[plan-refactor.md](plan-refactor.md)** - Modular refactoring plan
- **[plan-event-driven.md](plan-event-driven.md)** - Event-driven execution plan
- **[plan-share.md](plan-share.md)** - Resource sharing implementation plan

### 📝 Task Breakdowns
- **[tasks-refactor.md](tasks-refactor.md)** - Modular architecture tasks
- **[tasks-event-driven.md](tasks-event-driven.md)** - Event system implementation tasks
- **[tasks-share.md](tasks-share.md)** - Resource sharing system tasks

### 📊 Data Models & Contracts
- **[data-model-share.md](data-model-share.md)** - Resource sharing data schemas
- **[contracts/](contracts/)** - TypeScript service interfaces and contracts
  - `service-contracts.ts` - Service layer interface definitions
  - `share-system-interfaces.ts` - Resource sharing system interfaces

### 🚀 Quick Start & Testing
- **[quickstart-share.md](quickstart-share.md)** - Manual testing scenarios for resource sharing

## Development Phases

### Phase 1: Core Botnet (✅ Complete)
- **Specification**: [spec.md](spec.md)
- **Research**: [research.md](research.md)  
- **Implementation**: [plan.md](plan.md)
- **Status**: Original monolithic botnet system implemented

### Phase 2: Modular Refactor (✅ Complete)
- **Specification**: [spec-refactor.md](spec-refactor.md)
- **Implementation**: [plan-refactor.md](plan-refactor.md)
- **Tasks**: [tasks-refactor.md](tasks-refactor.md)
- **Status**: Refactored into modular architecture with 8 utility modules

### Phase 3: Event-Driven System (✅ Complete)
- **Implementation**: [plan-event-driven.md](plan-event-driven.md)
- **Tasks**: [tasks-event-driven.md](tasks-event-driven.md)
- **Status**: Real-time HWGW operation monitoring implemented

### Phase 4: Resource Sharing (🔄 Partial)
- **Specification**: [spec-share.md](spec-share.md)
- **Research**: [research-share.md](research-share.md)
- **Implementation**: [plan-share.md](plan-share.md)
- **Tasks**: [tasks-share.md](tasks-share.md)
- **Data Model**: [data-model-share.md](data-model-share.md)
- **Testing**: [quickstart-share.md](quickstart-share.md)
- **Status**: Infrastructure in place, full implementation pending

## Current System Status

### ✅ **Implemented Features**
- **Modular Architecture**: Clean separation with 8 utility modules
- **Event-Driven Execution**: Real-time HWGW operation monitoring
- **Status Tracking**: Performance metrics and optimization tracking
- **Debug Tools**: Specialized testing and validation scripts
- **Server Management**: Automated server discovery and management

### 🚧 **Known Issues**
- **Event Communication**: Remote scripts publish events but main script uses simulation
- **Resource Sharing**: Infrastructure exists but sharing algorithms not fully implemented
- **Performance Optimization**: Advanced batching strategies pending

### 🎯 **Next Steps**
1. **Fix Event Communication**: Connect real event stream to main botnet script
2. **Complete Resource Sharing**: Implement advanced allocation algorithms
3. **Performance Optimization**: Add continuous batching and mathematical optimization
4. **Advanced Features**: Faction detection, reputation tracking, BitNode progression

## Architecture Overview

### Core Components
- **Main Script**: `src/botnet.ts` - Orchestrates all botnet operations
- **Utilities**: `src/lib/botnet-*.ts` - Modular utility functions
- **Remote Scripts**: `src/remote/{hk,gr,wk}.ts` - Distributed HWGW execution
- **Debug Tools**: `src/debug-*.ts` - Testing and validation utilities

### Data Flow
1. **Server Discovery** → Network scanning and rooting
2. **Target Selection** → Profitability analysis and prioritization  
3. **Resource Allocation** → Thread distribution across botnet
4. **HWGW Execution** → Distributed hack/grow/weaken operations
5. **Event Processing** → Real-time monitoring and optimization
6. **Performance Tracking** → Metrics collection and analysis

### Communication Patterns
- **Port 20**: HWGW operation events from remote scripts
- **LocalStorage**: Configuration and persistent state
- **NS API**: Game state queries and script execution

This consolidated documentation provides a complete reference for the botnet system's evolution from concept to implementation, supporting both development and maintenance activities.