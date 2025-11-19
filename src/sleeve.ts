import { NS } from "@ns";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Thresholds
    SHOCK_RECOVERY_THRESHOLD: 0,
    SYNC_TARGET: 100,

    // Stat training phases
    GYM_TRAINING_MIN: 10,            // Use gym until stats reach this, then switch to crimes
    CRIME_TRAINING_MAX: 50,          // Use crimes until this level, then back to gym
    MIN_CRIME_STATS: 20,            // Minimum stats before karma grinding
    AUG_PURCHASE_THRESHOLD: 40,     // Train stats to this level before buying augs

    // Karma and gang
    GANG_REQUIRED_KARMA: -54000,

    // Augmentation purchasing
    AUG_SAFETY_MULTIPLIER: 3,        // Only buy if cost * 3 < available money

    // Faction work
    FACTION_WORK_MIN_STATS: 150,     // Start faction work at this stat level
    PREFERRED_FACTIONS: ["Slum Snakes", "The Syndicate", "Sector-12", "Netburners"],

    // Cities and locations
    HOME_CITY: "Sector-12",
    GYM: "Powerhouse Gym",
    UNIVERSITY: "Rothman University",

    // Loop timing
    LOOP_DELAY: 1000,
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

enum SleeveActivity {
    SHOCK_RECOVERY = "SHOCK_RECOVERY",
    SYNC = "SYNCHRO",
    CRIME = "CRIME",
    GYM = "CLASS",
    UNIVERSITY = "CLASS",
    FACTION = "FACTION",
    IDLE = "IDLE",
}

interface SleeveStats {
    hacking: number;
    strength: number;
    defense: number;
    dexterity: number;
    agility: number;
    charisma: number;
}

/**
 * Determine which faction (if any) the player has an active gang with
 * so we can avoid assigning sleeves to work for it (which causes runtime errors).
 */
function getGangFaction(ns: NS): string | null {
    try {
        if (ns.gang && ns.gang.inGang()) {
            return ns.gang.getGangInformation().faction;
        }
    } catch (_error) {
        // Gang API unavailable (missing Source-File 2), ignore gracefully.
    }

    return null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the lowest stat from a sleeve's skills
 */
function getLowestStat(skills: SleeveStats): number {
    return Math.min(
        skills.hacking,
        skills.charisma,
        skills.strength,
        skills.defense,
        skills.dexterity,
        skills.agility
    );
}

/**
 * Identify which stat is the lowest
 */
function identifyLowestStatName(skills: SleeveStats): keyof SleeveStats {
    const lowest = getLowestStat(skills);
    // Check in priority order: combat stats first, then social/mental
    if (skills.agility === lowest) return "agility";
    if (skills.defense === lowest) return "defense";
    if (skills.dexterity === lowest) return "dexterity";
    if (skills.strength === lowest) return "strength";
    if (skills.charisma === lowest) return "charisma";
    if (skills.hacking === lowest) return "hacking";
    return "agility"; // Fallback to agility
}

/**
 * Check if sleeve should use gym training (very early game)
 */
function shouldUseGymTraining(lowestStat: number): boolean {
    return lowestStat < CONFIG.GYM_TRAINING_MIN;
}

/**
 * Check if sleeve should do crime-based training (early-mid game)
 */
function shouldDoCrimeTraining(lowestStat: number): boolean {
    return lowestStat >= CONFIG.GYM_TRAINING_MIN && lowestStat < CONFIG.CRIME_TRAINING_MAX;
}

/**
 * Check if sleeve should grind karma for gang unlock
 */
function shouldGrindKarma(ns: NS, lowestStat: number): boolean {
    return (
        ns.getResetInfo().currentNode !== 2 &&
        lowestStat >= CONFIG.MIN_CRIME_STATS &&
        ns.heart.break() > CONFIG.GANG_REQUIRED_KARMA
    );
}

/**
 * Try to purchase augmentations for a sleeve
 */
function tryPurchaseAugmentations(ns: NS, sleeveIndex: number, lowestStat: number): boolean {
    if (lowestStat < CONFIG.AUG_PURCHASE_THRESHOLD) {
        ns.print(`Sleeve ${sleeveIndex}: Not buying augs (lowest stat ${lowestStat} < ${CONFIG.AUG_PURCHASE_THRESHOLD})`);
        return false;
    }

    const augs = ns.sleeve.getSleevePurchasableAugs(sleeveIndex);
    if (augs.length === 0) {
        ns.print(`Sleeve ${sleeveIndex}: No augmentations available to purchase`);
        return false;
    }

    // Sort by cost (cheapest first)
    augs.sort((a, b) => a.cost - b.cost);

    const availableMoney = ns.getServerMoneyAvailable("home");
    const affordableAug = augs[0];
    const requiredMoney = affordableAug.cost * CONFIG.AUG_SAFETY_MULTIPLIER;

    if (requiredMoney < availableMoney) {
        const success = ns.sleeve.purchaseSleeveAug(sleeveIndex, affordableAug.name);
        if (success) {
            ns.print(`✓ Sleeve ${sleeveIndex}: Purchased ${affordableAug.name} for ${ns.formatNumber(affordableAug.cost)}`);
            return true;
        } else {
            ns.print(`✗ Sleeve ${sleeveIndex}: Failed to purchase ${affordableAug.name}`);
        }
    } else {
        ns.print(`Sleeve ${sleeveIndex}: Not buying ${affordableAug.name} (need ${ns.formatNumber(requiredMoney)} have ${ns.formatNumber(availableMoney)})`);
    }

    return false;
}

/**
 * Assign crime-based training (early game, free stat gains)
 */
function assignCrimeTraining(ns: NS, sleeveIndex: number, skills: SleeveStats): void {
    const currentTask = ns.sleeve.getTask(sleeveIndex);

    // Choose crime based on which stats need training
    if (skills.dexterity < CONFIG.CRIME_TRAINING_MAX || skills.agility < CONFIG.CRIME_TRAINING_MAX) {
        if (currentTask?.type !== SleeveActivity.CRIME || currentTask.crimeType !== "Shoplift") {
            ns.sleeve.setToCommitCrime(sleeveIndex, "Shoplift");
            ns.print(`Sleeve ${sleeveIndex}: Crime training (Shoplift)`);
        }
    } else {
        if (currentTask?.type !== SleeveActivity.CRIME || currentTask.crimeType !== "Mug") {
            ns.sleeve.setToCommitCrime(sleeveIndex, "Mug");
            ns.print(`Sleeve ${sleeveIndex}: Crime training (Mug)`);
        }
    }
}

/**
 * Assign karma grinding (homicide for gang unlock)
 */
function assignKarmaGrinding(ns: NS, sleeveIndex: number): void {
    const currentTask = ns.sleeve.getTask(sleeveIndex);
    if (currentTask?.type !== SleeveActivity.CRIME || currentTask.crimeType !== "Homicide") {
        ns.sleeve.setToCommitCrime(sleeveIndex, "Homicide");
        ns.print(`Sleeve ${sleeveIndex}: Grinding karma (Homicide)`);
    }
}

/**
 * Assign stat training via gym or university
 */
function assignStatTraining(ns: NS, sleeveIndex: number, skills: SleeveStats): void {
    const lowestStatName = identifyLowestStatName(skills);
    const lowestValue = getLowestStat(skills);
    const currentTask = ns.sleeve.getTask(sleeveIndex);

    ns.print(`Sleeve ${sleeveIndex} Stats - Hck:${skills.hacking} Str:${skills.strength} Def:${skills.defense} Dex:${skills.dexterity} Agi:${skills.agility} Cha:${skills.charisma} | Lowest: ${lowestStatName}(${lowestValue})`);

    // Only check if we're already doing the exact same task
    const isDoingTask = (type: string, classType: string) => {
        if (!currentTask || currentTask.type !== "CLASS") return false;
        return currentTask.classType === classType;
    };

    switch (lowestStatName) {
        case "strength":
            if (!isDoingTask(SleeveActivity.GYM, "str")) {
                ns.sleeve.setToGymWorkout(sleeveIndex, "Powerhouse Gym", "str");
                ns.print(`Sleeve ${sleeveIndex}: ✓ Training Strength`);
            }
            break;
        case "defense":
            if (!isDoingTask(SleeveActivity.GYM, "def")) {
                ns.sleeve.setToGymWorkout(sleeveIndex, "Powerhouse Gym", "def");
                ns.print(`Sleeve ${sleeveIndex}: ✓ Training Defense`);
            }
            break;
        case "dexterity":
            if (!isDoingTask(SleeveActivity.GYM, "dex")) {
                ns.sleeve.setToGymWorkout(sleeveIndex, "Powerhouse Gym", "dex");
                ns.print(`Sleeve ${sleeveIndex}: ✓ Training Dexterity`);
            }
            break;
        case "agility":
            if (!isDoingTask(SleeveActivity.GYM, "agi")) {
                ns.sleeve.setToGymWorkout(sleeveIndex, "Powerhouse Gym", "agi");
                ns.print(`Sleeve ${sleeveIndex}: ✓ Training Agility`);
            }
            break;
        case "charisma":
            if (!isDoingTask(SleeveActivity.UNIVERSITY, "Leadership")) {
                ns.sleeve.setToUniversityCourse(sleeveIndex, "Rothman University", "Leadership");
                ns.print(`Sleeve ${sleeveIndex}: ✓ Training Charisma`);
            }
            break;
        case "hacking":
            if (!isDoingTask(SleeveActivity.UNIVERSITY, "Algorithms")) {
                ns.sleeve.setToUniversityCourse(sleeveIndex, "Rothman University", "Algorithms");
                ns.print(`Sleeve ${sleeveIndex}: ✓ Training Hacking`);
            }
            break;
    }
}

/**
 * Try to assign faction work if stats are high enough
 */
function tryAssignFactionWork(ns: NS, sleeveIndex: number, lowestStat: number): boolean {
    if (lowestStat < CONFIG.FACTION_WORK_MIN_STATS) return false;
    const gangFaction = getGangFaction(ns);

    // Check for joined factions
    for (const faction of CONFIG.PREFERRED_FACTIONS) {
        if (gangFaction && faction === gangFaction) {
            continue; // Cannot work for factions that host our gang
        }
        if (ns.getPlayer().factions.includes(faction)) {
            const currentTask = ns.sleeve.getTask(sleeveIndex);
            if (currentTask?.type !== SleeveActivity.FACTION || currentTask.factionName !== faction) {
                try {
                    const success = ns.sleeve.setToFactionWork(sleeveIndex, faction, "hacking");
                    if (success) {
                        ns.print(`Sleeve ${sleeveIndex}: Working for ${faction}`);
                        return true;
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    if (message.includes("cannot work for faction")) {
                        ns.print(`Sleeve ${sleeveIndex}: Skipping ${faction} due to gang conflict`);
                        continue;
                    }
                    throw error;
                }
            } else {
                return true; // Already doing faction work
            }
        }
    }

    return false;
}

/**
 * Main sleeve management logic for a single sleeve
 */
function manageSleeve(ns: NS, sleeveIndex: number): void {
    const sleeve = ns.sleeve.getSleeve(sleeveIndex);

    // Priority 1: Shock recovery
    if (sleeve.shock > CONFIG.SHOCK_RECOVERY_THRESHOLD) {
        ns.sleeve.setToShockRecovery(sleeveIndex);
        ns.print(`Sleeve ${sleeveIndex}: Shock Recovery (${sleeve.shock.toFixed(1)}%)`);
        return;
    }

    // Priority 2: Sync to 100%
    if (sleeve.sync < CONFIG.SYNC_TARGET) {
        ns.sleeve.setToSynchronize(sleeveIndex);
        ns.print(`Sleeve ${sleeveIndex}: Synchronize (${sleeve.sync.toFixed(1)}%)`);
        return;
    }

    // Ensure sleeve is in correct city
    if (sleeve.city !== "Sector-12") {
        ns.sleeve.travel(sleeveIndex, "Sector-12");
    }

    const lowestStat = getLowestStat(sleeve.skills);

    // Try to buy augmentations if stats are high enough
    tryPurchaseAugmentations(ns, sleeveIndex, lowestStat);

    // Priority 3: Karma grinding (if needed for gang)
    if (shouldGrindKarma(ns, lowestStat)) {
        assignKarmaGrinding(ns, sleeveIndex);
        return;
    }

    // Priority 4: Faction work (if stats are high and player has joined factions)
    if (tryAssignFactionWork(ns, sleeveIndex, lowestStat)) {
        return;
    }

    // Priority 5: Gym training (very early game, stats < 10)
    if (shouldUseGymTraining(lowestStat)) {
        assignStatTraining(ns, sleeveIndex, sleeve.skills);
        return;
    }

    // Priority 6: Crime-based training (early-mid game, free stats)
    if (shouldDoCrimeTraining(lowestStat)) {
        assignCrimeTraining(ns, sleeveIndex, sleeve.skills);
        return;
    }

    // Priority 7: Gym/University stat training (high-level training)
    assignStatTraining(ns, sleeveIndex, sleeve.skills);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    // Set all sleeves to idle on script exit
    ns.atExit(() => {
        for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
            const sleeve = ns.sleeve.getSleeve(i);
            if (sleeve.shock > 0) {
                ns.sleeve.setToShockRecovery(i);
            } else if (sleeve.sync < 100) {
                ns.sleeve.setToSynchronize(i);
            } else {
                ns.sleeve.setToIdle(i);
            }
        }
    });

    // Main control loop
    while (true) {
        ns.clearLog();

        const numberOfSleeves = ns.sleeve.getNumSleeves();
        for (let i = 0; i < numberOfSleeves; i++) {
            manageSleeve(ns, i);
        }

        await ns.sleep(CONFIG.LOOP_DELAY);
    }
}