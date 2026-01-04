# Bitburner Corporation Strategy & Automation Guide

## Table of Contents
1. Introduction
2. Core Mechanics & Terminology
3. Step-by-Step Strategies
    - Early Game
    - Mid Game
    - Late Game / Endgame
4. Script Automation: Ideas & Best Practices
5. Advanced Tips, Pitfalls, and Research Priorities
6. References & Further Reading

---

## 1. Introduction

This guide compiles the most effective strategies, automation ideas, and advanced tips for running a Corporation in Bitburner. It synthesizes advice from top guides, GitHub scripts, Reddit walkthroughs, and community best practices. Use this as a foundation for building your own corporation automation scripts and maximizing profit in any bitnode.

---

## 2. Core Mechanics & Terminology

### Corporation Structure
- **Corporation**: The umbrella entity you control, containing all divisions.
- **Division**: An industry branch (e.g., Agriculture, Pharmaceutical, Healthcare). Each division can operate in up to six cities.
- **Office**: Each city has an office for each division, housing employees and a warehouse.
- **Warehouse**: Stores input materials, output materials, boost materials, and products.

### Employees & Positions
- **Employees**: Assigned to offices, have stats (Morale, Energy, Experience).
- **Positions**:
    - **Operations**: Increases production quantity.
    - **Engineer**: Increases production quality and slightly boosts quantity.
    - **Business**: Increases sales capacity.
    - **Management**: Boosts Operations and Engineer productivity.
    - **Research & Development**: Generates research points, minor quality boost.
    - **Intern**: Boosts morale/energy, increases experience gain.

### Materials & Products
- **Input Materials**: Consumed to produce outputs/products.
- **Output Materials**: Produced by divisions, sold for profit.
- **Boost Materials**: Special materials that increase production multipliers.
- **Products**: Created in product-based industries (e.g., Pharmaceutical, Healthcare).

### Production Multiplier
- Sum of all office multipliers in a division. Expanding to all six cities and buying warehouses maximizes this quickly.

### Phase Cycle
Corporation actions run in a repeating 10-second cycle:
1. **Start**: Stat boosts (tea, party) applied.
2. **Purchase**: Input/boost material orders processed.
3. **Production**: Inputs converted to outputs/products.
4. **Export**: (If unlocked) Materials/products moved between offices.
5. **Sale**: Sell orders processed.

### Research Points & Upgrades
- **Research Points**: Used to unlock division-specific upgrades.
- **Upgrades**: Global boosts (e.g., Smart Factories, DreamSense, Smart Storage).

### Investors & Shares
- **Investment Rounds**: Sell shares for cash to grow faster.
- **IPO & Dividends**: Go public to issue dividends, converting corp profit to personal money.

---

## 3. Step-by-Step Strategies

### Early Game

**1. Create Your Corporation**
- Go to City Hall in Sector-12 and use government seed money (Bitnode 3: self-funding is extremely slow).
- Name doesn’t matter.

**2. Choose Your First Division**
- **Start with Agriculture** (recommended by all top guides).
    - Material-based, profits immediately.
    - Sets up for a self-sufficient supply chain with Chemical later.

**3. Expand to All Cities**
- Create offices and buy warehouses in all six cities ASAP.
- This maximizes your division’s production multiplier.

**4. Hire Employees & Assign Roles**
- Hire 3 employees per office.
- Assign: 1 Operations, 1 Engineer, 1 Business.
- (Optionally, 1 Management if you expand office size.)

**5. Set Up Smart Supply**
- Unlock "Smart Supply" from the Corporation tab.
- Enable for all cities/divisions.
- Automates input material purchasing.

**6. Sell Output Materials**
- Set sell orders for Food and Plants: `MAX` quantity, `MP` (market price).
- Do this for each city.

**7. Boost Production Multiplier**
- Buy small amounts of **Real Estate** in each warehouse.
- Don’t overfill warehouses; adjust buy rates conservatively.

**8. Buy Key Upgrades**
- Prioritize: Smart Factories, DreamSense, Smart Storage, FocusWires, Project Insight.
- Upgrade a few levels as funds allow.

**9. Build Research Points**
- Assign some employees to Research & Development.
- Accumulate points for future upgrades.

---

### Mid Game

**1. Take Investment Rounds**
- Accept investor offers when you need cash to expand.
- Use funds to unlock new divisions (Pharmaceutical, Healthcare).

**2. Expand to New Divisions**
- **Pharmaceutical**: Mix of material and product-based.
    - Hire employees, assign jobs, set up Smart Supply and sell orders.
    - Create products ("Drugs") with modest design/marketing investment.
    - Discontinue and remake products if they don’t sell.

- **Healthcare**: Highest profit margin, unlock ASAP after Pharmaceutical.

**3. Upgrade Offices & Warehouses**
- Increase office size to 6, then 12, 30, 60, etc.
- Hire more employees, split jobs evenly.
- Upgrade warehouses as needed to avoid overflow.

**4. Research & Unlocks**
- Unlock key research in each division:
    - Hi-Tech R&D Laboratory (unlocks all other research)
    - Market-TA.I (auto-optimal selling price)
    - Self-Correcting Assemblers, Drones, Overclock, uPgrade: Fulcrum (for product-based)
- Use research points strategically; focus on profit-impacting upgrades.

**5. Manage Warehouse Capacity**
- Monitor storage; expand or upgrade Smart Storage if full.
- Fill excess space with boost materials for multiplier.

---

### Vertical Integration (The "Meta" Strategy)

This strategy maximizes the quality of your products (Tobacco) by feeding them high-quality raw materials (Plants) from your own Agriculture division. High quality inputs = High quality products = Massive Sales.

**1. Setup Agriculture (The Supplier)**
   - Goal: Produce massive amounts of high-quality **Plants**.
   - Maximize "Real Estate" in Agriculture warehouses to boost production multiplier.
   - Invest in upgrades: FocusWires, Neural Accelerators, Speech Processor Implants.

**2. Setup Tobacco (The Producer)**
   - Goal: Produce high-quality Tobacco products using your own Plants.
   - **CRITICAL STEP**: Go to your **Agriculture** division. In the "Export" tab (or via script), set up an export of **Plants** to your **Tobacco** division.
   - **Export Amount**: Set to `MAX` or use a negative value in scripts (e.g., maintain 0 stock).
   - Tobacco products created using high-quality internal inputs will have vastly superior stats compared to those made with bought materials.

**3. The Loop**
   - Quality Plants from Agriculture -> Tobacco Warehouse.
   - Tobacco converts Plants -> High Quality Products.
   - High Rating Products -> Exponentially higher sales price.

---

### Late Game / Endgame

**1. Go Public (IPO) & Issue Dividends**
- IPO lets you issue dividends, converting corp profit to personal money.
- Keep as many shares as possible for maximum dividend payout.

**2. Automate Everything**
- Unlock Corporation API and script all repetitive actions:
    - Expand offices/cities
    - Assign jobs
    - Set buy/sell orders
    - Upgrade warehouses/offices
    - Unlock research in sequence

**3. Optimize Research & Upgrades**
- Max out profit-impacting upgrades.
- Ignore upgrades with minimal impact (ads, charisma, etc.) unless you have excess funds.

**4. Bribe Factions (BN3)**
- Use corp funds to bribe factions for reputation if needed.
- Issue dividends to yourself for donation unlocks.

**5. Expand to Other Industries (Optional)**
- Only for achievements; not required for max profit.

**6. Troubleshoot Product Sales**
- If products aren’t selling, discontinue and create new ones with higher investment.

---

## 4. Script Automation: Ideas & Best Practices

### Why Automate?
- Manual management is tedious and error-prone.
- Scripting saves time, reduces mistakes, and enables scaling.
- Corporation API functions are RAM-intensive; optimize for minimal calls.

### Incremental Automation Script Ideas

**1. Employee Morale & Energy Maintainer**
```javascript
/** @param {NS} ns */
export async function main(ns) {
    const div = "Agriculture";
    const cities = ["Sector-12", "Aevum", "Volhaven", "Chongqing", "New Tokyo", "Ishima"];
    while (true) {
        for (const city of cities) {
            const office = ns.corporation.getOffice(div, city);
            if (office.avgMorale < 98) ns.corporation.throwParty(div, city, 500_000);
            if (office.avgEnergy < 98) ns.corporation.buyTea(div, city);
        }
        await ns.sleep(10000); // Check every 10 seconds
    }
}
```

**2. Set All Cities Buy/Sell Amounts**
- Command-line utility to set buy/sell orders for all cities in a division.
- Use Smart Supply for inputs, set sell orders to `MAX`/`MP` or use Market-TA.I if researched.

**3. Fill Excess Warehouse Room with Boost Materials**
- UI or script to fill a percentage of warehouse with boost materials (e.g., Real Estate).
- Naive algorithm: fill until diminishing returns, avoid overflow.

**4. Production & Sales Optimizer**
- UI with sliders for input purchase rates and sell price above market.
- Record sales per cycle, auto-adjust production to match demand.

**5. Office Expansion & Job Assignment**
- Script to expand office size in all cities.
- Assign jobs in optimal ratios (e.g., evenly, or weighted for production/research).

**6. Research Unlocker**
- Script to unlock research in recommended order.
- Hardcode research names or fetch dynamically via API.

**7. Warehouse & Office Upgrader**
- Monitor warehouse capacity; auto-upgrade if near full.
- Upgrade offices as funds allow.

**8. Division Expansion**
- Script to expand divisions to all cities and buy warehouses.
- Hardcode city names or fetch via API.

### Best Practices

- **Minimize RAM Usage**: Only call API functions when necessary; batch actions.
- **Modular Scripts**: Break automation into small, focused scripts for easier debugging.
- **Error Handling**: Log errors, handle edge cases (e.g., full warehouses, insufficient funds).
- **Progressive Enhancement**: Start with manual scripts, add automation as you unlock more API features.
- **Testing**: Test scripts in-game; ensure they handle all cities/divisions and edge cases.

### Example Automation Flow

1. Expand division to all cities, buy warehouses.
2. Hire employees, assign jobs.
3. Set up Smart Supply and sell orders.
4. Monitor and upgrade warehouses/offices.
5. Unlock and apply research.
6. Automate product creation and pricing.
7. Issue dividends and manage shares.

---

## 5. Advanced Tips, Pitfalls, and Research Priorities

### Advanced Tips

**1. Maximize Production Multiplier Early**
- Expand to all cities and buy warehouses immediately for each new division.
- Fill warehouses with boost materials (e.g., Real Estate for Agriculture) for diminishing but significant returns.

**2. Use Smart Supply and Market-TA.I**
- Smart Supply automates input purchasing, reducing manual errors.
- Market-TA.I research sets optimal selling prices automatically, maximizing profit.

**3. Research Order Matters**
- Unlock Hi-Tech R&D Laboratory first in each division to access all other research.
- Prioritize profit-impacting research: Market-TA.I, Self-Correcting Assemblers, Drones, Overclock, uPgrade: Fulcrum (for product-based industries).

**4. Office and Warehouse Upgrades**
- Upgrade offices in multiples of 3 (6, 12, 30, etc.) for efficient job assignment.
- Monitor warehouse capacity; upgrade before overflow to avoid production stalls.

**5. Product Creation**
- For product-based industries, invest enough in design/marketing to ensure products sell.
- If products aren’t selling, discontinue and create new ones with higher investment.

**6. Dividend Strategy**
- Go public (IPO) when ready to issue dividends.
- Retain as many shares as possible for maximum personal profit.
- You can issue dividends before IPO in some game versions (check for bugs).

**7. Bribing Factions (BN3)**
- Use corp funds to bribe factions for reputation, especially for red pill unlock.
- Issue dividends to yourself for donation unlocks.

**8. Automation Scaling**
- As you unlock more API features, automate more actions.
- Batch API calls to minimize RAM usage.

---

### Common Pitfalls

- **Overfilling Warehouses**: Buying too many boost materials can fill warehouses, halting production. Always monitor capacity.
- **Underinvesting in Products**: Low investment in product creation can result in unsellable products. Discontinue and remake with higher investment.
- **Ignoring Research**: Failing to unlock key research (Market-TA.I, production upgrades) can severely limit profit.
- **Manual Micromanagement**: Manual management is error-prone and tedious; automate as soon as possible.
- **Neglecting Office Expansion**: Small offices limit employee count and research speed. Upgrade early and often.
- **Selling Shares Too Early**: Selling too many shares in early investment rounds reduces future dividend income.

---

### Troubleshooting Common Script Errors

- **`NS_ERROR: not enough funds`**: Your script is trying to buy something (like an upgrade or material) but your corporation lacks funds. *Fix*: Add `if (ns.corporation.getCorporation().funds > cost) { ... }` checks.
- **`function is not defined`**: You likely forgot to unlock the Corporation API. *Fix*: Go to the Corporation tab -> Management -> API and purchase access.
- **`Division not found`**: Check your capitalization! "agriculture" != "Agriculture".

### Research Priorities

**Recommended Unlock Order:**
1. **Hi-Tech R&D Laboratory** (unlocks all other research)
2. **uPgrade: Fulcrum** (product-based industries), **uPgrade: Capacity.I**
3. **Market-TA.I**, **uPgrade: Capacity.II**, **Self-Correcting Assemblers**
4. **Drones** (and sub-researches)
5. **Automatic Drug Administration**, **Overclock** (and sub-researches)
6. Everything else (as needed)

**Notes:**
- Market-TA.II is generally not needed; Market-TA.I suffices for auto-pricing.
- AutoBrew, AutoPartyManager, HRBuddy-Recruitment, and ad/charisma upgrades have minimal impact; skip unless you have excess funds.
- Research is division-specific; unlock in each division as needed.

---

## 6. References & Further Reading

### Top Guides & Resources
- [RadicalZephyr/bitburner-corporation-guide (GitHub)](https://github.com/RadicalZephyr/bitburner-corporation-guide)  
  [Rendered Book](https://zefira.dev/bitburner-corporation-guide/)
- [Corporation Quick Guide (Reddit)](https://www.reddit.com/r/Bitburner/comments/ss609n/corporation_quick_guide_v140/)
- [Bitburner Official Documentation](https://github.com/bitburner-official/bitburner-src)
- [Bitburner Discord](https://discord.gg/bitburner) (active community, script sharing, Q&A)

### Example Script Repositories
- [jeek/octopus (GitHub)](https://github.com/jeek/octopus) – Example corporation automation script
- [stoltzld/bitburner-corporate-fiddling (GitHub)](https://github.com/stoltzld/bitburner-corporate-fiddling) – Growth testing scripts

### Community Tips & Walkthroughs
- [BN3 Corps became a ton of fun once I stopped following outdated guides (Reddit)](https://www.reddit.com/r/Bitburner/comments/17tgqyo/bn3_corps_became_a_ton_of_fun_once_i_stopped/)
- [Easy Corporation Guide (Reddit)](https://www.reddit.com/r/Bitburner/comments/sy7poo/easy_corporation_guide/)

### API Reference
- [Bitburner Corporation API Docs](https://github.com/bitburner-official/bitburner-src/tree/v2.8.1/src/Corporation)

---

# End of Guide

This guide is a living document. For the latest strategies and automation scripts, check the referenced guides and join the Bitburner Discord for community support.
