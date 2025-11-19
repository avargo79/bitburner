# Corporation Autopilot - Reference Implementation

## Overview
This is the proven corporation automation script from mirkoconsiglio's Bitburner-scripts repository.

**Source:** https://github.com/mirkoconsiglio/Bitburner-scripts/blob/main/corporation/autopilot.js

## How It Works

### Phase 1: Basic Agriculture Setup (part1)
- Expands to Agriculture division
- Unlocks and enables Smart Supply
- Expands to all 6 cities
- Purchases warehouses
- Hires 3 employees per city (1 Operations, 1 Engineer, 1 Business)
- Sells Food and Plants at market price (MP)
- Upgrades warehouses to level 2
- Hires 1 AdVert

### Phase 2: Investment-Funded Growth (part2)
**Critical:** This phase WAITS for investment rounds before spending!

1. **Pre-Investment Round 1 ($210B):**
   - Upgrades FocusWires, Neural Accelerators, etc. to level 2
   - Buys initial boost materials: Hardware (125), AI Cores (75), Real Estate (27k)

2. **After Investment Round 1 ($210B):**
   - Upgrades office size to 9 employees
   - Upgrades Smart Factories & Smart Storage to level 10
   - Upgrades warehouses to level 9
   - Buys more boost materials: Hardware (2.8k), Robots (96), AI Cores (2.5k), Real Estate (146k)

3. **After Investment Round 2 ($5T):**
   - Upgrades warehouses to level 19
   - Buys massive boost materials: Hardware (9.3k), Robots (726), AI Cores (6.3k), Real Estate (230k)

### Phase 3: Tobacco Division (part3)
- Expands to Tobacco industry (the real money-maker!)
- Expands to all cities with warehouses
- Main city (Aevum): 30 employees
- Other cities: 9 employees each
- Starts making Tobacco v1 with $1B design + $1B marketing

### Autopilot Loop
Runs forever managing Tobacco products:
- Develops new Tobacco versions (doubling investment each time: v1=$1B, v2=$2B, v4=$4B...)
- Sells at MP * 2^(version-1) multiplier
- Purchases research upgrades (Lab, Market-TA.I, Market-TA.II, Fulcrum, Capacity)
- Levels upgrades continuously at 10% of funds threshold
- Goes public when revenue >= $1 quintillion
- Issues dividends based on revenue
- Manages share buybacks

## Key Patterns

### moneyFor() - Wait for Funds
```javascript
async function moneyFor(ns, func, ...args) {
    while (func(...args) > ns.corporation.getCorporation().funds) {
        await ns.sleep(1000);
    }
}
```
**Never spends money the corporation doesn't have!**

### buyMaterialsUpto() - Exact Target Buying
```javascript
async function buyMaterialsUpto(ns, division, city, materials) {
    // Sets buy rate to (target - current) / 10
    // Loops until target reached
    // Sets buy rate to 0 when done
}
```
**Buys to exact quantities, then STOPS. No continuous purchasing!**

### Smart Supply Philosophy
- Enable once and TRUST it
- Never manually buy Water or input materials
- Only disable if deeply bankrupt (< -$5B)

### Research Priority
1. Hi-Tech R&D Laboratory (enables research)
2. Market-TA.I (automatic pricing)
3. Market-TA.II (better automatic pricing)
4. uPgrade: Fulcrum
5. uPgrade: Capacity.I & II (more product slots)

### Upgrade List (leveled continuously)
- Smart Factories, Smart Storage
- DreamSense, Wilson Analytics
- Nuoptimal Nootropic Injector Implants
- Speech Processor Implants, Neural Accelerators
- FocusWires, ABC SalesBots, Project Insight

## Why This Script Works

1. **Phased Approach:** Doesn't try to do everything at once
2. **Investment-Funded:** Uses massive investment rounds to fuel growth (not organic profit)
3. **Tobacco Focus:** Agriculture is just preparation for Tobacco (the real profit engine)
4. **Material Targets:** Buys materials to exact quantities, then stops
5. **Smart Supply Trust:** Lets the game handle input materials automatically
6. **Patient Waiting:** Uses `moneyFor()` to wait indefinitely for funds

## What Was Wrong With Our Old Script

1. ❌ Tried to optimize Agriculture at Investment Round 4 without funding
2. ❌ Bought boost materials continuously without targets
3. ❌ Tried to speed up Agriculture instead of moving to Tobacco
4. ❌ Complex bankruptcy recovery systems (reference script doesn't need them!)
5. ❌ Manual material management fighting Smart Supply

## Expected Timeline

- **Part 1:** ~10-20 minutes (basic setup)
- **Part 2 (Round 1):** Wait for $210B offer, then ~30 minutes of expansion
- **Part 2 (Round 2):** Wait for $5T offer, then ~1 hour of massive scaling
- **Part 3:** Tobacco setup ~30 minutes
- **Autopilot:** Forever, printing money exponentially

## Running the Script

```bash
run corp.ts
```

The script will:
1. Execute Part 1 immediately
2. Wait for Investment Round 1 ($210B)
3. Execute Part 2 expansion
4. Wait for Investment Round 2 ($5T)
5. Execute Part 2 scaling
6. Execute Part 3 (Tobacco)
7. Run autopilot loop forever

**Important:** The script will appear to "hang" while waiting for investment offers. This is NORMAL and EXPECTED!
