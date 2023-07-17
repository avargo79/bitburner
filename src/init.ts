import { NS } from "@ns";

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");

	const currentRam = ns.getServerMaxRam("home");

	ns.run("root.js");
	await ns.sleep(10);

	ns.run("hnet.js");
	ns.run("pserver.js");

	if (currentRam < 32) {
		ns.run("hack.early.js", 1, "--tail", "--target", "n00dles");
	} else {
		ns.run("hack.hwgw.js", 1, "--tail", "--target", "n00dles");
	}
}
