import { NS } from "@ns";
import { getBitnodeConfig, applyConfigOverrides, needsTraining, needsMoney } from "/lib/bitnode-config";
import { launchScripts, displayLaunchStatus } from "/lib/script-launcher";

enum STATES {
    START,
    TRAINING_STRENGTH,
    TRAINING_DEFENSE,
    TRAINING_DEXTERITY,
    TRAINING_AGILITY,
    TRAINING_HACKING,
    CRIME,
    TRAVEL_CASINO,
    GAMBLING,
    LAUNCHING_SCRIPTS,
}

/**
 * Optimized Start Script with Bitnode Detection
 * 
 * Automatically detects current bitnode and applies optimal progression strategy
 * Supports CLI arguments for customization
 */
export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    
    // Parse CLI arguments
    const args = ns.args;
    const dryRun = args.includes("--dry-run");
    const force = args.includes("--force");
    const skipTraining = args.includes("--skip-training");
    const skipMoney = args.includes("--skip-money");
    const verbose = args.includes("--verbose");
    
    // Get bitnode configuration with optional overrides
    let config = getBitnodeConfig(ns);
    if (args.length > 0) {
        config = applyConfigOverrides(config, args);
    }
    
    const player = ns.getPlayer();
    const bitnodeName = config.name;
    
    ns.tprint("=".repeat(60));
    ns.tprint(`STARTING AUTOMATION FOR ${bitnodeName.toUpperCase()}`);
    ns.tprint("=".repeat(60));
    ns.tprint(`Strategy: ${config.trainingStrategy} training, ${config.moneyStrategy} money`);
    ns.tprint(`Stat Targets: STR=${config.statTargets.str} DEF=${config.statTargets.def} DEX=${config.statTargets.dex} AGI=${config.statTargets.agi} HACK=${config.statTargets.hack}`);
    ns.tprint(`Money Target: $${(config.moneyTarget / 1e9).toFixed(2)}b`);
    if (config.specialInstructions) {
        ns.tprint(`Note: ${config.specialInstructions}`);
    }
    ns.tprint("=".repeat(60));
    
    let currentState = STATES.START as STATES;
    
    // Main progression loop
    while (true) {
        const player = ns.getPlayer();
        const trainingNeeds = needsTraining(ns, config);
        const moneyNeeded = needsMoney(ns, config);
        
        // Skip training if requested or strategy says to skip if high
        const shouldTrain = !skipTraining && 
            trainingNeeds.any && 
            (config.trainingStrategy !== 'skip-if-high' || currentState === STATES.START);
        
        // PHASE 1: Stat Training
        if (shouldTrain) {
            // Train strength
            if (trainingNeeds.str && player.skills.strength < config.statTargets.str) {
                if (currentState != STATES.TRAINING_STRENGTH) {
                    if (verbose) ns.tprint(`Training Strength (${player.skills.strength}/${config.statTargets.str})`);
                    currentState = STATES.TRAINING_STRENGTH;
                }
                if (ns.singularity) {
                    ns.singularity.gymWorkout("Powerhouse Gym", "str");
                }
            }
            // Train defense
            else if (trainingNeeds.def && player.skills.defense < config.statTargets.def) {
                if (currentState != STATES.TRAINING_DEFENSE) {
                    if (verbose) ns.tprint(`Training Defense (${player.skills.defense}/${config.statTargets.def})`);
                    currentState = STATES.TRAINING_DEFENSE;
                }
                if (ns.singularity) {
                    ns.singularity.gymWorkout("Powerhouse Gym", "def");
                }
            }
            // Train dexterity
            else if (trainingNeeds.dex && player.skills.dexterity < config.statTargets.dex) {
                if (currentState != STATES.TRAINING_DEXTERITY) {
                    if (verbose) ns.tprint(`Training Dexterity (${player.skills.dexterity}/${config.statTargets.dex})`);
                    currentState = STATES.TRAINING_DEXTERITY;
                }
                if (ns.singularity) {
                    ns.singularity.gymWorkout("Powerhouse Gym", "dex");
                }
            }
            // Train agility
            else if (trainingNeeds.agi && player.skills.agility < config.statTargets.agi) {
                if (currentState != STATES.TRAINING_AGILITY) {
                    if (verbose) ns.tprint(`Training Agility (${player.skills.agility}/${config.statTargets.agi})`);
                    currentState = STATES.TRAINING_AGILITY;
                }
                if (ns.singularity) {
                    ns.singularity.gymWorkout("Powerhouse Gym", "agi");
                }
            }
            // Train hacking
            else if (trainingNeeds.hack && player.skills.hacking < config.statTargets.hack) {
                if (currentState != STATES.TRAINING_HACKING) {
                    if (verbose) ns.tprint(`Training Hacking (${player.skills.hacking}/${config.statTargets.hack})`);
                    currentState = STATES.TRAINING_HACKING;
                }
                if (ns.singularity) {
                    ns.singularity.universityCourse("Rothman University", "Computer Science");
                }
            }
        }
        // PHASE 2: Money Generation
        else if (!skipMoney && moneyNeeded) {
            const moneyFormatted = `$${(player.money / 1e9).toFixed(2)}b / $${(config.moneyTarget / 1e9).toFixed(2)}b`;
            
            if (config.moneyStrategy === 'casino') {
                // BN4-style casino strategy
                if (player.money < 200_000 && player.city === "Sector-12") {
                    if (currentState !== STATES.CRIME) {
                        ns.tprint(`Mugging for initial casino funds (${moneyFormatted})`);
                        currentState = STATES.CRIME;
                    }
                    if (ns.singularity) {
                        ns.singularity.commitCrime("Mug");
                    }
                } else if (player.money >= 200_000 && player.city !== "Aevum") {
                    if (currentState !== STATES.TRAVEL_CASINO) {
                        ns.tprint("Traveling to Aevum for casino");
                        currentState = STATES.TRAVEL_CASINO;
                    }
                    if (ns.singularity) {
                        ns.singularity.travelToCity("Aevum");
                    }
                } else if (player.city === "Aevum" && player.money < config.moneyTarget) {
                    if (currentState !== STATES.GAMBLING) {
                        ns.tprint(`Starting casino bot (${moneyFormatted})`);
                        currentState = STATES.GAMBLING;
                        if (!dryRun) {
                            ns.exec("casino-bot.js", "home", 1);
                        }
                    }
                }
            } else if (config.moneyStrategy === 'crime') {
                // Crime-based money generation
                if (currentState !== STATES.CRIME) {
                    ns.tprint(`Grinding crime for money (${moneyFormatted})`);
                    currentState = STATES.CRIME;
                }
                if (ns.singularity) {
                    ns.singularity.commitCrime("Mug");
                }
            } else if (config.moneyStrategy === 'hacking') {
                // Skip to launching scripts (botnet will handle money)
                ns.tprint("Skipping money phase - botnet will generate income");
                currentState = STATES.LAUNCHING_SCRIPTS;
            }
        }
        // PHASE 3: Launch Scripts
        else {
            if (currentState !== STATES.LAUNCHING_SCRIPTS) {
                ns.tprint("\nAll prerequisites met! Launching automation scripts...\n");
                currentState = STATES.LAUNCHING_SCRIPTS;
                
                // Stop any active activities
                if (ns.singularity) {
                    ns.singularity.stopAction();
                }
                
                // Launch scripts with priority-based launcher
                const statuses = await launchScripts(ns, config, { dryRun, force });
                
                // Display results
                displayLaunchStatus(ns, statuses);
                
                // Report completion
                const running = statuses.filter(s => s.status === 'running').length;
                const skipped = statuses.filter(s => s.status === 'skipped').length;
                
                ns.tprint(`\n✓ Startup complete: ${running} scripts running, ${skipped} skipped`);
                
                if (dryRun) {
                    ns.tprint("\nDRY RUN MODE - No scripts were actually launched");
                }
            }
            
            // Exit the loop
            break;
        }
        
        await ns.sleep(500);
    }
}
