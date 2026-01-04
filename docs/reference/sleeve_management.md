# Sleeve Management Reference

Sleeves (unlocked in **BitNode-10**) are duplicates of the player that can perform tasks independently.

## Core Stats

### Shock (0-100)
- **Effect**: Reduces all stats and XP gain. 100 Shock = 0% effectiveness.
- **Recovery**:
  - `ns.sleeve.setToShockRecovery(sleeveNum)`: Fastest way.
  - Decreases over time naturally (very slow).
  - **Priority**: Reduce to 0 ASAP after every BitNode reset.

### Synchronization (0-100)
- **Effect**: Determines how much XP the sleeve shares with *you* (the main player).
- **Calculation**: Sleeve gains 100% XP. You gain `Sync%` of that XP.
- **Improvement**: `ns.sleeve.setToSynchronize(sleeveNum)`.

### Memory
- **Effect**: Determines starting Synchronization after a reset.
- **Upgrade**: Buy "Sleeve Memory" from a faction (The Covenant).

## Augmentations
- Sleeves can install augmentations just like the player.
- **Cost**: Same money cost, but usually no reputation requirement (!) if the player has unlocked it.
- **Strategy**: 
  - Install hacking augs on sleeves to boost their `Faction Work` (Hacking) speed.
  - Install combat augs for `Crime` or `Bladeburner` help.
- **Reset**: Installing an aug resets the Sleeve's stats to near zero (keeps XP multipliers).

## Tasks & API
- `ns.sleeve.setToCommitCrime(sleeveNum, "Homicide")`: Great for Karma farming.
- `ns.sleeve.setToFactionWork(sleeveNum, faction, "Hacking Contracts")`: Earns reputation for the player without occupying the player's time.
- `ns.sleeve.setToBladeburnerAction(sleeveNum, type, name)`: Requires BN7 API.

## Strategic Workflow
1. **Start of BN**: Set all to `Shock Recovery`.
2. **Shock < 95**: Set to `Commit Crime: Homicide` (if needed for Gangs) or `Mug`.
3. **Shock = 0**: 
   - Buy Augmentations (if cash allows).
   - Set to `Faction Work` to grind rep for hard factions (e.g., NiteSec, Black Hand) while you do other things.
