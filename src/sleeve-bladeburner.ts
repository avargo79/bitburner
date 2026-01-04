import { NS } from "@ns";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    SHOCK_RECOVERY_THRESHOLD: 0,
    SYNC_TARGET: 100,
    LOOP_DELAY: 10000, // Check every 10 seconds
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Set all sleeves to support main sleeve in Bladeburner
 */
export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    ns.disableLog("sleep");

    // Check if player has access to Bladeburner
    try {
        if (!ns.bladeburner.inBladeburner()) {
            ns.tprint("ERROR: Player is not in Bladeburner. Cannot assign sleeves.");
            return;
        }
    } catch (error) {
        ns.tprint("ERROR: Bladeburner API not available. Need Source-File 7.");
        return;
    }

    ns.tprint("Starting Bladeburner sleeve support...");

    // Set all sleeves to idle on script exit
    ns.atExit(() => {
        for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
            ns.sleeve.setToIdle(i);
        }
    });

    // Main control loop
    while (true) {
        ns.clearLog();

        const numberOfSleeves = ns.sleeve.getNumSleeves();
        for (let i = 0; i < numberOfSleeves; i++) {
            const sleeve = ns.sleeve.getSleeve(i);

            // Priority 1: Shock recovery
            if (sleeve.shock > CONFIG.SHOCK_RECOVERY_THRESHOLD) {
                ns.sleeve.setToShockRecovery(i);
                ns.print(`Sleeve ${i}: Shock Recovery (${sleeve.shock.toFixed(1)}%)`);
                continue;
            }

            // Priority 2: Sync to 100%
            if (sleeve.sync < CONFIG.SYNC_TARGET) {
                ns.sleeve.setToSynchronize(i);
                ns.print(`Sleeve ${i}: Synchronize (${sleeve.sync.toFixed(1)}%)`);
                continue;
            }

            // Priority 3: Support main sleeve in Bladeburner
            const currentTask = ns.sleeve.getTask(i);
            if (currentTask?.type !== "BLADEBURNER" || currentTask.actionType !== "General" || currentTask.actionName !== "Support main sleeve") {
                const success = ns.sleeve.setToBladeburnerAction(i, "Support main sleeve");
                if (success) {
                    ns.print(`Sleeve ${i}: ✓ Supporting main sleeve in Bladeburner`);
                } else {
                    ns.print(`Sleeve ${i}: ✗ Failed to set Bladeburner support`);
                }
            } else {
                ns.print(`Sleeve ${i}: Supporting main sleeve`);
            }
        }

        await ns.sleep(CONFIG.LOOP_DELAY);
    }
}
