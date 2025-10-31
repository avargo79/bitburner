# BitNode 4 Speed Run - Quick Reference

## 🚀 Bootstrap Sequence (First Time)

```bash
# Step 1: Bootstrap initial resources
run start.js

# Wait for casino to reach $10b (~5-15 minutes until kicked out)
# Casino will auto-run until you're kicked out at $10 billion
# Then automatically purchases TOR router and all darkweb programs

# Step 2: Upgrade home RAM
# Use in-game menu: City > Alpha Enterprises > Upgrade Home RAM
# Buy at least 256GB ($24m) or 512GB recommended ($96m)

# Step 3: Stop bootstrap and start automation
kill start.js
kill casino-bot.js
run bn4.js
```

## 💨 Quick Start (If Already Bootstrapped)

```bash
# If you have $50m+, 256GB+ RAM, and hacking level 10+
run bn4.js
```

## Monitor Progress
```bash
tail bn4.js            # Overall progress
tail auto-factions.js  # Faction reputation
tail auto-augs.js      # Augmentation purchases
tail auto-crime.js     # Crime income
tail botnet.js         # Hacking income
```

## Completion Checklist
- [ ] **10+ factions joined** (auto-factions.js handles this, including 3-5 company factions)
- [ ] **$1b+ accumulated** (botnet.js + auto-crime.js + company salaries)
- [ ] **30+ augmentations owned** (auto-augs.js tracks this)
- [ ] **2500+ hacking level** (natural progression)
- [ ] **Daedalus joined** (automatic after 30 augs + stats)
- [ ] **The Red Pill purchased** (auto-augs.js handles this)
- [ ] **Augmentations installed** (triggers soft reset)
- [ ] **w0r1d_d43m0n destroyed** (bn4.js auto-completes)

## Key Scripts

| Script | Purpose | RAM | Auto-Started |
|--------|---------|-----|--------------|
| `bn4.js` | Main orchestrator & progress tracker | 5GB | Manual |
| `auto-factions.js` | Automated faction work | 3GB | ✓ |
| `auto-augs.js` | Automated aug purchasing | 3.5GB | ✓ |
| `auto-crime.js` | Early money generation | 2.5GB | ✓ |
| `botnet.js` | Main hacking income | 4GB | ✓ |
| `contracts.js` | Bonus contract income | 2.5GB | ✓ |

## Timeline (Full Automation)

**Realistic Total Time: 8-16 hours (overnight run recommended)**

| Time | Phase | Goal | Expected Progress |
|------|-------|------|-------------------|
| 0-15 min | Bootstrap | Casino gambling to $10b | $10b, 256GB+ RAM, All programs |
| 15-90 min | Faction Joining | Join 10-15 factions (including companies) | Multiple factions + company jobs |
| **2-6 hours** | **Rep Grinding** | **250k rep per faction** | **MAJOR BOTTLENECK** (company work is faster!) |
| +15 min | Aug Purchase | Buy 30+ augmentations | 30+ augs ready to install |
| Auto | First Aug Install | Install & restart | Stats upgraded, BN4 continues |
| 2-4 hours | Daedalus Requirements | Hack 2500 + $100b earned | Daedalus joined (company salaries help!) |
| **2-4 hours** | **Red Pill Rep** | **2.5m Daedalus rep** | **MAJOR BOTTLENECK** |
| +30 min | Final Push | Install Red Pill, hack w0r1d_d43m0n | **BN4 COMPLETE!** |

**⚠️ Reality Check**: BitNode 4 has severe money/exp nerfs (20%/40%). Reputation grinding is SLOW. The automation handles it, but expect a long run!

## Pro Tips

### Fastest Money
1. Run botnet.js (nerfed but still best)
2. Solve contracts (contracts.js)
3. Crime when hacking < 100 (auto-crime.js)

### Fastest 30 Augmentations
1. Buy cheapest augmentations first
2. Use NeuroFlux Governor (repeatable!)
3. Don't wait for "good" augs - count matters
4. Join many factions for more options

### Faction Invitations
- **CyberSec**: Backdoor CSEC server
- **NiteSec**: Backdoor avmnite-02h server
- **The Black Hand**: Backdoor I.I.I.I server
- **BitRunners**: Backdoor run4theh111z server
- **Daedalus**: 30+ augs, 2500 hack, $100b

## Common Issues

**"Not enough RAM"**
- Upgrade home server
- Kill unnecessary scripts
- Scripts need ~20GB total

**"No faction invitations"**
- Backdoor faction servers
- Visit different cities
- Increase hacking level

**"Can't afford augmentations"**
- Let scripts run longer
- Lower `--reserve-money` setting
- Focus on cheapest augs first

**"Daedalus won't invite"**
- Need 30+ augs (purchased OR installed)
- Need 2500+ hacking level
- Need $100b lifetime earnings

## Manual Control (Advanced)

If you want more control, run scripts individually:

```bash
# Start income generation
run botnet.js
run contracts.js
run auto-crime.js --target-crime Homicide

# Start faction work
run auto-factions.js --target-rep 500000

# Start aug purchasing (with custom settings)
run auto-augs.js --target-count 35 --reserve-money 2e9

# Monitor everything
tail bn4.js
```

## After Completion

**You've unlocked SF4!** This gives you:
- Access to Singularity functions in other BitNodes
- Level 1: 16x RAM cost
- Level 2: 4x RAM cost (recommended)
- Level 3: 1x RAM cost (optimal)

**Next recommended BitNode**: BN5 (Intelligence) or BN1.2 (Easy multipliers)

---

**Total Time with Full Automation: 2-4 hours**

Run `run bn4.js` to start! 🚀
