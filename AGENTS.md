# AGENTS.md - Bitburner TypeScript Automation Framework

## Project Overview
This is a sophisticated Bitburner game automation framework built with TypeScript. The codebase creates autonomous agents that manage servers, execute hacking operations, solve contracts, and optimize resource allocation within the Bitburner game environment. All scripts run in-game and interact with the Bitburner API through the `NS` (Netscript) interface.

## Architecture & Patterns
- **Task-based architecture**: Core functionality organized as ScriptTask instances with priority, scheduling, and state management
- **Database-driven**: Uses IndexedDB through custom Database singleton for persistent storage across game resets
- **Dynamic script generation**: DynamicScript class generates and executes Netscript code on-demand
- **Modular design**: Features separated into `/lib` (utilities), `/models` (types), `/tasks` (automation logic), `/remote` (distributed scripts)
- **Singleton pattern**: Database, Configuration, and other core services use static getInstance() methods
- **Event-driven**: Task scheduler with intervals, priorities, and dependency management

## Key File Locations
- **Main Entry**: `src/daemon.ts` - Task orchestrator
- **Core Systems**: `src/lib/` - Database, network, configuration
- **Task Logic**: `src/tasks/` - Individual automation modules
- **Remote Scripts**: `src/remote/` - Distributed execution scripts
- **Types**: `src/models/` - TypeScript interfaces

## Typical AI Agent Workflows
### Adding a New Task
1. Create interface in `/models/`
2. Implement task class extending ScriptTask in `/tasks/`
3. Register the new task in `src/daemon.ts`
4. Add database schema if persistent state is needed

### Debugging Issues
1. Check `src/daemon.ts` for task registration and scheduling
2. Verify database schema and store names in `src/lib/database.ts`
3. Monitor script execution and logs in `/remote/` scripts

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
### Core Systems
- **Database** (`/lib/database.ts`): IndexedDB wrapper with typed store management
- **DynamicScript** (`/lib/system.ts`): Runtime script generation and execution
- **Network** (`/lib/network.ts`): Server discovery, routing, and topology mapping
- **Configuration** (`/lib/configuration.ts`): Persistent settings and parameters

### Task Management
- **ScriptTask** (`/models/ScriptTask.ts`): Base class for all automation tasks
- **Daemon** (`daemon.ts`): Task scheduler and orchestration engine
- **Task implementations**: Server management, hacking operations, contract solving

### Distributed Computing
- **Remote scripts** (`/remote/`): Lightweight scripts for multi-server execution
- **Batching** (`batcher.ts`): Coordinated hack/grow/weaken operations
- **Resource allocation**: Dynamic server provisioning and workload distribution

## Development Guidelines
### DO
- Use the singleton pattern for stateful services
- Leverage IndexedDB for all persistent data
- Follow the task-based architecture for new features
- Use dynamic script generation for NS API interactions
- Implement proper priority and scheduling for tasks
- Write RAM-efficient code for game constraints

### AVOID
- Hardcoded values - use Configuration system instead
- Synchronous operations - prefer async/await
- Memory leaks - clean up resources properly
- Blocking operations in the main daemon loop
- Direct file system access - use the build system

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
