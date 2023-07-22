import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");
	ns.clearLog();

	while (true) {
		for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
			const sleeve = ns.sleeve.getSleeve(i);
			const task = ns.sleeve.getTask(i);

			if (sleeve.shock > 0) {
				if (task?.type != "RECOVERY") ns.sleeve.setToShockRecovery(i);
				continue;
			} else if (sleeve.sync < 100) {
				if (task?.type != "SYNCHRO") ns.sleeve.setToSynchronize(i);
				continue;
			}

			if (sleeve.skills.hacking < 250 && sleeve.city == "Sector-12") {
				if (task?.type != "CLASS") ns.sleeve.setToUniversityCourse(i, "Rothman University", "Study Computer Science");
				continue;
			} else if (sleeve.skills.hacking < 250 && sleeve.city == "Volhaven") {
				if (task?.type != "CLASS") ns.sleeve.setToUniversityCourse(i, "ZB Institute of Technology", "Study Computer Science");
				continue;
			} else {
				if (task?.type != "FACTION") ns.sleeve.setToFactionWork(i, "Sector-12", "security");
				continue;
			}
		}
		await ns.sleep(10);
	}
}
