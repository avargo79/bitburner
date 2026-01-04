# Gang Strategy Guide

Gangs are a powerful source of income and augmentations, unlocked in **BitNode-2** or by achieving -54,000 karma.

## Getting Started
- **Unlock**: Join "Slum Snakes" (easiest) or other criminal factions. Click "Create Gang".
- **BitNode-2**: You start with easy access.
- **Other Nodes**: Grind "Homicide" crime to lower karma quickly.

## Gang Types
1. **Combat Gangs** (Slum Snakes, Tetrads)
   - **Pros**: Higher potential income, territory warfare dominance.
   - **Cons**: Requires managing equipment and territory.
   - **Strategy**: Focus on STR/DEF/DEX/AGI.
2. **Hacking Gangs** (NiteSec, Black Hand)
   - **Pros**: Easter to automate, less equipment micromanagement.
   - **Cons**: Weaker in territory warfare.
   - **Strategy**: Focus on Hacking.

## Progression Roadmap

### Phase 1: Recruitment & Training
- **Goal**: Recruit all 12 members.
- **Action**: Set new members to "Train Combat" (or Hacking) until stats are ~100-200.
- **Member Names**: Name them logically (e.g., `Member-01`, `Member-02`) for easy scripting.

### Phase 2: Respect Grinding
- **Goal**: Unlock equipment and upgrades.
- **Action**: Set members to "Terrorism". It gives high Respect but 0 Money.
- **Why**: Higher Respect = Faster Recruitment + Higher Multipliers.

### Phase 3: Money & Ascension
- **Ascension**: Ascend a member when their multiplier gain is significant (e.g., >1.5x).
  - *Warning*: Resets stats to 1.
  - *Tip*: Ascend one member at a time to keep income stable.
- **Tasks**:
  - **Early Money**: "Mugging" / "Strongarm Civilians".
  - **Late Money**: "Human Trafficking" (Combat) or "Cyberterrorism" (Hacking).
  - **Wanted Level**: Keep it low! High wanted level penalizes income. Assign some members to "Vigilante Justice" if penalty > 10%.

### Phase 4: Territory Warfare
- **Power**: Determined by the sum of your active members' stats and equipment.
- **Clash**: Engaging in warfare gives a chance to steal territory.
- **Strategy**:
  1. Equip all members with weapons/armor.
  2. Set all members to "Territory Warfare".
  3. Wait until your win chance against other gangs is >60%.
  4. Enable "Territory Warfare" checkbox in the UI.

## Automation Logic
A basic gang script should:
1. **Recruit** if possible.
2. **Ascend** if multiplier gain > threshold (e.g., 1.2x) AND member count is sufficient.
3. **Equip** members with upgrades (start with cheapest).
4. **Task Assignment**:
   - If Wanted Penalty > 15% -> "Vigilante Justice".
   - Else if Respect < Threshold -> "Terrorism".
   - Else -> Best Money Making Task.
