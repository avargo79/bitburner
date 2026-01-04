# Hacknet Server Guide

The **Hacknet Server** is the evolved form of the Hacknet Node, unlocked in **BitNode-9** (or via Source-File 9).

## Nodes vs. Servers
- **Hacknet Node**: Generates **Money** ($/sec). Basic early game income.
- **Hacknet Server**: Generates **Hashes** (hashes/sec). Advanced utility resource.

## Core Mechanics
- **Production**: Depends on Level, RAM, Cores.
- **Cache**: Unlike Nodes, Servers have a "Cache" level. You **must** upgrade cache to store more hashes. If cache is full, production stops!
- **API**: `ns.hacknet` handles both.
  - `ns.hacknet.spendHashes(upgName, target)` is the key function.

## Hash Spending Strategies

### 1. Early Game (Money)
- **Upgrade**: `Sell for Money`
- **Exhange**: 4 Hashes -> $1,000,000.
- **Strategy**: Excellent for kickstarting a new run. Often better than hacking early on.

### 2. Mid Game (Hacking Support)
- **Upgrade**: `Reduce Minimum Security` & `Increase Maximum Money`.
- **Target**: Use on your best hacking target (e.g., `ecorp`, `megacorp`).
- **Strategy**: Instantly preps a server for massive batch hacking.

### 3. Corp & Late Game
- **Upgrade**: `Sell for Corporation Funds`.
- **Effect**: Dumps cash directly into your Corporation's treasury. Critical for fast Corp growth.
- **Upgrade**: `Exchange for Bladeburner Rank` / `Exchange for Bladeburner SP`.
- **Effect**: Accelerates the slow Bladeburner progression.

### 4. Server Farm Management
- **Upgrade**: `Generate Coding Contract`.
- **Effect**: Buys a contract. Used to farm reputation or specific rewards if you have an auto-solver.

## Automation Logic
A robust Hacknet Server script needs two loops:

1. **Upgrade Loop**:
   - Calculate ROI of (Cost / Production Increase).
   - Buy Level/RAM/Core if ROI < Threshold time.
2. **Spending Loop**:
   - If `Hashes > Capacity * 0.9`:
     - Spend on chosen priority (Money, Corp, or Server Buffs).
   - **Crucial**: Upgrade Cache if `Hashes == Capacity` and no spending is desired yet.

## API Cheat Sheet
```javascript
// Buy a node
ns.hacknet.purchaseNode();

// Upgrade stats
ns.hacknet.upgradeLevel(index, 1);
ns.hacknet.upgradeRam(index, 1);
ns.hacknet.upgradeCore(index, 1);
ns.hacknet.upgradeCache(index, 1);

// Spend Hashes
ns.hacknet.spendHashes("Sell for Money");
ns.hacknet.spendHashes("Increase Maximum Money", "n00dles");
```
