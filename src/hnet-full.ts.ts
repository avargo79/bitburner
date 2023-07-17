import { NS } from "@ns";
import BasePlayer from "./player";

export async function main(ns: NS): Promise<void> {
	const player = new BasePlayer(ns, "player");
	let runtime: number = ns.args[0] as number;
	if (runtime) {
		runtime *= 1000;
	} else {
		runtime = 100000000;
	}

	const getProd = (level: number, ram: number, cores: number) => level * 1.5 * Math.pow(1.035, ram - 1) * ((cores + 5) / 6);

	const start_time = new Date().valueOf(); // 16347472346

	let time = new Date().valueOf();
	ns.tprint(time);
	while (time < start_time + runtime) {
		time = new Date().valueOf();

		if (!ns.hacknet.numNodes()) {
			while (player.money < ns.hacknet.getPurchaseNodeCost()) {
				await ns.sleep(1);
			}
			ns.hacknet.purchaseNode();
		}

		const currentNodeStats = [];

		const nodeValue = getProd(10, 1, 1) * player.hnet.multipliers.production;
		const nodeCost = ns.hacknet.getPurchaseNodeCost();

		currentNodeStats.push({
			value: nodeValue,
			cost: nodeCost,
			ratio: nodeValue / nodeCost,
			type: "node",
		});

		for (let idx = 0; idx < ns.hacknet.numNodes(); idx++) {
			const { level, ram, cores, production } = ns.hacknet.getNodeStats(idx);

			const levelCost = ns.hacknet.getLevelUpgradeCost(idx, 1);
			const ramCost = ns.hacknet.getRamUpgradeCost(idx, 1);
			const coreCost = ns.hacknet.getCoreUpgradeCost(idx, 1);

			const levelValue = getProd(level + 1, ram, cores) * player.hnet.multipliers.production - production;
			const ramValue = getProd(level, ram + 1, cores) * player.hnet.multipliers.production - production;
			const coreValue = getProd(level, ram, cores + 1) * player.hnet.multipliers.production - production;

			currentNodeStats.push(
				{
					value: levelValue,
					cost: levelCost,
					ratio: levelValue / levelCost,
					index: idx,
					type: "level",
				},
				{
					value: ramValue,
					cost: ramCost,
					ratio: ramValue / ramCost,
					index: idx,
					type: "ram",
				},
				{
					value: coreValue,
					cost: coreCost,
					ratio: coreValue / coreCost,
					index: idx,
					type: "core",
				}
			);
		}

		currentNodeStats.sort((a, b) => b.ratio - a.ratio);
		const bestUpgrade = currentNodeStats[0];
		while (player.money < bestUpgrade.cost) {
			await ns.sleep(1);
		}
		switch (bestUpgrade.type) {
			case "level":
				ns.hacknet.upgradeLevel(<number>bestUpgrade.index, 1);
				break;
			case "ram":
				ns.hacknet.upgradeRam(<number>bestUpgrade.index, 1);
				break;
			case "core":
				ns.hacknet.upgradeCore(<number>bestUpgrade.index, 1);
				break;
			case "node":
				ns.hacknet.purchaseNode();
				break;
		}

		await ns.sleep(1);
	}
}
