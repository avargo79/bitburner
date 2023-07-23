import { NS } from "@ns";
import { formatMoney } from "./utils";

export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");
	let avail_augs: IAugmentation[] = [];

	do {
		avail_augs = getAugments(ns);
		avail_augs.sort((a, b) => a.cost - b.cost || a.cost - b.cost);

		if (avail_augs.some((a) => a.name == "nickofolas Congruity Implant")) {
			await graftAugmentation(ns, <IAugmentation>avail_augs.find((a) => a.name == "nickofolas Congruity Implant"));
			continue;
		} else if (avail_augs.some((a) => a.name == "Neuroreceptor Management Implant")) {
			await graftAugmentation(ns, <IAugmentation>avail_augs.find((a) => a.name == "Neuroreceptor Management Implant"));
			continue;
		}

		for (const aug of avail_augs) {
			await graftAugmentation(ns, aug);
		}
	} while (avail_augs.length > 0);
}

function getAugments(ns: NS): IAugmentation[] {
	return ns.grafting.getGraftableAugmentations().map((name) => ({
		name,
		cost: ns.grafting.getAugmentationGraftPrice(name),
		time: ns.grafting.getAugmentationGraftTime(name),
	}));
}

async function graftAugmentation(ns: NS, aug: IAugmentation) {
	while (ns.getServerMoneyAvailable("home") < aug.cost) {
		ns.clearLog();
		ns.print("Grafting: ", aug.name);
		ns.print("Cost: ", formatMoney(ns.getServerMoneyAvailable("home")), " / ", formatMoney(aug.cost));
		await ns.sleep(10);
	}

	ns.grafting.graftAugmentation(aug.name, false);
	const waitUntil = performance.now() + aug.time + 5000;
	while (performance.now() < waitUntil) {
		ns.clearLog();
		ns.print("Grafting: ", aug.name);
		ns.print("Remaining: ", ns.tFormat(waitUntil - performance.now()));
		await ns.sleep(1000);
	}
}

interface IAugmentation {
	name: string;
	cost: number;
	time: number;
}
