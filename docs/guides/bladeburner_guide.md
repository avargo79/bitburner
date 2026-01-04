# Bladeburner Guide

Bladeburner is an endgame mechanic (unlocked in BN6/BN7) dealing with synthetic agents.

## Core Concepts
- **Stamina**: Actions cost stamina. If stamina < 50%, actions suffer massive penalties.
- **Chaos**: High city chaos reduces success rates. Reduce it with "Diplomacy".
- **Rank**: Unlocks harder contracts and "Black Ops".

## Actions Hierarchy
1. **General**:
   - `Training`: Builds stats (Gym/Hyperbolic better later).
   - `Field Analysis`: Improves success chance estimates.
   - `Diplomacy`: Lowers city chaos.
   - `Recruitment`: Passive team building (not fully implemented in all versions).
2. **Contracts**: Quick tasks (Tracking, Bounty Hunter). Good for early Rank.
3. **Operations**: Longer tasks (Assassination, Raid). Better rewards.
4. **Black Ops**: Unique milestones. Completing these unlocks the next BitNode tier (in BN7).

## Skill Tree Priority
1. **Blade's Intuition**: Success chance (Always good).
2. **Digital Observer**: Success chance in Operations.
3. **Overclock**: Decreases time taken (Critical for speed).
4. **Hyperdrive**: XP gain.
5. **Reaper / Evasive System**: Combat stats effective boost.

> [!TIP]
> **Stamina Management**: Don't let it drop! `Hyperbolic Regeneration Chamber` skill helps, but resting is often needed.

## Automation Algorithm
A script should loop continuously:
1. **Check Health/Stamina**: If low, switch to "Hyperbolic Regeneration Chamber" or "Field Analysis".
2. **Check Chaos**: If > 50, do "Diplomacy".
3. **Check Black Ops**: If success chance > 95%, attempt Black Op.
4. **Choose Action**:
   - Pick the highest-tier Contract/Operation where Success Chance > 90%.
   - Estimate profit/second or rep/second.
5. **Bonus Time**: If you have it, actions are 5x faster. Essential for endgame grinding.

## API Notes
- Requires `ns.bladeburner` (Cost: 4GB).
- Functions like `getActionEstimatedSuccessChance()` are expensive.
- Use `ns.bladeburner.nextUpdate()` to synchronize with the game tick.
