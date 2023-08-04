import { NS } from "@ns";

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");

	const currentRam = ns.getServerMaxRam("home");

	ns.run("root.js");
	await ns.sleep(10);

	ns.run("hnet.js");

	if (currentRam < 64) {
		// const pid = ns.run("hack.early.js", 1, "--target", "n00dles");
		// ns.tail(pid);
		ns.run("pserver.js");
	} else {
		// const pid = ns.run("hack.hwgw.js", 1, "--target", "n00dles");
		// ns.tail(pid);
		// ns.run("pserver.js", 1, "--max-power", "21");
		ns.run("pserver.js");
		ns.run("gang.js");
		ns.run("sleeve.js");
	}
}
