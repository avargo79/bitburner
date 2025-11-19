import { NS } from "@ns";

type CrimeName = Parameters<NS["sleeve"]["setToCommitCrime"]>[1];

const CONFIG = {
    // Thresholds
    SHOCK_RECOVERY_THRESHOLD: 0,
    SYNC_TARGET: 100,
};

const argsSchema: [string, string | number | boolean][] = [
    ["min-chance", 0.55],
    ["goal", "money"], // money | karma | hybrid
    ["prefer-homicide", true],
    ["homicide-chance", 0.6],
    ["debug", false],
];

const CRIME_TYPES: CrimeName[] = [
    "Shoplift",
    "Rob Store",
    "Mug",
    "Larceny",
    "Deal Drugs",
    "Bond Forgery",
    "Traffick Arms",
    "Homicide",
    "Grand Theft Auto",
    "Kidnap",
    "Assassination",
    "Heist",
];

const HOMICIDE: CrimeName = "Homicide";
const DEFAULT_CRIME: CrimeName = "Mug";

type CrimeGoal = "money" | "karma" | "hybrid";

interface RuntimeOptions {
    goal: CrimeGoal;
    minChance: number;
    preferHomicide: boolean;
    homicideChance: number;
    debug: boolean;
    hasFormulas: boolean;
}

type SleeveInfo = ReturnType<NS["sleeve"]["getSleeve"]>;

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    const flags = ns.flags(argsSchema);
    const goal = normalizeGoal(flags.goal as string);
    const minChance = clampNumber(Number(flags["min-chance"]), 0, 1);
    const options: RuntimeOptions = {
        goal,
        minChance,
        preferHomicide: Boolean(flags["prefer-homicide"]),
        homicideChance: clampNumber(Number(flags["homicide-chance"]), 0, 1),
        debug: Boolean(flags.debug),
        hasFormulas: hasFormulaAccess(ns),
    };

    if (!options.hasFormulas) {
        ns.print("Formulas.exe not detected. Falling back to simplified crime selection.");
    }

    const numberOfSleeves = ns.sleeve.getNumSleeves();
    for (let i = 0; i < numberOfSleeves; i++) {
        manageSleeve(ns, i, options);
    }
}

function normalizeGoal(raw: string): CrimeGoal {
    switch (raw?.toLowerCase()) {
        case "karma":
            return "karma";
        case "hybrid":
        case "balanced":
            return "hybrid";
        default:
            return "money";
    }
}

function clampNumber(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
}

function hasFormulaAccess(ns: NS): boolean {
    return ns.fileExists("Formulas.exe", "home");
}

function manageSleeve(ns: NS, sleeveIndex: number, options: RuntimeOptions): void {
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

    const bestCrime = pickCrime(ns, sleeve, options);
    if (!bestCrime) {
        ns.print(`Sleeve ${sleeveIndex}: No crime met thresholds, defaulting to Homicide`);
        ns.sleeve.setToCommitCrime(sleeveIndex, HOMICIDE);
        return;
    }

    const currentTask = ns.sleeve.getTask(sleeveIndex);
    if (currentTask?.type === "CRIME" && currentTask.crimeType === bestCrime) {
        return;
    }

    const success = ns.sleeve.setToCommitCrime(sleeveIndex, bestCrime);
    if (!success) {
        ns.print(`Sleeve ${sleeveIndex}: Failed to start ${bestCrime}`);
        return;
    }

    if (options.debug) {
        ns.print(`Sleeve ${sleeveIndex}: Assigned ${bestCrime}`);
    }
}

function pickCrime(ns: NS, sleeve: SleeveInfo, options: RuntimeOptions): CrimeName | null {
    if (!options.hasFormulas || !ns.formulas?.work) {
        // Without formulas the player chance is a poor proxy, keep deterministic behavior.
        return options.preferHomicide ? HOMICIDE : DEFAULT_CRIME;
    }

    if (options.preferHomicide) {
        const homicideChance = ns.formulas.work.crimeSuccessChance(sleeve, HOMICIDE);
        if (homicideChance >= options.homicideChance) {
            return HOMICIDE;
        }
    }

    let bestCrime: CrimeName | null = null;
    let bestScore = -Infinity;
    for (const crime of CRIME_TYPES) {
        const chance = ns.formulas.work.crimeSuccessChance(sleeve, crime);
        if (chance < options.minChance) {
            continue;
        }

        const stats = ns.singularity.getCrimeStats(crime);
        const seconds = stats.time / 1000;
        const moneyPerSec = (stats.money * chance) / seconds;
        const karmaPerSec = (Math.abs(stats.karma) * chance) / seconds;

        let score = moneyPerSec;
        if (options.goal === "karma") {
            score = karmaPerSec;
        } else if (options.goal === "hybrid") {
            score = moneyPerSec * 0.7 + karmaPerSec * 0.3;
        }

        if (score > bestScore) {
            bestScore = score;
            bestCrime = crime;
        }
    }

    if (bestCrime) {
        return bestCrime;
    }

    // If nothing met the threshold, fall back to the highest success chance crime.
    let fallbackCrime: CrimeName | null = null;
    let highestChance = -Infinity;
    for (const crime of CRIME_TYPES) {
        const chance = ns.formulas.work.crimeSuccessChance(sleeve, crime);
        if (chance > highestChance) {
            highestChance = chance;
            fallbackCrime = crime;
        }
    }

    return fallbackCrime;
}