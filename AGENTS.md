# AGENTS.md - Bitburner TypeScript Automation Framework

## Project Overview
This is a sophisticated Bitburner game automation framework built with TypeScript. The codebase creates autonomous agents that manage servers, execute hacking operations, solve contracts, and optimize resource allocation within the Bitburner game environment. All scripts run in-game and interact with the Bitburner API through the `NS` (Netscript) interface.

## Architecture & Patterns
- **Standalone scripts**: Each script is self-contained with main(ns: NS) function
- **Direct NS API usage**: Scripts interact directly with Bitburner NS API
- **Stateless operation**: Scripts gather data fresh from NS API each run (no persistent storage)
- **Modular design**: Features separated into main scripts (`/src`), utilities (`/src/lib`), remote scripts (`/src/remote`)
- **Distributed execution**: Remote scripts enable parallel processing across multiple servers
- **Self-contained interfaces**: Each script defines its own types and data structures inline

## Key File Locations
- **Main Scripts**: `src/*.ts` - Standalone automation scripts
- **Utilities**: `src/lib/` - Shared functions and browser API wrappers
- **Remote Scripts**: `src/remote/` - Lightweight scripts for distributed execution
- **Navigator**: `src/navigator.ts` - Browser automation and game interface interaction

## Feature Development Workflow
This project follows **Spec-Driven Development** for structured, high-quality feature development.

### Directory Structure
All feature development artifacts are organized in the `features/` directory:

```
features/
├── [feature-name]/
│   ├── spec.md              # Phase 1: Feature specification
│   ├── plan.md              # Phase 2: Technical implementation plan
│   ├── research.md          # Phase 2: Technical decisions and API research
│   ├── data-model.md        # Phase 2: Database schema and entities
│   ├── tasks.md             # Phase 3: Implementation task breakdown
│   ├── quickstart.md        # Phase 2: Manual testing scenarios
│   └── contracts/           # Phase 2: Service interfaces and API definitions
│       ├── api-interfaces.ts
│       └── service-contracts.ts
└── README.md                # Feature development guidelines
```

### Templates
All phases use standardized templates from `templates/` directory:
- `templates/spec-template.md` - Feature specification structure
- `templates/plan-template.md` - Technical implementation planning
- `templates/tasks-template.md` - Task breakdown and execution order

### Phase 1: Specification (`/specify` command)
**Goal**: Define WHAT the feature does and WHY it's needed (no implementation details)

**Template**: Uses `templates/spec-template.md` with Bitburner-specific:
- Game Integration Requirements (GI-xxx) - NS API integration, stateless script execution
- Performance Requirements (PR-xxx) - RAM constraints, execution timing
- Data Requirements (DR-xxx) - Dynamic data gathering via NS API, in-memory state
- Automation Requirements (AR-xxx) - Autonomous operation, logging

**Example prompt**:
```
/specify Create an autonomous contract solver that analyzes Bitburner coding contracts,
determines the optimal solution algorithm, and executes the solution. The system should
handle all 20+ contract types, track success rates, and learn from failures to improve
future performance. It should work across multiple servers and respect RAM constraints
while maximizing solving throughput.
```
/specify Create an autonomous contract solver that analyzes Bitburner coding contracts,
determines the optimal solution algorithm, and executes the solution. The system should
handle all 20+ contract types, track success rates, and learn from failures to improve
future performance. It should integrate with the existing task system and respect
server RAM constraints while maximizing solving throughput.
```

### Phase 2: Technical Planning (`/plan` command)
**Goal**: Define HOW to implement using our tech stack and architecture

**Template**: Uses `templates/plan-template.md` with Bitburner-specific:
- Standalone script architecture patterns
- Direct NS API usage and RAM cost considerations
- Stateless design principles (no persistent storage)
- Multi-server distribution patterns

**Example prompt**:
```
/plan The contract solver will be implemented as a standalone script that scans servers
for contracts, analyzes each type, and executes solutions. Use localStorage to cache
successful solution patterns and track performance metrics. Create remote scripts for
distributed contract solving across multiple servers. Respect RAM constraints and
implement proper error handling for network failures.
```
/plan The contract solver will extend the existing ScriptTask architecture with a new
ContractSolverTask. Use the Database singleton for caching contract patterns and solutions.
Implement as a service that interfaces with the Network component to discover contracts
across servers. Create algorithm implementations for each contract type as separate
modules. Use DynamicScript for execution and respect the 25GB browser API limitations.
```

### Phase 3: Task Breakdown (`/tasks` command)
**Goal**: Generate actionable, ordered implementation tasks

**Template**: Uses `templates/tasks-template.md` with Bitburner-specific:
- Standalone script implementation patterns
- Direct NS API integration steps
- In-memory data management (no persistence)
- Remote script distribution tasks

**Key Principles**:
- Use existing patterns (standalone scripts with main(ns) function)
- Follow TypeScript conventions and import patterns
- Respect Bitburner RAM constraints and NS API limitations
- Design for stateless operation (gather data fresh each run)

## Specification Guidelines

### Functional Requirements Template
When writing functional requirements for Bitburner features:

**Game Integration Requirements**:
- **GI-001**: System MUST integrate with existing NS API through DynamicScript
- **GI-002**: System MUST respect server RAM constraints and report memory usage
- **GI-003**: System MUST persist state in IndexedDB to survive game resets
- **GI-004**: System MUST register as ScriptTask with appropriate priority and interval

**Performance Requirements**:
- **PR-001**: System MUST execute within [X]GB RAM budget per server
- **PR-002**: System MUST complete operations within [X]ms to avoid blocking game loop
- **PR-003**: System MUST handle [X] concurrent operations across botnet
- **PR-004**: System MUST scale to [X] servers without performance degradation

**Data Requirements**:
- **DR-001**: System MUST store [specific data] in Database with schema version
- **DR-002**: System MUST maintain data consistency across game sessions
- **DR-003**: System MUST provide data migration for schema updates
- **DR-004**: System MUST expose data through [specific interface]

**Automation Requirements**:
- **AR-001**: System MUST operate autonomously without user intervention
- **AR-002**: System MUST adapt to changing game conditions [specify conditions]
- **AR-003**: System MUST prioritize operations based on [criteria]
- **AR-004**: System MUST log activities for monitoring and debugging

### Common Bitburner Entities
When defining data models, consider these standard entities:

**Server Entity**:
- Properties: hostname, maxMoney, securityLevel, hackTime, ports
- Relationships: Network topology, target selection, execution allocation

**HackingOperation Entity**:
- Properties: target, operationType, expectedGain, startTime, threads
- Relationships: Server, batch coordination

**Contract Entity**:
- Properties: contractType, difficulty, data, reward, location
- Relationships: Server location, solution algorithms

**Player Entity**:
- Properties: hackingLevel, money, skills, augmentations, currentServer
- Relationships: Available actions, progression tracking

### Success Criteria Templates

**Performance Metrics**:
- Memory efficiency: RAM usage per operation
- Execution speed: Operations per second
- Success rate: Percentage of successful completions
- Scalability: Performance across server count

**Game Impact Metrics**:
- Money generation rate increase
- Experience gain optimization
- Faction reputation improvements
- Contract solving accuracy

**System Health Metrics**:
- Task execution reliability
- Database operation success rate
- Network topology discovery completeness
- Error recovery effectiveness

### Legacy: Adding a New Script (Direct Implementation)
For simple scripts that don't require full spec-driven development:
1. Create standalone script in `src/[script-name].ts`
2. Implement main(ns: NS) function with automation logic
3. Add remote script in `src/remote/` if multi-server execution needed
4. Design for stateless operation (gather data fresh from NS API each run)

### Debugging Issues
1. Check script execution via `run [script-name].js` in Bitburner terminal
2. Monitor script output using ns.print() and ns.tprint() logs
3. Verify RAM constraints and NS API usage patterns
4. Test script restart behavior (stateless operation)

## Common Issues & Solutions
- **Build errors**: Check TypeScript import paths and module resolution
- **Runtime failures**: Verify correct NS API usage in DynamicScript
- **Database issues**: Ensure IndexedDB store names match schema
- **Script spawn failures**: Check RAM availability and file sync status

## Key Classes & Methods
- `Database.getInstance()` - Persistent storage singleton
- `DynamicScript.new()` - Runtime NS API execution
- `ScriptTask` - Base class for automation logic
- `Configuration.getInstance()` - Settings management

## Build & Development Commands
- `npm run watch` - Start development with file watching, TypeScript compilation, and game sync
- `npm run watch:init` - Initialize build environment and sync setup
- `npm run watch:transpile` - TypeScript compilation with watch mode
- `npm run watch:local` - Local file sync and build process
- `npm run watch:remote` - Bitburner Remote File API sync
- `npx tsc` - TypeScript compilation check
- `npx eslint src/` - Lint all source files

### **⚠️ CRITICAL: Watch Process Management**
**NEVER run `npm run watch` or any watch commands from AI agents!** The user manages their own watch process. Running watch commands from AI agents will:
- Kill existing watch processes the user is running
- Cause file sync conflicts and build issues
- Interrupt the user's development workflow

**Only use `npx tsc --noEmit` to check TypeScript compilation without interfering with the user's watch process.**
- **Note**: No test framework configured - testing happens in-game

## Code Style & Conventions
### Imports & Modules
- **Absolute imports**: Always use `/` prefix from src root (e.g., `import { Database } from "/lib/database"`)
- **Path aliases**: `@ns` for NetscriptDefinitions.d.ts, `@react` for lib/react.ts
- **Default exports**: Use for tasks and main entry points
- **Named exports**: Use for utilities, enums, interfaces

### TypeScript Patterns
- **Strict typing**: Strict TypeScript mode enabled, avoid `any` type
- **Interface naming**: Prefix with `I` (e.g., `IScriptTask`, `IRemoteScriptArgs`)
- **Enum usage**: For constants and configurations (e.g., `DatabaseStoreName`, `TaskNames`)
- **Async/await**: Preferred over promises, minimal try/catch usage
- **No unnecessary destructuring**: Keep variable access simple
- **Single-word variables**: Prefer concise naming where possible

### File & Directory Structure
- **Naming**: kebab-case for files, PascalCase for classes/types, camelCase for variables/functions
- `/lib/` - Shared utilities (database, network, system, configuration)
- `/models/` - TypeScript interfaces and type definitions
- `/tasks/` - Automation task implementations
- `/remote/` - Scripts designed for distributed execution on multiple servers
- **Entry points**: `daemon.ts` (main orchestrator), `start.ts` (initialization)

### Game-Specific Patterns
- **NS interface**: All Bitburner API calls go through the `ns` parameter
- **Database persistence**: Store all critical state in IndexedDB to survive game resets
- **Memory management**: Scripts must be RAM-efficient for in-game constraints
- **Distributed computing**: Use purchased servers for parallel processing
- **Network topology**: Automatically discover and root servers for botnet expansion

## Key Components
### Core Scripts
- **Botnet** (`botnet.ts`): Advanced HWGW batching with multi-server coordination
- **Navigator** (`navigator.ts`): Browser automation and game interface interaction
- **Contracts** (`contracts.ts`): Coding contract solver and automation
- **Casino Bot** (`casino-bot.ts`): Automated gambling and money generation

### Utilities & Libraries
- **React utilities** (`lib/react.ts`): Browser DOM manipulation and UI automation
- **Remote scripts** (`remote/`): Lightweight distributed execution scripts
- **Data patterns**: In-memory structures, fresh NS API data gathering each run

### Browser Integration
- **Zero-cost DOM access**: Stealth techniques bypass Bitburner's RAM penalties
- **Game interface automation**: Direct UI manipulation and state reading
- **Cross-script communication**: localStorage and browser APIs for coordination

## Development Guidelines
### DO
- Use standalone scripts with main(ns: NS) function pattern
- Design for stateless operation (gather data fresh from NS API each run)
- Follow self-contained script architecture for new features
- Use direct NS API calls for game interactions
- Implement proper logging with ns.print() and ns.tprint()
- Write RAM-efficient code for Bitburner constraints

### AVOID
- Hardcoded values - use script arguments or dynamic NS API queries
- Persistent state storage - design scripts to work statelessly
- Synchronous operations that block game performance
- Memory leaks - clean up resources and intervals properly
- Complex abstractions - keep scripts simple and focused
- External dependencies - scripts should be self-contained

### Testing & Debugging
- Test in-game using the built-in development console
- Use `ns.print()` and `ns.tprint()` for debugging output
- Monitor task execution through the HUD manager
- Verify database state persistence across game sessions
- Check network topology updates and server status

## Integration Notes
This codebase is designed specifically for Bitburner automation and follows game-specific constraints and API patterns. When making changes, consider the in-game RAM costs, execution timing, and multiplayer considerations.

## Browser API RAM Cost Research
Comprehensive testing has revealed the exact RAM costs for browser APIs in Bitburner scripts:

### **🔥 EXPENSIVE APIs (25GB RAM penalty each)**
- **`window`** - 25.00GB penalty when used as literal string
- **`document`** - 25.00GB penalty when used as literal string

### **🥷 BREAKTHROUGH: Stealth Access Technique**
**MAJOR DISCOVERY**: Bitburner's RAM penalty system uses static analysis that only detects literal string usage. **Dynamic property access completely bypasses all RAM penalties!**

#### **Zero-Cost Access Method:**
```javascript
// ❌ EXPENSIVE (25GB penalty):
const windowAPI = window;
const documentAPI = document;

// ✅ FREE (0GB cost):
const windowAPI = globalThis['win' + 'dow'];
const documentAPI = globalThis['doc' + 'ument'];
```

#### **Production Implementation:**
Use `src/browser-utils.ts` for safe API access:
```javascript
import { getWindowAPI, getDocumentAPI, clickElement } from '/browser-utils';

const win = getWindowAPI();        // FREE window access
const doc = getDocumentAPI();      // FREE document access
clickElement('.game-button');      // FREE DOM automation
```

### **🚀 Unlocked Capabilities**
The stealth technique enables **full browser automation** at zero RAM cost:

#### **DOM Manipulation (FREE)**
- `querySelector()`, `getElementById()`, `createElement()`
- Element clicking, form filling, content extraction
- Full UI automation without penalties

#### **Browser Control (FREE)**
- Page navigation, history manipulation
- URL changes, reloading
- Tab/window management

#### **Advanced Automation (FREE)**
- Real-time DOM monitoring
- Dynamic script injection
- Complex UI interaction workflows
- Game interface automation

### **✅ FREE APIs (0GB RAM cost)**
All other browser APIs are safe to use without RAM penalties:

#### Storage APIs
- `localStorage` - Persistent key-value storage
- `sessionStorage` - Session-scoped storage  
- `indexedDB` - NoSQL database with transactions
- `caches` - HTTP response caching

#### Network APIs
- `fetch` - Modern HTTP requests
- `XMLHttpRequest` - Legacy HTTP requests with progress
- `WebSocket` - Real-time bidirectional communication
- `EventSource` - Server-sent events

#### Crypto APIs
- `crypto` - Random number generation
- `crypto.subtle` - Advanced cryptographic operations

#### Performance & Timing APIs
- `performance` - High-resolution timing measurements
- `PerformanceObserver` - Performance monitoring
- `setTimeout` / `setInterval` - Delayed/repeated execution
- `requestAnimationFrame` - Frame-synced timing
- `requestIdleCallback` - Idle time execution

#### Worker & Communication APIs
- `Worker` - Background processing threads
- `SharedWorker` - Shared background workers
- `BroadcastChannel` - Cross-tab/script communication
- `MessageChannel` - Structured message passing

#### File & Data APIs
- `Blob` - Binary data handling
- `File` - File object manipulation
- `FileReader` - File content reading
- `URL` - URL parsing and manipulation
- `URLSearchParams` - Query parameter handling
- `TextEncoder` / `TextDecoder` - Text encoding conversion

#### Utility APIs
- `console` - Logging and debugging
- `JSON` - Data serialization
- `AbortController` - Operation cancellation
- `Notification` - Desktop notifications

### **RAM Optimization Strategy**
1. **AVOID** literal `window` and `document` strings - Use 25GB each
2. **USE** dynamic property access: `globalThis['win' + 'dow']` - FREE
3. **LEVERAGE** `src/browser-utils.ts` for production-ready utilities
4. **IMPLEMENT** full browser automation without RAM constraints
5. **UTILIZE** all other browser APIs freely - They cost 0GB

### **Utility Library**
- **`src/browser-utils.ts`** - Production-ready browser API utilities with zero RAM cost
  - DOM manipulation, browser control, automation helpers
  - All expensive APIs accessible via stealth techniques
  - TypeScript support with error handling
  - Ready for import in automation scripts

### **Development Impact**
This breakthrough **revolutionizes Bitburner automation** by enabling:
- **Full DOM automation** - Click any element, fill forms, read content
- **Advanced UI scripting** - Automate complex game interactions
- **Real-time monitoring** - Watch for game state changes
- **Cross-script coordination** - BroadcastChannel communication
- **Sophisticated workflows** - Multi-step automation sequences

The stealth technique transforms Bitburner from a limited NS API environment into a **full browser automation platform** while maintaining optimal memory efficiency.
