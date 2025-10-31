# BitNode 4 Speed Completion Suite

## Overview
Complete collection of automation scripts for BitNode 4 completion with maximum automation.

**Realistic Time**: 8-16 hours with full automation (overnight run recommended)

**Note**: BitNode 4 is designed to be a slower BitNode due to severe money/exp nerfs. The automation handles the grind for you - just let it run!

## BitNode 4: The Singularity

### Key Challenges
- **Money from hacking**: 20% normal (severely nerfed!)
- **Hack exp gain**: 40% normal
- **Company salary**: 10% normal (avoid company work!)
- **Crime money**: 20% normal
- **Training efficiency**: 50% normal

### Completion Requirements
1. Acquire 30+ augmentations (to join Daedalus)
2. Join Daedalus faction
3. Purchase The Red Pill augmentation from Daedalus
4. Install augmentations
5. Hack w0r1d_d43m0n server

## Quick Start

### Prerequisites (Bootstrap)

**Important**: Before running the full automation, you need basic resources:

- **$10b from casino** (provides capital for everything)
- **256GB+ Home RAM** (to run all automation scripts - they require 171.1GB total!)
- **Hacking level 10+** (for basic server access)

### **⚠️ Early Install Strategy (Automatic Soft Resets)**

**NEW**: The automation now includes intelligent **early install detection** that automatically triggers augmentation installation when prices become too expensive!

**Why This Matters**: Augmentation prices increase by 1.9x (90%) with each purchase. After 15+ augmentations, prices can be 15-37x base cost, making progress extremely slow. Installing early and resetting allows you to:
- **Reset all prices** back to base values
- **Gain permanent multipliers** that make the next run 2-3x faster
- **Complete BN4 in ~4-5 hours** instead of 8-10 hours of grinding

**Automatic Triggers**:
- After **8+ augmentations** when average aug price > **10x current money**
- When you have **< 3 affordable augmentations** and prices are **10x+ base cost**
- When price multiplier reaches **5x+ base prices** and grinding would take hours

**Typical Timeline**:
1. **First Run** (2-3 hours): Get 8-12 cheap augs with exp/hack multipliers → **AUTO INSTALL**
2. **Second Run** (1.5-2 hours): With multipliers, get 15-20 more augs → **AUTO INSTALL**
3. **Final Run** (1-1.5 hours): Push to 30+ augs → Destroy w0r1d_d43m0n ✓

**Configuration**:
```bash
# Default (automatic early install enabled)
run bn4.js

# Disable early install (manual control)
run auto-augs.js --early-install false

# Adjust trigger threshold (default: 10x money)
run auto-augs.js --early-install-multiplier 15  # More conservative
run auto-augs.js --early-install-multiplier 5   # More aggressive
```

**📖 See [EARLY-INSTALL-STRATEGY.md](./EARLY-INSTALL-STRATEGY.md) for detailed explanation, math, and examples.**

### **⚠️ CRITICAL: RAM Requirements Breakdown**

The automation suite requires **171.1GB total RAM** to run all scripts simultaneously:

| Script | RAM Cost | Purpose |
|--------|----------|---------|
| `bn4.js` | 59.7GB | Main orchestrator and progress monitoring |
| `auto-augs.js` | 28.2GB | Automated augmentation purchasing |
| `auto-factions.js` | 26.1GB | Automated faction work and joining |
| `auto-crime.js` | 17.1GB | Early game crime income generation |
| `botnet.js` | 11.0GB | Main hacking income (HWGW batching) |
| `contracts.js` | 29.0GB | Coding contract solver |
| **TOTAL** | **171.1GB** | All automation running |

**RAM Upgrade Costs:**
- **256GB**: ~$24m (minimum viable - 85GB headroom)
- **512GB**: ~$96m (recommended - 340GB headroom)
- **1024GB**: ~$384m (comfortable - plenty of room)

**Why so much RAM?** BitNode 4 applies a **16x multiplier** to Singularity function RAM costs (without SF4 level 3), making automation scripts extremely memory-intensive.

If you're starting fresh in BN4, run the bootstrap sequence first:

```bash
# Bootstrap sequence (fresh start)
run start.js

# This will:
# 1. Train basic stats (str 50, def/dex/agi 20, hack 10)
# 2. Mug for initial $200k
# 3. Travel to Aevum casino
# 4. Auto-gamble until kicked out at $10b (takes 5-15 minutes)
# 5. Auto-purchase TOR router and all darkweb programs

# While casino is running:
# - Go to City > Alpha Enterprises
# - Upgrade Home RAM to 256GB minimum ($24m) or 512GB recommended ($96m)

# Once you have $10b and 256GB+ RAM:
kill start.js
kill casino-bot.js
run bn4.js
```

### Option 1: Full Automation (Recommended)
```bash
run bn4.js
```
This starts all automation scripts and monitors progress.

### Option 2: Manual Control
```bash
# Income generation
run botnet.js           # Main income source
run contracts.js        # Extra income from contracts
run auto-crime.js       # Early game crime income

# Faction & Augmentation automation
run auto-factions.js    # Automated faction work
run auto-augs.js        # Automated augmentation purchasing

# Monitor progress
tail bn4.js
```

## Script Descriptions

### `bn4.js` - Main Orchestrator
**Purpose**: Coordinates all automation and monitors completion progress

**Features**:
- Starts all necessary automation scripts
- Monitors augmentation count progress
- Tracks Daedalus requirements
- Auto-destroys w0r1d_d43m0n when ready

**Usage**:
```bash
run bn4.js                    # Full automation
run bn4.js --no-auto-destroy  # Manual completion
run bn4.js --debug            # Verbose output
```

### `auto-factions.js` - Faction Automation
**Purpose**: Automates joining factions and working for reputation

**Features**:
- **Auto-travels to cities** for faction invites (New Tokyo, Ishima, Volhaven, etc.)
- **Auto-backdoors faction servers** (CyberSec, NiteSec, The Black Hand, BitRunners)
- Auto-accepts all faction invitations
- Intelligently selects best faction to work for
- Prioritizes Daedalus once joined
- Smart work type selection (hacking/field/security)
- Automatic pathfinding and server navigation

**City Travel Support**:
The script automatically travels to cities when you meet the money requirements:
- **Chongqing** (Tian Di Hui) - requires $1m + hacking 50
- **Sector-12** (Sector-12) - requires $15m
- **New Tokyo** (New Tokyo) - requires $20m - *has Neuroreceptor Management augmentation!*
- **Chongqing** (Chongqing) - requires $20m
- **Ishima** (Ishima) - requires $30m
- **Aevum** (Aevum) - requires $40m
- **Volhaven** (Volhaven) - requires $50m

**⚠️ Faction Conflicts (Mutually Exclusive):**
The script automatically handles these conflicts and won't join incompatible factions:

**Gang Factions** (can only join ONE):
- Slum Snakes, Tetrads, The Syndicate, The Dark Army, Speakers for the Dead
- ✅ Script picks the first gang faction you join and skips the rest
- 💡 **Tip**: Slum Snakes is fine for BitNode 4 completion

**City Factions** (have enemy relationships - strategic choice required!):

| Faction | Can Join With | CANNOT Join With (Enemies) |
|---------|---------------|----------------------------|
| **Sector-12** | ✅ Aevum | ❌ Chongqing, New Tokyo, Ishima, Volhaven |
| **Aevum** | ✅ Sector-12 | ❌ Chongqing, New Tokyo, Ishima, Volhaven |
| **Chongqing** | (none) | ❌ Sector-12, Aevum, Volhaven |
| **New Tokyo** | (none) | ❌ Sector-12, Aevum, Volhaven |
| **Ishima** | (none) | ❌ Sector-12, Aevum, Volhaven |
| **Volhaven** | (none) | ❌ Chongqing, Sector-12, New Tokyo, Aevum, Ishima |

**Key Insights:**
- **Sector-12 + Aevum**: ✅ Can be joined together (NOT enemies!)
- **Chongqing, New Tokyo, Ishima, Volhaven**: ❌ Conflict with Sector-12 & Aevum
- **Volhaven**: ❌ Conflicts with ALL other city factions (hardest to combine)

**Optimal City Faction Combinations:**
- 🎯 **Best for BN4**: Sector-12 + Aevum (2 factions, compatible, $55m total)
- 🎯 **Solo options**: Chongqing ($20m), New Tokyo ($20m), Ishima ($30m), or Volhaven ($50m)
- ⚠️ **Cannot combine**: Any faction besides Sector-12 + Aevum pair

**Hacking Factions** (can join ALL - no conflicts):
- ✅ CyberSec, NiteSec, The Black Hand, BitRunners
- ✅ Tian Di Hui, Netburners

**Company Factions** (⭐ CRITICAL FOR BN4 - can join multiple):
The script now automatically works for company factions! These provide:
- ✅ **Faster reputation gain** through company work
- ✅ **Hacking augmentations** (crucial for BN4's money/exp nerfs)
- ✅ **Multiple income streams** (salary + company rep)
- ✅ **Path to $100b requirement** (company work helps reach Daedalus threshold)

**Mega-Corporations** (best hacking augs, 200k rep requirement):
- MegaCorp (Sector-12), ECorp (Aevum), Four Sigma (Sector-12)
- NWO (Volhaven), Blade Industries (Sector-12)
- OmniTek Incorporated (Volhaven), KuaiGong International (Chongqing)

**Tech Companies** (excellent hacking augs):
- Fulcrum Secret Technologies (Aevum, 250k rep)
- Clarke Incorporated (Aevum), Bachman & Associates (Aevum)

💡 **How it works**: Script automatically applies for software jobs at these companies, 
works to build 200-250k company reputation, then receives faction invitation.

**End-Game Factions** (can join ALL):
- ✅ Illuminati, Daedalus, The Covenant
- 🎯 **Daedalus** is the target for BitNode 4 completion (requires 30+ augs)

**Backdoor Support**:
The script automatically installs backdoors on these servers when you have the required hacking level:
- **CSEC** (CyberSec) - requires hacking 51
- **avmnite-02h** (NiteSec) - requires hacking 202
- **I.I.I.I** (The Black Hand) - requires hacking 340
- **run4theh111z** (BitRunners) - requires hacking 505

**Usage**:
```bash
run auto-factions.js                          # Default settings (includes auto-travel & auto-backdoor)
run auto-factions.js --target-rep 500000      # Higher rep target
run auto-factions.js --no-prioritize-daedalus # Equal faction priority
tail auto-factions.js                         # Monitor progress
```

### `auto-augs.js` - Augmentation Purchasing
**Purpose**: Automates augmentation purchasing to reach 30+ count

**Features**:
- Tracks all available augmentations across factions
- Prioritizes cheapest augmentations for fast count increase
- Smart NeuroFlux purchasing (repeatable augmentation)
- Auto-installs when target count reached

**Usage**:
```bash
run auto-augs.js                       # Default (30 augs, no auto-install)
run auto-augs.js --auto-install        # Auto-install when ready
run auto-augs.js --target-count 35     # Higher target
run auto-augs.js --reserve-money 5e9   # Reserve more money
tail auto-augs.js                      # Monitor purchases
```

**Pro Tip**: NeuroFlux Governor can be purchased repeatedly! Use it to quickly reach 30 augmentations.

### `auto-crime.js` - Crime Automation
**Purpose**: Generate early money and combat stats through crime

**Features**:
- Auto-selects best crime based on success rate
- Tracks money earned and efficiency
- Switches to better crimes as stats improve
- Useful when hacking income is too low

**Usage**:
```bash
run auto-crime.js                        # Auto-select best crime
run auto-crime.js --target-crime Mug     # Focus on specific crime
run auto-crime.js --min-success-rate 0.9 # Higher success threshold
tail auto-crime.js                       # Monitor earnings
```

**Crime Progression**:
1. Early: Shoplift, Mug (easy, low money)
2. Mid: Homicide (good money/time ratio)
3. Late: Heist (high money, needs stats)

## Strategy Guide

### Phase 1: Early Game (0-30 minutes)
**Goal**: Generate initial money and start automation

**Bootstrap Phase (if starting fresh)**:
1. `run start.js` - Trains stats, gets initial money
2. Casino gambling - Accumulates $1-10m (5-15 minutes)
3. Upgrade home RAM to 256GB+ via City menu (costs $24m)
4. Kill bootstrap scripts

**Automation Phase**:
1. Start all automation scripts via `bn4.js`
2. `auto-crime.js` generates early money (mug → homicide)
3. `botnet.js` hacks weak servers as hacking level increases
4. `contracts.js` solves coding contracts for bonus money

**Expected**: $1-10m, Hacking level 50-100

### Phase 2: Faction Joining (30-90 minutes)
**Goal**: Join as many factions as possible (including company factions)

1. `auto-factions.js` **automatically travels, backdoors, and joins** factions:
   - **Auto-applies for company jobs** (MegaCorp, ECorp, Four Sigma, etc.)
   - **Works for company reputation** (200-250k rep per company)
   - **Receives company faction invites** automatically
   - Auto-travels to New Tokyo ($20m) - *get Neuroreceptor Management aug!*
   - Auto-travels to Ishima ($30m), Aevum ($40m), Volhaven ($50m)
   - Auto-backdoors CSEC (CyberSec) at hack 51+
   - Auto-backdoors avmnite-02h (NiteSec) at hack 202+
   - Auto-backdoors I.I.I.I (The Black Hand) at hack 340+
   - Auto-backdoors run4theh111z (BitRunners) at hack 505+
2. Work for factions to gain reputation
3. Get invitations from city factions (Tian Di Hui, Netburners, etc.)

**Expected**: 8-15 factions joined (including 2-4 company factions), $10b capital, Hacking ~100-300

### Phase 3: Reputation Grinding (2-6 hours)
**Goal**: Earn 250k reputation with multiple factions to unlock augmentations

**⚠️ This is the MAJOR bottleneck** - Reputation grinding takes time:
- Hacking/company work gives ~20-50 rep per cycle (10 seconds)
- Need 250k rep per faction = ~5,000-12,500 cycles
- **Single faction to 250k**: 14-35 hours of non-stop work
- **With high stats/multipliers**: 2-4 hours per faction
- **Company work is faster**: Better rep gain + salary income!

**Strategy**:
1. `auto-factions.js` focuses on ONE faction until target rep reached
2. **Prioritizes company factions** (faster rep, better augmentations)
3. Automatically switches to next faction when target reached
4. Works for 10-15 factions to get diverse augmentation access
5. Company factions provide hacking augmentations crucial for BN4

**Expected**: 10-15 factions at 250k+ rep (including 3-5 company factions), can afford 30+ augmentations

### Phase 4: Augmentation Purchasing (10-30 minutes)
**Goal**: Purchase 30+ augmentations to qualify for Daedalus

1. `auto-augs.js` tracks affordable augmentations across all factions
2. Buys cheapest augmentations first (faster count increase)
3. Uses NeuroFlux Governor to fill gaps (repeatable, scales in cost)
4. Aims for exactly 30+ augmentations

**Expected**: 30+ augmentations purchased, ready to install

### Phase 5: First Augmentation Install & Post-Reset (auto-restart)
**Goal**: Install augmentations, restart with upgraded stats

1. `auto-augs.js` automatically installs when 30+ augs purchased
2. Game performs soft reset (installs augmentations)
3. `bn4.js` automatically restarts after reset
4. Now have upgraded stats for Daedalus push

**Expected**: Fresh start with boosted stats, 30 augmentations installed

### Phase 6: Daedalus Requirements (2-4 hours)
**Goal**: Meet Daedalus requirements and join

**Requirements**:
- 30+ augmentations ✓ (already have from Phase 5)
- 2500 hacking level (need to grind from ~200)
- **$100 BILLION** total earned (not current money - cumulative!)

**Major Grinds**:
- **Hacking to 2500**: With augmented stats, 1-2 hours of study/hacking
- **$100b total earned**: With 20% money multiplier, need to earn a LOT
  - Botnet at peak: $50-200m/hour
  - Need: 500-2000 hours of botnet income normally
  - **In reality**: 3-6 hours with augmented stats and optimization

**Expected**: Daedalus invitation received, can join

### Phase 7: The Red Pill Grind (2-4 hours)  
**Goal**: Get 2.5 MILLION reputation with Daedalus for The Red Pill

**⚠️ This is the SECOND MAJOR bottleneck**:
- Red Pill requires 2,500,000 reputation
- Even with augmented stats: ~100-200 rep per cycle
- Need: 12,500-25,000 cycles of Daedalus work
- **Time**: 35-70 hours normally, 2-4 hours with good multipliers

**Strategy**:
1. Focus 100% on Daedalus faction work
2. Use hacking work (best rep gain)
3. Let it run - this WILL take hours

**Expected**: 2.5m Daedalus rep, can purchase The Red Pill

### Phase 8: Final Push & Completion (30-60 minutes)
**Goal**: Purchase The Red Pill, install, and destroy w0r1d_d43m0n

1. Purchase The Red Pill augmentation (2.5m Daedalus rep required)
2. Install The Red Pill (causes another soft reset)
3. After reset, hack level for w0r1d_d43m0n should be achievable
4. Root w0r1d_d43m0n server
5. `bn4.js` automatically destroys w0r1d_d43m0n (if --auto-destroy enabled)

**Expected**: BN4 completed, SF4 unlocked!

## Realistic Timeline Summary

| Phase | Time | Description |
|-------|------|-------------|
| Bootstrap | 15-30 min | Casino to $10b, buy programs |
| Faction Joining | 30-90 min | Travel, backdoor, join 8-12 factions |
| **Rep Grinding** | **2-6 hours** | **MAJOR GRIND** - 250k rep × 8-12 factions |
| Aug Purchase | 10-30 min | Buy 30+ augmentations |
| First Install | Auto-restart | Install augs, restart with upgraded stats |
| Daedalus Requirements | 2-4 hours | Grind to hack 2500 + $100b total earned |
| **Red Pill Rep** | **2-4 hours** | **MAJOR GRIND** - 2.5m Daedalus rep |
| Final Push | 30-60 min | Install Red Pill, hack w0r1d_d43m0n |
| **TOTAL** | **8-16 hours** | **Realistic full completion time** |

**💡 Pro Tip**: This is designed as an **overnight run**. Start it before bed, let it grind while you sleep!

## Optimization Tips

### Maximize Income
1. **Prioritize hacking** - Despite nerfs, still best income source
2. **Solve contracts** - Each contract gives bonus money
3. **Crime early game** - When hacking < 100, crime can be more profitable
4. **Avoid company work** - 10x penalty makes it worthless in BN4

### Speed Up Augmentations
1. **Buy cheapest first** - Faster to reach 30 count
2. **Abuse NeuroFlux** - Can purchase infinite times
3. **Don't wait for "good" augmentations** - Count matters for Daedalus
4. **Join many factions** - More augmentation options

### Efficient Faction Work
1. **Focus on Daedalus** - Once joined, priority #1 for Red Pill
2. **Spread work around** - Get basic rep from multiple factions first
3. **Backdoor servers** - Required for hacking faction invitations
4. **Use appropriate work type** - Hacking for tech factions, field for combat

## Monitoring Progress

### Key Commands
```bash
tail bn4.js            # Overall progress
tail auto-factions.js  # Faction work status
tail auto-augs.js      # Augmentation purchases
tail auto-crime.js     # Crime earnings
tail botnet.js         # Hacking operations
```

### Progress Checkpoints
- ✓ 10+ factions joined
- ✓ $1b+ total money
- ✓ 30+ augmentations owned
- ✓ Daedalus invitation received
- ✓ The Red Pill purchased
- ✓ All augmentations installed
- ✓ w0r1d_d43m0n accessible
- ✓ Required hack level reached

## Troubleshooting

### "Not enough money for augmentations"
- Let botnet.js run longer to accumulate money
- Lower `--reserve-money` in auto-augs.js
- Run contracts.js for bonus income

### "Can't join Daedalus"
- Need 30+ augmentations (purchased OR installed)
- Need 2500+ hacking level
- Need $100b+ in lifetime earnings
- Check progress with `tail bn4.js`

### "Faction invitations not appearing"
- Backdoor required servers (CSEC, avmnite-02h, etc.)
- Visit different cities (Aevum, Chongqing, Sector-12)
- Increase hacking level and money

### "Scripts won't start"
- Check available RAM with `free`
- Kill unnecessary scripts with `kill <script>`
- Upgrade home server RAM if needed

### "w0r1d_d43m0n not accessible"
- Must install The Red Pill augmentation first
- Augmentation install resets everything
- Server appears in The Cave after Red Pill installed

## Advanced Configuration

### Custom Script Arguments

#### bn4.js
```bash
--auto-destroy        # Auto-complete BN (default: true)
--debug               # Verbose logging
```

#### auto-factions.js
```bash
--target-rep 500000           # Higher reputation target
--no-prioritize-daedalus      # Don't focus on Daedalus
--no-work-continuously        # Run once and exit
```

#### auto-augs.js
```bash
--target-count 35             # More augmentations
--auto-install                # Auto-install when ready
--reserve-money 5000000000    # Keep 5b in reserve
--no-prioritize-neuroflux     # Don't spam NeuroFlux
```

#### auto-crime.js
```bash
--target-crime "Homicide"     # Focus on specific crime
--min-success-rate 0.9        # Higher success requirement
--no-prioritize-money         # Prioritize stats over money
```

## Next BitNode Recommendation

After completing BN4, recommended progression:

1. **BitNode 5** (Artificial Intelligence) - Unlock intelligence stat and Formulas.exe
2. **BitNode 1.2** (Easy) - Get +24% to all multipliers
3. **BitNode 2** (Gangs) - Unlock gang mechanics for passive income

BN4 completion gives you SF4 which makes all future BitNodes significantly easier with singularity function access!

## Additional Resources

- **Official Bitburner Documentation**: https://github.com/bitburner-official/bitburner-src
- **Faction Requirements**: Check in-game Factions page
- **Augmentation Database**: Check in-game Augmentations page
- **Server Map**: Use `scan-analyze 3` in terminal

## Support

Having issues? Check:
1. All scripts are in `/src` directory
2. TypeScript compiled to JavaScript (watch process running)
3. Sufficient RAM available (`free` command)
4. SF4 unlocked (required for singularity functions)

Good luck completing BitNode 4! 🎉
