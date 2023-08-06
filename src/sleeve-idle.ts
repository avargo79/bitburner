import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");

	const numberOfSleeves = 8;
	for (let i = 0; i < numberOfSleeves; i++) {
		ns.sleeve.setToIdle(i);
	}
}
