import { NS } from "@ns";


const CONFIG = {
    // Thresholds
    SHOCK_RECOVERY_THRESHOLD: 0,
    SYNC_TARGET: 100,
}

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    const numberOfSleeves = ns.sleeve.getNumSleeves();
    for (let i = 0; i < numberOfSleeves; i++) {
        manageSleeve(ns, i);
    }
}

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

    if (sleeve.city != "Volhaven") {
        ns.sleeve.travel(sleeveIndex, "Volhaven");
    }
    ns.sleeve.setToUniversityCourse(sleeveIndex, "ZB Institute of Technology", "Algorithms");
}