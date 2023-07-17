import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	const target = ns.args[0] as string;

	while (true) {
		if (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target) + 3) {
			await ns.weaken(target);
		} else if (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target)) {
			await ns.grow(target);
		} else {
			await ns.hack(target);
			break;
		}

		await ns.sleep(10);
	}
}
