import { NS } from "@ns";
import { createAutomationWorkflows, createNavigator } from '/navigator';

enum STATES {
    START,
    TRAINING_STRENGTH,
    TRAINING_DEFENSE,
    TRAINING_DEXTERITY,
    TRAINING_AGILITY,
    CRIME,
    STUDY,
    TRAVEL_CASINO,
    GAMBLING,
}

export async function main(ns: NS): Promise<void> {
    let currentState = STATES.START as STATES;

    while (true) {
        const player = ns.getPlayer();

        if (!ns.hasTorRouter() && player.money >= 200000) {
            ns.singularity.purchaseTor();
        }
        // if(ns.fileExists("CR"))
        // if (player.skills.strength < 850) {
        //     if (currentState != STATES.TRAINING_STRENGTH && ns.singularity.gymWorkout("Powerhouse Gym", "str")) {
        //         ns.tprint("Training Strength");
        //         currentState = STATES.TRAINING_STRENGTH
        //     }
        // } else if (player.skills.defense < 850) {
        //     if (currentState != STATES.TRAINING_DEFENSE && ns.singularity.gymWorkout("Powerhouse Gym", "def")) {
        //         ns.tprint("Training Defense");
        //         currentState = STATES.TRAINING_DEFENSE
        //     }
        // } else if (player.skills.dexterity < 850) {
        //     if (currentState != STATES.TRAINING_DEXTERITY && ns.singularity.gymWorkout("Powerhouse Gym", "dex")) {
        //         ns.tprint("Training Dexterity");
        //         currentState = STATES.TRAINING_DEXTERITY
        //     }
        // } else if (player.skills.agility < 850) {
        //     if (currentState != STATES.TRAINING_AGILITY && ns.singularity.gymWorkout("Powerhouse Gym", "agi")) {
        //         ns.tprint("Training Agility");
        //         currentState = STATES.TRAINING_AGILITY
        //     }
        // } else if (player.skills.hacking < 10) {
        //     if (currentState != STATES.STUDY && ns.singularity.universityCourse("Rothman University", "Computer Science")) {
        //         ns.tprint("Studying Hacking");
        //         currentState = STATES.STUDY
        //     }
        // }

        await ns.sleep(500);
    }

    // const nav = createNavigator(true, ns);
    // const workflows = createAutomationWorkflows(nav);

    // // High-level automation
    // // await workflows.autoHacknet(1000000); // Spend $1M on hacknet
    // // await workflows.autoAugmentations(); // Install all purchased augmentations
    // // await workflows.autoTravel('New Tokyo'); // Travel to specific city
    // const scritps = await workflows.monitorActiveScripts(); // Get list of running scripts

    // for (const script of scritps) {
    //     ns.tprint(`Script: ${script}`);
    // }


    // study at university till 10 hacking skill
    // train at gym till 10 strength
    // train at gym till 10 defense
    // train at gym till 10 dexterity
    // train at gym till 10 agility
    // do mugging till 200,000 money
    // travel to aveum for casino
    // wait for 100,000 money
    // play black jack until 10,000,000,000 money
    // buy all programs from dark web
    // buy up to 64GB RAM home server
    // start the botnet
    // start the contract solver
    // start the server manager
    // wait for CSEC then backdoor it
    // do faction work for CyberSec until you can buy all augments
    // Join Tian Di Hui and get augments
    // wait for avmnite-02h then backdoor it
    // do faction work for NiteSec until you can buy all augments
    // wait for I.I.I.I then backdoor it
    // do faction work for The Black Hand until you can buy all augments
    // wait for run4theh111z then backdoor it
    // do faction work for BitRunners until you can buy all augments

    // get a job at Bachman & Associates until faction join
    // get a job at EXorp until faction join

    // await workflows.autoTrain(10, 10, 10, 10, 10, 10);
    // if (ns.hasTorRouter() && player.money >= 200000) {
    //     ns.singularity.purchaseTor();
    // }

}