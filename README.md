# Bitburner TypeScript Automation Framework

## Project Overview
This repository contains a custom, production-grade Bitburner automation framework written in TypeScript. It features advanced agent-based task scheduling, HWGW batching, persistent database storage, and distributed hacking operations for optimal in-game performance.

- **Task-based architecture**: Modular, extensible, and robust
- **Persistent state**: Uses IndexedDB for cross-session data
- **Continuous batching**: Maximizes RAM utilization and hacking income
- **Distributed execution**: Leverages all available servers

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

## Development & Build
- All source code is in the `/src` directory
- TypeScript is compiled and synced automatically by the watcher
- Use `npx tsc` to check for type errors
- Use `npx eslint src/` to lint code

## Documentation
- See source code comments and TypeScript interfaces for detailed usage
- Main entry point: `src/daemon.ts`
- Configuration: `src/lib/configuration.ts`

## License
This project is for personal Bitburner automation and is not affiliated with the official Bitburner template. Use at your own risk.
