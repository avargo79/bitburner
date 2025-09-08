# BitNode 1.1 Augmentation Guide

## Overview
This guide provides augmentation recommendations specifically designed for BitNode 1.1 **without requiring Singularity API access**. Since BN1.1 has limited Singularity functions, this is the correct approach using static community knowledge and manual guidance.

**Script**: `src/guide.ts` - The definitive augmentation guide for BN1.1

## Features
- **No Singularity API Required**: Works in BN1.1 where Singularity functions are limited
- **Community-Driven Database**: Built from Reddit guides, GitHub repositories, and meta discussions
- **Static Progression Paths**: Clear timelines for early, mid, and late game
- **Faction Joining Guide**: How to unlock each faction in BN1.1
- **Manual Shopping Lists**: Exportable data for planning purchases

## Usage

### Basic Guide
```bash
run guide.js
```

### Detailed Views
```bash
# Show progression timeline for BN1.1
run guide.js --timeline

# Show faction joining guide
run guide.js --factions

# Show all augmentations database  
run guide.js --augments

# Filter by priority (ESSENTIAL/HIGH/MEDIUM/LOW)
run guide.js --priority ESSENTIAL

# Export data to files for planning
run guide.js --export

# Show help
run guide.js --help
```

## How It Works

### 1. Static Knowledge Base
Since Singularity API is limited in BN1.1, this guide uses:
- **Pre-researched augmentation data** from community sources
- **Static progression timelines** based on meta analysis
- **Manual guidance** instead of automated detection
- **Faction joining strategies** for BN1.1 constraints

### 2. Community Research Sources
- **Reddit r/Bitburner**: Meta discussions and optimization guides
- **Official Source Code**: bitburner-official/bitburner-src augmentation data
- **Community Scripts**: Successful BN1.1 completion strategies
- **Player Progression Analysis**: Common optimization paths

### 3. BN1.1 Specific Constraints
- **Limited Singularity**: Cannot automate faction work or purchases
- **Manual Faction Joining**: Must install backdoors and do work manually  
- **Static Costs**: Prices shown are base costs (will increase with purchases)
- **Reputation Requirements**: Must manually earn rep through faction work

## BN1.1 Progression Path

### Phase 1: Early Game (0-50 hacking)
**Goal**: Join CyberSec and get first augmentations
- **Factions**: CyberSec (hack CSEC server, install backdoor)
- **Augments**: BitWire ($10k), Synaptic Enhancement Implant ($7.5k)
- **Total Cost**: ~$20k
- **Benefits**: +5% hacking skill, +3% hacking speed

### Phase 2: Mid Early (50-200 hacking)  
**Goal**: Expand to combat factions and more augments
- **Factions**: Slum Snakes/Tetrads (crime work)
- **Augments**: Augmented Targeting I ($15k), Cranial Signal Processors ($70k)
- **Total Cost**: ~$100k additional
- **Benefits**: Combat stats + more hacking bonuses

### Phase 3: Mid Game (200-500 hacking)
**Goal**: Major augment purchases for scaling
- **Factions**: NiteSec (hack avmnite-02h), The Black Hand (hack I.I.I.I)
- **Augments**: Neural-Retention Enhancement ($250k), DataJack ($450k)
- **Total Cost**: ~$700k additional  
- **Benefits**: +25% hacking exp, +25% hacking money

### Phase 4: Late Game (500+ hacking)
**Goal**: Red Pill acquisition and BN1.1 completion
- **Factions**: Daedalus (2500+ hacking OR 1500+ combat AND $100B+)
- **Augments**: The Red Pill (special requirements)
- **Requirements**: $100B+, 2.5M+ Daedalus rep
- **Result**: Access to destroy BitNode and advance

## Essential Augmentations for BN1.1

### Must-Have Early Game
1. **BitWire** (CyberSec, $10k, 2.5k rep)
   - +5% hacking skill
   - First augment to buy, cheap and effective

2. **Synaptic Enhancement Implant** (CyberSec, $7.5k, 1k rep)  
   - +3% hacking speed
   - Very cheap, get alongside BitWire

3. **Augmented Targeting I** (Slum Snakes/Tetrads, $15k, 5k rep)
   - +10% dexterity
   - Essential for combat requirements

### High-Value Mid Game
1. **Neural-Retention Enhancement** (NiteSec, $250k, 20k rep)
   - +25% hacking experience gain
   - Massive exp boost, worth saving for

2. **DataJack** (Multiple factions, $450k, 112.5k rep)
   - +25% money from hacking
   - Major income scaling boost

3. **Artificial Synaptic Potentiation** (Black Hand/NiteSec, $80k, 6.25k rep)
   - +2% hacking speed, +5% hacking money
   - Dual benefit, good value

### End Game Essential
1. **The Red Pill** (Daedalus, special requirements)
   - Allows BitNode destruction
   - Required to complete BN1.1 and advance

## Faction Joining Strategy for BN1.1

### Easy Entry Factions
- **CyberSec**: Hack CSEC server (~50 hacking), install backdoor
- **Slum Snakes/Tetrads**: Do crimes, build combat stats

### Medium Difficulty  
- **NiteSec**: Hack avmnite-02h server (~200 hacking), install backdoor
- **The Black Hand**: Hack I.I.I.I server (~350 hacking), install backdoor

### Hard Entry
- **BitRunners**: Hack run4theh111z server (~500 hacking), install backdoor  
- **Daedalus**: 2500+ hacking OR 1500+ combat AND $100B+ (end game)

## Manual Purchasing Process

Since Singularity API is limited in BN1.1:

1. **Join Faction** (install backdoor or meet requirements)
2. **Work for Faction** (hacking contracts, field work, or security work)
3. **Earn Reputation** (check faction screen for current rep)
4. **Check Augmentation Costs** (prices increase with each purchase)
5. **Buy Augmentations** (manually through faction screen)
6. **Install Augmentations** (triggers soft reset, plan carefully)

## Tips for BN1.1 Success

1. **Start with CyberSec**: Easiest faction to join, has essential early augments
2. **Plan Installation Timing**: Installing augments triggers reset, so buy several at once
3. **Save Before Big Purchases**: Augment costs increase significantly with each purchase
4. **Focus on Hacking**: Combat augments only needed for faction requirements in BN1.1
5. **Build Money Early**: Neural-Retention Enhancement is expensive but worth it
6. **Prepare for Daedalus**: Need $100B+ and extremely high stats for Red Pill

## Exported Data Integration

The guide exports data to files when using `--export`:

- `/temp/bn1-augment-guide.txt`: Complete database and timeline
- `/temp/augment-shopping-list.txt`: Priority-sorted purchasing list

Example integration:
```javascript
// Read shopping list
const list = JSON.parse(ns.read("/temp/augment-shopping-list.txt"));
const nextToBuy = list.find(aug => !ownedAugments.includes(aug.name));

ns.tprint(`Next recommended: ${nextToBuy.name} from ${nextToBuy.faction}`);
ns.tprint(`Cost: $${ns.formatNumber(nextToBuy.cost)} | Rep: ${ns.formatNumber(nextToBuy.rep)}`);
```

## Limitations & Important Notes

- **No Real-Time Pricing**: Costs shown are base prices, actual costs increase with purchases
- **Manual Faction Work Required**: Cannot automate reputation earning in BN1.1
- **Static Database**: Augment data is pre-researched, not dynamically updated
- **Planning Tool**: This is a guide for manual play, not full automation
- **BN1.1 Specific**: Recommendations tailored for first BitNode completion

## Updating the Guide

The augmentation database is embedded in the script. To update:

1. Edit the `BN1_AUGMENTS` array in `src/augment-guide.ts`
2. Add new augmentations discovered in later patches
3. Update costs based on current game data
4. Modify progression timeline based on new strategies

## Contributing

This guide can be improved by:
- Updating augment costs and requirements
- Adding newly discovered optimization paths  
- Refining faction joining strategies
- Improving progression timeline estimates

The guide is designed to help players efficiently complete BN1.1 based on community knowledge and proven strategies.