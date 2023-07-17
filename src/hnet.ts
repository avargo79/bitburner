import { NS } from "@ns";
import { range } from "./utils";

export async function main(ns: NS) {
	let totalLevels = 0;

	while (totalLevels < 100) {
		const nodes = range(ns.hacknet.numNodes());
		totalLevels = nodes.reduce((a, b) => a + ns.hacknet.getNodeStats(b).level, 0);

		try {
			nodes.filter((n) => ns.hacknet.getNodeStats(n).level < 13).forEach((n) => ns.hacknet.upgradeLevel(n, 1));
		} catch {}

		if (nodes.length < 8) {
			ns.hacknet.purchaseNode();
		}

		await ns.sleep(1);
	}
}
