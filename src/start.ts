import { NS } from "@ns";

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
        if (player.skills.strength < 50) {
            if (currentState != STATES.TRAINING_STRENGTH && ns.singularity.gymWorkout("Powerhouse Gym", "str")) {
                ns.tprint("Training Strength");
                currentState = STATES.TRAINING_STRENGTH
            }
        } else if (player.skills.defense < 20) {
            if (currentState != STATES.TRAINING_DEFENSE && ns.singularity.gymWorkout("Powerhouse Gym", "def")) {
                ns.tprint("Training Defense");
                currentState = STATES.TRAINING_DEFENSE
            }
        } else if (player.skills.dexterity < 20) {
            if (currentState != STATES.TRAINING_DEXTERITY && ns.singularity.gymWorkout("Powerhouse Gym", "dex")) {
                ns.tprint("Training Dexterity");
                currentState = STATES.TRAINING_DEXTERITY
            }
        } else if (player.skills.agility < 20) {
            if (currentState != STATES.TRAINING_AGILITY && ns.singularity.gymWorkout("Powerhouse Gym", "agi")) {
                ns.tprint("Training Agility");
                currentState = STATES.TRAINING_AGILITY
            }
        } else if (player.skills.hacking < 10) {
            if (currentState != STATES.STUDY && ns.singularity.universityCourse("Rothman University", "Computer Science")) {
                ns.tprint("Studying Hacking");
                currentState = STATES.STUDY
            }
        } else if (player.money < 200_000 && player.city == "Sector-12") {
            if (currentState != STATES.CRIME && ns.singularity.commitCrime("Mug")) {
                ns.tprint("Mugging for money until 200k");
                currentState = STATES.CRIME
            }
        } else if (player.money >= 200_000 && player.city != "Aevum") {
            if (currentState != STATES.TRAVEL_CASINO && ns.singularity.travelToCity("Aevum")) {
                ns.tprint("Traveling to Aevum to hit the casino");
                currentState = STATES.TRAVEL_CASINO
            }
        } else if (player.money >= 100_000 && player.city == "Aevum") {
            ns.tprint("Gambling at the casino until 10b");
            ns.spawn("casino-bot.js", 1);
            currentState = STATES.GAMBLING;
        }
        await ns.sleep(500);
    }

}
