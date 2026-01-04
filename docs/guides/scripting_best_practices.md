# Scripting Best Practices

Writing efficient, maintainable code is key to conquering Bitburner. This guide outlines the community-accepted "meta" for scripting.

## 1. Use Netscript 2 (NS2)
Always use `.js` files (NS2) instead of `.script` files (NS1).
- **Speed**: NS2 runs as native JavaScript in the browser, making it significantly faster (up to 1000x for complex logic).
- **Features**: Access to modern JS features (Promises, async/await, Modules, Classes).
- **Cost**: NS2 has a slightly higher RAM overhead for the script itself (1.6GB vs ram cost of used functions), but the performance and flexibility gains are massive.

## 2. RAM Optimization
RAM is your most precious resource early game.
- **Modularize**: Don't put your hacking logic (`hack()`, `grow()`, `weaken()`) in your main controller script. Spawn "worker" scripts that do just one thing.
  - *Why?* A script that calls `hack` costs RAM. If you spawn 1000 threads of a 1.7GB script, that's expensive. A dedicated `hack-worker.js` is tiny.
- **Dynamic RAM Calculation**: Use `ns.getScriptRam()` to check if you can run a script before trying `ns.exec()`.

## 3. Intellisense with JSDoc
To get code completion in the in-game editor (or VS Code), add the standard JSDoc comment at the top of every file:

```javascript
/** @param {NS} ns */
export async function main(ns) {
    // ns. now shows autocomplete!
    const money = ns.getServerMoneyAvailable("home");
}
```

## 4. Project Structure
Organize your scripts as your codebase grows.
- `/controllers/`: Main orchestrators (e.g., `hack-manager.js`, `corp-manager.js`).
- `/workers/`: Tiny scripts for threading (e.g., `hack.js`, `grow.js`).
- `/lib/`: Reusable library functions (e.g., `formatter.js`, `network.js`).

## 5. Async/Await
In NS2, most game actions (like `hack`, `grow`, `packet`, `sleep`) return Promises. You **must** `await` them.
- **Correct**: `await ns.hack("n00dles");` -> waits for completion.
- **Incorrect**: `ns.hack("n00dles");` -> fires and forgets (often fails or desyncs logic).
