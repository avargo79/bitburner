# BitNode 4 Speed Completion Suite - Architecture

## 📁 File Structure

```
bitburner/
├── src/
│   ├── bn4.ts                  ⭐ Main orchestrator
│   ├── auto-factions.ts        🎯 Faction automation
│   ├── auto-augs.ts            💊 Augmentation purchasing
│   ├── auto-crime.ts           💰 Crime income generation
│   ├── botnet.ts              🔨 Hacking operations (existing)
│   └── contracts.ts           📝 Contract solving (existing)
│
└── features/bn4/
    ├── README.md              📚 Full guide
    ├── QUICKSTART.md          ⚡ Quick reference
    └── SUMMARY.md             📊 This overview

```

## 🔄 Script Flow Diagram

```
                    ┌─────────────────────┐
                    │    start.ts         │
                    │   (Bootstrap)       │
                    │ • Train stats       │
                    │ • Get initial $     │
                    │ • Casino gambling   │
                    └──────────┬──────────┘
                               │
                    [Wait until $50m+ & 256GB+ RAM]
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         bn4.ts                              │
│                   (Main Orchestrator)                       │
│  • Checks prerequisites ($50m+, 256GB+ RAM, hack 10+)      │
│  • Starts all automation scripts                           │
│  • Monitors progress (30 augs, Daedalus, Red Pill)        │
│  • Auto-destroys w0r1d_d43m0n when ready                   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬───────────────┐
        ▼            ▼            ▼               ▼
┌───────────┐ ┌──────────┐ ┌──────────┐  ┌──────────────┐
│ botnet.ts │ │contracts │ │ auto-    │  │   auto-      │
│           │ │   .ts    │ │ crime.ts │  │ factions.ts  │
│ Hacking   │ │          │ │          │  │              │
│ Income    │ │ Bonus    │ │ Early    │  │ Reputation   │
│ (Main $)  │ │ Income   │ │ Money    │  │ Grinding     │
└───────────┘ └──────────┘ └──────────┘  └──────┬───────┘
                                                  │
                     ┌────────────────────────────┘
                     ▼
              ┌──────────────┐
              │  auto-       │
              │  augs.ts     │
              │              │
              │ Buys 30+     │
              │ Augmentations│
              └──────────────┘
```

## 📊 Data Flow

```
Player Actions → Scripts Monitor → Automatic Decisions
     ↓                ↓                    ↓
  Play game    Track progress      Buy/Work/Crime
     ↓                ↓                    ↓
Gain money/rep  Update displays    Progress faster
     ↓                ↓                    ↓
  Rinse and repeat until completion!
```

## 🎯 Automation Strategy

### Phase 1: Income Generation (Parallel)
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  botnet.ts  │────▶│ Hack servers │────▶│   Money     │
└─────────────┘     └──────────────┘     └─────────────┘

┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│contracts.ts │────▶│Solve contracts│────▶│Bonus money  │
└─────────────┘     └──────────────┘     └─────────────┘

┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│auto-crime.ts│────▶│Commit crimes │────▶│Early money  │
└─────────────┘     └──────────────┘     └─────────────┘
```

### Phase 2: Progression Loop
```
┌─────────────────┐
│ Join Factions   │ ◀─────┐
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ Work for Rep    │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ Buy Augments    │       │
└────────┬────────┘       │
         │                │
         ▼                │
    Repeat until          │
    30+ augs  ────────────┘
         │
         ▼
┌─────────────────┐
│ Join Daedalus   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get Red Pill    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Destroy BN4!    │
└─────────────────┘
```

## 💻 Script Responsibilities

### `bn4.ts` - The Brain 🧠
```typescript
while (true) {
  1. Check augmentation count (target: 30+)
  2. Check if Daedalus joined
  3. Check if Red Pill purchased
  4. Check if can destroy w0r1d_d43m0n
  5. Display progress
  6. Wait & repeat
}
```

### `auto-factions.ts` - The Worker 👷
```typescript
while (true) {
  1. Accept all faction invitations
  2. Find best faction to work for
  3. Select appropriate work type
  4. Start working
  5. Wait & repeat
}
```

### `auto-augs.ts` - The Buyer 💳
```typescript
while (true) {
  1. List all available augmentations
  2. Filter by reputation requirement
  3. Sort by price (cheapest first)
  4. Buy affordable augmentations
  5. Track progress to 30+
  6. Wait & repeat
}
```

### `auto-crime.ts` - The Thug 🦹
```typescript
while (true) {
  1. Evaluate all crimes
  2. Calculate expected value
  3. Select best crime
  4. Commit crime
  5. Track earnings
  6. Wait & repeat
}
```

## ⚙️ Configuration Options

### Global Settings (bn4.ts)
- `--auto-destroy`: Auto-complete BN when ready
- `--debug`: Verbose logging

### Faction Settings (auto-factions.ts)
- `--target-rep`: Reputation target per faction
- `--prioritize-daedalus`: Focus on Daedalus after joining

### Augmentation Settings (auto-augs.ts)
- `--target-count`: Number of augmentations to acquire
- `--auto-install`: Install when target reached
- `--reserve-money`: Money to keep in reserve
- `--prioritize-neuroflux`: Buy NeuroFlux repeatedly

### Crime Settings (auto-crime.ts)
- `--target-crime`: Specific crime to focus on
- `--min-success-rate`: Minimum success rate threshold
- `--prioritize-money`: Money vs stats priority

## 📈 Performance Metrics

### Expected Timeline (Full Automation)
```
0:00 ─────────────────────────────── Start
0:30 ─────────────────┐
                      ├─ Early game: $1-10m, Hack 50-100
1:00 ─────────────────┤
                      ├─ Factions: 5-10 joined, $50-100m
2:00 ─────────────────┤
                      ├─ Augmentations: 15-25 bought, $500m-1b
3:00 ─────────────────┤
                      ├─ Daedalus: Joined, working for rep
4:00 ─────────────────┤
                      └─ Completion: Red Pill → Destroy BN4!
```

### Resource Requirements
```
RAM Usage:
  bn4.ts         : ~5GB
  auto-factions  : ~3GB
  auto-augs      : ~3.5GB
  auto-crime     : ~2.5GB
  botnet         : ~4GB
  contracts      : ~2.5GB
  ──────────────────────
  TOTAL          : ~20GB (recommended minimum)
```

## 🎓 Learning Path

### For Understanding
1. Read `/features/bn4/QUICKSTART.md` first
2. Run `run bn4.js` and watch it work
3. Monitor with `tail` commands to see automation
4. Read `/features/bn4/README.md` for deep dive
5. Customize with command-line arguments

### For Customization
1. Check script source in `/src/*.ts`
2. Each script is self-contained and documented
3. Modify strategy parameters as needed
4. Test changes in-game
5. Iterate and optimize

## 🎉 Success Indicators

```
✓ All automation scripts running
✓ Money increasing steadily
✓ Factions joining automatically
✓ Reputation growing
✓ Augmentations purchasing
✓ 30+ augmentations owned
✓ Daedalus joined
✓ The Red Pill purchased
✓ BitNode 4 destroyed
✓ SF4 unlocked!
```

## 🚀 Quick Commands

```bash
# FIRST TIME: Bootstrap sequence
run start.js
# Wait for casino to get $1-10m (~5-15 minutes)
# Upgrade home RAM to 256GB+ via City menu (costs $24m for 256GB, $96m for 512GB)
kill start.js && kill casino-bot.js

# THEN: Start full automation
run bn4.js

# Monitor everything
tail bn4.js && tail auto-factions.js && tail auto-augs.js

# Check RAM usage
free

# Kill all automation (if needed)
kill bn4.js; kill auto-factions.js; kill auto-augs.js; kill auto-crime.js

# Restart with custom settings
run bn4.js && run auto-factions.js --target-rep 500000
```

---

**Total Development**: 4 new scripts + 3 documentation files
**Total Automation**: ~95% hands-off
**Expected Completion**: 2-4 hours
**Difficulty**: Easy (just run and wait!)

**Ready to speed run BitNode 4? Start with `run bn4.js`!** 🚀
