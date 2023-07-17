import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	ns.disableLog("sleep");
	const target = ns.args[0] as string;
	const attack_type = ns.args[1] as string;
	const attack_time = (ns.args[2] as number) ?? performance.now();

	// const delay = Math.ceil(attack_time - performance.now());
	do {
		ns.clearLog();
		ns.print("Delaying: ", ns.tFormat(Math.ceil(attack_time - performance.now())));
		await ns.sleep(1);
	} while (Math.ceil(attack_time - performance.now()) > 0);

	switch (attack_type) {
		case "w":
			await ns.weaken(target);
			break;
		case "g":
			await ns.grow(target);
			break;
		case "h":
			await ns.hack(target);
			break;
		default:
			break;
	}
}
