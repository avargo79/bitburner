import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");

	let factions = ns.getPlayer().factions;
	if (ns.gang.inGang()) {
		factions = factions.filter((f) => f != ns.gang.getGangInformation().faction);
	}
	const numberOfSleeves = 8;
	for (let i = 0; i < numberOfSleeves; i++) {
		if (factions.length == 0) continue;

		ns.sleeve.setToFactionWork(i, <string>factions.pop(), "hacking");
	}
}
