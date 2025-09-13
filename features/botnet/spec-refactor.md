# Botnet Script Refactoring Specification

## Overview
The current `botnet.ts` script is a monolithic 485-line file that handles multiple complex responsibilities in a single massive main() function. This specification defines the requirements for refactoring it into a well-organized, maintainable, and debuggable system while preserving all existing functionality.

## Problem Statement
The current botnet.ts script suffers from several maintainability issues:
- **Monolithic structure**: 485-line main() function with multiple responsibilities
- **Code duplication**: Inline utility functions and repeated patterns
- **Poor organization**: Mixed concerns (HWGW batching, server management, repboost system)
- **Debugging difficulty**: Hard to isolate and test individual components
- **Extension challenges**: Adding new features requires modifying the massive main function

## Functional Requirements

### Core Preservation Requirements (CP-xxx)
- **CP-001**: System MUST maintain identical RAM costs for all operations
- **CP-002**: System MUST preserve all existing command-line options and their behavior
- **CP-003**: System MUST maintain identical HWGW batching performance and timing
- **CP-004**: System MUST preserve repboost system functionality and DOM integration
- **CP-005**: System MUST maintain distributed execution capabilities across botnet
- **CP-006**: System MUST preserve server management (rooting, purchasing, upgrading)
- **CP-007**: System MUST maintain continuous batching and status reporting

### Code Organization Requirements (CO-xxx)
- **CO-001**: Main function MUST be reduced to under 100 lines with clear control flow
- **CO-002**: System MUST extract reusable utilities into focused modules
- **CO-003**: System MUST create proper TypeScript interfaces for all data structures
- **CO-004**: System MUST separate concerns into distinct functional areas
- **CO-005**: System MUST maintain self-contained script architecture (no external dependencies)
- **CO-006**: System MUST preserve existing import patterns and file structure

### Maintainability Requirements (MR-xxx)
- **MR-001**: Each module MUST have a single, well-defined responsibility
- **MR-002**: Code MUST be easily debuggable with clear error boundaries
- **MR-003**: New features MUST be addable without modifying core control flow
- **MR-004**: Configuration MUST be centralized and easily modifiable
- **MR-005**: System MUST provide clear logging and debugging capabilities

### Game Integration Requirements (GI-xxx)
- **GI-001**: System MUST maintain NS API integration patterns and RAM efficiency
- **GI-002**: System MUST preserve browser API stealth techniques for DOM access
- **GI-003**: System MUST maintain stateless operation (fresh NS API data each cycle)
- **GI-004**: System MUST preserve exit handler for script cleanup
- **GI-005**: System MUST maintain compatibility with existing remote scripts

### Performance Requirements (PR-xxx)
- **PR-001**: Refactored system MUST NOT increase memory usage above current levels
- **PR-002**: Refactored system MUST NOT degrade execution timing or batching performance
- **PR-003**: System MUST maintain real-time status updates and monitoring
- **PR-004**: System MUST preserve efficient network topology scanning and server management

## Data Requirements

### Core Data Models (DM-xxx)
- **DM-001**: Maintain existing ServerData interface with all current properties
- **DM-002**: Preserve BotnetOptions interface with all command-line parameters
- **DM-003**: Maintain HWGW batch interfaces (IHWGWBatch, IPrepBatch)
- **DM-004**: Preserve repboost system interfaces (ShareAllocation, FactionWorkStatus)
- **DM-005**: Maintain execution tracking interfaces (IExecutionResults, ScriptStats)

### Configuration Management (CM-xxx)
- **CM-001**: Centralize all configuration constants in single location
- **CM-002**: Provide type-safe access to configuration values
- **CM-003**: Support runtime configuration validation
- **CM-004**: Maintain backward compatibility with existing option names

## Refactoring Scope

### In-Scope Modules for Extraction
1. **HWGW Batching Engine**: Target selection, batch calculation, execution coordination
2. **Server Management System**: Rooting, purchasing, upgrading, network scanning
3. **Repboost Management**: Faction detection, share allocation, script deployment
4. **Resource Allocation**: RAM management, thread distribution, server selection
5. **Status Reporting**: Performance monitoring, debug output, system statistics
6. **Configuration Management**: Option parsing, validation, defaults

### Out-of-Scope (Preserved As-Is)
1. **Inlined External Classes**: FactionDetector, ShareCalculator, ServerOptimizer remain inline
2. **Remote Script Files**: simple-*.js files remain unchanged
3. **Command-Line Interface**: Autocomplete and option schema remain identical
4. **Core Algorithms**: HWGW timing calculations, growth analysis, security calculations

## Success Criteria

### Code Quality Metrics
- **Main function**: Reduced from 485 lines to under 100 lines
- **Module count**: 6-8 focused modules with single responsibilities
- **Cyclomatic complexity**: Each function under 10 complexity points
- **Code duplication**: Eliminate repeated patterns and utility functions

### Functional Verification
- **RAM usage**: Identical memory consumption in all execution modes
- **Performance**: No degradation in batch timing or throughput
- **Options**: All command-line flags work identically
- **Output**: Status reporting and debug output remain consistent
- **Cleanup**: Exit handlers and script termination work identically

### Developer Experience
- **Debuggability**: Individual modules can be tested and debugged in isolation
- **Extensibility**: New features can be added as new modules without core changes
- **Readability**: Code structure clearly communicates system architecture
- **Maintainability**: Configuration changes require minimal code modifications

## Non-Functional Requirements

### Compatibility Requirements (CR-xxx)
- **CR-001**: Refactored system MUST work with existing save files and game state
- **CR-002**: System MUST maintain compatibility with all Bitburner game versions
- **CR-003**: System MUST preserve TypeScript strict mode compliance
- **CR-004**: System MUST maintain existing ESLint compliance

### Development Requirements (DR-xxx)
- **DR-001**: Refactoring MUST be completable in phases without breaking functionality
- **DR-002**: Each module MUST have clear interfaces and minimal coupling
- **DR-003**: System MUST support both debug and production execution modes
- **DR-004**: Code MUST follow existing naming conventions and style patterns

## Risk Mitigation

### Critical Risks
1. **Performance Regression**: Maintain identical execution timing through careful module design
2. **Feature Loss**: Comprehensive verification of all functionality before deployment
3. **RAM Increase**: Careful attention to NS API usage patterns and RAM optimization
4. **Integration Failures**: Preserve all existing external integrations and script interactions

### Validation Strategy
1. **Side-by-side testing**: Run original and refactored versions in parallel
2. **Performance benchmarking**: Measure RAM usage, execution time, and batch throughput
3. **Feature matrix verification**: Test all command-line options and system behaviors
4. **Long-running stability**: Validate continuous operation and resource management

## Implementation Constraints

### Technical Constraints
- **Single file limitation**: All code must remain in single botnet.ts file
- **No external dependencies**: Cannot add new imports or external libraries
- **NS API limitations**: Must respect Bitburner's memory cost model
- **TypeScript compatibility**: Must compile with existing tsconfig.json

### Architectural Constraints
- **Module boundaries**: Clear separation of concerns without circular dependencies
- **Interface stability**: Maintain compatibility with existing remote scripts
- **Configuration format**: Preserve existing option parsing and validation
- **Error handling**: Maintain existing error recovery and cleanup behaviors

This refactoring will transform the botnet.ts script from a monolithic automation tool into a well-structured, maintainable system that preserves all functionality while dramatically improving code organization and developer experience.