import { NS } from "@ns";
import BaseServer from "./server";
import BasePlayer from "./player";

export async function main(ns: NS): Promise<void> {
	const data = ns.flags([["max-power", 13]]);

	const player = new BasePlayer(ns, "player");
	const max_servers = ns.getPurchasedServerLimit();
	const max_ram = ns.getPurchasedServerMaxRam();
	const max_power = data["max-power"] as number;
	const base_cost = ns.getPurchasedServerCost(2);

	while (ns.getPurchasedServers().length < max_servers) {
		while (player.money < base_cost) {
			await ns.sleep(10);
		}
		ns.purchaseServer(`pserve-${ns.getPurchasedServers().length}`, 2);
	}

	const current_servers = ns.getPurchasedServers().map((s) => new BaseServer(ns, s));
	while (current_servers.some((s) => s.power < max_power && s.ram.max < max_ram)) {
		current_servers.sort((a, b) => a.ram.max - b.ram.max);
		const target = current_servers[0];
		const upgrade_ram = target.ram.max * 2;
		const upgrade_cost = ns.getPurchasedServerUpgradeCost(target.id, upgrade_ram);

		while (player.money < upgrade_cost) {
			await ns.sleep(10);
		}

		ns.upgradePurchasedServer(target.id, upgrade_ram);

		await ns.sleep(10);
	}

	ns.tprint("Completed purchasing servers");
}
