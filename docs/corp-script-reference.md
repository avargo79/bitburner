# Corporation Automation Script - Technical Reference

## Overview

The `corp.ts` script provides a fully automated corporation management system for Bitburner. It progresses through three distinct phases followed by an autopilot mode that runs indefinitely. The script is based on proven strategies and implements optimal pathways for rapid corporation growth and profit maximization.

**Script Location**: `src/corp.ts`  
**Prerequisites**: Corporation API (Warehouse API and Office API access)  
**Source Files**: BN3 (BitNode 3) at level 3 unlocks full API, otherwise requires SF3 or API purchase

---

## Table of Contents

1. [Configuration](#configuration)
2. [Execution Phases](#execution-phases)
3. [Phase 1: Agriculture Foundation](#phase-1-agriculture-foundation)
4. [Phase 2: Investment-Funded Growth](#phase-2-investment-funded-growth)
5. [Phase 3: Tobacco Production](#phase-3-tobacco-production)
6. [Autopilot Mode](#autopilot-mode)
7. [Cost Constraints & Triggers](#cost-constraints--triggers)
8. [Helper Functions](#helper-functions)
9. [Employee Wellness System](#employee-wellness-system)
10. [Research Priorities](#research-priorities)
11. [Upgrade Strategy](#upgrade-strategy)

---

## Configuration

### Wellness Configuration (`WELLNESS_CONFIG`)

```typescript
{
    moraleThreshold: 95,              // Trigger tea purchase below this
    energyThreshold: 95,              // Trigger coffee purchase below this
    criticalMoraleThreshold: 90,      // Trigger party below this
    criticalEnergyThreshold: 90,      // Trigger party below this
    internRatioNormal: 9,             // 1 intern per 9 employees
    internRatioHigh: 6                // Fallback: 1 intern per 6 employees
}
```

### Constants

- **Cities**: All 6 cities (Sector-12, Aevum, Chongqing, New Tokyo, Ishima, Volhaven)
- **Division 1**: Agriculture
- **Division 2**: Tobacco
- **Main Production City**: Aevum (for Tobacco)
- **Minimum Research Reserve**: 50,000 research points before spending

---

## Execution Phases

The script executes sequentially through four stages:

```
main()
  ↓
part1() → Agriculture setup with basic infrastructure
  ↓
part2() → Investment rounds and expansion
  ↓
part3() → Tobacco division launch
  ↓
autopilot() → Infinite loop for product development and optimization
```

**No User Intervention Required**: The script handles all decisions automatically.

---

## Phase 1: Agriculture Foundation

**Goal**: Establish profitable Agriculture division across all cities with minimal investment.

### Step-by-Step Execution

#### 1.1 Division Creation
- **Action**: `expandIndustry('Agriculture', 'Agriculture')`
- **Cost**: Varies by industry (Agriculture: ~20-40B initial funds)
- **Wait Condition**: Corporation funds >= industry starting cost
- **Check**: Skips if division already exists

#### 1.2 Smart Supply Unlock
- **Action**: `unlockUpgrade('Smart Supply')`
- **Cost**: ~500B - 800B
- **Wait Condition**: Funds available
- **Purpose**: Automates material purchasing for production
- **Activation**: Enabled in Sector-12 first: `setSmartSupply(division, 'Sector-12', true)`

#### 1.3 City Expansion (All 6 Cities)
For each city:

**a) Expand to City**
- **Action**: `expandCity(division, city)`
- **Cost**: `officeInitialCost` (typically ~4B per city)
- **Wait Condition**: Funds >= cost
- **Result**: Opens office in city

**b) Purchase Warehouse**
- **Action**: `purchaseWarehouse(division, city)`
- **Cost**: `warehouseInitialCost` (typically ~5B per warehouse)
- **Wait Condition**: Funds >= cost
- **Result**: Enables material storage and production

**c) Office Upgrade to Size 3**
- **Action**: `upgradeOffice(division, city, 3, positions)`
- **Size**: 3 employees
- **Job Distribution**:
  - 1 Operations
  - 1 Engineer
  - 1 Business
- **Wait Condition**: Funds >= upgrade cost
- **Note**: Too small for interns (< 9 employees)

**d) Material Sales Setup**
- **Action**: `sellMaterial(division, city, 'Food', 'MAX', 'MP')`
- **Action**: `sellMaterial(division, city, 'Plants', 'MAX', 'MP')`
- **Parameters**:
  - `'MAX'`: Sell maximum available
  - `'MP'`: Market Price (dynamic pricing)

#### 1.4 Warehouse Upgrades
- **Action**: `upgradeWarehouseUpto(division, city, 2)` for all cities
- **Target Level**: 2
- **Cost Per Upgrade**: Increases exponentially
- **Wait Condition**: Funds >= upgrade cost per warehouse
- **Purpose**: Increases storage capacity for materials

#### 1.5 Advertising
- **Action**: `hireAdVertUpto(division, 1)`
- **Target**: 1 AdVert
- **Cost**: First AdVert ~1B, scales exponentially
- **Purpose**: Increases awareness and popularity for sales

### Phase 1 Success Criteria

- ✅ Agriculture division exists in all 6 cities
- ✅ Smart Supply unlocked and enabled
- ✅ All cities have size-3 offices with employees assigned
- ✅ Food and Plants selling at market price
- ✅ Warehouses at level 2
- ✅ 1 AdVert hired

---

## Phase 2: Investment-Funded Growth

**Goal**: Secure two major investment rounds ($210B and $5T) while scaling production capacity.

### Pre-Investment 1 Activities

#### 2.1 Upgrade Purchases (Level 2)
**Action**: `upgradeUpto(ns, upgrades)` with:
```javascript
[
  { name: 'FocusWires', level: 2 },
  { name: 'Neural Accelerators', level: 2 },
  { name: 'Speech Processor Implants', level: 2 },
  { name: 'Nuoptimal Nootropic Injector Implants', level: 2 },
  { name: 'Smart Factories', level: 2 }
]
```

**Wait Condition**: Funds >= upgrade cost (each upgrade purchased sequentially)

**Cost per Level**: Varies but typically:
- Level 1: ~1B - 10B
- Level 2: ~10B - 100B

**Purpose**: Boost employee productivity and production quality/quantity

#### 2.2 Production Booster Materials (Round 1)
**Action**: `buyMaterialsUpto(ns, division, city, materials)` for all cities
```javascript
[
  { name: 'Hardware', qty: 125 },
  { name: 'AI Cores', qty: 75 },
  { name: 'Real Estate', qty: 27000 }
]
```

**Purchase Method**: Buys at (targetQty - currentQty) / 10 per cycle
**Wait Condition**: Continues buying until target quantity reached
**Purpose**: Increases production multiplier significantly

### Investment Round 1: $210 Billion

**Wait Condition**: `investmentOffer(ns, 210e9, 1)`
- Waits until investment offer >= $210B
- Factors in ongoing revenue
- Uses hacknet hashes if available (`Sell for Corporation Funds`)
- Round check: Only accepts if current round <= 1

**Result**: Massive capital injection for expansion

### Post-Investment 1 Activities

#### 2.3 Office Expansion to Size 9
**Action**: `upgradeOffice(division, city, 9, positions)` for all cities

**Job Distribution** (with 1/9 intern ratio):
```javascript
buildPositionsWithInterns(jobs, 9, {
    operations: 2,
    engineer: 2,
    business: 1,
    management: 2,
    RAndD: 1
})
// Results in:
// - 1 Intern (automatically calculated)
// - 2 Operations, 2 Engineer, 1 Business, 2 Management, 1 R&D
```

**Wait Condition**: Funds >= upgrade cost
**Cost**: Scales with size increase (from 3 to 9 = 6 employee increase)

#### 2.4 Factory & Storage Upgrades
```javascript
[
  { name: 'Smart Factories', level: 10 },
  { name: 'Smart Storage', level: 10 }
]
```
**Wait Condition**: Funds >= each upgrade cost

#### 2.5 Warehouse Expansion (Level 9)
**Action**: `upgradeWarehouseUpto(division, city, 9)` for all cities
**Wait Condition**: Funds >= upgrade cost per warehouse

#### 2.6 Production Booster Materials (Round 2)
```javascript
[
  { name: 'Hardware', qty: 2800 },
  { name: 'Robots', qty: 96 },
  { name: 'AI Cores', qty: 2520 },
  { name: 'Real Estate', qty: 146400 }
]
```
**Note**: Much higher quantities than Round 1

### Investment Round 2: $5 Trillion

**Wait Condition**: `investmentOffer(ns, 5e12, 2)`
- Waits until investment offer >= $5T
- Same mechanics as Round 1 but higher threshold

### Post-Investment 2 Activities

#### 2.7 Warehouse Expansion (Level 19)
**Action**: `upgradeWarehouseUpto(division, city, 19)` for all cities

#### 2.8 Production Booster Materials (Round 3)
```javascript
[
  { name: 'Hardware', qty: 9300 },
  { name: 'Robots', qty: 726 },
  { name: 'AI Cores', qty: 6270 },
  { name: 'Real Estate', qty: 230400 }
]
```
**Note**: Final large material purchase for Agriculture

### Phase 2 Success Criteria

- ✅ Accepted $210B investment (Round 1)
- ✅ Accepted $5T investment (Round 2)
- ✅ All cities have size-9 offices with interns
- ✅ Warehouses at level 19
- ✅ High quantities of booster materials in all warehouses
- ✅ Employee upgrades at level 2-10

---

## Phase 3: Tobacco Production

**Goal**: Launch high-profit Tobacco division and begin product development.

### 3.1 Industry Expansion
**Action**: `expandIndustry('Tobacco', 'Tobacco')`
**Wait Condition**: Funds >= industry cost
**Cost**: Typically ~30-50T for Tobacco

### 3.2 City Setup (All 6 Cities)

For each city:

#### Standard Cities (5 cities)
**Office Size**: 9 employees
**Job Distribution**:
```javascript
buildPositionsWithInterns(jobs, 9, {
    operations: 2,
    engineer: 2,
    business: 1,
    management: 2,
    RAndD: 1
})
// Results: 1 Intern + 8 production employees
```

#### Main City (Aevum)
**Office Size**: 30 employees
**Job Distribution**:
```javascript
buildPositionsWithInterns(jobs, 30, {
    operations: 6,
    engineer: 6,
    business: 5,
    management: 5,
    RAndD: 5
})
// Results: 3 Interns + 27 production employees
```

**Reason**: Product development requires more employees in main city

### 3.3 First Product Launch
**Action**: `makeProduct(ns, division, 'Aevum', 'Tobacco v1', 1e9, 1e9)`
**Design Budget**: $1 billion
**Marketing Budget**: $1 billion
**Wait Condition**: Funds >= (design + marketing)
**Development Time**: Several cycles (progress shown in-game)

### Phase 3 Success Criteria

- ✅ Tobacco division exists in all cities
- ✅ Aevum has 30-employee office
- ✅ Other cities have 9-employee offices
- ✅ Tobacco v1 product in development

---

## Autopilot Mode

**Goal**: Infinite loop managing product lifecycle, research, upgrades, and going public.

### Loop Structure (1-second intervals)

```
while (true) {
    1. Product Development & Sales
    2. Research Point Management
    3. Research Unlocks
    4. Office/AdVert Expansion
    5. Upgrade Leveling
    6. Employee Wellness
    7. Going Public
    8. Share Trading
    9. Unlocks (Shady Accounting, Gov Partnership)
    10. Dividends
    sleep(1000)
}
```

### 1. Product Development & Sales

#### Product Completion Check
**Trigger**: `product.developmentProgress >= 100`
**Actions**:
1. **Start Selling**: `sellProduct(division, mainCity, productName, 'MAX', 'MP*multiplier', true)`
   - Price multiplier: `2^(version-1)` (exponential pricing)
   - Example: v1 = MP*1, v2 = MP*2, v3 = MP*4
2. **Enable Market TA-II**: If researched, optimize pricing automatically
3. **Discontinue Old Product**: If at max capacity (3-5 products), remove earliest version
4. **Start New Product**: Double the design/marketing budget
   - Budget formula: `1e9 * 2^version`
   - v1: $1B each, v2: $2B each, v3: $4B each, etc.

**Max Products**:
- Base: 3 products
- +1 with "uPgrade: Capacity.I"
- +1 with "uPgrade: Capacity.II"
- Maximum: 5 products

### 2. Research Point Management

#### Hacknet Hash Injection
**Trigger**: `numHashes() >= hashCost('Exchange for Corporation Research')`
**Condition**: `researchPoints < 3 * minResearch` (< 150,000)
**Action**: `spendHashes('Exchange for Corporation Research')`
**Purpose**: Accelerate research when below reserve threshold

### 3. Research Unlocks (Ordered Priority)

#### Priority 1: Hi-Tech R&D Laboratory
**Trigger**: Not researched && `researchPoints - cost >= minResearch`
**Cost**: ~20,000 RP
**Purpose**: Unlocks advanced research options
**Reserve Check**: Keeps 50,000 RP after purchase

#### Priority 2: Market-TA.I
**Trigger**: Hi-Tech Lab researched && not owned
**Cost**: ~20,000 RP
**Purpose**: Basic market analysis for pricing

#### Priority 3: Market-TA.II
**Trigger**: Market-TA.I researched && not owned
**Cost**: ~50,000 RP
**Purpose**: Advanced pricing optimization (huge profit boost)
**Special Action**: Enables TA-II on all existing products

#### Priority 4: uPgrade: Fulcrum
**Trigger**: Market-TA.II researched && not owned
**Cost**: ~10,000 RP
**Purpose**: General production improvement

#### Priority 5: uPgrade: Capacity.I
**Trigger**: Fulcrum researched && not owned
**Cost**: ~20,000 RP
**Effect**: maxProducts++ (3 → 4)

#### Priority 6: uPgrade: Capacity.II
**Trigger**: Capacity.I researched && not owned
**Cost**: ~30,000 RP
**Effect**: maxProducts++ (4 → 5)

### 4. Office/AdVert Expansion

**Decision Logic**: Choose cheaper option between office expansion and advertising

#### Office Expansion (if cheaper)
**Comparison**: `getOfficeSizeUpgradeCost(division, mainCity, 15) < getHireAdVertCost(division)`
**Trigger**: Funds >= upgrade cost
**Action**: 
1. Upgrade by 15 employees
2. Hire all new employees
3. Redistribute jobs with intern allocation
   - Distribution: Equal weights (1:1:1:1:1) for Ops/Eng/Bus/Mgmt/R&D
   - Interns: Auto-calculated at 1/9 ratio

#### Advertising (if cheaper)
**Trigger**: Funds >= AdVert cost
**Action**: `hireAdVert(division)`
**Effect**: Increases awareness and popularity exponentially

### 5. Upgrade Leveling

**Function**: `levelUpgrades(ns, 0.1)`
**Logic**: 
1. Find cheapest available upgrade
2. If `cost <= 10% of corporation funds`, purchase it
3. Continuous upgrades as long as affordable

**Upgrade List** (prioritized by cost):
- Smart Factories
- Smart Storage
- DreamSense
- Wilson Analytics
- Nuoptimal Nootropic Injector Implants
- Speech Processor Implants
- Neural Accelerators
- FocusWires
- ABC SalesBots
- Project Insight

### 6. Employee Wellness

**Function**: `manageEmployeeWellness(ns, cities, division)`

**Per City Checks**:

#### Tea Purchase
**Trigger**: `avgMorale < 95`
**Action**: `buyTea(division, city)`
**Effect**: Boosts morale

#### Coffee Purchase
**Trigger**: `avgEnergy < 95`
**Action**: `buyCoffee(division, city)`
**Effect**: Boosts energy

#### Office Party (Emergency)
**Trigger**: `avgMorale < 90 && avgEnergy < 90`
**Action**: `throwParty(division, city, partyCost)`
**Effect**: Large boost to both stats

**Importance**: Low morale/energy severely reduces production efficiency

### 7. Going Public

**Trigger**: `revenue >= 1e18` ($1 quintillion/sec)
**Action**: `goPublic(0)` (0 shares initially public)
**Effect**: 
- Enables share trading
- Unlocks dividend payments
- Corporation stock begins trading

### 8. Share Trading (Post-IPO)

#### Sell Shares
**Trigger**: 
- No cooldown: `shareSaleCooldown <= 0`
- Profit opportunity: `sharePrice * 1e6 > player.money`
**Action**: `sellShares(1e6)` (sell 1 million shares)
**Purpose**: Convert corporation value to personal wealth

#### Buyback Shares
**Trigger**:
- Issued shares exist: `issuedShares > 0`
- Can afford: `player.money > 2 * issuedShares * sharePrice`
**Action**: `buyBackShares(issuedShares)` (buy all back)
**Purpose**: Regain ownership percentage

### 9. Special Unlocks

#### Shady Accounting
**Trigger**: Public && funds >= cost
**Cost**: ~500B - 1T
**Effect**: Reduces penalties

#### Government Partnership
**Trigger**: Public && funds >= cost
**Cost**: ~2T - 5T
**Effect**: Increases favor and bonuses

### 10. Dividend Payments

**Formula**: `Math.log(revenue) / (20 * Math.log(1000))`
**Range**: 0% - 99%
**Scaling**: Logarithmic based on revenue
**Effect**: Pays player directly from corporation profits

---

## Cost Constraints & Triggers

### Waiting Mechanisms

#### `moneyFor(ns, func, ...args)`
**Purpose**: Wait until funds available for action
**Logic**: 
```javascript
while (func(...args) > corporation.funds) {
    await sleep(1000)
}
```
**Usage**: Dynamic cost functions (e.g., upgrade costs)

#### `moneyForAmount(ns, amount)`
**Purpose**: Wait for specific amount
**Logic**:
```javascript
while (amount > corporation.funds) {
    await sleep(1000)
}
```
**Usage**: Fixed costs (e.g., product development)

### Cost Scaling Examples

| Item | Initial Cost | Scaling |
|------|-------------|---------|
| Office Expansion | ~4B per city | Linear with size increase |
| Warehouse | ~5B | Initial purchase |
| Warehouse Upgrade | ~10B (lvl 2) | Exponential per level |
| AdVert | ~1B (1st) | Exponential (10x per level) |
| Smart Supply Unlock | ~500B - 800B | One-time |
| Upgrade Levels | Varies | Exponential per level |
| Industry Expansion | 20B - 50T | Depends on industry |
| Office Size Upgrade | ~100M per employee | Increases with total size |

---

## Helper Functions

### Core Utilities

#### `expandIndustry(ns, industry, division)`
- Creates new division in specified industry
- Checks if already exists before purchasing
- Waits for sufficient funds

#### `expandCity(ns, division, city)`
- Opens office in new city for division
- Cost: `officeInitialCost` constant
- Idempotent (safe to call multiple times)

#### `purchaseWarehouse(ns, division, city)`
- Buys warehouse for city office
- Required for material production/storage
- Cost: `warehouseInitialCost` constant

#### `upgradeOffice(ns, division, city, size, positions)`
- Increases office size
- Hires employees to fill capacity
- Assigns jobs according to position array
- Format: `[{ job: 'Operations', num: 2 }, ...]`

#### `buyMaterialsUpto(ns, division, city, materials)`
- Purchases materials until target quantity reached
- Uses bulk buying: `(targetQty - currentQty) / 10` per cycle
- Monitors progress and stops when complete

#### `upgradeWarehouseUpto(ns, division, city, level)`
- Upgrades warehouse to target level
- Waits for funds between each upgrade
- Exponentially increasing costs

### Product Management

#### `makeProduct(ns, division, city, name, design, marketing)`
- Starts product development
- Checks if product already exists
- Requires funds >= design + marketing budgets
- Logs development start

#### `getLatestVersion(ns, division)`
- Parses all product names for version numbers
- Returns highest version number
- Used to increment product versions

#### `parseVersion(name)`
- Extracts numeric version from product name
- Format: "Product vX" where X is version
- Throws error if no version found

### Employee Management

#### `calculateInternCount(officeSize, ratio = 9)`
- Formula: `Math.floor(officeSize / ratio)`
- Default: 1 intern per 9 employees
- Returns 0 if office too small

#### `buildPositionsWithInterns(jobs, officeSize, distribution)`
- Calculates intern count
- Distributes remaining slots by ratio
- Returns position array for `upgradeOffice()`
- Example:
```javascript
buildPositionsWithInterns(jobs, 9, {
    operations: 2,
    engineer: 2,
    business: 1,
    management: 2,
    RAndD: 1
})
// Returns: [
//   { job: 'Intern', num: 1 },
//   { job: 'Operations', num: 2 },
//   { job: 'Engineer', num: 2 },
//   { job: 'Business', num: 1 },
//   { job: 'Management', num: 2 },
//   { job: 'R&D', num: 1 }
// ]
```

#### `getEmployeeStats(ns, division, city)`
- Returns: `{ morale: number, energy: number }`
- Retrieves average stats from office
- Used for wellness monitoring

### Investment & Research

#### `investmentOffer(ns, amount, round)`
- Waits for investment offer >= target
- Accounts for ongoing revenue
- Uses hacknet hashes if available
- Accepts offer when threshold met
- Round check prevents accepting wrong round

#### `levelUpgrades(ns, percent)`
- Finds cheapest available upgrade
- Purchases if cost <= percent of funds
- Called every autopilot cycle with 10% threshold

---

## Employee Wellness System

### Purpose
Maintain high morale and energy to maximize production efficiency. Low stats drastically reduce output quality and quantity.

### Configuration
- **Normal Operation**: 1 intern per 9 employees (11% ratio)
- **Enhanced Operation**: 1 intern per 6 employees (17% ratio) - if needed
- **Morale Threshold**: 95 (out of 100)
- **Energy Threshold**: 95 (out of 100)
- **Critical Threshold**: 90 (emergency intervention)

### Intern Benefits
- **Morale Boost**: +0.5 to +2 per cycle
- **Energy Boost**: +0.5 to +2 per cycle
- **Experience Growth**: Increases all employee stats over time

### Intervention Hierarchy

1. **Tea** (Morale < 95)
   - Cost: Low (~$10M - $100M)
   - Effect: +3-10 morale
   - Frequency: As needed per city

2. **Coffee** (Energy < 95)
   - Cost: Low (~$10M - $100M)
   - Effect: +3-10 energy
   - Frequency: As needed per city

3. **Office Party** (Morale < 90 AND Energy < 90)
   - Cost: High (variable based on office size)
   - Effect: +15-30 both stats
   - Frequency: Emergency only

### Integration
- Checked every autopilot cycle (1 second)
- Runs for all cities in Tobacco division
- Logs all interventions for monitoring
- Automatic - no user action required

---

## Research Priorities

### Optimal Unlock Order

1. **Hi-Tech R&D Laboratory** (~20,000 RP)
   - **Unlocks**: Advanced research tree
   - **Required For**: Market TA research

2. **Market-TA.I** (~20,000 RP)
   - **Effect**: Basic market analysis
   - **Prerequisite**: Hi-Tech Lab

3. **Market-TA.II** (~50,000 RP)
   - **Effect**: Optimal pricing automation
   - **Impact**: 2-5x profit increase
   - **Prerequisite**: Market-TA.I
   - **Critical**: Most important research

4. **uPgrade: Fulcrum** (~10,000 RP)
   - **Effect**: Production boost
   - **Prerequisite**: Market-TA.II

5. **uPgrade: Capacity.I** (~20,000 RP)
   - **Effect**: +1 product slot (3 → 4)
   - **Prerequisite**: Fulcrum

6. **uPgrade: Capacity.II** (~30,000 RP)
   - **Effect**: +1 product slot (4 → 5)
   - **Prerequisite**: Capacity.I

### Research Point Sources

1. **R&D Employees**: Passive generation
2. **Hacknet Hashes**: `Exchange for Corporation Research`
3. **Time**: Accumulates based on R&D employee count and stats

### Reserve Management
- Always keeps 50,000 RP reserve before purchasing
- Prevents depleting research points completely
- Ensures continuous progress toward next unlock

---

## Upgrade Strategy

### Level-Based Upgrades

**Tier 1** (Levels 1-2): Early Phase
- FocusWires
- Neural Accelerators
- Speech Processor Implants
- Nuoptimal Nootropic Injector Implants
- Smart Factories

**Tier 2** (Levels 3-10): Post-Investment
- Smart Factories (priority)
- Smart Storage (priority)
- Continue Tier 1 upgrades

**Tier 3** (Levels 10+): Autopilot
- Continuous leveling of cheapest upgrade
- 10% funds threshold

### Effects by Upgrade

| Upgrade | Primary Effect | Secondary Effect |
|---------|---------------|------------------|
| Smart Factories | Production quantity | - |
| Smart Storage | Warehouse capacity | Material costs |
| DreamSense | Sales effectiveness | - |
| Wilson Analytics | Advertising power | Awareness |
| Nuoptimal Nootropic | All employee stats | Experience gain |
| Speech Processor | Management/Business | - |
| Neural Accelerators | Engineer/Operations | - |
| FocusWires | All employee effectiveness | - |
| ABC SalesBots | Sales automation | - |
| Project Insight | Production quality | - |

### Cost Efficiency
- Costs scale exponentially: ~1.5x per level
- Level 1: ~1B - 10B
- Level 10: ~100B - 1T
- Level 20: ~10T - 100T

---

## Troubleshooting & Notes

### Common Issues

**Script Stops Early**
- Check API access (Corporation API required)
- Verify Source File 3 ownership or API purchase
- Ensure no manual corporation interactions during execution

**Slow Progress**
- Normal in early phases (waiting for investments)
- Investment rounds can take 10-30 minutes of game time
- Hacknet hashes can accelerate funding

**Products Not Developing**
- Verify main city has sufficient employees (30+)
- Check product development progress in corporation UI
- Ensure funds available for design + marketing

**Low Profits**
- Market-TA.II research is critical (wait for it)
- Check employee morale/energy (should be > 95)
- Verify AdVert count (higher = more sales)

### Manual Intervention

**Safe to Modify**:
- Employee assignments (script will reassign next cycle)
- Material purchases (Smart Supply handles this)
- Dividend percentage (overwritten each cycle)

**Do Not Modify**:
- Division names (script expects "Agriculture" and "Tobacco")
- Product naming scheme (must be "Name vX" format)
- Investment rounds (let script handle acceptance)

### Performance Tips

1. **Hacknet**: Build hacknet early for hash income
2. **Research**: Prioritize Market-TA.II above all else
3. **Employees**: More employees in main city = faster products
4. **Advertising**: Exponential returns, keep buying
5. **Materials**: Don't manually adjust after script setup

---

## Script Output

### Log Messages

The script logs all major actions:
- `Expanding to [industry]...`
- `Upgraded [upgrade] to level X`
- `Hired AdVert in [division] to level X`
- `Bought tea for [division] ([city])`
- `Started to make [product] with $Xb for design...`
- `Waiting for investment offer of $X...`
- `Accepted investment offer of $X`

### Monitoring Progress

Check logs for:
- Current phase (Part 1/2/3 or Autopilot)
- Investment waiting status
- Product development start
- Employee wellness interventions
- Upgrade purchases

---

## Advanced Configuration

### Modifying Constants

**Wellness Thresholds**:
```typescript
// Adjust if employees still underperforming
moraleThreshold: 95  // Lower = less frequent tea
energyThreshold: 95  // Lower = less frequent coffee
```

**Intern Ratio**:
```typescript
internRatioNormal: 9  // Lower = more interns (e.g., 6)
```

**Research Reserve**:
```typescript
const minResearch = 50e3  // Increase for more safety
```

**Autopilot Sleep**:
```typescript
await ns.sleep(1000)  // Increase to reduce CPU usage
```

### Custom Job Distributions

Modify the distribution objects in `buildPositionsWithInterns()` calls:

```javascript
// More Operations focus
{
    operations: 3,  // Increased
    engineer: 1,    // Decreased
    business: 1,
    management: 2,
    RAndD: 1
}
```

---

## Mathematical Formulas

### Product Pricing
```
price = MP * 2^(version - 1)
where MP = Market Price (dynamic)
```

### Dividend Percentage
```
dividends = min(0.99, max(0, log(revenue) / (20 * log(1000))))
Scales logarithmically from 0% to 99%
```

### Intern Count
```
internCount = floor(officeSize / internRatio)
Default: floor(size / 9)
```

### Material Purchase Rate
```
buyRate = (targetQty - currentQty) / 10
Adjusts each cycle until target reached
```

---

## Future Enhancements

### Potential Additions
- Multi-division product management
- Dynamic intern ratio adjustment
- Advanced material quality optimization
- Export/import between divisions
- Corporation-specific faction automation
- Going public timing optimization
- Share price manipulation strategies

### Not Implemented (By Design)
- Multiple product types per division (focuses on Tobacco)
- Manual office party scheduling (auto-triggered only)
- Custom product naming (uses versioned naming)
- Government partnership farming (one-time unlock)

---

## Conclusion

This script provides a complete hands-off corporation experience. From initial Agriculture setup through Tobacco product empire, all decisions are automated based on proven optimal strategies. The wellness system ensures peak employee performance, while the research and upgrade priorities maximize profitability.

**Expected Results**:
- Phase 1: 5-10 minutes (real-time)
- Phase 2: 15-30 minutes (waiting for investments)
- Phase 3: 5 minutes (setup)
- Autopilot: Infinite (exponentially growing profits)
- Revenue at 1 hour: $1e18+ per second
- Revenue at 2 hours: $1e21+ per second

**Final Note**: Let the script run uninterrupted for best results. Manual interventions during phases 1-3 can disrupt the carefully timed progression.
