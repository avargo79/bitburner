# BitNode 4 - Complete Startup Guide

## 🎯 Overview

This guide walks you through the **complete startup process** for BitNode 4, from fresh reset to full automation running.

## ⚡ TL;DR - Quick Start

```bash
# If starting fresh (< $50m, < 256GB RAM)
run start.js          # Bootstrap → Casino → Upgrade RAM → Kill & restart

# If already have resources ($50m+, 256GB+ RAM)
run bn4.js            # Full automation
```

## 📋 Prerequisites Check

Before starting BN4 automation, verify you have:

| Requirement | Minimum | Recommended | Check Command |
|-------------|---------|-------------|---------------|
| **Money** | $50m | $100m+ | Check terminal |
| **Home RAM** | 256GB | 512GB+ | `free` |
| **Hacking Level** | 10 | 50+ | Check Stats |
| **SF4 Access** | Level 0 (in BN4) | Level 3 | Check Source Files |

### Why These Requirements?

- **$50m**: Needed to purchase 256GB RAM ($24m) plus initial augmentations and operations
- **256GB RAM**: Required to run all automation scripts simultaneously (171.1GB total needed!)
- **Hacking 10**: Minimum level to access basic servers for money generation
- **SF4**: In BN4, you have temporary access (no previous SF4 needed)

### **⚠️ CRITICAL: Actual RAM Requirements**

The automation scripts require **171.1GB total RAM**:

- `bn4.js`: 59.7GB
- `auto-augs.js`: 28.2GB
- `auto-factions.js`: 26.1GB
- `auto-crime.js`: 17.1GB
- `botnet.js`: 11.0GB
- `contracts.js`: 29.0GB
- **TOTAL**: **171.1GB**

This means you need **at least 256GB RAM** (leaves 85GB headroom), preferably **512GB** for comfortable operation.

## 🚀 Bootstrap Sequence (Fresh Start)

If you just entered BN4 or reset, follow this sequence:

### Step 1: Run Bootstrap Script

```bash
run start.js
```

**What it does**:
1. **Train combat stats** (str 50, def 20, dex 20, agi 20)
2. **Train hacking** (to level 10)
3. **Mug for initial money** (until $200k)
4. **Travel to Aevum** (where the casino is)
5. **Auto-launch casino bot** (gambles until $10b)
6. **Auto-purchase TOR router** ($200k)
7. **Auto-purchase all darkweb programs** (port openers, utilities)

**Time estimate**: 5-15 minutes to reach $10b and get kicked out

### Programs Purchased Automatically

After getting kicked out of the casino at $10b, the bot automatically purchases:

**Port Openers** (required for hacking):
- BruteSSH.exe ($500k) - Opens SSH ports
- FTPCrack.exe ($1.5m) - Opens FTP ports
- relaySMTP.exe ($5m) - Opens SMTP ports
- HTTPWorm.exe ($30m) - Opens HTTP ports
- SQLInject.exe ($250m) - Opens SQL ports

**Utilities** (helpful for automation):
- DeepscanV1.exe ($500k) - Enhanced network scanning
- DeepscanV2.exe ($25m) - Advanced network scanning
- ServerProfiler.exe ($500k) - Detailed server information
- AutoLink.exe ($1m) - Automatic server navigation
- Formulas.exe ($5b) - In-game formula calculations

**Total cost**: ~$5.3 billion (leaves ~$4.7b for augmentations)

### Step 2: Monitor Casino Progress

```bash
tail casino-bot.js
```

**Watch for**:
- Coin balance increasing
- Win rate stabilizing around 50%
- "Kicked out" message when reaching $10b

**Pro tip**: The casino bot uses optimal blackjack strategy and saves after wins, reloads after losses. Once kicked out, it automatically purchases TOR and all programs!

### Step 3: Upgrade Home RAM

While casino is running, upgrade your home computer:

1. Press **ESC** or click **City** in menu
2. Navigate to **Alpha Enterprises**
3. Click **Upgrade Home RAM**
4. Buy upgrades until you have **at least 256GB**
   - 256GB = ~$24m
   - 512GB = ~$96m (recommended)
   - 1024GB = ~$384m (ideal for full automation)

**Cost Guide**:
| RAM | Total Cost | Recommended For |
|-----|-----------|-----------------|
| 256GB | ~$24m | Minimum viable (171.1GB needed) |
| 512GB | ~$96m | Comfortable automation (340GB headroom) |
| 1024GB | ~$384m | Full automation with generous room |

### Step 4: Verify Prerequisites

Before continuing, check you have:

```bash
# Check RAM
free
# Should show 256GB+ available

# Check money (in terminal header)
# Should have $50m+

# Check stats
stats
# Hacking should be 10+
```

### Step 5: Stop Bootstrap & Start Automation

```bash
# Kill bootstrap scripts
kill start.js
kill casino-bot.js

# Start full automation
run bn4.js
```

**You should see**:
```
=== BitNode 4: The Singularity Speed Run ===

Strategy Overview:
─────────────────────────────────────────────
Phase 1: Early Money (Hack weak servers)
Phase 2: Join Factions (Use Singularity APIs)
Phase 3: Farm Reputation & Buy Augmentations
Phase 4: Get 30+ Augs → Join Daedalus
Phase 5: Buy The Red Pill → Destroy w0r1d_d43m0n

>>> Phase 1: Setting up automation...
✓ Started botnet.js - Automated hacking for income
✓ Started contracts.js - Solve coding contracts
✓ Started auto-factions.js - Automated faction work
✓ Started auto-augs.js - Automated augmentation purchasing
✓ Started auto-crime.js - Early money generation
```

### Step 6: Monitor Progress

```bash
# Main orchestrator
tail bn4.js

# Individual components
tail auto-factions.js    # Faction work
tail auto-augs.js        # Augmentation purchases
tail auto-crime.js       # Crime income
tail botnet.js           # Hacking operations
```

## 🔄 Already Have Resources?

If you've already bootstrapped (have $50m+, 256GB+ RAM, hack 10+):

```bash
# Just run the main script
run bn4.js

# It will check prerequisites and start if you're ready
```

## ⚙️ Detailed Bootstrap Script Behavior

### `start.ts` State Machine

```
START
  ↓
[Strength < 50?] → Train Strength at Powerhouse Gym
  ↓
[Defense < 20?] → Train Defense at Powerhouse Gym
  ↓
[Dexterity < 20?] → Train Dexterity at Powerhouse Gym
  ↓
[Agility < 20?] → Train Agility at Powerhouse Gym
  ↓
[Hacking < 10?] → Study at Rothman University
  ↓
[Money < $200k?] → Commit "Mug" crime
  ↓
[In Sector-12?] → Travel to Aevum
  ↓
[Money >= $100k?] → Launch casino-bot.js
```

### Why These Stats?

- **Strength 50**: Unlocks better crime options and faction work
- **Defense/Dex/Agi 20**: Minimum viable combat stats for field work
- **Hacking 10**: Can access basic servers for hacking income
- **$200k**: Enough to travel and start casino
- **Casino → $10b**: Provides massive early-game capital boost

## 🎰 Casino Bot Details

The casino bot (`casino-bot.js`) uses optimal blackjack strategy:

- **Strategy**: Basic strategy card + card counting
- **Bet sizing**: Progressive based on count
- **Risk management**: Stops at target or bust
- **Expected time**: 5-15 minutes to $10b
- **Win rate**: ~50% (house edge ~0.5%)

**Tips**:
- Don't interrupt it - let it run to completion
- It will eventually win through variance
- The more you let it run, the more money you'll have
- Default target is $10b (configurable)

## 🛠️ Troubleshooting Bootstrap

### "Can't afford gym/university"
- Mug until you have $50k
- Gym costs ~$120/tick
- University costs ~$320/tick

### "Casino isn't winning"
- Variance is normal - keep it running
- Casino has ~49.5% win rate (nearly even)
- Should see net positive after 100+ hands
- Check with `tail casino-bot.js`

### "Not enough RAM for scripts"
- Kill unnecessary scripts with `ps` then `kill <pid>`
- Upgrade home RAM more (priority #1)
- Start with just botnet.js if needed

### "Scripts won't start"
- Check prerequisites with `free` (RAM)
- Check money in terminal header
- Verify scripts compiled: `ls *.js` should show .js versions
- If missing, run `npm run watch` in external terminal

### "Start.js is stuck training"
- Normal - training takes time
- Each stat level takes ~20-30 seconds
- Total training phase: 5-10 minutes
- Monitor with `stats` command

## 📊 Resource Requirements by Phase

### Bootstrap Phase
```
RAM:   8GB  (start.js + casino-bot.js)
Money: $0   (generated by script)
Time:  5-15 minutes
```

### Early Automation Phase
```
RAM:   20GB  (all automation scripts)
Money: $1m   (from bootstrap)
Time:  0-60 minutes
```

### Mid Automation Phase
```
RAM:   20GB  (same scripts running)
Money: $100m+ (accumulated)
Time:  60-120 minutes
```

### Late Automation Phase
```
RAM:   20GB  (same scripts running)
Money: $1b+ (accumulated)
Time:  120-240 minutes
```

## 🎯 Optimal Bootstrap Strategy

For **absolute fastest** BN4 completion:

1. **Run start.js immediately** when BN starts
2. **Let casino run to $100m+** (be patient!)
3. **Buy 256GB+ home RAM** while casino runs ($24m for 256GB)
4. **Kill bootstrap, start bn4.js** as soon as prerequisites met
5. **Let automation run unattended** for 2-4 hours

**Why $100m from casino?**
- Covers 256-512GB RAM upgrade costs ($24-96m)
- Can buy augmentations immediately when rep is ready
- Can upgrade RAM without worrying about cost
- Faster overall completion time

**Why 256GB+ RAM?**
- All scripts require 171.1GB total
- 256GB gives 85GB headroom (tight but workable)
- 512GB gives 340GB headroom (comfortable)
- No RAM management required

## ⏱️ Complete Timeline

```
00:00 - Enter BN4, run start.js
00:05 - Stats trained, mugging started
00:10 - Traveled to casino, gambling started
00:20 - Have $10-20m, continue casino gambling
00:30 - Have $50-100m, upgrade RAM to 256GB+ ($24m)
00:35 - Kill bootstrap, run bn4.js
00:40 - All automation running, factions joining
01:00 - 5-10 factions joined, first augs purchased
02:00 - 15-25 augmentations owned
03:00 - Daedalus requirements met, joined
04:00 - Red Pill purchased, BN4 completed!
```

**Total time**: 2-4 hours from BN4 entry to completion

## 🚦 Go / No-Go Checklist

Before starting `bn4.js`, verify:

- ✅ **Money**: $50m+ available (check terminal) - needed for RAM upgrades
- ✅ **RAM**: 256GB+ available (`free` command) - scripts need 171.1GB total
- ✅ **Hacking**: Level 10+ (`stats` command)
- ✅ **Scripts**: .js files exist (`ls *.js`)
- ✅ **Bootstrap**: start.js and casino-bot.js killed
- ✅ **SF4**: In BN4 or have SF4 unlocked

If all checked, proceed with:
```bash
run bn4.js
```

## 📞 Next Steps

After `bn4.js` is running:

1. **Monitor progress**: `tail bn4.js`
2. **Check components**: `tail auto-factions.js`, `tail auto-augs.js`
3. **Let it run**: Automation works best unattended
4. **Check back in 2-4 hours**: Should be near completion
5. **Complete BN4**: Auto-destroys when ready (or manual if --no-auto-destroy)

---

**Ready to start?** Run `run start.js` and begin your BN4 speed run! 🚀
