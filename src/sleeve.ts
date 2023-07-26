import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");

	ns.atExit(() => {
		for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
			const sleeve = ns.sleeve.getSleeve(i);
			if (sleeve.shock > 0) {
				ns.sleeve.setToShockRecovery(i);
				ns.print("Shock Recovery ", i);
				continue;
			}

			if (sleeve.sync < 100) {
				ns.sleeve.setToSynchronize(i);
				ns.print("Synchronize ", i);
				continue;
			}

			ns.sleeve.setToIdle(i);
		}
	});

	while (true) {
		ns.clearLog();
		for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
			const sleeve = ns.sleeve.getSleeve(i);
			const task = ns.sleeve.getTask(i);

			if (sleeve.shock > 0) {
				if (task?.type != "RECOVERY") ns.sleeve.setToShockRecovery(i);
				ns.print("Shock Recovery ", i);
				continue;
			} else if (sleeve.sync < 100) {
				if (task?.type != "SYNCHRO") ns.sleeve.setToSynchronize(i);
				ns.print("Synchronize ", i);
				continue;
			}

			// if (task?.type != "CRIME") ns.sleeve.setToCommitCrime(i, "Larceny");
			// continue;

			const lowestStat = Math.min(sleeve.skills.strength, sleeve.skills.defense, sleeve.skills.dexterity, sleeve.skills.agility, sleeve.skills.charisma);
			if (lowestStat == sleeve.skills.hacking) {
				ns.sleeve.setToUniversityCourse(i, "Rothman University", "Study Computer Science");
				ns.print("Training Hacking ", i);
			} else if (lowestStat == sleeve.skills.strength) {
				ns.sleeve.setToGymWorkout(i, "Powerhouse Gym", "Strength");
				ns.print("Training Strength ", i);
			} else if (lowestStat == sleeve.skills.defense) {
				ns.sleeve.setToGymWorkout(i, "Powerhouse Gym", "Defense");
				ns.print("Training Defense ", i);
			} else if (lowestStat == sleeve.skills.dexterity) {
				ns.sleeve.setToGymWorkout(i, "Powerhouse Gym", "Dexterity");
				ns.print("Training Dexterity ", i);
			} else if (lowestStat == sleeve.skills.agility) {
				ns.sleeve.setToGymWorkout(i, "Powerhouse Gym", "Agility");
				ns.print("Training Agility ", i);
			} else if (lowestStat == sleeve.skills.charisma) {
				ns.sleeve.setToUniversityCourse(i, "Rothman University", "Leadership");
				ns.print("Training Charisma ", i);
			}
		}
		await ns.sleep(10);
	}
}
