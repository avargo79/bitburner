import { NS } from "@ns";
import { formatMoney } from "./utils";

const CSEC_AUGS = ["Neurotrainer I", "Synaptic Enhancement Implant", "BitWire", "Cranial Signal Processors - Gen I", "Cranial Signal Processors - Gen II"];
const NITESEC_AUGS = [
	"Neural-Retention Enhancement",
	"BitWire",
	"Artificial Synaptic Potentiation",
	"DataJack",
	"Embedded Netburner Module",
	"Cranial Signal Processors - Gen I",
	"Cranial Signal Processors - Gen II",
	"Cranial Signal Processors - Gen III",
	"Neurotrainer II",
	"CRTX42-AA Gene Modification",
];
const BLACK_HAND_AUGS = [
	"The Black Hand",
	"Artificial Synaptic Potentiation",
	"Enhanced Myelin Sheathing",
	"DataJack",
	"Embedded Netburner Module",
	"Embedded Netburner Module Core Implant",
	"Neuralstimulator",
	"Cranial Signal Processors - Gen III",
	"Cranial Signal Processors - Gen IV",
];
const BIT_RUNNER_AUGS = [
	"Cranial Signal Processors - Gen V",
	"Artificial Bio-neural Network Implant",
	"Enhanced Myelin Sheathing",
	"DataJack",
	"Embedded Netburner Module",
	"Embedded Netburner Module Core Implant",
	"Embedded Netburner Module Core V2 Upgrade",
	"Neural Accelerator",
	"Cranial Signal Processors - Gen III",
	"Cranial Signal Processors - Gen IV",
	"Neurotrainer II",
	"BitRunners Neurolink",
];
const DAEDALUS_AUGS = [
	"The Red Pill",
	"Synthetic Heart",
	"Synfibril Muscle",
	"NEMEAN Subdermal Weave",
	"Embedded Netburner Module Core V3 Upgrade",
	"Embedded Netburner Module Analyze Engine",
	"Embedded Netburner Module Direct Memory Access Upgrade",
];

export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");
	let avail_augs: IAugmentation[] = [];

	do {
		// Wait for the player to be in New Tokyo
		// while (ns.getPlayer().city !== CityName.NewTokyo) {
		// 	ns.clearLog();
		// 	ns.print("Waiting for player to be in New Tokyo");
		// 	await ns.sleep(5000);
		// }

		// Get a list of augments to be installed
		avail_augs = getAugments(ns);
		avail_augs.sort((a, b) => a.time - b.time || a.cost - b.cost);

		// Remove the entrophy penalty
		if (avail_augs.some((a) => a.name == "nickofolas Congruity Implant")) {
			await graftAugmentation(ns, <IAugmentation>avail_augs.find((a) => a.name == "nickofolas Congruity Implant"));
			continue;
		}

		// Install any CyberSec augments
		if (avail_augs.some((a) => CSEC_AUGS.includes(a.name))) {
			await graftAugmentation(ns, <IAugmentation>avail_augs.find((a) => CSEC_AUGS.includes(a.name)));
			continue;
		}

		// Install any NiteSec augments
		if (avail_augs.some((a) => NITESEC_AUGS.includes(a.name))) {
			await graftAugmentation(ns, <IAugmentation>avail_augs.find((a) => NITESEC_AUGS.includes(a.name)));
			continue;
		}

		// Install any The Black Hand augments
		if (avail_augs.some((a) => BLACK_HAND_AUGS.includes(a.name))) {
			await graftAugmentation(ns, <IAugmentation>avail_augs.find((a) => BLACK_HAND_AUGS.includes(a.name)));
			continue;
		}

		// Install any BitRunners augments
		if (avail_augs.some((a) => BIT_RUNNER_AUGS.includes(a.name))) {
			await graftAugmentation(ns, <IAugmentation>avail_augs.find((a) => BIT_RUNNER_AUGS.includes(a.name)));
			continue;
		}

		// Install any Daedalus augments
		if (avail_augs.some((a) => DAEDALUS_AUGS.includes(a.name))) {
			await graftAugmentation(ns, <IAugmentation>avail_augs.find((a) => DAEDALUS_AUGS.includes(a.name)));
			continue;
		}

		// Install any remaining augments
		for (const aug of avail_augs) {
			await graftAugmentation(ns, aug);
			continue;
		}

		await ns.sleep(1000);
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

	const startedGrapting = ns.grafting.graftAugmentation(aug.name, false);
	const waitUntil = performance.now() + aug.time + 5000;
	while (startedGrapting && performance.now() < waitUntil) {
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
