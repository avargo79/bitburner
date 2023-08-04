import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");

	const numberOfSleeves = 8;
	for (let i = 0; i < numberOfSleeves; i++) {
		const sleeve = ns.sleeve.getSleeve(i);
		if (sleeve.city != "Volhaven") {
			ns.sleeve.travel(i, "Volhaven");
		}
		ns.sleeve.setToUniversityCourse(i, "ZB Institute of Technology", "Algorithms");
	}
}
