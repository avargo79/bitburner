import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");

	ns.clearLog();
	for (let i = 0; i < 8; i++) {
		buyAugments(ns, i);
	}
}

function buyAugments(ns: NS, i: number) {
	const augs = ns.sleeve.getSleevePurchasableAugs(i);
	augs.sort((a, b) => a.cost - b.cost);
	for (const aug of augs) {
		if (aug.cost > ns.getServerMoneyAvailable("home")) break;
		ns.sleeve.purchaseSleeveAug(i, aug.name);
	}
}
