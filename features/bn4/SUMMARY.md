# BitNode 4 Speed Completion Suite - Summary

## 🎯 What You Got

A complete automation suite for **BitNode 4 completion** (8-16 hours realistic, overnight run recommended).

**Note**: BN4 has severe nerfs (20% hacking money, 40% exp). The major bottlenecks are reputation grinding (2-6 hours) and Daedalus Red Pill reputation (2-4 hours). The automation handles everything - just let it run!

## 📦 Created Files

### Core Scripts (in `/src`)
1. **`bn4.ts`** - Main orchestrator and progress monitor
2. **`auto-factions.ts`** - Automated faction work and reputation grinding
3. **`auto-augs.ts`** - Automated augmentation purchasing and tracking
4. **`auto-crime.ts`** - Early money generation through crime automation

### Documentation (in `/features/bn4`)
1. **`README.md`** - Comprehensive guide with strategy, tips, and troubleshooting
2. **`QUICKSTART.md`** - Quick reference and cheat sheet

## 🚀 Quick Start

### First Time Setup (Bootstrap Required)

```bash
# Step 1: Bootstrap initial resources
run start.js

# This will:
# - Train basic stats (str, def, dex, agi, hack)
# - Get initial money via crime
# - Auto-travel to casino and gamble until $10b
# 
# While waiting (~15-20 minutes):
# - Go to City > Alpha Enterprises
# - Upgrade Home RAM to at least 256GB ($24m) or 512GB recommended ($96m)

# Step 2: Once you have $50m+ and 256GB+ RAM
kill start.js
kill casino-bot.js

# Step 3: Start the full automation suite
run bn4.js

# Monitor progress
tail bn4.js
```

### Already Have Resources?

```bash
# If you have $50m+, 256GB+ RAM, and hacking 10+
run bn4.js
```

That's it! The scripts will:
- ✅ Generate money (hacking + crime + contracts)
- ✅ Join all available factions
- ✅ Work for factions to gain reputation
- ✅ Purchase 30+ augmentations automatically
- ✅ Join Daedalus faction
- ✅ Purchase The Red Pill
- ✅ Complete the BitNode automatically

## 📊 What Each Script Does

### `bn4.js` - The Controller
- Starts all automation scripts
- Monitors progress towards 30 augmentations
- Tracks Daedalus requirements
- Auto-destroys w0r1d_d43m0n when ready

### `auto-factions.js` - Reputation Engine
- Auto-accepts all faction invitations
- **Prioritizes company factions for faster rep and better augmentations**
- Automatically applies for Software jobs at major companies
- Works for 200-250k company reputation to unlock faction invites
- Intelligently selects best faction to work for (one at a time)
- Prioritizes Daedalus once joined (for The Red Pill)
- Switches work types based on stats (hacking/field/security)
- Supports 10+ regular factions + 10 company factions

### `auto-augs.js` - Augmentation Manager
- Tracks all purchasable augmentations across all factions
- Buys cheapest augmentations first (fastest path to 30 count)
- Smart NeuroFlux Governor purchasing (repeatable aug)
- Can auto-install when target count reached

### `auto-crime.js` - Early Income
- Auto-selects best crime based on success rate
- Generates money when hacking is too low
- Tracks efficiency and switches to better crimes
- Builds combat stats for faction work

## 🎮 BitNode 4 Strategy

**The Challenge**: Money and hacking are heavily nerfed (20% and 40% respectively)

**The Solution**: 
1. Use automation to maximize efficiency
2. Buy cheapest augmentations (not "best" ones) to reach 30 count
3. Spam NeuroFlux Governor to fill gaps
4. Join Daedalus → Get The Red Pill → Destroy w0r1d_d43m0n

**Timeline**:
- 0-30 min: Early money generation
- 30-60 min: Join factions
- 60-120 min: Farm 30+ augmentations
- 120-180 min: Join Daedalus
- 180-240 min: Get Red Pill & complete

## 💡 Pro Tips

1. **NeuroFlux Governor is your friend** - It's repeatable, use it to hit 30 augs fast
2. **Cheapest first** - Don't wait for "good" augmentations, count matters
3. **Backdoor servers** - Required for hacking faction invitations
4. **Let it run** - Scripts work best when you let them accumulate money
5. **Monitor with tail** - Use `tail <script>` to watch progress in real-time

## 🔧 Customization

All scripts accept command-line arguments for customization:

```bash
# Custom faction reputation target
run auto-factions.js --target-rep 500000

# Custom aug count and auto-install
run auto-augs.js --target-count 35 --auto-install

# Focus on specific crime
run auto-crime.js --target-crime Homicide

# Disable auto-destroy for manual completion
run bn4.js --no-auto-destroy
```

## 📈 Expected Results

**With full automation running**:
- **8-16 hours** to complete BitNode 4 (realistic timeline)
  - 2-6 hours: Reputation grinding (250k rep × 10-15 factions including companies)
  - 2-4 hours: Daedalus requirements (hack 2500 + $100b earned)
  - 2-4 hours: Red Pill reputation (2.5m rep with Daedalus)
  - Remaining time: Misc grinding and augmentation cycles
- **10-15 factions joined** (including 3-5 company factions for faster progression)
- **30+ augmentations** purchased efficiently (including critical hacking augs from companies)
- **SF4 unlocked** for use in other BitNodes
- **Fully automated** - Start it and walk away (overnight run recommended)

**Company faction benefits**:
- **Faster reputation gain** - Company work typically gives better rep than hacking work
- **Salary income** - Helps reach the $100b total earned requirement for Daedalus
- **Critical augmentations** - Companies provide essential hacking multiplier augmentations
- **Smoother progression** - Reduces reliance on pure hacking/crime for income

**What you get from SF4**:
- Level 1: Singularity functions with 16x RAM cost
- Level 2: Singularity functions with 4x RAM cost (recommended to grind)
- Level 3: Singularity functions with 1x RAM cost (full efficiency)

## 🆘 Troubleshooting

**Scripts won't start?**
- Check RAM with `free` command
- Need ~20GB total for all scripts
- Kill unnecessary scripts or upgrade home

**No money?**
- Wait for botnet.js to accumulate money
- Auto-crime.js helps in early game
- Contracts.js gives bonus income

**Can't join Daedalus?**
- Need 30+ augmentations (purchased OR installed)
- Need 2500+ hacking level
- Need $100b in lifetime earnings
- Check progress with `tail bn4.js`

## 📚 Full Documentation

- **`/features/bn4/README.md`** - Complete strategy guide with detailed explanations
- **`/features/bn4/QUICKSTART.md`** - Quick reference cheat sheet

## 🎉 Next Steps

1. **Compile the scripts**: `npm run watch` (if not already running)
2. **Start bootstrap**: `run start.js` (casino to $10b, buy programs)
3. **Upgrade RAM**: Buy 256GB+ home RAM ($24m)
4. **Start automation**: `run bn4.js`
5. **Monitor progress**: `tail bn4.js`
6. **Let it run overnight**: 8-16 hours for full completion
7. **Enjoy SF4** in your next BitNode!

---

**Remember**: The goal is speed, not perfection. Buy cheap augmentations, hit 30 count, get The Red Pill, complete BN4. You can always come back for better augmentations later!

Good luck with your speed run! 🚀
