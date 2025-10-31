# Early Install Strategy (Soft Reset Optimization)

## Overview
The **Early Install Strategy** is a critical optimization technique for BitNode speed runs. Instead of grinding for hours to afford increasingly expensive augmentations, you strategically install and reset when prices become too high, using your new multipliers to progress faster.

## The Math Behind Augmentation Pricing

### Price Multiplier Formula
Each augmentation you purchase increases ALL remaining augmentation prices by **1.9x (90% increase)**:

```
Current Price = Base Price × (1.9 ^ Owned Augmentations)
```

### Price Escalation Example
| Augs Owned | Price Multiplier | $1M Base Aug Costs | $10M Base Aug Costs |
|------------|------------------|-------------------|---------------------|
| 0          | 1.0x            | $1M               | $10M                |
| 5          | 2.5x            | $2.5M             | $25M                |
| 10         | 6.1x            | $6.1M             | $61M                |
| 15         | 15.1x           | $15.1M            | $151M               |
| 20         | 37.3x           | $37.3M            | $373M               |
| 25         | 92.3x           | $92.3M            | $923M               |
| 30         | 228.2x          | $228.2M           | $2.28B              |

**Key Insight**: After 15+ augmentations, prices escalate exponentially. A $10M base augmentation now costs $151M+!

## When to Trigger Early Install

### Automatic Detection Criteria
The `auto-augs.ts` script automatically triggers early install when **ALL** conditions are met:

1. **Minimum Progress**: You have at least **8 augmentations** installed
   - Ensures you have useful multipliers for next run
   - Exp/hack/rep multipliers make the next run 2-3x faster

2. **Price Threshold**: Average price of cheapest 5 available augs > **10x current money**
   - Example: If you have $1B, but cheapest augs cost $10B+
   - Would take hours to grind that much money

3. **Significant Multiplier**: Price multiplier > **5x base prices**
   - Indicates prices have escalated substantially
   - Reset will bring prices back to base levels

4. **Alternative Trigger**: Only **< 3 augmentations** affordable and price multiplier > **10x**
   - You're stuck with very few options
   - Better to reset and get more choices at lower prices

### Manual Override
You can also manually trigger early install:
```bash
run bn4.js --install-now
```

## Benefits of Early Install Strategy

### 1. **Price Reset**
- All augmentation prices return to base values
- That $100M augmentation is now only $10M again!
- Can buy 10x more augs with same money

### 2. **Multiplier Compounding**
Installing augmentations gives you permanent multipliers:
- **Exp Multipliers**: Level up faster → unlock better servers/factions sooner
- **Hack Multipliers**: Steal more money per hack → earn income faster
- **Rep Multipliers**: Build faction rep faster → unlock augs sooner

### 3. **Faster Overall Progression**
Example comparison:
- **Without Early Install**: Grind 8 hours for 30 augs → destroy w0r1d_d43m0n
- **With Early Install**: 
  - Run 1 (2 hours): Get 10 cheap augs with exp/hack multipliers → install
  - Run 2 (1.5 hours): With multipliers, get 15 more augs → install
  - Run 3 (1 hour): With stronger multipliers, get final 5+ augs → destroy w0r1d_d43m0n
  - **Total**: 4.5 hours (44% faster!)

## Typical BN4 Early Install Timeline

### **First Install (~8-12 augmentations)**
**Goal**: Get foundational multipliers

**Priority Augmentations**:
- CyberSec: Cranial Signal Processors (exp multipliers)
- Tian Di Hui: Neuroreceptor Management Implant (exp/faction rep)
- Netburners: HackNet node upgrades
- NiteSec: Basic hacking multipliers

**Trigger Point**: When prices hit $5B-$10B range and you have 8+ augs

**Expected Time**: 2-3 hours

### **Second Install (~15-20 augmentations)**
**Goal**: Build strong core multipliers

**Strategy**: 
- With 2-3x faster progression from first round multipliers
- Focus on mid-tier augmentations
- NiteSec, The Black Hand, BitRunners augs
- Start buying company faction augs (ECorp, Four Sigma)

**Trigger Point**: When prices hit $50B-$100B range and you have 15+ augs

**Expected Time**: 1.5-2 hours (faster due to multipliers)

### **Final Push (~30+ augmentations)**
**Goal**: Reach Daedalus and destroy w0r1d_d43m0n

**Strategy**:
- With strong multipliers, push to 30+ augs quickly
- Join Daedalus (requires 30 augs + stats)
- Purchase The Red Pill
- Max out hacking level
- Destroy w0r1d_d43m0n

**Expected Time**: 1-1.5 hours (very fast with strong multipliers)

## Configuration Options

### In `auto-augs.ts`:

```typescript
run auto-augs.js --early-install --early-install-multiplier 10
```

**Parameters**:
- `--early-install`: Enable automatic early install detection (default: **true**)
- `--early-install-multiplier`: Price threshold multiplier (default: **10**)
  - Higher = wait longer before triggering (more conservative)
  - Lower = trigger sooner (more aggressive resets)

### Recommended Settings by Strategy:

**Conservative** (fewer resets, longer runs):
```bash
--early-install-multiplier 15
```

**Balanced** (default):
```bash
--early-install-multiplier 10
```

**Aggressive** (frequent resets, maximize multiplier gain):
```bash
--early-install-multiplier 5
```

## How It Works In Practice

### Scenario: Mid-Game Check

```typescript
Current Status:
- Augmentations owned: 12
- Available money: $2B
- Price multiplier: 7.5x base prices

Available Augmentations:
1. BitRunners aug #1: $15B (7.5x current money)
2. Black Hand aug #2: $18B (9x current money)
3. Company aug #1: $22B (11x current money)
4. Company aug #2: $25B (12.5x current money)
5. Expensive aug #1: $40B (20x current money)

Average cheapest 5 augs: $24B
Threshold (10x money): $20B

Decision: TRIGGER EARLY INSTALL ✓
- Avg price ($24B) > Threshold ($20B) ✓
- Price multiplier (7.5x) > 5x threshold ✓
- Have 12 augs (>= 8 required) ✓

Result: Install now, prices reset to base, next run will be faster!
```

### After Install:
```typescript
New Run Status:
- Augmentations: 0 (all installed as permanent multipliers)
- Available money: $0 (fresh start)
- Price multiplier: 1.0x (base prices!)
- Your stats: 2x better from installed multipliers

Same Augmentations Now Cost:
1. BitRunners aug #1: $2B (was $15B!) → 87% cheaper
2. Black Hand aug #2: $2.4B (was $18B!) → 87% cheaper
3. Company aug #1: $2.9B (was $22B!) → 87% cheaper
4. Company aug #2: $3.3B (was $25B!) → 87% cheaper
5. Expensive aug #1: $5.3B (was $40B!) → 87% cheaper

With 2x better stats, you'll earn money 2x faster, so these augs are now ~14x easier to afford!
```

## Disabling Early Install

If you prefer manual control:

```bash
run auto-augs.js --early-install false
```

The script will still show warnings when early install is recommended, but won't trigger automatically.

## Strategy Comparison

### Without Early Install
```
Start → Grind → Grind → Grind → Grind → 30 augs → Done
         1hr     1hr     2hr     4hr              = 8 hours
```

### With Early Install (Optimal)
```
Start → Grind → Install (10 augs)
         2hr

New Run (2x faster) → Grind → Install (15 augs)
                       1.5hr

New Run (4x faster) → Grind → 30+ augs → Done
                       1hr                = 4.5 hours total
```

**Result**: 44% faster completion by strategically resetting instead of grinding endlessly!

## Key Takeaways

1. **Don't grind endlessly** - Price escalation makes late-game augs extremely expensive
2. **Reset strategically** - Install when you have useful multipliers and prices are too high
3. **Compound multipliers** - Each reset makes the next run exponentially faster
4. **Trust the automation** - The early install logic is mathematically optimized for speed
5. **2-3 resets is optimal** - First for exp/hack multipliers, second for rep multipliers, final push for completion

The early install strategy transforms BitNode runs from tedious grinds into efficient, strategic progressions!
